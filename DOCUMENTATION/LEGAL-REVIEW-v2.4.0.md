# Legal / Trademark Compliance Review — v2.4.0

**Date:** 2026-07-27  
**Reviewer:** Engineering audit (not substitute for licensed legal counsel)  
**Scope:** Public GitHub repo `Meaningful-Conversations-Project`, Coach Practice + AI coach prompts  
**Verdict:** **Conditionally ready** for `git filter-repo` + force push after owner acknowledges limitations below.

---

## Executive summary

The **current HEAD** (v2.4.0 + post-review fixes) uses neutral internal IDs, generic user-facing method labels, and a non-affiliation disclaimer. Remaining trademark-adjacent strings in **runtime code** have been reduced to generic coaching vocabulary.

**Git history** on `main` still contains pre-2.4.0 strings (GROW, forward-focused tradition, Steve, etc.) until `git filter-repo` is executed.

---

## What was reviewed

| Area | Status |
|------|--------|
| Bot system prompts (`newCoaches.js`, `coachingPromptBlocks.js`, `bots.js`) | ✅ No named method owners; Sam not Steve; no listening skills/GROW/brief forward-focused acronyms in prompts |
| Practice rubrics (`frameworks.js`) | ✅ Neutral IDs; post-review fix for MI/Change Talk leftovers |
| User-facing UI (locales, UserGuide, Disclaimer) | ✅ Generic labels + non-affiliation section |
| Internal IDs (`methodTaxonomy.js`) | ✅ Canonical neutral slugs; legacy aliases **only** for DB/API backward compatibility |
| IAP product IDs (`mc.coach.kenji`) | ⚠️ Unchanged — Apple SKU names are not method trademarks; bot runtime ID is `kenji-resilience` with alias |
| `CHANGELOG.md` historical entries | ℹ️ Retained — documents past releases; filter-repo may rewrite or leave as historical record |

---

## Residual low-risk items (accepted)

| Item | Risk | Rationale |
|------|------|-----------|
| i18n keys `test_practice_grow_*` | Very low | Internal key names only; user-visible strings say "four-stage" / "Vier-Phasen" |
| `personalGrowth`, "growth" in personality/OCEAN copy | None | Common English word, not four-stage coaching model |
| `methodTaxonomy.js` LEGACY_* maps | None | Migration shim; not user-visible |
| Stoic / stoic philosophy (Kenji) | Low | Historical philosophy term; bot ID now `kenji-resilience` |
| Positive Psychology (AboutView) | Low | Academic field name, descriptive |

---

## Items fixed in this review pass

- `frameworks.js` ambivalence-coaching: removed MI, Change Talk, duplicate "listening skills skills"
- `bots.js` / `constants.ts`: "Solution-Focused" → "Forward-Focused"; Bowen therapy → generic family therapy boundary
- `USER-ACCESS-MATRIX.md`: canonical bot IDs in unlock tables
- `newCoaches.js`: "change talk" → client's own reasons for change

---

## Disclaimer coverage

`DisclaimerView.tsx` includes (DE/EN):

- Not therapy / not licensed professionals
- **No affiliation** with trademark or method owners
- Methods are **generic descriptive labels** for educational practice

**Recommendation:** Surface a one-line link to Disclaimer from Practice setup (optional UX, not blocking).

---

## Git history cleanup (required before "clean public repo")

```bash
pip install git-filter-repo
git filter-repo --replace-text scripts/git-filter-repo-replacements.txt --force
# Re-tag v2.x as needed; then:
git push --force-with-lease origin main --tags
```

Verify zero hits:

```bash
git log -p --all -S 'forward-focused tradition' -- '*.js' '*.ts' '*.tsx' | head
git log -p --all -S 'sam-forward-focused' | head
```

---

## Pre-deploy checklist

1. Commit post-review fixes
2. `git filter-repo` + force push (after owner sign-off on this document)
3. Staging: `node scripts/migrate-method-ids.js`
4. Deploy v2.4.0; smoke Bot Selection + Coach Practice

---

## Limitations (important)

This document is an **engineering compliance audit**, not legal advice. For commercial App Store distribution in DE/EU/US, consider brief review by counsel specializing in trademark and coaching/health-app claims if exposure increases.

**Owner sign-off:** Gherold (approved in chat) — **2026-07-27**
