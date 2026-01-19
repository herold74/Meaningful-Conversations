# Active Context

## Current Status
**Version:** 1.7.8 (Build 32)
**Staging:** Pending
**Production:** Pending

## Recent Changes (v1.7.8)

### Spiral Dynamics Fragebogen umgestellt (Build 32)
- **Problem:** Bisherige SD-Implementierung verwendete Ranking (8 Farben sortieren)
- Das war unrealistisch und für Anwender wenig nachvollziehbar
- **Lösung:** Echter Fragebogen mit 24 Likert-Fragen (3 pro Stufe)
  - Fragen sind kontextualisiert auf "aktuelle Herausforderungen im Leben"
  - Fragen werden gemischt präsentiert (verhindert Mustererkennung)
  - Fortschrittsanzeige mit Prozent
  - Automatisches Weiter nach Antwort
  - Zurück-Button für Korrekturen
- **Berechnung:** Durchschnitt pro Stufe (1-5), dann Ranking
  - Top 3 = dominante Stufen
  - Bottom 3 = Wachstumspotenzial
- Lokalisierung: DE und EN für alle 24 Fragen + UI-Strings

### Automatische Signatur-Generierung nach Survey (Build 28)
- **Problem:** Nach Survey-Abschluss musste User Signatur manuell generieren
- Wenn User "Signatur generieren" klickte, wurde nach den gleichen Stories gefragt, die er gerade eingegeben hatte
- **Lösung:** Signatur wird automatisch nach dem Survey generiert
  - `App.tsx`: `handlePersonalitySurveyComplete()` ruft `api.generateNarrativeProfile()` auf
  - Profil mit Signatur wird direkt gespeichert
  - Neuer Success-Alert informiert über erstellte Signatur
- Neuer Lokalisierungs-Key: `personality_survey_success_with_signature`

### Signatur (narrativeProfile) im DPC/DPFL-Prompt
- **Problem:** AI-generierte Signatur wurde nicht an den Coaching-Bot übergeben
- Enthält wertvolle Informationen: operatingSystem, superpowers, blindspots, growthOpportunities
- **Lösung:** `dynamicPromptController.js` erweitert
  - `analyzeProfile()` extrahiert jetzt auch `narrativeProfile`
  - `generateAdaptivePrompt()` fügt Signatur-Details zum Prompt hinzu
  - Bot erhält: Kern, Stärken mit Beschreibungen, Blindspots mit Beschreibungen, Wachstumschancen
- Logging zeigt Signatur-Status: `✨ Signature: X superpowers, Y blindspots`

### Persönlichkeitsprofil löschen (Build 29)
- **Feature:** User kann jetzt sein Persönlichkeitsprofil vollständig löschen
- **Backend:** Neue DELETE-Route `/api/personality/profile`
  - Löscht: PersonalityProfile, SessionBehaviorLogs, ComfortChecks
  - Setzt `coachingMode` auf 'off'
- **Frontend:** Lösch-Button unten im Profil, subtil platziert
  - Bestätigungs-Modal mit Warnung und Session-Count
  - Loading-State während der Löschung
- Lokalisierung: DE und EN

### Riemann-Dimensionen umbenannt (Build 29)
- "Dauer" → "Beständigkeit" (EN: "Consistency")
- "Wechsel" → "Spontanität" (EN: "Spontaneity")
- Geändert in: Survey-Labels, Dimension-Anzeige, PDF-Export, Stress-Reaktionen, Admin-Tests

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

### Personality Profile UX Fix
- **Problem:** Nach Survey-Abschluss war `coachingMode` standardmäßig 'off'
- User musste separat DPC/DPFL aktivieren, obwohl er schon adaptive/stable gewählt hatte
- **Lösung:** `coachingMode` wird automatisch basierend auf `adaptationMode` gesetzt:
  - `adaptive` → `dpfl` (Profil lernt aus Sessions)
  - `stable` → `dpc` (Profil wird genutzt, aber nicht verändert)
- Success-Alert informiert über aktivierten Modus
- User kann Modus jederzeit im Profil ändern

### DPFL-Einschränkung für Nobody
- **Problem:** Nobody führt keine vollständigen Coaching-Sitzungen durch (GPS-Framework)
- DPFL-Profilverfeinerung erfordert tiefgehende Gesprächsanalyse
- **Lösung:** DPFL automatisch zu DPC herabgestuft bei Nobody
  - `BotSelection.tsx`: Badge zeigt "DPC" statt "DPFL" für Nobody
  - `ChatView.tsx`: `effectiveCoachingMode` verwendet DPC bei Nobody
  - `SessionReview.tsx`: Comfort Check und Refinement Modal übersprungen für Nobody
  - `PersonalityProfileView.tsx`: Hinweis-Text erklärt die Einschränkung
- GPS-Framework bleibt vollständig intakt im Backend

### TTS Spinner Zuverlässigkeit (Local TTS)
- **Problem:** Web Speech API `onstart`/`onend` Events feuern unzuverlässig (bes. Chrome)
- Spinner wurde manchmal nicht angezeigt während der Sprachausgabe
- **Lösung:** Polling-Mechanismus der `speechSynthesis.speaking` alle 50ms prüft
  - Unabhängig von unzuverlässigen Browser-Events
  - Event-Handler bleiben als Backup
  - Polling wird bei TTS-Stop/Cancel bereinigt

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
- **2026-01-17:** DPFL-Modus für Nobody deaktiviert - wird automatisch zu DPC herabgestuft. GPS-Framework benötigt keine vollständigen Coaching-Sitzungen.
- **2026-01-09:** Coaching-Modus wird zentral im Persönlichkeitsprofil verwaltet, nicht mehr pro Bot. Ermöglicht Nutzung für alle Bots.
- **2026-01-09:** "Rob-PQ" zu "Rob" umbenannt wegen Urheberrecht auf "PQ".
