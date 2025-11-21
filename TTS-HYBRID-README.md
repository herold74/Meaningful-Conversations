# Hybrid TTS Implementation

The Meaningful Conversations app now supports **Hybrid Text-to-Speech (TTS)** with two modes:

## TTS Modes

### 1. Local TTS (Web Speech API) 🎙️
- **Uses**: System voices installed on the user's device
- **Pros**: No server load, instant playback, works offline
- **Cons**: Inconsistent across devices, quality varies
- **Privacy**: Fully local, no data sent to server

### 2. Server TTS (Piper) 🖥️
- **Uses**: Self-hosted Piper TTS with custom voice models
- **Pros**: Consistent quality, high-quality voices, works on all devices
- **Cons**: Requires server resources, small latency (~300ms)
- **Privacy**: Text sent to your server (not third-party), no storage

## User Experience

Users can:
- ✅ Choose between local and server voices
- ✅ Switch modes anytime in settings
- ✅ Automatic fallback to local if server unavailable
- ✅ Both modes support pause, resume, and repeat

## Quick Start

### For Development

1. **Download voice models**:
   ```bash
   cd meaningful-conversations-backend
   ./scripts/download-tts-voices.sh
   ```

2. **Build TTS container**:
   ```bash
   cd tts
   podman build -t meaningful-conversations-tts:latest .
   ```

3. **Start services**:
   ```bash
   podman-compose -f podman-compose-production.yml up -d
   ```

4. **Test**:
   ```bash
   curl http://localhost:8082/api/tts/health
   ```

### For Production

See [TTS-SETUP-GUIDE.md](meaningful-conversations-backend/TTS-SETUP-GUIDE.md) for detailed setup instructions.

## Technical Implementation

### Backend
- **Service**: `services/ttsService.js` - Handles Piper communication
- **Route**: `routes/tts.js` - API endpoint `/api/tts/synthesize`
- **Container**: Piper TTS in separate Podman container
- **Voice Models**: Stored in Docker volume `tts_voices_production`

### Frontend
- **Service**: `services/ttsService.ts` - Client-side TTS service
- **Component**: `ChatView.tsx` - Hybrid TTS logic
- **Modal**: `VoiceSelectionModal.tsx` - Voice selection (local voices)
- **State**: TTS mode stored in localStorage

## Voice Assignment by Bot

| Bot | German Voice | English Voice |
|-----|-------------|---------------|
| Gloria (g-interviewer) | Sophia (Female) | Amy (Female) |
| Max (max-ambitious) | Thorsten (Male) | Ryan (Male) |
| Ava (ava-strategic) | Sophia (Female) | Amy (Female) |
| Kenji (kenji-resilience) | Thorsten (Male, slow) | Ryan (Male, slow) |
| Chloe (chloe-structured-reflection) | Sophia (Female) | Amy (Female) |
| Rob (rob-pq) | Thorsten (Male, slow) | Ryan (Male, slow) |
| Nobody (nexus-goal-path-solution) | Thorsten (Male, fast) | Ryan (Male, fast) |

## API Usage

Server TTS usage is tracked:
- **Endpoint**: `tts`
- **Cost**: $0 (self-hosted)
- **Metric**: Character count of synthesized text

## GDPR Compliance

✅ **Compliant**: All processing happens on your infrastructure
- Text sent to your backend (not third-party)
- No data stored (except standard API usage metrics)
- User can choose local-only TTS

⚠️ **Privacy Policy**: Update to mention server TTS option

Example text:
> When using server-based voices, conversation text is sent to our server for speech synthesis. Text is processed in real-time and not stored.

## Fallback Behavior

1. User selects server TTS
2. If server unavailable → automatic fallback to local TTS
3. User notified via console (no disruption to UX)
4. Mode automatically switches to local

## Performance

### Server TTS (Piper)
- **Latency**: 250-550ms (generation + transfer)
- **Quality**: High, consistent across devices
- **Models**: 4 voices (~250MB total)

### Local TTS (Web Speech API)
- **Latency**: < 50ms (instant)
- **Quality**: Varies by device and OS
- **Models**: Uses system voices (no download)

## Monitoring

Check TTS health:
```bash
curl http://localhost:8082/api/tts/health
```

View usage stats in Admin dashboard → API Usage

## Troubleshooting

### Server TTS not working?
1. Check container: `podman ps | grep tts`
2. Check logs: `podman logs meaningful-conversations-tts-production`
3. Test health: `curl http://localhost:8082/api/tts/health`
4. Verify voice models: See TTS-SETUP-GUIDE.md

### Audio not playing?
1. Check browser console for errors
2. Verify CORS settings in backend
3. Test with local TTS mode first
4. Check network tab for failed requests

## File Structure

```
meaningful-conversations-backend/
├── tts/
│   └── Dockerfile                    # Piper TTS container
├── services/
│   └── ttsService.js                 # TTS business logic
├── routes/
│   └── tts.js                        # TTS API endpoints
├── scripts/
│   └── download-tts-voices.sh        # Voice model downloader
└── TTS-SETUP-GUIDE.md               # Detailed setup guide

components/
├── ChatView.tsx                      # Hybrid TTS implementation
├── VoiceSelectionModal.tsx          # Voice selection UI
└── services/
    └── ttsService.ts                 # Frontend TTS service
```

## Next Steps

- [ ] Add voice selection UI for server voices
- [ ] Implement audio caching for frequently used phrases
- [ ] Add more language support (FR, ES, IT)
- [ ] Consider MP3 encoding for reduced bandwidth
- [ ] Add admin settings for TTS configuration

## Resources

- [Piper TTS Documentation](https://github.com/rhasspy/piper)
- [Voice Samples](https://rhasspy.github.io/piper-samples/)
- [Setup Guide](meaningful-conversations-backend/TTS-SETUP-GUIDE.md)

