# 🔄 nginx Reverse Proxy Setup

This document explains the nginx reverse proxy architecture for the alternative server deployment and how to configure SSL certificates.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [nginx Configuration Files](#nginx-configuration-files)
- [Automatic IP Management](#automatic-ip-management)
- [SSL Certificate Setup](#ssl-certificate-setup)
- [Port Configuration](#port-configuration)
- [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

The alternative server uses **nginx as a reverse proxy** on the host system, which sits in front of Podman pod containers.

```
Internet
    ↓
DNS: mc-beta.manualmode.at (Staging)
     mc-app.manualmode.at (Production)
    ↓
46.224.37.130 (Host Server - nginx)
    ↓
┌──────────────────────────────────────────────────┐
│ nginx (systemd service on host)                  │
│                                                   │
│ Staging:                                         │
│ └─ Port 443 (HTTPS) → mc-beta.manualmode.at     │
│    Routes /api → Backend, /* → Frontend          │
│                                                   │
│ Production:                                      │
│ └─ Port 443 (HTTPS) → mc-app.manualmode.at      │
│    Routes /api → Backend, /* → Frontend          │
└───────────────────┬──────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│ Podman Pods (containers with dynamic IPs)        │
│                                                   │
│ Staging Pod: meaningful-conversations-staging    │
│ ├─ Frontend  (container IP:3000)                │
│ ├─ Backend   (container IP:8080)                │
│ └─ MariaDB   (container IP:3306, port 3307)     │
│                                                   │
│ Production Pod: meaningful-conversations-production│
│ ├─ Frontend  (container IP:3000)                │
│ ├─ Backend   (container IP:8080)                │
│ └─ MariaDB   (container IP:3306, port 3308)     │
└──────────────────────────────────────────────────┘

Note: Container IPs are dynamic and updated automatically via
update-nginx-ips.sh script after each deployment.
```

## 📁 nginx Configuration Files

All configuration files are located in `/etc/nginx/conf.d/` on the server.

### Staging Configuration

#### 1. `staging-meaningful-conversations.conf`

**Purpose:** Unified HTTPS access to staging environment

**Access:** `https://mc-beta.manualmode.at` (also accessible via `https://46.224.37.130`)

**Features:**
- ✅ SSL/TLS certificate (Let's Encrypt recommended for production use)
- ✅ Security headers (HSTS, X-Frame-Options, CSP)
- ✅ Automatic HTTP to HTTPS redirect
- ✅ WebSocket support for Socket.IO
- ✅ Routes `/api/*` to backend container
- ✅ Routes all other paths to frontend container

```nginx
# Port 443 (HTTPS)
https://mc-beta.manualmode.at
├─ /api/*       → Backend container (dynamic IP:8080)
├─ /socket.io/* → Backend (WebSocket)
└─ /*           → Frontend container (dynamic IP:3000)

# Port 80 (HTTP) → Redirects to HTTPS
```

**Note:** The hosting provider's external firewall only allows ports 80 and 443. Internal ports (8080, 8081, 3307) are accessible from within the server but not from the internet. All external access goes through nginx reverse proxy on port 443 (HTTPS).

### Production Configuration

#### 2. `production-meaningful-conversations.conf`

**Purpose:** Unified access to production environment

**Access:** `https://mc-app.manualmode.at` (also accessible via `http://46.224.37.130`)

**Features:**
- ✅ HTTPS with SSL certificate (Let's Encrypt recommended)
- ✅ Security headers
- ✅ WebSocket support
- ✅ Routes `/api/*` to backend container
- ✅ Routes all other paths to frontend container

```nginx
# Port 443 (HTTPS) - Main production access
https://mc-app.manualmode.at
├─ /api/*       → Backend container (dynamic IP:8080)
├─ /socket.io/* → Backend (WebSocket)
└─ /*           → Frontend container (dynamic IP:3000)

# Port 80 (HTTP) → Redirects to HTTPS
```

**Note:** Only standard ports (80/443) are accessible from outside the server due to the hosting provider's external firewall. All external traffic goes through nginx reverse proxy on ports 80/443.

---

## 🔄 Automatic IP Management

Container IPs can change when pods are restarted. The `update-nginx-ips.sh` script regenerates the full vhost files (HTTPS proxy to containers **and** port 80 servers for HTTP→HTTPS redirects), matching `nginx-config/*.template`, so deploys cannot strip TLS enforcement.

### Script Location

```bash
/usr/local/bin/update-nginx-ips.sh
```

### Usage

```bash
# Update staging nginx configs
sudo /usr/local/bin/update-nginx-ips.sh staging

# Update production nginx configs
sudo /usr/local/bin/update-nginx-ips.sh production

# Update both
sudo /usr/local/bin/update-nginx-ips.sh all
```

### Automatic Execution

The script is **automatically called** during deployment:

```bash
./deploy-alternative.sh -e staging
# → Automatically runs: update-nginx-ips.sh staging

./deploy-alternative.sh -e production
# → Automatically runs: update-nginx-ips.sh production
```

### What It Does

1. ✅ Detects current container IP addresses from Podman
2. ✅ Updates nginx configuration files with new IPs
3. ✅ Creates backup files (*.bak)
4. ✅ Tests nginx configuration validity
5. ✅ Reloads nginx if configuration is valid
6. ✅ Rolls back if there are errors

### Manual IP Update (if needed)

If containers are restarted outside of the deployment script:

```bash
# SSH into server
ssh root@46.224.37.130

# Restart staging pod
cd /opt/meaningful-conversations-staging
podman-compose -f podman-compose-staging.yml restart

# Update nginx IPs
/usr/local/bin/update-nginx-ips.sh staging
```

---

## 🔒 SSL Certificate Setup

Currently, staging uses **self-signed certificates**. For production, you should use **Let's Encrypt** for trusted SSL certificates.

### Current SSL Certificate Setup

**Domain Names:**
- Staging: `mc-beta.manualmode.at`
- Production: `mc-app.manualmode.at`

**Certificate Options:**

1. **Let's Encrypt (Recommended):** Free, trusted SSL certificates
2. **Self-signed:** For testing only (browsers will show warnings)

**Current Location:** `/etc/nginx/ssl/` or `/etc/letsencrypt/live/[domain]/`

### Setting Up Let's Encrypt (Recommended)

#### Step 1: Install Certbot

```bash
# SSH into server
ssh root@46.224.37.130

# Install certbot and nginx plugin
dnf install certbot python3-certbot-nginx
```

#### Step 2: Obtain Certificates for Both Domains

```bash
# For staging domain
certbot certonly --nginx -d mc-beta.manualmode.at

# For production domain
certbot certonly --nginx -d mc-app.manualmode.at

# Or obtain both at once
certbot certonly --nginx -d mc-beta.manualmode.at -d mc-app.manualmode.at
```

**Note:** Make sure your DNS A records for both domains point to `46.224.37.130` before running certbot.

#### Step 3: Update nginx Configurations

The nginx configurations should already reference the domain names. Verify the certificates are being used:

**For staging** (`/etc/nginx/conf.d/staging-meaningful-conversations.conf`):
```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name mc-beta.manualmode.at;
    
    # Let's Encrypt certificates
    ssl_certificate /etc/letsencrypt/live/mc-beta.manualmode.at/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mc-beta.manualmode.at/privkey.pem;
    
    # Proxy to containers (IPs managed by update-nginx-ips.sh)
    # ... rest of configuration ...
}
```

**For production** (`/etc/nginx/conf.d/production-meaningful-conversations.conf`):
```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name mc-app.manualmode.at;
    
    # Let's Encrypt certificates
    ssl_certificate /etc/letsencrypt/live/mc-app.manualmode.at/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mc-app.manualmode.at/privkey.pem;
    
    # Proxy to containers (IPs managed by update-nginx-ips.sh)
    # ... rest of configuration ...
}
```

#### Step 4: Test and Reload

```bash
# Test configuration
nginx -t

# Reload nginx
systemctl reload nginx
```

#### Step 5: Verify SSL is Working

```bash
# Test staging
curl -I https://mc-beta.manualmode.at

# Test production
curl -I https://mc-app.manualmode.at
```

#### Step 6: Setup Auto-Renewal

Certbot automatically creates a systemd timer for renewal. Verify it:

```bash
# Check timer status
systemctl status certbot-renew.timer

# Test renewal (dry run)
certbot renew --dry-run
```

### Current Domain Configuration

**The system is already configured with:**
- Staging: `mc-beta.manualmode.at` → HTTPS on port 443
- Production: `mc-app.manualmode.at` → HTTPS on port 443

**DNS Configuration:**
Both domains have A records pointing to `46.224.37.130`

**Frontend Configuration:**
The `services/api.ts` file already includes these domains:
```typescript
const backendMap: { [key: string]: string } = {
    'mc-beta.manualmode.at': '',   // Staging: nginx proxies /api
    'mc-app.manualmode.at': '',    // Production: nginx proxies /api
    '46.224.37.130': '',           // Fallback for IP access
};
```

The empty string means the frontend uses relative paths (`/api/*`), and nginx on the host handles routing to the correct backend container.

---

## 🔌 Port Configuration

### External Ports (accessible from internet)

| Port | Environment | Purpose | Domain |
|------|-------------|---------|--------|
| 443 | Staging | Secure staging access | https://mc-beta.manualmode.at |
| 443 | Production | Secure production access | https://mc-app.manualmode.at |
| 80 | Both | HTTP redirect to HTTPS | http://46.224.37.130 |

**Note:** Only standard ports (80/443) are accessible from the internet due to hosting provider's external firewall. Internal pod ports (8080, 8081, 8082, 3307, 3308) are only accessible from within the server or between containers in the same pod.

### Internal Pod Ports (not directly accessible)

| Container | Port | Purpose |
|-----------|------|---------|
| Frontend | 3000 | React/Node.js server |
| Backend | 8080 | Express API server |
| MariaDB | 3306 | Database connections |

### Firewall Configuration

```bash
# Allow necessary ports (standard HTTP/HTTPS only)
firewall-cmd --permanent --add-service=http       # Port 80 (Production)
firewall-cmd --permanent --add-service=https      # Port 443 (Staging)

# Apply changes
firewall-cmd --reload

# Verify
firewall-cmd --list-all
```

**Important:** The hosting provider's external firewall only allows ports 80 and 443. Custom ports (8080, 8081, 8082) cannot be accessed from outside even if configured in the server firewall.

---

## 🔍 Troubleshooting

### Check nginx Status

```bash
ssh root@46.224.37.130

# Check if nginx is running
systemctl status nginx

# View nginx error logs
tail -f /var/log/nginx/error.log

# View staging access logs
tail -f /var/log/nginx/staging-access.log

# View production access logs
tail -f /var/log/nginx/production-access.log
```

### Test nginx Configuration

```bash
# Test configuration syntax
nginx -t

# Reload nginx
systemctl reload nginx

# Restart nginx (if reload doesn't work)
systemctl restart nginx
```

### Check Container IPs

```bash
# Get staging backend IP
podman inspect meaningful-conversations-backend-staging | grep IPAddress

# Get staging frontend IP
podman inspect meaningful-conversations-frontend-staging | grep IPAddress

# Get production backend IP
podman inspect meaningful-conversations-backend-production | grep IPAddress

# Get production frontend IP
podman inspect meaningful-conversations-frontend-production | grep IPAddress
```

### Common Issues

#### 1. 502 Bad Gateway

**Cause:** nginx can't reach backend/frontend containers

**Solution:**
```bash
# Check if containers are running
podman ps

# Check container IPs
podman inspect <container-name> | grep IPAddress

# Update nginx with correct IPs
/usr/local/bin/update-nginx-ips.sh staging
```

**Vollständige Schrittfolge (Deploy, DNS, Zertifikat):** siehe [**HTTPS-WWW-DNS-GUIDE.md**](./HTTPS-WWW-DNS-GUIDE.md).

#### 1b. `www` subdomain (e.g. `www.mc-app.manualmode.at`) → 502 while apex works

**Cause:** The production `server_name` only listed `mc-app.manualmode.at`. Requests with `Host: www.mc-app.manualmode.at` did not match that vhost and could hit `default_server`, which may proxy to a dead upstream → **502**.

**Fix (repo):** Production nginx template and `server-scripts/update-nginx-ips.sh` include `www.mc-app.manualmode.at` in `server_name`. **`deploy-manualmode.sh` copies this script to `/usr/local/bin/update-nginx-ips.sh` (and mirrors it under `/opt/manualmode-staging` / `/opt/manualmode-production`) on every deploy** — no manual install. Run a normal deploy or execute `/usr/local/bin/update-nginx-ips.sh production` on the server once nginx config should be regenerated.

**TLS:** Ensure the Let’s Encrypt certificate includes the `www` name if you want HTTPS without browser warnings:

```bash
certbot certonly --nginx -d mc-app.manualmode.at -d www.mc-app.manualmode.at
# or: certbot --expand …
```

DNS must resolve `www.mc-app.manualmode.at` to the same host as production.

#### 1c. Staging: `www.mc-beta.manualmode.at` unreachable or 502

**Cause:** Same pattern as production: `server_name` listed only `mc-beta.manualmode.at`, so `Host: www.mc-beta…` missed the TLS vhost.

**Fix (repo):** `server-scripts/update-nginx-ips.sh` and [`nginx-config/staging-meaningful-conversations.conf.template`](../nginx-config/staging-meaningful-conversations.conf.template) include `www.mc-beta.manualmode.at` on HTTPS and port 80 redirects (www → apex). Redeploy or run `/usr/local/bin/update-nginx-ips.sh staging`.

**DNS:** Create **A/AAAA** (or CNAME) for `www.mc-beta.manualmode.at` pointing to the same host as `mc-beta.manualmode.at`.

**TLS:** Staging uses the same cert path as in the generated config (often shared with `mc-app.manualmode.at`). If the certificate does not list `www.mc-beta.manualmode.at`, expand it, e.g. `certbot --expand -d mc-beta.manualmode.at -d www.mc-beta.manualmode.at` (exact flags depend on your existing cert names).

#### 2. Connection Refused

**Cause:** Port not accessible or firewall blocking

**Solution:**
```bash
# Check if ports are listening
ss -tulpn | grep nginx

# Check firewall
firewall-cmd --list-all

# Test locally
curl -I http://localhost:8080
```

#### 3. SSL Certificate Errors

**Cause:** Self-signed certificate or expired certificate

**Solution for staging:**
- Accept the security warning in browser (expected for self-signed certs)

**Solution for production:**
```bash
# Renew Let's Encrypt certificate
certbot renew

# Check certificate expiry
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/cert.pem -noout -dates
```

#### 4. API Calls Failing (404 on /api/*)

**Cause:** nginx not routing /api correctly

**Solution:**
```bash
# Check nginx configuration
grep -r "location /api" /etc/nginx/conf.d/

# Verify the configuration includes /api routing
cat /etc/nginx/conf.d/staging-frontend-8080.conf
```

### Verify Proxy Routing

Test that nginx is properly routing requests:

```bash
# Test frontend access
curl -I http://46.224.37.130:8080

# Test API routing through nginx
curl -I http://46.224.37.130:8080/api/health

# Test direct backend access
curl -I http://46.224.37.130:8081/health

# Test HTTPS staging
curl -I -k https://46.224.37.130
```

### View All nginx Configurations

```bash
# List all config files
ls -la /etc/nginx/conf.d/

# View main nginx config
cat /etc/nginx/nginx.conf

# Test which config is being used
nginx -T | grep "server_name"
```

---

## 📚 Related Documentation

- [Alternative Server Deployment](ALTERNATIVE-SERVER-DUAL-ENVIRONMENT.md)
- [MariaDB & Pod Configuration](MARIADB-POD-CONFIGURATION.md)
- [Deployment Quick Start](QUICK-START-ALTERNATIVE-SERVER.md)
- [Podman Guide](PODMAN-GUIDE.md)

---

## 🎯 Summary

Your alternative server uses a sophisticated nginx reverse proxy setup:

- ✅ **nginx on host** acts as reverse proxy to Podman containers
- ✅ **Automatic IP updates** when containers restart
- ✅ **Flexible access methods** (HTTPS, HTTP, direct ports)
- ✅ **Security headers** and WebSocket support
- ✅ **Self-signed SSL** for staging (upgrade to Let's Encrypt for production)
- ✅ **Frontend uses relative paths** - nginx handles all routing

The `api.ts` file now uses **relative paths** (empty string), allowing nginx to handle all API routing transparently!


