# System Configuration Reference

> **Diese Datei enthält die KORREKTEN System-Konfigurationen. IMMER hier nachschlagen!**

## 🌐 Domains

### Production
- **URL:** https://mc-app.manualmode.at
- **Domain:** mc-app.manualmode.at
- **Protocol:** HTTPS
- **SSL:** Let's Encrypt (automatisch)

### Staging
- **URL:** https://mc-beta.manualmode.at
- **Domain:** mc-beta.manualmode.at
- **Protocol:** HTTPS
- **SSL:** Let's Encrypt (automatisch)

### ❌ NIEMALS VERWENDEN
- ~~manualmode.meaningful-conversations.de~~
- ~~mc-app-staging.manualmode.at~~
- Jegliche `.de` Domains

---

## 🖥️ Server

### Host
- **IP:** 91.99.193.87
- **User:** root
- **OS:** Rocky Linux / Fedora-basiert
- **SSH:** `ssh root@91.99.193.87`

### Hardware
- **CPU:** 4 vCPUs (Intel Xeon Skylake)
- **RAM:** 7.3 GiB
- **Swap:** 4 GB (konfiguriert am 27.11.2025)
- **Disk:** ~76 GB SSD

---

## 📁 Directory Structure

### Production
- **Base Path:** `/opt/manualmode-production`
- **Compose File:** `/opt/manualmode-production/podman-compose-production.yml`
- **Scripts:** `/opt/manualmode-production/scripts/`
- **Environment:** `/opt/manualmode-production/.env.production`

### Staging
- **Base Path:** `/opt/manualmode-staging`
- **Compose File:** `/opt/manualmode-staging/podman-compose-staging.yml`
- **Environment:** `/opt/manualmode-staging/.env.staging`

### Nginx
- **Config Dir:** `/etc/nginx/conf.d/`
- **Production Config:** `/etc/nginx/conf.d/production-meaningful-conversations.conf`
- **Staging Config:** `/etc/nginx/conf.d/staging-meaningful-conversations.conf`
- **Logs:** `/var/log/nginx/`

---

## 🐳 Container Names

### Production
- **Pod:** `meaningful-conversations-production`
- **MariaDB:** `meaningful-conversations-mariadb-production`
- **Backend:** `meaningful-conversations-backend-production`
- **Frontend:** `meaningful-conversations-frontend-production`
- **TTS:** `meaningful-conversations-tts-production`

### Staging
- **Pod:** `meaningful-conversations-staging`
- **MariaDB:** `meaningful-conversations-mariadb-staging`
- **Backend:** `meaningful-conversations-backend-staging`
- **Frontend:** `meaningful-conversations-frontend-staging`
- **TTS:** `meaningful-conversations-tts-staging`

---

## 💾 Volumes

### Production
- **MariaDB:** `meaningful-conversations-production_mariadb_data`
- **TTS Voices:** `meaningful-conversations-production_tts_voices`
- **Location:** Managed by Podman

### Staging
- **MariaDB:** `meaningful-conversations-staging_mariadb_data`
- **TTS Voices:** `meaningful-conversations-staging_tts_voices`
- **Location:** Managed by Podman

---

## 🔌 Ports

### Production
- **Frontend:** 3000 (intern), 443 (extern via Nginx)
- **Backend:** 8080 (intern), 443 (extern via Nginx auf `/api`)
- **MariaDB:** 3306 (nur pod-intern)
- **TTS:** 5002 (nur pod-intern)

### Staging
- **Frontend:** 3000 (intern), 443 (extern via Nginx)
- **Backend:** 8080 (intern), 443 (extern via Nginx auf `/api`)
- **MariaDB:** 3306 (nur pod-intern)
- **TTS:** 5002 (nur pod-intern)

---

## 🗄️ Database

### Production
- **Database Name:** `meaningful_conversations_production`
- **Host:** `mariadb` (im Pod-Netzwerk)
- **Port:** 3306
- **Root Password:** In `.env.production` als `MARIADB_ROOT_PASSWORD`
- **User Count (27.11.2025):** 14 User

### Staging
- **Database Name:** `meaningful_conversations_staging`
- **Host:** `mariadb` (im Pod-Netzwerk)
- **Port:** 3306
- **Root Password:** In `.env.staging` als `MARIADB_ROOT_PASSWORD`
- **User Count (27.11.2025):** 1 User (Admin)

---

## 🔑 Environment Variables

### Critical Variables (in .env files)
- `MARIADB_ROOT_PASSWORD`
- `JWT_SECRET`
- `API_KEY` (Google Gemini - deprecated, use GOOGLE_API_KEY)
- `GOOGLE_API_KEY`
- `MISTRAL_API_KEY`
- `DATABASE_URL`

### AI Provider Configuration
- **Current:** Google Gemini (Primary), Mistral AI (Secondary)
- **Config:** In `AppConfig` table (database-driven, hot-reload)
- **Default:** `AI_PROVIDER=google`

---

## 📊 Monitoring

### System Resources
```bash
# Dashboard (interactive)
make monitor-dashboard-manualmode

# Quick stats
make monitor-stats-manualmode

# System overview
make monitor-system-manualmode
```

### Logs
```bash
# Production backend
podman logs -f meaningful-conversations-backend-production

# Production frontend
podman logs -f meaningful-conversations-frontend-production

# Nginx error log
tail -f /var/log/nginx/error.log

# Nginx access log (anonymized)
tail -f /var/log/nginx/production-access.log
```

---

## 🔄 Common Operations

### Restart Production
```bash
cd /opt/manualmode-production
podman-compose -f podman-compose-production.yml restart
bash /opt/manualmode-production/update-nginx-ips.sh production
systemctl reload nginx
```

### Restart Single Service (Production)
```bash
cd /opt/manualmode-production
podman-compose -f podman-compose-production.yml restart backend
bash /opt/manualmode-production/update-nginx-ips.sh production
systemctl reload nginx
```

### Database Backup
```bash
# Automatic daily backup at 06:00 UTC
# Location: /root/backups/meaningful-conversations-production/

# Manual backup
podman exec meaningful-conversations-mariadb-production \
  mariadb-dump -u root -p${MARIADB_ROOT_PASSWORD} meaningful_conversations_production \
  > backup-$(date +%Y%m%d-%H%M%S).sql
```

### View Container IPs
```bash
# Production backend
podman inspect meaningful-conversations-backend-production \
  --format '{{.NetworkSettings.Networks.podman.IPAddress}}'

# Production frontend
podman inspect meaningful-conversations-frontend-production \
  --format '{{.NetworkSettings.Networks.podman.IPAddress}}'
```

---

## 🚨 Emergency Contacts

### Project Owner
- **Name:** Not specified in codebase
- **Domains:** mc-app.manualmode.at, mc-beta.manualmode.at

### External Services
- **DNS:** Not specified
- **SSL:** Let's Encrypt (automatic renewal via Certbot)
- **Hosting:** Not specified

---

## 📝 Notes

1. **NIEMALS** Production stoppen ohne explizite User-Anfrage
2. **IMMER** Staging zuerst testen vor Production-Deployments
3. **IMMER** `.at` Domains verwenden, NIEMALS `.de`
4. **IMMER** User Count nach DB-Restore verifizieren (sollte 14 sein)
5. **IMMER** Nginx IPs nach Container-Restart updaten

---

**Erstellt:** 27.11.2025  
**Letzte Aktualisierung:** 27.11.2025  
**Version:** 1.0

