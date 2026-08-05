# Active Context

## Current Status
**Version:** 2.5.5
**Branch:** `main`
**Staging:** Deployed **2026-08-05**, Build **3**, v2.5.5 — https://mc-beta.manualmode.at (health OK; coachee gender eval + unique avatars finley/rowan live)
**Production:** Deployed **2026-08-05**, Build **2**, v2.5.5 — https://mc-app.manualmode.at (health OK; parity with staging images)
**App Store:** iOS **2.5.0 (6) live** (AT/DE/CH — **not** U.S. storefront); **2.5.4** ASC — review account `premium@manualmode.at` **Premium+ until 2028-08-04** on production. **ASC English localization:** **English (Canada)** — not English (U.S.).
**Xcode:** `CURRENT_PROJECT_VERSION=2` in repo (`BUILD_NUMBER` after deploy sync)

**Deploy default:** `deploy-manualmode.sh` + `Makefile deploy-staging` default to `-c app` (frontend+backend, TTS re-tag only). Use `-c all` only when `tts-service/` changed.

## Recent Changes (2026-08-05 — P5 test coverage)

- **Frontend:** Fixed vitest→Jest in `botGender.test.ts`, `ttsServiceVoice.test.ts`; widened `collectCoverageFrom` (utils, services, hooks, context, config); coverage floors + `coverageProvider: v8`
- **Backend:** Widened coverage to routes/middleware/practice/utils; PayPal webhook fail-closed tests; Apple IAP JWS + notification route tests; coverage floors (~40% statements baseline)
- **No deploy**

## Recent Changes (2026-08-05 — Repo improvements audit)

- **Security:** PayPal webhook fail-closed without `PAYPAL_WEBHOOK_ID`; Apple S2S notification JWS verification (`@apple/app-store-server-library`); startup secret validation; JSON body 1mb limit; MariaDB localhost-only bind in compose
- **CI/DX:** `npm run build` in CI, locale parity script, audit level high, Dependabot, `make test`/`make ci`, root `npm run ci`
- **Docs:** Fixed broken links, TTS/PDF/VERSION refresh, memory bank sync; new skills (tts-voice, auth-access, email-transactional, pdf-export, practice-coaching)
- **No deploy**

## Recent Changes (2026-08-05 — Cursor agent workflow infrastructure)

- **Commit `c8528f2`:** Add Cursor agent workflow infrastructure — versioned `.cursor/rules/`, slash commands, hooks (production deploy gate, secret scan), `AGENTS.md`, `agent-workflows` skill; fix doc links to skills; extend `.gitignore` to track shared Cursor config
- **No deploy** — docs/config only

## Recent Changes (2026-08-05 — Coachee gender eval + unique avatars)

- **Evaluate:** `buildPracticeScenarioSummary()` — `coacheeGender` + Pronomen-Regel in Method/Contracting/Free-Play Eval-Prompts (DE/EN)
- **Avatars:** 12/12 eindeutig pro Auswahl; neue `public/avatars/finley.png`, `rowan.png` (Rowan regen — upright head, auburn hair, distinct from max); Methoden-Remap (Chris→mike, Priya→gabrielle, Jamie→gloria, Robin→sam)
- **Shared:** `practice/avatarGender.js`; `coacheePrompt` → Klientin/Klient; `utils/botGender.ts` erweitert
- **Tests:** 18/18 (avatarGender, coacheePrompt Finley, practiceEvaluate contracting gender)
- **Deploy:** `./deploy-manualmode.sh -e staging -c app` — Build **3**; commit `ab5782b` sync; health OK

## Recent Changes (2026-08-05 — Staging + Production v2.5.5 Build 2)

- **Commit `468a70e`:** chore: release v2.5.5 — STT pause fix, TTS ONNX fallback, coachee role guard bundle
- **Commit `4e61364`:** chore: restore v2.5.5 build 1 sync after mistaken 2.5.4 deploy
- **Staging deploy:** `./deploy-manualmode.sh -e staging -c all` — ~23 min; TTS rebuild with `sanitize_text_for_piper`; health OK
- **Production deploy:** `./deploy-manualmode.sh -e production` — pull-only 2.5.5 images; health OK
- **Parity:** Staging + Production both on v2.5.5-b2

## Recent Changes (2026-08-05 — Staging v2.5.4 Build 11 STT + TTS fixes — superseded by 2.5.5)

- **Commit `b0f0c45`:** fix(stt): preserve desktop voice transcript across pauses — `webSpeechResultProcessing.ts` + incremental WebSpeech results; Android path unchanged; 7 unit tests
- **Commit `c963ce5`:** fix(tts): recover from Piper ONNX failures on edge-case text — `sanitize_text_for_piper`, sentence-chunk fallback, WAV concat in `tts-service/app.py`; NFKC normalization in backend `ttsService.js`; client streaming fallback to local speech in `useTts.ts`
- **Commit `2f39435`:** fix(tts): resolve `speakFallbackRef` readonly TypeScript error (blocked first full deploy)
- **Commit `4c33724`:** chore build 11 sync (deploy script auto-commit after successful staging deploy)
- **Staging deploy:** `./deploy-manualmode.sh -e staging -c all` — full rebuild (TTS `app.py` changed); first attempt failed at frontend `tsc`; second attempt succeeded (~18 min); health OK; TTS container has `synthesize_with_piper_safe`; Piper health OK
- **Production:** superseded by **v2.5.5 Build 2** deploy (same session)
- **Context:** Helene (`helene@arndgen.de`) Practice Voice Mode on prod — STT one-word fragments on Chrome/macOS; 32× TTS HTTP 500 (Piper ONNX `GatherElements`/`Reshape`/`ScatterND` on specific text → silent voice mode)

## Recent Changes (2026-08-05 — Staging v2.5.4 Build 10 coachee role guard)

- **Commit `7e05d22`:** fix(practice): add coachee role guard against coach-language drift — `COACHEE_ROLE_GUARD` (DE/EN) in `coacheePrompt.js`; dev `/api/gemini/test/simulate-coachee` aligned; 9/9 `coacheePrompt.test.js` pass
- **Staging deploy:** `./deploy-manualmode.sh -e staging -c backend` — backend-only (frontend `-c app` blocked by unrelated `useTts.ts` TS2540); health OK; Build **10** unchanged
- **Context:** Helene Practice Voice — AI coachee was mirroring/scaling like a coach; guard forbids mirroring, permission/meta questions, scaling, session control

## Recent Changes (2026-08-05 — Staging v2.5.4 Build 10 STT-only deploy)

- **Commit `62c0417`:** chore build 10 sync (deploy script)
- **Staging deploy:** `./deploy-manualmode.sh -e staging -c frontend` — Build 10; health OK (superseded by Build 11 full deploy above)

## Recent Changes (2026-08-05 — Staging + Production v2.5.4 Build 9)

- **Commit `663d1a4`:** fix(tts): correct Sam gender to male + replace broken MLS voice with Eva K
  - `sam-forward-focused` removed from `FEMALE_BOT_IDS` (frontend) and `femaleBots` (backend) — Sam's avatar is male; commit `5a33eb4` introduced the regression
  - Backend `VOICE_MODELS.de.female` switched from `de_DE-mls-medium` → `de_DE-eva_k-x_low`: MLS is 236-speaker, was always called without `speaker_id`, defaulting to speaker 0 (random corpus voice = "drunken burble"). Eva K is single-speaker, no speaker_id needed.
  - Backend `voiceMap` updated: `de-mls` removed, `de-eva` → `de_DE-eva_k-x_low` (short ID now routes correctly end-to-end)
  - Missing `vitest` import added to `ttsServiceVoice.test.ts`
- **Staging deploy:** `./deploy-manualmode.sh -e staging -c app` — Build 9; health OK
- **Production deploy:** `./deploy-manualmode.sh -e production` — Build 9; health OK

## Recent Changes (2026-08-05 — Staging + Production v2.5.4 Build 7)

- **Commit `76d1bef`:** chore build 7 sync (deploy script auto-commit)
- **Staging deploy:** `./deploy-manualmode.sh -e staging -c app` — success (~5 min); health OK; `sw.js` `v2.5.4-b7`
- **Production deploy:** `./deploy-manualmode.sh -e production` — success (~56 s); pull-only; health OK; `sw.js` `v2.5.4-b7`
- **Parity:** Staging + Production both on v2.5.4-b7 — coach greeting language fix now live on production API (fixes EN UI + DE life context bug for iOS Build 6)

## Recent Changes (2026-08-04 — Staging v2.5.4 Build 6)

- **Commit `06b53ba`:** Fix coach greeting language mismatch (EN UI + German life context) — `utils/language.js`, chat/practice routes, `aiProviderService`, ChatView locale init; ASC iPhone screenshots + `prepare-asc-screenshots-from-assets.py`
- **Commit `8be0877`:** chore build 6 sync (deploy script auto-commit)
- **Staging deploy:** `./deploy-manualmode.sh -e staging -c app` — success (~9 min); TTS re-tag only; health OK; `sw.js` `v2.5.4-b6`
- **iOS:** `npm run build && npx cap sync ios` (production API) — success; MARKETING_VERSION 2.5.4, CURRENT_PROJECT_VERSION 6

## Recent Changes (2026-08-04 — Production v2.5.4 Build 5 patch)

- **Production deploy:** `./deploy-manualmode.sh -e production` — success (~59 s); pull-only (same images as staging); health OK; `sw.js` `v2.5.4-b5`
- **Parity:** Staging + Production both on v2.5.4-b5 (backend digest `433c9dbc6db3`, frontend `cc087570009d`)

## Recent Changes (2026-08-04 — Staging v2.5.4 Build 5 patch)

- **Commit `0138954`:** Fix German method suggestion labels + expand phonetic dictionary for TTS (UI `getFrameworkDisplayName`; backend `normalizeMethodSuggestions` + localized catalog; phonetic v1.0.5)
- **Commit `95a86a7`:** chore build 5 sync (deploy script auto-commit)
- **Staging deploy:** `./deploy-manualmode.sh -e staging -c app` — success (~10 min); TTS re-tag only; health OK; `sw.js` `v2.5.4-b5`
- **iOS:** `npm run build && npx cap sync ios` (production API) — success; MARKETING_VERSION 2.5.4, CURRENT_PROJECT_VERSION 5

## Recent Changes (2026-08-04 — Production v2.5.4 Build 4)

- **Production deploy:** `./deploy-manualmode.sh -e production` — success (~64 s); pull-only (same images as staging); health OK; `sw.js` `v2.5.4-b4`
- **Parity:** Staging + Production both on v2.5.4-b4
- **Next (manual):** ASC 2.5.4 submit; EN screenshots optional later per localization

## Recent Changes (2026-08-04 — App Store review account Premium+)

- **Production:** `setup-app-store-review-account.js` — `premium@manualmode.at` → `isPremium`, `hasPracticeAccess` until **2028-08-04**, `isClient=false`

## Recent Changes (2026-08-04 — Staging v2.5.4 greeting fix + ASC screenshots)

- **Commit `60ed7f5`:** Practice framework display names — shared `getFrameworkDisplayName` helper (history, progress, resume flows); contracting sentinel label key; backend `frameworks.js` capitalization (four-stage, forward-focused)
- **Commit `0febd04`:** chore build 4 sync (deploy script auto-commit)
- **Also on staging (from prior commits):** `bef966f` Phase 2 free-play eval scores method session only; `40c4695` practice input placeholder fix
- **Staging deploy:** `./deploy-manualmode.sh -e staging -c app` — success; TTS re-tag only; health OK; `sw.js` `v2.5.4-b4`
- **Xcode:** `npm run sync:ios-staging` — web assets synced to `ios/App/App/public`

## Recent Changes (2026-08-04 — Staging v2.5.4 Build 3 patch)

- **Commit `40c4695`:** fix practice input placeholder after session opened — `ChatView` shows practice placeholder only when `chatHistory.length === 0`
- **Commit `9409c5d`:** chore build 3 sync (deploy script auto-commit)
- **Staging deploy:** `./deploy-manualmode.sh -e staging -c app` — first attempt Podman VM EOF; retry OK. TTS re-tag only. Health OK; `sw.js` `v2.5.4-b3`.

## Recent Changes (2026-08-04 — Staging v2.5.4 Build 2)

- **Commit `45a101f`:** Release v2.5.4 — practice setup accordion (single-open sections), completion pills with best score (e.g. Moderate 6/10), TTS signature voice fix for practice coachees (female Blair → Amy not Ryan), dev global rate-limit skip + TTS 100/min in staging/prod, Session phonetic → Seschn
- **Commit `c9864b4`:** chore build 2 sync (deploy script auto-commit)
- **Staging deploy:** `./deploy-manualmode.sh -e staging -c app` — success; TTS re-tagged only (no Piper rebuild); health OK; `sw.js` `v2.5.4-b2`
- **Test on staging:** Blair signature voice (female), Coach Practice setup pills, voice mode without 429s

## Recent Changes (2026-08-04 — Staging v2.5.3 Build 4)

- **Commit `643eb09`:** Default staging deploy to `-c app` (skip unnecessary TTS rebuilds) — `deploy-manualmode.sh`, `Makefile`, deployment skill
- **Commit `89a93e7`:** chore build 4 sync (deploy script auto-commit after frontend build)
- **Staging deploy:** `./deploy-manualmode.sh -e staging -c app` — first attempt hit Podman VM EOF during frontend build; retry built/pushed images; remote phase completed via `-s` after spurious syntax error post-push. TTS re-tagged only (no Piper rebuild). Health OK; `sw.js` `v2.5.3-b4`.

## Recent Changes (2026-08-04 — v2.5.3 release)

- **Commit `bdf662b`:** Release v2.5.3 — Coach Practice UX: blind contracting scenarios (anti-cheat), progress pills, on-demand Phase 2 + reminder modal, manual transcript delete, duplicate difficulty fix, GDPR copy for server-side practice transcripts
- **Commits `a24c362`, `7f2b53b`:** chore build 2/3 sync — earlier deploy attempts used old default `-c all`, causing full TTS rebuilds

## Recent Changes (2026-08-04 — Staging v2.5.2 Build 1)

- **Commit `e81b04a`:** Coach Practice voice fixes (shared STT/TTS), transcript persist + download, privacy docs
- **Commit `b3c8bd1`:** Release v2.5.2 version bump
- **Commit `c4f51d4`:** chore build 1 sync (deploy script)
- **Staging:** v2.5.2 Build **1** deployed; health OK; `sw.js` `v2.5.2-b1`

## Recent Changes (2026-08-04 — Coach Practice voice + transcript)

- **Helene (`helene@arndgen.de`) review:** 2026-08-04 practice sessions showed STT fragment capture + first-reply TTS double-speak (streaming + initial-bot `useEffect`). **Past 3 evals cannot be re-scored** — no transcript was stored before this fix.
- **Fix (staging v2.5.2-b1):** Shared `useTts` marks streaming/speak handled; shared `useSpeechRecognition` sends latest transcript ref; practice evaluate persists `transcript` in `evaluationData` + download on review; privacy/GDPR docs updated.

## Recent Changes (2026-08-04 — Sam female TTS + staging Build 5)

- **Commit `5a33eb4`:** Sam (+ Bekky) female TTS gender in `useTts` / `ChatView` / backend `ttsService`
- **Commit `161dba5`:** chore build 5 sync
- **Staging:** v2.5.1 Build **5** deployed (`-c app`); health OK
- **App Store:** No new iOS submission required for this TTS gender fix alone (see below); 2.5.1 still in review

## Recent Changes (2026-08-03 — Staging + Production v2.5.1 Build 4)

- **ASC:** iOS 2.5.1 (1) submitted for review; Premium+ (`mc.premium_plus.monthly`) Waiting for Review
- **Commit `65033da`:** chore build 4 sync (staging deploy auto-commit)
- **Staging:** v2.5.1 Build **4** deployed (`-c app`); health OK; `sw.js` `v2.5.1-b4`
- **Production:** v2.5.1 pulled from registry (no rebuild); health OK; `sw.js` `v2.5.1-b4`
- **Next (manual):** Wait for App Store approval; optional EN subscription-group localization

## Recent Changes (2026-08-03 — v2.5.1 App Store submission prep)

- **Commit `0a4a3fd`:** Release v2.5.1 — review account script (`setup-app-store-review-account.js`), APP-STORE-METADATA (ManualMode, Premium+, review notes)
- **Commit `55de8c6`:** chore build 1 sync (staging deploy auto-commit)
- **Staging:** v2.5.1 Build **1** deployed (`-c app` frontend+backend); health OK
- **Xcode:** Production API build + `cap sync ios` OK — **2.5.1 (1)** archived and submitted

## Recent Changes (2026-08-03 — Apple subscription merge + staging Build 11)

- **Commit `f796845`:** `appleSubscriptionMerge.js` — max(active) expiry for RC sync; iOS Premium+ upgrade note in `NativePaywall`
- **Commit `e5031b6`:** TS fix for paywall expiry patch
- **Commit `e695dc2`:** chore build 11 sync (deploy script)
- **RevenueCat:** `mc.premium_plus.monthly` in `default` offering (`premium_plus_monthly` package) — user confirmed
- **Staging:** v2.5.0 Build **11** deployed; backend merge logic live
- **Next (manual):** iOS Archive Build 11 + Sandbox paywall test; ASC Premium+ review; production after App Store

## Recent Changes (2026-08-02 — Staging Build 10 + Premium upgrade pricing)

- **Commit `0af848b`:** Premium→Premium+ web upgrade pricing (Option 2 credit + 30-day period + UI explanation)
- **Commits `4235b29`, `4bb447c`:** chore build 9/10 sync (interrupted deploy resumed)
- **Staging:** v2.5.0 Build **10** — frontend + backend deployed; health OK; upgrade credit live on mc-beta
- **Next (manual):** ASC ManualMode rename + `mc.premium_plus.monthly`; Xcode Archive Build 10; production after App Store

## Recent Changes (2026-08-02 — Premium+ Option A + staging Build 8)

## Recent Changes (2026-07-30 — Production 2.5.0 deploy)

- **`./deploy-manualmode.sh -e production`** — Registry images 2.5.0 (same as staging Build 6); health OK
- **DB:** `prisma migrate status` up to date (28 migrations); `migrate-method-ids.js` — 0 rows (production)
- **User count:** 32 before/after (unchanged)
- **Smoke:** `/api/health`, avatars PNG, Build **6**, `/privacy` `/terms` `/support` OK

## Recent Changes (2026-07-29 — Git commit+push workflow)

- **Convention:** „Commit“ = commit **and** push (opt-out: „nur committen“)
- **Rule:** `.cursor/rules/git-workflow.mdc`; `systemPatterns.md` Decision #24

## Recent Changes (2026-07-29 — macOS Podman deploy preflight)

- **`scripts/ensure-local-podman.sh`** — start/wait/restart Podman machine before local builds
- **`deploy-manualmode.sh`** — calls preflight automatically (skipped for production / `--skip-build`)
- **Docs:** deployment skill, `PODMAN-GUIDE.md`, `TROUBLESHOOTING-INDEX.md`

## Recent Changes (2026-07-29 — Practice history back + Build 6)

- **Commit `06bf50a`:** Practice history back — returns to setup/review/progress, not bot selection
- **Commit `754c7ff`:** chore build 6 sync (frontend-only deploy)
- **Staging:** v2.5.0 Build **6** — frontend deploy; health OK
- **Xcode:** `npm run sync:ios-staging` — OK

## Recent Changes (2026-07-29 — Admin tab labels + Build 5)

- **Commit `3b42341`:** Admin tabs — labels hidden below `lg`, no truncation; practice analytics sub-tabs scroll
- **Commit `1350e4d`:** chore build 5 sync (frontend-only deploy)

## Recent Changes (2026-07-29 — GDPR deploy Build 3 + iOS sync)

- **Commit `69c5a24`:** GDPR P1–P3 (export/delete, privacy texts, nginx anonymized logs, audits, skill)
- **Commit `c86f30f`:** chore build 3 sync (deploy script)
- **Staging:** v2.5.0 Build **3** — frontend/backend/TTS OK; nginx reload
- **Xcode:** `npm run sync:ios-staging` — OK (mc-beta API)

## Recent Changes (2026-07-29 — DSGVO P3 NGINX logs)

- **`server-scripts/update-nginx-ips.sh`** — `access_log … anonymized` for staging + production (was drift vs templates)
- **Server verified:** both vhosts regenerated; nginx reload OK
- **Audit:** Score **99/100**; P3 closed

## Recent Changes (2026-07-29 — DSGVO P1/P2 remediation + skill)

- **Privacy:** `PrivacyPolicyView.tsx` + `public/privacy.html` — PayPal, RevenueCat/Apple IAP, Practice draft, DiceBear, guest fingerprint, password-reset E2EE note
- **Backend:** `services/gdprAccountCleanup.js` — purchase anonymisation on delete, ticket delete/export, personality delete on password reset
- **Export:** `/api/data/export` includes `purchases` + `supportTickets`
- **Skill:** `.cursor/skills/meaningful-conversations/gdpr-compliance/SKILL.md`
- **Audit:** Score **98/100**; P1/P2 closed; P3 NGINX doc remains

## Recent Changes (2026-07-29 — DSGVO/GDPR audit v2.5.0)

- **`DOCUMENTATION/DSGVO-COMPLIANCE-AUDIT.md/html`** — Full rewrite for app **v2.5.0** (Practice Lab, k-analytics, retention, export gaps)
- **`DOCUMENTATION/GDPR-COMPLIANCE-AUDIT.md`** — New EN parity (was HTML-only v1.8.8)
- **`DOCUMENTATION/GDPR-COMPLIANCE-AUDIT.html`** — Synced to v2.5.0
- **Score 94/100** — Open P1: privacy text IAP/PayPal, Purchase delete/export; P2: password-reset personality ciphertext, guest-mode wording
- **Docs-only** — no `privacy.html` / `PrivacyPolicyView` changes in this step

## Recent Changes (2026-07-28/29 — Release v2.5.0)

- **Admin tabs:** Icon-only on phone/narrow portrait (no truncated “Benutz/Verwal”); `aria-label`/`title` keep full names
- **Practice region routing:** `send-message` + `practice-coach-turn` pass `userRegionPreference`; adaptive coach `maxOutputTokens` 1000 (Gemini 2.5 thinking)
- **Regression harness:** `scripts/regression/providerGuard.mjs` — region force, asserts, fingerprints, STRUCTURAL/FLAKE/NOISE, transcript samples
- **Skill:** `llm-upgrade` — MC_DEV_* auth, Practice score variance, token truncation note
- **SDK already on staging from 2.4.3 builds:** `@google/genai` 2.13.0, `@mistralai/mistralai` 2.5.0

## Recent Changes (2026-07-28 — Skill: LLM upgrade + test sequence)

- **`.cursor/skills/meaningful-conversations/llm-upgrade/SKILL.md`** — Upgrade workflow for `@google/genai` / `@mistralai/mistralai`, staging regression (classic + practice), provider-forcing pitfall (`aiRegionPreference`), model mapping, Go/No-Go criteria; indexed in `DOCUMENTATION-STRUCTURE.md`

## Recent Changes (2026-07-28 — Tier 3 Session 2: Google GenAI 1→2)

- **Commit `94a9ca3`:** `@google/genai` **^1.20.0 → ^2.13.0** (Interactions-only breaking changes; `generateContent` unaffected)
- **Staging:** Build **6** — GenAI **2.13.0** installed; Mistral chat reset to **medium** (analysis medium)
- **Quality checkpoint (real Google):** Classic run `…genai-v2-google` — **29/29 turns `provider=google`**; auto-checks match baseline pattern (8/9; same `session_updates` flake). Practice: overall **10/10/10** vs baseline 10/10/6 — no regression
- **Note:** `--provider gemini` alone does **not** force Google when staging `AI_PROVIDER=mistral` + user `optimal`; must set user `aiRegionPreference=us` for Gemini regression

## Recent Changes (2026-07-28 — Tier 3 Session 3: Mistral SDK 1→2)

- **Commit `e7f7899`:** `@mistralai/mistralai` **^1.15.1 → ^2.5.0** (ESM-only)
- **`aiProviderService.js`:** `getMistralClient()` now `async` + `await import()` (same pattern as Google); `response_format` → `responseFormat`; `normalizeMistralContent()` for `string | ContentChunk[]`
- **Tests:** 661 backend tests pass; ContentChunk normalization covered
- **Staging:** Build **5** deployed (`61fdbc0` build sync); container reports installed **2.5.0**, ESM import OK
- **Quality checkpoint (2026-07-28, staging, Mistral):** Headless classic + practice regression vs `local-mistral` reference
  - Classic run `2026-07-28T19-03-49-mistral-mistral-v2-post`: **8/9** auto-checks; only flake: `session_dpfl_post_coaching` missing `session_updates` (analysis variance, not SDK error)
  - Practice run `2026-07-28T19-07-10-mistral-mistral-v2-post`: all 3 scenarios completed; scores **equal or better** vs baseline (overall 9/9/9; method Δ within/above noise)
  - **Verdict:** Mistral v2 OK for staging — no structural SDK regression

## Recent Changes (2026-07-28 — Staging deploy Build 4 + coach tier commit)

- **Commit `b9b25d6`:** Sam/Gabrielle → registered, Mike → premium; Bekky `[AUDIT_TASK]` docs (matrix, infographic HTML/PDF, User Guide, locales); backend catalog alignment
- **Commit `2b92ec8`:** chore build 4 sync (deploy script)
- **Staging:** `./deploy-manualmode.sh -e staging -c app` — success; Podman machine restart required once
- **Xcode:** `npm run sync:ios-staging` — OK (staging API target)

## Recent Changes (2026-07-28 — Coach access tier realignment)

- **Sam** (`sam-forward-focused`): `guest` → **registered**
- **Gabrielle** (`gabrielle-four-stage`): `guest` → **registered**
- **Mike** (`mike-ambivalence-coaching`): `registered` → **premium**
- Updated: `constants.ts`, `bots/newCoaches.js`, `geminiPrompts.js` BOT_CATALOG, User Guide, COACH-BEHAVIOR-MATRIX, USER-ACCESS-MATRIX, paywall i18n

## Recent Changes (2026-07-28 — Coach behavior matrix documentation)

- **`DOCUMENTATION/COACH-BEHAVIOR-MATRIX.md`** — Vollständige Verhaltensmatrix aller 14 Bot-Personas (12 Coaches + 2 Gloria-Interviewer): Contracting, Rhythmus, Methodik-Phasen, Abschluss, Ratschläge, Grenzen, Krisenprotokoll, Practice-Lab-Mapping; indexiert in `DOCUMENTATION-STRUCTURE.md`

## Recent Changes (2026-07-28 — Release v2.4.3: coaching session close + Gabrielle advice consent)

### Classic coach prompt guardrails
- **Sam:** forward-focused closing signals + proactive SF close after +1 step
- **Gabrielle/Mike:** shared closing signals + method-specific session close; Gabrielle tip fallback **requires client permission** before offering advice
- **Max/Ava:** refactored to shared `coachingClosingSignals` + method-specific close blocks (parity with new coaches)

## Recent Changes (2026-07-27 — iOS staging target + staging deploy v2.4.2)

### iOS → Staging API
- **`npm run sync:ios-staging`** — `VITE_CAPACITOR_BACKEND=staging` → Capacitor calls `mc-beta.manualmode.at`
- **`services/api.ts`**, `brands/ios-staging.env`, deployment skill updated
- Revert before App Store: `npm run build && npx cap sync ios`

### Staging deploy v2.4.2 Build 2
- `./deploy-manualmode.sh -e staging -c app` — health OK; 14 bots incl. Sam, Victor, Dan

## Recent Changes (2026-07-27 — Release v2.4.2: headless regression harness)

### Classic + Practice regression CLI *(committed v2.4.2)*
- **CLI:** `npm run classic-regression` / `npm run practice-regression` — `baseline` (step 1), `compare-offline` (step 2), `compare` (live shortcut only)
- **Run storage:** Each test → unique `runs/{timestamp}-{provider}[-label]/`; canonical reference in `local-{provider}/` via `--reference` only; `runs/index.json` registry
- **Classic suite:** `regression` (9 scenarios default), smoke (4), full (21); populated LC + tri-lens profile for headless runs
- **Reference baselines:** Gemini + Mistral in `classicRegressionBaselines/` and `practiceRegressionBaselines/`
- **Admin Session Simulator:** consistent Open/Run cards + icons; TestRunner stress check aligned with headless safety scenario

## Recent Changes (2026-07-27 — Classic + Practice regression harness, v2.4.1 staging)

### Practice Lab refactor *(committed v2.4.1)*
- **Removed:** Smoke (4-turn) and Golden 10/10 modes; fixed-script perfection chasing
- **Single cycle:** 6-turn stage-complete forward-focused path (Sam)
- **Adaptive coach (default):** `POST /api/gemini/test/practice-coach-turn` (developer-only); scripted fallback on API error
- **Regression:** `utils/practiceRegression.ts` — export snapshot JSON, compare vs baseline (flags method/overall Δ > 2); UI in TestRunner
- **Tests:** `practiceLabScripts.test.ts`, `practiceRegression.test.ts` (7 pass)

## Recent Changes (2026-07-27 — Release v2.4.0: neutral method taxonomy)

### Trademark-neutral rename *(committed v2.4.0)*
- **Canonical IDs:** All 12 practice frameworks + linked bot IDs renamed (e.g. `four-stage-coaching`, `forward-focused-coaching`, `ambivalence-coaching`, `sam-forward-focused`)
- **Sam coach:** Steve → Sam; avatar `/avatars/sam.png`; neutral prompts (no GROW/brief forward-focused/MI/listening skills/client exact language)
- **Legacy aliases:** `methodTaxonomy.js` — **restored 2026-07-27** (bot IDs e.g. `kenji-stoic`→`kenji-resilience`; filter-repo had corrupted identity-only maps)
- **Migration:** `scripts/migrate-method-ids.js`; staging migrated (2 rows)
- **Git history:** filter-repo + force push completed 2026-07-27
- **Staging:** v2.4.0 Build 3 deployed
- **Production:** blocked until App Store ≥2.4.x

## Recent Changes (2026-07-27 — Release v2.3.6: practice evaluation rubrics)

### Custom coach avatars
- **Steve** + **Mike:** distinct portraits (`c58bcad`). **Gabrielle:** own portrait replacing Ava duplicate (`bbdc9874`, committed separately).

### Method-first evaluation — all 12 frameworks *(committed v2.3.6)*
- **Scoring:** `computePracticeOverallScore` + `buildScenarioMethodFit` extracted to `practice/evaluationScoring.js`; 10/10 only when method ≥9 **and** `sessionFlow.coherent`.
- **Rubrics:** All 12 methods in `frameworks.js` now have `sessionFlowRubric` + enriched compliance/evaluator rubrics aligned with bot prompts (Type A incl. full contracting: GPS, Ambitious, Strategic, Stoic/Kenji, Structured Reflection, Mental Fitness, GROW, MI; Type B: brief forward-focused; Type C — no 6-step contract: Thought Audit, client exact language; Systemic: map-before-intervene).
- **Tests:** `evaluationScoring.test.js` (8 cases), `geminiPrompts.test.js` Type A/C prompt snapshots; backend **631 tests pass**.
- **TestRunner:** Shows session flow coherent flag + evidence in practice eval results.

## Active Tasks
- [x] **Legal review + filter-repo + force push** — completed 2026-07-27
- [x] **Staging v2.4.0 deploy** — Build 3 live at mc-beta.manualmode.at
- [x] **DB migration staging** — 2 practice_evaluations rows migrated (grow → four-stage-coaching)
- [x] **Production deploy 2.5.0** — done **2026-07-30** (after App Store approval); `migrate-method-ids.js` on production (0 rows)
- [ ] **Remove legacy aliases** — when obsolete per `DOCUMENTATION/LEGACY-ALIASES-REMOVAL.md` (not before App Store ≥2.4.x + DB clean)
- [ ] **Console.log Cleanup:** ~43 frontend files with hundreds of console.log calls. TTS debug logs (`[TTS-DBG]`) intentionally kept for stability monitoring.
- [ ] W4F: Update DNS for `w4f-beta.manualmode.at`, then run `certbot`
- [ ] iOS: Set up In-App Purchase products in App Store Connect, Notifications URL
- [ ] Android Capacitor project setup
- [ ] PayPal Monthly Subscription on web (3.90 EUR/month)
- [ ] Formal WCAG accessibility audit
- [ ] Self-hosted SLM as Gemini replacement (milestone: >1000 paying users)
- [ ] Coaching Framework Roadmap: client exact language bot, The Work bot, NLP Meta-Modell lens, Logische Ebenen lens
- [ ] Presentation Evaluator (Premium Feature, backlog)
- [ ] Micro Learnings: Integration Management Section (Nobody → proaktive Vorschläge, Links zu kuratierten Inhalten)
