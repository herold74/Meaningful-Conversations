from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import subprocess
import os
import io
import wave
import time
import sys
import tempfile
import logging
import threading

app = Flask(__name__)
CORS(app)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

VOICE_DIR = os.getenv('PIPER_VOICE_DIR', '/models')

# Persistent model cache: model_name -> { voice, last_used, lock }
_model_cache = {}
_cache_lock = threading.Lock()
MODEL_TTL_SECONDS = 600  # evict after 10 min of inactivity


def _get_voice(model_name):
    """Get or lazily load a PiperVoice model. Thread-safe."""
    with _cache_lock:
        entry = _model_cache.get(model_name)
        if entry:
            entry['last_used'] = time.time()
            return entry['voice']

    # Load outside the global lock (can take ~1.5s)
    model_path = f"{VOICE_DIR}/{model_name}.onnx"
    if not os.path.exists(model_path):
        raise FileNotFoundError(f'Piper model not found: {model_name}')

    from piper import PiperVoice
    t0 = time.time()
    voice = PiperVoice.load(model_path)
    load_ms = int((time.time() - t0) * 1000)
    logger.info(f"Model loaded: {model_name} in {load_ms}ms")

    with _cache_lock:
        # Another thread may have loaded it while we were loading
        if model_name not in _model_cache:
            _model_cache[model_name] = {
                'voice': voice,
                'last_used': time.time(),
                'lock': threading.Lock(),
            }
        else:
            _model_cache[model_name]['last_used'] = time.time()
        return _model_cache[model_name]['voice']


def _get_model_lock(model_name):
    """Get the per-model lock (ensures sequential Piper calls per model)."""
    with _cache_lock:
        entry = _model_cache.get(model_name)
        return entry['lock'] if entry else threading.Lock()


def _evict_stale_models():
    """Remove models not used within TTL."""
    now = time.time()
    with _cache_lock:
        stale = [k for k, v in _model_cache.items()
                 if now - v['last_used'] > MODEL_TTL_SECONDS]
        for k in stale:
            del _model_cache[k]
            logger.info(f"Model evicted (idle): {k}")


@app.route('/health', methods=['GET'])
def health():
    try:
        piper_voices = [f for f in os.listdir(VOICE_DIR) if f.endswith('.onnx')]
        cached_models = list(_model_cache.keys())
        return jsonify({
            'status': 'ok',
            'piperAvailable': True,
            'piperVoiceCount': len(piper_voices),
            'cachedModels': cached_models,
        }), 200
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 503


@app.route('/warmup', methods=['POST'])
def warmup():
    """Pre-load a Piper model into memory so subsequent synthesis is fast."""
    data = request.json or {}
    model = data.get('model', 'en_US-amy-medium')
    try:
        _get_voice(model)
        return jsonify({'status': 'ok', 'model': model, 'cached': list(_model_cache.keys())}), 200
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        logger.error(f"Warmup failed for {model}: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/voices', methods=['GET'])
def get_voices():
    try:
        piper_voices = [f.replace('.onnx', '') for f in os.listdir(VOICE_DIR)
                        if f.endswith('.onnx')]
        return jsonify({'piper': piper_voices}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


AUDIO_FORMATS = {
    'opus': {
        'args': ['-c:a', 'libopus', '-b:a', '48k', '-vbr', 'on', '-application', 'voip', '-f', 'ogg'],
        'mime': 'audio/ogg; codecs=opus',
    },
    'mp3': {
        'args': ['-c:a', 'libmp3lame', '-q:a', '6', '-f', 'mp3'],
        'mime': 'audio/mpeg',
    },
    'wav': {
        'args': [],
        'mime': 'audio/wav',
    },
}


def convert_audio(wav_data, output_format='opus'):
    """Convert WAV to compressed format using ffmpeg pipes (no disk I/O)."""
    if output_format == 'wav' or output_format not in AUDIO_FORMATS:
        return wav_data, 'audio/wav'

    config = AUDIO_FORMATS[output_format]
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-i', 'pipe:0'] + config['args'] + ['pipe:1']

    try:
        result = subprocess.run(cmd, input=wav_data, capture_output=True, timeout=30)
        if result.returncode != 0:
            logger.warning(f"ffmpeg {output_format} conversion failed, returning WAV: {result.stderr.decode()}")
            return wav_data, 'audio/wav'

        compressed = result.stdout
        ratio = len(wav_data) / max(len(compressed), 1)
        logger.info(f"Audio encoded: WAV {len(wav_data)} → {output_format.upper()} {len(compressed)} bytes ({ratio:.1f}x smaller)")
        return compressed, config['mime']
    except subprocess.TimeoutExpired:
        logger.warning("ffmpeg conversion timed out, returning WAV")
        return wav_data, 'audio/wav'


def synthesize_with_piper(text, model, length_scale, speaker=None):
    """Synthesize speech using cached PiperVoice (no subprocess)."""
    voice = _get_voice(model)
    model_lock = _get_model_lock(model)

    # PiperVoice.synthesize is not thread-safe for the same model instance,
    # so serialize calls per model. Different models can run in parallel.
    with model_lock:
        buf = io.BytesIO()
        with wave.open(buf, 'wb') as wf:
            voice.synthesize(
                text, wf,
                speaker_id=int(speaker) if speaker is not None else None,
                length_scale=length_scale,
            )
        return buf.getvalue()


@app.route('/synthesize', methods=['POST'])
def synthesize():
    """Synthesize speech from text using Piper, with optional Opus/MP3 encoding."""
    start_time = time.time()

    try:
        data = request.json
        text = data.get('text', '')
        model = data.get('model', 'de_DE-thorsten-medium')
        length_scale = data.get('lengthScale', 1.0)
        speaker = data.get('speaker')
        output_format = data.get('format', 'opus')

        logger.info(f"TTS Request: model={model}, speaker={speaker}, format={output_format}, text_length={len(text)}")

        if not text:
            return jsonify({'error': 'Text is required'}), 400

        wav_data = synthesize_with_piper(text, model, length_scale, speaker)

        piper_ms = int((time.time() - start_time) * 1000)
        audio_data, mimetype = convert_audio(wav_data, output_format)

        duration_ms = int((time.time() - start_time) * 1000)
        encode_ms = duration_ms - piper_ms

        logger.info(f"TTS Success: piper={piper_ms}ms, encode={encode_ms}ms, total={duration_ms}ms, {len(audio_data)} bytes ({output_format})")

        # Periodically check for stale models
        _evict_stale_models()

        response = Response(audio_data, mimetype=mimetype)
        response.headers['X-TTS-Duration-Ms'] = str(duration_ms)
        response.headers['X-TTS-Piper-Ms'] = str(piper_ms)
        response.headers['X-TTS-Encode-Ms'] = str(encode_ms)
        response.headers['X-Audio-Size-Bytes'] = str(len(audio_data))
        response.headers['X-Audio-Format'] = output_format
        response.headers['X-TTS-Engine'] = 'piper'
        response.headers['Cache-Control'] = 'public, max-age=3600'

        return response

    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        logger.error(f"TTS synthesis error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/synthesize-stream', methods=['POST'])
def synthesize_stream():
    """Synthesize speech using Piper (delegates to /synthesize)"""
    return synthesize()


if __name__ == '__main__':
    port = int(os.getenv('PORT', 8082))
    logger.info(f"Starting TTS service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
