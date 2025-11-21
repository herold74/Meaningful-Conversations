FROM python:3.11-slim

WORKDIR /app

# System-Dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends wget && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Python-Dependencies
COPY tts-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Voice-Modelle (Build-Context ist parent-dir!)
RUN mkdir -p /models
COPY tts-voices/*.onnx /models/
COPY tts-voices/*.json /models/

# App
COPY tts-service/app.py .

EXPOSE 8082
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8082/health || exit 1

CMD ["python", "app.py"]

