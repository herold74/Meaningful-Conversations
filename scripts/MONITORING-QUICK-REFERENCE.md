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
ssh -t root@91.99.193.87 'bash /opt/manualmode-production/scripts/monitor-dashboard.sh'
```

---

## ⚡ Wichtigste Befehle

### System-Übersicht
```bash
# Alles auf einen Blick
make monitor-system-manualmode

# Einzeln
ssh root@91.99.193.87 'free -h'        # RAM
ssh root@91.99.193.87 'uptime'         # CPU Load
ssh root@91.99.193.87 'df -h /'        # Disk
```

### Container-Stats
```bash
# Make-Befehl
make monitor-stats-manualmode

# Direkt
ssh root@91.99.193.87 'podman stats --no-stream'

# Live (aktualisiert sich)
ssh root@91.99.193.87 'podman stats'
```

### Logs prüfen
```bash
# Production Backend
make logs-manualmode-production

# Production TTS (letzte 50 Zeilen)
ssh root@91.99.193.87 'podman logs meaningful-conversations-tts-production --tail 50'

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
ssh root@91.99.193.87 'podman restart meaningful-conversations-tts-production'
```

### Images aufräumen
```bash
ssh root@91.99.193.87 'podman image prune -f'
```

---

## 🚨 Bei Problemen

### CPU-Last hoch
```bash
# Identifizieren Sie den Übeltäter
ssh root@91.99.193.87 'podman stats --no-stream | sort -k3 -rh | head -5'
```

### RAM voll
```bash
# Staging stoppen
make stop-manualmode-staging

# Container neu starten (leert Memory)
ssh root@91.99.193.87 'podman restart meaningful-conversations-tts-production'
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

