# 🚀 Monitoring Quick Reference

**Schnellzugriff auf alle Monitoring-Befehle**

---

## 📊 Dashboard starten

### Lokal (wenn auf Server eingeloggt)
```bash
bash /opt/manualmode-production/scripts/monitor-dashboard.sh
```

### Remote (von Ihrem Mac)
```bash
# Via Make
make monitor-dashboard-manualmode

# Direkt via SSH
ssh -t root@<YOUR_SERVER_IP> 'bash /opt/manualmode-production/scripts/monitor-dashboard.sh'
```

---

## ⚡ Wichtigste Befehle

### System-Übersicht
```bash
# Alles auf einen Blick
make monitor-system-manualmode

# Einzeln
ssh root@<YOUR_SERVER_IP> 'free -h'        # RAM
ssh root@<YOUR_SERVER_IP> 'uptime'         # CPU Load
ssh root@<YOUR_SERVER_IP> 'df -h /'        # Disk
```

### Container-Stats
```bash
# Make-Befehl
make monitor-stats-manualmode

# Direkt
ssh root@<YOUR_SERVER_IP> 'podman stats --no-stream'

# Live (aktualisiert sich)
ssh root@<YOUR_SERVER_IP> 'podman stats'
```

### Logs prüfen
```bash
# Production Backend
make logs-manualmode-production

# Production TTS (letzte 50 Zeilen)
ssh root@<YOUR_SERVER_IP> 'podman logs meaningful-conversations-tts-production --tail 50'

# Staging Backend
make logs-manualmode-staging
```

---

## 🔧 Wartung

### Swap aktivieren
```bash
make setup-swap-manualmode
```

### Staging stoppen (spart Ressourcen)
```bash
make stop-manualmode-staging
```

### Container neu starten
```bash
# Production
make restart-manualmode-production

# Einzelner Container
ssh root@<YOUR_SERVER_IP> 'podman restart meaningful-conversations-tts-production'
```

### Podman nach Reboot (MC Prod + Staging)

Stacks starten mit **podman-compose** (kein Docker). Skript `scripts/podman-compose-boot.sh` → `/usr/local/bin/`; **systemd** `mc-podman-compose-boot.service` (`After=network-online.target`, `After=podman-boot-all.service`).

```bash
ssh root@<YOUR_SERVER_IP> 'systemctl status mc-podman-compose-boot.service'
ssh root@<YOUR_SERVER_IP> '/usr/local/bin/podman-compose-boot.sh'   # manuell
```

Log: `/var/log/podman-compose-boot.log`

Legacy `meaningful-conversations-{staging,production}.service` wurden **2026-09-27** vom Server entfernt (nur noch Boot + Watchdog); siehe `scripts/legacy-systemd-units.md`.

Optional statt `@reboot`-Cron: `scripts/mc-podman-compose-boot.service` (`After=network-online.target`).

### Geplantes Wartungsfenster (In-App-Banner)

Reboot oder erwartete Nicht-Verfügbarkeit mindestens **48 h** vorher ankündigen (besser 72 h). Bevorzugtes Fenster: **So–Do, 02:00–05:00 Europe/Vienna** — nicht Montag 08:00 (Production-Deploy).

1. Admin → Abschnitt **Wartung** (über den Tabs): Beginn, Ende, „Ankündigen ab“ (Button **Jetzt ankündigen** setzt den Zeitpunkt auf jetzt), Titel und Text DE + EN.
2. Banner erscheint für **eingeloggte Nutzer und Gäste**, sobald `announceAt` erreicht ist — nicht auf Login/Registrierung.
3. Vorankündigung kann pro Browser weggeklickt werden (`localStorage`, an die Fenster-ID gebunden). Während das Fenster läuft, bleibt der Banner sichtbar.
4. Nach Ende oder **Archivieren** verschwindet er. Ein neues Fenster hat eine neue ID und wird wieder angezeigt.

Öffentlicher Endpoint: `GET /api/maintenance/current` (ohne Auth).

### Images aufräumen
Behält **laufende Container** plus die **2 neuesten** Images je Repository, das von einem laufenden Container genutzt wird. Cron täglich **05:45** (`CRON_TZ=Europe/Vienna`), Log `/var/log/podman-image-cleanup.log`.

```bash
ssh root@<YOUR_SERVER_IP> '/usr/local/bin/podman-image-cleanup.sh --dry-run'
ssh root@<YOUR_SERVER_IP> '/usr/local/bin/podman-image-cleanup.sh'
# Skript im Repo: scripts/podman-image-cleanup.sh
```

---

## 📧 Server-Ops E-Mail-Report

Automatischer Check (Backups, Health, Container, Disk, Security-Patches) — Mail **nur bei WARN/FAIL**, plus **Montag 07:45** kurze OK-Zusammenfassung (Europe/Vienna, vor Production-Deploy).

```bash
# Auf dem Server (manuell)
/usr/local/bin/server-ops-report.sh --dry-run
/usr/local/bin/server-ops-report.sh --test-mail   # Betreff: MC ops report test

# Empfänger (nur auf Server, nicht im Repo)
# /root/.mc-ops-report.env → MC_OPS_REPORT_EMAIL=support@manualmode.at
# Vorlage: scripts/mc-ops-report.env.example
```

Log: `/var/log/mc-ops-report.log` · Cron: root — **`CRON_TZ=Europe/Vienna` ganz oben**; Ops-Report nur Script aufrufen (`log_line` schreibt selbst, kein `>>`).

### Root-Cron (alle Zeiten Europe/Vienna)

| Zeit | Mo–So | Job | Befehl / Log |
|------|-------|-----|----------------|
| **05:45** | täglich | Podman-Image-Cleanup | `/usr/local/bin/podman-image-cleanup.sh` → `/var/log/podman-image-cleanup.log` |
| **06:00** | täglich | DB-Backup | `backup-databases.sh` → `/var/log/meaningful-conversations-backup.log` |
| **07:00** | Mo | Schema-Drift | `/usr/local/bin/check-schema-drift.sh` → `/var/log/schema-drift.log` |
| **07:15** | Mo | DNF/Update-Check | `scripts/check-updates.sh` → `/var/log/update-check.log` |
| **07:30** | täglich | Ops-Report | `/usr/local/bin/server-ops-report.sh` (strukturierte Mail: Gesamtstatus / HANDLUNG / KURZÜBERSICHT) |
| **07:45** | Mo | Ops Wochen-OK-Mail | `server-ops-report.sh --weekly-summary` |
| **08:30** | Mo | Production-Pull | `/root/deploy-mc-production.sh` → `/tmp/mc-deploy-production.log` |

Montag-Reihenfolge: Backup (06:00) → Schema → Updates → Ops → Weekly-Mail → **Puffer** → Prod-Pull **08:30** (kein Overlap mit Backup). Siehe Project-Doc `server-cron-schedule-proposal.md` §5.

Ops-Report: **live** Kernel/`needs-restarting`; kein veralteter Kernel-Tail aus `update-check.log`.

**Versand (Production):** `msmtp` mit Mailjet-Relay — gleicher Dienst wie `mailService.js` (`MAILJET_*` in `/opt/manualmode-production/.env`). Kein lokales Postfix-Routing nötig.

```bash
# Auf dem Server (root): msmtp + /etc/msmtprc (chmod 600), Werte aus Production-.env
# Host in-v3.mailjet.com, Port 587, STARTTLS, user=MAILJET_API_KEY, pass=MAILJET_SECRET_KEY,
# from=MAILJET_SENDER_EMAIL, account default.
dnf install -y msmtp   # AlmaLinux/RHEL; Debian: apt install msmtp

/usr/local/bin/server-ops-report.sh --test-mail   # SMTP 250 = OK
tail /var/log/msmtp.log                           # keine Secrets in Tickets/Chats loggen
```

Alte Postfix-Testqueues (z. B. Timeout zu mx04.secure-mailgate.com) optional leeren: `postsuper -d ALL`.

---

## 🚨 Bei Problemen

### CPU-Last hoch
```bash
# Identifizieren Sie den Übeltäter
ssh root@<YOUR_SERVER_IP> 'podman stats --no-stream | sort -k3 -rh | head -5'
```

### RAM voll
```bash
# Staging stoppen
make stop-manualmode-staging

# Container neu starten (leert Memory)
ssh root@<YOUR_SERVER_IP> 'podman restart meaningful-conversations-tts-production'
```

### Container läuft nicht
```bash
# Status prüfen
make status-manualmode-production

# Logs ansehen
make logs-manualmode-production

# Container neu starten
make restart-manualmode-production
```

---

## 📱 Favoriten für die tägliche Nutzung

```bash
# 1. Dashboard starten (empfohlen)
make monitor-dashboard-manualmode

# 2. Schneller System-Check
make monitor-system-manualmode

# 3. Container-Status
make status-manualmode-production

# 4. Logs (wenn etwas nicht funktioniert)
make logs-manualmode-production
```

---

## 🎨 Farbcodes im Dashboard

- **Grün**: Alles OK (<75%)
- **Gelb**: Warnung (75-90%)
- **Rot**: Kritisch (>90%)

---

Vollständige Dokumentation: [MONITORING-GUIDE.md](../MONITORING-GUIDE.md)

