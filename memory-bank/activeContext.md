# Active Context

## Current Status
**Version:** 2.5.0
**Branch:** `main`
**Staging:** Deployed **2026-07-29**, Build **6**, v2.5.0 — https://mc-beta.manualmode.at (health OK)
**Production:** Deployed **2026-07-30**, Build **6**, v2.5.0 — https://mc-app.manualmode.at (health OK; staging images pulled)
**App Store:** iOS **2.5.0 (6) approved** — **freigeben in App Store Connect** (Production deploy done)

**Production deploy gate:** ~~Blocked until iOS live~~ — **Production 2.5.0 deployed 2026-07-30** after App Store approval; release iOS in ASC when ready.

## Recent Changes (2026-07-30 — Production 2.5.0 deploy)

- **`./deploy-manualmode.sh -e production`** — Registry images 2.5.0 (same as staging Build 6); health OK
- **DB:** `prisma migrate status` up to date (28 migrations); `migrate-method-ids.js` — 0 rows (production)
- **User count:** 32 before/after (unchanged)
- **Smoke:** `/api/health`, avatars PNG, Build **6**, `/privacy` `/terms` `/support` OK
- **Next:** App Store Connect → Version 2.5.0 → **Veröffentlichen**

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
