# Active Context

## Current Status
**Version:** 1.9.8 (Build 3)
**Branch:** `main`
**Staging:** Deployed and verified (2026-02-26) — https://mc-beta.manualmode.at
**Production:** Running previous version (deploy when ready)

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
- [ ] W4F: Update DNS for `w4f-beta.manualmode.at`, then run `certbot --nginx -d w4f-beta.manualmode.at`
- [ ] iOS App Store Connect: create products, set Notifications URL, TestFlight testing
- [ ] Android Capacitor project setup
- [ ] PayPal Monthly Subscription on web (3.90 EUR/month — Subscriptions API not yet implemented)
- [ ] Large context file performance optimization (no virtualization/chunking yet)
- [ ] Formal WCAG accessibility audit tooling (aria attributes already in place throughout)

## Decision Log
- **2026-02-26:** Memory bank updated to reflect v1.9.8 state. All stale references to `feature/visual-redesign` branch removed — that work was merged to `main` prior to this session.
- **2026-02-26:** Server IP externalized — all scripts/Makefile/api.ts read from `.env.server` (gitignored). Git history scrubbed with `git-filter-repo`.
- **2026-02-26:** Backend large files refactored into modules with facade pattern for backward compatibility. Test files excluded from `tsc` production build.
- **2026-02-26:** Security audit completed — 8 vulnerabilities fixed across backend routes and frontend components.
- **2026-02-26:** i18n audit — 311 unused keys removed, 27 hardcoded strings extracted, perfect DE/EN parity achieved.
