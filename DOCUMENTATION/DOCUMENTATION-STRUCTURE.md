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
- **activeContext.md** - Current work focus, recent changes
- **progress.md** - Feature status, roadmap
- **techContext.md** - Technical details, deployment
- **productContext.md** - Product vision, UX goals
- **systemPatterns.md** - Architecture decisions
- **projectbrief.md** - Project overview

---

## DOCUMENTATION/ Folder

### Essential Guides (Start Here!)
- **LOCAL-DEV-SETUP.md** - **⭐ Complete setup guide from scratch**
- **TROUBLESHOOTING-INDEX.md** - **⭐ Quick reference for common issues**
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
- **NGINX-IP-ANONYMIZATION.md** - Privacy-compliant logging

### Server Migration (Historical - Completed Nov 2024)
- **SERVER-MIGRATION-GUIDE.md** - General migration guide (⚠️ historical)
- **SERVER-MIGRATION-TO-MANUALMODE.md** - Specific migration docs (⚠️ historical)
- **MANUALMODE-SERVER-MIGRATION-SUMMARY.md** - Migration summary (⚠️ historical)
- **QUICK-MIGRATION.md** - Quick migration steps (⚠️ historical)

*Note: All server migration docs are marked as historical - the migration was completed in November 2024.*

### Registry & Images
- **QUAY-REGISTRY-SETUP.md** - Container registry setup
- **QUAY-QUICKSTART.md** - Quick registry commands

### Version & Release
- **VERSION-MANAGEMENT.md** - Version update workflow

### Features
- **TTS-FINAL-STATUS.md** - Text-to-Speech implementation (current)
- **TTS-HYBRID-README.md** - Hybrid TTS architecture (⚠️ see TTS-FINAL-STATUS for latest)
- **TTS-LOCAL-DEVELOPMENT.md** - Local TTS setup
- **TTS-SETUP-STATUS.md** - TTS setup report v1.6.0 (⚠️ historical, see TTS-FINAL-STATUS)
- **WAKE-LOCK-VOICE-MODE.md** - Screen wake lock feature
- **RAG-IMPLEMENTATION-GUIDE.md** - RAG feature (planned)
- **PERSONALITY-PROFILE-IMPLEMENTATION.md** - Personality feature implementation
- **PDF-IMPLEMENTATION.md** - PDF export implementation
- **GOAL-MANAGEMENT.md** - Goal tracking feature
- **TRANSCRIPT-EVALUATION-USER-GUIDE.md** - **⭐ User guide for Transcript Evaluation feature (Client-only, DE)**
- **TRANSCRIPT-EVALUATION-USER-GUIDE-EN.md** - **⭐ User guide for Transcript Evaluation feature (Client-only, EN)**

*Note: TTS-SETUP-STATUS and TTS-HYBRID-README are marked as historical/superseded. Use TTS-FINAL-STATUS for current info.*

### Compliance & Security
- **GDPR-COMPLIANCE-AUDIT.html/md** - English GDPR audit
- **DSGVO-COMPLIANCE-AUDIT.html/md** - German GDPR audit
- **GOOGLE-CLOUD-DPA-COMPLIANCE.md** - Google DPA
- **MAILJET-DPA-COMPLIANCE.md** - Mailjet DPA

### Payment
- **PAYPAL-SETUP-GUIDE.md** - PayPal integration

### API & Costs
- **GEMINI-API-COST-TRACKING-IMPLEMENTATION.md** - API usage tracking

### Migration & History
- **CHANGELOG-MARIADB-POD.md** - PostgreSQL to MariaDB migration
- **FEATURE-DEVELOPMENT-TIMELINE.md** - Detailed feature timeline
- **ARCHIVED/** - Historical documents (cleanup summaries, development history)

*Note: COMPLETE-CLEANUP-SUMMARY.md, DOCUMENTATION-CLEANUP-SUMMARY.md, and DEVELOPMENT-HISTORY.md have been moved to ARCHIVED/ folder.*

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

### Feature Implementation (Historical)
- **PERSONALITY-PROFILE-IMPLEMENTATION.md** - Personality feature docs
- **PDF-IMPLEMENTATION.md** - PDF export docs

### Incident Reports
- **INCIDENT-REPORT-2025-12-15.md** - Recent incident
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

### Understanding Features
1. memory-bank/progress.md (feature list)
2. TTS-FINAL-STATUS.md (voice features)
3. PERSONALITY-PROFILE-IMPLEMENTATION.md (personality system)
4. TRANSCRIPT-EVALUATION-USER-GUIDE.md (transcript analysis for clients)

### Debugging/Maintaining
1. **TROUBLESHOOTING-INDEX.md** (quick reference for common issues)
2. memory-bank/activeContext.md (current state)
3. **LOCAL-DEV-MIGRATIONS.md** (database migration issues)
4. INCIDENT-REPORTS/ (past issues)
5. MONITORING-GUIDE.md

---

## Current Setup

- **Version:** 1.8.7
- **Server:** Hetzner VPS (91.99.193.87)
- **Environments:** Staging (mc-beta.manualmode.at) + Production (mc-app.manualmode.at)
- **Container Engine:** Podman + podman-compose
- **Containers:** Frontend, Backend (PM2 x2), TTS (Piper), MariaDB 11.2
- **Registry:** quay.myandi.de/gherold
- **Deploy:** Automatic health checks + auto-rollback on failure
- **Builds:** Reproducible via `npm ci` in Dockerfiles

**Last Updated:** February 13, 2026
