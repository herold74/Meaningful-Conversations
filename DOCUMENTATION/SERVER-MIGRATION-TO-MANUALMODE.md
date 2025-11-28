# Migration Guide: Alternative Server → Manualmode Server

## 📋 Overview

This guide covers the migration from the old alternative server (`46.224.37.130`) to the new manualmode server (`91.99.193.87`).

**Migration Date:** November 2024  
**Old Server:** `root@46.224.37.130` (alternative)  
**New Server:** `root@91.99.193.87` (manualmode)

---

## 🎯 Migration Strategy

### Server Structure (Unchanged)

Both servers maintain the same dual-environment setup:

```
┌─────────────────────────────────────────────┐
│  Server: 91.99.193.87 (manualmode)          │
├─────────────────────────────────────────────┤
│                                             │
│  📁 /opt/manualmode-staging/                │
│     ├── podman-compose-staging.yml          │
│     ├── .env (staging environment)          │
│     └── Podman Pod: staging                 │
│         ├── Frontend (port 3000)            │
│         ├── Backend (port 8080)             │
│         └── MariaDB (port 3306)             │
│                                             │
│  📁 /opt/manualmode-production/             │
│     ├── podman-compose-production.yml       │
│     ├── .env (production environment)       │
│     └── Podman Pod: production              │
│         ├── Frontend (port 3000)            │
│         ├── Backend (port 8080)             │
│         └── MariaDB (port 3306)             │
│                                             │
└─────────────────────────────────────────────┘
```

### Key Changes

| Aspect | Old (Alternative) | New (Manualmode) |
|--------|------------------|------------------|
| **Server IP** | `46.224.37.130` | `91.99.193.87` |
| **SSH Access** | `root@46.224.37.130` | `root@91.99.193.87` |
| **Base Directory** | `/opt/meaningful-conversations-*` | `/opt/manualmode-*` |
| **Deployment Script** | `deploy-alternative.sh` | `deploy-manualmode.sh` |
| **Setup Script** | `setup-alternative-env.sh` | `setup-manualmode-env.sh` |
| **Make Targets** | `deploy-alternative-*` | `deploy-manualmode-*` |

---

## 🚀 Migration Steps

### Phase 1: Backup Old Server Data

#### 1.1 Backup Staging Database

```bash
# From your local machine
make db-backup-alternative-staging

# Or manually:
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-staging && \
  podman-compose -f podman-compose-staging.yml exec -T mariadb \
  mariadb-dump -u root -p${DB_ROOT_PASSWORD} meaningful_conversations_staging' \
  > backup-staging-$(date +%Y%m%d-%H%M%S).sql
```

#### 1.2 Backup Production Database

```bash
# From your local machine
make db-backup-alternative-production

# Or manually:
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-production && \
  podman-compose -f podman-compose-production.yml exec -T mariadb \
  mariadb-dump -u root -p${DB_ROOT_PASSWORD} meaningful_conversations_production' \
  > backup-production-$(date +%Y%m%d-%H%M%S).sql
```

#### 1.3 Backup Environment Files

```bash
# Staging environment
scp root@46.224.37.130:/opt/meaningful-conversations-staging/.env \
  .env.staging.backup

# Production environment
scp root@46.224.37.130:/opt/meaningful-conversations-production/.env \
  .env.production.backup
```

---

### Phase 2: Prepare New Server

#### 2.1 Initial Server Setup

```bash
# SSH into the new server
ssh root@91.99.193.87

# Update system
dnf update -y

# Install required packages
dnf install -y podman nginx certbot python3-certbot-nginx

# Install podman-compose (Python package)
dnf install -y python3-pip
pip3 install podman-compose

# Verify installations
podman --version
podman-compose --version
nginx -v

# Enable and start services
systemctl enable --now podman
systemctl enable --now nginx

# Configure firewall
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-port=8080/tcp  # Staging frontend
firewall-cmd --permanent --add-port=8081/tcp  # Staging backend
firewall-cmd --reload
```

#### 2.2 Install Nginx Update Script

```bash
# From your local machine
scp update-nginx-ips.sh root@91.99.193.87:/usr/local/bin/
ssh root@91.99.193.87 'chmod +x /usr/local/bin/update-nginx-ips.sh'
```

#### 2.3 Configure Nginx (if using custom domains)

```bash
# SSH into the new server
ssh root@91.99.193.87

# Create nginx configuration for staging
cat > /etc/nginx/conf.d/staging-meaningful-conversations.conf << 'EOF'
# Staging Environment
server {
    listen 8080;
    server_name 91.99.193.87;  # Update with your domain if applicable
    
    location / {
        proxy_pass http://FRONTEND_IP:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ {
        proxy_pass http://BACKEND_IP:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Test nginx configuration
nginx -t
systemctl reload nginx
```

---

### Phase 3: Configure Local Environment

#### 3.1 Update Local Git Repository

```bash
# Pull latest changes with migration scripts
cd /Users/gherold/Meaningful-Conversations-Project
git pull origin main

# Make scripts executable
chmod +x deploy-manualmode.sh setup-manualmode-env.sh
```

#### 3.2 Create Environment Configuration Files

```bash
# Run the interactive setup script
./setup-manualmode-env.sh

# Or manually create from templates
cp env.staging.template .env.staging
cp env.production.template .env.production

# Edit the files and update:
# - Database credentials
# - API keys
# - JWT secrets
# - Admin credentials
# - FRONTEND_URL (update to new server IP)
```

**Important:** Update `FRONTEND_URL` in both files:
- Staging: `http://91.99.193.87:8080`
- Production: `http://91.99.193.87`

---

### Phase 4: Deploy to New Server

#### 4.1 Deploy Staging Environment

```bash
# First deployment (builds, pushes, and deploys)
make deploy-manualmode-staging

# Or using the script directly:
./deploy-manualmode.sh -e staging

# Monitor deployment
make logs-manualmode-staging

# Check status
make status-manualmode-staging
```

#### 4.2 Restore Staging Database

```bash
# Option 1: From local backup
cat backup-staging-YYYYMMDD-HHMMSS.sql | \
  ssh root@91.99.193.87 'cd /opt/manualmode-staging && \
  podman-compose -f podman-compose-staging.yml exec -T mariadb \
  mysql -u root -p${DB_ROOT_PASSWORD} meaningful_conversations_staging'

# Option 2: Direct transfer
scp backup-staging-YYYYMMDD-HHMMSS.sql root@91.99.193.87:/tmp/
ssh root@91.99.193.87 'cd /opt/manualmode-staging && \
  cat /tmp/backup-staging-YYYYMMDD-HHMMSS.sql | \
  podman-compose -f podman-compose-staging.yml exec -T mariadb \
  mysql -u root -p${DB_ROOT_PASSWORD} meaningful_conversations_staging'
```

#### 4.3 Test Staging Environment

```bash
# Test frontend
curl http://91.99.193.87:8080

# Test backend API
curl http://91.99.193.87:8081/api/health

# Test in browser
open http://91.99.193.87:8080
```

#### 4.4 Deploy Production Environment

**⚠️ Only after staging is verified!**

```bash
# Deploy production
make deploy-manualmode-production

# Monitor deployment
make logs-manualmode-production

# Check status
make status-manualmode-production
```

#### 4.5 Restore Production Database

```bash
# Transfer and restore production backup
cat backup-production-YYYYMMDD-HHMMSS.sql | \
  ssh root@91.99.193.87 'cd /opt/manualmode-production && \
  podman-compose -f podman-compose-production.yml exec -T mariadb \
  mysql -u root -p${DB_ROOT_PASSWORD} meaningful_conversations_production'
```

#### 4.6 Test Production Environment

```bash
# Test frontend
curl http://91.99.193.87

# Test backend API
curl http://91.99.193.87:8082/api/health

# Test in browser
open http://91.99.193.87
```

---

### Phase 5: DNS and Domain Configuration (if applicable)

If you're using custom domains:

#### 5.1 Update DNS Records

Update your DNS A records to point to the new server:

```
# Old:
mc-beta.manualmode.at.   A   46.224.37.130
mc-app.manualmode.at.    A   46.224.37.130

# New:
mc-beta.manualmode.at.   A   91.99.193.87
mc-app.manualmode.at.    A   91.99.193.87
```

#### 5.2 Update SSL Certificates

```bash
# SSH into new server
ssh root@91.99.193.87

# Obtain SSL certificates (after DNS propagation)
certbot --nginx -d mc-beta.manualmode.at
certbot --nginx -d mc-app.manualmode.at

# Auto-renewal
systemctl enable --now certbot-renew.timer
```

#### 5.3 Update Environment URLs

After DNS is configured, update `.env` files on the server:

```bash
# Staging
ssh root@91.99.193.87 'cd /opt/manualmode-staging && \
  sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://mc-beta.manualmode.at|" .env'

# Production
ssh root@91.99.193.87 'cd /opt/manualmode-production && \
  sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://mc-app.manualmode.at|" .env'

# Restart services to apply changes
make restart-manualmode-staging
make restart-manualmode-production
```

---

### Phase 6: Verification and Testing

#### 6.1 Health Checks

```bash
# Staging
curl http://91.99.193.87:8080
curl http://91.99.193.87:8081/api/health

# Production
curl http://91.99.193.87
curl http://91.99.193.87:8082/api/health
```

#### 6.2 Functional Testing

- [ ] User registration and login
- [ ] Life Context creation and editing
- [ ] Chat with all bot personas
- [ ] Session analysis
- [ ] Voice mode
- [ ] Admin dashboard
- [ ] API usage tracking
- [ ] Achievements and gamification

#### 6.3 Database Verification

```bash
# Check staging database
make db-shell-manualmode-staging
# In MariaDB shell:
SHOW TABLES;
SELECT COUNT(*) FROM User;
SELECT COUNT(*) FROM Session;
exit

# Check production database
make db-shell-manualmode-production
# In MariaDB shell:
SHOW TABLES;
SELECT COUNT(*) FROM User;
SELECT COUNT(*) FROM Session;
exit
```

---

### Phase 7: Cutover and Cleanup

#### 7.1 Update Documentation

Update any hardcoded references to the old server IP in your documentation.

#### 7.2 Notify Users (if applicable)

If you have active users, notify them of:
- New server IP (if they're accessing directly)
- Any downtime during migration
- New domains (if applicable)

#### 7.3 Monitor New Server

```bash
# Pod status
make pod-status-manualmode

# Logs
make logs-manualmode-staging
make logs-manualmode-production

# Resource usage
ssh root@91.99.193.87 'podman stats'
```

#### 7.4 Decommission Old Server (After Verification)

**⚠️ Only after 1-2 weeks of successful operation on new server!**

```bash
# Stop services on old server
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-staging && \
  podman-compose -f podman-compose-staging.yml down'
  
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-production && \
  podman-compose -f podman-compose-production.yml down'

# Archive old server data
ssh root@46.224.37.130 'tar -czf /root/old-server-backup-$(date +%Y%m%d).tar.gz \
  /opt/meaningful-conversations-staging /opt/meaningful-conversations-production'

# Download final backup
scp root@46.224.37.130:/root/old-server-backup-*.tar.gz ./backups/
```

---

## 📊 Quick Reference

### New Commands (Manualmode)

```bash
# Deployment
make deploy-manualmode-staging
make deploy-manualmode-production
make deploy-manualmode-staging-frontend
make deploy-manualmode-production-backend

# Monitoring
make logs-manualmode-staging
make status-manualmode-production
make pod-status-manualmode

# Database
make db-shell-manualmode-staging
make db-backup-manualmode-staging
make db-backup-manualmode-production

# Service Control
make restart-manualmode-staging
make stop-manualmode-production
```

### Legacy Commands (Alternative - Old Server)

All `deploy-alternative-*` commands still work for the old server but are marked as `[LEGACY]`.

---

## 🔧 Troubleshooting

### Issue: Cannot connect to new server

```bash
# Test SSH
ssh -v root@91.99.193.87

# Check firewall
ssh root@91.99.193.87 'firewall-cmd --list-all'

# Verify SSH keys
ssh-copy-id root@91.99.193.87
```

### Issue: Container IPs not updating in Nginx

```bash
# SSH into new server
ssh root@91.99.193.87

# Run nginx update script manually
/usr/local/bin/update-nginx-ips.sh all

# Check container IPs
podman inspect meaningful-conversations-backend-staging | grep IPAddress
```

### Issue: Database restore fails

```bash
# Check database exists
ssh root@91.99.193.87 'cd /opt/manualmode-staging && \
  podman-compose -f podman-compose-staging.yml exec mariadb \
  mysql -u root -p${DB_ROOT_PASSWORD} -e "SHOW DATABASES;"'

# Create database if missing
ssh root@91.99.193.87 'cd /opt/manualmode-staging && \
  podman-compose -f podman-compose-staging.yml exec mariadb \
  mysql -u root -p${DB_ROOT_PASSWORD} -e "CREATE DATABASE IF NOT EXISTS meaningful_conversations_staging;"'
```

### Issue: Services not starting

```bash
# Check pod status
ssh root@91.99.193.87 'podman pod ps'

# Check logs
make logs-manualmode-staging

# Restart services
make restart-manualmode-staging
```

---

## ✅ Migration Checklist

- [ ] Backup old server databases (staging & production)
- [ ] Backup old server environment files
- [ ] Setup new server (Podman, Nginx, firewall)
- [ ] Install nginx update script on new server
- [ ] Configure local environment files (.env.staging, .env.production)
- [ ] Deploy to staging on new server
- [ ] Restore staging database
- [ ] Test staging environment thoroughly
- [ ] Deploy to production on new server
- [ ] Restore production database
- [ ] Test production environment thoroughly
- [ ] Update DNS records (if applicable)
- [ ] Configure SSL certificates (if applicable)
- [ ] Update frontend URLs in environment files
- [ ] Run comprehensive functional tests
- [ ] Monitor new server for 1-2 weeks
- [ ] Update all documentation
- [ ] Decommission old server

---

## 📚 Related Documentation

- [Manualmode Server Quick Start](QUICK-START-MANUALMODE-SERVER.md)
- [Dual Environment Deployment](MANUALMODE-DUAL-ENVIRONMENT.md)
- [Nginx Reverse Proxy Setup](NGINX-REVERSE-PROXY-SETUP.md)
- [Podman Guide](PODMAN-GUIDE.md)
- [Deployment Comparison](DEPLOYMENT-COMPARISON.md)

---

## 🆘 Support

If you encounter issues during migration:

1. Check the troubleshooting section above
2. Review related documentation
3. Check logs: `make logs-manualmode-staging` or `make logs-manualmode-production`
4. Verify pod status: `make pod-status-manualmode`
5. Rollback to old server if critical issues arise

---

**Migration prepared by:** Development Team  
**Last updated:** November 2024  
**Server:** manualmode-8gb-nbg1-2 (91.99.193.87)

