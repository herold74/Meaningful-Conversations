# Active Context

## Current Status
**Version:** 1.8.0
**Staging:** ✅ Deployed
**Production:** Pending

## Recent Changes (v1.8.0)

### Content & Terminology Updates
- **Removal of Protected Terms:** Removed references to "Positive Intelligence" (now "Mental Fitness") and "CBT" (now "Structured Reflection").
- **Coach Updates:** Rob and Chloe descriptions updated to reflect new terminology.
- **Newsletter:** Created v1.8.0 newsletter highlighting UX improvements and new personality profiles.

### Capacitor Integration (iOS)
- **Native App Setup:** Initialized Capacitor project for iOS.
- **Plugins:** Installed `@capacitor-community/speech-recognition` and `@capacitor-community/native-audio`.
- **Services:** Implemented `capacitorAudioService.ts` and `capacitorSpeechService.ts` for native capability abstraction.

## Recent Changes (v1.7.9)

### Voice Mode Spinner Consolidation (Build 12-13)
- **Problem:** Doppelte Spinner-Implementierung (kreisförmig + hüpfende Punkte)
- Spinner sprang von Mitte nach unten; war nach zweitem Chat nicht mehr sichtbar
- **Lösung:** Konsolidierung auf einen einzigen Spinner (hüpfende Punkte)
  - Position: Unten bei Play/Repeat Buttons
  - Mikrofon-Button zeigt ausgegraut wenn `isLoading`
  - Text-Label für Spinner hinzugefügt (`chat_generating_response`)
  - `isLoading=true` wird sofort vor `setTimeout` gesetzt
  - TTS-Overlap-Schutz mit `isSpeakingRef`

### iOS Audio Cracking Fix (Build 10)
- **Problem:** Knacken beim Beenden der Audio-Aufnahme auf iOS
- **Ursache:** Base64-kodierte WAV-Datei für Audio-Session-Reset enthielt hörbare Samples
- **Lösung:** Wirklich stille WAV-Datei (16-bit null samples) in `ChatView.tsx`

### Safari PDF Warning (Build 9)
- **Problem:** Safari-Warnung für PDF-Generierung fehlte nach Entfernung der Print-Routine
- **Lösung:** Safari-Warnung in `PersonalityProfileView.tsx` wieder implementiert
- Client-side PDF mit `html2pdf.js` bleibt für alle Browser

### Overwrite Warning Logic (Build 8)
- **Problem:** Überschreib-Warnung erschien zu früh (vor Testauswahl)
- **Lösung:** Warnung von `PersonalityProfileView.tsx` nach `PersonalitySurvey.tsx` verschoben
- Warnung erscheint jetzt nur wenn bereits abgeschlossener Test mit DPFL-Refinements wiederholt wird

### Debug-Logging entfernt (Build 13)
- Alle `[VOICE-DEBUG]` und `[SR-DEBUG]` Logs entfernt
- Code bereit für weitere Android-Tests

## Previous Changes (v1.7.8)

### Spiral Dynamics Fragebogen (Build 32)
- Echter Fragebogen mit 24 Likert-Fragen (3 pro Stufe)
- Kontextualisiert auf "aktuelle Herausforderungen"
- Automatisches Weiter nach Antwort, Zurück-Button
- Berechnung: Durchschnitt pro Stufe → Top 3 dominant, Bottom 3 Wachstum

### Automatische Signatur-Generierung nach Survey
- Signatur wird automatisch nach Survey generiert
- `narrativeProfile` in DPC/DPFL-Prompt integriert

### Persönlichkeitsprofil löschen
- DELETE-Route `/api/personality/profile`
- Bestätigungs-Modal mit Session-Count

### DPFL-Einschränkung für Nobody
- DPFL automatisch zu DPC herabgestuft bei Nobody
- GPS-Framework benötigt keine vollständigen Sessions

### Seasonal Themes
- Automatischer Theme-Wechsel nach meteorologischem Kalender
- Frühling: Fallende Blüten (light mode)
- Sommer: Schmetterlinge (light mode)
- Herbst: Fallende Blätter (beide Modi)
- Winter: Schneeflocken (1. Dez - 6. Jan, dark mode)

### iOS Audio Quality
- iOS bleibt nach Mikrofon-Nutzung in "playAndRecord" Mode
- Fix: Silent Audio nach Mic-Stop spielt
- Server TTS auf iOS deaktiviert → Local Web Speech API

### Nobody Coaching Improvements
- "Respect Competence" Prinzip
- "Move On Signals" Erkennung
- "Topic Pivot" Handling
- "Closure Signals" Erkennung

## Known Issues

### Android Voice Duplication
- **Status:** Unter Beobachtung
- **Symptom:** Spracherkennung zeigt Wörter mehrfach an
- **Hypothesen:** Kumulative Interim-Ergebnisse auf Android
- **Workaround:** KI filtert Duplikate korrekt aus

## Active Tasks
- [ ] Android Voice Duplication weiter beobachten
- [ ] Production Deployment für v1.7.9 planen

## Decision Log
- **2026-01-20:** Debug-Logging entfernt, Build 13 auf Staging
- **2026-01-19:** Spinner auf eine Position konsolidiert (unten)
- **2026-01-18:** iOS Silent WAV für Audio-Session-Reset
- **2026-01-17:** DPFL-Modus für Nobody deaktiviert
- **2026-01-09:** Coaching-Modus zentral im Persönlichkeitsprofil
