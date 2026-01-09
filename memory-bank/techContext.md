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

### Deployment Workflow (WICHTIG!)

**Prinzip: "Build once, deploy everywhere"**

1. **Staging Deployment** (`./deploy-manualmode.sh -e staging`):
   - Baut neue Images lokal
   - Pusht zur Registry (ghcr.io)
   - Deployed auf Staging-Umgebung
   - Aktualisiert Nginx IPs

2. **Production Deployment** (`./scripts/deploy-production-scheduled.sh [VERSION]`):
   - **NIEMALS neu bauen!**
   - Pullt die bereits getesteten Images von der Registry
   - Dieselben Images wie auf Staging
   - Deployed auf Production-Umgebung
   - Aktualisiert Nginx IPs

**Versionierung:**
- **WICHTIG:** Versionsänderungen müssen mit `make update-version` eingeleitet werden!
- Dieser Befehl aktualisiert alle Versionsnummern konsistent:
  - `package.json` (Frontend)
  - `meaningful-conversations-backend/package.json` (Backend)
  - `public/sw.js` (Service Worker Cache)
  - `components/BurgerMenu.tsx` (UI-Anzeige)
  - `memory-bank/activeContext.md`
- Falls Versionsnummern manuell geändert werden, entstehen Inkonsistenzen in der App
- Falls Staging eine neuere Version testet, kann Production mit expliziter Versionsnummer deployed werden
- Beispiel: `./scripts/deploy-production-scheduled.sh 1.7.3`

**Wichtige Scripts:**
- `deploy-manualmode.sh` - Staging (mit Build)
- `scripts/deploy-production-scheduled.sh` - Production (nur Pull)
- `server-scripts/update-nginx-ips.sh` - Nginx IP-Update nach Container-Restart

## External Services
- **Google Gemini:** LLM provider.
- **Mailjet:** Transactional emails (verification, resets).
- **PayPal:** Webhook integration for payments.

## Configuration
- **Frontend:** `.env` files (`VITE_BACKEND_URL_*`).
- **Backend:** `.env` file (`DATABASE_URL`, `API_KEY`, `JWT_SECRET`, etc.).

