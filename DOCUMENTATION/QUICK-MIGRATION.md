# Quick Migration Guide

> **⚠️ HISTORICAL DOCUMENT**: This migration was completed in November 2024. This guide is preserved for reference in case of future server migrations. For current server operations, see [QUICK-START-MANUALMODE-SERVER.md](./QUICK-START-MANUALMODE-SERVER.md).

Schnellanleitung für den Server-Umzug in 10 Schritten.
Für Details siehe: [SERVER-MIGRATION-GUIDE.md](./SERVER-MIGRATION-GUIDE.md)

---

## 🚀 Voraussetzungen

- Neue Server-IP: `<NEUE_IP>`
- SSH-Zugang zum neuen Server
- DNS-Zugang (z.B. world4you)
- Ca. 30-60 Minuten Zeit

---

## ⚡ 10 Schritte zum neuen Server

### 1️⃣ Neuen Server vorbereiten

```bash
# SSH zum neuen Server
ssh root@<NEUE_IP>

# System einrichten
dnf update -y
dnf install -y podman podman-compose git nginx openssl epel-release
dnf install -y certbot python3-certbot-nginx

# Verzeichnisse erstellen
mkdir -p /opt/meaningful-conversations-{staging,production}
mkdir -p /etc/nginx/{ssl,conf.d}
mkdir -p /usr/local/bin

# Services starten
systemctl enable --now podman nginx
```

---

### 2️⃣ Backups vom alten Server erstellen

```bash
# SSH zum ALTEN Server
ssh root@46.224.37.130

# Backup-Verzeichnis
mkdir -p /tmp/mc-migration

# Datenbank-Backups
podman exec meaningful-conversations-mariadb-staging \
  mariadb-dump -u root -p'PASSWORD' meaningful_conversations_staging \
  > /tmp/mc-migration/staging-db-backup.sql

podman exec meaningful-conversations-mariadb-production \
  mariadb-dump -u root -p'PASSWORD' meaningful_conversations_production \
  > /tmp/mc-migration/production-db-backup.sql

# Config-Backups
tar -czf /tmp/mc-migration/env-files.tar.gz \
  /opt/meaningful-conversations-staging/.env \
  /opt/meaningful-conversations-production/.env

tar -czf /tmp/mc-migration/nginx-configs.tar.gz \
  /etc/nginx/conf.d/*meaningful-conversations* \
  /usr/local/bin/update-nginx-ips.sh

# Checksummen
cd /tmp/mc-migration && sha256sum *.sql *.tar.gz > checksums.txt
```

---

### 3️⃣ Backups übertragen

```bash
# Auf deinem MAC:
cd ~/Meaningful-Conversations-Project
mkdir -p ./migration-backups

# Vom alten Server holen
scp root@46.224.37.130:/tmp/mc-migration/* ./migration-backups/

# Zum neuen Server kopieren
scp ./migration-backups/* root@<NEUE_IP>:/tmp/mc-migration/
```

---

### 4️⃣ Configs auf neuem Server wiederherstellen

```bash
# SSH zum neuen Server
ssh root@<NEUE_IP>

# Configs entpacken
cd /opt
tar -xzf /tmp/mc-migration/env-files.tar.gz
tar -xzf /tmp/mc-migration/nginx-configs.tar.gz -C /

# Update-Script ausführbar machen
chmod +x /usr/local/bin/update-nginx-ips.sh
```

---

### 5️⃣ Application deployen (von deinem Mac)

```bash
# Auf deinem MAC:
cd ~/Meaningful-Conversations-Project

# Staging deployen
./deploy-alternative.sh --server root@<NEUE_IP> --env staging

# Production deployen
./deploy-alternative.sh --server root@<NEUE_IP> --env production
```

---

### 6️⃣ Datenbanken wiederherstellen

```bash
# SSH zum neuen Server
ssh root@<NEUE_IP>

# Warten bis MariaDB bereit ist (kann 30 Sekunden dauern)
sleep 30

# Staging DB restore
podman exec -i meaningful-conversations-mariadb-staging \
  mariadb -u root -p'PASSWORD' meaningful_conversations_staging \
  < /tmp/mc-migration/staging-db-backup.sql

# Production DB restore
podman exec -i meaningful-conversations-mariadb-production \
  mariadb -u root -p'PASSWORD' meaningful_conversations_production \
  < /tmp/mc-migration/production-db-backup.sql

# Verify
podman exec meaningful-conversations-mariadb-staging \
  mariadb -u root -p'PASSWORD' meaningful_conversations_staging \
  -e "SELECT COUNT(*) FROM users;"
```

---

### 7️⃣ Test via /etc/hosts (vor DNS-Umstellung)

```bash
# Auf deinem MAC:
sudo nano /etc/hosts

# Diese Zeilen HINZUFÜGEN:
<NEUE_IP> mc-beta.manualmode.at
<NEUE_IP> mc-app.manualmode.at

# Browser-Cache löschen (Cmd+Shift+Delete)
# Dann testen: https://mc-beta.manualmode.at
# (SSL-Warnung ist OK, wird in Schritt 9 behoben)
```

---

### 8️⃣ DNS umstellen

```bash
# In deiner DNS-Verwaltung (z.B. world4you):

# Subdomain: mc-beta
Typ:    A
Name:   mc-beta
Ziel:   <NEUE_IP>
TTL:    300

# Subdomain: mc-app
Typ:    A
Name:   mc-app
Ziel:   <NEUE_IP>
TTL:    300

# 5-10 Minuten warten für DNS-Propagation
# Check: nslookup mc-beta.manualmode.at
```

---

### 9️⃣ SSL-Zertifikate generieren

```bash
# SSH zum neuen Server
ssh root@<NEUE_IP>

# WICHTIG: Erst wenn DNS propagiert ist!
nslookup mc-beta.manualmode.at  # Muss <NEUE_IP> zeigen

# Let's Encrypt Zertifikate generieren
certbot --nginx \
  -d mc-beta.manualmode.at \
  -d mc-app.manualmode.at \
  --non-interactive \
  --agree-tos \
  --email admin@manualmode.at \
  --redirect

# Auto-Renewal aktivieren
systemctl start certbot-renew.timer
systemctl enable certbot-renew.timer

# nginx neu laden
systemctl reload nginx
```

---

### 🔟 Final testen

```bash
# Auf deinem MAC:
# /etc/hosts Einträge ENTFERNEN
sudo nano /etc/hosts
# Die Zeilen mit <NEUE_IP> löschen

# Browser-Cache komplett löschen
# Chrome: Cmd+Shift+Delete → Alles löschen

# Testen:
# - https://mc-beta.manualmode.at (Kein SSL-Fehler!)
# - https://mc-app.manualmode.at (Kein SSL-Fehler!)
# - Login, Conversation erstellen, Nachrichten senden
```

---

## ✅ Fertig!

**Deine App läuft jetzt auf dem neuen Server!**

### Nächste Schritte:

1. **24-48 Stunden warten** (sicherstellen dass alles läuft)
2. **Alten Server aufräumen:**
   ```bash
   ssh root@46.224.37.130
   podman pod stop --all
   podman volume rm meaningful-conversations-staging-mariadb-data
   podman volume rm meaningful-conversations-production-mariadb-data
   ```

---

## 🆘 Probleme?

### DNS zeigt noch alte IP
```bash
# Warten (bis zu 30 Min bei manchen Providern)
# Oder DNS-Cache löschen:
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

### Container starten nicht
```bash
ssh root@<NEUE_IP>
podman logs meaningful-conversations-backend-staging
podman logs meaningful-conversations-mariadb-staging
```

### SSL-Zertifikat schlägt fehl
```bash
# DNS muss zuerst richtig sein!
nslookup mc-beta.manualmode.at

# Retry:
certbot --nginx -d mc-beta.manualmode.at --force-renewal
```

### Rollback nötig?
```bash
# DNS einfach zurück auf alte IP ändern:
# Ziel: 46.224.37.130
# Alter Server läuft noch, nichts geht verloren!
```

---

## 📚 Mehr Details

Für ausführliche Erklärungen und Troubleshooting siehe:
- [SERVER-MIGRATION-GUIDE.md](./SERVER-MIGRATION-GUIDE.md) - Komplette Anleitung
- [NGINX-REVERSE-PROXY-SETUP.md](./NGINX-REVERSE-PROXY-SETUP.md) - nginx Konfiguration

---

**Viel Erfolg mit dem Umzug! 🚀**

