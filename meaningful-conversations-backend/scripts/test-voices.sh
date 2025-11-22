#!/bin/bash

# Script to test different Piper voices before deployment
# Usage: ./test-voices.sh

set -e

VOICE_DIR="./tts-voices-test"
mkdir -p "$VOICE_DIR"

# Test text
TEST_TEXT="Hallo, ich bin deine Coach-Stimme. Wie gefällt dir meine Aussprache?"

echo "🎙️  Piper Voice Testing Script"
echo "================================"
echo ""

# List of German voices to test (medium+ quality only)
VOICES=(
    "de_DE-mls-medium"                 # Current (multi-speaker, female option)
    "de_DE-thorsten-medium"            # Male, very natural
    "de_DE-thorsten_emotional-medium"  # Male, emotional/expressive
)

GENDERS=(
    "female"
    "male"
    "male"
)

NOTES=(
    "Multi-speaker model (current female voice)"
    "Clear, professional male voice"
    "Expressive male voice with emotion"
)

echo "Available voices to test (medium+ quality only):"
for i in "${!VOICES[@]}"; do
    echo "  $((i+1)). ${VOICES[$i]} (${GENDERS[$i]}) - ${NOTES[$i]}"
done
echo ""

# Check if piper is installed
if ! command -v piper &> /dev/null; then
    echo "❌ Error: piper is not installed"
    echo "Install with: pip install piper-tts"
    exit 1
fi

# Download and test each voice
for i in "${!VOICES[@]}"; do
    VOICE="${VOICES[$i]}"
    GENDER="${GENDERS[$i]}"
    NOTE="${NOTES[$i]}"
    MODEL_FILE="$VOICE_DIR/${VOICE}.onnx"
    JSON_FILE="$VOICE_DIR/${VOICE}.onnx.json"
    OUTPUT_FILE="$VOICE_DIR/${VOICE}.wav"
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Testing: $VOICE ($GENDER)"
    echo "Note: $NOTE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Download if not exists
    if [ ! -f "$MODEL_FILE" ]; then
        echo "📥 Downloading voice model..."
        curl -L "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/$VOICE.onnx" \
            -o "$MODEL_FILE" --progress-bar
        curl -L "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/$VOICE.onnx.json" \
            -o "$JSON_FILE" --progress-bar
    else
        echo "✓ Voice model already downloaded"
    fi
    
    # Synthesize
    echo "🎵 Synthesizing speech..."
    echo "$TEST_TEXT" | piper --model "$MODEL_FILE" --output-file "$OUTPUT_FILE"
    
    # Get file size
    SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo "✓ Audio generated ($SIZE)"
    
    # Play audio (macOS)
    if command -v afplay &> /dev/null; then
        echo "🔊 Playing audio... (Press Ctrl+C to skip)"
        afplay "$OUTPUT_FILE" || true
    fi
    
    echo ""
    read -p "Rate this voice (1-5, or 's' to skip to next): " RATING
    echo "Rating for $VOICE: $RATING" >> "$VOICE_DIR/ratings.txt"
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Testing complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Your ratings:"
cat "$VOICE_DIR/ratings.txt"
echo ""
echo "To deploy a voice:"
echo "1. Copy the .onnx and .onnx.json files to: meaningful-conversations-backend/tts-voices/"
echo "2. Update VOICE_MODELS in: meaningful-conversations-backend/services/ttsService.js"
echo "3. Rebuild and deploy TTS container: ./deploy-manualmode.sh -e staging -c tts"

