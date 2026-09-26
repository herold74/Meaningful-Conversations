# Active Context

## Current Status
**Version:** 2.6.0 **Build 39** (repo `BUILD_NUMBER` + `public/sw.js`)
**Branch:** `main` @ `1c8ca973`
**Staging:** v**2.6.0** Build **39** — https://mc-beta.manualmode.at (`sw.js` `v2.6.0-b39`; frontend + backend health OK)
**Production:** v**2.6.0** Build **39** — https://mc-app.manualmode.at (`sw.js` `v2.6.0-b39`; health OK; parity with staging b39)
**App Store:** iOS **2.5.7** live (AT/DE/CH). **Next:** iOS **2.6.0** ASC submit/archive (`MARKETING_VERSION` 2.6.0; align `CURRENT_PROJECT_VERSION` with repo build before upload). Metadata: `DOCUMENTATION/APP-STORE-METADATA.md`, `screenshots/app-store/v2.6.0/README.md`.
**Connector / docs:** `DOCUMENTATION/CONNECTOR-OPTIMAL-CONVERSATIONS.md`, `CONNECTOR` routes under `/api/gemini/connector/*`; QA lab + admin analytics per Sept 2026 handoffs below.

**Deploy note (2026-09-24):** Multiple incremental staging builds **b28–b36** during that week; superseded by **b39** on staging + production (see above).

## Session handoff (2026-09-24) — Coaching contact prompt (mailto) + iOS deprecation fix

- **iOS:** `NativeSTTPlugin.swift` — wrapped `AVAudioSession.requestRecordPermission`/`recordPermission` behind `#available(iOS 17, *)` helpers (`AVAudioApplication` on 17+, `AVAudioSession` fallback for the iOS 15 deployment target). No functional change; removes 5 Xcode deprecation warnings.
- **Coaching contact:** new `connect@manualmode.at` (`VITE_BRAND_CONNECT_EMAIL`, `brandEmailForPurpose`) kept separate from general `support@` contact. `utils/mailto.ts` (+ tests) → `ContactMailLink` → `CoachingContactPrompt` (reusable mailto CTA, prefilled subject/body, logged-in vs guest copy).
- **BotSelection:** non-client footer message now uses `CoachingContactPrompt` instead of static text; Transcript Tools tile lock/hover state keys off `evalLocked && recordLocked` (not guest-only) so partially-unlocked users don't see a dimmed tile; section-collapse chevron moved after the tab pills.
- **PracticeSetupView:** `CoachingContactPrompt` hint shown to non-client users when any client-only framework is locked (`practice_client_contact_hint`).
- **PracticeTileAvatar:** raster icon (ring frame, parity with other utility tiles) replaces the generic `GraduationCap` icon in `CoachPracticeHero`.
- **i18n:** DE/EN keys `contact_*`, `practice_client_contact_hint`, reworded `botSelection_clientContactMessage`.
- **Commits:** `5b3089c9` (iOS fix) · `a3a41c3d` (contact prompt + tile polish) · `e23eec82` (docs) on `main`. Local `npx tsc --noEmit` + `mailto.test.ts` pass; iOS simulator build clean.

## Session handoff (2026-09-24) — Coaching LC return + Sam DPC-only

- **Coaching session draft:** `utils/coachingSessionDraft.ts` — resume banner/prompt, LC editor save → back to chat; new coach requires discard confirm. Skills: `ux-flow`, `gdpr-compliance`.
- **DPC-only bots:** `utils/coachingMode.ts` — Nobody + Sam downgrade DPFL → DPC (card, chat, Comfort Check). Handbuch §4.4 DE/EN; `systemPatterns.md` #29.

## Session handoff (2026-09-24) — Transcript-Tools tile background → Connector teal

- **`transcript-tile.png`:** background re-matched to `connector-tile.png`'s lighter teal (soft anti-aliased edge blend, mic/waves/shadow preserved). `nobody.png` left as-is (Chloe-peach alternative was previewed but rejected — poor contrast for orange mic/waves, breaks section teal consistency).
- **Commit:** `718f518f` (build sync `729ce1d7`).

## Session handoff (2026-09-24) — BotSelection utility tile icons

- **Assets:** `public/avatars/tutorial-tile.png` — single open book, no cap (small-display legibility fix, 2026-09-24), left page now shows a schematic lightbulb (insight) + right page schematic text lines (guide-book layout); `connector-tile.png`, `transcript-tile.png`; **`nobody.png`** replaced with approved v3 (abstract bust, glossy 3D line).
- **Frontend:** `TutorialTileAvatar`, `ConnectorTileAvatar`, `TranscriptMicAvatar` now load raster assets via `resolveAssetUrl` (Capacitor parity with coach avatars).
- **Review refs:** `DOCUMENTATION/design/botselection-icons-review/` (mockups + alternates; not shipped as runtime deps).
- **Coach Practice tile:** `public/avatars/practice-tile.png` (v2 cap + clipboard); `PracticeTileAvatar` in `CoachPracticeHero` with same ring frame as other utility tiles. Review: `DOCUMENTATION/design/practice-tile-icons-review/`.


## Session handoff (2026-09-23) — Tutorial Hub handbook links

- **Deep links:** `utils/userGuideAnchors.ts` (stable IDs, scroll retry); Tutorial Hub → Handbuch (Session Review, Chat-Oberfläche, tier-dependent § numbers via `userGuideStructure.ts`).
- **Visibility:** `tutorialHubVisibility.ts` — PEP nur Klienten (+ Staff); Tests.
- **Hub copy:** Footer Browser vs App Store; handbook hints use section titles not fixed § numbers.
- **Commit:** `2c1a0e11` on `main`.

## Session handoff (2026-09-23) — native-audio removal + Docker postinstall

- Removed `@capacitor-community/native-audio` (unused; voice = NativeSTT/NativeTTS). Fixes Xcode AVAudioSession hang warning at plugin load.
- **patch-package:** `scripts/postinstall-patches.mjs` + Dockerfile COPY so staging Docker build succeeds.
- **`npm run sync:ios-staging`** after deploy — align `CURRENT_PROJECT_VERSION` with repo `BUILD_NUMBER`.

## Session handoff (2026-09-23) — Intent picker layout + Connector admin DE

- **`IntentPickerView` / `index.css`:** `flex-1` grid nur mobile; Spacer statt `flex-1` auf Beschreibung; drei CTAs bündig ohne Viewport-Löcher.
- **Admin:** `AdminConnectorAnalyticsView` + `admin_connector_stats_*` DE; EN parity keys.
- **Commits:** `ecedb021` · `195ab662` (build sync).

## Session handoff (2026-09-22) — Connector catalog polish

- **`ConnectorCatalogView`:** Info-Button + Modal (i18n `connector_signature_info_*`); open-situation button accessible name; catalog card briefs clamped.
- **Commits:** `5a717d0c` · `718865d9` (on staging since b26+).

## Session handoff (2026-09-22) — Victor intimacy + staging b25

- **Victor:** Intimitäts-/Partnerschafts-Modus (`victorIntimacyTrack.js`), `coaching_intimacy` safety; Practice-Szenario `partnership-intimacy-distance`; Elena nicht shipped.
- **Commits:** `299e4391` (feature) · `fba59e5b` (build 25 sync).
- **Xcode:** Local `npm run build` + `npx cap sync ios` done — `CURRENT_PROJECT_VERSION` **25**, `MARKETING_VERSION` **2.6.0**; archive in Xcode (scheme **App**).
- **Next:** Staging QA Victor + `safety_intimacy_coaching`; production promote when ready.

## Session handoff (2026-09-22) — Safety + handbook + staging b24

- **Safety (live on staging):** `contentSafetyPromptBlocks.js`, `aiSafetyConfig.js`, practice eval misconduct rubric; Test Runner `safety_*` scenarios.
- **Handbuch:** User Guide **§2.4** (Grenzen/Intimität), Connector Übungskatalog + Eigene Situation, Practice-Grenzen; Disclaimer cross-ref.
- **Commits:** `cd3285ba` (safety) · `624335d5` (handbook) · `25f469cd` (build 24 sync).

## Session handoff (2026-09-16) — Production v2.6.0 Build 19

- **Production (2026-09-16):** v**2.6.0** Build **19** verified live *(superseded — production now b39)* at https://mc-app.manualmode.at — health OK, `sw.js` `meaningful-conversations-cache-v2.6.0-b19`, bundle parity with staging (`main-CgRDw8aH.js`).
- **v2.6.0 API routes:** `/api/gemini/connector/*`, `/api/admin/connector-stats`, `/api/personality/generate-external-perspective` respond **401** unauthenticated (routes mounted; 2.5.7 would 404).
- **Migration:** `20260906150000_add_connector_run_stats` inferred applied (backend healthy; startup `prisma migrate deploy` is fatal on failure).
- **TTS:** `/api/tts/health` OK (`piperAvailable: true`, 4 voices).
- **iOS 2.5.7:** App Store binary unchanged; backward-compatible with production 2.6.0 API per `release-2.6.0-compatibility.md`. Connector/Gloria connection-prep/Fremdsicht/PDF redesign are web-only until iOS 2.6.0 archive.
- **Next (ongoing):** Archive iOS **2.6.0** in Xcode + ASC submit — use repo **Build 39+** (`BUILD_NUMBER` / `CURRENT_PROJECT_VERSION`); subscriptions linked, DE/EN-CA metadata. Optional: iOS 2.5.7 regression on production API.

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

## Session handoff (2026-09-07) — Connector profanity policy + script copy (deployed Build 17)

- **Persona prompts:** Tiered language — mild frustration allowed (`verdammt`, `so ein Idiot` about situation/third party); fecal language, slurs, and direct insults forbidden.
- **Vignettes/scripts:** Tom exit softened (`Au`/`Oh`), Marc opening without „oh Gott", Jonas „emotional" not „eskaliert"; David turn 3 + Marc optimal turns in lab scripts + docs/PDF.
- **Commits:** `4c38d6b3` (policy + copy) · `21d92707` (build 17 sync).

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

## Active Tasks
- [x] **Legal review + filter-repo + force push** — completed 2026-07-27
- [x] **Staging v2.4.0 deploy** — Build 3 live at mc-beta.manualmode.at
- [x] **DB migration staging** — 2 practice_evaluations rows migrated (grow → four-stage-coaching)
- [x] **Production deploy 2.5.0** — done **2026-07-30** (after App Store approval); `migrate-method-ids.js` on production (0 rows)
- [x] **Staging + Production v2.6.0 Build 39** — parity **2026-09-26** (`sw.js` `v2.6.0-b39` on mc-beta + mc-app)
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
- [ ] **Rolling Context / Kontextlimitierung (Backlog, M):** Developer-Schalter für Classic-Chat — rollende Summary + Kurzfenster; siehe `progress.md` Pending/Roadmap *(2026-09-14)*
- [ ] Presentation Evaluator (Premium Feature, backlog)
- [ ] Micro Learnings: Integration Management Section (Nobody → proaktive Vorschläge, Links zu kuratierten Inhalten)


---

**Archive:** Pre–2026-09-07 verbose deploy changelogs → `memory-bank/archive/activeContext-legacy-2026-08.md`.
