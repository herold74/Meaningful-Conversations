# Documentation Drift Audit Report

**Audit Date:** February 26, 2026  
**Scope:** Feature implementation documentation vs. actual codebase  
**Auditor:** Cursor AI (documentation-first principle)

---

## 1. PERSONALITY-PROFILE-IMPLEMENTATION.md

**Status:** ⚠️ Drift detected

### Specific Issues

| Doc Section/Line | Issue | Actual Code |
|------------------|------|-------------|
| Phase 2/3 "Not Yet Implemented" (lines 94–117) | DPC and DPFL are implemented | `profileRefinement.js` exists; `behaviorLogger.js` exists; `routes/personality.js` uses `profileRefinement` |
| "profileAdaptation.js" (line 107) | Wrong filename | Actual: `profileRefinement.js` |
| Schema: `testType` only (lines 155–181) | Schema evolved | `PersonalityProfile` has `completedLenses`, `adaptationMode`, `filterWorry`, `filterControl` |
| "Markdown download" (line 57) | Outdated flow | Uses PDF via `pdfGeneratorReact.tsx` (@react-pdf/renderer), not Markdown |
| "RIEMANN or BIG5" path (line 156) | Incomplete | Supports `sd` (Spiral Dynamics), `riemann`, `ocean` (BFI-2) |
| "40% of total plan" (line 223) | Understated | DPC, DPFL, narrative profile, multi-lens system are implemented |

### Missing Coverage

- `PersonalityProfileView.tsx` – main profile display component
- `pdfGeneratorReact.tsx` – PDF generation (replaces Markdown)
- Spiral Dynamics lens and `SpiralDynamicsVisualization`
- Narrative profile (Golden Questions, flow/friction stories)
- `adaptationMode` (adaptive vs. stable)
- Premium enforcement for Riemann/SD lenses
- `contextUpdater.ts` integration for Life Context updates

---

## 2. PDF-IMPLEMENTATION.md

**Status:** ⚠️ Drift detected

### Specific Issues

| Doc Section/Line | Issue | Actual Code |
|------------------|------|-------------|
| "utils/pdfGenerator.ts" (lines 38–40) | Wrong file | Actual: `utils/pdfGeneratorReact.tsx` |
| "utils/surveyResultHtmlFormatter.ts" (lines 32–36) | File does not exist | Actual: `utils/pdfGeneratorReact.tsx` uses @react-pdf/renderer (no HTML formatter) |
| "html2pdf.js" (lines 25, 165) | Wrong dependency | Actual: `@react-pdf/renderer` (package.json); no html2pdf.js |
| "surveyResultFormatter.ts" deleted (line 59) | Wrong file | Actual: `utils/surveyResultInterpreter.ts` exists (different purpose) |

### Missing Coverage

- `utils/transcriptEvaluationPDF.tsx` – PDF for transcript evaluations (separate feature)
- `@react-pdf/renderer` as the PDF engine
- Capacitor Share/Filesystem for iOS PDF delivery
- Web vs. Capacitor delivery paths in `pdfGeneratorReact.tsx`

---

## 3. TTS-FINAL-STATUS.md

**Status:** ⚠️ Drift detected

### Specific Issues

| Doc Section/Line | Issue | Actual Code |
|------------------|------|-------------|
| "Sophia (de_DE-mls-medium)" (lines 81, 99–117) | Wrong voice | Frontend `ttsService.ts`: German female is **Eva** (`de_DE-eva_k-x_low`) |
| "3 Server-Stimmen" (line 81) | Understated | Frontend has 4: Thorsten, Eva, Amy, Ryan |
| "G-Interviewer" (line 99) | Old bot ID | Actual: `gloria-life-context` |
| Version "v1.7.9" (lines 1, 269) | Outdated | `package.json`: v1.9.7 |
| "Nobody (nexus-gps)" (line 117) | Correct | Matches code |

### Missing Coverage

- `nativeTtsService.ts` – native iOS TTS
- `capacitorAudioService.ts` – Capacitor audio handling
- `useWakeLock` hook (moved from inline in ChatView)
- Eva as German female voice (replacing Sophia/mls)

---

## 4. TTS-HYBRID-README.md

**Status:** ⚠️ Drift detected

### Specific Issues

| Doc Section/Line | Issue | Actual Code |
|------------------|------|-------------|
| "Sophia (de_DE-mls-medium)" (lines 31, 116) | Wrong voice | Actual: Eva (`de_DE-eva_k-x_low`) |
| "Production: v1.5.8" (line 111) | Outdated | Current: v1.9.7 |
| "utils/pdfGenerator.ts" reference in file structure | N/A | PDF uses `pdfGeneratorReact.tsx` |
| "de-mls" in SERVER_VOICES (line 163) | Wrong ID | Actual: `de-eva` |
| Version "1.6.1" (line 428) | Outdated | v1.9.7 |

### Missing Coverage

- Eva voice model
- Native iOS TTS path
- `useWakeLock` hook extraction

---

## 5. TTS-LOCAL-DEVELOPMENT.md

**Status:** ⚠️ Drift detected

### Specific Issues

| Doc Section/Line | Issue | Actual Code |
|------------------|------|-------------|
| "Piper TTS im Backend" (Option 3, lines 34–79) | Architecture mismatch | TTS runs in separate container; backend uses `TTS_SERVICE_URL` |
| "PIPER_VOICE_DIR", "PIPER_COMMAND" (lines 58–60) | Obsolete for container setup | Backend proxies to TTS container; no local Piper config |
| "download-voice-models.sh" (line 47) | Script may not exist | Need to verify; TTS container has its own voice setup |
| "Staging/Production: Piper bereits installiert" (lines 84–86) | Misleading | Piper runs in TTS container, not in backend |

### Missing Coverage

- TTS container as primary server TTS path
- Local dev: use device voices or run TTS container
- No local Piper installation for typical dev workflow

---

## 6. TTS-SETUP-STATUS.md

**Status:** 🗄️ Historical/archive candidate

### Notes

- Document correctly marked as superseded by TTS-FINAL-STATUS.md (line 3)
- Production version "v1.5.8" outdated (current: v1.9.7)
- Staging/production status may be stale
- Keep for historical reference; primary source should be TTS-FINAL-STATUS.md

---

## 7. GEMINI-API-COST-TRACKING-IMPLEMENTATION.md

**Status:** ⚠️ Drift detected

### Specific Issues

| Doc Section/Line | Issue | Actual Code |
|------------------|------|-------------|
| Server "root@<YOUR_SERVER_IP>" (lines 142, 179, 287) | Wrong server | Current: `<YOUR_SERVER_IP>` (Manualmode); <YOUR_SERVER_IP> is old Hetzner |
| "5 endpoints" (line 227) | Incomplete | Also has `DELETE /api/api-usage/failed` |
| "make deploy-alternative-staging" (line 131) | May be outdated | Check Makefile for current deploy targets |
| "Implementation Date: November 6, 2024" (line 318) | Old | apiUsageTracker has Gemini 3 pricing (gemini-3-flash-preview, gemini-3-pro-preview) |

### Accurate

- `routes/apiUsage.js`, `services/apiUsageTracker.js`, `ApiUsageView.tsx` exist and match
- Endpoints: stats, daily, top-users, recent, projections
- Pricing for Gemini 2.5 Flash/Pro
- Database schema and migration

---

## 8. WAKE-LOCK-VOICE-MODE.md

**Status:** ⚠️ Drift detected

### Specific Issues

| Doc Section/Line | Issue | Actual Code |
|------------------|------|-------------|
| Inline `useEffect` in ChatView (lines 24–78) | Implementation moved | Actual: `useWakeLock()` hook in `hooks/useWakeLock.ts` |
| ChatView imports `navigator.wakeLock` directly | Refactored | ChatView uses `useWakeLock` from `../hooks/useWakeLock` |
| Version "1.5.5" (line 4) | Outdated | package.json: v1.9.7 |

### Accurate

- Screen Wake Lock API usage
- Voice mode activation/deactivation
- Visibility change re-acquisition
- Browser support (Safari 16.4+, Chrome 84+)
- Fallback when unsupported (`isSupported`)

### Missing Coverage

- `hooks/useWakeLock.ts` as the implementation
- `wakeLock.isSupported` for fallback UI (`chat_keep_screen_on`)

---

## 9. GOAL-MANAGEMENT.md

**Status:** ⚠️ Drift detected

### Specific Issues

| Doc Section/Line | Issue | Actual Code |
|------------------|------|-------------|
| "Gemini 3.0 Pro" (lines 199, 230, 328) | Wrong model | Session analysis uses `gemini-2.5-pro` (gemini.js:779) |
| "removeItemsFromSection" (lines 260–271) | Wrong function name | Actual: `removeCompletedItems` in `contextUpdater.ts` |
| "contextUpdater.ts" (line 211) | Correct file | Matches |
| "gemini-3-pro-preview" (line 329) | Wrong model | Analysis uses `gemini-2.5-pro` |

### Accurate

- Accomplished goals and completed steps logic
- `SessionReview.tsx` integration
- `geminiPrompts.js` schema for `accomplishedGoals`, `completedSteps`
- `buildUpdatedContext` flow
- Diff viewer and accept/reject behavior

---

## 10. RAG-IMPLEMENTATION-GUIDE.md

**Status:** ❌ Significantly outdated (plan only)

### Notes

- Implementation guide / plan, not a description of shipped code
- No RAG service, vector DB (Qdrant/ChromaDB), or keyword-detection integration found
- Phase 1–3 are planned, not implemented
- Example datasets (Anhang A) are design artifacts
- **Recommendation:** Add header: "PLANNED – NOT YET IMPLEMENTED" or move to ARCHIVED/PLANS/

---

## 11. KEYWORD-CRITIQUE.md

**Status:** ⚠️ Drift detected

### Specific Issues

| Doc Section/Line | Issue | Actual Code |
|------------------|------|-------------|
| "behaviorLogger.js (Zeilen 12-430)" (line 5) | Line range may be wrong | behaviorLogger.js is ~1500+ lines |
| "profileAdaptation.js" (implied in roadmap) | Wrong name | Actual: `profileRefinement.js` |
| Critique written before adaptive weighting | Partially addressed | `adaptiveKeywordWeighting.js` exists; behaviorLogger uses it (Phase 2a) |

### Accurate

- behaviorLogger.js as main keyword source
- adaptiveKeywordWeighting.js exists and is used
- Riemann, Big5, Spiral Dynamics keyword structure
- Low-keyword imbalance and other critique points
- Roadmap phases (some implemented)

### Missing Coverage

- `adaptiveKeywordWeighting.js` – static weighting, context analyzer, sentiment
- `keywordWeightingMatrix.js`, `contextAnalyzer.js`, `sentimentAnalyzer.js`
- Unicode-aware keyword regex (`createKeywordRegex`)
- Extended Nähe low-keywords (doc suggestions partially implemented)

---

## 12. WHITE-LABEL-GUIDE.md

**Status:** ✅ Current

### Verified

- `config/brand.ts` – frontend brand config
- `meaningful-conversations-backend/config/brand.js` – backend brand config
- `vite-plugin-brand.ts` – injects CSS vars, manifest
- `tailwind.config.js` – brand tokens (`brand-light`, `brand-mid`, etc.)
- `index.css` – `--brand-color-*` variables
- Env vars: `VITE_BRAND_*`, `BRAND_*`
- `brands/w4f.env` pre-built config

### Minor Gaps

- Backend path: doc says `config/brand.js`; actual: `meaningful-conversations-backend/config/brand.js` (path is correct in context)
- `vite-plugin-brand.ts` injects into `index.html`; doc could mention this explicitly

---

## 13. FEATURE-DEVELOPMENT-TIMELINE.md

**Status:** ⚠️ Drift detected

### Specific Issues

| Doc Section/Line | Issue | Actual Code |
|------------------|------|-------------|
| Version references (v1.8.4, v1.8.7, etc.) | Version mismatch | package.json: v1.9.7 |
| "Victor - Systemic Coach" (line 30) | Check bot ID | Verify `victor-bowen` in constants |
| "Last updated: February 19, 2026" (line 396) | Recent | May need refresh for latest features |

### Accurate

- Gloria Interview Bot, Transcript Evaluation, Personality Profiling
- DPC/DPFL, multi-tier access, upgrade codes
- Test Runner, API usage tracking
- IAP as planned (not implemented)
- Phase structure and milestones

### Missing Coverage

- Native IAP / RevenueCat if partially implemented
- Eva TTS voice
- Any features added after Feb 19, 2026

---

## Summary Table

| Document | Status | Priority |
|----------|--------|----------|
| PERSONALITY-PROFILE-IMPLEMENTATION.md | ⚠️ Drift detected | High |
| PDF-IMPLEMENTATION.md | ⚠️ Drift detected | High |
| TTS-FINAL-STATUS.md | ⚠️ Drift detected | High |
| TTS-HYBRID-README.md | ⚠️ Drift detected | Medium |
| TTS-LOCAL-DEVELOPMENT.md | ⚠️ Drift detected | Medium |
| TTS-SETUP-STATUS.md | 🗄️ Historical/archive candidate | Low |
| GEMINI-API-COST-TRACKING-IMPLEMENTATION.md | ⚠️ Drift detected | Medium |
| WAKE-LOCK-VOICE-MODE.md | ⚠️ Drift detected | Low |
| GOAL-MANAGEMENT.md | ⚠️ Drift detected | Medium |
| RAG-IMPLEMENTATION-GUIDE.md | ❌ Significantly outdated (plan only) | High |
| KEYWORD-CRITIQUE.md | ⚠️ Drift detected | Low |
| WHITE-LABEL-GUIDE.md | ✅ Current | — |
| FEATURE-DEVELOPMENT-TIMELINE.md | ⚠️ Drift detected | Medium |

---

## Recommended Actions

1. **High priority:** Update PERSONALITY-PROFILE-IMPLEMENTATION.md and PDF-IMPLEMENTATION.md to match current implementation (pdfGeneratorReact, profileRefinement, multi-lens, etc.).
2. **RAG-IMPLEMENTATION-GUIDE.md:** Add "PLANNED – NOT YET IMPLEMENTED" or move to ARCHIVED/PLANS/.
3. **TTS docs:** Align voice names (Eva vs. Sophia), version (1.9.7), and architecture (container vs. local Piper).
4. **GEMINI-API-COST-TRACKING:** Update server IP to <YOUR_SERVER_IP> where applicable.
5. **WAKE-LOCK-VOICE-MODE:** Document `useWakeLock` hook and update code sample.
6. **GOAL-MANAGEMENT:** Correct model (gemini-2.5-pro) and function name (`removeCompletedItems`).
7. **TTS-SETUP-STATUS:** Consider archiving; keep TTS-FINAL-STATUS as primary.

---

*Generated by documentation drift audit. Follow DOCUMENTATION-STRUCTURE.md and core.mdc for update procedures.*
