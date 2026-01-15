# Active Context

## Current Status
**Version:** 1.7.8 (Build 5)
**Staging:** Deployed
**Production:** Pending

## Recent Changes (v1.7.8)

### iOS Audio Quality Fix
- After microphone use, iOS stays in "playAndRecord" mode causing degraded TTS quality
- Fix: Play HTML5 audio element immediately after mic stops to force iOS back to stereo mode
- Server TTS disabled on iOS due to autoplay restrictions - uses local Web Speech API

### Nobody Coaching Improvements
- Added "Respect Competence" principle - don't drill down when user knows what to do
- Added "Move On Signals" detection (frustration/competence signals)
- Added "Topic Pivot" handling - fully commit to new topic when user reprioritizes
- Reduced speech rate from 1.1 to 1.0

### iOS Voice Selection UI
- Server voices show "(Not available on iOS)" with info tooltip
- Auto-switches to local voice if server voice was selected
- Hint text on separate line for small screens

### Deploy Script Fix
- VERSION no longer imported from .env files - always from package.json
- Fixed "1.7.8 latest" display bug

## Previous Changes (v1.7.5)

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
