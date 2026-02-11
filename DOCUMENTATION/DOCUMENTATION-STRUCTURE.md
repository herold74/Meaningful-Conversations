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

### Deployment & Infrastructure
- **MANUALMODE-DUAL-ENVIRONMENT.md** - Dual staging/production setup
- **QUICK-START-MANUALMODE-SERVER.md** - Quick deployment guide
- **README-MANUALMODE-SERVER.md** - Server overview
- **PODMAN-GUIDE.md** - Container engine reference
- **MARIADB-POD-CONFIGURATION.md** - Database setup
- **NGINX-REVERSE-PROXY-SETUP.md** - Nginx configuration
- **NGINX-IP-ANONYMIZATION.md** - Privacy-compliant logging

### Registry & Images
- **QUAY-REGISTRY-SETUP.md** - Container registry setup
- **QUAY-QUICKSTART.md** - Quick registry commands

### Version & Release
- **VERSION-MANAGEMENT.md** - Version update workflow

### Features
- **TTS-FINAL-STATUS.md** - Text-to-Speech implementation
- **TTS-HYBRID-README.md** - Hybrid TTS architecture
- **TTS-LOCAL-DEVELOPMENT.md** - Local TTS setup
- **WAKE-LOCK-VOICE-MODE.md** - Screen wake lock feature
- **RAG-IMPLEMENTATION-GUIDE.md** - RAG feature (planned)

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
- **SERVER-MIGRATION-GUIDE.md** - Server migration docs
- **QUICK-MIGRATION.md** - Quick migration steps
- **COMPLETE-CLEANUP-SUMMARY.md** - Documentation cleanup history
- **DOCUMENTATION-CLEANUP-SUMMARY.md** - Previous cleanup details
- **DEVELOPMENT-HISTORY.md** - Feature development timeline
- **FEATURE-DEVELOPMENT-TIMELINE.md** - Detailed timeline

### Goals & Planning
- **GOAL-MANAGEMENT.md** - Goal tracking feature

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
1. README.md (overview)
2. memory-bank/productContext.md (vision)
3. memory-bank/techContext.md (technical setup)

### Deploying
1. QUICK-START-MANUALMODE-SERVER.md
2. VERSION-MANAGEMENT.md
3. MANUALMODE-DUAL-ENVIRONMENT.md

### Understanding Features
1. memory-bank/progress.md (feature list)
2. TTS-FINAL-STATUS.md (voice features)
3. PERSONALITY-PROFILE-IMPLEMENTATION.md (personality system)

### Debugging/Maintaining
1. memory-bank/activeContext.md (current state)
2. INCIDENT-REPORTS/ (past issues)
3. MONITORING-GUIDE.md

---

## Current Setup

- **Version:** 1.8.4
- **Server:** Hetzner VPS (91.99.193.87)
- **Environments:** Staging (mc-beta.manualmode.at) + Production (mc-app.manualmode.at)
- **Container Engine:** Podman + podman-compose
- **Containers:** Frontend, Backend (PM2 x2), TTS (Piper), MariaDB 11.2
- **Registry:** quay.myandi.de/gherold
- **Deploy:** Automatic health checks + auto-rollback on failure
- **Builds:** Reproducible via `npm ci` in Dockerfiles

**Last Updated:** February 2026
