# Server Migration Guide

Complete guide for migrating the Meaningful Conversations application to a new server.

## 📋 Prerequisites

- Root access to both old and new server
- DNS management access
- At least 10 GB free space on new server
- Approximately 30-60 minutes downtime window

## 🎯 Migration Overview

```
Old Server (46.224.37.130) → New Server (YOUR_NEW_IP)
├── Database backups
├── Container images
├── Configuration files
├── SSL certificates (regenerated)
└── DNS update
```

---

## 🚀 Step-by-Step Migration

### **1. Prepare New Server**

```bash
# SSH to new server
ssh root@<NEW_SERVER_IP>

# Update system
dnf update -y

# Install required packages
dnf install -y podman podman-compose git nginx openssl epel-release
dnf install -y certbot python3-certbot-nginx

# Create directories
mkdir -p /opt/meaningful-conversations-staging
mkdir -p /opt/meaningful-conversations-production
mkdir -p /etc/nginx/ssl
mkdir -p /etc/nginx/conf.d
mkdir -p /usr/local/bin

# Enable and start Podman
systemctl enable --now podman
systemctl enable --now nginx

# Configure firewall (if firewalld is active)
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

### **2. Create Backups on Old Server**

```bash
# SSH to old server
ssh root@46.224.37.130

# Create backup directory
mkdir -p /tmp/mc-migration

# Backup Staging Database
podman exec meaningful-conversations-mariadb-staging \
  mariadb-dump -u root -p'your_staging_password' meaningful_conversations_staging \
  > /tmp/mc-migration/staging-db-backup.sql

# Backup Production Database
podman exec meaningful-conversations-mariadb-production \
  mariadb-dump -u root -p'your_production_password' meaningful_conversations_production \
  > /tmp/mc-migration/production-db-backup.sql

# Backup environment files
tar -czf /tmp/mc-migration/env-files.tar.gz \
  /opt/meaningful-conversations-staging/.env \
  /opt/meaningful-conversations-production/.env

# Backup nginx configurations
tar -czf /tmp/mc-migration/nginx-configs.tar.gz \
  /etc/nginx/conf.d/staging-meaningful-conversations.conf \
  /etc/nginx/conf.d/production-meaningful-conversations.conf \
  /usr/local/bin/update-nginx-ips.sh

# Backup podman-compose files (optional - you have them in Git)
tar -czf /tmp/mc-migration/compose-files.tar.gz \
  /opt/meaningful-conversations-staging/podman-compose.yml \
  /opt/meaningful-conversations-production/podman-compose.yml

# Create checksum file
cd /tmp/mc-migration
sha256sum *.sql *.tar.gz > checksums.txt

echo "✅ Backups created in /tmp/mc-migration/"
ls -lh /tmp/mc-migration/
```

### **3. Transfer Backups to New Server**

```bash
# On your LOCAL machine (Mac)
cd ~/Meaningful-Conversations-Project
mkdir -p ./migration-backups

# Download from old server
scp -r root@46.224.37.130:/tmp/mc-migration/* ./migration-backups/

# Verify checksums locally
cd ./migration-backups
sha256sum -c checksums.txt

# Upload to new server
scp -r ./migration-backups/* root@<NEW_SERVER_IP>:/tmp/mc-migration/

# Verify on new server
ssh root@<NEW_SERVER_IP> 'cd /tmp/mc-migration && sha256sum -c checksums.txt'
```

### **4. Restore Configuration on New Server**

```bash
# SSH to new server
ssh root@<NEW_SERVER_IP>

# Extract environment files
cd /opt
tar -xzf /tmp/mc-migration/env-files.tar.gz

# Extract nginx configs
tar -xzf /tmp/mc-migration/nginx-configs.tar.gz -C /

# Make update script executable
chmod +x /usr/local/bin/update-nginx-ips.sh

# Verify files
ls -la /opt/meaningful-conversations-staging/.env
ls -la /opt/meaningful-conversations-production/.env
ls -la /etc/nginx/conf.d/*meaningful-conversations*
```

### **5. Deploy Application to New Server**

```bash
# On your LOCAL machine (Mac)
cd ~/Meaningful-Conversations-Project

# Update deploy-alternative.sh with new IP
# (See section below for script modifications)

# Deploy staging environment
./deploy-alternative.sh --environment staging --server <NEW_SERVER_IP>

# Deploy production environment
./deploy-alternative.sh --environment production --server <NEW_SERVER_IP>
```

### **6. Restore Databases**

```bash
# SSH to new server
ssh root@<NEW_SERVER_IP>

# Wait for MariaDB containers to be ready
podman exec meaningful-conversations-mariadb-staging mariadb -u root -p'password' -e "SELECT 1"
podman exec meaningful-conversations-mariadb-production mariadb -u root -p'password' -e "SELECT 1"

# Restore Staging Database
podman exec -i meaningful-conversations-mariadb-staging \
  mariadb -u root -p'your_staging_password' meaningful_conversations_staging \
  < /tmp/mc-migration/staging-db-backup.sql

# Restore Production Database
podman exec -i meaningful-conversations-mariadb-production \
  mariadb -u root -p'your_production_password' meaningful_conversations_production \
  < /tmp/mc-migration/production-db-backup.sql

# Verify data
podman exec meaningful-conversations-mariadb-staging \
  mariadb -u root -p'password' meaningful_conversations_staging \
  -e "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM conversations;"

podman exec meaningful-conversations-mariadb-production \
  mariadb -u root -p'password' meaningful_conversations_production \
  -e "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM conversations;"
```

### **7. Test Application Locally (Before DNS Switch)**

```bash
# On your LOCAL machine, test via IP:
# Add to /etc/hosts temporarily:
sudo nano /etc/hosts

# Add these lines:
<NEW_SERVER_IP> mc-beta.manualmode.at
<NEW_SERVER_IP> mc-app.manualmode.at

# Test in browser (will show SSL warning - that's OK for now):
# https://mc-beta.manualmode.at
# https://mc-app.manualmode.at

# Test login, create conversation, check all features work
```

### **8. Update DNS Records**

```bash
# In your DNS management console:
# Update A records for both subdomains:

# Record 1 - Staging:
Type: A
Name: mc-beta
Target: <NEW_SERVER_IP>
TTL: 300 (5 minutes for migration)

# Record 2 - Production:
Type: A
Name: mc-app
Target: <NEW_SERVER_IP>
TTL: 300 (5 minutes for migration)

# Wait 5-10 minutes for DNS propagation
# Monitor with: watch -n 10 'nslookup mc-beta.manualmode.at'
```

### **9. Generate SSL Certificates on New Server**

```bash
# SSH to new server
ssh root@<NEW_SERVER_IP>

# Wait for DNS to propagate first!
# Test: nslookup mc-beta.manualmode.at (should show NEW_SERVER_IP)

# Generate Let's Encrypt certificates
certbot --nginx \
  -d mc-beta.manualmode.at \
  -d mc-app.manualmode.at \
  --non-interactive \
  --agree-tos \
  --email admin@manualmode.at \
  --redirect

# Enable auto-renewal
systemctl start certbot-renew.timer
systemctl enable certbot-renew.timer

# Reload nginx
systemctl reload nginx
```

### **10. Final Verification**

```bash
# On your LOCAL machine:
# Remove temporary /etc/hosts entries
sudo nano /etc/hosts
# Delete the lines you added in step 7

# Clear browser cache and test:
# Chrome: Cmd+Shift+Delete → Clear all

# Test both sites:
# https://mc-beta.manualmode.at
# https://mc-app.manualmode.at

# Check SSL certificate (should be Let's Encrypt, valid, no warnings)
# Test all functionality:
# - Login
# - Create conversation
# - Send messages
# - Check database persistence
```

---

## 🔧 Modify deploy-alternative.sh for New Server

Update the script to use the new server IP:

```bash
# Edit line 17 in deploy-alternative.sh:
REMOTE_HOST="root@<NEW_SERVER_IP>"
```

Or use the `--server` parameter when deploying:

```bash
./deploy-alternative.sh --environment staging --server <NEW_SERVER_IP>
```

---

## 📝 Important Notes

### Database Passwords
Make sure you know your database passwords from the `.env` files:
```bash
# Check old server:
ssh root@46.224.37.130 'cat /opt/meaningful-conversations-staging/.env | grep MARIADB_ROOT_PASSWORD'
```

### Podman Registry
If you're using a local registry, you may need to:
1. Push images to Docker Hub first
2. Or set up podman-to-podman image transfer
3. Or rebuild images on new server

### Volume Data
If you have uploaded files or other persistent data outside the database:
```bash
# Check for additional volumes:
ssh root@46.224.37.130 'podman volume ls'

# Backup if needed:
ssh root@46.224.37.130 'podman volume export volume_name -o /tmp/volume_name.tar'
```

### Downtime Window
Expected downtime: **30-60 minutes**
- Database backup: 5 min
- Transfer: 5 min
- Deploy: 10 min
- Restore DB: 5 min
- DNS propagation: 5-30 min
- SSL generation: 2 min
- Testing: 5-10 min

---

## 🔄 Rollback Plan

If something goes wrong:

1. **DNS Rollback:**
   ```bash
   # Change DNS back to old server IP: 46.224.37.130
   # Wait 5-10 minutes
   ```

2. **Old server is still running:**
   - Nothing was changed on old server
   - Just point DNS back

3. **SSL Certificates:**
   - Old server still has valid Let's Encrypt certificates
   - Will work immediately when DNS points back

---

## ✅ Post-Migration Cleanup

After successful migration (wait 24-48 hours):

```bash
# On OLD server:
ssh root@46.224.37.130

# Stop pods
podman-compose -f /opt/meaningful-conversations-staging/podman-compose.yml down
podman-compose -f /opt/meaningful-conversations-production/podman-compose.yml down

# Remove volumes (CAREFUL!)
podman volume rm meaningful-conversations-staging-mariadb-data
podman volume rm meaningful-conversations-production-mariadb-data

# Remove images
podman image prune -a

# Optional: Backup old server one more time before cleaning
```

---

## 🆘 Troubleshooting

### Container won't start
```bash
# Check logs:
podman logs meaningful-conversations-backend-staging
podman logs meaningful-conversations-mariadb-staging

# Check pod status:
podman pod ps
```

### Database connection fails
```bash
# Check MariaDB is running:
podman exec meaningful-conversations-mariadb-staging mariadb -u root -p'password' -e "SELECT 1"

# Check .env file has correct credentials
cat /opt/meaningful-conversations-staging/.env | grep MARIADB
```

### nginx errors
```bash
# Test config:
nginx -t

# Check error log:
tail -f /var/log/nginx/staging-error.log

# Update IPs:
/usr/local/bin/update-nginx-ips.sh
systemctl reload nginx
```

### SSL certificate fails
```bash
# Check DNS first:
nslookup mc-beta.manualmode.at
# Must show new server IP!

# Retry certificate:
certbot --nginx -d mc-beta.manualmode.at --force-renewal
```

---

## 📞 Support

If you encounter issues during migration:
1. Check logs first (nginx, podman, containers)
2. Verify DNS has propagated
3. Ensure firewall allows HTTP/HTTPS
4. Check that all environment variables are set correctly

**The old server remains unchanged until you explicitly clean it up, so you can always roll back via DNS!**

