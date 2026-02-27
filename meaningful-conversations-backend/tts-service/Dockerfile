FROM python:3.11-slim

WORKDIR /app

# System-Dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        wget \
        espeak-ng \
        libsndfile1 \
        ffmpeg && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Python-Dependencies
COPY tts-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Voice-Modelle (Build-Context ist parent-dir!)
RUN mkdir -p /models /models/speaker_samples
COPY tts-voices/*.onnx /models/
COPY tts-voices/*.json /models/
COPY speaker-samples/female_de.wav /models/speaker_samples/

# App
COPY tts-service/app.py .

EXPOSE 8082
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8082/health || exit 1

# Gunicorn with settings optimized for persistent in-memory Piper models:
# - 2 workers: Each holds its own model cache (~120MB per worker for 2 models).
#   With 2 CPUs, 2 workers = full CPU utilization for parallel requests.
# - 4 threads per worker: Serialize per-model synthesis via lock, but allows
#   concurrent requests for different models or warmup + synthesis overlap.
# - 60s timeout: Give Piper enough time for longer texts.
CMD ["gunicorn", "-w", "2", "--threads", "4", "-b", "0.0.0.0:8082", "--timeout", "60", "--keep-alive", "5", "--access-logfile", "-", "--error-logfile", "-", "app:app"]

