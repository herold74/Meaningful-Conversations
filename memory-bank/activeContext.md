# Active Context

## Current Status
**Version:** 2.6.0. Repo `BUILD_NUMBER` **72**. **Staging** Build **72**. **Production** Build **72**.
**Ops-Report (2026-11-04):** `scripts/server-ops-report.sh` prüft Produktions- und Staging-Dumps getrennt (`production-*.sql.gz` / `staging-*.sql.gz`: Alter, Größe, gzip). Kurzübersicht: `Backup Prod` und `Backup Staging`. Cron bleibt `/usr/local/bin/server-ops-report.sh` (Kopie, nicht Teil des App-Deploys).
**Staging:** v**2.6.0** Build **72** — https://mc-beta.manualmode.at.
**Production:** v**2.6.0** Build **72** — https://mc-app.manualmode.at (`sw.js` `v2.6.0-b72`; deploy 2026-11-03).
**App Store:** iOS **2.5.7** live (AT/DE/CH). **Next:** iOS **2.6.0** ASC submit/archive (`MARKETING_VERSION` 2.6.0; align `CURRENT_PROJECT_VERSION` with the repo build before upload). Metadata: `DOCUMENTATION/APP-STORE-METADATA.md`.
**Standing rule:** Do not run staging login or E2EE maintenance without an explicit user request. The 2026-10-30 staging database was restored from `staging-20261030-050001.sql.gz` after an unauthorized password/profile rewrap.

## Session handoff (2026-11-02) — Session validity, test mode, doc index

- **Auth:** `middleware/auth.js` and `adminAuth.js` require an existing user with `status === 'ACTIVE'` and a token issued after `tokensInvalidatedAt`. A deleted account no longer keeps a JWT until expiry (`isTokenInvalidated` fails closed when the row is gone).
- **Admin:** Password reset, account deletion, and role toggles call `invalidateTokensForUser`. Role and credential routes require `isAdmin`. Developers still reach the admin panel and the test runner. Reset still returns the new password once so the admin UI can show it; the previous session is dead. Actions are logged as one JSON line (`audit: admin`).
- **Test mode:** `X-Test-Mode` skips the daily cost cap only for `isDeveloper`, and never in production. Production CORS does not allow that header.
- **Process safety:** Async route rejections are forwarded to `errorHandler`. `unhandledRejection` / `uncaughtException` use the existing graceful shutdown. Empty register and forgot-password bodies return 400.
- **Repo hygiene:** Password-candidate decrypt/dump scripts and `tmp/` are gitignored. The ICF source PDF stays local.
- **Docs:** `DOCUMENTATION-STRUCTURE.md` now says 2.6.0, staging b67, production b41, and indexes Connector, safety, access, Mistral DPA, and ICF. `KEYWORD-CRITIQUE.md`, `FEATURE-DEVELOPMENT-TIMELINE.md`, and `TTS-HYBRID-README.md` moved to `DOCUMENTATION/ARCHIVED/`. Older handoffs: `memory-bank/archive/activeContext-2026-10.md`.
- **Decision:** `systemPatterns.md` #32.
- **Phase 1 (this release):** Server speech uses only the Piper container. The local shell fallback is gone, so spoken text cannot become a command. `/api/health` sits outside the global 60/min limit, so the watchdog is not crowded out. App split stays for the next release.

## Active Tasks
- [ ] **Remove legacy aliases** — when obsolete per `DOCUMENTATION/LEGACY-ALIASES-REMOVAL.md` (not before App Store ≥2.4.x + DB clean)
- [ ] **Console.log Cleanup:** frontend `console.log` calls. TTS debug logs (`[TTS-DBG]`) stay for stability monitoring.
- [ ] W4F: Update DNS for `w4f-beta.manualmode.at`, then run `certbot`
- [ ] iOS: Set up In-App Purchase products in App Store Connect, Notifications URL. Archive iOS **2.6.0** (repo build, not the live 2.5.7 binary).
- [ ] Android Capacitor project setup
- [ ] PayPal Monthly Subscription on web (3.90 EUR/month)
- [ ] Formal WCAG accessibility audit
- [ ] Self-hosted SLM as Gemini replacement (milestone: >1000 paying users)
- [ ] **Krisen-Hilfsangebote region-aware (Backlog):** AT-Hotlines nur bei Region AT/leer; sonst landesspezifisch — siehe `progress.md`
- [ ] Coaching Framework Roadmap: client exact language bot, The Work bot, NLP Meta-Modell lens, Logische Ebenen lens
- [ ] **Coach Practice → Coach-Feedback / Profil (Roadmap):** später optional Coaching-Stil aus Practice — siehe `progress.md`
- [ ] **Coach Practice → Entwickler-Feedback nach Auswertung (Roadmap, S):** Rating + optionaler Kommentar auf `PracticeEvaluationReview`
- [ ] **Rolling Context / Kontextlimitierung (Backlog, M):** Developer-Schalter für Classic-Chat — siehe `progress.md`
- [ ] Presentation Evaluator (Premium Feature, backlog)
- [ ] Micro Learnings: Integration Management Section

---

**Archive:** Handoffs through 2026-10-30 → `memory-bank/archive/activeContext-2026-10.md`. Earlier verbose logs → `memory-bank/archive/activeContext-legacy-2026-08.md`.
