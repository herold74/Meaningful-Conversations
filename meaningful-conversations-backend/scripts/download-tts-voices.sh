#!/bin/bash
# Download Piper TTS Voice Models
# This script downloads the recommended voice models for the Meaningful Conversations app

set -e

# Configuration
VOICE_DIR="${1:-./tts-voices}"
PIPER_REPO="https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0"

# Create voice directory if it doesn't exist
mkdir -p "$VOICE_DIR"

echo "==================================="
echo "Piper TTS Voice Model Downloader"
echo "==================================="
echo "Target directory: $VOICE_DIR"
echo ""

# Function to download a voice model
download_voice() {
    local lang=$1
    local voice=$2
    local quality=$3
    
    local model_name="${lang}-${voice}-${quality}"
    local model_file="${model_name}.onnx"
    local config_file="${model_name}.onnx.json"
    
    echo "Downloading ${model_name}..."
    
    # Download model file
    if [ ! -f "$VOICE_DIR/$model_file" ]; then
        curl -L "${PIPER_REPO}/${lang}/${voice}/${quality}/${model_file}" \
            -o "$VOICE_DIR/$model_file"
        echo "  ✓ Model downloaded"
    else
        echo "  ℹ Model already exists, skipping"
    fi
    
    # Download config file
    if [ ! -f "$VOICE_DIR/$config_file" ]; then
        curl -L "${PIPER_REPO}/${lang}/${voice}/${quality}/${config_file}" \
            -o "$VOICE_DIR/$config_file"
        echo "  ✓ Config downloaded"
    else
        echo "  ℹ Config already exists, skipping"
    fi
    
    echo ""
}

# Download German voices
echo "Downloading German voices..."
echo "-----------------------------------"
download_voice "de_DE" "mls" "medium"        # Female voice (professional, ~74MB)
download_voice "de_DE" "thorsten" "medium"   # Male voice (balanced, ~60MB)

# Download English voices
echo "Downloading English voices..."
echo "-----------------------------------"
download_voice "en_US" "amy" "medium"        # Female voice (~60MB)
download_voice "en_US" "ryan" "medium"       # Male voice (~60MB)

echo "==================================="
echo "Download complete!"
echo "==================================="
echo ""
echo "Voice models saved to: $VOICE_DIR"
echo ""
echo "Summary:"
ls -lh "$VOICE_DIR" | grep -E '\.onnx$' | awk '{print "  " $9 " (" $5 ")"}'
echo ""
echo "To use these models, ensure the TTS container has access to this directory."
echo "Example: Mount as volume in podman-compose.yml"
echo ""

