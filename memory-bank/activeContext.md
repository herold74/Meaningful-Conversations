# Active Context

## Current Status
**Version:** 1.7.5
**Staging:** Pending deployment
**Production:** v1.7.4 deployed

## Recent Changes (v1.7.5)

### Coaching Mode Vereinfachung
- **Zentrale Modus-Auswahl:** Off/DPC/DPFL wird jetzt im Persönlichkeitsprofil eingestellt
- **Entfernte Komponenten:** ExperimentalModeSelector und ExperimentalModeInfoModal
- **Alle Bots unterstützen DPC/DPFL:** Nicht mehr nur Chloe und Kenji
- **Datenpersistenz:** Beim Modus-Wechsel bleiben alle DPFL-Verfeinerungen erhalten

### Rob Umbenennung
- **Vorher:** `rob-pq` (PQ ist urheberrechtlich geschützt)
- **Nachher:** `rob` - einfach nur "Rob"
- Alle Referenzen in Frontend, Backend und Dokumentation aktualisiert

### Chloe Meditation
- Chloe kann jetzt Meditationen anleiten (wie Rob und Kenji)
- Meditation-Icon erscheint auf Chloe's Bot-Karte
- CBT-fokussierte Meditationsinhalte (Gedankenbeobachtung, Erdung)

### Technische Änderungen
- Neues Feld `coachingMode` in User-Model (Prisma)
- Neue API-Route `PUT /data/user/coaching-mode`
- Frontend verwendet `currentUser.coachingMode` statt separatem State

## Active Tasks
- [x] Coaching Mode UI in PersonalityProfileView
- [x] ExperimentalModeSelector entfernt
- [x] Session-Logik auf coachingMode umgestellt
- [x] Rob-PQ zu Rob umbenannt
- [x] Chloe Meditation hinzugefügt
- [x] Lokalisierung aktualisiert (DE/EN)
- [x] Backend angepasst
- [x] Dokumentation aktualisiert
- [ ] Staging Deployment
- [ ] Production Deployment

## Decision Log
- **2026-01-09:** Coaching-Modus wird zentral im Persönlichkeitsprofil verwaltet, nicht mehr pro Bot. Ermöglicht Nutzung für alle Bots.
- **2026-01-09:** "Rob-PQ" zu "Rob" umbenannt wegen Urheberrecht auf "PQ".
