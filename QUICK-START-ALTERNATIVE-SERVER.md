# 🚀 Quick Start: Deploy to Alternative Server

Deploy Meaningful Conversations to your server at `46.224.37.130` in 5 minutes!

> **Note:** Your server supports **two environments**: **Staging** (for testing) and **Production** (live site).

## ⚡ TL;DR

```bash
# 1. Set up staging environment
cp env.staging.template .env.staging
nano .env.staging  # Edit with your values

# 2. Deploy to staging
make deploy-alternative-staging

# Done! Access staging at https://mc-beta.manualmode.at

# 3. When ready, deploy to production
cp env.production.template .env.production
nano .env.production  # Edit with your values
make deploy-alternative-production

# Production at https://mc-app.manualmode.at
```

---

## 📋 Step-by-Step Guide

### Step 1: Prepare Your Server

SSH into your server and install Podman:

```bash
ssh root@46.224.37.130

# For RHEL/CentOS/Fedora
sudo dnf install podman podman-compose -y

# For Ubuntu/Debian
sudo apt-get update && sudo apt-get install podman -y
pip3 install podman-compose

# Open firewall ports (only standard HTTP/HTTPS needed)
firewall-cmd --permanent --add-service=http      # Port 80
firewall-cmd --permanent --add-service=https     # Port 443
firewall-cmd --reload

# Or for ufw:
ufw allow 80/tcp && ufw allow 443/tcp

# Exit back to your local machine
exit
```

### Step 2: Set Up SSH Key (Optional but Recommended)

```bash
# From your local machine
ssh-copy-id root@46.224.37.130

# Test it works
ssh root@46.224.37.130 "echo 'Success!'"
```

### Step 3: Configure Environment

Choose which environment to set up first (typically staging):

#### For Staging Environment

```bash
cp env.staging.template .env.staging
nano .env.staging  # Edit with your values
```

#### For Production Environment

```bash
cp env.production.template .env.production
nano .env.production  # Edit with your values
```

**Required Configuration:**
- ✅ **MariaDB** database credentials
- ✅ Database root password (for admin access)
- ✅ Database user password (for application)
- ✅ API keys (Gemini, Mailjet)
- ✅ Admin account details
- ✅ Registry credentials (quay.myandi.de)

> **Tip:** Use different database passwords for staging and production!

### Step 4: Deploy!

#### Deploy to Staging (Recommended First)

```bash
# Full staging deployment
make deploy-alternative-staging

# Or just frontend
make deploy-alternative-staging-frontend

# Or just backend
make deploy-alternative-staging-backend
```

#### Deploy to Production

```bash
# Full production deployment
make deploy-alternative-production

# Or just frontend
make deploy-alternative-production-frontend

# Or just backend
make deploy-alternative-production-backend
```

### Step 5: Access Your Application

#### Staging Environment
- **Frontend:** https://mc-beta.manualmode.at
- **Backend API:** https://mc-beta.manualmode.at/api
- **Health Check:** https://mc-beta.manualmode.at/api/health

#### Production Environment
- **Frontend:** https://mc-app.manualmode.at
- **Backend API:** https://mc-app.manualmode.at/api
- **Health Check:** https://mc-app.manualmode.at/api/health

**Note:** All external access goes through nginx reverse proxy on port 443 (HTTPS). Internal pod ports are not directly accessible from the internet due to the hosting provider's firewall.

---

## 🎯 Common Commands

### Deployment

#### Staging
```bash
# Deploy everything to staging
make deploy-alternative-staging

# Deploy only frontend (after making UI changes)
make deploy-alternative-staging-frontend

# Deploy only backend (after making API changes)
make deploy-alternative-staging-backend
```

#### Production
```bash
# Deploy everything to production
make deploy-alternative-production

# Deploy only frontend
make deploy-alternative-production-frontend

# Deploy only backend
make deploy-alternative-production-backend
```

### Monitoring

#### Staging
```bash
# View live logs
make logs-alternative-staging

# Check service status
make status-alternative-staging

# Restart services
make restart-alternative-staging

# Stop everything
make stop-alternative-staging
```

#### Production
```bash
# View live logs
make logs-alternative-production

# Check service status
make status-alternative-production

# Restart services
make restart-alternative-production

# Stop everything
make stop-alternative-production
```

### Manual Commands

#### Staging
```bash
# SSH and check logs
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-staging && podman-compose -f podman-compose-staging.yml logs -f'

# SSH and check status
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-staging && podman-compose -f podman-compose-staging.yml ps'

# SSH and restart
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-staging && podman-compose -f podman-compose-staging.yml restart'
```

#### Production
```bash
# SSH and check logs
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-production && podman-compose -f podman-compose-production.yml logs -f'

# SSH and check status
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-production && podman-compose -f podman-compose-production.yml ps'

# SSH and restart
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-production && podman-compose -f podman-compose-production.yml restart'
```

---

## 🔧 Configuration Files

| File | Purpose | Should Commit? |
|------|---------|---------------|
| `podman-compose-staging.yml` | Staging container orchestration | ✅ Yes |
| `podman-compose-production.yml` | Production container orchestration | ✅ Yes |
| `env.staging.template` | Staging configuration template | ✅ Yes |
| `env.production.template` | Production configuration template | ✅ Yes |
| `.env.staging` | Your actual staging config | ❌ No (secrets!) |
| `.env.production` | Your actual production config | ❌ No (secrets!) |
| `deploy-alternative.sh` | Deployment script (supports both envs) | ✅ Yes |

---

## 🆘 Troubleshooting

### Can't connect to server

```bash
# Test SSH connection
ssh root@46.224.37.130 "echo 'OK'"

# If it asks for password, set up SSH key:
ssh-copy-id root@46.224.37.130
```

### Services won't start

```bash
# Check what's wrong (staging)
make logs-alternative-staging

# Or for production
make logs-alternative-production

# Or SSH in and investigate (staging)
ssh root@46.224.37.130
cd /opt/meaningful-conversations-staging
podman-compose -f podman-compose-staging.yml ps
podman-compose -f podman-compose-staging.yml logs
```

### Database connection errors

#### Staging
```bash
# Check if database is running
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-staging && podman-compose -f podman-compose-staging.yml ps mariadb'

# Check database logs
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-staging && podman-compose -f podman-compose-staging.yml logs mariadb'

# Verify credentials
cat .env.staging | grep DB_
```

#### Production
```bash
# Check if database is running
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-production && podman-compose -f podman-compose-production.yml ps mariadb'

# Check database logs
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-production && podman-compose -f podman-compose-production.yml logs mariadb'

# Verify credentials
cat .env.production | grep DB_
```

### Frontend shows error page

#### Staging
```bash
# Check backend is responding (via nginx)
curl https://mc-beta.manualmode.at/api/health

# If backend is down, check logs
make logs-alternative-staging

# Restart backend
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-staging && podman-compose -f podman-compose-staging.yml restart backend'
```

#### Production
```bash
# Check backend is responding (via nginx)
curl https://mc-app.manualmode.at/api/health

# If backend is down, check logs
make logs-alternative-production

# Restart backend
ssh root@46.224.37.130 'cd /opt/meaningful-conversations-production && podman-compose -f podman-compose-production.yml restart backend'
```

### Port already in use

```bash
# Check what's using the external ports (80, 443)
ssh root@46.224.37.130 'netstat -tulpn | grep -E ":80 |:443 "'

# Check nginx status (handles all external traffic)
ssh root@46.224.37.130 'systemctl status nginx'
ssh root@46.224.37.130 'nginx -t'

# Internal pod ports are not directly accessible from outside
# They only need to be free for containers to use
```

---

## 🔒 Security Tips

### 1. Set Up HTTPS (Recommended for Production)

```bash
ssh root@46.224.37.130

# Install nginx and certbot
dnf install nginx certbot python3-certbot-nginx -y

# Configure nginx as reverse proxy
# (See ALTERNATIVE-SERVER-DUAL-ENVIRONMENT.md for full config)

# Get SSL certificate
certbot --nginx -d your-domain.com

# Nginx will auto-renew certificates
```

### 2. Change Default Passwords

Make sure you changed:
- ✅ Database passwords in `.env.staging` and `.env.production` (use different passwords!)
- ✅ Admin passwords in both environments
- ✅ JWT secrets in both environments (use different secrets!)

### 3. Firewall Configuration

```bash
ssh root@46.224.37.130

# Only allow standard HTTP/HTTPS and SSH
firewall-cmd --permanent --add-service=http      # Port 80
firewall-cmd --permanent --add-service=https     # Port 443
firewall-cmd --permanent --add-service=ssh       # SSH access
firewall-cmd --reload

# Verify
firewall-cmd --list-services
```

**Important:** The hosting provider's external firewall only allows ports 80 and 443. All internal pod ports (8080, 8081, 8082, 3307, 3308) are automatically blocked from external access and routed through nginx.

### 4. Regular Backups

```bash
# Backup staging database
make db-backup-alternative-staging

# Backup production database
make db-backup-alternative-production

# Or set up automatic backups
ssh root@46.224.37.130

# Create backup script for both environments
cat > /opt/backup-databases.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/meaningful-conversations"
mkdir -p $BACKUP_DIR

# Backup staging
cd /opt/meaningful-conversations-staging
export $(cat .env | grep DB_ROOT_PASSWORD | xargs)
podman-compose -f podman-compose-staging.yml exec -T mariadb mysqldump -u root -p${DB_ROOT_PASSWORD} meaningful_conversations_staging | gzip > $BACKUP_DIR/staging-$(date +%Y%m%d-%H%M%S).sql.gz

# Backup production
cd /opt/meaningful-conversations-production
export $(cat .env | grep DB_ROOT_PASSWORD | xargs)
podman-compose -f podman-compose-production.yml exec -T mariadb mysqldump -u root -p${DB_ROOT_PASSWORD} meaningful_conversations_production | gzip > $BACKUP_DIR/production-$(date +%Y%m%d-%H%M%S).sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
EOF

chmod +x /opt/backup-databases.sh

# Add to crontab (daily at 2 AM)
echo "0 2 * * * /opt/backup-databases.sh" | crontab -
```

---

## 📊 What Gets Deployed?

When you run `make deploy-alternative-staging` or `make deploy-alternative-production`, here's what happens:

1. **Builds Images Locally**
   - Frontend container (React app + Node.js server)
   - Backend container (Express API + Prisma)

2. **Pushes to Registry**
   - Pushes images to `quay.myandi.de/gherold/*`
   - Tagged with environment (staging/production)

3. **Pulls on Server**
   - Server pulls images from Quay registry
   - Loads into Podman

4. **Creates Environment-Specific Pod**
   - **Staging:** `meaningful-conversations-staging` pod
   - **Production:** `meaningful-conversations-production` pod
   - All containers run in their pod (shared network namespace)
   - Similar to Kubernetes pods

5. **Starts Services in Pod**
   - **MariaDB 11.2** database (with persistent volume, separate per environment)
   - Backend API (internal port 8080, accessible via nginx at `/api`)
   - Frontend (internal port 3000, accessible via nginx at `/`)

6. **Verifies Deployment**
   - Checks services are running
   - Tests endpoints are responding

---

## 🎓 Next Steps

### Basic Usage
✅ Deploy your app → **You are here!**  
⬜ Set up HTTPS with nginx  
⬜ Configure automatic backups  
⬜ Set up monitoring (optional)

### Advanced Features
- [Complete Deployment Guide](ALTERNATIVE-SERVER-DUAL-ENVIRONMENT.md) ⭐
- [MariaDB & Pod Configuration](MARIADB-POD-CONFIGURATION.md)
- [Quay Registry Setup](QUAY-REGISTRY-SETUP.md)
- [Compare Deployment Options](DEPLOYMENT-COMPARISON.md)
- [Podman Guide](PODMAN-GUIDE.md)
- [Version Management](VERSION-MANAGEMENT.md)

---

## 💡 Pro Tips

### Tip 1: Use Aliases

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
# Staging aliases
alias deploy-staging="cd /path/to/project && make deploy-alternative-staging"
alias logs-staging="ssh root@46.224.37.130 'cd /opt/meaningful-conversations-staging && podman-compose -f podman-compose-staging.yml logs -f'"
alias status-staging="ssh root@46.224.37.130 'cd /opt/meaningful-conversations-staging && podman-compose -f podman-compose-staging.yml ps'"

# Production aliases
alias deploy-prod="cd /path/to/project && make deploy-alternative-production"
alias logs-prod="ssh root@46.224.37.130 'cd /opt/meaningful-conversations-production && podman-compose -f podman-compose-production.yml logs -f'"
alias status-prod="ssh root@46.224.37.130 'cd /opt/meaningful-conversations-production && podman-compose -f podman-compose-production.yml ps'"
```

### Tip 2: Quick Deploy Frontend Only

After UI changes, deploy just the frontend (much faster):

```bash
# To staging
make deploy-alternative-staging-frontend

# To production (after testing in staging!)
make deploy-alternative-production-frontend
```

### Tip 3: Test Before Deploying

```bash
# Build and test locally first
npm run build
make build
make deploy-compose

# Then deploy to staging for testing
make deploy-alternative-staging

# After testing, deploy to production
make deploy-alternative-production
```

### Tip 4: Monitor in Real-Time

```bash
# Open multiple terminal tabs for staging
# Tab 1: View logs
make logs-alternative-staging

# Tab 2: Monitor status
watch -n 5 "ssh root@46.224.37.130 'cd /opt/meaningful-conversations-staging && podman-compose -f podman-compose-staging.yml ps'"

# Tab 3: Check resources
ssh root@46.224.37.130 "podman pod stats meaningful-conversations-staging"

# Repeat for production with production commands
```

---

## ✅ Verification Checklist

After deployment, verify everything works:

### For Staging

```bash
# 1. Check services are running
make status-alternative-staging
# Should show: mariadb, backend, frontend (all "Up")

# 2. Test frontend
curl -I https://mc-beta.manualmode.at
# Should return: HTTP/2 200

# 3. Test backend health
curl https://mc-beta.manualmode.at/api/health
# Should return: {"status":"ok"} or similar

# 4. Check logs for errors
make logs-alternative-staging
# Should see no ERROR messages

# 5. Access in browser
# Visit https://mc-beta.manualmode.at
# You should see the login page
```

### For Production

```bash
# 1. Check services are running
make status-alternative-production
# Should show: mariadb, backend, frontend (all "Up")

# 2. Test frontend
curl -I https://mc-app.manualmode.at
# Should return: HTTP/2 200

# 3. Test backend health
curl https://mc-app.manualmode.at/api/health
# Should return: {"status":"ok"} or similar

# 4. Check logs for errors
make logs-alternative-production
# Should see no ERROR messages

# 5. Access in browser
# Visit https://mc-app.manualmode.at
# You should see the login page
```

---

## 🎉 Success!

Your Meaningful Conversations app is now running on your alternative server with dual environments!

**Workflow Recommendation:**
1. ✅ Deploy to **staging** first
2. ✅ Test thoroughly in staging
3. ✅ Deploy to **production** when confident
4. ✅ Use separate databases and credentials for each

**What's Next?**
- Add HTTPS for production use
- Set up regular backups (both environments)
- Monitor resource usage
- Scale server if needed

**Questions?**
- Check [Complete Guide](ALTERNATIVE-SERVER-DUAL-ENVIRONMENT.md)
- Review [Quay Registry Setup](QUAY-REGISTRY-SETUP.md)
- Review [MariaDB Configuration](MARIADB-POD-CONFIGURATION.md)
- Compare with [Cloud Run deployment](DEPLOYMENT-COMPARISON.md)

---

**Happy Deploying! 🚀**

