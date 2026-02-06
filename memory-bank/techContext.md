# Technology Context

## Development Environment
- **Package Manager:** `npm`
- **Monorepo:** Root holds frontend, `meaningful-conversations-backend` holds backend
- **Languages:** TypeScript (Frontend), JavaScript (Backend)

## Frontend Stack
- **Build Tool:** Vite 7.x
- **Core:** React 18, TypeScript
- **Styling:** Tailwind CSS, PostCSS
- **Routing:** Hash-based routing (SPA)
- **Crypto:** Native Web Crypto API (SubtleCrypto)
- **Voice:** Native Web Speech API (SpeechRecognition, SpeechSynthesis)
- **Mobile/Native:** Capacitor 8.x (iOS)
    - `@capacitor/core`: Native bridge
    - `@capacitor/ios`: iOS platform
    - `@capacitor-community/native-audio`: Audio handling
    - `@capacitor-community/speech-recognition`: Native speech recognition
- **PDF:** html2pdf.js (client-side)
- **Utilities:**
    - `diff`: Text diffing
    - `ics`: Calendar generation
    - `react-markdown` + `remark-gfm`: Markdown rendering

### iOS Audio Handling (v1.7.9)
- **Problem:** iOS switches to "playAndRecord" mode after microphone use, degrading TTS quality
- **Fix 1 (Audio Session Reset):** Play silent WAV (16-bit null samples) immediately after mic stops
  - Forces iOS back to stereo/A2DP mode
  - Location: `ChatView.tsx` in `handleVoiceInteraction()`
- **Fix 2 (MediaSession):** Activate/deactivate MediaSession around TTS playback
- **TTS Mode:** iOS is forced to local Web Speech API (server TTS disabled due to autoplay restrictions)

### Voice Mode Spinner (v1.7.9)
- Single spinner implementation (bouncing dots)
- Position: Bottom of screen near Play/Repeat buttons
- States: `isLoading` (AI response) and `isLoadingAudio` (TTS loading)
- Polling mechanism for local TTS (browser events unreliable)

## Mobile Environment (Capacitor)
- **Platform:** iOS (Native App)
- **IDE:** Xcode 15+
- **Configuration:** `capacitor.config.ts`
- **Native Plugins:**
  - `SplashScreen`: Launch screen control
  - `StatusBar`: Status bar styling
  - `SpeechRecognition`: Native iOS speech recognition (avoids Safari limitations)
  - `NativeAudio`: Audio session management

## Backend Stack
- **Runtime:** Node.js v22.x
- **Framework:** Express
- **ORM:** Prisma
- **Database:** MariaDB 11.2
- **AI:** Google Generative AI SDK (`@google/genai`)
- **Auth:** `jsonwebtoken`, `bcrypt`
- **Email:** `node-mailjet`

## TTS Service (Separate Container)
- **Engine:** Piper TTS (Python/Flask)
- **Voices:**
  - `de_DE-thorsten-medium` (German male)
  - `en_US-amy-medium` (English female)
  - `en_US-ryan-medium` (English male)
- **Port:** 8082 (internal)
- **Fallback:** Local Web Speech API

## Infrastructure & Deployment

### Server
- **Provider:** Hetzner VPS (91.99.193.87)
- **Containerization:** Podman + podman-compose
- **Reverse Proxy:** Nginx with auto-generated configs

### Environments
- **Staging:** `/opt/manualmode-staging/` → mc-beta.manualmode.at
- **Production:** `/opt/manualmode-production/` → mc-app.manualmode.at

### Container Registry
- **URL:** quay.myandi.de/gherold
- **Images:**
  - `meaningful-conversations-frontend:VERSION`
  - `meaningful-conversations-backend:VERSION`
  - `meaningful-conversations-tts:VERSION`

### Deployment Workflow

**Prinzip: "Build once, deploy everywhere" mit konsistenter Versionierung**

#### Quick Deploy (Frontend only)
```bash
./deploy-manualmode.sh -e staging -c frontend
```

#### Full Deploy (All containers)
```bash
./deploy-manualmode.sh -e staging -c all
```

#### Versionierung
- **VERSION:** Semantische Version aus `package.json` (z.B. `1.7.9`)
- **BUILD_NUMBER:** Fortlaufende Nummer in `BUILD_NUMBER` Datei
- **Anzeige:** `Version 1.7.9 (Build 13)`
- **Service Worker:** Cache-Name enthält Version + Build

**⚠️ KRITISCH: BUILD_NUMBER bei Versionswechsel zurücksetzen!**
```
FALSCH: 1.7.8 (Build 39) → 1.7.9 (Build 40)
RICHTIG: 1.7.8 (Build 39) → 1.7.9 (Build 1)
```

#### Version aktualisieren
```bash
make update-version  # Aktualisiert alle Dateien
```

**Aktualisierte Dateien:**
- `package.json` (Frontend + Backend)
- `public/sw.js` (Service Worker Cache)
- `components/AboutView.tsx` (UI)
- `metadata.json`
- `BUILD_NUMBER` (wird auf 1 zurückgesetzt)

### Prisma Datenbank-Migrationen

**Bei Schema-Änderungen MUSS Migration erstellt werden!**

```bash
cd meaningful-conversations-backend
npx prisma migrate dev --name beschreibender_name
```

**Automatische Anwendung:** Backend-Container führt `prisma migrate deploy` beim Start aus.

## External Services
- **Google Gemini:** LLM provider (gemini-1.5-flash, gemini-2.0-flash-exp)
- **Mailjet:** Transactional emails (verification, password reset)
- **PayPal:** Webhook integration for donations

## Configuration
- **Frontend:** `.env` files (`VITE_BACKEND_URL_*`)
- **Backend:** `.env` file (`DATABASE_URL`, `GEMINI_API_KEY`, `JWT_SECRET`, etc.)
- **TTS:** `TTS_SERVICE_URL` environment variable
