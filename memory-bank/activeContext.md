# Active Context

## Current Status
**Version:** 2.0.1
**Branch:** `main`
**Staging:** Deployed **2026-07-24**, build **40**; v2.0.1 — https://mc-beta.manualmode.at — self-hosted coach avatars live in BotSelection (`/api/bots` → `/avatars/*.png`); WelcomeScreen orbit order by bg color. Registry pull fails; **frontend + backend streamed** when pull fails (Build **40** verified live).
**Production:** Deployed **2026-04-28**, Build **13**, v2.0.1 — **hinter Staging** (Staging Build **40**, 2026-07-24) bis nächster Prod-Deploy. — https://mc-app.manualmode.at
**App Store:** LIVE v2.0.1 — "MyCoach AI" in AT/DE/CH

**Memory Bank:** The assistant updates these files **proactively** after substantive work, commits, deploys, or server verification — no separate "please update memory bank" request needed (see `systemPatterns.md` #21).

## Recent Changes (2026-07-24 — Staging avatar fix, Build 40)

### BotSelection “new avatars not visible” (staging Build 39 → 40)
- **Root cause:** Frontend had self-hosted PNGs in `dist/avatars/` and WelcomeScreen used `constants.ts`, but **staging backend was stale** — `/api/bots` still returned legacy Dicebear URLs. BotSelection loads avatars from the API, so coach cards showed old/missing images.
- **Not the issue:** Static `/avatars/*.png` already served `image/png` (not SPA `index.html`); WelcomeScreen bundle already included clock-order avatar slots.
- **Fix:** `./deploy-manualmode.sh -e staging -c app` + **manual backend image stream** (registry pull returns HTML); force-recreate backend container on new image digest. Verified `/api/bots` → `/avatars/kenji.png` etc.; Build **40** live.

## Recent Changes (2026-07-23 — Seasonal decorations removed + visual modernization plan)

### Seasonal decoration animations removed (all themes)
- **Owner decision:** butterflies, snowflakes, blossoms, and falling leaves removed from all themes; seasonal *color* themes remain.
- **Deleted components:** `ChristmasSnowflakes.tsx`, `SpringBlossoms.tsx`, `SummerButterflies.tsx`, `AutumnLeaves.tsx`; renders removed from `WelcomeScreen`, `LoginView`, `RegisterView`, `LandingPage`.
- **CSS:** all four animation blocks (`snowfall`, `blossom-fall`, `leaf-fall`, `butterfly-flutter` + particle classes) removed from `index.css`.
- **dateUtils:** `isChristmasSeason`, `isSpringSeason`, `isSummerSeason`, `isAutumnSeason` removed (decoration-only); `getCurrentSeason`/`isWinterSeason`/`getSeasonalColorTheme` kept (drive color themes). Tests updated (14 passing); `tsc --noEmit` clean.
- **Skill updated:** `i18n-and-theming/SKILL.md` — decorations documented as removed; do not re-add without explicit request.

### Entry screens + selection hub fix (2026-07-24, `6148b6c`, staging build 35)
- **LandingPage:** 3-card hub (context / conversation / interview) always shown first; `existingContext` loaded only on card click (fixes regression skipping cards).
- **IntentPickerView:** 3-column card grid, featured coaching card (`.action-card-featured`), logo + subtitle header.
- **WelcomeScreen:** mockup hero subtitle + orbiting coach avatars restored.
- **CSS:** stronger dual corner gradients; dark-teal featured card gradient for white text contrast.
- **Deploy hardening:** `server.js` SPA fallback returns 404 for static extensions (incl. `.js`/`.css`); `deploy-manualmode.sh` streams frontend when avatars missing **or build number stale** after failed registry pulls.
- **iOS:** `npm run build && npx cap sync ios` 2026-07-24 — BUILD_NUMBER **35**; Capacitor SPM **8.4.2**.

### Visual modernization — Phase 4 complete (2026-07-23, `2665e69`, staging build 33)
- **Committed + deployed:** paywall/auth semantic tokens, teal-tinted dark brand palette, BotSelection Lucide section headers, ChatView meditation stop styling.
- **Remaining (optional):** Gloria/Max/Victor avatar style consistency; secondary screens token migration; owner E2E sign-off.

### Visual modernization — Phases 1–3 + 3d complete (2026-07-23)

## Recent Changes (2026-07-15 — Security & Infrastructure Hardening)

### Security Improvements (deployed to staging, Build 30)
- **Sensitive data sanitization:** `sanitizeUserForClient()` allowlist function in `utils/userHelpers.js` — applied to all user-returning routes (`auth.js`, `data.js`). Prevents accidental exposure of `activationToken`, `passwordResetToken`, `unsubscribeToken`, `lifeContext`, `tokensInvalidatedAt`, and any future columns.
- **DB-backed token invalidation:** `tokensInvalidatedAt DateTime?` column added to `User` (migration `20260715000000_add_tokens_invalidated_at`). `services/tokenInvalidation.js` now writes to DB on logout/password-change — cross-worker revocation guaranteed in PM2 cluster mode. In-memory cache retained for performance with DB as source of truth.
- **Auth middleware async:** `middleware/auth.js` is now `async` and `await`s `isTokenInvalidated`. `optionalAuth.js` uses `isTokenInvalidatedSync()` (in-memory only, safe for optional paths).
- **Tests updated:** `middleware/__tests__/auth.test.js` mocks tokenInvalidation, async middleware calls; all 557 backend tests passing.

### Package Updates (2026-07-15 — Tier 1 + Tier 2)
- **Frontend (`npm update` + `npm audit fix`):** 0 vulnerabilities. 153 packages updated within semver ranges (Capacitor 8.0.x→8.4.x, framer-motion 12.34→12.42, React PDF 4.3→4.5, autoprefixer, postcss, tailwindcss/typography, etc.). `browserslist-db` confirmed up to date.
- **Backend (`npm update` + `npm install pm2@7.0.3`):** 0 vulnerabilities. pm2 upgraded 6.0.14→7.0.3 (major; safe: CJS project, Node 22 ≥ required 18, ecosystem.config.js unchanged). Key security fixes in pm2 7: CVE-2025-5891 ReDoS, CVE-2026-27699 proxy-agent, command injection in WebAuth/PM2IO/tools, prototype pollution in Configuration.
- **Dockerfiles (frontend + backend):** Base images upgraded `node:22-bullseye` → `node:22-bookworm` (Debian 12 — active security support until 2028; Bullseye EOL Nov 2026). Backend slim stage: added `openssl` to apt-get install (bookworm-slim does not ship OpenSSL; required by Prisma query engine for libssl.so.3).
- **Server OS (`dnf upgrade -y`):** 493 packages upgraded — kernel 5.14.0-687.25.1.el9_8, OpenSSL 3.5.5, Podman 5.8.2, glibc 2.34-272, openssh 9.9p1, curl 7.76.1, crypto-policies 20260224, and more. AlmaLinux 9 → 9.8.

### Backup Script Fix (2026-07-15)
- **Duplicate log lines fixed:** `log()` function in `/usr/local/bin/backup-databases.sh` now writes directly to file (`>>`) and echoes to stdout separately. Cron changed from `>> log 2>&1` to `2>> log` — eliminates double-write. Verified with live test run: 0 duplicates.
- **Backup health confirmed:** Daily run at 06:00 UTC — today's production dump `production-20260715-060002.sql.gz` (184 KB, gzip integrity OK, 14 tables). 7-day retention active (16 files, 2.8 MB).

### Docker cross-platform lockfile fix (2026-07-15, Build 31)
- Both Dockerfiles changed from `npm ci` → `npm install` (with `--ignore-scripts` in backend): macOS arm64-generated `package-lock.json` lacks linux/amd64 optional entries (`@emnapi/core@1.11.2`, `@emnapi/runtime@1.11.2`) that `npm ci` strictly requires. `npm install` resolves them at build time without breaking pinned versions.
- **Podman VM note:** Deploy requires chaining `podman machine start → podman machine ssh -- "podman system reset -f" → deploy-manualmode.sh` in ONE shell invocation. gvproxy dies between separate shell calls. If overlay storage becomes corrupted mid-build, `podman machine ssh -- "podman system reset -f"` inside the same chain clears it.

### Tier 3 Session 1 — Trivial majors (2026-07-15, Build 32)
- **dotenv 16→17:** `dotenv.config({ quiet: true })` in `server.js` — suppresses new v17 console notice when `.env` is absent (Docker)
- **bcryptjs 2→3:** CJS `require()` API unchanged; 557 backend tests pass
- **marked 17→18:** `setOptions()` + `marked.parse()` still intact; admin newsletter route verified
- **@revenuecat/purchases-capacitor 12→13:** Breaking changes are Android-only; iOS-only project — zero code changes

### Skipped (Tier 3 — remaining sessions)
- Session 2: @google/genai 1→2
- Session 3: @mistralai 1→2 (ESM-only → dynamic import needed)
- Session 4: express 4→5 (path-to-regexp breaking changes, codemod)
- Session 5: React 18→19 + @vitejs/plugin-react 4→6
- Session 6: Prisma 5→7 (driver adapter architecture change — highest risk)

## Milestone: App Store Launch (2026-03-07)

MyCoach AI v2.0.0 is live in the Apple App Store for Austria, Germany, and Switzerland. Regional restriction is intentional — solo developer needs manageable support timezone coverage.

### App Store Review Process
- **First submission:** Rejected for Guideline 3.1.2(c) — missing Terms of Use (EULA) link and subscription information in paywall
- **Fix:** Created `public/terms.html` (DE/EN), added Nginx route, added Privacy/Terms links in `NativePaywall.tsx`, updated App Store description with links
- **Resubmission:** Approved within 24h
- **Release:** Automatic release after approval

### Key Files for App Store Compliance
| File | Purpose |
|------|---------|
| `public/privacy.html` | Privacy Policy (served at `/privacy`) |
| `public/support.html` | Support page (served at `/support`) |
| `public/terms.html` | Terms of Use / EULA (served at `/terms`) |
| `DOCUMENTATION/APP-STORE-METADATA.md` | All metadata (description, keywords, review notes, URLs) |
| `components/NativePaywall.tsx` | Links to Privacy Policy and Terms of Use |

### Test Account (Production)
- Email: `premium@manualmode.at`
- Pre-filled Life Context (Sarah) and OCEAN personality profile
- Used for Apple review

## Recent Changes (v2.0.1 — Gamification fix, 2026-05-30)

### Bonus XP double-award fix (Build 29)
- **Bug:** After ending a session and clicking "Continue with same coach", immediately ending again (no new messages) triggered a second session analysis on the same chat history, re-awarding XP and re-showing the +50/+25 bonus banners.
- **Fix:** New `baselineMessageCount` state tracks how many messages existed at the last continue point. Guard and XP calculation now use `effectiveNewMessages = userMessageCount - baselineMessageCount`. Zero effective new messages → early exit to bot selection, no analysis, no XP.
- **Secondary fix:** `isSessionQualified` prop added to `SessionReview` — bonus banner (+50 XP Formal Close / +25 XP Goal Accomplished) only renders when the session actually qualified (`messageCount >= 5`).
- **Files:** `App.tsx` (state + logic), `components/AppViewRouter.tsx` (prop passthrough), `components/SessionReview.tsx` (display guard).

## Recent Changes (v2.0.1 — Bekky + Dan, 2026-05-03)

### Referral UI hardening + pre-seed + Dan openings + DPC (Build **28**)
- **Frontend:** `utils/messageMarkers.ts` — unwrap inline-code `REFERRAL`, spaces after colon, fullwidth brackets; `stripInterCoachHandoffMeta`; tests in `utils/__tests__/messageMarkers.test.ts`. `components/ChatView.tsx` — `initialFetchInitiated` resets on `bot.id` so pre-seed runs after coach switch.
- **Backend:** `routes/gemini/chat.js` — `skipMistralBehaviorRules` when `isPreSeededTopic`. `bots.js` — Bekky handoff without stage directions; Dan EN/DE session-opening variant pools + newcomer hint. `services/dynamicPromptController.js` — restricted adaptive injection for `dan-clean-language` (pacing/courtesy only).
- **Rollout:** `d607680` + `17a53ef` (build 28 sync). **Staging:** Build **28** deployed **2026-05-03**. **Xcode:** `npm run build && npx cap sync ios` run locally after commit so `ios/App/App/public/` matches this build.

### Bekky thought-audit upgrades + referral handoff + Dan (Clean Language)
- **Backend:** \`meaningful-conversations-backend/bots.js\` — Bekky EN/DE: Thought Audit Log continuity prompt, pace calibration, thought-type routing with trailing \`[REFERRAL:…]\`, flexible turnaround examples (1–2), Phase 4 specificity + optional Life Context step + paired \`[AUDIT_TASK]…[/AUDIT_TASK]\`; DE duplicate header removed; **Dan** (\`dan-clean-language\`, Clean Language EN/DE, referral to Bekky, optional meditation markers) — **\`accessTier: 'client'\`** (nur Klienten / Freischaltung / Admin).
- **Frontend:** \`utils/messageMarkers.ts\` — strip referral + audit blocks **after** meditation parsing; \`Message\` gains \`referralBotIds\` / \`auditTaskPayload\`; \`ChatView\` shows localized “Continue with …” buttons → \`handleReferralSwitch\` pre-seeds target coach session; session analysis merges Bekky audit payloads into \`nextSteps\` before LC merge (\`App.tsx\`). **BotSelection:** Dan unter Klienten-Sektion (\`clientOnlyBotIds\`).
- **Rollout:** \`c05a762\` (Dan client-tier + UI); später **Build 28** (siehe Abschnitt „Referral UI hardening“ oben). **Production:** Build **13** bis Prod-Cutover. **Xcode:** nach Deploy erneut \`npm run build && npx cap sync ios\` für konsistente Build-Nummer (\`ios/App/App/public/\` gitignored).

## Recent Changes (v2.0.1 — Build 13, 2026-04-28/29)

### Registered Annual (mc.registered.yearly.v2) — vollständig live (2026-04-29)
- Apple-Genehmigung erhalten 2026-04-29; in Production getestet und verifiziert ✅
- Apple Server Notifications bereits konfiguriert (Production + Sandbox) ✅
- Migration Registered Lifetime → Registered Annual vollständig abgeschlossen

### Registered→Premium upgrade: accessExpiresAt fallback fix (2026-04-28)
- **Bug:** Beim Premium-Kauf wurde `accessExpiresAt` immer auf das Premium-Ablaufdatum gesetzt — auch wenn die Registered-Subscription länger läuft. Nach Premium-Ablauf verlor der User den Registered-Zugang statt darauf zurückzufallen.
- **Fix:** `purchase.js` (`applyProductEffect`), `appleIAP.js` (`buildUserUpdate`), `NativePaywall.tsx` (2× optimistischer Patch): `accessExpiresAt` wird nur dann vorgerückt, wenn das neue Premium-Datum *später* als das bestehende `accessExpiresAt` liegt.

## Recent Changes (v2.0.1 — Build 12, 2026-04-22)

### GDPR-safe activity tracker + spring animation off (2026-04-22)
- **`services/activityTracker.js`** (neu): anonyme In-Memory-Timestamps pro Auth-Request; kein User-Bezug, kein DB-Schreiben, flüchtig
- **`middleware/auth.js`**: `recordActivity()` nach jeder validen JWT-Anfrage
- **`routes/admin.js`**: `GET /api/admin/stats/activity` (adminAuth) — `{ requestsLast5Min, requestsLast15Min, requestsLastHour }`
- **`components/AdminView.tsx`**: Live-Activity-Badge im Header (Polling 30s, grün/amber) zum sicheren Deploy-Window-Abschätzen
- **`utils/dateUtils.ts`**: `isSpringSeason()` gibt `false` zurück — Kirschblüten-Animation deaktiviert bis zur manuellen Reaktivierung

## Recent Changes (v2.0.0)

### Cursor skill: 132 content structure (2026-04-06)
- **Skill:** `.cursor/skills/meaningful-conversations/132-content-structure/SKILL.md` — **1** Kernaussage, **3** tragende Punkte, **2** Schlüsse/nächste Schritte; kombinierbar mit What/So what/Now what und LinkedIn-Longform.

### CORS / www staging (2026-04-07)
- **Symptom:** Login auf **`https://www.mc-beta.manualmode.at`** zeigte **HTTP 500** (Browser-`Origin` www, `FRONTEND_URL` nur Apex).
- **Fix:** `expandFrontendUrlForCors()` in `meaningful-conversations-backend/server.js` — Staging-Deploy **Build 11** abgeschlossen (`deploy-manualmode.sh -e staging`, exit 0).

### Nginx (2026-04-07)
- Production: `server_name` erweitert um `www.mc-app.manualmode.at`; `update-nginx-ips.sh` generiert Production (und Staging) mit `listen [::]:443` für IPv6. **`deploy-manualmode.sh` installiert `server-scripts/update-nginx-ips.sh` automatisch** nach `/usr/local/bin/` und spiegelt nach `/opt/manualmode-staging|production/` (für Restart-Skripte). Zertifikat ggf. um `-d www.mc-app.manualmode.at` erweitern.
- **`update-nginx-ips.sh`** schreibt wieder **Port-80-Blöcke** (HTTP→HTTPS), damit Deploys die Redirects nicht entfernen.
- **2026-04-08:** `npm audit fix` für Root + Backend-Lockfiles; Frontend-Audit 0; Backend verbleibend: pm2 (low, kein Fix laut npm) — **bewusst akzeptiert**, dokumentiert in `systemPatterns.md` §8 / `TROUBLESHOOTING-INDEX.md` (Security & npm audit).

### Process & Cursor rules (2026-03-20)
- Memory Bank rule refresh: tiered reading, how Memory Bank relates to `DOCUMENTATION/` and skills; post-commit checklist consolidated in `.cursor/rules/memory-bank.mdc`; `memory-bank/README.md` added.
- **Working agreement:** Owner delegates routine memory-bank / documentation / skills maintenance to the assistant and does not review every doc edit; assistant keeps these current after substantive work (see `systemPatterns.md` Decision #21).
- **Portable template:** `templates/portable-memory-bank/` — generic six-file bank + Cursor rule + `INSTALL.md` for copying into other repos; indexed in `DOCUMENTATION/DOCUMENTATION-STRUCTURE.md`.

### Database (2026-04-05)
- **Drift:** `User.preferredLanguage` — Staging NOT NULL vs Production nullable (Migration `20251120_add_newsletter_improvements` ohne `NOT NULL`).
- **Fix:** `prisma/migrations/20260405120000_user_preferred_language_not_null` — `UPDATE … WHERE NULL` dann `MODIFY NOT NULL` (datensicher).
- **Ops:** Backend startet `prisma migrate deploy` (`server.js`). Staging + Production **2026-04-05:** laufen Backend-Image mit Migration `20260405120000_…`; DB sollte auf beiden nach Start angeglichen sein.

### Docs & marketing (2026-04-04)
- **Committed:** `DOCUMENTATION/USP-POSITIONING.md`, `NEWSLETTER/NEWSLETTER-v2.0.0-LINKEDIN.md`, newsletter body updates, `templates/portable-memory-bank/`, memory-bank edits; removed large `.key` binaries; `.gitignore` adjustments.
- **USP follow-up:** White-Label-Abschnitt faktisch korrigiert (Selbstbetrieb, Kosten/Aufwand, kein „null Infrastruktur“); committed + gepusht.
- **`DOCUMENTATION/UX-FLOWS.md`:** Auf v2.0.1 gebracht (Intent-Locales, Highlight ~3,5s, NativePaywall/Legal, Code-Verweise).
- **Staging:** Redeployed v2.0.1 (`-c app`); `BUILD_NUMBER` → 5 (auto sync commit `chore: build 5 sync`).
- **Staging vs Production:** `./deploy-manualmode.sh -e production` **2026-04-05** — zieht dieselben `:2.0.1`-Images wie zuletzt auf Staging gebaut (Build 6); kein App-Store-Submit.

### Life Context Editor (2026-03-01 – 2026-03-05, Landing UI 2026-07-24)
- **Markdown editor with preview toggle** (`LifeContextEditorView.tsx`): Edit/preview mode for Life Context files, with download as .md and PDF
- **LandingPage 3-card hub (2026-07-24):** Cards for context / new conversation / interview always shown first; `fileContent` starts empty (never preloaded from `existingContext`). Card 1 loads saved LC on click; upload drop zone below cards. Preview state still offers Edit/Extend + interview CTAs via `showEdit` / `isTemplateContext`.
- **Content-based template detection** (`AppViewRouter.tsx`): Analyzes LC markdown line-by-line to determine if it's a template or enriched context
- **Gloria context extension** (`chat.js`, `session.js`): Gloria now extends existing LCs instead of creating from scratch, with gap-filling instructions
- **Auto-save on creation** (`App.tsx`): Life Context saved to server immediately after questionnaire completion or file upload for registered users

### App Store Preparation (2026-03-01 – 2026-03-07)
- **Version 2.0.0**: Major version bump across all 5 version files
- **iOS backend target**: Defaults to production (`services/api.ts`), with `?backend=staging` override for testing
- **Static pages**: `privacy.html`, `support.html`, `terms.html` served via Nginx
- **NativePaywall legal links**: Privacy Policy and Terms of Use links (Apple requirement)
- **Platform-conditional content**: UserGuide, FAQ, VoiceSelectionModal adapt for native iOS vs. web
- **"Explore Relevance" variation**: Coaching bots now vary phrasing of contracting questions across sessions
- **Screenshot preparation**: Resized to exact App Store requirements (1284x2778 iPhone, 2048x2732 iPad)

### Mistral AI Provider Quality & Coaching Flow (2026-02-28)
- Mistral-specific behavioral overlay with session contracting, conciseness rules
- Post-processing filter for meta-commentary suppression
- Pre-seeded topic detection from TopicSearch
- GDPR-consistent AI routing across all endpoints

### macOS Compatibility Removed (2026-03)
- **Scope:** iPhone and iPad support only. Web version covers Mac use case.
- **Code cleanup:** Removed `isNativeMacOS` from `nativeTtsService.ts`, `platformDetection.ts`; removed all Mac-specific TTS workarounds in `useTts.ts` (retry, warmup, handleOpenVoiceModal branch); removed `warmupAudioIfNeeded` and its ChatView calls.
- **App Store Connect:** To disable Mac availability: Pricing and Availability → iPhone and iPad Apps on Apple Silicon Mac → uncheck "Make this app available".
- **Validation:** Tested on both iPhone and iPad — local voices (AVSpeechSynthesizer) work well, stable.

### TTS Stuck Spinner Fix (2026-03-10)
- **Root cause:** `isLoadingAudio` stuck `true` when `audio.play()` rejected or backend returned 500 during streaming sentence synthesis
- **Fixes:** Corrected `processStreamingSynthQueue` catch block (prevent double-push, reset loading state on first-sentence failure), added `setIsLoadingAudio(false)` to all `play().catch()` handlers, added 15s safety timeout watchdog
- **Documented in:** `.cursor/skills/meaningful-conversations/tts-debugging/SKILL.md`

### PayPal Invoice Automation (2026-03-08)
- Automatic Kleinbetragsrechnung (simplified invoice) sent via Mailjet after PayPal purchase
- Sequential invoice numbers (`MC-YYYY-NNNN`), tracked via `invoiceNumber` / `invoiceSentAt` fields on `Purchase` model
- Compliant with Austrian Kleinunternehmerregelung (§ 6 Abs. 1 Z 27 UStG)

### TTS Performance & Resilience (2026-02-27 – 2026-02-28)
- Persistent Piper models (~8x speedup), warmup endpoint, progressive sentence synthesis
- Skip failed sentences instead of permanent mode switch
- Opus audio compression (~7x smaller)

## Recent Changes (Presentation Templates — 2026-05-11)

### WLC / MC Master Template polish (build_mc_master.py)
- **Italic quote marks:** Both opening and closing `"` marks in the Zitat layout are now italic (`i="1"`). `_italicize_quote_marks()` post-processes the injected opening mark; `_add_closing_quote()` sets italic directly. Applied to all three themes.
- **Blank (Leer) layout background:** `_set_blank_layout_background()` injects a full-slide `<p:sp>` solid rectangle at Z-order 0 — `#111827` (dark), `#FFFFFF` (light/winterlight) — using the correct 16:9 slide width `12191695 × 6858000` EMU. `<p:bg>` approach was abandoned as Keynote ignores it on layout XML.

## Active Tasks
- [ ] **Console.log Cleanup:** ~43 frontend files with hundreds of console.log calls. TTS debug logs (`[TTS-DBG]`) intentionally kept for stability monitoring.
- [ ] W4F: Update DNS for `w4f-beta.manualmode.at`, then run `certbot`
- [ ] iOS: Set up In-App Purchase products in App Store Connect, Notifications URL
- [ ] Android Capacitor project setup
- [ ] PayPal Monthly Subscription on web (3.90 EUR/month)
- [ ] Formal WCAG accessibility audit
- [ ] Self-hosted SLM as Gemini replacement (milestone: >1000 paying users)
- [ ] Coaching Framework Roadmap: Clean Language bot, The Work bot, NLP Meta-Modell lens, Logische Ebenen lens
- [ ] Presentation Evaluator (Premium Feature, backlog)
- [ ] Micro Learnings: Integration Management Section (Nobody → proaktive Vorschläge, Links zu kuratierten Inhalten)

## Decision Log
- **2026-04-29:** `mc.registered.yearly.v2` von Apple genehmigt; Production verifiziert; Migration Registered Lifetime → Annual vollständig abgeschlossen.
- **2026-04-22:** Staging + Production auf Build 12 (v2.0.1) — GDPR-Activity-Tracker + Spring-off; kein App-Store-Submit nötig (Web/PWA-only-Änderungen).
- **2026-04-05:** Production redeploy — Registry-Images wie Staging Build 6 (`2.0.1`); `preferredLanguage`-Migration per Backend-Start; Healthchecks grün.
- **2026-04-04:** Memory Bank maintenance is **routine assistant duty**: after server checks (e.g. staging/prod image drift), Q&A that establishes material facts, or doc/session outcomes — update `activeContext` / `progress` / `#21` as needed without the owner asking each time.
- **2026-03-20:** Documentation stewardship delegated to the AI assistant — Memory Bank, `DOCUMENTATION/`, and Cursor skills updated proactively without expecting owner line-by-line review (`systemPatterns.md` #21).
- **2026-03-07:** App Store availability limited to AT/DE/CH — manageable support timezone for solo developer. Can expand later via App Store Connect.
- **2026-03-07:** Apple's standard EULA used (not custom). Terms of Use link in App Store description satisfies Guideline 3.1.2(c).
- **2026-03-05:** Life Context auto-saved to server immediately after creation (questionnaire or file upload) for registered users — prevents data loss on logout.
- **2026-03-05:** Production deployments require explicit user approval — active sessions are disrupted. Default to staging-only.
- **2026-03-03:** iOS app defaults to production backend. Staging override via `?backend=staging` URL parameter.
- **2026-02-28:** Mistral requires separate behavioral overlay instead of separate prompts.
- **2026-02-28:** TTS debug logs kept intentionally for stability monitoring.
- **2026-02-26:** Server IP externalized, git history scrubbed.