# 📚 Documentation Structure

## Overview

The project documentation is organized by deployment environment and purpose.

---

## 📖 Core Documentation

### Main README

1. **README.md**
   - **Purpose:** Project overview and getting started
   - **Content:** Features, tech stack, setup instructions
   - **Audience:** Everyone new to the project

### Google Cloud Run Deployment

2. **DEPLOYMENT-QUICKSTART.md**
   - **Purpose:** Google Cloud Run deployment guide
   - **Content:** Staging and production deployment workflows
   - **Audience:** Users deploying to Google Cloud

### Alternative Server Deployment

3. **README-ALTERNATIVE-SERVER.md**
   - **Purpose:** Entry point for alternative server
   - **Content:** Overview, architecture, quick commands
   - **Audience:** Everyone starting with alternative server
   - **Links to:** All alternative server guides

4. **QUICK-START-ALTERNATIVE-SERVER.md**
   - **Purpose:** Get alternative server running in 5 minutes
   - **Content:** Step-by-step setup, common commands, troubleshooting
   - **Audience:** Users who want to deploy quickly
   - **Depth:** Practical, command-focused

5. **ALTERNATIVE-SERVER-DUAL-ENVIRONMENT.md** ⭐
   - **Purpose:** Comprehensive alternative server guide
   - **Content:** 
     - Dual environment (staging/production) architecture
     - Complete deployment workflows
     - Database management
     - Data migration between environments
     - Advanced troubleshooting
     - Security best practices
   - **Audience:** Users who need detailed information
   - **Depth:** Complete reference guide

### Infrastructure & Configuration

6. **QUAY-REGISTRY-SETUP.md**
   - **Purpose:** Container registry configuration
   - **Content:** Using quay.myandi.de/gherold registry
   - **Audience:** Alternative server users

7. **QUAY-QUICKSTART.md**
   - **Purpose:** Quick reference for Quay
   - **Content:** Essential Quay commands
   - **Audience:** Alternative server users

8. **MARIADB-POD-CONFIGURATION.md**
   - **Purpose:** Database and pod technical details
   - **Content:** MariaDB operations, pod networking, dual environment setup
   - **Audience:** Users managing databases

9. **PODMAN-GUIDE.md**
   - **Purpose:** Podman reference documentation
   - **Content:** Podman commands, concepts, installation
   - **Audience:** Users wanting to understand Podman

### Comparison & Decision Making

10. **DEPLOYMENT-COMPARISON.md**
    - **Purpose:** Choose between Cloud Run and Alternative Server
    - **Content:** Feature comparison, cost analysis, workflows
    - **Audience:** Users deciding deployment strategy

### Cross-Cutting Concerns

11. **VERSION-MANAGEMENT.md**
    - **Purpose:** How to update version numbers
    - **Content:** Version update workflow, locations
    - **Audience:** Everyone making releases

12. **Data_Privacy.md**
    - **Purpose:** Privacy policy and data handling
    - **Content:** Privacy commitments, E2EE explanation
    - **Audience:** Users and admins

### Historical Reference & Migration

13. **CHANGELOG-MARIADB-POD.md**
    - **Purpose:** Documents PostgreSQL → MariaDB migration
    - **Content:** What changed, migration guide
    - **Audience:** Users upgrading from old setup (historical)

14. **ENV-MIGRATION-GUIDE.md**
    - **Purpose:** Migrate from `.env.alternative` to dual environments
    - **Content:** Migration steps, command changes, verification
    - **Audience:** Users upgrading from single to dual environment setup

15. **DOCUMENTATION-CLEANUP-SUMMARY.md**
    - **Purpose:** Recent documentation cleanup details
    - **Content:** Files removed, updates made
    - **Audience:** Reference for recent changes

---

## 🎯 Reading Path by Use Case

### "I'm new to the project"
1. README.md (project overview)
2. DEPLOYMENT-COMPARISON.md (choose environment)
3. Deploy to your chosen environment

### "I want to deploy to Google Cloud Run"
1. DEPLOYMENT-QUICKSTART.md
2. VERSION-MANAGEMENT.md

### "I want to deploy to my own server"
1. README-ALTERNATIVE-SERVER.md (overview)
2. QUICK-START-ALTERNATIVE-SERVER.md (quick setup)
3. QUAY-REGISTRY-SETUP.md (registry setup)
4. ALTERNATIVE-SERVER-DUAL-ENVIRONMENT.md (complete guide)

### "I want to understand everything about alternative server"
1. README-ALTERNATIVE-SERVER.md
2. ALTERNATIVE-SERVER-DUAL-ENVIRONMENT.md (complete guide)
3. MARIADB-POD-CONFIGURATION.md (database details)
4. PODMAN-GUIDE.md (container engine reference)

### "I need to manage databases on alternative server"
1. MARIADB-POD-CONFIGURATION.md
2. ALTERNATIVE-SERVER-DUAL-ENVIRONMENT.md (migration sections)

### "Should I use Alternative Server or Cloud Run?"
1. DEPLOYMENT-COMPARISON.md

### "I'm upgrading from old PostgreSQL setup"
1. CHANGELOG-MARIADB-POD.md (historical)

### "I'm upgrading from .env.alternative to dual environments"
1. ENV-MIGRATION-GUIDE.md
2. QUICK-START-ALTERNATIVE-SERVER.md

---

## 📊 Documentation Categories

### By Environment
- **Google Cloud Run**: DEPLOYMENT-QUICKSTART.md
- **Alternative Server**: 6 focused guides (README, QUICK-START, DUAL-ENVIRONMENT, MARIADB-POD, QUAY-REGISTRY, QUAY-QUICKSTART)
- **Universal**: VERSION-MANAGEMENT.md, DEPLOYMENT-COMPARISON.md

### By Purpose
- **Getting Started**: README.md, README-ALTERNATIVE-SERVER.md, QUICK-START-ALTERNATIVE-SERVER.md
- **Complete Guides**: DEPLOYMENT-QUICKSTART.md, ALTERNATIVE-SERVER-DUAL-ENVIRONMENT.md
- **Technical Deep Dives**: MARIADB-POD-CONFIGURATION.md, PODMAN-GUIDE.md
- **Configuration**: QUAY-REGISTRY-SETUP.md, VERSION-MANAGEMENT.md
- **Decision Support**: DEPLOYMENT-COMPARISON.md

---

## ✅ Current Setup

The documentation reflects the **current production setup**:
- **Google Cloud Run**: Staging + Production environments
- **Alternative Server**: Staging + Production pods with MariaDB
- **Container Engine**: Podman (not Docker)
- **Database**: MariaDB 11.2 (not PostgreSQL)
- **Registry**: quay.myandi.de/gherold (for alternative server)

All obsolete documentation has been removed.

---

## 🎉 Recommendations

### New to the Project?
**Start here:** README.md → DEPLOYMENT-COMPARISON.md

### Deploying to Google Cloud Run?
**Go to:** DEPLOYMENT-QUICKSTART.md

### Deploying to Your Own Server?
**Start here:** README-ALTERNATIVE-SERVER.md → then choose:
- **Fast path:** QUICK-START-ALTERNATIVE-SERVER.md
- **Complete path:** ALTERNATIVE-SERVER-DUAL-ENVIRONMENT.md

### Managing an Existing Deployment?
- **Cloud Run:** VERSION-MANAGEMENT.md
- **Alternative Server:** MARIADB-POD-CONFIGURATION.md + ALTERNATIVE-SERVER-DUAL-ENVIRONMENT.md
