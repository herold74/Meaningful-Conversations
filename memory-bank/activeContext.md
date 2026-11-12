# Active Context

## Current Status
**Version:** 2.6.0. Repo `BUILD_NUMBER` **78**. **Staging** Build **78** (W6 React 19 deploy 2026-11-12). **Production** Build **77** (React 18 Frontend bis Prod-Pull).
**Ops-Report (2026-11-04):** `scripts/server-ops-report.sh` prüft Produktions- und Staging-Dumps getrennt (`production-*.sql.gz` / `staging-*.sql.gz`: Alter, Größe, gzip). Kurzübersicht: `Backup Prod` und `Backup Staging`. Cron bleibt `/usr/local/bin/server-ops-report.sh` (Kopie, nicht Teil des App-Deploys).
**SW-Stack-Report (2026-11-12):** Freitag **20:00** `sw-stack-ops-report.sh` + `stack-package-tracker.json` / `sw-stack-merge-table.jq` auf Server (`/usr/local/bin/`). Mail: Paket-Tabelle (Patches, Risiko, QA leicht/mittel/hoch, Features, Abhängigkeiten) + npm-Scan. Commit `6181a993`.
**Patches (2026-11-12 W1):** `dnf update --security` — Kernel **5.14.0-687.66.2**, glibc, Cockpit, qemu-guest-agent, webkit; Reboot; Prod+Staging Health 200. Details: `PLANS/w1-host-security-2026-11-12.md`. *(Vorher 2026-11-04: 687.65.1, Podman 5.8.2-8.)*
**Staging:** v**2.6.0** Build **78** — https://mc-beta.manualmode.at (`sw.js` `v2.6.0-b78`; W6 React 19.3 Frontend).
**Production:** v**2.6.0** Build **77** — https://mc-app.manualmode.at (`sw.js` `v2.6.0-b77`; `/api/health` mit `version` + `prisma`).
**App Store:** iOS **2.6.0** live (AT/DE/CH) — nutzt Production-API; kein neues iOS-Release für Stack-W2–W5 nötig (API-kompatibel). Metadata: `DOCUMENTATION/APP-STORE-METADATA.md`.
**Standing rule:** Do not run staging login or E2EE maintenance without an explicit user request. The 2026-10-30 staging database was restored from `staging-20261030-050001.sql.gz` after an unauthorized password/profile rewrap.

## Session handoff (2026-11-09) — W2 umgesetzt (Staging b76)

- **Branch:** `cursor/w2-pr2-pr3-482a` (enthält PR-1 Backend lockfile + PR-2/3 Frontend).
- **Backend (PR-1):** `express-rate-limit` 8.7.3, `marked` 18.1.3, `pm2` 7.1.2, `supertest` 7.3.1.
- **Frontend (PR-2/3):** `@capacitor/filesystem` 8.1.5, `@capacitor/share` 8.0.3, `@revenuecat/purchases-capacitor` **13.8.0**, `@react-pdf/renderer` 4.9.0, `lucide-react` 1.70.0, `framer-motion` 12.43.0, `ics`/`postcss`/`autoprefixer`/`playwright` Patches.
- **Patches:** `patches/` geleert — Fixes sind in Upstream 8.1.5 / 13.8.0 (`verify:ios-iap` + `verify-ios-plugin-packages` OK).
- **CI:** `npm run ci` grün. **Staging:** `./deploy-manualmode.sh -e staging -c app` OK, Health 200.
- **W2 #27:** gemerged `3509e81b` (2026-11-10). **Prod** noch b75 → Deploy für b76.
- **W3 #28:** gemerged `05c7dd1d`; Staging **Backend** redeploy OK. Mistral Classic **12/12** (Pacing) + Practice **9/9/9** — `PLANS/w3-regression-results.md`.
- **W5 #30:** Prisma 7.10.1 merged; Staging backend verified.
- **Version UI:** `f429d649` — health + Burger/About; Staging **b77** deploy OK.
- **Production (2026-11-12):** `./deploy-manualmode.sh -e production` — Parität mit Staging **b77**; Health 200, DB connected.
- **W6 (2026-11-12):** React **19.3** — `dd6fa9fd`, Staging **b78** deploy OK — `PLANS/w6-react-19.md`.
- **Nächster Schritt:** Staging-Smoke (Login, Classic, UI); Prod-Pull für W6 erst nach Soak.

## Session handoff (2026-11-07) — Software-Stack-Updates (Plan + W2-Scan)

- **Plan:** `PLANS/software-stack-update-plan.md` — Priorisierung P0–P3, Tests, Rollback (`deploy-manualmode.sh` / `.previous-version`), Staging-Playbook, Wellen W1–W6.
- **W2-Scan (Build-75-Baseline, `npm ci` + `npm outdated`):** Patch/Minor in Range — Frontend u. a. Capacitor filesystem/share, RevenueCat **13.8.x** (nicht 14.x), `@react-pdf/renderer`, `lucide-react`; Backend `express-rate-limit`, `marked`, `pm2`, `supertest`. **LLM-Minors** (`@google/genai` 2.32, `@mistralai` 2.7) bewusst **W3** (Regression). Audit: **0 high/critical**; moderate nur Jest/glob (dev/test).
- **Umsetzung W2 (ausstehend):** drei PR-Schritte (Backend → Frontend ohne Mobile → Capacitor/RC); Staging-Soak; **Build 76** beim Prod-Deploy nach W2 — nicht zwingend schon während Staging-Tests (siehe Plan).
- **Doku-PRs:** Stack-Plan (#24) / W2-Scan-Doc (#25) können noch nicht in `main` sein — Inhalt im Plan-File bzw. PR beschrieben.

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
- [ ] **W2 Stack — Soak + Prod** (siehe `PLANS/software-stack-update-plan.md`): PR-1–3 umgesetzt auf Branch `cursor/w2-pr2-pr3-482a`; Staging-Deploy + 24h Soak; Prod-Freigabe
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
