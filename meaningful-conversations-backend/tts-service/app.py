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

# Coqui TTS initialization
xtts_model = None
SPEAKER_SAMPLES = {
    'female_de': '/models/speaker_samples/female_de.wav'
}

COQUI_MODELS = {
    'de_DE-eva-coqui': {
        'engine': 'xtts',
        'model_name': 'tts_models/multilingual/multi-dataset/xtts_v2',
        'speaker_wav': SPEAKER_SAMPLES['female_de'],
        'language': 'de',
        'gender': 'female',
        'quality': 'high'
    }
    # Note: de_DE-thorsten-medium, de_DE-mls-medium, etc. are Piper models
    # They should NOT be listed here to avoid XTTS initialization
}

def get_xtts_model():
    """Lazy load XTTS model"""
    global xtts_model
    if xtts_model is None:
        try:
            # Accept Coqui non-commercial license automatically
            os.environ['COQUI_TOS_AGREED'] = '1'
            
            from TTS.api import TTS
            logger.info("Initializing XTTS v2 model...")
            start_time = time.time()
            xtts_model = TTS('tts_models/multilingual/multi-dataset/xtts_v2', gpu=False)
            logger.info(f"XTTS v2 initialized successfully in {time.time() - start_time:.2f}s")
        except Exception as e:
            logger.error(f"Failed to initialize XTTS: {e}")
    return xtts_model

# Pre-load XTTS model at startup
logger.info("Pre-loading XTTS model at startup...")
get_xtts_model()

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    try:
        # Check Piper voices
        piper_voices = [f for f in os.listdir(VOICE_DIR) if f.endswith('.onnx')]
        
        # Check Coqui availability
        coqui_available = False
        try:
            from TTS.api import TTS
            coqui_available = True
        except:
            pass
        
        return jsonify({
            'status': 'ok',
            'piperAvailable': True,
            'piperVoiceCount': len(piper_voices),
            'coquiAvailable': coqui_available,
            'coquiModels': list(COQUI_MODELS.keys()) if coqui_available else []
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 503

@app.route('/voices', methods=['GET'])
def get_voices():
    """List available voices from both Piper and Coqui"""
    try:
        # Piper voices
        piper_voices = [f.replace('.onnx', '') for f in os.listdir(VOICE_DIR) 
                       if f.endswith('.onnx')]
        
        # Coqui voices
        coqui_voices = []
        try:
            from TTS.api import TTS
            coqui_voices = list(COQUI_MODELS.keys())
        except:
            pass
        
        return jsonify({
            'piper': piper_voices,
            'coqui': coqui_voices
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
            timeout=15
        )
        
        if result.returncode != 0:
            raise RuntimeError(f"Piper failed: {result.stderr.decode('utf-8')}")
        
        with open(tmp_path, 'rb') as f:
            return f.read()
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

def synthesize_with_coqui(text, model_name, length_scale=1.0):
    """Synthesize speech using Coqui XTTS"""
    if model_name not in COQUI_MODELS:
        raise ValueError(f'Unknown Coqui model: {model_name}')
    
    model_config = COQUI_MODELS[model_name]
    
    # Check if this is an XTTS model (voice cloning)
    if model_config.get('engine') == 'xtts':
        tts = get_xtts_model()
        if tts is None:
            raise RuntimeError('XTTS model not available')
        
        speaker_wav = model_config.get('speaker_wav')
        if not speaker_wav or not os.path.exists(speaker_wav):
            raise FileNotFoundError(f'Speaker sample not found: {speaker_wav}')
        
        language = model_config.get('language', 'de')
        
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
            tmp_path = tmp_file.name
        
        try:
            # Adjust speed based on length_scale (inverse relationship)
            speed = 1.0 / length_scale if length_scale > 0 else 1.0
            
            logger.info(f"Generating XTTS speech (lang: {language}, speaker: {speaker_wav}, speed: {speed})")
            tts.tts_to_file(
                text=text,
                file_path=tmp_path,
                speaker_wav=speaker_wav,
                language=language,
                speed=speed
            )
            
            with open(tmp_path, 'rb') as f:
                return f.read()
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
    else:
        # Fallback to regular TTS models (not used currently)
        raise NotImplementedError('Only XTTS engine is currently supported for Coqui models')

def synthesize_with_coqui_streaming(text, model_name, length_scale=1.0):
    """Synthesize speech using Coqui XTTS with streaming (sentence by sentence)"""
    if model_name not in COQUI_MODELS:
        raise ValueError(f'Unknown Coqui model: {model_name}')
    
    model_config = COQUI_MODELS[model_name]
    
    # Check if this is an XTTS model (voice cloning)
    if model_config.get('engine') == 'xtts':
        tts = get_xtts_model()
        if tts is None:
            raise RuntimeError('XTTS model not available')
        
        speaker_wav = model_config.get('speaker_wav')
        if not speaker_wav or not os.path.exists(speaker_wav):
            raise FileNotFoundError(f'Speaker sample not found: {speaker_wav}')
        
        language = model_config.get('language', 'de')
        speed = 1.0 / length_scale if length_scale > 0 else 1.0
        
        # Split text into sentences for streaming
        import re
        sentences = re.split(r'([.!?]+\s*)', text)
        sentences = [''.join(sentences[i:i+2]).strip() for i in range(0, len(sentences), 2) if sentences[i].strip()]
        
        if not sentences:
            sentences = [text]
        
        logger.info(f"XTTS Streaming: {len(sentences)} sentence(s)")
        
        # Generate audio for each sentence and yield as chunks
        for i, sentence in enumerate(sentences):
            if not sentence.strip():
                continue
                
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
                tmp_path = tmp_file.name
            
            try:
                logger.info(f"XTTS Streaming [{i+1}/{len(sentences)}]: {sentence[:50]}...")
                tts.tts_to_file(
                    text=sentence,
                    file_path=tmp_path,
                    speaker_wav=speaker_wav,
                    language=language,
                    speed=speed
                )
                
                with open(tmp_path, 'rb') as f:
                    audio_chunk = f.read()
                    # For streaming, we need to yield WAV data without headers (except first chunk)
                    if i == 0:
                        yield audio_chunk  # First chunk includes WAV header
                    else:
                        # Skip WAV header (44 bytes) for subsequent chunks
                        yield audio_chunk[44:] if len(audio_chunk) > 44 else audio_chunk
            finally:
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
    else:
        raise NotImplementedError('Only XTTS engine is currently supported for Coqui models')

@app.route('/synthesize', methods=['POST'])
def synthesize():
    """Synthesize speech from text using Piper or Coqui"""
    start_time = time.time()
    
    try:
        data = request.json
        text = data.get('text', '')
        model = data.get('model', 'de_DE-thorsten-medium')
        length_scale = data.get('lengthScale', 1.0)
        speaker = data.get('speaker')
        engine = data.get('engine', 'piper')  # 'piper' or 'coqui'
        
        logger.info(f"TTS Request: engine={engine}, model={model}, speaker={speaker}, text_length={len(text)}")
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        # Auto-detect engine based on model name
        if model in COQUI_MODELS:
            engine = 'coqui'
        elif model.endswith('-coqui'):
            engine = 'coqui'
        
        # Synthesize based on engine
        if engine == 'coqui':
            audio_data = synthesize_with_coqui(text, model, length_scale)
        else:
            audio_data = synthesize_with_piper(text, model, length_scale, speaker)
        
        # Metrics
        duration_ms = int((time.time() - start_time) * 1000)
        audio_size = len(audio_data)
        
        logger.info(f"TTS Success: {duration_ms}ms, {audio_size} bytes, engine={engine}")
        
        # Return audio with metrics headers
        response = Response(audio_data, mimetype='audio/wav')
        response.headers['X-TTS-Duration-Ms'] = str(duration_ms)
        response.headers['X-Audio-Size-Bytes'] = str(audio_size)
        response.headers['X-TTS-Engine'] = engine
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
    """Synthesize speech with streaming (sentence by sentence) for XTTS"""
    start_time = time.time()
    
    try:
        data = request.json
        text = data.get('text', '')
        model = data.get('model', 'de_DE-thorsten-medium')
        length_scale = data.get('lengthScale', 1.0)
        
        logger.info(f"TTS Stream Request: model={model}, text_length={len(text)}")
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        # Auto-detect engine based on model name
        if model in COQUI_MODELS or model.endswith('-coqui'):
            # Stream XTTS synthesis
            def generate():
                try:
                    for chunk in synthesize_with_coqui_streaming(text, model, length_scale):
                        yield chunk
                    duration_ms = int((time.time() - start_time) * 1000)
                    logger.info(f"TTS Stream Success: {duration_ms}ms total, engine=coqui")
                except Exception as e:
                    logger.error(f"TTS streaming error: {e}", exc_info=True)
            
            return Response(generate(), mimetype='audio/wav', headers={
                'X-TTS-Engine': 'coqui',
                'Cache-Control': 'no-cache',
                'X-Content-Type-Options': 'nosniff'
            })
        else:
            # Piper doesn't need streaming, just return normal synthesis
            audio_data = synthesize_with_piper(text, model, length_scale, None)
            duration_ms = int((time.time() - start_time) * 1000)
            logger.info(f"TTS Success: {duration_ms}ms, {len(audio_data)} bytes, engine=piper")
            
            return Response(audio_data, mimetype='audio/wav', headers={
                'X-TTS-Duration-Ms': str(duration_ms),
                'X-Audio-Size-Bytes': str(len(audio_data)),
                'X-TTS-Engine': 'piper',
                'Cache-Control': 'public, max-age=3600'
            })
    
    except Exception as e:
        logger.error(f"TTS stream synthesis error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8082))
    logger.info(f"Starting TTS service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
