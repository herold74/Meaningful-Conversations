# Piper TTS Dockerfile
# Builds Piper from source for text-to-speech synthesis

FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Piper TTS
RUN pip install --no-cache-dir piper-tts

# Create directory for voice models
RUN mkdir -p /models

WORKDIR /app

# Piper will be available as `piper` command
# Voice models should be mounted at /models

# Default command shows version
CMD ["piper", "--version"]
