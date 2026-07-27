# Active Context

## Current Status
**Version:** 2.4.0
**Branch:** `main`
**Staging:** Deployed **2026-07-27**, Build **3**, v2.4.0 — https://mc-beta.manualmode.at (health OK)
**Production:** Deployed **2026-07-26**, Build **2**, v2.3.1 — https://mc-app.manualmode.at (health OK)
**App Store:** iOS live **≤2.0.1** (verify App Store Connect); repo/Xcode **2.4.0 Build 3** — Archive pending release

**Production deploy gate (2026-07-27):** **No production deploy of 2.4.x** until **iOS 2.4.x+ is live in the App Store**. Staging may run ahead. Rationale: iOS bundles old bot IDs; backend 2.4.0 without matching app risks 404 on renamed coaches.

**Memory Bank:** The assistant updates these files **proactively** after substantive work, commits, deploys, or server verification — no separate "please update memory bank" request needed (see `systemPatterns.md` #21).

## Recent Changes (2026-07-27 — Practice Lab regression harness, uncommitted)

### Practice Lab refactor *(local, not committed)*
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
- [ ] **Production deploy 2.4.x** — **blocked** until iOS **2.4.x+** live in App Store; then migrate DB + `./deploy-manualmode.sh -e production`
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
