# Active Context

## Current Status
**Version:** 1.7.3
**Staging:** Deployed and tested ✓
**Production:** Scheduled for 2. Januar 2026, 06:00 Uhr

## Recent Changes (v1.7.3)

### DPFL Logging Bug Fix
- **Problem:** `encryptionKey` wurde nicht an `SessionReview.tsx` übergeben
- **Auswirkung:** `ComfortCheckModal` wurde nicht angezeigt → keine Authentizitätsabfrage nach DPFL-Sessions
- **Fix:** `SessionReview.tsx` akzeptiert jetzt `encryptionKey` als Prop, `App.tsx` übergibt den Key

### DPFL Datenerhalt bei Profilneuanalyse
- `SessionBehaviorLogs` bleiben erhalten wenn gleicher Test-Typ
- Backend prüft Test-Typ-Wechsel und löscht Logs nur bei Änderung

### Experimentelle Modi für Kenji
- DPC/DPFL auch für Kenji-Stoic verfügbar
- Test-Tube Icon erscheint auch bei Kenji

### User Manual Updates
- Experimentelle Modi dokumentiert (Kapitel 7.5)
- DPFL Datenerhalt dokumentiert (Kapitel 7.4)

## Deployment-Prozess

### Neues Production-Deployment-Script
**`scripts/deploy-production-scheduled.sh`** erstellt mit wichtigem Prinzip:

- **NIEMALS** neu bauen für Production
- **IMMER** die bereits auf Staging getesteten Images verwenden
- Versionierung über Parameter: `./scripts/deploy-production-scheduled.sh 1.7.3`

### Für morgen früh (06:00 Uhr):
```bash
cd /Users/gherold/Meaningful-Conversations-Project
./scripts/deploy-production-scheduled.sh 1.7.3
```

## Active Tasks
- [x] DPFL Logging Bug Fix implementiert
- [x] Experimentelle Modi für Kenji implementiert
- [x] User Manual aktualisiert
- [x] Staging deployed
- [x] Production Deployment Script erstellt
- [ ] Production Deployment (geplant: 2.1.2026, 06:00)

## Decision Log
- **2026-01-01:** Production Deployments verwenden ab jetzt IMMER die bereits gebauten Staging-Images (kein Rebuild). Script `deploy-production-scheduled.sh` erstellt.
