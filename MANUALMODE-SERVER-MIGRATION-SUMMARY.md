# Manualmode Server Migration Summary

## 🎯 Migration Overview

**Date:** November 2024  
**Status:** ✅ Complete - Ready for deployment  
**Old Server:** `46.224.37.130` (alternative)  
**New Server:** `91.99.193.87` (manualmode)  

---

## ✅ Changes Completed

### 1. **Deployment Scripts**

#### Created:
- ✅ `deploy-manualmode.sh` - Main deployment script for new server
- ✅ `setup-manualmode-env.sh` - Environment setup script

#### Updated:
- ✅ `deploy-alternative.sh` - Kept for legacy support (old server)
- ✅ `setup-alternative-env.sh` - Kept for legacy support (old server)

**Key Changes:**
- Server IP: `46.224.37.130` → `91.99.193.87`
- Base directory: `/opt/meaningful-conversations` → `/opt/manualmode`
- All references to "alternative" → "manualmode" in new scripts

---

### 2. **Makefile Targets**

#### New Targets (Manualmode Server - 91.99.193.87):
```makefile
# Deployment
make deploy-manualmode-staging
make deploy-manualmode-production
make deploy-manualmode-staging-frontend
make deploy-manualmode-production-frontend
make deploy-manualmode-staging-backend
make deploy-manualmode-production-backend
make deploy-manualmode-dry-run
make deploy-manualmode

# Monitoring
make logs-manualmode-staging
make logs-manualmode-production
make status-manualmode-staging
make status-manualmode-production

# Service Control
make restart-manualmode-staging
make restart-manualmode-production
make stop-manualmode-staging
make stop-manualmode-production
make pod-status-manualmode

# Database
make db-shell-manualmode-staging
make db-shell-manualmode-production
make db-backup-manualmode-staging
make db-backup-manualmode-production
```

#### Legacy Targets (Alternative Server - 46.224.37.130):
All `deploy-alternative-*` commands remain available but are marked as `[LEGACY]` for backward compatibility.

---

### 3. **Frontend API Configuration**

**File:** `services/api.ts`

**Updated backend mapping:**
```typescript
// Manualmode Server Deployment (Podman-based with nginx reverse proxy)
'mc-beta.manualmode.at': '',   // Staging: nginx proxies /api to backend pod
'mc-app.manualmode.at': '',    // Production: nginx proxies /api to backend pod
'91.99.193.87': '',            // Manualmode server: IP fallback
'46.224.37.130': '',           // Alternative server (legacy): IP fallback
```

**Support Added:**
- ✅ New manualmode server IP (`91.99.193.87`)
- ✅ Backward compatibility with alternative server (`46.224.37.130`)
- ✅ Both staging and production URL patterns

---

### 4. **Documentation**

#### New Documentation:
- ✅ `DOCUMENTATION/SERVER-MIGRATION-TO-MANUALMODE.md` - Comprehensive migration guide
- ✅ `DOCUMENTATION/QUICK-START-MANUALMODE-SERVER.md` - Quick start guide for new server
- ✅ `DOCUMENTATION/MANUALMODE-DUAL-ENVIRONMENT.md` - Dual environment setup
- ✅ `DOCUMENTATION/README-MANUALMODE-SERVER.md` - Complete manualmode server README
- ✅ `MANUALMODE-SERVER-MIGRATION-SUMMARY.md` - This file

#### Preserved (Legacy):
- ✅ All `ALTERNATIVE-*` documentation files kept for reference

**All new documentation includes:**
- New server IP (`91.99.193.87`)
- New directory structure (`/opt/manualmode-*`)
- Updated deployment commands
- Migration instructions

---

## 📊 Server Comparison

| Aspect | Alternative (Old) | Manualmode (New) |
|--------|------------------|------------------|
| **IP Address** | `46.224.37.130` | `91.99.193.87` |
| **Hostname** | (not specified) | `manualmode-8gb-nbg1-2` |
| **SSH Access** | `root@46.224.37.130` | `root@91.99.193.87` |
| **Base Dir** | `/opt/meaningful-conversations-*` | `/opt/manualmode-*` |
| **Staging Dir** | `/opt/meaningful-conversations-staging` | `/opt/manualmode-staging` |
| **Production Dir** | `/opt/meaningful-conversations-production` | `/opt/manualmode-production` |
| **Scripts** | `deploy-alternative.sh` | `deploy-manualmode.sh` |
| **Make Targets** | `deploy-alternative-*` | `deploy-manualmode-*` |
| **Status** | Active (Legacy) | **Primary (Current)** |

---

## 🚀 Quick Start: Deploy to Manualmode Server

### Prerequisites

1. **SSH Access:**
   ```bash
   ssh root@91.99.193.87  # Test connection
   ```

2. **Environment Files:**
   ```bash
   ./setup-manualmode-env.sh  # Interactive setup
   # Or manually create .env.staging and .env.production
   ```

### Deploy Staging

```bash
# Full deployment (build, push, deploy)
make deploy-manualmode-staging

# Or just frontend (faster)
make deploy-manualmode-staging-frontend

# Monitor
make logs-manualmode-staging
make status-manualmode-staging
```

### Deploy Production

```bash
# Full deployment
make deploy-manualmode-production

# Monitor
make logs-manualmode-production
make status-manualmode-production
```

### Access Applications

**Staging:**
- Frontend: `http://91.99.193.87:8080`
- Backend API: `http://91.99.193.87:8081/api/health`

**Production:**
- Frontend: `http://91.99.193.87`
- Backend API: `http://91.99.193.87:8082/api/health`

---

## 📁 Directory Structure

### On Manualmode Server (91.99.193.87)

```
/opt/
├── manualmode-staging/
│   ├── podman-compose-staging.yml
│   ├── .env
│   └── Podman Pod: meaningful-conversations-staging
│       ├── frontend (port 3000, exposed as 8080)
│       ├── backend (port 8080, exposed as 8081)
│       └── mariadb (port 3306, exposed as 3307)
│
└── manualmode-production/
    ├── podman-compose-production.yml
    ├── .env
    └── Podman Pod: meaningful-conversations-production
        ├── frontend (port 3000, exposed as 80)
        ├── backend (port 8080, exposed as 8082)
        └── mariadb (port 3306, exposed as 3308)
```

### On Local Machine

```
Meaningful-Conversations-Project/
├── deploy-manualmode.sh         # NEW: Deployment script
├── setup-manualmode-env.sh      # NEW: Environment setup
├── deploy-alternative.sh         # LEGACY: Old server script
├── setup-alternative-env.sh      # LEGACY: Old server setup
├── Makefile                      # UPDATED: New + legacy targets
├── services/
│   └── api.ts                    # UPDATED: Added new server IP
├── DOCUMENTATION/
│   ├── SERVER-MIGRATION-TO-MANUALMODE.md      # NEW
│   ├── QUICK-START-MANUALMODE-SERVER.md       # NEW
│   ├── MANUALMODE-DUAL-ENVIRONMENT.md         # NEW
│   ├── README-MANUALMODE-SERVER.md            # NEW
│   ├── ALTERNATIVE-SERVER-DUAL-ENVIRONMENT.md # LEGACY
│   ├── QUICK-START-ALTERNATIVE-SERVER.md      # LEGACY
│   └── README-ALTERNATIVE-SERVER.md           # LEGACY
└── .env.staging                  # To be created
    .env.production               # To be created
```

---

## 🔄 Migration Path

### For New Deployments → Use Manualmode

```bash
./setup-manualmode-env.sh           # Create environment files
make deploy-manualmode-staging       # Deploy staging
make deploy-manualmode-production    # Deploy production
```

### For Existing Deployments → Migrate from Alternative

See `DOCUMENTATION/SERVER-MIGRATION-TO-MANUALMODE.md` for complete migration instructions including:
- Database backup and restore
- Environment file migration
- DNS updates (if applicable)
- Verification steps
- Rollback procedures

---

## 🛠️ What's Changed in Your Workflow

### Old Workflow (Alternative):
```bash
./setup-alternative-env.sh
make deploy-alternative-staging
make logs-alternative-staging
ssh root@46.224.37.130
```

### New Workflow (Manualmode):
```bash
./setup-manualmode-env.sh
make deploy-manualmode-staging
make logs-manualmode-staging
ssh root@91.99.193.87
```

**Note:** Old commands still work for the alternative server (46.224.37.130) but are now marked as `[LEGACY]`.

---

## ⚠️ Important Notes

### Backward Compatibility

1. **Alternative Server Still Works:**
   - All `deploy-alternative-*` commands remain functional
   - Useful during migration period
   - Old server can remain online during testing

2. **Dual Server Support:**
   - Frontend supports both server IPs
   - No code changes required for migration
   - Seamless transition possible

3. **Environment Files:**
   - `.env.staging` and `.env.production` work for both servers
   - Only difference is the server IP where they're deployed

### Migration Safety

- ✅ No breaking changes to existing deployments
- ✅ Old server commands remain available
- ✅ Frontend supports both servers simultaneously
- ✅ Database migrations independent per server
- ✅ Can test new server before cutover

---

## 📚 Key Documentation

| Document | Purpose |
|----------|---------|
| `DOCUMENTATION/SERVER-MIGRATION-TO-MANUALMODE.md` | Complete step-by-step migration guide |
| `DOCUMENTATION/QUICK-START-MANUALMODE-SERVER.md` | Quick deployment guide for new server |
| `DOCUMENTATION/MANUALMODE-DUAL-ENVIRONMENT.md` | Dual environment setup details |
| `DOCUMENTATION/README-MANUALMODE-SERVER.md` | Comprehensive manualmode server documentation |
| `MANUALMODE-SERVER-MIGRATION-SUMMARY.md` | This summary document |

---

## ✅ Migration Checklist

- [x] SSH access to new server verified
- [x] Deployment scripts created (`deploy-manualmode.sh`)
- [x] Setup scripts created (`setup-manualmode-env.sh`)
- [x] Makefile updated with new targets
- [x] Frontend API configuration updated
- [x] Documentation created
- [ ] Environment files created (`.env.staging`, `.env.production`)
- [ ] Server prepared (Podman, Nginx, firewall)
- [ ] Staging deployed and tested
- [ ] Production deployed and tested
- [ ] Database migrated
- [ ] DNS updated (if applicable)
- [ ] Old server decommissioned (after verification period)

---

## 🎉 Next Steps

1. **Create Environment Files:**
   ```bash
   ./setup-manualmode-env.sh
   ```

2. **Prepare the Server:**
   ```bash
   ssh root@91.99.193.87
   # Follow steps in DOCUMENTATION/SERVER-MIGRATION-TO-MANUALMODE.md
   ```

3. **Deploy Staging:**
   ```bash
   make deploy-manualmode-staging
   ```

4. **Test Thoroughly**

5. **Deploy Production:**
   ```bash
   make deploy-manualmode-production
   ```

6. **Monitor and Verify**

7. **Update DNS** (if using custom domains)

8. **Decommission Old Server** (after 1-2 weeks)

---

## 🆘 Support

For migration assistance:
- Review: `DOCUMENTATION/SERVER-MIGRATION-TO-MANUALMODE.md`
- Check logs: `make logs-manualmode-staging`
- Check status: `make pod-status-manualmode`
- Test SSH: `ssh root@91.99.193.87`

---

**Migration prepared:** November 2024  
**Server hostname:** `manualmode-8gb-nbg1-2`  
**Server IP:** `91.99.193.87`  
**Status:** ✅ Ready for deployment

