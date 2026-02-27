from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import subprocess
import os
import time
import sys
import tempfile
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

VOICE_DIR = os.getenv('PIPER_VOICE_DIR', '/models')

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    try:
        # Check Piper voices
        piper_voices = [f for f in os.listdir(VOICE_DIR) if f.endswith('.onnx')]
        
        return jsonify({
            'status': 'ok',
            'piperAvailable': True,
            'piperVoiceCount': len(piper_voices)
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 503

@app.route('/voices', methods=['GET'])
def get_voices():
    """List available Piper voices"""
    try:
        # Piper voices
        piper_voices = [f.replace('.onnx', '') for f in os.listdir(VOICE_DIR) 
                       if f.endswith('.onnx')]
        
        return jsonify({
            'piper': piper_voices
        }), 200
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
    """Synthesize speech using Piper TTS"""
    model_path = f"{VOICE_DIR}/{model}.onnx"
    if not os.path.exists(model_path):
        raise FileNotFoundError(f'Piper model not found: {model}')
    
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
        tmp_path = tmp_file.name
    
    try:
        cmd = ['piper', '--model', model_path, '--length_scale', str(length_scale)]
        if speaker is not None:
            cmd.extend(['--speaker', str(speaker)])
        cmd.extend(['--output-file', tmp_path])
        
        logger.info(f"Executing Piper: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            input=text.encode('utf-8'),
            capture_output=True,
            timeout=45
        )
        
        if result.returncode != 0:
            raise RuntimeError(f"Piper failed: {result.stderr.decode('utf-8')}")
        
        with open(tmp_path, 'rb') as f:
            return f.read()
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

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
        
        response = Response(audio_data, mimetype=mimetype)
        response.headers['X-TTS-Duration-Ms'] = str(duration_ms)
        response.headers['X-TTS-Piper-Ms'] = str(piper_ms)
        response.headers['X-TTS-Encode-Ms'] = str(encode_ms)
        response.headers['X-Audio-Size-Bytes'] = str(len(audio_data))
        response.headers['X-Audio-Format'] = output_format
        response.headers['X-TTS-Engine'] = 'piper'
        response.headers['Cache-Control'] = 'public, max-age=3600'
        
        return response
    
    except subprocess.TimeoutExpired:
        logger.error("TTS synthesis timeout")
        return jsonify({'error': 'TTS synthesis timeout'}), 504
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
