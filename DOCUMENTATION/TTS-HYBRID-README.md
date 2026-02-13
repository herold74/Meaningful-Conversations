# Hybrid TTS Implementation (v1.6.0)

> **⚠️ NOTE**: For the most current TTS implementation details, see [TTS-FINAL-STATUS.md](./TTS-FINAL-STATUS.md). This document provides architectural background but may not reflect the latest changes.

The Meaningful Conversations app features a **Hybrid Text-to-Speech (TTS)** system with intelligent voice selection and fallback mechanisms.

## 🎙️ TTS Modes

### 1. Auto Mode (Signaturstimme) ⭐ RECOMMENDED
- **Selection**: Automatically chooses the best available voice for each bot
- **Priority**: High-quality server voices (when available)
- **Fallback**: Local device voices (when server unavailable)
- **Benefits**: 
  - ✅ Always works (intelligent fallback)
  - ✅ Best quality when online
  - ✅ No manual selection needed
- **Default**: Activated on first app use

### 2. Server Voices (High Quality) 🖥️
- **Uses**: Self-hosted Piper TTS with premium voice models
- **Pros**: 
  - ✅ Consistent quality across all devices
  - ✅ Natural-sounding voices
  - ✅ Gender-matched to bot personality
  - ✅ Phonetic corrections for better pronunciation
- **Cons**: 
  - ⚠️ Requires internet connection
  - ⚠️ Small latency (~1-3s for synthesis)
- **Privacy**: Text sent to your server (not third-party), no storage
- **Available Voices**:
  - 🇩🇪 **Sophia** (de_DE-mls-medium) - Female, natural
  - 🇩🇪 **Thorsten** (de_DE-thorsten-medium) - Male, clear
  - 🇺🇸 **Amy** (en_US-amy-medium) - Female, friendly
  - 🇺🇸 **Ryan** (en_US-ryan-medium) - Male, professional

### 3. Device Voices (Local) 📱
- **Uses**: System voices installed on user's device
- **Pros**: 
  - ✅ No server load
  - ✅ Instant playback
  - ✅ Works offline
  - ✅ Fully local, maximum privacy
- **Cons**: 
  - ⚠️ Inconsistent across devices
  - ⚠️ Quality varies by OS
- **Availability**: Varies by device (iOS, Android, macOS, Windows)

## 🎯 User Experience

### Voice Selection
Users can choose from three options in Settings:
1. **Signaturstimme (Auto)** - Recommended, intelligent selection
2. **Server-Stimmen** - Manual selection of 4 high-quality voices
3. **Geräte-Stimmen** - Manual selection from device voices

### Features
- ✅ **Automatic Fallback**: Server unavailable → switches to local voices
- ✅ **Persistent Selection**: Saved preference survives app restarts
- ✅ **Per-Bot Preferences**: Each bot remembers its own voice settings (v1.6.1+)
- ✅ **Smart Reset**: Returns to Auto if saved voice unavailable
- ✅ **Voice Preview**: Test voices before selection
- ✅ **Visual Feedback**: Server voices greyed out when unavailable
- ✅ **Playback Controls**: Pause, resume, repeat for all modes

### Per-Bot Voice Preferences (v1.6.1+)

Each bot now maintains its own voice settings independently:
- **Ava** can use Server Voice (en-amy)
- **Max** can use Local Voice (Daniel)
- **Kenji** can be in Auto mode
- Settings persist per bot across sessions
- No interference between different bots' preferences

**Use Case Example**:
```
Gloria (Interview)    → Auto mode (Server: Sophia when available)
Max (Ambitious)       → Local: Daniel (works offline)
Ava (Strategic)       → Server: Amy (consistent quality)
Kenji (Stoic)         → Auto mode (Server: Thorsten when available)
```

## 🏗️ Architecture

### Container Structure (v1.6.0+)

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (PWA)                      │
│  • VoiceSelectionModal.tsx - Voice selection UI        │
│  • ChatView.tsx - Playback & controls                  │
│  • ttsService.ts - Client-side TTS coordination        │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│                    Backend (Node.js)                     │
│  • routes/tts.js - /api/tts/synthesize, /health        │
│  • services/ttsService.js - Business logic              │
│  • Phonetic mapping for German pronunciation           │
└──────────────┬──────────────────────────────────────────┘
               │ HTTP Request
               ▼
┌─────────────────────────────────────────────────────────┐
│              TTS Container (Python/Flask)                │
│  • Port: 8082 (internal)                                │
│  • Piper TTS engine                                     │
│  • Voice models: /models (~200MB)                       │
│  • Health check: /health                                │
└─────────────────────────────────────────────────────────┘
```

### Deployment Architecture

**Staging**: https://mc-beta.manualmode.at
- ✅ Frontend Container (Port 8080)
- ✅ Backend Container (Port 8080)
- ✅ TTS Container (Port 8082)
- ✅ MariaDB Container (Port 3306)
- ✅ Nginx Reverse Proxy

**Production**: https://mc-app.manualmode.at
- ❌ Currently v1.5.8 (no TTS container)
- 🎯 Planned: Upgrade to v1.6.0

## 🎭 Bot-Voice Mapping

Auto mode selects voices based on bot personality and language:

| Bot | Gender | DE Voice | EN Voice |
|-----|--------|----------|----------|
| **Gloria** (g-interviewer) | Female | Sophia | Amy |
| **Max** (max-ambitious) | Male | Thorsten | Ryan |
| **Ava** (ava-strategic) | Female | Sophia | Amy |
| **Kenji** (kenji-stoic) | Male | Thorsten | Ryan |
| **Chloe** (chloe-cbt) | Female | Sophia | Amy |
| **Rob** (rob) | Male | Thorsten | Ryan |
| **Nobody** (nexus-gps) | Male | Thorsten | Ryan |

### Speech Rate Adjustments
- **Standard** (Gloria, Ava, Chloe): 1.0x
- **Energetic** (Max, Rob): 1.05x (5% faster)
- **Rapid** (Nexus): 1.1x (10% faster)
- **Meditation** (Rob, Kenji): 0.9x (10% slower)
- **Global Server Slowdown**: All server voices +5% slower for naturalness

## 🔧 Technical Implementation

### Backend Components

**TTS Service** (`meaningful-conversations-backend/services/ttsService.js`):
```javascript
// Key features:
- getVoiceForBot(botId, lang) // Auto voice selection
- getSpeechRate(botId, isMeditation) // Dynamic speed
- cleanTextForSpeech(text) // Phonetic corrections
- synthesizeSpeech(text, botId, lang, isMeditation, voiceId)
```

**Phonetic Mapping** (German):
```javascript
{
  'Coach': 'Koutsch',
  'Session': 'Seschän',
  'Interview': 'Interwju',
  'Feedback': 'Fiedbäck',
  'Team': 'Tiem',
  'Goal': 'Goul',
  'Blog': 'Blogg',
  'Meeting': 'Mieting'
}
```

**API Endpoints**:
- `POST /api/tts/synthesize` - Generate audio from text
  - Body: `{ text, botId, lang, isMeditation?, voiceId? }`
  - Returns: WAV audio stream
  - Headers: `X-TTS-Duration-Ms`, `X-Audio-Size-Bytes`
  
- `GET /api/tts/health` - Check TTS availability
  - Returns: `{ status, piperAvailable, voiceCount, voices }`

### Frontend Components

**TTS Service** (`services/ttsService.ts`):
```typescript
// Available voices
export const SERVER_VOICES: ServerVoice[] = [
  { id: 'de-mls', name: 'Sophia (Deutsch, Weiblich)', ... },
  { id: 'de-thorsten', name: 'Thorsten (Deutsch, Männlich)', ... },
  { id: 'en-amy', name: 'Amy (English, Female)', ... },
  { id: 'en-ryan', name: 'Ryan (English, Male)', ... }
];

// Bot-specific settings (v1.6.1+)
export interface BotVoiceSettings {
  mode: TtsMode;           // 'local' | 'server'
  voiceId: string | null;  // Voice URI or ID
  isAuto: boolean;         // Auto mode enabled
}

// Primary functions (v1.6.1+)
- getBotVoiceSettings(botId): BotVoiceSettings
- saveBotVoiceSettings(botId, settings): void

// Core functions
- synthesizeSpeech(text, botId, lang, isMeditation, voiceId)
- checkTtsHealth()

// Legacy functions (deprecated, kept for compatibility)
- getTtsPreferences() / saveTtsPreferences(mode, voiceURI)
```

**ChatView Integration** (`components/ChatView.tsx`):
- Auto voice selection on mount
- Fallback logic when server unavailable
- Audio playback with `<audio>` element
- Loading states and error handling

**Voice Modal** (`components/VoiceSelectionModal.tsx`):
- Three-way selection: Auto / Server / Device
- Voice preview functionality
- Availability checking
- Visual feedback for unavailable voices

### TTS Container

**Flask Application** (`meaningful-conversations-backend/tts-service/app.py`):
```python
# Endpoints
@app.route('/health')      # Health check
@app.route('/voices')      # List available voices
@app.route('/synthesize')  # Generate audio

# Features
- Temp file handling for Piper output
- Error handling and logging
- Performance metrics in response headers
- CORS enabled for all origins
```

**Voice Models** (Total: ~200MB):
- `de_DE-mls-medium.onnx` (73 MB) + `.json`
- `de_DE-thorsten-medium.onnx` (60 MB) + `.json`
- `en_US-amy-medium.onnx` (60 MB) + `.json`
- `en_US-ryan-medium.onnx` (60 MB) + `.json`

## 💾 Voice Settings Storage

### localStorage Structure

**Legacy Format (v1.6.0 and earlier)**:
```javascript
localStorage: {
  "ttsMode": "server",                    // Global mode
  "ttsAutoMode": "true",                  // Global auto flag
  "selectedServerVoice": "en-amy",        // Global server voice
  "selectedLocalVoiceURI": "com.apple.Samantha",  // Global local voice
  "coachVoicePreferences": {              // Per-bot voice IDs
    "ava-strategic": "en-amy",
    "max-ambitious": "com.apple.Daniel"
  }
}
```

**New Format (v1.6.1+)**:
```javascript
localStorage: {
  "botVoiceSettings": {
    "ava-strategic": {
      "mode": "server",                   // Server or local
      "voiceId": "en-amy",                // Specific voice
      "isAuto": false                     // Manual selection
    },
    "max-ambitious": {
      "mode": "local",
      "voiceId": "com.apple.Daniel",
      "isAuto": false
    },
    "kenji-stoic": {
      "mode": "local",
      "voiceId": null,                    // Auto-selected
      "isAuto": true                      // Auto mode
    }
  }
}
```

### Migration Strategy (v1.6.1+)

**Automatic Migration**: When a user loads a bot for the first time after upgrading to v1.6.1:

1. **Check for new format**: Look for `botVoiceSettings[botId]`
2. **If not found, migrate from legacy**:
   - Priority 1: Bot-specific preference from `coachVoicePreferences[botId]`
   - Priority 2: Global settings (`ttsMode`, `selectedServerVoice`, etc.)
   - Priority 3: Default to Auto mode
3. **Save to new format**: Store migrated settings in `botVoiceSettings`
4. **Legacy keys preserved**: Old keys remain for backwards compatibility

**Migration Logic** (`services/ttsService.ts`):
```typescript
const migrateLegacySettings = (botId: string): BotVoiceSettings | null => {
  // Read legacy settings
  const legacyPrefs = JSON.parse(localStorage.getItem('coachVoicePreferences'));
  const legacyMode = localStorage.getItem('ttsMode');
  const legacyAutoMode = localStorage.getItem('ttsAutoMode');
  
  // If bot had specific preference
  if (legacyPrefs?.[botId]) {
    return {
      mode: legacyMode || 'local',
      voiceId: legacyPrefs[botId],
      isAuto: legacyAutoMode === null ? true : legacyAutoMode === 'true'
    };
  }
  
  // If global settings exist
  if (legacyMode || legacyServerVoice || legacyLocalVoice) {
    return {
      mode: legacyMode || 'local',
      voiceId: /* appropriate voice */,
      isAuto: legacyAutoMode === null ? true : legacyAutoMode === 'true'
    };
  }
  
  // Default
  return null; // Will use { mode: 'local', voiceId: null, isAuto: true }
};
```

**No User Action Required**: Migration happens transparently on first bot load.

## 📊 Performance & Monitoring

### Metrics

**TTS Container**:
- Synthesis Time: ~1-3s (depends on text length)
- Audio Size: ~50-200KB per response
- Memory Usage: ~100-200MB
- Startup Time: ~5-10s

**Backend**:
- Image Size: ~350MB (reduced from ~550MB)
- Build Time: ~2-3 min (reduced from ~4-5 min)
- Deploy Time: ~4-5 min total

### Monitoring

**Health Check**:
```bash
# Staging
curl https://mc-beta.manualmode.at/api/tts/health | jq

# Expected output:
# {
#   "status": "ok",
#   "piperAvailable": true,
#   "voiceCount": 4,
#   "voices": ["de_DE-mls-medium", ...]
# }
```

**Container Status**:
```bash
ssh root@<YOUR_SERVER_IP> 'podman ps | grep tts'

# Expected: meaningful-conversations-tts-staging (healthy)
```

**Logs**:
```bash
ssh root@<YOUR_SERVER_IP> 'cd /opt/manualmode-staging && \
  podman-compose logs -f tts'
```

### API Usage Tracking

Server TTS usage is tracked in the Admin Dashboard:
- **Endpoint**: `tts`
- **Metric**: Character count
- **Cost**: $0 (self-hosted)
- **Dashboard**: Admin → API Usage

## 🔒 Privacy & GDPR Compliance

### Data Processing
✅ **Compliant**: All processing on your infrastructure
- Text sent to your backend (not third-party services)
- No permanent storage of conversation text
- Standard API usage metrics only (character count, timestamps)
- User can choose local-only TTS (device voices)

### Privacy Policy
Updated privacy policy mentions:
> **Voice Output**: You can choose between device-based voices (processed locally on your device) and server-based voices (text is sent to our server for speech synthesis). When using server voices, text is processed in real-time and not permanently stored.

## 🚀 Deployment Guide

### Quick Start (Local Development)

See [TTS-LOCAL-DEVELOPMENT.md](TTS-LOCAL-DEVELOPMENT.md) for detailed local setup.

### Production Deployment

See [TTS-SETUP-GUIDE.md](../meaningful-conversations-backend/TTS-SETUP-GUIDE.md) for server deployment.

**Deployment Script**:
```bash
# Deploy to Staging
./deploy-manualmode.sh -e staging

# Deploy to Production
./deploy-manualmode.sh -e production

# Deploy only TTS container
./deploy-manualmode.sh -e staging -c tts
```

### Makefile Targets
```bash
# Staging
make deploy-manualmode-staging          # Full deployment
make deploy-manualmode-staging-tts      # TTS only

# Production
make deploy-manualmode-production       # Full deployment
make deploy-manualmode-production-tts   # TTS only
```

## 🔧 Troubleshooting

### Server Voices Not Available

**Symptoms**: Voice modal shows "Server-Stimmen (Nicht verfügbar)"

**Diagnosis**:
```bash
# 1. Check TTS container
ssh root@<YOUR_SERVER_IP> 'podman ps | grep tts'

# 2. Check health endpoint
curl https://mc-beta.manualmode.at/api/tts/health

# 3. Check container logs
ssh root@<YOUR_SERVER_IP> 'cd /opt/manualmode-staging && \
  podman-compose logs tts'
```

**Solutions**:
1. Restart TTS container: `podman-compose restart tts`
2. Check Nginx IP mapping: `./update-nginx-ips.sh staging`
3. Verify voice models exist in container

### Audio Not Playing

**Symptoms**: Synthesize succeeds but no audio

**Diagnosis**:
- Browser console for errors
- Network tab: Check status code (200 = OK, 500 = Error)
- Check audio element in DevTools

**Solutions**:
1. Try different voice (Auto mode)
2. Clear browser cache
3. Check CORS headers in Network tab
4. Switch to local voices temporarily

### Synthesis Timeouts

**Symptoms**: Long wait, then error

**Diagnosis**:
```bash
# Check TTS container resources
ssh root@<YOUR_SERVER_IP> 'podman stats --no-stream | grep tts'
```

**Solutions**:
1. Increase timeout in `ttsService.js` (currently 15s)
2. Allocate more memory to TTS container
3. Split very long texts

## 📂 File Structure

```
meaningful-conversations-backend/
├── tts-service/
│   ├── Dockerfile                    # TTS container definition
│   ├── app.py                        # Flask TTS service
│   └── requirements.txt              # Python dependencies
├── tts-voices/                       # Voice models (200MB)
│   ├── de_DE-mls-medium.onnx
│   ├── de_DE-mls-medium.onnx.json
│   ├── de_DE-thorsten-medium.onnx
│   ├── de_DE-thorsten-medium.onnx.json
│   ├── en_US-amy-medium.onnx
│   ├── en_US-amy-medium.onnx.json
│   ├── en_US-ryan-medium.onnx
│   └── en_US-ryan-medium.onnx.json
├── services/
│   └── ttsService.js                 # Backend TTS business logic
├── routes/
│   └── tts.js                        # TTS API endpoints
└── scripts/
    └── download-tts-voices-*.sh      # Voice download scripts

components/
├── ChatView.tsx                      # TTS playback & controls
├── VoiceSelectionModal.tsx          # Voice selection UI
└── services/
    └── ttsService.ts                 # Frontend TTS service

podman-compose-staging.yml            # Staging deployment
podman-compose-production.yml         # Production deployment
```

## 🎯 Roadmap

### v1.6.1 (Current Production)
- [x] Separate TTS container
- [x] Auto voice selection
- [x] Phonetic corrections
- [x] Server voice UI
- [x] Bot-specific voice preferences
- [x] Automatic legacy settings migration
- [x] Extended staging testing

### v1.7.0 (Future)
- [ ] Audio caching (reduce server load)
- [ ] Additional voices (more variety)
- [ ] Streaming synthesis (for long texts)
- [ ] MP3 encoding (reduce bandwidth)
- [ ] Voice customization per user

### v2.0.0 (Vision)
- [ ] Custom voice training
- [ ] Emotional prosody
- [ ] Multi-language support (FR, ES, IT)
- [ ] Real-time voice cloning

## 📚 Resources

- [Piper TTS Documentation](https://github.com/rhasspy/piper)
- [Voice Samples](https://rhasspy.github.io/piper-samples/)
- [Hugging Face Models](https://huggingface.co/rhasspy/piper-voices)
- [Setup Guide](../meaningful-conversations-backend/TTS-SETUP-GUIDE.md)
- [Local Development Guide](TTS-LOCAL-DEVELOPMENT.md)
- [Status Document](TTS-FINAL-STATUS.md)

---

**Version**: 1.6.1
**Last Updated**: 23. November 2025
**Status**: ✅ Production-ready
