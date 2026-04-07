# System Patterns

## Architecture Overview
The project follows a **Monorepo** structure containing a Single Page Application (SPA) frontend and a RESTful API backend.

### Frontend (`/`)
- **Framework:** React 18 with Vite.
- **Language:** TypeScript.
- **State Management:** React Context (Localization, likely Auth/User state).
- **Styling:** Tailwind CSS.
- **Key Libraries:**
    - `react-markdown`: For rendering the Life Context and chat.
    - `diff`: For visualizing proposed changes to the Life Context.
    - Web Speech API: For TTS and STT.
    - Web Crypto API: For client-side E2EE.

### Backend (`/meaningful-conversations-backend`)
- **Runtime:** Node.js.
- **Framework:** Express.js.
- **Database:** MySQL (accessed via Prisma ORM).
- **Authentication:** JWT (JSON Web Tokens).
- **AI Integration:** Google Gemini API (`@google/genai`).
- **External Services:** Mailjet (Email), PayPal (Payments/Donations).

## Key Technical Decisions

### 1. The Life Context File (`.md`)
- **Decision:** Use a plain text Markdown file as the primary data store for user context.
- **Reasoning:** Portability, human-readability, and ease of editing. It avoids complex database schemas for variable user data and allows users to own their data fully.
- **Implementation:** The frontend parses this file. For registered users, it's encrypted and stored as a blob/text in the DB.

### 2. End-to-End Encryption (E2EE)
- **Decision:** Client-side encryption for Life Context.
- **Reasoning:** Privacy is paramount. Even the platform admins should not see the user's personal reflections.
- **Mechanism:** AES-GCM encryption using a key derived from the user's password (PBKDF2).

### 3. AI Proxying
- **Decision:** Backend proxies all calls to Google Gemini.
- **Reasoning:** Hides the API key from the client. Allows for rate limiting and usage tracking. Enforces policy (e.g., context injection).

### 4. Hybrid Storage (Guest vs. Registered)
- **Guest:** LocalStorage / In-memory. File download/upload required for persistence.
- **Registered:** MySQL database stores the encrypted blob. Syncs across devices.

## Data Flow
1.  **Load:** Frontend fetches encrypted data (Registered) or reads file input (Guest).
2.  **Decrypt:** Client decrypts Life Context and Personality Profile locally.
3.  **Chat:** Client sends context + personality profile + user message to Backend.
4.  **Process:** Backend builds dynamic prompt (DPC/DPFL) -> Sends to Gemini -> Returns response.
5.  **TTS:** Response is spoken via Server TTS (Piper) or Local TTS (Web Speech API fallback).
6.  **Update:** AI proposes context changes -> Frontend shows diff -> User approves -> Client encrypts -> Backend stores.
7.  **DPFL (Optional):** Session behavior logged -> Profile refinement suggestions -> User approves adjustments.

### 8. Backend Scaling & Process Management
- **Decision:** Use PM2 for Node.js process management.
- **Reasoning:** Node.js is single-threaded. PM2 allows utilizing multi-core systems via "Cluster Mode" without changing code. It also provides automatic restarts on crash.
- **Implementation:** `ecosystem.config.js` defines 2 instances. Docker container runs `pm2-runtime`.

#### Accepted risk: `npm audit` / PM2 (GHSA-x5gf-qvw8-r2rm)
- **Decision:** Keep PM2 even when `npm audit` in `meaningful-conversations-backend` still reports a **low-severity** PM2 advisory and npm shows **no fix available**.
- **Reasoning:** PM2 is used **only inside** the backend container (`CMD`: `npx pm2-runtime ecosystem.config.js`). It is **not** a publicly exposed service; clients reach **Express** via Nginx. The reported issue does not warrant removing cluster mode or switching process managers until upstream ships a fix or the advisory’s practical impact for this deployment model changes.
- **Review:** Re-run `npm audit` in the backend directory after dependency updates; revisit if the advisory severity increases, a patched PM2 release exists, or we intentionally simplify to a single Node process.

## Key Technical Decisions (Recent)

### 5. Hybrid TTS Architecture
- **Decision:** Separate TTS container with Piper, plus local Web Speech API fallback.
- **Reasoning:** High-quality server voices for desktop, reliable local fallback for mobile/iOS.
- **Implementation:** TTS container on port 8082, frontend auto-detects availability.

### 18. Persistent Piper Models with Warmup (TTS Performance)
- **Decision:** Use PiperVoice as a Python library with in-memory model caching instead of spawning a Piper subprocess per request.
- **Reasoning:** Each subprocess spawned loaded a 61MB ONNX model from scratch (~3-4s overhead), making every TTS request take ~5s even for short sentences. With persistent models, inference takes 500-700ms.
- **Implementation:**
  - `app.py`: Thread-safe `_model_cache` dict holds `PiperVoice` instances with 10-min TTL eviction.
  - `POST /warmup`: Pre-loads a model on demand. Called by frontend when TTS init confirms server mode.
  - Per-model locking: `PiperVoice.synthesize` is not thread-safe; a `threading.Lock` per model serializes calls for the same model while allowing different models in parallel.
  - Progressive sentence synthesis: Frontend splits text into sentences, synthesizes sequentially (one at a time). Each Piper call gets full CPU (~1.7s for 150 chars). First sentence plays immediately; next synthesizes during playback. Parallel was tested but shared vCPUs caused ~2x contention.
  - Warmup race condition fix: Frontend stores warmup promise in a ref and `await`s it before first synthesis, ensuring the model is loaded before the first bot message hits the TTS service.
  - Gunicorn: 2 workers × 4 threads. Each worker holds its own model cache (~120MB for 2 models). Capacity: ~10-12 concurrent TTS sessions on 4-vCPU server.

### 6. iOS Audio Handling
- **Decision:** Force local TTS on iOS, play silent audio after mic use.
- **Reasoning:** iOS autoplay restrictions prevent server TTS; "playAndRecord" mode degrades quality.
- **Implementation:** Silent WAV playback, MediaSession management in ChatView.tsx.

### 7. Personality Profile E2EE
- **Decision:** Encrypt personality data with same key as Life Context.
- **Reasoning:** Same privacy guarantees for sensitive psychological data.
- **Implementation:** Client-side encryption in personalityEncryption.ts.

### 9. Reproducible Docker Builds
- **Decision:** Use `npm ci` in all Dockerfiles, never `npm install`.
- **Reasoning:** `npm install` can resolve semver ranges to newer versions than tested locally. A breaking validation change in express-rate-limit (`^8.2.1` resolved to a newer 8.x) crashed the staging backend with `ERR_ERL_KEY_GEN_IPV6`. `npm ci` strictly follows `package-lock.json`.
- **Implementation:** All Dockerfiles use `npm ci`. Lockfiles are committed and are the source of truth for production builds. Local development continues to use `npm install` for flexibility.

### 10. Bot Type Distinction: Coaches vs. Interviewers
- **Decision:** Separate bot types with different end-session flows and UI treatment.
- **Reasoning:** Coaching bots (Nobody, Max, Ava, Kenji, Chloe, Rob) produce session analyses with Life Context updates. Interview bots (Gloria Life Context, Gloria Interview) produce specialized outputs (Life Context file or interview transcript). Each type needs a distinct post-session view.
- **Implementation:**
  - `handleEndSession` in `App.tsx` checks `selectedBot.id` and routes to the appropriate view.
  - `gloria-life-context`: Hidden from bot selection, routes to `sessionReview` with generated Life Context.
  - `gloria-interview`: Visible in bot selection (registered tier), routes to `interviewTranscript` view with AI-generated summary + corrected transcript.
  - Interview bots have no DPC/DPFL integration — coaching badge suppressed in `BotSelection.tsx`.
  - Bot IDs use clear prefixes (`gloria-life-context`, `gloria-interview`) to prevent confusion during future changes.

### 12. Brand-Driven Design System
- **Decision:** All visual branding (colors, loader style) driven by build-time environment variables via a single codebase.
- **Reasoning:** Enables white-labeling for colleagues who want to run their own branded instance without code forks. Brand identity injected at build time, not runtime.
- **Implementation:**
  - `config/brand.ts` defines `color1`-`color4`, `accent`, `loader` with W4F defaults, overridable via `VITE_BRAND_*`.
  - `vite-plugin-brand.ts` converts hex colors to RGB triplets and injects them as CSS custom properties (`--brand-color-1` to `--brand-color-4`, `--brand-accent`) on `:root` via `<style>` tag in `index.html`.
  - `index.css` theme definitions reference `var(--brand-color-N)` instead of hardcoded RGB values. Seasonal accent-primary colors (green for summer, orange for autumn) remain season-specific.
  - `tailwind.config.js` `w4f.*` tokens use `rgb(var(--brand-color-N) / <alpha-value>)` syntax.
  - `BrandLoader` component reads `brand.loader` and lazy-loads the matching loader variant (tetris, steering-wheel, dots, pulse).
  - Data flow: `.env` → Vite plugin → CSS custom properties → Tailwind tokens → Components.

### 11. Tiered User Access Control
- **Decision:** Six-tier role system: Guest, Registered, Premium, Client, Admin, Developer.
- **Reasoning:** Fine-grained access control for different feature sets and pricing tiers. Developer role separates test infrastructure access from general admin capabilities.
- **Implementation:** Boolean flags on User model (`isPremium`, `isClient`, `isAdmin`, `isDeveloper`). Server-side enforcement in route handlers. Frontend gating via `currentUser` flags. Access matrix documented in `DOCUMENTATION/USER-ACCESS-MATRIX.md`.

### 13. Externalized Server IP (Security)
- **Decision:** Never hardcode the server IP in committed code. Read from environment variables sourced from a gitignored `.env.server` file.
- **Reasoning:** The GitHub repo is public. Hardcoded IPs expose infrastructure to scanning/attacks. Git history was scrubbed with `git-filter-repo` after the IP was found in 30+ files.
- **Implementation:**
  - `.env.server` (gitignored): contains `SERVER_HOST=<real-ip>`, sourced by all shell scripts and Makefile.
  - `.env.server.example` (committed): template with placeholder.
  - `Makefile`: `-include .env.server`, defines `REMOTE_SSH := root@$(SERVER_HOST)`.
  - `deploy-manualmode.sh` and `scripts/*.sh`: source `.env.server`, use `${SERVER_HOST:?error}`.
  - `config/brand.ts`: `serverIp` field from `VITE_BRAND_SERVER_IP` (set in `.env.local`, gitignored).
  - `services/api.ts`: uses `brand.serverIp` for the IP-fallback entry in the backend URL map.
  - `seed.js`: uses `process.env.SERVER_HOST` for production safety check.

### 14. Backend Modularization (Facade Pattern)
- **Decision:** Split large monolithic backend files into focused modules, keeping the original file as a re-exporting facade.
- **Reasoning:** `gemini.js` (1,873 lines), `constants.js` (1,900 lines), and `behaviorLogger.js` (1,300 lines) were too large to maintain. Smaller modules improve readability, testability, and reduce merge conflicts.
- **Implementation:**
  - `routes/gemini.js` → Facade that `router.use()` mounts 8 sub-routers from `routes/gemini/` (translate, chat, session, interview, admin, transcript, botRecommendation, shared).
  - `constants.js` → Facade re-exporting from `bots.js` (bot definitions) and `crisisText.js` (crisis response text).
  - `services/behaviorLogger.js` → Facade re-exporting from `services/behavior/` (riemannKeywords, big5Keywords, sdKeywords, analyzerCore, analyzers).
  - **Important:** Sub-modules in `routes/gemini/` use `../../middleware/` and `../../services/` paths (two levels up from the routes directory).
  - All existing consumers require the original file path unchanged — zero-impact refactor.

### 15. CI/CD with GitHub Actions
- **Decision:** Automated test runs on every push to `main` via GitHub Actions.
- **Reasoning:** Catches broken code (like the relative import path bug in gemini sub-modules) before it reaches staging. Lightweight first step before full CI/CD pipeline.
- **Implementation:**
  - `.github/workflows/test.yml`: 3 parallel jobs — frontend Jest, backend Jest, TypeScript check.
  - No deployment automation yet — manual deploy via `deploy-manualmode.sh` remains.
  - Future: matrix builds for multi-brand (MC + W4F), automated staging deploy.

### 16. Multi-Brand Architecture
- **Decision:** Same codebase produces different branded instances via build-time env vars. Each brand gets independent infrastructure (frontend, backend, TTS, DB).
- **Reasoning:** Enables white-labeling for partners without code forks. Brand identity injected at build time, not runtime.
- **Implementation:**
  - Brand configs in `brands/*.env` (e.g., `brands/w4f.env`).
  - Build: copy brand env as `.env.local` → Vite reads `VITE_BRAND_*` → Docker image tagged per brand (e.g., `frontend-w4f:1.9.8`).
  - Server: separate containers per brand, nginx routes by domain.
  - W4F demo (current): standalone frontend container sharing MC staging backend.

### 19. Multi-Provider AI Handling (Mistral Overlay Pattern)
- **Decision:** Use shared base prompts with a provider-specific behavioral overlay rather than maintaining separate prompt sets per AI provider.
- **Reasoning:** Mistral models follow instructions differently from Gemini — they tend to "think out loud" (leaking coaching methodology in parenthetical comments), generate verbose philosophical responses, and skip structured session flows like contracting. Separate prompts would double maintenance burden. An overlay approach keeps one source of truth for coaching content.
- **Implementation:**
  - `aiProviderService.js` → `convertToMistralFormat()` appends strict behavioral rules to the system instruction: 4-step session contracting, 3-5 sentence limit, one question per message, no meta-commentary.
  - `stripMistralMetaCommentary()` post-processes Mistral responses to remove trailing "Hinweis:"/"Note:" paragraphs and parenthetical comments via regex. Applied only when `context === 'chat'`.
  - Pattern is extensible: if a third provider is added, a similar overlay + post-processing pair can be introduced without touching base prompts.
- **Known limitation:** Mistral occasionally still asks two questions in one message despite the "one question" rule. Acceptable trade-off vs. fully separate prompts.

### 20. Pre-Seeded Topic Detection (TopicSearch → Chat)
- **Decision:** Detect when a user starts a new session with an explicit topic from TopicSearch and override the "Achievable Next Steps" check-in.
- **Reasoning:** The frontend correctly sets `isNewSession = true` for TopicSearch-initiated sessions, but sends the user's topic as the first history message. This makes `isInitialMessage` false in the backend (history is non-empty), so the existing "skip Next Steps" branch was not triggered.
- **Implementation:**
  - `chat.js`: `isPreSeededTopic = !isInitialMessage && isNewSession && history.length === 1 && history[0]?.role === 'user'`
  - When true, injects a strong system instruction override telling the bot to "COMPLETELY IGNORE" any Next Steps and address the user's stated topic directly.
  - Works for both DE and EN prompts.

### 17. Test Infrastructure
- **Decision:** Jest + ts-jest for frontend, Jest + supertest for backend, with shared mocks.
- **Reasoning:** Comprehensive testing needed for security-critical code (encryption, auth, input validation) and complex business logic (personality analysis, coaching strategies).
- **Implementation:**
  - Frontend: `jest.config.js` with `moduleNameMapper` for `config/brand` mock (bypasses `import.meta.env`). Test files in `utils/__tests__/`.
  - Backend: `meaningful-conversations-backend/__mocks__/prismaClient.js` provides shared Prisma mock. Test files in `services/__tests__/`, `routes/__tests__/`, `middleware/__tests__/`.
  - `tsconfig.json` excludes `**/__tests__/**` and `**/*.test.ts` from production `tsc` build.
  - 33 suites, 724+ tests total across both stacks.

### 21. Documentation stewardship (AI-assisted)
- **Decision:** The product owner delegates routine upkeep of the Memory Bank (`memory-bank/`), `DOCUMENTATION/`, and `.cursor/skills/` to the coding assistant. The owner focuses on product and user experience; they do not review every documentation change.
- **Reasoning:** Keeps handoff context and guides accurate without adding a standing doc-review obligation. Trust is explicit so assistants default to updating what matters after substantive work.
- **Implementation:** After meaningful sessions (especially commits), the assistant updates `activeContext.md`, `progress.md`, and related docs/skills per `.cursor/rules/memory-bank.mdc` without waiting for a separate "please update docs" request. **Also:** after **server verification** (SSH, staging vs production digests, deploy outcomes) or any chat that fixes **material project facts**, the assistant refreshes the Memory Bank **in the same session** — the owner should not need to prompt for routine bank updates.

