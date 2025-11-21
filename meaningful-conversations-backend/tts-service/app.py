from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import subprocess
import os
import time

app = Flask(__name__)
CORS(app)  # Erlaubt alle Origins (nur intern erreichbar)

VOICE_DIR = os.getenv('PIPER_VOICE_DIR', '/models')

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    try:
        # Check if voice models exist
        voices = [f for f in os.listdir(VOICE_DIR) if f.endswith('.onnx')]
        return jsonify({
            'status': 'ok',
            'piperAvailable': True,
            'voiceCount': len(voices),
            'voices': voices
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 503

@app.route('/voices', methods=['GET'])
def get_voices():
    """List available voices"""
    try:
        voices = [f.replace('.onnx', '') for f in os.listdir(VOICE_DIR) 
                  if f.endswith('.onnx')]
        return jsonify({'voices': voices}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/synthesize', methods=['POST'])
def synthesize():
    """Synthesize speech from text"""
    start_time = time.time()
    
    try:
        data = request.json
        text = data.get('text', '')
        model = data.get('model', 'de_DE-thorsten-medium')
        length_scale = data.get('lengthScale', 1.0)
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        # Build Piper command
        model_path = f"{VOICE_DIR}/{model}.onnx"
        if not os.path.exists(model_path):
            return jsonify({'error': f'Voice model not found: {model}'}), 404
        
        # Use temp file to avoid stdout seek issues
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
            tmp_path = tmp_file.name
        
        try:
            # Run Piper to temp file
            cmd = f'echo "{text}" | piper --model {model_path} --length_scale {length_scale} --output-file {tmp_path}'
            
            result = subprocess.run(
                cmd,
                shell=True,
                input=text.encode('utf-8'),
                capture_output=True,
                timeout=10
            )
            
            if result.returncode != 0:
                return jsonify({
                    'error': 'Piper synthesis failed',
                    'stderr': result.stderr.decode('utf-8')
                }), 500
            
            # Read audio from temp file
            with open(tmp_path, 'rb') as f:
                audio_data = f.read()
        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
        
        if result.returncode != 0:
            return jsonify({
                'error': 'Piper synthesis failed',
                'stderr': result.stderr.decode('utf-8')
            }), 500
        
        # Metrics
        duration_ms = int((time.time() - start_time) * 1000)
        audio_size = len(audio_data)
        
        # Return audio with metrics headers
        response = Response(audio_data, mimetype='audio/wav')
        response.headers['X-TTS-Duration-Ms'] = str(duration_ms)
        response.headers['X-Audio-Size-Bytes'] = str(audio_size)
        response.headers['Cache-Control'] = 'public, max-age=3600'
        
        return response
        
    except subprocess.TimeoutExpired:
        return jsonify({'error': 'TTS synthesis timeout'}), 504
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8082))
    app.run(host='0.0.0.0', port=port, debug=False)

