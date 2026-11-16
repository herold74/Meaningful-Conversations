---
name: mc-tts-voice
description: Guides TTS/STT troubleshooting, Piper deploy scope, voice mapping, and iOS local-TTS rules. Use for voice mode issues, TTS HTTP 500, STT fragments, or TTS container deploys.
---

# TTS & Voice Skill

## Docs

- [`DOCUMENTATION/TTS-FINAL-STATUS.md`](../../../DOCUMENTATION/TTS-FINAL-STATUS.md) — architecture (current)
- [`DOCUMENTATION/TTS-LOCAL-DEVELOPMENT.md`](../../../DOCUMENTATION/TTS-LOCAL-DEVELOPMENT.md) — local Piper setup
- [`DOCUMENTATION/WAKE-LOCK-VOICE-MODE.md`](../../../DOCUMENTATION/WAKE-LOCK-VOICE-MODE.md) — wake lock

## Deploy scope

| Change | Deploy flag |
|--------|-------------|
| Frontend/backend TTS client only | `-c app` (default) |
| `tts-service/app.py`, Piper models, voice ONNX | `-c all` |

## Key files

| Layer | Path |
|-------|------|
| Frontend TTS hook | `hooks/useTts.ts` |
| STT processing | `utils/webSpeechResultProcessing.ts` |
| Backend proxy | `meaningful-conversations-backend/services/ttsService.js` |
| Piper service | `meaningful-conversations-backend/tts-service/app.py` |
| Voice map | `services/ttsService.ts`, backend `ttsService.js` |

## German female voice (v2.5.5+)

Use **`de_DE-eva_k-x_low`** — not `de_DE-mls-medium` (multi-speaker, broken without speaker_id).

## Common issues

| Symptom | Check |
|---------|-------|
| TTS HTTP 500 | Piper ONNX edge case → `sanitize_text_for_piper`, chunk fallback in `app.py` |
| STT one-word fragments (desktop) | `webSpeechResultProcessing.ts` incremental results |
| iOS no server TTS | Forced local Web Speech API (autoplay policy) |
| Voice wrong gender | `FEMALE_BOT_IDS` / backend `femaleBots` vs avatar |

## iOS

- `npm run build && npx cap sync ios` after frontend TTS changes
- Test voice mode on device, not only browser
