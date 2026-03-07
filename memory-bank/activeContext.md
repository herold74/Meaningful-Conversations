# Active Context

## Current Status
**Version:** 1.9.9
**Branch:** `main`
**Staging:** Deployed (2026-02-27) — https://mc-beta.manualmode.at
**Production:** Running previous version (deploy when ready)

## Recent Changes (v1.9.9)

### Mistral AI Provider Quality & Coaching Flow (2026-02-28)
- **Mistral-specific behavioral rules** (`aiProviderService.js`): Injected strict system prompt overlay for Mistral models enforcing 4-step session contracting (topic → relevance → outcome → confirmation), response length limits (3-5 sentences, one question per message), and meta-commentary suppression. Bilingual overlay rules (DE/EN) with explicit language enforcement.
- **Post-processing safety net**: `stripMistralMetaCommentary()` strips trailing "Hinweis:"/"Note:" paragraphs and parenthetical coaching notes (e.g., `(Ich frage bewusst...)`) from Mistral responses via regex.
- **Pre-seeded topic detection** (`chat.js`): New `isPreSeededTopic` condition detects when a user starts a session with an explicit topic from TopicSearch (`!isInitialMessage && isNewSession && history.length === 1 && role === 'user'`). Injects strong override to bypass "Achievable Next Steps" check-in and address the user's topic directly.
- **Bot recommendation prompt refinement** (`geminiPrompts.js`): `examplePrompt` limited to 2-3 sentences, no coaching interventions or assumptions. `rationale` must focus on which METHOD fits the topic.
- **BotSelection layout fixes** (`BotSelection.tsx`): `mt-auto` on conversation starter boxes for bottom-alignment; `mb-8` on grid container to prevent collision with next section heading.
- **i18n keys**: Added missing `botSelection_available` and `botSelection_conversation_starter` to DE/EN locale files.
- **GDPR-consistent AI routing**: ALL endpoints (session analysis, bot recommendations, transcript evaluation, narrative profile generation) now respect `user.aiRegionPreference`. Previously, structured JSON endpoints defaulted to Google regardless of user preference — defeating the purpose of Mistral's EU-based processing.
- **Mistral JSON mode hardened**: Explicit JSON formatting rules injected into Mistral system prompt (no double colons, no double quotes around keys). Safety-net sanitization added to all JSON-parsing endpoints.

### TTS Resilience & Debugging (2026-02-28)
- **Skip failed sentences**: Piper TTS container intermittently throws ONNX runtime errors (`INVALID_ARGUMENT`, `RUNTIME_EXCEPTION`) on certain text/phoneme patterns. Previously, a single failed sentence caused `setTtsMode('local')` — permanently switching the entire session to local TTS. Now failed sentences are marked `'skip'` and the `ended` handler advances to the next sentence.
- **No permanent mode switch**: Removed `setTtsMode('local')` from `speak()` catch block. Transient server errors no longer persist across messages. Retry with `forceLocalTts` still works for the affected message.
- **Backend retry with sanitization** (`ttsService.js`): When Piper container returns 500, retries once with sanitized text (Unicode-only letters/numbers/punctuation, stripped special chars).
- **⚠️ ACTIVE DEBUG INSTRUMENTATION** (`hooks/useTts.ts`): `[TTS-DBG]` console.log statements remain in the code for ongoing TTS stability testing. Locations:
  - `speak()` entry: logs ttsMode, effectiveTtsMode, selectedVoiceURI, isRetry
  - `synthRemaining` catch: logs failed sentence index and error
  - `speak()` catch block: logs server TTS error details
  - `ended` handler: logs skipped sentence indices
  - `processStreamingSynthQueue` catch: logs streaming synthesis failures
  - Also: `fetch()` instrumentation to debug server endpoint (`http://127.0.0.1:7242/ingest/...`) — only fires in local dev, silently fails in production
- **Decision**: Keep TTS debug logs until stability is confirmed across multiple sessions/settings. Remove only after explicit user confirmation.

### TTS Performance Overhaul (2026-02-27)
- **Persistent Piper models**: Replaced subprocess-per-request with PiperVoice library. Model loaded once into memory, reused across requests. ~8x speedup (5000ms → 500-700ms per sentence).
- **Warmup endpoint**: `POST /api/tts/warmup` pre-loads voice model when user enters session with server TTS. Model ready before first bot message.
- **Progressive sentence synthesis**: Bot responses split into sentences, synthesized sequentially (each gets full CPU). Play first sentence immediately, synthesize next during playback.
- **Improved sentence splitting**: Now splits on semicolons (`;`) and comma+conjunction boundaries for long chunks (>200 chars). Both EN and DE conjunctions supported.
- **TTS container CPU**: Increased from 1.0 → 2.0 CPUs (staging and production). Sequential synthesis gives each Piper call full CPU (~1.7s per 150 chars).
- **Gunicorn tuning**: 2 workers × 4 threads (down from 3×2) — optimized for in-memory model caching.
- **VoiceModal performance**: Memoized `relevantVoices` in ChatView to prevent VoiceSelectionModal from recalculating on every parent re-render (was firing 60+ times per session).
- **Deploy script fix**: Added `--no-cache --format docker` to TTS build, added missing TTS pull step in remote deploy.

## Recent Changes (v1.9.8)

### Security Hardening (2026-02-26)
- **PayPal Webhook:** Replaced stub `verifyPayPalSignature()` with full implementation calling PayPal's Verify Webhook Signature API.
- **Debug Endpoints:** Added `adminAuth` middleware to `/api/debug/log`, `/logs`, and DELETE `/logs`.
- **Guest Stats:** Added `adminAuth` middleware to `GET /api/guest/stats`.
- **Analytics Spoofing:** Added `optionalAuth` to `POST /api/analytics/event`; userId derived from auth token, not request body.
- **XSS Fix:** Added `escapeHtml()` to `userEmail` in `PaywallView.tsx` before `dangerouslySetInnerHTML`.
- **Input Validation:** Added size limits for `context` (500KB) and `gamificationState` (50KB) in `PUT /api/data/user`. Conditional updates prevent `undefined` values from overwriting existing data.
- **Error Leakage:** Removed `error.message` from client responses in `gemini.js` and `tts.js` routes.
- **SQL Injection:** Replaced `prisma.$queryRawUnsafe()` with `prisma.$queryRaw` tagged template in `admin.js`.
- **IP Externalization:** All scripts, Makefile, and frontend read server IP from environment variables. Git history scrubbed with `git-filter-repo`.

### i18n Audit & Synchronization (2026-02-26)
- Translated 9 untranslated DE values (were English copy-paste).
- Added missing `back` key to both locales.
- Extracted 27 hardcoded strings from 13 components into translation keys.
- Removed 311 unused keys from both `de.json` and `en.json` (1,829 → 1,518 keys).

### Test Coverage Expansion (2026-02-26)
- **Frontend:** 9 new test suites for utilities (encryption, gamification, BFI-2, diff, PII detection, voice, dates, session behavior, survey interpreter).
- **Backend:** 7 service tests, 5 route integration tests, 4 middleware tests.
- **Infrastructure:** Shared Prisma mock (`__mocks__/prismaClient.js`), brand mock (`__mocks__/brand.ts`), Jest config updated for `import.meta.env` handling.
- **Total:** 33 suites, 724+ tests (frontend + backend combined).

### Backend Large File Refactoring (2026-02-26)
- **`gemini.js`** (1,873 lines) → Facade + 8 sub-modules in `routes/gemini/` (translate, chat, session, interview, admin, transcript, botRecommendation, shared).
- **`constants.js`** (1,900 lines) → Facade + `bots.js` (bot definitions) + `crisisText.js` (crisis response text).
- **`behaviorLogger.js`** (1,300 lines) → Facade + 5 sub-modules in `services/behavior/` (riemannKeywords, big5Keywords, sdKeywords, analyzerCore, analyzers).
- All facades maintain backward compatibility — no consumer changes needed.
- All 556 backend tests pass after refactoring.

### Documentation Drift Audit (2026-02-26)
- 48 documentation files audited; 28 had drift and were fixed.
- 6 outdated docs archived.
- All docs updated to reflect current architecture, roles, and deployment patterns.

### Build & Deploy Fixes (2026-02-26)
- `tsconfig.json`: Excluded `**/__tests__/**` and `**/*.test.ts` from production `tsc` build.
- Fixed relative import paths in `routes/gemini/*.js` (`../` → `../../` for middleware, services, prismaClient).
- Developer bot access: `BotSelection.tsx` now grants full access to both `isAdmin` and `isDeveloper`.

## CI/CD (2026-02-26)
- **GitHub Actions** test-on-push workflow added (`.github/workflows/test.yml`): frontend tests, backend tests, TypeScript check — runs on every push to `main`.
- **W4F demo frontend** built and deployed to server as standalone container. Shares MC staging backend. Pending DNS update (`w4f-beta.manualmode.at` → `91.99.193.87`) and SSL cert.
- Brand config: `brands/w4f.env` (blue palette, tetris loader, "Work4Flow Coaching").

## Active Tasks
- [ ] **Console.log Cleanup (pre-production):** ~43 frontend files with hundreds of console.log calls. Heaviest: `useTts.ts` (33), `VoiceSelectionModal.tsx` (19), `capacitorSpeechService.ts` (13). Keep for now (debugging), remove before production release or when stability confirmed. TTS debug logs (`[TTS-DBG]`) intentionally kept per decision 2026-02-28.
- [ ] W4F: Update DNS for `w4f-beta.manualmode.at`, then run `certbot --nginx -d w4f-beta.manualmode.at`
- [ ] iOS App Store Connect: create products, set Notifications URL, TestFlight testing
- [ ] Android Capacitor project setup
- [ ] PayPal Monthly Subscription on web (3.90 EUR/month — Subscriptions API not yet implemented)
- [ ] Formal WCAG accessibility audit tooling (aria attributes already in place throughout)
- [ ] Server-based SLM as Gemini replacement (Llama-3.1-8B-Instruct, LeoLM-8B-chat, or CEREBORN-german). Target: >1000 paying users, dedicated larger server. Reduces per-request cost and Google dependency.
- [ ] Coaching Framework Roadmap: 2 new bots (Clean Language, The Work) + 2 coaching "lenses" (NLP Meta-Modell, Logische Ebenen). See progress.md for details.
- [ ] **[BACKLOG] Presentation Evaluator:** Redevorbereitung mit Live-Recording (Web Speech API + Timer → WPM, Wiederholungen, Satzfragmente) + KI-Evaluation (Content & Delivery-Artifacts). Setup: Generisch oder Spezifisch (Formular / Upload mit KI-Prefill). Output: Sandwich-Report (Stärken → Entwicklung → Präsentationstipps), vorgelesen von Bot "Ralph" (on-demand, TTS). Aufbauend auf `routes/gemini/transcript.js`. Premium Feature. Details in progress.md → "Feature Extensions".

## Decision Log
- **2026-02-28:** Mistral requires separate behavioral overlay instead of separate prompts. Shared base prompts + Mistral-specific rules appended in `convertToMistralFormat()` + post-processing filter. Keeps prompt maintenance in one place.
- **2026-02-28:** Pre-seeded topic detection uses a heuristic (`isNewSession && history.length === 1 && role === 'user'`) rather than an explicit flag from the frontend, because the frontend already correctly sets `isNewSession` and passing extra flags would add unnecessary complexity.
- **2026-02-28:** GDPR consistency: all AI endpoints now respect `user.aiRegionPreference`. Google force for JSON was reverted — Mistral's JSON mode (`response_format: {type: "json_object"}`) works with strengthened prompt instructions and sanitization fallback.
- **2026-02-28:** TTS debug logs kept in code intentionally — recurring intermittent Piper ONNX failures need multi-session observation before cleanup.
- **2026-02-26:** Memory bank updated to reflect v1.9.8 state. All stale references to `feature/visual-redesign` branch removed — that work was merged to `main` prior to this session.
- **2026-02-26:** Server IP externalized — all scripts/Makefile/api.ts read from `.env.server` (gitignored). Git history scrubbed with `git-filter-repo`.
- **2026-02-26:** Backend large files refactored into modules with facade pattern for backward compatibility. Test files excluded from `tsc` production build.
- **2026-02-26:** Security audit completed — 8 vulnerabilities fixed across backend routes and frontend components.
- **2026-02-26:** i18n audit — 311 unused keys removed, 27 hardcoded strings extracted, perfect DE/EN parity achieved.
