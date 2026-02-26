# Consolidated Documentation Drift Audit

**Audit Date:** February 26, 2026
**Codebase Version:** 1.9.7
**Documents Audited:** 48
**Method:** Four parallel audit agents scanning documentation against source code

---

## Executive Summary

| Status | Count | Documents |
|--------|-------|-----------|
| ✅ Current | 10 | MANUALMODE-DUAL-ENVIRONMENT, NGINX-IP-ANONYMIZATION, LOCAL-DEV-SETUP, LOCAL-DEV-MIGRATIONS, DSGVO-COMPLIANCE-AUDIT, GDPR-TRANSCRIPT-REMOVAL, GOOGLE-CLOUD-DPA-COMPLIANCE, MAILJET-DPA-COMPLIANCE, MISTRAL-DPA-COMPLIANCE, APP-STORE-CHECKLIST |
| ⚠️ Drift detected | 28 | See details below |
| ❌ Significantly outdated | 2 | RAG-IMPLEMENTATION-GUIDE, TRANSCRIPT-EVALUATION-USER-GUIDE-EN |
| 🗄️ Archive candidates | 6 | CHANGELOG-MARIADB-POD, SERVER-MIGRATION-GUIDE, SERVER-MIGRATION-TO-MANUALMODE, MANUALMODE-SERVER-MIGRATION-SUMMARY, QUICK-MIGRATION, TTS-SETUP-STATUS |
| ✅ Current (WHITE-LABEL) | 1 | WHITE-LABEL-GUIDE |

---

## High-Priority Findings

### 1. SECURITY: PayPal Webhook Signature Not Implemented
- **Risk: HIGH** — `routes/purchase.js` `verifyPayPalSignature()` always returns `true`
- Anyone can send fake purchase webhooks to upgrade accounts
- **Action:** Implement real PayPal webhook signature verification

### 2. USER-ACCESS-MATRIX: Trial Period Mismatch
- **Risk: MEDIUM** — Doc says "14-day Premium trial", code uses **9 days** (`routes/auth.js` lines 72–76)
- Developer tier documented as full bot access, but `BotSelection.tsx` only checks `isAdmin`, not `isDeveloper`
- **Action:** Align trial period in doc or code; add `isDeveloper` to bot access check if intended

### 3. TRANSCRIPT-EVALUATION-USER-GUIDE-EN: Wrong Access Tier
- **Risk: MEDIUM** — English guide says "exclusively for Clients" and FAQ says Premium cannot use it
- Actually available to Premium, Client, Admin, Developer
- **Action:** Rewrite EN guide to match DE guide and code

### 4. RAG-IMPLEMENTATION-GUIDE: Never Implemented
- **Risk: LOW** — Pure planning document, no RAG service or vector DB exists in codebase
- **Action:** Add "PLANNED — NOT YET IMPLEMENTED" header or move to `ARCHIVED/`

---

## Cross-Cutting Issues (Affecting 10+ Documents)

### A. Old Server IP: `<YOUR_SERVER_IP>` → `<YOUR_SERVER_IP>`
**Affected docs:** QUICK-START-MANUALMODE-SERVER, MARIADB-POD-CONFIGURATION, NGINX-REVERSE-PROXY-SETUP, QUAY-REGISTRY-SETUP, QUAY-QUICKSTART, GEMINI-API-COST-TRACKING-IMPLEMENTATION, README-MANUALMODE-SERVER, CHANGELOG-MARIADB-POD, SERVER-MIGRATION-GUIDE, QUICK-MIGRATION

### B. Old Script Names: `deploy-alternative.sh` → `deploy-manualmode.sh`
**Affected docs:** DEPLOYMENT-READINESS-CHECK, NGINX-REVERSE-PROXY-SETUP, QUAY-REGISTRY-SETUP, README-MANUALMODE-SERVER

### C. Old Paths: `/opt/meaningful-conversations-*` → `/opt/manualmode-*`
**Affected docs:** MARIADB-POD-CONFIGURATION, QUICK-START-MANUALMODE-SERVER, README-MANUALMODE-SERVER, QUAY-REGISTRY-SETUP

### D. Old Doc Links: `ALTERNATIVE-SERVER-*` → `MANUALMODE-*`
**Affected docs:** QUICK-START-MANUALMODE-SERVER, PODMAN-GUIDE, NGINX-REVERSE-PROXY-SETUP, README-MANUALMODE-SERVER

### E. TTS Voice: "Sophia" → "Eva" (`de_DE-eva_k-x_low`)
**Affected docs:** TTS-FINAL-STATUS, TTS-HYBRID-README

### F. Section Name: "Tools" → "Management & Kommunikation"
**Affected docs:** UX-FLOWS, TRANSCRIPT-EVALUATION-USER-GUIDE (DE), TRANSCRIPT-EVALUATION-USER-GUIDE-EN

---

## Per-Document Status

### Deployment & Infrastructure (19 docs)

| Document | Status | Key Issues |
|----------|--------|------------|
| DEPLOYMENT-CHECKLIST | ⚠️ Drift | Missing deploy-manualmode.sh, rollback, TTS; wrong nginx script path |
| DEPLOYMENT-READINESS-CHECK | ⚠️ Drift | References deploy-alternative.sh; historical snapshot |
| VERSION-MANAGEMENT | ⚠️ Drift | sw.js format wrong; metadata.json example outdated |
| MANUALMODE-DUAL-ENVIRONMENT | ✅ Current | Minor: version header says 1.8.4 |
| QUICK-START-MANUALMODE-SERVER | ⚠️ Drift | Old IP, old make targets, old doc links |
| PODMAN-GUIDE | ⚠️ Drift | Old doc links; references nonexistent test-deployment.sh |
| MARIADB-POD-CONFIGURATION | ⚠️ Drift | Old IP, old paths throughout |
| NGINX-REVERSE-PROXY-SETUP | ⚠️ Drift | Old IP, old script names; missing /tts/ location |
| NGINX-IP-ANONYMIZATION | ✅ Current | — |
| QUAY-REGISTRY-SETUP | ⚠️ Drift | Old IP, old scripts; missing TTS image |
| QUAY-QUICKSTART | ⚠️ Drift | Old IP, old scripts |
| LOCAL-DEV-SETUP | ✅ Current | — |
| LOCAL-DEV-MIGRATIONS | ✅ Current | — |
| README-MANUALMODE-SERVER | ⚠️ Drift | Old paths, old make targets, old doc links |
| CHANGELOG-MARIADB-POD | 🗄️ Archive | Migration completed |
| SERVER-MIGRATION-GUIDE | 🗄️ Archive | Migration completed |
| SERVER-MIGRATION-TO-MANUALMODE | 🗄️ Archive | Migration completed |
| MANUALMODE-SERVER-MIGRATION-SUMMARY | 🗄️ Archive | Migration completed |
| QUICK-MIGRATION | 🗄️ Archive | Migration completed |

### Feature Implementation (13 docs)

| Document | Status | Key Issues |
|----------|--------|------------|
| PERSONALITY-PROFILE-IMPLEMENTATION | ⚠️ Drift | Phases 2/3 marked "not implemented" but are; wrong file name (profileAdaptation → profileRefinement); missing Spiral Dynamics, PDF |
| PDF-IMPLEMENTATION | ⚠️ Drift | References html2pdf.js/pdfGenerator.ts; actual: @react-pdf/renderer/pdfGeneratorReact.tsx; missing transcriptEvaluationPDF |
| TTS-FINAL-STATUS | ⚠️ Drift | Wrong voice (Sophia → Eva); version 1.7.9 → 1.9.7; old bot ID |
| TTS-HYBRID-README | ⚠️ Drift | Wrong voice; version 1.5.8 → 1.9.7 |
| TTS-LOCAL-DEVELOPMENT | ⚠️ Drift | Describes local Piper; actual uses TTS container |
| TTS-SETUP-STATUS | 🗄️ Archive | Superseded by TTS-FINAL-STATUS |
| GEMINI-API-COST-TRACKING | ⚠️ Drift | Old server IP; missing DELETE endpoint |
| WAKE-LOCK-VOICE-MODE | ⚠️ Drift | Code moved from inline to useWakeLock hook; version 1.5.5 → 1.9.7 |
| GOAL-MANAGEMENT | ⚠️ Drift | Wrong AI model (Gemini 3.0 → 2.5); wrong function name |
| RAG-IMPLEMENTATION-GUIDE | ❌ Outdated | Planning doc only; nothing implemented |
| KEYWORD-CRITIQUE | ⚠️ Drift | Wrong file references; adaptiveKeywordWeighting partially addresses critique |
| WHITE-LABEL-GUIDE | ✅ Current | — |
| FEATURE-DEVELOPMENT-TIMELINE | ⚠️ Drift | Version mismatch; needs refresh |

### Security, Compliance & Payment (9 docs)

| Document | Status | Risk |
|----------|--------|------|
| SECURITY-AUDIT-REPORT-2025-11-28 | ⚠️ Drift | Medium — jws fixed, rate limiting done, PayPal still open, encryptionSalt recommendation wrong |
| DSGVO-COMPLIANCE-AUDIT | ✅ Current | Low |
| GDPR-TRANSCRIPT-REMOVAL | ✅ Current | Low — legacy logSessionBehavior unused |
| GOOGLE-CLOUD-DPA-COMPLIANCE | ✅ Current | Low |
| MAILJET-DPA-COMPLIANCE | ✅ Current | Low |
| MISTRAL-DPA-COMPLIANCE | ✅ Current | Low |
| PAYPAL-SETUP-GUIDE | ⚠️ Drift | **HIGH** — webhook signature still not implemented |
| APP-STORE-CHECKLIST | ✅ Current | Low |
| USER-ACCESS-MATRIX | ⚠️ Drift | Medium — trial 14d→9d; Developer bot access gap |

### UX & Admin Guides (7 docs)

| Document | Status | Key Issues |
|----------|--------|------------|
| UX-FLOWS | ⚠️ Drift | Wrong admin startup options; missing Gloria Interview flow; "Tools" → "Management & Kommunikation" |
| ADMIN-MANUAL | ⚠️ Drift | Missing Developer role, AI Provider, Transcript Ratings, code revoke |
| TRANSCRIPT-EVALUATION-USER-GUIDE (DE) | ⚠️ Drift | "Tools" section name; missing Audio tab, GDPR consent, speaker mapping |
| TRANSCRIPT-EVALUATION-USER-GUIDE-EN | ❌ Outdated | Wrong access tier (Client-only vs Premium+); version 1.9.3 vs 1.9.7 |
| TROUBLESHOOTING-INDEX | ⚠️ Drift | Missing Android voice, Safari PDF, iOS audio issues |
| DOCUMENTATION-STRUCTURE | ⚠️ Drift | Version 1.8.7; 8+ docs not indexed; wrong access description |
| README.de | ⚠️ Drift | Port 3000 → 5173; missing brand/white-label mention |

---

## Recommended Action Plan

### Phase 1: Quick Wins (1 hour)
1. Global find-replace: `<YOUR_SERVER_IP>` → `<YOUR_SERVER_IP>` across all DOCUMENTATION/
2. Global find-replace: `deploy-alternative.sh` → `deploy-manualmode.sh`
3. Global find-replace: `/opt/meaningful-conversations-` → `/opt/manualmode-`
4. Global find-replace: `ALTERNATIVE-SERVER` → `MANUALMODE` in doc links
5. Archive 6 historical docs to `DOCUMENTATION/ARCHIVED/`

### Phase 2: Content Fixes (2–3 hours)
6. Fix TRANSCRIPT-EVALUATION-USER-GUIDE-EN access tier and sync with DE
7. Update TTS docs: Sophia → Eva, version numbers
8. Update PDF-IMPLEMENTATION: html2pdf.js → @react-pdf/renderer
9. Update PERSONALITY-PROFILE-IMPLEMENTATION: mark Phases 2/3 as implemented
10. Update UX-FLOWS & ADMIN-MANUAL: admin startup, Gloria Interview, Developer role
11. Update DOCUMENTATION-STRUCTURE: add 8+ missing doc entries

### Phase 3: Security (separate task)
12. Implement PayPal webhook signature verification
13. Decide on trial period (9 vs 14 days) and align code + docs
14. Add `isDeveloper` to BotSelection if intended
15. Update SECURITY-AUDIT-REPORT with current findings

---

## Detailed Audit Reports

For per-document line-level findings, see:
- `DOCUMENTATION/AUDIT-REPORT-DEPLOYMENT-DOCS.md` — Deployment & Infrastructure
- `DOCUMENTATION/DOCUMENTATION-DRIFT-AUDIT-REPORT.md` — Feature Implementation
- `DOCUMENTATION/DOCUMENTATION-DRIFT-AUDIT-2026-02-26.md` — Security & Compliance
- `DOCUMENTATION/DOCUMENTATION-AUDIT-REPORT-2026-02-26.md` — UX & Admin Guides
