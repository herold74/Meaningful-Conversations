# Active Context

## Current Status
**Version:** 1.7.8 (Build 13)
**Staging:** Deployed ✅
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
- Added "Closure Signals" detection - recognize gratitude, self-sufficiency, plan confirmation
- Don't drill into implementation details after user confirms a plan
- Reduced speech rate from 1.1 to 1.0

### Bot Descriptions (Synced)
- **Nobody:** "Ein effizienter Manager, der Ihnen hilft..."
- **Max:** "Ein inspirierender Coach, der Ihnen hilft..."

### iOS Voice Selection UI
- Server voices show "(Not available on iOS)" with info tooltip
- Auto-switches to local voice if server voice was selected
- Hint text on separate line for small screens

### OCEAN Naming Consistency
- Renamed "Big5" profile references to "OCEAN" throughout the app
- Added OCEAN acronym explanation in user guide
- Note: "Big 5 Analyse" (Dr. Bohne's 5 blockages) remains unchanged

### Seasonal Themes
- Automatic theme switching based on meteorological calendar
- Spring (Mar-May): Summer theme + falling blossoms (light mode only)
- Summer (Jun-Aug): Summer theme + butterflies (light mode only)
- Autumn (Sep-Nov): Autumn theme + falling leaves (both modes)
- Winter (Dec-Feb): Winter theme + snowflakes (Dec 1 - Jan 6, dark mode only)

### Deploy Process Fix (IMPORTANT!)
- VERSION now comes **ONLY** from `package.json`
- Removed VERSION from `.env.staging` and `.env.production`
- Deploy script explicitly sets VERSION on server after .env transfer
- This prevents "Version latest" display bug permanently

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
