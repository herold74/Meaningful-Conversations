# Documentation Structure

## Overview

The project documentation is organized by purpose and environment.

---

## Core Documentation

### Main README
- **README.md** - Project overview, features, getting started
- **README.de.md** - German version (in DOCUMENTATION/)

### Memory Bank (Active Development Context)
Located in `/memory-bank/`:
- **README.md** - Index of core vs optional files; pointers to Cursor rules
- **activeContext.md** - Current work focus, recent changes
- **progress.md** - Feature status, roadmap
- **techContext.md** - Technical details, deployment
- **productContext.md** - Product vision, UX goals
- **systemPatterns.md** - Architecture decisions
- **projectbrief.md** - Project overview
- **Optional** - e.g. **capacitor-audio-plan.md** (feature/spec plans; fold into core docs when stable)

### Cursor agent skills (project)
Located in `.cursor/skills/meaningful-conversations/`:
- **deployment/SKILL.md** — Versioning, staging/production deploy
- **app-store-connect/SKILL.md** — ASC locales (DE + EN Canada), screenshots, submission locks, metadata-only updates
- **llm-upgrade/SKILL.md** — Google/Mistral SDK upgrades + classic/practice regression QA sequence
- **gdpr-compliance/SKILL.md** — GDPR/DSGVO audits, export/erasure, privacy updates
- **ai-act-compliance/SKILL.md** — EU AI Act Art. 50 transparency, bot-selection disclosure, 50(2) marking roadmap
- **i18n-and-theming/SKILL.md**, **ux-flow/SKILL.md**, **in-app-purchase/SKILL.md**, **132-content-structure/SKILL.md** — domain workflows
- **agent-workflows/SKILL.md** — Subagents, slash commands, hooks
- **tts-voice/SKILL.md**, **auth-access/SKILL.md**, **email-transactional/SKILL.md**, **pdf-export/SKILL.md**, **practice-coaching/SKILL.md** — domain workflows

### Cursor agent infrastructure
- **`.cursor/rules/`** — Always-apply and file-scoped rules (see `README.md`)
- **`.cursor/commands/`** — Slash commands (`/deploy-staging`, `/review`, etc.)
- **`.cursor/hooks.json`** — Project hooks (production deploy gate, secret scan)
- **`AGENTS.md`** (repo root) — Agent entry map

---

## DOCUMENTATION/ Folder

### Essential Guides (Start Here!)
- **CHANGELOG.md** - Version history and release notes index
- **LOCAL-DEV-SETUP.md** - **⭐ Complete setup guide from scratch**
- **TROUBLESHOOTING-INDEX.md** - **⭐ Quick reference for common issues** (includes **Security & npm audit**, e.g. accepted PM2 advisory → `memory-bank/systemPatterns.md` §8)
- **DEPLOYMENT-CHECKLIST.md** - **⭐ MANDATORY deployment procedures (production/staging)**
- **LOCAL-DEV-MIGRATIONS.md** - **⭐ Local database migration guide & troubleshooting**

### Deployment & Infrastructure
- **DEPLOYMENT-READINESS-CHECK.md** - Pre-deployment verification
- **MANUALMODE-DUAL-ENVIRONMENT.md** - Dual staging/production setup
- **QUICK-START-MANUALMODE-SERVER.md** - Quick deployment guide
- **README-MANUALMODE-SERVER.md** - Server overview
- **PODMAN-GUIDE.md** - Container engine reference
- **MARIADB-POD-CONFIGURATION.md** - Database setup
- **NGINX-REVERSE-PROXY-SETUP.md** - Nginx configuration
- **HTTPS-WWW-DNS-GUIDE.md** - Schrittfolge: Deploy (automatisch), DNS beim Anbieter, TLS/Certbot für Apex+`www` ohne Browser-Warnung
- **NGINX-IP-ANONYMIZATION.md** - GDPR-compliant nginx access log IP anonymization (see also `nginx-config/*.template`, `server-scripts/update-nginx-ips.sh`)

### Server Migration (Historical - Completed Nov 2024)
- **ARCHIVED/SERVER-MIGRATION-GUIDE.md** - General migration guide (historical)
- **ARCHIVED/SERVER-MIGRATION-TO-MANUALMODE.md** - Specific migration docs (historical)
- **ARCHIVED/QUICK-MIGRATION.md** - Quick migration steps (historical)

*Note: All server migration docs are in ARCHIVED/ — migration completed November 2024.*

### Registry & Images
- **GITLAB-REGISTRY-SETUP.md** - GitLab Container Registry (current)
- **QUAY-REGISTRY-SETUP.md** - Legacy Quay registry (archived)
- **QUAY-QUICKSTART.md** - Quick registry commands (legacy)

### Version & Release
- **VERSION-MANAGEMENT.md** - Version update workflow

### Features
- **TTS-FINAL-STATUS.md** - Text-to-Speech implementation (current; gitignored ops copy on the maintainer machine)
- **TTS-LOCAL-DEVELOPMENT.md** - Local TTS setup
- **WAKE-LOCK-VOICE-MODE.md** - Screen wake lock feature
- **RAG-IMPLEMENTATION-GUIDE.md** - RAG feature (planned, not shipped)
- **PERSONALITY-PROFILE-IMPLEMENTATION.md** - Personality feature implementation (this folder, not the repo root)
- **PDF-IMPLEMENTATION.md** - PDF export implementation (this folder, not the repo root)
- **GOAL-MANAGEMENT.md** - Goal tracking feature
- **TRANSCRIPT-EVALUATION-USER-GUIDE.md** - User guide for Transcript Evaluation (Client-only, DE)
- **TRANSCRIPT-EVALUATION-USER-GUIDE-EN.md** - User guide for Transcript Evaluation (Client-only, EN)
- **CONNECTOR-OPTIMAL-CONVERSATIONS.md** - Connector QA lab scripts and example turns
- **NARRATIVE-CONNECTOR-QA.md** - Narrative Connector QA notes
- **SAFETY-PROMPT-POLICY.md** - Content-safety prompt policy
- **CRISIS-HELPLINES.md** - Crisis helpline list used by prompts
- **USER-ACCESS-MATRIX.md** - Guest / registered / premium / client access
- **UX-FLOWS.md** - Product flows (header may lag the app version; routing detail is in the ux-flow skill)

*Historical TTS write-ups live in `ARCHIVED/` (`TTS-HYBRID-README.md`, `TTS-SETUP-STATUS.md`). Use TTS-FINAL-STATUS for current voice behavior.*

### App Store
- **APP-STORE-METADATA.md** - **⭐ App Store Connect metadata (description, keywords, review notes, test account, URLs)**

### Social & marketing (local workspace)
- **`DOCUMENTATION/SOCIAL-MEDIA/`** — LinkedIn carousel HTML, video scripts, blog-series drafts, strategy notes. **Gitignored** (not in the public repo). Committable article/newsletter copy may live under **`NEWSLETTER/`**.
- **132 content structure (1 Kernaussage / 3 Punkte / 2 Schlüsse):** **`.cursor/skills/meaningful-conversations/132-content-structure/SKILL.md`**
  - **SOCIAL-MEDIA/LINKEDIN-VIDEO-SKRIPTE.md** — Video-Leitfäden (Serien, z. B. „Gespräche, die entscheiden“).
  - **SOCIAL-MEDIA/LINKEDIN-LAUNCH-FUEHRUNGSTOPICS-TOP10.md** — Top-10-Themen für Führungskräfte, aligned mit Launch-Kampagne / Micro-Learning-Kontext.

### Compliance & Security
- **EU-AI-ACT-COMPLIANCE.md** - EU AI Act risk classification + Art. 50 obligation checklist
- **GDPR-COMPLIANCE-AUDIT.html/md** - English GDPR audit (**v2.5.0**, audit date 2026-07-29)
- **DSGVO-COMPLIANCE-AUDIT.html/md** - German GDPR audit (**v2.5.0**, score 99/100, P1–P3 complete)
- **GDPR-TRANSCRIPT-REMOVAL.md** - Classic chat transcript DB removal (Art. 5 minimisation)
- **GOOGLE-CLOUD-DPA-COMPLIANCE.md** - Google DPA
- **MAILJET-DPA-COMPLIANCE.md** - Mailjet DPA
- **MISTRAL-DPA-COMPLIANCE.md** - Mistral DPA
- **ICF-PLATFORM-COMPLIANCE.md** - ICF Coaching Platform Standards mapping for this product (does not repeat the EU AI Act or GDPR audits). The source PDF stays local and is gitignored.
- **SECURITY-AUDIT-REPORT-2025-11-28.md** - Point-in-time security audit

### Payment
- **PAYPAL-SETUP-GUIDE.md** - PayPal integration

### API & Costs
- **GEMINI-API-COST-TRACKING-IMPLEMENTATION.md** - API usage tracking

### Migration & History
- **CHANGELOG-MARIADB-POD.md** - PostgreSQL to MariaDB migration
- **ARCHIVED/** - Historical documents (cleanup summaries, development history, keyword critique, feature timeline, hybrid TTS, completed server-migration guides)

*Live copies of completed server-migration notes may still sit next to `ARCHIVED/` on a maintainer machine. Prefer the `ARCHIVED/` copies.*

### Goals & Planning
- **GOAL-MANAGEMENT.md** - Goal tracking feature

### Admin
- **ADMIN-MANUAL.md** - Administrator's guide

---

## Root Level Documentation

### Active/Current
- **README.md** - Main project readme
- **Data_Privacy.md** - Privacy policy
- **USER-JOURNEY.md** - User flow documentation
- **MONITORING-GUIDE.md** - System monitoring

### Feature Implementation
Personality and PDF implementation notes live under `DOCUMENTATION/`, not the repo root. See Features above.

### Local-only ops docs
These paths are gitignored so the public repo does not publish server runbooks: `MONITORING-GUIDE.md`, `DEPLOYMENT-CHECKLIST.md`, `DOCUMENTATION/MANUALMODE-DUAL-ENVIRONMENT.md`, `DOCUMENTATION/QUICK-START-MANUALMODE-SERVER.md`, `DOCUMENTATION/TTS-FINAL-STATUS.md`, and the other entries under “Operational & Infrastructure Documentation” in `.gitignore`. On a maintainer checkout they are still the working copies. Agent skills, when present, live in `.cursor/skills/` (source of truth). A `.agents/skills/` tree is a local mirror.

### Incident Reports
- **INCIDENT-REPORTS/INCIDENT-REPORT-2025-12-15.md** - Recent incident
- **INCIDENT-REPORTS/** - Historical incidents

### Configuration
- **SYSTEM-CONFIG.md** - System configuration

---

## Reading Paths

### New to the Project
1. **LOCAL-DEV-SETUP.md** (complete setup from scratch)
2. README.md (overview)
3. memory-bank/productContext.md (vision)
4. memory-bank/techContext.md (technical setup)

### Deploying
1. **LOCAL-DEV-MIGRATIONS.md** (test DB changes locally first!)
2. **DEPLOYMENT-CHECKLIST.md** (mandatory procedures)
3. QUICK-START-MANUALMODE-SERVER.md
4. VERSION-MANAGEMENT.md
5. MANUALMODE-DUAL-ENVIRONMENT.md
6. **APP-STORE-METADATA.md** (iOS App Store updates)

### Understanding Features
1. memory-bank/progress.md (feature list)
2. **COACH-BEHAVIOR-MATRIX.md** (all coach personas and prompt behavior)
3. TTS-FINAL-STATUS.md (voice features)
4. PERSONALITY-PROFILE-IMPLEMENTATION.md (personality system)
5. TRANSCRIPT-EVALUATION-USER-GUIDE.md (transcript analysis for clients)
6. CONNECTOR-OPTIMAL-CONVERSATIONS.md and SAFETY-PROMPT-POLICY.md (Connector lab and safety prompts)

### Debugging/Maintaining
1. **TROUBLESHOOTING-INDEX.md** (quick reference for common issues)
2. memory-bank/activeContext.md (current state)
3. **LOCAL-DEV-MIGRATIONS.md** (database migration issues)
4. INCIDENT-REPORTS/ (past issues)
5. MONITORING-GUIDE.md

---

## Portable templates

- **`templates/portable-memory-bank/`** — Generic Memory Bank (six core Markdown files + Cursor `memory-bank.mdc` + install instructions) for reuse in other projects. See **`templates/portable-memory-bank/INSTALL.md`**.

---

## Documentation audit reports (Feb 2026)

Historical drift audits — use for reference; many items resolved in 2026-08 agent/doc cleanup:

| Report | Focus |
|--------|-------|
| **DOCUMENTATION-DRIFT-AUDIT-CONSOLIDATED-2026-02-26.md** | Master list of open/resolved drift |
| **DOCUMENTATION-DRIFT-AUDIT-2026-02-26.md** | Security & compliance |
| **DOCUMENTATION-AUDIT-REPORT-2026-02-26.md** | UX & admin guides |
| **AUDIT-REPORT-DEPLOYMENT-DOCS.md** | Deployment doc accuracy |

February 2026 drift audits are historical. Open product docs for 2.6.0 are indexed above (Connector, safety, access matrix, ICF mapping).

---

## Current Setup

- **Version:** 2.6.0. Repo `BUILD_NUMBER` **68**. **Staging** Build **67** (mc-beta.manualmode.at, deploy 2026-10-30). **Production** Build **41** (mc-app.manualmode.at) — behind staging until the next production deploy.
- **Server:** Hetzner VPS (`<YOUR_SERVER_IP>` — never commit the real address)
- **Environments:** Staging + Production. They are not on the same build.
- **Container Engine:** Podman + podman-compose
- **Containers:** Frontend, Backend (PM2 x2), TTS (Piper), MariaDB 11.2
- **Registry:** regy.rhepds.com/gherold/meaningful-conversations
- **Deploy:** Automatic health checks + auto-rollback on failure
- **Builds:** Reproducible via `npm ci` in Dockerfiles

**Last Updated:** November 2, 2026
