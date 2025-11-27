# Deployment Checklist - Meaningful Conversations

> **Dieser Checklist ist VERBINDLICH und MUSS vor jeder Bestätigung vollständig durchlaufen werden!**

## 🎯 System-Informationen (IMMER korrekt verwenden!)

### Domains:
- ✅ **Production:** https://mc-app.manualmode.at
- ✅ **Staging:** https://mc-beta.manualmode.at
- ❌ **NIEMALS:** .de domains verwenden!

### Server:
- IP: 91.99.193.87
- User: root
- Paths:
  - Production: `/opt/manualmode-production`
  - Staging: `/opt/manualmode-staging`

### Container Namen:
- Production: `meaningful-conversations-*-production`
- Staging: `meaningful-conversations-*-staging`

---

## 🔄 Container Restart Procedures

### ⚠️ CRITICAL RULE: Always Update Nginx After Restarts!

**Every container restart changes IPs → Nginx MUST be updated!**

### ✅ CORRECT Way to Restart:

```bash
# Production (with confirmation prompt)
make restart-manualmode-production

# Staging (no confirmation)
make restart-manualmode-staging

# Backend only (Production)
make restart-manualmode-production-backend

# Backend only (Staging)
make restart-manualmode-staging-backend
```

### ❌ WRONG Way to Restart:

```bash
# DON'T DO THIS! It will cause 502 errors!
podman-compose restart
cd /opt/manualmode-production && podman-compose restart
ssh root@91.99.193.87 'podman-compose restart'
```

**Why?** Container IPs change on restart, but Nginx still points to old IPs!

### 📝 What the Script Does:

1. ✅ Restarts containers
2. ✅ Waits for health checks
3. ✅ Updates Nginx IPs automatically
4. ✅ Reloads Nginx
5. ✅ Tests connectivity
6. ✅ Reports success/failure

---

## ✅ Pre-Deployment Checklist

### 1. Database Health Check
```bash
# Check for incomplete migrations
podman exec meaningful-conversations-mariadb-production bash -c \
  'echo "SELECT migration_name, started_at, finished_at FROM _prisma_migrations WHERE finished_at IS NULL ORDER BY started_at;" | \
  /usr/bin/mariadb -u root -p${MARIADB_ROOT_PASSWORD} meaningful_conversations_production'

# Expected: 0 rows (keine unvollständigen Migrations)
```

**✅ PASS:** Keine unvollständigen Migrations  
**❌ FAIL:** Migrations bereinigen BEVOR deployment!

### 2. Container Status Check
```bash
podman ps --filter name=production --format 'table {{.Names}}\t{{.Status}}'
```

**✅ PASS:** Alle Container "Up X minutes/hours (healthy)"  
**❌ FAIL:** Container starten und gesund machen!

### 3. Volume Name Verification
```bash
# Check compose file
grep "^name:" /opt/manualmode-production/podman-compose-production.yml

# Check actual volumes
podman volume ls | grep meaningful-conversations-production
```

**✅ PASS:** 
- Compose: `name: meaningful-conversations-production`
- Volumes: `meaningful-conversations-production_mariadb_data`, `meaningful-conversations-production_tts_voices`

**❌ FAIL:** Volume-Namen korrigieren!

### 4. End-to-End Connectivity Test
```bash
# Production
curl -s -w '\nHTTP: %{http_code}\n' https://mc-app.manualmode.at/api/health --max-time 5

# Staging
curl -s -w '\nHTTP: %{http_code}\n' https://mc-beta.manualmode.at/api/health --max-time 5
```

**✅ PASS:** Beide geben `{"status":"ok","database":"connected"}` + HTTP 200  
**❌ FAIL:** Nginx IPs updaten und Container-Status prüfen!

---

## 🚀 Deployment Steps

### Step 1: Git Pull & Environment Check
```bash
cd /opt/manualmode-production
git pull origin main
```

### Step 2: Stop Services
```bash
cd /opt/manualmode-production
podman-compose -f podman-compose-production.yml down
```

**⚠️ WICHTIG:** Frontend bleibt erreichbar, bis Backend gestoppt ist!

### Step 3: Start Services
```bash
cd /opt/manualmode-production
podman-compose -f podman-compose-production.yml up -d
```

### Step 4: Wait for Health
```bash
# Wait 60 seconds for all services to start
sleep 60

# Check health
podman ps --filter name=production --format 'table {{.Names}}\t{{.Status}}'
```

### Step 5: Update Nginx IPs
```bash
bash /opt/manualmode-production/update-nginx-ips.sh production
systemctl reload nginx
```

### Step 6: Verify Connectivity
```bash
curl -s https://mc-app.manualmode.at/api/health
# Expected: {"status":"ok","database":"connected"}
```

---

## 🔍 Post-Deployment Verification

### 1. User Count Check
```bash
podman exec meaningful-conversations-mariadb-production bash -c \
  'echo "SELECT COUNT(*) as user_count FROM User;" | \
  /usr/bin/mariadb -u root -p${MARIADB_ROOT_PASSWORD} meaningful_conversations_production'
```

**✅ PASS:** User count matches expected (aktuell: 14)  
**❌ FAIL:** SOFORT BACKUP EINSPIELEN!

### 2. Migration Status
```bash
podman exec meaningful-conversations-mariadb-production bash -c \
  'echo "SELECT COUNT(*) as incomplete FROM _prisma_migrations WHERE finished_at IS NULL;" | \
  /usr/bin/mariadb -u root -p${MARIADB_ROOT_PASSWORD} meaningful_conversations_production'
```

**✅ PASS:** incomplete = 0  
**❌ FAIL:** Logs prüfen, Migrations bereinigen

### 3. Backend Logs Check
```bash
podman logs --tail 20 meaningful-conversations-backend-production
```

**✅ PASS:** 
- "Backend server is running on port 8080"
- "No pending migrations to apply"
- Keine ERROR-Meldungen

**❌ FAIL:** Fehler beheben!

### 4. Frontend Accessibility
```bash
# Test in Browser:
# https://mc-app.manualmode.at
```

**✅ PASS:** Seite lädt, Login funktioniert  
**❌ FAIL:** Frontend-Container prüfen, Nginx-Config prüfen

---

## 🚨 Emergency Procedures

### Backend startet nicht (Migration-Fehler)
```bash
# 1. Check incomplete migrations
podman exec meaningful-conversations-mariadb-production bash -c \
  'echo "SELECT * FROM _prisma_migrations WHERE finished_at IS NULL;" | \
  /usr/bin/mariadb -u root -p${MARIADB_ROOT_PASSWORD} meaningful_conversations_production'

# 2. If table already exists, mark migration as complete
# Example:
podman exec meaningful-conversations-mariadb-production bash -c \
  'echo "UPDATE _prisma_migrations SET finished_at = started_at WHERE migration_name = \"MIGRATION_NAME\" AND finished_at IS NULL;" | \
  /usr/bin/mariadb -u root -p${MARIADB_ROOT_PASSWORD} meaningful_conversations_production'

# 3. Restart backend (WITH Nginx update!)
bash /opt/manualmode-production/scripts/restart-with-nginx-update.sh production backend
```

### 502 Bad Gateway
```bash
# CAUSE: Container IP changed but Nginx config not updated
# SOLUTION: Always use restart-with-nginx-update.sh script!

# Quick fix for existing 502:
bash /opt/manualmode-production/update-nginx-ips.sh production
systemctl reload nginx
```

### Datenbank leer / User fehlen
```bash
# SOFORT BACKUP EINSPIELEN!
# Siehe: INCIDENT-REPORT-2025-11-27.md
```

---

## 📋 Deployment Communication Template

**NACH** erfolgreichem Deployment dem User mitteilen:

```
✅ Deployment abgeschlossen!

Status:
- Production: https://mc-app.manualmode.at ✅
- Staging: https://mc-beta.manualmode.at ✅
- Alle Container: healthy ✅
- Database: XX User ✅
- Migrations: 0 incomplete ✅

Tests durchgeführt:
✅ Database connectivity
✅ API health endpoint
✅ Frontend accessibility
✅ Nginx configuration
✅ User count verification
```

**NIEMALS** vorher bestätigen, dass "alles ready" ist!

---

## 🔒 Regeln für AI-Assistenten

1. **NIEMALS** sagen "alles ist bereit für Deployment", ohne ALLE Checks durchgeführt zu haben
2. **NIEMALS** `.de` domains verwenden - NUR `.at`!
3. **NIEMALS** Production ohne explizite User-Anfrage stoppen
4. **IMMER** Post-Deployment-Verification durchführen
5. **IMMER** User count nach Deployment prüfen
6. **IMMER** Migration-Status vor UND nach Deployment prüfen

---

**Erstellt:** 27.11.2025  
**Letzte Aktualisierung:** 27.11.2025  
**Version:** 1.0

