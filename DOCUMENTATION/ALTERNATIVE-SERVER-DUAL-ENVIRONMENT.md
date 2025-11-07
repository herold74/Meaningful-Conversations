# 🚀 Alternative Server: Complete Deployment Guide

Complete guide for deploying Meaningful Conversations to your alternative server (`46.224.37.130`) using **Podman with dual environments (Staging & Production)**, each with its own isolated database and pod.

---

## 🏗️ Architecture Overview

```
Server: 46.224.37.130
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  📦 Staging Pod (meaningful-conversations-staging)          │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Frontend → Port 8080                              │    │
│  │  Backend  → Port 8081                              │    │
│  │  MariaDB  → Port 3307 (meaningful_conversations_staging) │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  🚀 Production Pod (meaningful-conversations-production)    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Frontend → Port 80 (main)                         │    │
│  │  Backend  → Port 8082                              │    │
│  │  MariaDB  → Port 3308 (meaningful_conversations_production) │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Port Mapping

| Service | Staging | Production |
|---------|---------|------------|
| **Frontend** | `:8080` | `:80` (main) |
| **Backend** | `:8081` | `:8082` |
| **MariaDB** | `:3307` | `:3308` |

### Access URLs

**Staging:**
- Frontend: https://mc-beta.manualmode.at
- Backend API: https://mc-beta.manualmode.at/api
- Health Check: https://mc-beta.manualmode.at/api/health

**Production:**
- Frontend: https://mc-app.manualmode.at
- Backend API: https://mc-app.manualmode.at/api
- Health Check: https://mc-app.manualmode.at/api/health

**Note:** The hosting provider's external firewall only allows ports 80 and 443. All access is through nginx reverse proxy on the host, which routes to the appropriate containers. Internal ports (8080, 8081, 8082, 3307, 3308) are not directly accessible from the internet.

---

## 📁 File Structure

### Configuration Files

```
Project Root:
├── podman-compose-staging.yml        # Staging pod configuration
├── podman-compose-production.yml     # Production pod configuration
├── env.staging.template              # Staging environment template
├── env.production.template           # Production environment template
├── .env.staging                      # Your staging config (create from template)
├── .env.production                   # Your production config (create from template)
└── deploy-alternative.sh             # Deployment script (supports both)
```

### On Server

```
/opt/
├── meaningful-conversations-staging/
│   ├── podman-compose-staging.yml
│   └── .env                          # Staging environment variables
└── meaningful-conversations-production/
    ├── podman-compose-production.yml
    └── .env                          # Production environment variables
```

---

## 🚀 Quick Start

### 1. Create Environment Files

```bash
# Create staging environment
cp env.staging.template .env.staging
nano .env.staging  # Fill in your values

# Create production environment
cp env.production.template .env.production
nano .env.production  # Fill in DIFFERENT values
```

**Important:** Use **different passwords** for staging and production!

### 2. Deploy to Staging

```bash
# Deploy everything to staging
make deploy-alternative-staging

# Or use the script directly
./deploy-alternative.sh -e staging
```

### 3. Test in Staging

Visit https://mc-beta.manualmode.at and verify everything works.

### 4. Deploy to Production

```bash
# Deploy everything to production
make deploy-alternative-production

# Or use the script
./deploy-alternative.sh -e production
```

### 5. Access Production

Visit https://mc-app.manualmode.at (main production site)

---

## 🎯 Deployment Commands

### Full Deployment

```bash
# Deploy staging (all components)
make deploy-alternative-staging
./deploy-alternative.sh -e staging

# Deploy production (all components)
make deploy-alternative-production
./deploy-alternative.sh -e production
```

### Component Deployment

```bash
# Deploy only frontend to staging
make deploy-alternative-staging-frontend
./deploy-alternative.sh -e staging -c frontend

# Deploy only frontend to production
make deploy-alternative-production-frontend
./deploy-alternative.sh -e production -c frontend

# Deploy only backend to staging
make deploy-alternative-staging-backend
./deploy-alternative.sh -e staging -c backend

# Deploy only backend to production
make deploy-alternative-production-backend
./deploy-alternative.sh -e production -c backend
```

---

## 📊 Monitoring Commands

### View Logs

```bash
# Staging logs
make logs-alternative-staging

# Production logs
make logs-alternative-production
```

### Check Status

```bash
# Staging status
make status-alternative-staging

# Production status
make status-alternative-production

# All pods status
make pod-status-alternative
```

### Restart Services

```bash
# Restart staging
make restart-alternative-staging

# Restart production
make restart-alternative-production
```

### Stop Services

```bash
# Stop staging
make stop-alternative-staging

# Stop production
make stop-alternative-production
```

---

## 🗄️ Database Operations

### Access Database Shell

```bash
# Staging database
make db-shell-alternative-staging

# Production database
make db-shell-alternative-production
```

### Backup Databases

```bash
# Backup staging
make db-backup-alternative-staging
# Creates: backup-alternative-staging-YYYYMMDD-HHMMSS.sql

# Backup production
make db-backup-alternative-production
# Creates: backup-alternative-production-YYYYMMDD-HHMMSS.sql
```

### Database Names

- **Staging:** `meaningful_conversations_staging`
- **Production:** `meaningful_conversations_production`

Each database is completely isolated!

---

## 🔐 Security Configuration

### Separate Credentials

**Critical:** Use **different passwords** for staging and production!

**.env.staging:**
```bash
DB_PASSWORD=staging_password_12345
DB_ROOT_PASSWORD=staging_root_67890
JWT_SECRET=staging_jwt_secret_here
INITIAL_ADMIN_PASSWORD=staging_admin_pwd
```

**.env.production:**
```bash
DB_PASSWORD=production_password_ABCDE
DB_ROOT_PASSWORD=production_root_FGHIJ
JWT_SECRET=production_jwt_secret_different
INITIAL_ADMIN_PASSWORD=production_admin_pwd
```

### Firewall Configuration

```bash
ssh root@46.224.37.130

# Only ports 80 and 443 need to be open (nginx handles everything)
firewall-cmd --permanent --add-service=http      # Port 80
firewall-cmd --permanent --add-service=https     # Port 443
firewall-cmd --permanent --add-service=ssh       # SSH access

# Remove any old port configurations (these are not needed)
# firewall-cmd --permanent --remove-port=8080/tcp
# firewall-cmd --permanent --remove-port=8081/tcp
# firewall-cmd --permanent --remove-port=8082/tcp

# Database ports should NOT be exposed to the internet
# Keep them accessible only from localhost/containers

firewall-cmd --reload
firewall-cmd --list-all
```

**Important:** The hosting provider's external firewall only allows standard HTTP/HTTPS ports (80/443). All internal pod ports are routed through nginx reverse proxy.

---

## 🔄 Typical Workflow

### 1. Develop & Test Locally

```bash
npm run dev
# Test on localhost:5173
```

### 2. Deploy to Staging

```bash
make deploy-alternative-staging
```

### 3. Test on Staging

- Visit https://mc-beta.manualmode.at
- Test new features
- Verify everything works
- Check logs: `make logs-alternative-staging`

### 4. Deploy to Production

Once staging looks good:

```bash
make deploy-alternative-production
```

### 5. Verify Production

- Visit https://mc-app.manualmode.at
- Smoke test critical features
- Monitor logs: `make logs-alternative-production`

---

## 🎯 Common Scenarios

### Quick Frontend Update (Staging)

```bash
# Make changes
vim components/MyComponent.tsx

# Deploy to staging for testing
make deploy-alternative-staging-frontend

# Test at https://mc-beta.manualmode.at
```

### Promote to Production

```bash
# Same version that's in staging
make deploy-alternative-production

# Or specific version
./deploy-alternative.sh -e production -v 1.4.8 --skip-build
```

### Rollback Production

```bash
# Deploy previous version
./deploy-alternative.sh -e production -v 1.4.7 --skip-build
```

### Database Migration Testing

```bash
# 1. Deploy new code to staging
make deploy-alternative-staging

# 2. SSH and run migration on staging
ssh root@46.224.37.130
cd /opt/meaningful-conversations-staging
podman-compose -f podman-compose-staging.yml exec backend npx prisma migrate deploy

# 3. Test thoroughly
# 4. Deploy to production
make deploy-alternative-production

# 5. Run migration on production
cd /opt/meaningful-conversations-production
podman-compose -f podman-compose-production.yml exec backend npx prisma migrate deploy
```

---

## 🆘 Troubleshooting

### Port Conflicts

If you see "port already in use":

```bash
ssh root@46.224.37.130

# Check what's using the ports
netstat -tulpn | grep -E "8080|8081|8082"

# Stop the conflicting service
podman ps  # Find the container
podman stop <container-name>
```

### Wrong Environment

If you deployed to the wrong environment:

```bash
# Stop the wrong one
make stop-alternative-staging  # or production

# Deploy to correct environment
make deploy-alternative-production
```

### Database Issues

```bash
# Check if MariaDB is running
make status-alternative-staging

# Check database logs
ssh root@46.224.37.130
cd /opt/meaningful-conversations-staging
podman-compose -f podman-compose-staging.yml logs mariadb

# Restart database
podman-compose -f podman-compose-staging.yml restart mariadb
```

### Can't Access Staging/Production

```bash
# Test from outside
curl -I https://mc-beta.manualmode.at
curl -I https://mc-app.manualmode.at

# Test locally on server (via nginx)
ssh root@46.224.37.130

# Test nginx is routing correctly
curl -I http://localhost:80
curl http://localhost/api/health

# Test containers directly (bypassing nginx)
podman exec meaningful-conversations-frontend-staging wget -O- http://localhost:3000
podman exec meaningful-conversations-backend-staging wget -O- http://localhost:8080/health

# Check nginx status
systemctl status nginx
nginx -t

# Check firewall (should allow 80 and 443)
firewall-cmd --list-services
```

---

## 📈 Resource Usage

### Checking Resources

```bash
ssh root@46.224.37.130

# View all pods
podman pod ps

# View all containers
podman ps --pod

# Resource usage
podman stats
```

### Expected Resources

Each environment uses approximately:
- **Memory:** 500-800 MB (3 containers)
- **CPU:** 1-2 cores during operation
- **Disk:** 2-5 GB (including database)

**Total for both:** ~1.5-2 GB RAM, 4-10 GB disk

---

## 🔄 Data Management

### Copy Staging Database to Production

**⚠️ Dangerous! This overwrites production data!**

```bash
# 1. Backup production first!
make db-backup-alternative-production

# 2. Export staging database
ssh root@46.224.37.130
cd /opt/meaningful-conversations-staging
podman-compose -f podman-compose-staging.yml exec -T mariadb \
  mysqldump -u root -p meaningful_conversations_staging > /tmp/staging-export.sql

# 3. Import to production
cd /opt/meaningful-conversations-production
podman-compose -f podman-compose-production.yml exec -T mariadb \
  mysql -u root -p meaningful_conversations_production < /tmp/staging-export.sql

# 4. Cleanup
rm /tmp/staging-export.sql
```

### Sync Users from Production to Staging

```bash
# Export only users table from production
ssh root@46.224.37.130
cd /opt/meaningful-conversations-production
podman-compose -f podman-compose-production.yml exec -T mariadb \
  mysqldump -u root -p meaningful_conversations_production users > /tmp/prod-users.sql

# Import to staging
cd /opt/meaningful-conversations-staging
podman-compose -f podman-compose-staging.yml exec -T mariadb \
  mysql -u root -p meaningful_conversations_staging < /tmp/prod-users.sql
```

---

## 📚 Configuration Reference

### Environment Variables

Both `.env.staging` and `.env.production` need:

```bash
# Version
VERSION=latest

# Registry
REGISTRY_URL=quay.myandi.de
REGISTRY_USER=gherold
REGISTRY_PASSWORD=your_password

# Database (use different passwords!)
DB_USER=mcuser
DB_PASSWORD=different_for_each_env
DB_ROOT_PASSWORD=different_root_for_each_env
DB_NAME=meaningful_conversations_[staging|production]

# URLs (used by backend for email links, etc.)
ENVIRONMENT_TYPE=[staging|production]
FRONTEND_URL=https://mc-beta.manualmode.at  # For staging
FRONTEND_URL=https://mc-app.manualmode.at   # For production

# API Keys (can be same or different)
API_KEY=your_gemini_key
JWT_SECRET=different_for_each_env
MAILJET_API_KEY=your_mailjet_key
MAILJET_SECRET_KEY=your_mailjet_secret

# Admin
INITIAL_ADMIN_EMAIL=admin@manualmode.at
INITIAL_ADMIN_PASSWORD=different_for_each_env
```

---

## 🎉 Summary

You now have a complete dual-environment setup:

- ✅ **Staging** on ports 8080/8081 for testing
- ✅ **Production** on ports 80/8082 for live use
- ✅ Separate MariaDB databases for each
- ✅ Isolated pods for complete separation
- ✅ Easy deployment with make commands
- ✅ Pull from Quay registry for both
- ✅ Version control for easy rollbacks

**Test in staging, deploy to production with confidence!** 🚀

---

## 📖 Related Documentation

- [Quick Start Guide](QUICK-START-ALTERNATIVE-SERVER.md)
- [Quay Registry Setup](QUAY-REGISTRY-SETUP.md)
- [MariaDB & Pod Configuration](MARIADB-POD-CONFIGURATION.md)
- [Deployment Comparison](DEPLOYMENT-COMPARISON.md)

