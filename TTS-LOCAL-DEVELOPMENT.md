# TTS Local Development Guide

## Problem: "Failed to preview server voice" in Local Development

Wenn Sie in der lokalen Entwicklungsumgebung den Fehler `"Failed to preview server voice: Error: Unknown error"` erhalten, liegt das daran, dass Server-TTS (Piper) eine laufende Backend-Instanz mit installiertem Piper benötigt.

## Lösungen

### Option 1: Lokale Stimmen verwenden (Empfohlen für Entwicklung)

Die einfachste Lösung für die lokale Entwicklung ist, nur **lokale Geräte-Stimmen** (Web Speech API) zu verwenden:

1. Öffnen Sie das Voice-Selection-Modal in der App
2. Wählen Sie eine der **"Device Voices"** aus
3. Diese funktionieren ohne Backend-Verbindung

### Option 2: Backend lokal starten (Ohne Piper)

Wenn Sie das Backend lokal testen möchten, aber Piper NICHT installieren wollen:

1. Starten Sie das Backend:
   ```bash
   cd meaningful-conversations-backend
   npm start
   ```

2. Erstellen Sie eine `.env.development` Datei im Projekt-Root:
   ```env
   VITE_API_URL=http://localhost:8080/api
   ```

3. **Wichtig**: Server-Stimmen werden einen Fehler werfen, da Piper nicht installiert ist. Verwenden Sie nur lokale Stimmen.

### Option 3: Vollständige lokale TTS-Umgebung (Für TTS-Entwicklung)

Wenn Sie an der TTS-Funktionalität selbst arbeiten:

1. **Installieren Sie Piper TTS lokal:**
   ```bash
   # macOS/Linux
   pip3 install piper-tts
   
   # Oder mit Homebrew (macOS)
   brew install piper-tts
   ```

2. **Laden Sie die Voice-Models herunter:**
   ```bash
   cd meaningful-conversations-backend
   ./scripts/download-voice-models.sh
   ```
   
   Die Models (200MB) werden nach `meaningful-conversations-backend/tts-voices/` heruntergeladen.

3. **Backend-Umgebungsvariablen setzen:**
   
   In `meaningful-conversations-backend/.env`:
   ```env
   TTS_ENABLED=true
   PIPER_VOICE_DIR=./tts-voices
   PIPER_COMMAND=piper
   ```

4. **Backend starten:**
   ```bash
   cd meaningful-conversations-backend
   npm start
   ```

5. **Frontend-Umgebungsvariable setzen:**
   
   Erstellen Sie `.env.development` im Projekt-Root:
   ```env
   VITE_API_URL=http://localhost:8080/api
   ```

6. **Testen Sie TTS:**
   ```bash
   # Test-Request
   curl -X POST http://localhost:8080/api/tts/synthesize \
     -H "Content-Type: application/json" \
     -d '{"text":"Test","botId":"max-ambitious","lang":"de","isMeditation":false}' \
     --output test.wav
   ```

## Staging/Production

Server-TTS funktioniert automatisch auf:
- **Staging**: https://mc-beta.manualmode.at
- **Production**: https://mc-app.manualmode.at

Dort ist Piper bereits installiert und konfiguriert.

## Architektur-Übersicht

```
┌─────────────────────────────────────────────────┐
│ Frontend (React)                                │
│                                                 │
│ ┌─────────────────┐     ┌──────────────────┐  │
│ │  Web Speech API │     │  Server TTS API  │  │
│ │  (Local Voices) │     │  (Piper Voices)  │  │
│ └─────────────────┘     └──────────────────┘  │
│         ↓                        ↓              │
└─────────┼────────────────────────┼──────────────┘
          │                        │
          │                        ↓
          │              ┌──────────────────────┐
          │              │ Backend (Node.js)    │
          │              │                      │
          │              │ ┌──────────────────┐ │
          │              │ │ Piper TTS        │ │
          │              │ │ + Voice Models   │ │
          │              │ └──────────────────┘ │
          │              └──────────────────────┘
          │
          └─── Funktioniert ohne Backend
```

## Empfehlung

Für die normale Frontend-Entwicklung: **Verwenden Sie einfach lokale Stimmen**. Server-TTS ist nur für spezifische TTS-Feature-Entwicklung oder Testing auf Staging/Production relevant.

