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
- **Animation:** Framer Motion (page transitions, micro-interactions, loader animations)
- **Font:** Inter Variable (self-hosted in `public/fonts/`)
- **Utilities:**
    - `diff`: Text diffing
    - `ics`: Calendar generation
    - `react-markdown` + `remark-gfm`: Markdown rendering

### Brand-Driven Design System
- **Config:** `config/brand.ts` — 4-shade palette (`color1`-`color4`), `accent`, `loader` type
- **Build-time injection:** `vite-plugin-brand.ts` converts hex → RGB, injects CSS custom properties on `:root`
- **CSS variables:** `--brand-color-1` to `--brand-color-4`, `--brand-accent` (space-separated RGB triplets)
- **Tailwind tokens:** `w4f.sky/steel/slate/navy/amber` → `rgb(var(--brand-color-N) / <alpha-value>)`
- **Themes:** `index.css` winter/summer/autumn reference brand vars for accent/info colors
- **Loader:** `BrandLoader` wrapper with lazy-loaded variants: `tetris`, `steering-wheel`, `dots`, `pulse`
- **Override:** Set `VITE_BRAND_COLOR_1` to `_4`, `VITE_BRAND_ACCENT`, `VITE_BRAND_LOADER` in `.env`

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
- **Process Manager:** PM2 (Cluster Mode, 2 instances)
- **Framework:** Express
- **ORM:** Prisma
- **Database:** MariaDB 11.2
- **AI:** Google Generative AI SDK (`@google/genai`), Mistral AI SDK (`@mistralai/mistralai`)
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
- **Provider:** Hetzner VPS
- **Containerization:** Podman + podman-compose
- **Reverse Proxy:** Nginx with auto-generated configs
- **Server IP:** Externalized via `SERVER_HOST` env var (never hardcoded in repo — public GitHub repo)

### Environments
- **Staging:** `/opt/manualmode-staging/` → mc-beta.manualmode.at
- **Production:** `/opt/manualmode-production/` → mc-app.manualmode.at

### Container Registry
- **URL:** quay.myandi.de/gherold
- **Images:**
  - `meaningful-conversations-frontend:VERSION`
  - `meaningful-conversations-backend:VERSION`
  - `meaningful-conversations-tts:VERSION`

### Dependency Management
- **Dockerfiles:** Use `npm ci` (not `npm install`) for reproducible builds
- **Lockfile:** `package-lock.json` is the source of truth for production dependencies
- **Local dev:** `npm install` is fine; always commit updated `package-lock.json` afterwards
- **Lesson Learned (v1.8.4):** `npm install` in Dockerfile resolved `express-rate-limit ^8.2.1` to a newer 8.x with a breaking validation (`ERR_ERL_KEY_GEN_IPV6`), crashing the staging backend. Fixed by switching to `npm ci`.

### Post-Deploy Health Checks & Automatic Rollback
- Deploy script (`deploy-manualmode.sh`) performs connectivity checks after deployment
- **Retry logic:** 3 attempts with 10s intervals for both frontend and backend
- **Hard fail:** Script exits with error code 1 if services don't respond after all retries
- **Automatic rollback:** On health check failure, the script automatically:
  1. Fetches backend logs for diagnostics
  2. Reads the previous version from `.previous-version` file on the server
  3. Stops the failed deployment
  4. Pulls and starts the previous version's images
  5. Updates nginx reverse proxy
  6. Verifies the rollback succeeded
- **Rollback scope:** Applies to both staging (`-e staging`) and production (`-e production`) deployments

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
- **VERSION:** Semantische Version aus `package.json` (z.B. `1.9.5`)
- **BUILD_NUMBER:** Fortlaufende Nummer in `BUILD_NUMBER` Datei
- **Anzeige:** `Version 1.9.5 (Build 2)`
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

## Testing Stack
- **Frontend:** Jest + ts-jest, tests in `utils/__tests__/`
  - `jest.config.js`: `moduleNameMapper` mocks `config/brand` to bypass `import.meta.env`
  - `__mocks__/brand.ts`: Static brand values for tests
  - `tsconfig.json`: Excludes `**/__tests__/**` and `**/*.test.ts` from production `tsc` build
- **Backend:** Jest + supertest, tests in `services/__tests__/`, `routes/__tests__/`, `middleware/__tests__/`
  - `__mocks__/prismaClient.js`: Shared Prisma mock with `jest.fn()` for all model methods
  - `supertest`: HTTP integration testing for route handlers
- **Coverage:** 33 suites, 724+ tests (frontend utilities + backend services/routes/middleware)

## Backend Module Structure (v1.9.8)
Large files have been split into focused modules with facade re-exports:
- `routes/gemini.js` → Facade mounting 8 sub-routers from `routes/gemini/`
- `constants.js` → Facade re-exporting from `bots.js` + `crisisText.js`
- `services/behaviorLogger.js` → Facade re-exporting from `services/behavior/`

**Important:** Files in `routes/gemini/` use `../../middleware/` and `../../services/` paths (two directories up).

## External Services
- **Google Gemini:** Primary LLM provider (gemini-2.0-flash, gemini-2.0-flash-lite)
- **Mistral AI:** Secondary LLM provider (EU-based, GDPR-friendly alternative)
  - SDK: `@mistralai/mistralai`
  - Models: `mistral-medium-latest`, `mistral-small-latest`
  - Provider switching: `aiProviderService.js` handles routing, format conversion (`convertToMistralFormat`), and response post-processing (`stripMistralMetaCommentary`)
  - Behavioral overlay: Mistral-specific system prompt rules appended in `convertToMistralFormat()` to enforce session structure, conciseness, and suppress meta-commentary
- **Mailjet:** Transactional emails (verification, password reset)
- **PayPal:** Webhook integration for donations (with full signature verification)

## Configuration
- **Frontend:** `.env` files (`VITE_BACKEND_URL_*`, `VITE_BRAND_*`)
- **Backend:** `.env` file (`DATABASE_URL`, `GEMINI_API_KEY`, `JWT_SECRET`, etc.)
- **TTS:** `TTS_SERVICE_URL` environment variable
- **Server IP:** `.env.server` file (gitignored) — contains `SERVER_HOST=<ip>`. Read by deploy scripts, Makefile, and monitoring scripts. Template: `.env.server.example`.
- **Frontend server IP fallback:** `VITE_BRAND_SERVER_IP` in `.env.local` — used by `config/brand.ts` → `services/api.ts` for direct-IP access

### CI/CD: GitHub Actions
- **Workflow:** `.github/workflows/test.yml` — runs on push/PR to `main`
- **Jobs:** Frontend tests, Backend tests, TypeScript check (parallel)
- **Results:** https://github.com/herold74/Meaningful-Conversations/actions

### Multi-Brand (White-Label)
- Brand config files in `brands/` directory (e.g., `brands/w4f.env`)
- Build-time injection: copy brand env as `.env.local`, build Docker image, Vite reads `VITE_BRAND_*` vars
- W4F demo: `frontend-w4f` image in registry, standalone container on server, nginx routes to MC backend
- Same codebase, different visual identity per build

### Security: No Hardcoded IPs
The repo is public on GitHub. Real server IPs are **never** committed:
- Shell scripts source `.env.server` for `$SERVER_HOST`
- Makefile uses `-include .env.server` and `$(REMOTE_SSH)` variable
- Frontend uses `VITE_BRAND_SERVER_IP` via `config/brand.ts`
- Git history was scrubbed with `git-filter-repo` (Feb 2026)
