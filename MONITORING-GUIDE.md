# 📊 Monitoring Guide - Meaningful Conversations

Umfassende Anleitung zum Monitoring der Server-Ressourcen und Container-Performance.

---

## 🎯 Quick Start

### Dashboard starten (empfohlen)

```bash
# Auf dem Server (<YOUR_SERVER_IP>)
bash /opt/manualmode-production/scripts/monitor-dashboard.sh

# Oder lokal über SSH
ssh root@<YOUR_SERVER_IP> 'bash /opt/manualmode-production/scripts/monitor-dashboard.sh'
```

Das Dashboard zeigt:
- ✅ **System-Ressourcen**: CPU, RAM, Swap, Disk
- ✅ **Container-Statistiken**: Alle Production & Staging Container
- ✅ **Echtzeit-Alerts**: Warnungen bei hoher Auslastung
- ✅ **Farbcodierung**: Grün (OK), Gelb (Warnung), Rot (Kritisch)
- ✅ **Auto-Refresh**: Aktualisiert sich alle 5 Sekunden

---

## 📋 Verfügbare Tools

### 1. Interactive Dashboard

**Kontinuierliche Anzeige** (aktualisiert alle 5 Sekunden):

```bash
bash scripts/monitor-dashboard.sh
```

**Einmalige Anzeige** (für Snapshots):

```bash
bash scripts/monitor-dashboard.sh --once
```

### 2. Native Podman Stats

**Alle Container anzeigen**:

```bash
podman stats
```

**Spezifische Container**:

```bash
# Production TTS Container
podman stats meaningful-conversations-tts-production

# Alle Production Container
podman stats \
  meaningful-conversations-frontend-production \
  meaningful-conversations-backend-production \
  meaningful-conversations-tts-production \
  meaningful-conversations-mariadb-production
```

### 3. System-Ressourcen prüfen

```bash
# RAM und Swap
free -h

# CPU Load
uptime

# Disk Usage
df -h

# Kombiniert
free -h && echo "---" && uptime && echo "---" && df -h /
```

---

## 🚨 Ressourcen-Limits

### Konfigurierte Limits

#### **Production Environment**

| Service | CPU Limit | CPU Reserved | RAM Limit | RAM Reserved |
|---------|-----------|--------------|-----------|--------------|
| TTS | 1.5 cores | 0.5 cores | 1800M | 512M |
| Backend | 1.0 cores | 0.25 cores | 1500M | 256M |
| Frontend | 0.5 cores | 0.1 cores | 512M | 128M |
| MariaDB | 0.75 cores | 0.25 cores | 1500M | 512M |

#### **Staging Environment**

| Service | CPU Limit | CPU Reserved | RAM Limit | RAM Reserved |
|---------|-----------|--------------|-----------|--------------|
| TTS | 1.0 cores | 0.2 cores | 1000M | 256M |
| Backend | 0.75 cores | 0.15 cores | 1000M | 128M |
| Frontend | 0.25 cores | 0.05 cores | 384M | 64M |
| MariaDB | 0.5 cores | 0.1 cores | 1000M | 256M |

### Limits anpassen

Limits sind definiert in:
- `/opt/manualmode-production/podman-compose-production.yml`
- `/opt/manualmode-staging/podman-compose-staging.yml`

Nach Änderungen Container neu starten:

```bash
cd /opt/manualmode-production
podman-compose down && podman-compose up -d
```

---

## ⚠️ Alert-Schwellenwerte

### Kritische Warnungen (Rot)

| Ressource | Schwellenwert | Aktion |
|-----------|--------------|--------|
| **CPU Load** | >85% | TTS oder andere Services skalieren |
| **RAM Usage** | >85% | Staging stoppen oder Swap prüfen |
| **Disk Space** | >85% | Container-Images und Logs bereinigen |

### Warnungen (Gelb)

| Ressource | Schwellenwert | Aktion |
|-----------|--------------|--------|
| **CPU Load** | >75% | Monitoring intensivieren |
| **RAM Usage** | >75% | Staging-Nutzung prüfen |
| **Swap Usage** | >50% | Performance-Degradation möglich |
| **No Swap** | Kein Swap | Swap aktivieren (siehe unten) |

---

## 🔧 Wartung und Optimierung

### Swap aktivieren (DRINGEND EMPFOHLEN)

```bash
# Auf dem Server als root
sudo bash /opt/manualmode-production/scripts/setup-swap.sh
```

Das Script:
- ✅ Erstellt 4GB Swap-File
- ✅ Aktiviert Swap automatisch
- ✅ Macht Swap persistent (überlebt Reboots)
- ✅ Setzt Swappiness auf 10 (bevorzugt RAM)

### Staging bei Nicht-Nutzung stoppen

```bash
# Staging stoppen (spart ~1.5 GB RAM, 1.5 vCPUs)
cd /opt/manualmode-staging
podman-compose down

# Bei Bedarf wieder starten
podman-compose up -d
```

### Container-Images bereinigen

```bash
# Ungenutzte Images entfernen
podman image prune -af

# Dangling images entfernen
podman image prune -f

# Alle nicht-genutzten Ressourcen
podman system prune -af
```

### Container-Logs rotieren

```bash
# Logs eines Containers anzeigen
podman logs meaningful-conversations-tts-production --tail 100

# Logs bereinigen (Container neu starten)
cd /opt/manualmode-production
podman-compose restart tts
```

---

## 📈 Performance-Monitoring

### TTS-Synthese-Performance

```bash
# Backend-Logs nach TTS-Zeiten durchsuchen
podman logs meaningful-conversations-backend-production 2>&1 | grep -i "tts\|synthesis"

# TTS-Container-Logs
podman logs meaningful-conversations-tts-production --tail 50
```

### Datenbank-Performance

```bash
# MariaDB Queries per Second
podman exec meaningful-conversations-mariadb-production \
  mariadb-admin -u root -p'${DB_ROOT_PASSWORD}' status

# Slow Queries
podman exec meaningful-conversations-mariadb-production \
  mariadb -u root -p'${DB_ROOT_PASSWORD}' -e "SHOW FULL PROCESSLIST;"
```

### Container-Health-Status

```bash
# Production Health
podman ps --filter "name=production" --format "table {{.Names}}\t{{.Status}}\t{{.Health}}"

# Staging Health
podman ps --filter "name=staging" --format "table {{.Names}}\t{{.Status}}\t{{.Health}}"
```

---

## 🔔 Automatisierte Monitoring-Alerts

### Email-Alerts bei hoher Auslastung

Erstellen Sie `/etc/cron.d/mc-monitoring`:

```cron
# Check RAM usage every 5 minutes
*/5 * * * * root bash /opt/manualmode-production/scripts/check-resources.sh
```

**Script erstellen** (`/opt/manualmode-production/scripts/check-resources.sh`):

```bash
#!/bin/bash
# Resource monitoring with email alerts

ALERT_EMAIL="admin@manualmode.at"
HOSTNAME="<YOUR_SERVER_IP>"

# Check RAM usage
MEM_PERCENT=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
if [ "$MEM_PERCENT" -gt 90 ]; then
    echo "High RAM usage on $HOSTNAME: ${MEM_PERCENT}%" | \
    mail -s "Alert: High RAM Usage" "$ALERT_EMAIL"
fi

# Check CPU load
CPU_CORES=$(nproc)
LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
CPU_PERCENT=$(echo "$LOAD * 100 / $CPU_CORES" | bc -l)
if (( $(echo "$CPU_PERCENT >= 90" | bc -l) )); then
    echo "High CPU load on $HOSTNAME: ${CPU_PERCENT}%" | \
    mail -s "Alert: High CPU Load" "$ALERT_EMAIL"
fi

# Check disk space
DISK_PERCENT=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_PERCENT" -gt 85 ]; then
    echo "High disk usage on $HOSTNAME: ${DISK_PERCENT}%" | \
    mail -s "Alert: High Disk Usage" "$ALERT_EMAIL"
fi
```

---

## 🎨 Dashboard-Zugriff

### Option 1: SSH mit Terminal-Forwarding

```bash
# Von Ihrem lokalen Mac
ssh -t root@<YOUR_SERVER_IP> 'bash /opt/manualmode-production/scripts/monitor-dashboard.sh'
```

### Option 2: tmux Session (empfohlen für dauerhaftes Monitoring)

```bash
# Auf dem Server
tmux new-session -s monitoring 'bash /opt/manualmode-production/scripts/monitor-dashboard.sh'

# Detach: Ctrl+B, dann D
# Re-attach: tmux attach -t monitoring
```

### Option 3: Screen Session

```bash
# Auf dem Server
screen -S monitoring bash /opt/manualmode-production/scripts/monitor-dashboard.sh

# Detach: Ctrl+A, dann D
# Re-attach: screen -r monitoring
```

---

## 🆘 Troubleshooting

### Container nutzt zu viel RAM

```bash
# 1. Container-Stats prüfen
podman stats meaningful-conversations-tts-production

# 2. Container neu starten (leert Memory Leaks)
podman restart meaningful-conversations-tts-production

# 3. Logs prüfen
podman logs meaningful-conversations-tts-production --tail 100
```

### System-RAM ist voll

```bash
# 1. Identifizieren Sie den Übeltäter
podman stats --no-stream | sort -k4 -h

# 2. Staging stoppen (falls nicht benötigt)
cd /opt/manualmode-staging && podman-compose down

# 3. System-Cache leeren (vorsichtig!)
sync && echo 3 > /proc/sys/vm/drop_caches
```

### CPU-Load ist hoch

```bash
# 1. Identifizieren Sie CPU-intensive Container
podman stats --no-stream | sort -k3 -h

# 2. TTS-Anfragen prüfen
podman logs meaningful-conversations-tts-production | grep "synthesis_time"

# 3. Backend-Anfragen analysieren
podman logs meaningful-conversations-backend-production | grep -E "POST|GET" | tail -50
```

---

## 📊 Erweiterte Metriken

### Prometheus + Grafana (Optional, für professionelles Monitoring)

Falls Sie in Zukunft ein Web-Dashboard benötigen:

1. **Podman exportiert metrics** via `/metrics` endpoint
2. **Prometheus** sammelt Metriken
3. **Grafana** visualisiert Dashboards

Setup-Guide verfügbar auf Anfrage.

---

## 📞 Support

Bei Fragen oder Problemen:
- **Logs prüfen**: `podman logs <container-name>`
- **Dashboard starten**: `bash scripts/monitor-dashboard.sh`
- **System-Status**: `free -h && uptime && df -h`

**Server-Info:**
- IP: <YOUR_SERVER_IP>
- Hardware: 4 vCPUs, 7.3 GB RAM
- OS: Rocky Linux mit Podman

