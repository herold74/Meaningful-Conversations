# Active Context

## Current Status
**Version:** 2.6.0
**Branch:** `main`
**Staging:** Deployed **2026-09-07**, v**2.6.0** Build **17** — https://mc-beta.manualmode.at (health OK). Connector tiered profanity policy (mild OK, no fecal/crude), David/Marc optimal-script copy.
**Production:** v2.5.7 (2026-08-23) — https://mc-app.manualmode.at. **Do not deploy 2.6.0 to production until staging QA of The Connector is done.**
**App Store:** iOS **2.5.7 approved & live (2026-09-04)**. Next iOS binary: 2.6.0 (after staging QA; new feature = minor bump already applied).
**Xcode:** `MARKETING_VERSION` still 2.5.7 locally — update to 2.6.0 before next archive; ASC build counter: next archive **≥5**.

## Session handoff (2026-09-04) — The Connector (v2.6.0)

**New feature "The Connector":** scenario-based mini-assessment (3 of 5 everyday vignettes, AI personas, 3–5 user turns each, dynamic heard/timeout close via `[CONNECTOR_END]` marker) → LLM evaluation of 5 dimensions (empathy, presence, curiosity, nonJudgment, steadiness) with pentagon radar. Registered users only (free tier); guests see locked tile as registration motivator.

- **Backend:** `meaningful-conversations-backend/connector/` (vignettes, personaPrompt + role guard, evaluationPrompts + strict JSON schema, connectorScoring, unit tests 19✓), routes `routes/gemini/connector.js` (`GET /connector/start`, `POST /connector/turn` SSE, `POST /connector/evaluate`), mounted in `routes/gemini.js`. `personality.js`: `'connector'` in validLenses.
- **Frontend:** `ConnectorIntroView` (mode choice text/voice, AI-Act notice), `ChatView` extended (`connectorConfig`/`onConnectorEnded`, TTS gender override), `ConnectorResultsView` (SVG radar, strengths/growth, per-vignette moments, E2EE save, Practice cross-sell ≥8), App.tsx run state machine + transition overlays, `utils/connectorRun.ts`. NavView: `connectorIntro|connectorChat|connectorResults`. Tile in BotSelection Kommunikation section. 5 generated persona avatars `public/avatars/connector-*.png`. i18n DE/EN parity (2348 keys ✓).
- **E2EE save:** result stored inside `encryptedData` payload as `connector` key; `completedLenses` unchanged (no lens-UI side effects).
- **Handbuch:** Kapitel **5.4** The Connector (DE/EN), Abschnitte 5.4/5.5 → 5.5/5.6 umnummeriert (`b6cac305`).
- **Commits:** `1835882f` (feature) · `b6cac305` (handbook) · `0e24214d` (deploy build-2 sync) · `5a45706a` (memory bank) · `b55065f2` (profile + Fremdsicht + review fixes) · `887cac9a` (build-3 sync).
- **Stufe 1 (profile):** `ConnectorProfileSection` under „Wie du interagierst“, E2EE `connector` in profile blob, PDF section, handbook/privacy copy.
- **Stufe 2 (Fremdsicht):** opt-in `externalPerspectiveNote` on narrative profile; `POST /api/personality/generate-external-perspective`; preview modal; invalidate note on new Connector save; stale/outdated warnings.
- **Deploy script (2026-09-04):** `deploy-manualmode.sh` hardened — TTS re-tag fail-fast (local registry pull + remote retag fallback), `.previous-version` before VERSION bump, TTS container health gate. No TTS rebuild on `-c app`.

## Session handoff (2026-09-06) — Connector QA + Admin Analytics

- **Connector QA Lab:** Admin Session Simulator tab; scripted optimal turns (`utils/connectorLabScripts.ts`), `DOCUMENTATION/CONNECTOR-OPTIMAL-CONVERSATIONS.md` + print PDF (`npm run generate:connector-pdf`).
- **Connector Analytics (GDPR):** `connector_run_stats` (scores only, no userId/text); `GET /api/admin/connector-stats`; `AdminConnectorAnalyticsView` tab; k=5; 12mo retention. Stats from next completed evaluate onward.
- **Commits:** `307963df` (analytics + PDF) · `ec3848e9` (build 10 sync).
- **Admin UX constraint:** Icon tab bar at capacity (7/8 tabs) — no further top-level tabs without nav redesign (`systemPatterns.md` Decision #26).

## Session handoff (2026-09-07) — Connector voice mode TTS fix (deployed Build 11)

- **Problem:** Connector Live cut off last sentence(s) in TTS; persona voice did not reliably switch between vignettes.
- **Root cause:** SSE `[CONNECTOR_END]` holdback tail never flushed to client; shared streaming playback could stop before all sentences synthesized; opening line used generic first-message auto-speak without persona voice reset.
- **Fix:** `connector.js` flush holdback tail; `useTts.ts` streaming reconcile/wait + `skipAutoFirstMessage` + `resetFirstMessageSpoken` on gender change; `ChatView.tsx` dedicated Connector opening effect + `reconcileStreamingWithFinalText` after stream.
- **Copy:** Connector Practice cross-sell text scoped to coaching trainees (DE/EN).
- **Commits:** `2efc663e` (fix + copy) · `c01d8ad6` (build 11 sync).
- **Coaching/practice:** Shared streaming improvements only; holdback fix is Connector-only.
- **Next:** Staging QA — Connector results ladder (score < 8) + voice mode regression.

## Session handoff (2026-09-07) — Connector practice feedback + docs (deployed Build 15)

- **Practice runs:** Catalog single-vignette sessions now get full LLM evaluation + dedicated results UI; saved profile signature is **not** overwritten (no save button on practice results).
- **Docs:** `CONNECTOR-OPTIMAL-CONVERSATIONS.md` + PDF — 8 vignettes, DE copy + EN example turns only, disclaimer without QA score targets.
- **Avatars:** `connector-sophie.png`, `connector-marc.png`, `connector-nina.png` — unique per persona (no reuse of Leila/Tom/Carmen).
- **Commits:** `da41159c` (feature + docs + avatars) · `1c51a743` (build 15 sync).

## Session handoff (2026-09-07) — Personality profile PDF redesign (deployed Build 14)

- **PDF export:** `utils/pdfGeneratorReact.tsx` — hybrid layout (Mockup B editorial hero header + Mockup A app-cards body): flat cards, thin score bars, neutral OCEAN scale, full Riemann-Thomann SVG axis labels (Distanz/Nähe/Beständigkeit/Spontanität), two-page layout with `wrap={false}` sections for iOS share sheet.
- **Design refs:** `DOCUMENTATION/design/pdf-profile-mockups/` (HTML mockups + PNGs + `render.mjs`).
- **Commits:** `35d08323` (PDF redesign) · `4b7cf7b6` (build 14 sync).

## Session handoff (2026-09-07) — Gloria connection-prep + Connector catalog (deployed Build 13)

- **Gloria Interview:** Mode picker (standard vs. Gesprächsvorbereitung); Maxwell-inspired connection prep via questioning only (no coaching); transcript section „Verbindungspunkte“; Connector handoff starter for Gloria.
- **Connector:** Practice catalog for single-vignette runs; returning users with saved signature land on catalog.
- **Commits:** `8bb1ffa7` (feature) · `3c48c095` (build 13 sync).

## Session handoff (2026-09-07) — Connector next-steps ladder (deployed Build 12)

- **Feature:** Micro-commitment ladder on results when score < 8: (1) everyday micro-exercise, (2) Connector retry with focus badge, (3) opt-in Kommunikation coach (Nobody/Sam/Gloria) with copyable starter. Practice cross-sell unchanged at ≥ 8.
- **Commits:** `0940977e` (ladder) · `5db9ccd1` (build 12 sync).

## Persistente Notizen (ASC 2.5.7 — bitte nicht vergessen)

1. **Handbuch ist in der Einreichung** — UserGuide/FAQ-Audit (§1.2/§2.2, PEP-Kapitel, iOS-IAP-Copy) steckt im eingereichten Binary **2.5.7 (4)**; kein Rebuild nur fürs Handbuch nötig.
2. **Uncommitted ≠ nicht im Binary** — Xcode-Archive aus dem lokalen Workspace enthält auch uncommittete Frontend-Änderungen (`main-CaTeQsof.js` im xcarchive prüfbar).
3. **Build-Nummern drift:** Repo/Xcode kann `CURRENT_PROJECT_VERSION=3` zeigen, ASC **build 4** — Apple hochzählt beim Upload. Vor dem nächsten Archive: **≥5** setzen.
4. **iOS-Login auf Production** — Fix ist **Backend CORS** (`X-Client-Platform`), kein neues App-Binary; Production muss **v2.5.7+** sein.
5. **Apple Review-Account** — `premium@manualmode.at` via `setup-app-store-review-account.js` auf Production (Premium+ **bis 2027-12-31**); IAP-Sandbox-Demo ggf. `reset-app-store-review-account-for-iap-demo.js`.
6. **Repo-Stand 2026-08-21** — Commit **`a4d369c4`** (Handbuch, IAP-Paywall, CORS, ASC-Docs); `build/` + `*.xcarchive` in `.gitignore`.

## Session handoff (2026-08-23)

**Crisis helplines + method comparison:** Commit **`a1504bed`**. Staging **backend-only** deploy 2026-08-23. **Production backend** 2026-08-23 (pull-only, same 2.5.7 image) — `crisisResources.js` live (AT/DE/CH/CA, 988 present). Health OK. No iOS rebuild (prompt-only).

## Session handoff (2026-08-21)

**ASC 2.5.7 resubmit complete:** Submitted **2.5.7 (4)** with handbook audit (UserGuide §1.2/§2.2, PEP ch., iOS IAP copy), NativePaywall locale titles, IAP demo-reset script, CORS `X-Client-Platform` on production. Review account `premium@manualmode.at` → Premium+ until **2027-12-31** (updated **2026-08-27**). Repo synced (commit after session).

**Production deploy v2.5.7:** iOS login to mc-app failed with misleading “Could not connect” — **root cause:** CORS preflight blocked `X-Client-Platform` header (staging had fix, production was still on 2.5.6 backend). **Fix:** `./deploy-manualmode.sh -e production` — CORS now allows `X-Client-Platform`.

## Session handoff (2026-08-20)

**ASC 2.5.7 IAP staging test:** Paywall did not appear for `premium@manualmode.at` after DB reset. **Root cause:** `auth.js` + `handleAccessExpired` sync from RevenueCat on login; active sandbox `mc.registered.monthly` (and `mc.coach.chloe` non_sub) re-grant access. **Fix documented:** `reset-app-store-review-account-for-iap-demo.js` now also `DELETE`s RevenueCat subscriber; skill + `ASC-RESUBMIT-2.5.7.md` updated. **Fallback account:** `expired@manualmode.at` (no RC history). **iPhone:** logout + force-quit after reset; sandbox Apple ID must not have active subs for fresh purchase demo.

## Session handoff (2026-08-17)

**Transkript-Auswertung / Gernot-Fehler:** Mistral `json_object` lieferte kaputtes JSON auf Staging. **Fix:** `json_schema` strict + Schema-Converter, `maxOutputTokens` 8192, Parse-Retry, `aiRegionPreference` im Evaluate-Endpoint. Docs: `TRANSCRIPT-EVALUATION-USER-GUIDE` (DE/EN) — Transkription immer Google, Glättung/Auswertung folgen KI-Region. **Commits:** `4153854f` · `efed7c0b` (build 3). **Staging deploy:** 2026-08-17.

**Deploy default:** `deploy-manualmode.sh` + `Makefile deploy-staging` default to `-c app` (frontend+backend, TTS re-tag only). Use `-c all` only when `tts-service/` changed.

## Session handoff (2026-08-13)

**ASC rejection 2.5.6 (2026-08-13):** 3.1.1 upgrade codes + 2.1(b) IAP not in binary. **Fix:** Redeem UI hidden on iOS; backend `X-Client-Platform: ios` guard; `initializePurchases` on login; `npm run verify:ios-iap`; v**2.5.7** Build **1** (BUILD_NUMBER reset). Resubmit checklist: `DOCUMENTATION/ASC-RESUBMIT-2.5.7.md`.

## Session handoff (2026-08-09)

**Heute live (Staging + Production Build 26):** IntentPicker UX (iOS Steuerrad-Abstand, Desktop-Karten-Ausrichtung), Handbuch Kapitel-Accordion-Spacing, DE Formatierungshilfe + Intent-Copy „anhand typischer Übungsszenarien“.

**Website Premium+ (Jimdo):** Button live **`ACCESS_PASS_PLUS_1M`**, €14,90 (2026-08-09). Anleitung `PAYPAL-SETUP-GUIDE.md`.

**Website Registered Lifetime:** Button von Jimdo/manualmode.at **entfernt (2026-08-09)**. Kein Neukauf mehr; Backend-Loyalty für Altbestand unverändert.

**Commits (Build 26 deploy):** `5722d104` · `e6aec22d` · `ff2c30eb`. **Production:** gleiche Images wie Staging, **2026-08-09**.

## Recent Changes (2026-08-09 — Staging + Production Build 26 UX)

- **Commits:** `5722d104` (IntentPicker + Handbuch spacing, DE intent copy) · `e6aec22d` (UserGuide TS fix) · `ff2c30eb` (build 26 sync)
- **Also includes:** `70995312` formatting help DE copy (from earlier b24/b25 deploys)
- **Deploy:** staging `-c app` → `npm run build && npx cap sync ios` → production pull-only
- **Verified:** staging + production health OK; `sw.js` v2.5.6-b26 parity

## Recent Changes (2026-08-08 — Production Build 23)

- **Deploy:** `./deploy-manualmode.sh -e production` (pre-built staging images)
- **Verified:** mc-app health 200, bundle **Build 23**

## Recent Changes (2026-08-08 — Staging Build 23)

- **Deploy:** `./deploy-manualmode.sh -e staging -c app`; commit `49b1ce0c` (build 23 sync)
- **iOS:** `npm run sync:ios-staging` — OK
- **Verified:** staging health 200, bundle **Build 23**, `sw.js` v2.5.6-b23

## Recent Changes (2026-08-08 — Staging Build 22 Premium+ website redeem)

- **Commit `0265193`:** Fix Premium+ website code redemption (`data.js` — `ACCESS_PASS_PLUS_1M` for Jimdo/PayPal Hosted Buttons); PayPal setup docs
- **Deploy:** `./scripts/ensure-local-podman.sh && ./deploy-manualmode.sh -e staging -c app`; commit `8a589a36` (build 22 sync)
- **Verified:** staging health 200, avatars `image/png`, bundle **Build 22**, `sw.js` v2.5.6-b22

## Recent Changes (2026-08-08 — Staging Build 21 guest LC routing fix)

- **Commit `24300f6`:** Guest name-only Life Context → questionnaire (Disclaimer-Flow); `hasGuestNameProvided` in `App.tsx` / `guestSession.ts`
- **Deploy:** `./scripts/ensure-local-podman.sh && ./deploy-manualmode.sh -e staging -c app`; commit `ef4064a4` (build 21 sync)
- **iOS:** `npm run sync:ios-staging` — Capacitor sync + Plugin-Verify OK
- **Verified:** staging health 200, avatars `image/png`, bundle **Build 21**, `sw.js` v2.5.6-b21

## Recent Changes (2026-08-08 — Staging Build 20 User Guide + Premium+ paywall)

- **Deploy:** `./deploy-manualmode.sh -e staging -c app`; commit `2a616fd` (build 20 sync)
- **Includes:** User Guide/FAQ/Improvisation (`9460caf`), Premium+ PayPal paywall (`e90e4e7`)
- **Verified:** staging health 200, avatars `image/png`, bundle **Build 20**, `sw.js` v2.5.6-b20

## Recent Changes (2026-08-08 — Staging Build 16 Intent picker tile themes + copy)

- **Commit `c79228d`:** IntentPickerView — bronze/silver/featured card themes; DE/EN intent copy (tile 3 shortened, „manuelle Methodenwahl“, practice ohne „Coach Practice“); UserGuideView + UX-FLOWS
- **Deploy:** `./deploy-manualmode.sh -e staging -c app`; commits `f7dd0cf` (build 15 sync) + `43f0fef` (build 16 sync)
- **iOS:** `npm run sync:ios-staging` — Capacitor sync + Plugin-Verify OK
- **Verified:** staging health 200, avatars `image/png`, bundle **Build 16**, `section-bronze` + intent copy im JS, `sw.js` v2.5.6-b16

## Recent Changes (2026-08-07 — Staging Build 14 EU AI Act hint UX)

- **Commit `a1088a8`:** BotSelection — boxed notice → subtle inline Info line; tighter DE/EN copy for EU AI Act disclosure + synthetic voice note
- **Deploy:** `./deploy-manualmode.sh -e staging -c app`; commit `7e92588` (build 14 sync)
- **Verified:** staging health 200, avatars `image/png`, bundle **Build 14**, `botSelection_ai_act_notice` im JS, `sw.js` v2.5.6-b14

## Recent Changes (2026-08-07 — Staging Build 13 Intent UX + LC menu)

- **Commit `8c61c72`:** Intent-Picker UX, Flow-Fixes, Menü Lebenskontext, Practice/Premium+-Routing, Coachee-Sanitizer
- **Deploy:** `./deploy-manualmode.sh -e staging -c app`; commits `7cb43b3` (build 12 sync, vorheriger Deploy unvollständig) + `047d407` (build 13 sync)
- **iOS:** `npm run sync:ios-staging` — Capacitor sync + Plugin-Verify OK
- **Verified:** staging health 200, avatars `image/png`, bundle **Build 13**, `menu_life_context` im JS

## Recent Changes (2026-08-05 — Staging Build 11 + Production v2.5.6 FAQ trim)

- **Commit `bc14105`:** FAQ — „Was passiert nach dem Intent Picker?“ ersatzlos entfernt (DE+EN)
- **Deploy:** staging Build 11 (`417204b` sync) → production v2.5.6 (pre-built staging images)
- **Verified:** frontend + backend health OK on staging and production

## Recent Changes (2026-08-05 — Staging v2.5.6 Build 10 FAQ STT + TTS)

- **Commit `77f7396`:** FAQ — STT wait tip (text/voice mode); signature voice fallback when server TTS briefly unavailable
- **Deploy:** `./deploy-manualmode.sh -e staging -c app`; commit `f4b553e` build 10 sync
- **Verified:** frontend + backend health OK on staging

## Recent Changes (2026-08-05 — Staging v2.5.6 Build 9 voice stable STT send)

- **Commit `f1e74ad`:** `stopAndFinalize()` — Flieger sofort tippbar, kurzer Spinner, nur committed Text wird gesendet
- **Deploy:** `./deploy-manualmode.sh -e staging -c app`; commit `5332be5` build 9 sync
- **Verified:** frontend + backend health OK on staging

## Recent Changes (2026-08-05 — Voice send: wait for stable STT on Flieger tap)

- Superseded by Build 9 deploy above

## Recent Changes (2026-08-05 — Staging v2.5.6 Build 8 About Practice + voice fix)

- **Commit `c0a37b3`:** About „Coaching üben“ tab layout parity; ℹ️ access box; „Fortschritt sehen“; `voiceNameIncludesToken` (martin ≠ martina); roadmap practice dev feedback
- **Deploy:** `./deploy-manualmode.sh -e staging -c app`; commit `10bf31e` build 8 sync
- **Verified:** frontend + backend health OK on staging
- **Production:** not deployed (still v2.5.5)

## Recent Changes (2026-08-05 — About Coach Practice tab + user guide callouts)

- **Commit `9e2de02`:** About page third tab „Coaching üben“; user guide ⚠️/ℹ️ callout boxes (DE+EN) — included in Build 8 deploy

## Recent Changes (2026-08-05 — Staging v2.5.6 Build 7 docs + AI Act UX)

- **Commit `4ec0150`:** Practice vs DPC/DPFL scope (GDPR, user guide, privacy); AI Act box centered + voice transparency copy; phonetic Stakeholder/LinkedIn (v1.0.6)
- **Deploy:** `./deploy-manualmode.sh -e staging -c app`; commit `faaae65` build 7 sync
- **Verified:** health OK on staging
- **Production:** not deployed (still v2.5.5)

## Recent Changes (2026-08-05 — Staging v2.5.6 Build 6 voice button UX fix)

- **Commit `f73d681`:** Voice Flieger button always solid red + clickable during recording; send still prefers stable STT transcript after stop (no interim fragments)
- **Deploy:** `./deploy-manualmode.sh -e staging -c app` (~5 min); commit `250dca8` build 6 sync
- **Verified:** health OK on staging
- **Production:** not deployed (still v2.5.5)

## Recent Changes (2026-08-05 — Staging + Production v2.5.6 Build 5 coachee overhaul)

- **Commit `6e8f456`:** International coachee names, explicit `coacheeGender`, avatar renames (finley→nadia, rowan→martin), Skyler→Elena, Blair→Sophie
- **Deploy:** staging + production (Build 5) — coachee API/names live on both environments

## Recent Changes (2026-08-05 — Staging v2.5.6 Build 4 voice + TTS deploy)

- **Commit `438401c`:** Voice send gated on stable STT (`hasStableTranscript`); send after STT ends with visible text; server-TTS greeting without `voices.length` wait; Piper word-level fallback for single-chunk ONNX failures
- **Deploy:** `./deploy-manualmode.sh -e staging -c all` (~18 min; full TTS rebuild); commit `42bf013` build 4 sync
- **Verified:** health OK; bundle contains `hasStableTranscript` / `canSendVoiceTranscript`; `sw.js` v2.5.6-b4
- **Production:** not deployed (still v2.5.5)

## Recent Changes (2026-08-05 — Staging v2.5.6 Build 3 docs deploy)

- **Docs (included in bundle):** User guide Premium+ / 9-day trial, Kap. 2.3 KI-Transparenz, Coach Practice chapter visibility fix; Disclaimer + Privacy AI Act transparency; FAQ tier updates
- **Commits:** `715462b` docs sync; `50341e1`/`4d3f492` build sync (Build 2→3 after re-run)
- **Deploy:** `./deploy-manualmode.sh -e staging -c app` — first attempt failed (main lost upstream after filter-repo); fixed with `git push -u origin main`, re-run succeeded (~9 min)
- **Verified:** health OK; bundle contains `9-Tage-Premium-Test`, `KI-Transparenz`, `Coaching üben`; `sw.js` v2.5.6-b3
- **Production:** not deployed (staging only)

## Recent Changes (2026-08-05 — Cursor config private)

- **Policy:** `.cursor/` and `AGENTS.md` removed from git tracking — maintainer workflow/IP stays local only (reverses commit `c8528f2` versioning approach)
- **History purge:** `git filter-repo` removed `.cursor/` + `AGENTS.md` from **all** commits; `main` force-pushed. Recovery tag on remote: `backup/pre-cursor-history-purge-20260805` (pre-purge history)
- **Public repo:** `DOCUMENTATION/` + `memory-bank/` remain the shared handoff layer

## Recent Changes (2026-08-05 — User guide + AI Act docs)

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

- **Production:** `setup-app-store-review-account.js` — `premium@manualmode.at` → `isPremium`, `hasPracticeAccess` until **2027-12-31**, `isClient=false`

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
- [ ] **Krisen-Hilfsangebote region-aware (Backlog):** AT-Hotlines nur bei Region AT/leer; sonst landesspezifisch — siehe `progress.md` (2026-08-21)
- [ ] Coaching Framework Roadmap: client exact language bot, The Work bot, NLP Meta-Modell lens, Logische Ebenen lens
- [ ] **Coach Practice → Coach-Feedback / Profil (Roadmap):** Aktuell Tipps + wiederkehrende Beobachtungen; später optional Coaching-Stil aus Practice — siehe `progress.md`
- [ ] **Coach Practice → Entwickler-Feedback nach Auswertung (Roadmap, S):** Rating + optionaler Kommentar auf `PracticeEvaluationReview` — analog TE/SessionReview
- [ ] Presentation Evaluator (Premium Feature, backlog)
- [ ] Micro Learnings: Integration Management Section (Nobody → proaktive Vorschläge, Links zu kuratierten Inhalten)
