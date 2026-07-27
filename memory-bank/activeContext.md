# Active Context

## Current Status
**Version:** 2.4.0
**Branch:** `main`
**Staging:** Deployed **2026-07-26**, Build **2**, v2.3.1 — https://mc-beta.manualmode.at (health OK)
**Production:** Deployed **2026-07-26**, Build **2**, v2.3.1 — https://mc-app.manualmode.at (health OK)
**App Store:** Xcode synced **2.3.1 Build 2** — ready to Archive

**Memory Bank:** The assistant updates these files **proactively** after substantive work, commits, deploys, or server verification — no separate "please update memory bank" request needed (see `systemPatterns.md` #21).

## Recent Changes (2026-07-27 — Release v2.4.0: neutral method taxonomy)

### Trademark-neutral rename *(committed v2.4.0)*
- **Canonical IDs:** All 12 practice frameworks + linked bot IDs renamed (e.g. `four-stage-coaching`, `forward-focused-coaching`, `ambivalence-coaching`, `sam-forward-focused`)
- **Sam coach:** Steve → Sam; avatar `/avatars/sam.png`; neutral prompts (no GROW/brief forward-focused/MI/listening skills/client exact language)
- **Legacy aliases:** `methodTaxonomy.js` + `resolveFrameworkId` / `resolveBotId` wired in frameworks, chat access, practice routes
- **Migration:** `scripts/migrate-method-ids.js` for DB; `git-filter-repo-replacements.txt` prepared (not run — legal review pending)
- **Tests:** Backend **632 tests pass**
- **Not deployed yet** — awaiting legal review; no force push

## Recent Changes (2026-07-27 — Release v2.3.6: practice evaluation rubrics)

### Custom coach avatars
- **Steve** + **Mike:** distinct portraits (`c58bcad`). **Gabrielle:** own portrait replacing Ava duplicate (`bbdc9874`, committed separately).

### Method-first evaluation — all 12 frameworks *(committed v2.3.6)*
- **Scoring:** `computePracticeOverallScore` + `buildScenarioMethodFit` extracted to `practice/evaluationScoring.js`; 10/10 only when method ≥9 **and** `sessionFlow.coherent`.
- **Rubrics:** All 12 methods in `frameworks.js` now have `sessionFlowRubric` + enriched compliance/evaluator rubrics aligned with bot prompts (Type A incl. full contracting: GPS, Ambitious, Strategic, Stoic/Kenji, Structured Reflection, Mental Fitness, GROW, MI; Type B: brief forward-focused; Type C — no 6-step contract: Thought Audit, client exact language; Systemic: map-before-intervene).
- **Tests:** `evaluationScoring.test.js` (8 cases), `geminiPrompts.test.js` Type A/C prompt snapshots; backend **631 tests pass**.
- **TestRunner:** Shows session flow coherent flag + evidence in practice eval results.

## Active Tasks
- [x] **Legal review (engineering audit):** `DOCUMENTATION/LEGAL-REVIEW-v2.4.0.md` — conditionally ready for filter-repo + force push
- [ ] **Owner sign-off** on legal review document, then run `git filter-repo` per `POST-LEGAL-REVIEW-CHECKLIST.md`
- [ ] **Deploy v2.4.0** to staging with DB migration
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
