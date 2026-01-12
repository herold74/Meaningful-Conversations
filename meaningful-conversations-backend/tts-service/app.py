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
            timeout=45  # Increased from 15s to handle longer texts (Gunicorn timeout is 60s)
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
    """Synthesize speech from text using Piper"""
    start_time = time.time()
    
    try:
        data = request.json
        text = data.get('text', '')
        model = data.get('model', 'de_DE-thorsten-medium')
        length_scale = data.get('lengthScale', 1.0)
        speaker = data.get('speaker')
        
        logger.info(f"TTS Request: model={model}, speaker={speaker}, text_length={len(text)}")
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        # Synthesize with Piper
        audio_data = synthesize_with_piper(text, model, length_scale, speaker)
        
        # Metrics
        duration_ms = int((time.time() - start_time) * 1000)
        audio_size = len(audio_data)
        
        logger.info(f"TTS Success: {duration_ms}ms, {audio_size} bytes, engine=piper")
        
        # Return audio with metrics headers
        response = Response(audio_data, mimetype='audio/wav')
        response.headers['X-TTS-Duration-Ms'] = str(duration_ms)
        response.headers['X-Audio-Size-Bytes'] = str(audio_size)
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
    """Synthesize speech using Piper (streaming not needed for Piper)"""
    start_time = time.time()
    
    try:
        data = request.json
        text = data.get('text', '')
        model = data.get('model', 'de_DE-thorsten-medium')
        length_scale = data.get('lengthScale', 1.0)
        
        logger.info(f"TTS Stream Request: model={model}, text_length={len(text)}")
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
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
