# Technology Context

## Development Environment
- **Package Manager:** `npm`
- **Monorepo:** Root holds frontend, `meaningful-conversations-backend` holds backend.
- **Languages:** TypeScript (Frontend), JavaScript (Backend).

## Frontend Stack
- **Build Tool:** Vite
- **Core:** React 18, TypeScript
- **Styling:** Tailwind CSS, PostCSS
- **Routing:** React Router (inferred from standard patterns, to be verified)
- **Crypto:** Native Web Crypto API (SubtleCrypto)
- **Voice:** Native Web Speech API (SpeechRecognition, SpeechSynthesis)
- **iOS Audio Fix (v1.7.8):** 
    - iOS stays in "playAndRecord" mode after microphone use, degrading TTS quality
    - Fix: Play HTML5 audio element (100ms 440Hz tone, volume 0.3) immediately after mic stops
    - This forces iOS back to stereo/A2DP mode before TTS starts
    - Location: `ChatView.tsx` in `handleVoiceInteraction()` after `recognitionRef.current.stop()`
    - Server TTS is disabled on iOS (autoplay restrictions) - uses local Web Speech API instead
- **Utilities:**
    - `diff`: Text diffing.
    - `ics`: Calendar generation.

## Backend Stack
- **Runtime:** Node.js v22.x
- **Framework:** Express
- **ORM:** Prisma
- **Database:** MySQL
- **AI:** Google Generative AI SDK (`@google/genai`)
- **Auth:** `jsonwebtoken`, `bcrypt` (likely)
- **Email:** `node-mailjet`

## Infrastructure & Deployment
- **Containerization:** Docker / Podman
- **Cloud Provider:** Hetzner VPS (91.99.193.87)
- **Reverse Proxy:** Nginx with auto-generated configs per environment
- **CI/CD:** Scripts in `/scripts/` directory

### Deployment Workflow (OBLIGATORISCH!)

**Prinzip: "Build once, deploy everywhere" mit konsistenter Versionierung**

#### Release-Workflow (IMMER befolgen!)

```bash
# 1. Bei neuer Version: Version aktualisieren
make update-version    # Eingabe: z.B. 1.7.8

# 2. Release bauen (prüft Version automatisch, erhöht Build-Nummer)
make build-release VERSION=1.7.8

# 3. Zur Registry pushen
make push-release VERSION=1.7.8

# 4. Auf Server deployen
ssh root@91.99.193.87 'cd /opt/manualmode-staging && ...'
```

#### Versionierung mit Build-Nummer

- **VERSION:** Semantische Version (z.B. `1.7.8`)
- **BUILD_NUMBER:** Fortlaufende Nummer pro Version (z.B. `3`)
- **Anzeige in UI:** `Version 1.7.8 (Build 3)`
- **Image-Tags:** `1.7.8` und `1.7.8-build3`

**Wichtige Dateien:**
- `BUILD_NUMBER` - Fortlaufende Build-Nummer (wird automatisch erhöht)
- `package.json` - Versions-Source-of-Truth

**`make update-version` aktualisiert:**
- `package.json` (Frontend + Backend)
- `public/sw.js` (Service Worker Cache)
- `components/AboutView.tsx` (UI)
- `metadata.json`
- `BUILD_NUMBER` (wird auf 1 zurückgesetzt)

**NIEMALS:**
- Images manuell taggen ohne `make build-release`
- Version in package.json manuell ändern
- BUILD_NUMBER manuell ändern

#### Server-Deployment

**Server-Pfade:**
- **Staging:** `/opt/manualmode-staging/`
- **Production:** `/opt/manualmode-production/`

**1. Staging-Deployment (vollständig):**
```bash
# Images pullen
ssh root@91.99.193.87 'cd /opt/manualmode-staging && \
  podman pull quay.myandi.de/gherold/meaningful-conversations-backend:VERSION && \
  podman pull quay.myandi.de/gherold/meaningful-conversations-frontend:VERSION'

# VERSION in .env aktualisieren (falls nötig)
ssh root@91.99.193.87 "sed -i 's/VERSION=.*/VERSION=1.7.7/' /opt/manualmode-staging/.env"

# Container neu starten
ssh root@91.99.193.87 'cd /opt/manualmode-staging && \
  podman-compose -f podman-compose-staging.yml down && \
  podman-compose -f podman-compose-staging.yml up -d'

# Nginx IPs aktualisieren (WICHTIG!)
ssh root@91.99.193.87 'bash /opt/manualmode-production/update-nginx-ips.sh staging'
```

**2. Production-Deployment:** Erst nach erfolgreichem Staging-Test!
```bash
# Analog zu Staging, aber mit production statt staging
ssh root@91.99.193.87 'bash /opt/manualmode-production/update-nginx-ips.sh production'
```

**3. TTS-Service (separat, ändert sich selten):**
```bash
# Nur bei Änderungen an tts-service/
podman build -t quay.myandi.de/gherold/meaningful-conversations-tts:VERSION \
  -f meaningful-conversations-backend/tts-service/Dockerfile \
  meaningful-conversations-backend/tts-service/
podman push quay.myandi.de/gherold/meaningful-conversations-tts:VERSION

# Auf Server: TTS-Container separat neu starten
ssh root@91.99.193.87 'cd /opt/manualmode-staging && \
  podman pull quay.myandi.de/gherold/meaningful-conversations-tts:VERSION && \
  podman stop meaningful-conversations-tts-staging && \
  podman rm meaningful-conversations-tts-staging && \
  podman run -d --name meaningful-conversations-tts-staging --pod staging-pod \
    quay.myandi.de/gherold/meaningful-conversations-tts:VERSION'
```

**Wichtige Scripts (lokal):**
- `make build-release VERSION=x.y.z` - Release bauen
- `make push-release VERSION=x.y.z` - Zur Registry pushen
- `make release VERSION=x.y.z` - Beides in einem Schritt

**Wichtige Scripts (Server):**
- `/opt/manualmode-production/update-nginx-ips.sh [staging|production]` - Nginx IPs aktualisieren

### Prisma Datenbank-Migrationen (KRITISCH!)

**Bei jeder Änderung am `schema.prisma` MUSS eine Migration erstellt werden!**

1. **Schema ändern:** `meaningful-conversations-backend/prisma/schema.prisma`
2. **Migration erstellen:** 
   ```bash
   cd meaningful-conversations-backend
   npx prisma migrate dev --name beschreibender_name
   ```
   Falls nicht-interaktiv, manuell erstellen:
   ```bash
   mkdir -p prisma/migrations/YYYYMMDDHHMMSS_name
   # SQL-Datei mit ALTER TABLE Befehlen erstellen
   ```
3. **Migrationsordner committen!**

**Automatische Anwendung beim Deployment:**
- Der Backend-Container führt `npx prisma migrate deploy` beim Start aus
- Neue Migrationen werden automatisch angewendet
- Bei fehlenden Migrationen crasht der Container in einer Endlosschleife!

**Prüfen welche Migrationen angewendet sind:**
```bash
ssh root@91.99.193.87 'cd /opt/manualmode-staging && podman-compose -f podman-compose-staging.yml exec backend npx prisma migrate status'
```

## External Services
- **Google Gemini:** LLM provider.
- **Mailjet:** Transactional emails (verification, resets).
- **PayPal:** Webhook integration for payments.

## Configuration
- **Frontend:** `.env` files (`VITE_BACKEND_URL_*`).
- **Backend:** `.env` file (`DATABASE_URL`, `API_KEY`, `JWT_SECRET`, etc.).

