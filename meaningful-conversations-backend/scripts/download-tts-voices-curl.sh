#!/bin/bash
# Download Piper TTS Voice Models - Using curl
# Works on macOS without additional dependencies

set -e

VOICE_DIR="${1:-./tts-voices}"

mkdir -p "$VOICE_DIR"

echo "==================================="
echo "Piper TTS Voice Model Downloader"
echo "==================================="
echo "Target directory: $VOICE_DIR"
echo ""

# Function to download with proper redirect following
download_voice_curl() {
    local lang=$1
    local voice=$2
    local quality=$3
    
    local model_name="${lang}-${voice}-${quality}"
    local model_file="${model_name}.onnx"
    local config_file="${model_name}.onnx.json"
    
    local base_url="https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0"
    
    echo "Downloading ${model_name}..."
    
    # Download model file with redirect following (-L flag)
    if [ ! -f "$VOICE_DIR/$model_file" ] || [ $(stat -f%z "$VOICE_DIR/$model_file" 2>/dev/null || stat -c%s "$VOICE_DIR/$model_file" 2>/dev/null || echo 0) -lt 10000 ]; then
        curl -L --progress-bar -o "$VOICE_DIR/$model_file" \
            "${base_url}/${lang}/${voice}/${quality}/${model_file}" \
            || {
                echo "  ✗ Failed to download model"
                rm -f "$VOICE_DIR/$model_file"
                return 1
            }
        local size=$(du -h "$VOICE_DIR/$model_file" | cut -f1)
        echo "  ✓ Model downloaded ($size)"
    else
        local size=$(du -h "$VOICE_DIR/$model_file" | cut -f1)
        echo "  ℹ Model already exists ($size)"
    fi
    
    # Download config file
    if [ ! -f "$VOICE_DIR/$config_file" ] || [ $(stat -f%z "$VOICE_DIR/$config_file" 2>/dev/null || stat -c%s "$VOICE_DIR/$config_file" 2>/dev/null || echo 0) -lt 100 ]; then
        curl -s -L -o "$VOICE_DIR/$config_file" \
            "${base_url}/${lang}/${voice}/${quality}/${config_file}" \
            || {
                echo "  ✗ Failed to download config"
                rm -f "$VOICE_DIR/$config_file"
                return 1
            }
        echo "  ✓ Config downloaded"
    else
        echo "  ℹ Config already exists"
    fi
    
    echo ""
}

# Download German voices
echo "Downloading German voices..."
echo "-----------------------------------"
download_voice_curl "de_DE" "eva_k" "x_low"
download_voice_curl "de_DE" "thorsten" "medium"

# Download English voices
echo "Downloading English voices..."
echo "-----------------------------------"
download_voice_curl "en_US" "amy" "medium"
download_voice_curl "en_US" "ryan" "medium"

echo "==================================="
echo "Download complete!"
echo "==================================="
echo ""
echo "Voice models saved to: $VOICE_DIR"
echo ""
echo "Summary:"
ls -lh "$VOICE_DIR"/*.onnx 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}' || echo "  No models found"
echo ""
echo "Total size: $(du -sh "$VOICE_DIR" | cut -f1)"
echo ""

