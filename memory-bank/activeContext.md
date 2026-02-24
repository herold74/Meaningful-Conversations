# Active Context

## Current Status
**Version:** 1.9.6+ (feature/visual-redesign)
**Staging:** Pending (feature branch not yet merged)
**Production:** Pending

**Workspace Setup (2026-02):**
- **Main project:** `/Users/gherold/Meaningful-Conversations-Project` — Branch: `feature/visual-redesign`
- **Main worktree:** `/Users/gherold/MC-main` — Branch: `main` (fuer iOS-Fixes, parallel)

## Recent Changes — Visual Redesign & Brand System (feature/visual-redesign)

### Phase 1: Design Foundation
- **Inter Font:** Self-hosted Inter Variable (normal + italic), `public/fonts/`, primary sans in Tailwind
- **W4F Color Palette:** 4 blue shades (#89C4E1, #6A9DBF, #4A7A9B, #1B3A5C) + Amber accent (#F59E0B)
- **Semantic CSS Variables:** `--accent-primary`, `--bg-primary`, `--content-primary`, etc. in `index.css`
- **Tailwind Tokens:** `w4f.*`, `background.*`, `content.*`, `accent.*`, `status.*`, `border.*`

### Phase 2: Shared Component Library
- **New components in `components/shared/`:** Card, SectionHeader, Badge, Avatar, Skeleton, InputField, ModalOverlay, PageTransition (framer-motion)
- **Barrel export:** `components/shared/index.ts`

### Phase 3: View Modernization
- All 30+ views updated: rounded-card containers, shadow-card-elevated, framer-motion entrance animations, pill-style language buttons, semantic status colors
- `animate-fadeIn` removed in favor of framer-motion `PageTransition`

### Phase 4: Brand-Driven Design System
- **`config/brand.ts`:** Extended with `color1`-`color4`, `accent`, `loader` (env-var-driven, W4F defaults)
- **`vite-plugin-brand.ts`:** Injects `--brand-color-1` to `--brand-color-4` and `--brand-accent` as CSS custom properties on `:root`
- **`index.css`:** All themes (winter/summer/autumn, light/dark) refactored to use `var(--brand-color-N)` references
- **`tailwind.config.js`:** `w4f.*` tokens now reference CSS custom properties (brand-driven)
- **BrandLoader System:** 4 loader variants (`tetris`, `steering-wheel`, `dots`, `pulse`) selectable via `VITE_BRAND_LOADER`. `BrandLoader` wrapper component, all 14 TetrisLoader usages migrated.
- **Backend `brand.js`:** primaryColor defaults updated to W4F palette
- **`WHITE-LABEL-GUIDE.md`:** Fully updated with new color env vars, loader selection, example colleague config

### iOS In-App Purchase Improvements (committed to main)
- Backend Receipt Verification Fix, Frontend Fallback, NativePaywall improvements
- Commit `8750b9b` auf main

### Gloria Interview Bot (New Feature)
- **New Bot:** `gloria-interview` — a professional interviewer for structured topic interviews (ideas, projects, workflows, concepts, strategies, decisions). Access tier: `registered`.
- **Rename:** `g-interviewer` renamed to `gloria-life-context` across entire codebase to prevent confusion between the two Gloria variants.
- **System Prompt:** EN/DE dual prompt. Asks for topic, duration, and special requests/perspectives (one per message). Confirms assignment in first person before starting. No coaching, no prompt disclosure, adjustable parameters (pace, answer length, question count).
- **Interview Transcript View:** New `InterviewTranscriptView` component with 3 sections: Summary (collapsible), Interview Setup (collapsible), Smoothed Interview. All rendered as Markdown. Export as `.md` (individual sections or complete).
- **Backend Endpoint:** `POST /api/gemini/interview/transcript` — AI generates summary + setup extraction + grammatically corrected transcript. Labels: "Interviewer:" and user's first name (fallback: "Befragter"/"Interviewee").
- **Bot Selection Layout:** Gloria Interview placed in "Management & Communication" section next to Nobody. No coaching badge (DPFL/DPC) shown for this bot.
- **Transcript Evaluation:** Redesigned as slim inline option (not a bot tile). Larger font for better visibility. "Ausgangslage"/"Starting Point" replaces "Vorreflexion"/"Pre-Reflection".
- **Gender Mapping:** `gloria-interview` added to all female bot lists in ChatView.tsx (4 locations).
- **Documentation:** USER-ACCESS-MATRIX.md updated with Gloria Interview under registered tier.

## Recent Changes (v1.8.4)

### User Access & Roles
- **User Access Matrix Enforcement:** Audited and enforced access restrictions for all user tiers (Guest, Registered, Premium, Client, Admin, Developer) across frontend and backend.
- **isDeveloper Role:** New role separating Developer from Admin. Test Runner restricted to Developers. Existing admins promoted to Developer.
- **isBetaTester → isPremium Rename:** Semantic clarification across entire codebase (DB schema, backend, frontend, types, i18n).
- **Crisis Response Protocol:** Ensured all bots include helpline/crisis response in system prompts for all user types.
- **Redeem Code Logic Fixes:** Fixed premium auto-revocation, client lockout, and ACCESS_PASS revocation bugs.

### Deployment & Infrastructure
- **Reproducible Docker Builds:** Switched Dockerfiles from `npm install` to `npm ci` for strict lockfile adherence.
- **Deploy Health Checks:** Enhanced post-deploy verification with 3 retries and hard failure exit.
- **express-rate-limit Fix:** Fixed IPv6 validation crash (`ERR_ERL_KEY_GEN_IPV6`) in `geminiLimiter` rate limiter.

### UI & UX
- **Spacer Height Fix:** Removed unreachable dead code in GamificationBar spacer calculation.
- **i18n Developer Role:** Added missing locale keys for Developer badge and toggle.
- **Test XP Pollution Fix:** Cleared gamification state on all test mode exit paths.
- **GamificationBar Modal Hide:** Bar hidden when any modal is open.

## Recent Changes (v1.8.2)

### Platform Enhancements
- **Responsive Admin UI:** Optimized the Admin Panel for mobile devices.
- **Comprehensive Test Suite:** Added extensive tests for critical application paths.
- **GDPR Compliance:** Removed encrypted transcript storage to minimize data retention and enhance privacy.
- **Keyword Ambiguity Fixes:** Refined DPFL keyword detection to reduce false positives.

## Recent Changes (v1.8.1)

### Adaptive Intelligence
- **Adaptive Keyword Weighting:** Enhanced DPFL logic to better recognize and weight user patterns.
- **Cumulative Telemetry:** Implemented tracking across all frameworks for deeper coaching insights.
- **Prompt Fixes:** Minor adjustments to system prompts for better consistency.

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
- [x] **Visual Redesign Phase 1-4:** Abgeschlossen auf `feature/visual-redesign`
- [ ] **Phase 3.5: OCEAN-Onboarding:** Registrierte User Frage-fuer-Frage durch OCEAN-Fragebogen (mit Skip)
- [ ] **Merge:** `feature/visual-redesign` nach `main` mergen (nach iOS-Fix-Abschluss)
- [x] **iOS In-App Purchase:** Backend + Frontend implementiert (main); Sandbox-Tests ausstehend

## Decision Log
- **2026-02-11:** Dockerfiles auf `npm ci` umgestellt nach express-rate-limit Crash auf Staging
- **2026-02-11:** Deploy-Script Health-Checks mit Retry-Logik und hartem Fehler-Exit
- **2026-02-11:** isDeveloper Role eingefuehrt, isBetaTester → isPremium Rename
- **2026-02-11:** User Access Matrix vollstaendig auditiert und durchgesetzt
- **2026-01-20:** Debug-Logging entfernt, Build 13 auf Staging
- **2026-01-19:** Spinner auf eine Position konsolidiert (unten)
- **2026-01-18:** iOS Silent WAV fuer Audio-Session-Reset
- **2026-01-17:** DPFL-Modus fuer Nobody deaktiviert
- **2026-01-09:** Coaching-Modus zentral im Persoenlichkeitsprofil
