# Piper TTS Setup Guide

This guide covers the setup and configuration of the self-hosted Piper TTS (Text-to-Speech) service for the Meaningful Conversations application.

## Overview

The application now supports **hybrid TTS** with two modes:

1. **Local TTS** (Web Speech API) - Uses voices installed on the user's device
2. **Server TTS** (Piper) - Uses high-quality, consistent voices hosted on your server

Users can choose their preferred mode, with automatic fallback to local TTS if the server is unavailable.

## Architecture

```
Frontend (React)
    ↓
    ├─→ Local TTS: window.speechSynthesis (browser API)
    │
    └─→ Server TTS: /api/tts/synthesize → Piper Container
                                            ↓
                                    Voice Models (/models)
```

## Prerequisites

- Podman or Docker installed
- Access to voice model files (~200-400MB total)
- Server with at least 1GB RAM for TTS operations

## Setup Instructions

### 1. Download Voice Models

Run the provided script to download Piper voice models:

```bash
cd meaningful-conversations-backend
./scripts/download-tts-voices.sh ./tts-voices
```

This downloads 4 voice models (~270MB total):
- `de_DE-mls-medium.onnx` (German Female, ~74MB)
- `de_DE-thorsten-medium.onnx` (German Male, ~60MB)
- `en_US-amy-medium.onnx` (English Female, ~60MB)
- `en_US-ryan-medium.onnx` (English Male, ~60MB)

### 2. Build TTS Container

```bash
# From the backend directory
cd meaningful-conversations-backend/tts
podman build -t meaningful-conversations-tts:latest .
```

### 3. Copy Voice Models to Volume

The voice models need to be accessible to the TTS container:

```bash
# Create a temporary container to copy files
podman volume create tts_voices_production

# Copy voice models to the volume
podman run --rm -v ./tts-voices:/source:ro \
  -v tts_voices_production:/dest \
  alpine sh -c "cp /source/* /dest/"
```

### 4. Configure Environment

Add the following to your `.env.production` or `.env.staging` file:

```bash
# TTS Configuration
TTS_ENABLED=true
PIPER_VOICE_DIR=/models
PIPER_COMMAND=piper
TTS_DEFAULT_VOICE_DE_FEMALE=de_DE-mls-medium
TTS_DEFAULT_VOICE_DE_MALE=de_DE-thorsten-medium
TTS_DEFAULT_VOICE_EN_FEMALE=en_US-amy-medium
TTS_DEFAULT_VOICE_EN_MALE=en_US-ryan-medium
```

### 5. Start Services

```bash
# Production
podman-compose -f podman-compose-production.yml up -d

# Staging
podman-compose -f podman-compose-staging.yml up -d
```

### 6. Verify TTS Service

Check if the TTS service is running:

```bash
curl http://localhost:8082/api/tts/health
```

Expected response:
```json
{
  "status": "ok",
  "piperAvailable": true,
  "voiceCount": 4,
  "voices": [...]
}
```

## Voice Models

### Available Models

| Voice ID | Language | Gender | Quality | Size | Description |
|----------|----------|--------|---------|------|-------------|
| `de_DE-mls-medium` | German | Female | Medium | ~74MB | Clear, warm, professional |
| `de_DE-thorsten-medium` | German | Male | Medium | ~60MB | Natural, warm |
| `en_US-amy-medium` | English | Female | Medium | ~60MB | Friendly, clear |
| `en_US-ryan-medium` | English | Male | Medium | ~60MB | Warm, professional |

### Quality Levels

- **x-low**: Fastest synthesis, smallest size (~20MB), acceptable quality
- **low**: Good balance (~30MB)
- **medium**: Recommended balance of quality and speed (~60MB)
- **high**: Best quality, slower synthesis (~100MB)

### Adding More Voices

Browse available voices at: https://rhasspy.github.io/piper-samples/

To add a new voice:

1. Download the `.onnx` and `.onnx.json` files
2. Place them in the `tts-voices/` directory
3. Copy to the Docker volume (see step 3 above)
4. Update the backend voice mapping in `services/ttsService.js`

## Bot Voice Mapping

Each bot automatically gets assigned an appropriate voice:

| Bot ID | Language | Voice (DE) | Voice (EN) |
|--------|----------|----------|----------|
| g-interviewer | Both | mls (F) | amy (F) |
| ava-strategic | Both | mls (F) | amy (F) |
| chloe-cbt | Both | mls (F) | amy (F) |
| max-ambitious | Both | thorsten (M) | ryan (M) |
| rob-pq | Both | thorsten (M, slow) | ryan (M, slow) |
| kenji-stoic | Both | thorsten (M, slow) | ryan (M, slow) |
| nexus-gps | Both | thorsten (M, fast) | ryan (M, fast) |

## Performance

### Typical Latency

- **Generation**: 200-400ms for a typical chat message (1-3 sentences)
- **Network transfer**: 50-150ms (depends on audio file size)
- **Total**: 250-550ms from request to playback start

### Resource Usage

- **CPU**: Minimal during synthesis (~5-20% on modern CPUs)
- **RAM**: 200-500MB during active synthesis
- **Storage**: ~250MB for 4 voice models
- **Bandwidth**: 10-30KB per second of audio (WAV format)

### Optimization Tips

1. **Audio Caching** (optional): Implement caching for frequently used phrases
2. **Preload Common Responses**: Generate audio for standard greetings
3. **Quality Adjustment**: Use `x-low` models for faster synthesis if needed
4. **Compression**: Consider MP3 encoding for reduced bandwidth

## Troubleshooting

### TTS Service Not Available

**Symptom**: Frontend shows "TTS service temporarily unavailable"

**Solutions**:
1. Check if TTS container is running: `podman ps | grep tts`
2. Check container logs: `podman logs meaningful-conversations-tts-production`
3. Verify voice models are mounted: `podman exec meaningful-conversations-tts-production ls /models`
4. Test health endpoint: `curl http://backend:8080/api/tts/health`

### Voice Models Not Found

**Symptom**: Error: "Failed to synthesize speech: model not found"

**Solutions**:
1. Verify voice files exist in volume:
   ```bash
   podman run --rm -v tts_voices_production:/models alpine ls -lh /models
   ```
2. Check file permissions (should be readable)
3. Re-copy voice models to volume (see Setup step 3)

### Audio Playback Issues

**Symptom**: Audio doesn't play or cuts off

**Solutions**:
1. Check browser console for errors
2. Verify CORS headers are properly set in backend
3. Test direct audio download: `curl -o test.wav http://localhost:8082/api/tts/synthesize ...`
4. Check audio format compatibility (should be WAV)

### High Latency

**Symptom**: Long delay before audio starts playing

**Solutions**:
1. Use faster voice models (`x-low` quality)
2. Implement audio caching
3. Check server CPU/RAM usage
4. Consider moving TTS to a dedicated server

## API Usage Tracking

TTS usage is tracked in the API usage database:

- **Endpoint**: `tts`
- **Model**: `piper-tts`
- **Input Tokens**: Character count of synthesized text
- **Cost**: $0 (self-hosted)

View TTS usage in the Admin dashboard under "API Usage".

## GDPR Compliance

### Data Processing

When using Server TTS:
- Chat text is sent to your backend server for synthesis
- No data is stored or logged (beyond standard API usage metrics)
- Audio is generated on-demand and not cached (unless explicitly implemented)
- All processing happens within your infrastructure

### Privacy Policy

Ensure your Privacy Policy includes:

> When you enable voice output with server-based voices, the conversation text is sent to our server for speech synthesis. The text is processed in real-time and not stored. All data remains within our infrastructure and is not shared with third parties.

### User Choice

Users can always opt for local TTS (Web Speech API) which processes everything in their browser without server communication.

## Maintenance

### Updating Voice Models

1. Download new model versions
2. Copy to volume
3. Restart TTS container: `podman restart meaningful-conversations-tts-production`

### Monitoring

Monitor the following metrics:
- TTS synthesis time (should be < 500ms)
- Error rate (should be < 1%)
- Container resource usage
- API usage patterns

### Backup

Voice models should be backed up separately from the application:

```bash
podman run --rm -v tts_voices_production:/source:ro \
  -v ./tts-voices-backup:/dest \
  alpine sh -c "cp /source/* /dest/"
```

## Alternative: Using Piper Directly

If you prefer to run Piper without containers:

1. Install Piper: https://github.com/rhasspy/piper
2. Set `PIPER_COMMAND=/path/to/piper` in your `.env`
3. Set `PIPER_VOICE_DIR=/path/to/voice/models`
4. Restart backend

## Future Enhancements

Potential improvements:
- [ ] Redis-based audio caching
- [ ] MP3 encoding for reduced bandwidth
- [ ] Additional voice models (more languages, styles)
- [ ] Voice cloning for custom bot voices
- [ ] Streaming audio synthesis (chunks)
- [ ] SSML support for prosody control

## Support

For issues or questions:
1. Check container logs
2. Test health endpoint
3. Review API usage patterns
4. Verify voice model integrity

## Resources

- **Piper TTS**: https://github.com/rhasspy/piper
- **Voice Samples**: https://rhasspy.github.io/piper-samples/
- **Voice Models Repository**: https://huggingface.co/rhasspy/piper-voices
- **Piper Documentation**: https://rhasspy.github.io/piper/

