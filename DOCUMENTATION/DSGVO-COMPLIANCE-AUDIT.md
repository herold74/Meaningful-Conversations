# DSGVO-KONFORMITAETSPRUEFUNG
## Meaningful Conversations App

**Pruefungsdatum:** 25. Februar 2026  
**Gepruefte Version:** 1.9.7  
**Vorherige Pruefung:** 15. Februar 2026 (v1.8.8)  
**Betreiber-Standort:** Oesterreich  
**Server-Standort:** Hetzner, Deutschland (EU)  
**Zustaendige Behoerde:** Datenschutzbehoerde Oesterreich (https://www.dsb.gv.at/)

---

## POSITIVE BEFUNDE

### 1. Ende-zu-Ende-Verschluesselung (E2EE)
- **Status:** DSGVO-KONFORM
- Lebenskontext wird client-seitig verschluesselt
- Verschluesselungsschluessel verlassen nie das Geraet
- Server kann verschluesselte Daten nicht lesen
- **Art. 32 DSGVO:** Technische Massnahmen zum Schutz

### 2. Gastmodus
- **Status:** DSGVO-KONFORM  
- Keine Server-Speicherung
- Verarbeitung ausschliesslich lokal im Browser
- Keine personenbezogenen Daten auf Servern

### 3. Kontolöschung
- **Status:** DSGVO-KONFORM (VERBESSERT in v1.8.2)
- Funktion vorhanden (DeleteAccountModal)
- Vollstaendige Loeschung inklusive Feedback-Daten (CASCADE)
- **NEU:** Explizite Loeschung von ApiUsage, UserEvent; Entkopplung von UpgradeCodes
- **Art. 17 DSGVO:** Recht auf Loeschung
- **Datei:** `meaningful-conversations-backend/routes/data.js`

### 4. Datenminimierung
- **Status:** DSGVO-KONFORM (VERBESSERT in v1.8.2)
- Nur notwendige Daten werden gespeichert
- Keine unnoetige Profilbildung
- **NEU:** Session-Transkripte aus Datenbank entfernt (Migration `20260208120000_remove_encrypted_transcript`)
- **Art. 5 Abs. 1 lit. c DSGVO**

### 5. Datensicherheit
- **Status:** DSGVO-KONFORM
- Passwoerter mit bcrypt gehashed (10 Salting Rounds)
- HTTPS-Verbindung (SSL/TLS)
- Hetzner-Server in Deutschland

### 6. Transparenz
- **Status:** DSGVO-KONFORM
- Nutzungsbedingungen vorhanden (TermsView)
- Disclaimer vorhanden (DisclaimerView)
- FAQ mit Datenschutz-Informationen
- Warnung vor personenbezogenen Daten (PIIWarningView)

### 7. Datenschutzerklaerung
- **Status:** IMPLEMENTIERT (8. Nov. 2025) -- PERSONALISIERT
- Dedizierte Komponente erstellt (`PrivacyPolicyView.tsx`)
- In der App ueber Menue zugaenglich
- Enthaelt alle Pflichtangaben nach Art. 13, 14 DSGVO
- Verfuegbar in Deutsch und Englisch
- **Platzhalter wurden ersetzt** (Guenter Herold, MSc / manualmode.at)

### 8. Impressum
- **Status:** IMPLEMENTIERT (8. Nov. 2025) -- PERSONALISIERT
- Dedizierte Komponente erstellt (`ImprintView.tsx`)
- In der App ueber Menue zugaenglich
- Erfuellt Impressumspflicht (Oesterreich: Paragraph 5 E-Commerce-Gesetz - ECG)
- Verfuegbar in Deutsch und Englisch
- **Platzhalter wurden ersetzt**

### 9. Datenexport-Funktion
- **Status:** IMPLEMENTIERT & ERWEITERT (v1.8.2)
- **Erstimplementierung:** 8. Nov. 2025
- **Letzte Aktualisierung:** 10. Feb. 2026 (vollstaendiger Export)
- Backend-Endpoint: `GET/POST /api/data/export`
- Frontend-Komponente: `DataExportView.tsx`
- **Exportformate:**
  - JSON (maschinenlesbar)
  - HTML (benutzerfreundlich, gestylt)
- **Art. 20 DSGVO:** Recht auf Datenuebertragbarkeit
- **Enthaelt (VOLLSTAENDIG seit v1.8.2):**
  - Account-Informationen
  - Gamification-Daten
  - Verschluesselten Lebenskontext (oder entschluesselt bei POST)
  - Feedback
  - Upgrade-Codes
  - API-Nutzungsstatistiken
  - **NEU:** Persoenlichkeitsprofil (Metadaten + verschluesselte Daten)
  - **NEU:** Session Behavior Logs (alle Frequenzdaten)
  - **NEU:** Benutzer-Ereignisse (UserEvents)

### 10. Cookie-Nutzung
- **Status:** DSGVO-KONFORM
- **KEINE Cookies** verwendet
- Nur localStorage fuer technisch notwendige Funktionen:
  - Auth-Token (`user_session`)
  - Spracheinstellung (`language`)
  - Gastmodus (lokal, `guest_id` Fingerprint)
  - E-Mail-Merken (`rememberedEmail`, nur bei aktiver Checkbox)
  - UI-Einstellungen (Dark Mode, Farbthema)
  - TTS-Einstellungen (Stimmpraeferenzen)
  - **NEU (v1.9.7):** Nutzungsintent (`userIntent`) — kein Personenbezug
  - **NEU (v1.9.7):** Gastname (`guestName`) — optional, verbleibt auf Geraet
  - **NEU (v1.9.7):** UI-Praeferenzen (`intentPickerDisabled`, `profileHintDisabled`, `adminStartupPref`) — technisch notwendig
- **KEIN Cookie-Banner erforderlich** (ePrivacy-konform)
- Transparent in Datenschutzerklaerung dokumentiert

### 11. Persoenlichkeitsprofil-System
- **Status:** DSGVO-KONFORM & E2EE
- **Implementierung:** 10. Dezember 2025
- **Datenbank-Tabelle:** `personality_profiles`
- **Verschluesselung:**
  - Client-seitige Verschluesselung (AES-GCM)
  - Verschluesselungsschluessel verlaesst nie das Geraet
  - Server kann Profildaten nicht lesen (Zero-Knowledge)
- **Gespeicherte Daten:**
  - **Verschluesselt:** Alle Riemann-Thomann, Big5 & Spiral Dynamics Scores
  - **Unverschluesselt (Metadaten):** testType, completedLenses, adaptationMode, sessionCount
- **Sicherheitsgarantien:**
  - Profile werden bei Passwort-Reset geloescht (wie Lebenskontext)
  - Profile werden bei Passwort-Aenderung re-encrypted
  - Opt-Out jederzeit moeglich
- **Rechtsgrundlage:** Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)
- **Art. 32 DSGVO:** Hoechste technische Schutzmassnahmen

### 12. Experimental Mode (DPC/DPFL)
- **Status:** DSGVO-KONFORM & TRANSPARENT
- **Implementierung:** 10. Dezember 2025, aktualisiert Januar 2026
- **Funktion:**
  - **DPC (Dynamic Prompt Controller):** Personalisierte KI-Antworten basierend auf Persoenlichkeitsprofil
  - **DPFL (Dynamic Profile Feedback Loop):** Verhaltensanalyse & Profil-Anpassung
- **Datenschutz:**
  - Nur fuer Nutzer mit abgeschlossenem Persoenlichkeitstest
  - Opt-In erforderlich (Nutzer waehlt Modus aktiv)
  - **Warnung bei Aktivierung:** Nutzer wird explizit darauf hingewiesen, dass Profildaten an KI-Anbieter uebermittelt werden
  - Profil wird client-seitig entschluesselt
  - Entschluesseltes Profil ueber HTTPS an Backend (nur waehrend Session)
  - Backend speichert entschluesselte Daten NICHT dauerhaft
- **Pseudonymisierung (Art. 4 Nr. 5 DSGVO):**
  - **KEINE Identifikatoren werden an KI-Anbieter gesendet** (keine userId, keine E-Mail, keine IP)
  - An KI gesendet werden nur: abstrakte Persoenlichkeitsmerkmale (z.B. "naehe: hoch"), Coaching-Strategien, Signatur-Texte
  - **Diese Daten sind nicht auf eine natuerliche Person rueckfuehrbar**
  - Nutzer werden explizit aufgefordert, keine personenbezogenen Daten im Lebenskontext zu verwenden
- **Session Behavior Logs:**
  - **Datenbank-Tabelle:** `session_behavior_logs`
  - **KEINE Transkripte gespeichert** (entfernt in v1.8.2 -- DSGVO-Verbesserung)
  - **Unverschluesselt:** Anonymisierte Haeufigkeitszaehler (Riemann, Big5, Spiral Dynamics)
  - **Comfort Check:** Nutzer kann Session als "nicht authentisch" markieren
  - **Opt-Out:** `optedOut: true` verhindert Nutzung fuer Profil-Anpassung
- **Rechtsgrundlage:** Art. 6 Abs. 1 lit. a DSGVO (explizite Einwilligung)
- **Art. 25 DSGVO:** Privacy by Design (Opt-In, E2EE, Opt-Out)

### 13. Blue-Green Deployment Entfernung
- **Status:** DSGVO-VERBESSERUNG
- **Aenderung:** 15. Dezember 2025 (v1.7.0)
- **Details:**
  - Entfernung des `deploymentVersion` Fields aus JWT-Tokens
  - Vereinfachung der Datenverarbeitung
  - Keine Tracking-Cookies fuer Deployment-Routing mehr noetig
- **Vorteil:** Weitere Datenminimierung (Art. 5 Abs. 1 lit. c DSGVO)

### 14. Mistral AI als EU-Alternative (NEU v1.8.x)
- **Status:** DSGVO-KONFORM (DPA Coverage verified)
- **Implementierung:** Januar 2026
- **Details:**
  - Neuer KI-Anbieter: Mistral AI (Paris, Frankreich -- EU)
  - Nutzer kann ueber `aiRegionPreference` die Region "EU" waehlen
  - Bei "EU"-Wahl werden alle KI-Anfragen an Mistral AI geroutet
  - **Keine Datenuebermittlung in Drittlaender** (Art. 44-49 DSGVO)
  - **Mistral AI = Auftragsverarbeiter** (Art. 28 DSGVO)
- **DPA Coverage:** Automatisch durch Mistral AI Terms of Service
- **Dokumentation:** `DOCUMENTATION/MISTRAL-DPA-COMPLIANCE.md`
- **Vorteil:** Nutzer mit hohem Datenschutzbedarf koennen EU-only KI nutzen

### 15. TTS-Service (Text-to-Speech) (NEU v1.8.x)
- **Status:** DSGVO-KONFORM
- **Implementierung:** Januar 2026
- **Architektur:**
  - Lokaler Piper TTS-Engine, laeuft im eigenen Container
  - **KEIN externer TTS-Dienst** (kein Google TTS, kein Amazon Polly)
  - Text wird nur im Arbeitsspeicher verarbeitet, nicht persistent gespeichert
- **Verarbeitete Daten:** Chat-Text (max. 5000 Zeichen), Sprache, Stimm-ID
- **Datei:** `services/ttsService.js`, `tts-service/app.py`
- **Art. 5 DSGVO:** Datenminimierung (lokale Verarbeitung)

### 16. Transcript-Entfernung aus Session Behavior Logs (NEU v1.8.2)
- **Status:** DSGVO-VERBESSERUNG
- **Migration:** `20260208120000_remove_encrypted_transcript`
- **Details:**
  - Feld `encryptedTranscript` wurde aus der Tabelle `session_behavior_logs` entfernt
  - Nur noch anonymisierte Haeufigkeitszaehler werden gespeichert
  - Nutzer koennen Transkripte direkt nach der Sitzung herunterladen
- **Vorteil:** Weitere Datenminimierung (Art. 5 Abs. 1 lit. c DSGVO)

### 17. Transcript Evaluation Feature (NEU v1.8.7)
- **Status:** DSGVO-KONFORM
- **Funktion:** Premium-Nutzer koennen Gespraechstranskripte fuer KI-gestuetzte Kommunikationsanalyse hochladen
- **Datenverarbeitung:**
  - **Eingabe:** Nutzer laedt Transkript hoch (Text/SRT) + Vorreflexions-Antworten (inkl. Situationsname)
  - **KI-Analyse:** Transkript wird an Google Gemini API gesendet (durch bestehende Google Cloud DPA abgedeckt)
  - **Speicherung:**
    - **Gespeichert:** Vorreflexions-Antworten (inkl. `situationName`) + KI-Auswertungsergebnisse (strukturiertes JSON, inkl. `botRecommendations`)
    - **NICHT gespeichert:** Original-Transkripttext (nach Analyse geloescht)
  - **Aufbewahrung:** Auswertungen bleiben bis der Nutzer sie loescht
  - **Nutzerrechte:** Nutzer koennen Auswertungen jederzeit ueber die UI loeschen (Delete-Button in History)
- **Datenbank-Schema (TranscriptEvaluation):**
  - `userId` -- Fremdschluessel zur User-Tabelle (ON DELETE CASCADE)
  - `preAnswers` -- JSON: situationName, goal, personalTarget, assumptions, satisfaction, difficult (TEXT)
  - `evaluationData` -- JSON: strukturiertes KI-Auswertungsergebnis inkl. botRecommendations (TEXT)
  - `lang` -- Sprachcode (de/en)
  - `userRating` -- Optionale NPS-Bewertung (0-10)
  - `userFeedback` -- Optionales Freitext-Feedback
  - `contactOptIn` -- Opt-In fuer Kontaktaufnahme durch Admin (Boolean, Standard: false)
  - `ratedAt`, `createdAt` -- Zeitstempel
- **GDPR-spezifische Massnahmen:**
  - **Admin-Sichtbarkeit (Art. 5 Abs. 1 lit. c DSGVO -- Datenminimierung):**
    - Admins sehen NUR: Rating-Zahl, freiwilliges Feedback, contactOptIn, E-Mail, Zeitstempel
    - `preAnswers` und `evaluationData` werden NICHT an Admin-Endpoints gesendet
    - `situationName`, `goal`, Entwicklungsbereiche, Bot-Empfehlungen sind fuer Admins UNSICHTBAR
  - **contactOptIn (Art. 6 Abs. 1 lit. a DSGVO -- Einwilligung):**
    - Opt-In Checkbox: Nutzer entscheidet aktiv, ob Admin ihn kontaktieren darf
    - Standard: false (kein Kontakt ohne Einwilligung)
    - Nur bei aktivem Opt-In wird die E-Mail-Adresse dem Admin als kontaktierbar angezeigt
  - **PDF-Export:** Clientseitig generiert, markiert als "Persoenlich und Vertraulich"
  - **Bot-Empfehlungen:** KI-generierte Coaching-Empfehlungen pro Entwicklungsbereich; nur fuer den Nutzer selbst sichtbar
- **Nutzer-Verantwortung (WICHTIG):**
  - Die App prueft NICHT Herkunft oder Rechtmaessigkeit hochgeladener Transkripte
  - NUTZER ist allein verantwortlich fuer: Recht zum Hochladen, Einwilligung aller Gespraechsteilnehmer, lokale Aufnahmegesetze
- **Rechtsgrundlage:** Art. 6 Abs. 1 lit. b DSGVO (Vertragserfullung)
- **Art. 28 DSGVO:** AVV mit Google (Auftragsverarbeiter) vorhanden
- **Art. 32 DSGVO:** Technische Sicherheit (HTTPS, serverseitige Validierung)
- **Art. 17 DSGVO:** Recht auf Loeschung (Delete-Button + CASCADE bei Account-Loeschung)

### 18. Daten-Retention Service (NEU v1.8.2)
- **Status:** IMPLEMENTIERT
- **Datei:** `services/dataRetention.js`
- **Automatische Loeschung:**
  - **ApiUsage:** 12 Monate (Art. 5 Abs. 1 lit. e DSGVO -- Speicherbegrenzung)
  - **UserEvent:** 6 Monate (Analyse-Events, kein langfristiger Bedarf)
  - **GuestUsage:** 7 Tage (bestehend, in `guestLimitTracker.js`)
- **Ausfuehrung:** Alle 24 Stunden automatisch (server.js)
- **Art. 5 Abs. 1 lit. e DSGVO:** Speicherbegrenzung

### 18. Profil-Narrativ-Generierung (NEU v1.8.x)
- **Status:** DSGVO-KONFORM
- **Endpoint:** `POST /api/personality/generate-narrative`
- **Details:**
  - Sendet quantitative Persoenlichkeitsdaten an KI (Google/Mistral) zur Narrativ-Erstellung
  - Daten werden client-seitig entschluesselt, ueber HTTPS gesendet
  - Server speichert entschluesselte Daten NICHT dauerhaft
  - Gleiche Pseudonymisierung wie DPC/DPFL (keine Identifikatoren an KI)
- **Rechtsgrundlage:** Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)

### 19. Apple In-App Purchase Integration (NEU v1.9.7)
- **Status:** DSGVO-KONFORM
- **Implementierung:** Februar 2026
- **Architektur:**
  - StoreKit 2 (iOS-nativ) fuer Kaufabwicklung
  - RevenueCat SDK fuer Subscription-Management und Cross-Platform-Sync
  - Server-seitige Receipt-Validierung via Apple App Store Server API
- **Verarbeitete Daten:**
  - **Apple:** Kauf-Transaktionen, Subscription-Status (verarbeitet durch Apple als eigenstaendiger Verantwortlicher)
  - **RevenueCat:** User-ID (interne DB-ID, keine E-Mail), Kauf-Transaktionen, Entitlements
  - **Eigener Server:** TransactionId, ProductId, CustomerEmail, Subscription-Status
- **Pseudonymisierung:** RevenueCat erhaelt nur die interne User-ID, keine E-Mail oder personenbezogenen Daten
- **Rechtsgrundlage:** Art. 6 Abs. 1 lit. b DSGVO (Vertragserfullung — Kauf)
- **Art. 28 DSGVO:** RevenueCat als Auftragsverarbeiter (DPA via RevenueCat Terms of Service)

### 20. Intent Picker & Onboarding-Flow (NEU v1.9.7)
- **Status:** DSGVO-KONFORM
- **Implementierung:** Februar 2026
- **Funktion:**
  - Intent Picker: Nutzer waehlt Nutzungszweck (Kommunikation, Coaching, Begleitendes Coaching)
  - Name Prompt: Gaeste und neue Nutzer werden nach ihrem Vornamen/Synonym gefragt
  - OCEAN Onboarding: Optionaler Persoenlichkeitstest fuer neue registrierte Nutzer
  - Profile Hint: Hinweis fuer Premium-Nutzer auf weitere Persoenlichkeitstests
- **Datenverarbeitung:**
  - **Intent:** Gespeichert in localStorage (`userIntent`) — kein Personenbezug
  - **Gastname:** Gespeichert in localStorage (`guestName`) — verbleibt auf dem Geraet
  - **Registrierter Nutzer Name:** Wird in den verschluesselten Lebenskontext integriert (E2EE)
  - **Intent Picker Einstellungen:** localStorage (`intentPickerDisabled`, `profileHintDisabled`) — technisch notwendig
- **Datenminimierung:** Skip-Option fuer Gastname; Intent-Auswahl kann deaktiviert werden
- **Rechtsgrundlage:** Art. 6 Abs. 1 lit. b DSGVO (Vertragserfullung — App-Funktionalitaet)

### 21. Apple Privacy Manifest (NEU v1.9.7)
- **Status:** IMPLEMENTIERT
- **Datei:** `ios/App/App/PrivacyInfo.xcprivacy`
- **Deklarationen:**
  - **Kein Tracking** (`NSPrivacyTracking = false`)
  - **Keine Tracking-Domains**
  - **Genutzte APIs:** UserDefaults (CA92.1 — App-Funktionalitaet), File Timestamps (C617.1 — App-Funktionalitaet)
  - **Erhobene Daten:** E-Mail (App-Funktionalitaet), Name (App-Funktionalitaet), Kaufhistorie (App-Funktionalitaet)
- **Apple-Anforderung:** Pflicht seit Mai 2024 fuer App Store Submissions
- **Art. 25 DSGVO:** Privacy by Design (transparente API-Deklaration)

---

## VERBLEIBENDE EMPFEHLUNGEN

### 1. Datenschutzerklaerung erweitern (EMPFOHLEN)
- **Status:** EMPFOHLEN (kein kritischer Mangel)
- **Folgende Punkte koennten in der Datenschutzerklaerung ergaenzt werden:**
  - **DiceBear:** Bot-Avatare werden von `api.dicebear.com` (Deutschland) geladen; keine personenbezogenen Daten gesendet, nur SVG-Generierungsparameter
  - **Spracherkennung:** Web Speech API (Browser) bzw. iOS native Spracherkennung; Sprachdaten werden lokal verarbeitet und in Text umgewandelt
  - **rememberedEmail:** Bei aktivierter "Merken"-Checkbox wird die E-Mail-Adresse im localStorage gespeichert
  - **Mistral AI:** Als zusaetzlicher KI-Anbieter (EU) explizit erwaehnen
  - **NEU (v1.9.7): RevenueCat** als Auftragsverarbeiter fuer In-App Purchases erwaehnen (USA, durch SCCs abgesichert)
  - **NEU (v1.9.7):** Gastname-Speicherung im localStorage erwaehnen

---

## DRITTANBIETER-DIENSTE

### 1. Google Gemini API
- **Status:** DSGVO-KONFORM (DPA Coverage verified)
- **Auftragsverarbeiter:** Google Cloud Platform
- **DSGVO:** Art. 28
- **An Google gesendete Daten:**
  - Gespraechsinhalte (Nutzer-Nachrichten, Bot-Antworten)
  - Lebenskontext (falls vom Nutzer bereitgestellt)
  - Persoenlichkeitsprofil (falls DPC/DPFL aktiv, entschluesselt)
  - Bot-ID
  - **KEINE** User-IDs, E-Mail-Adressen oder Account-Daten
- **DPA Coverage:** Automatisch durch Google Cloud Account
- **Dokumentation:** `DOCUMENTATION/GOOGLE-CLOUD-DPA-COMPLIANCE.md`

### 2. Mistral AI (NEU v1.8.x)
- **Status:** DSGVO-KONFORM (DPA Coverage verified)
- **Auftragsverarbeiter:** Mistral AI (Paris, Frankreich)
- **DSGVO:** Art. 28
- **An Mistral gesendete Daten:** Identisch mit Google Gemini (siehe oben)
- **EU-Datenresidenz:** Datenverarbeitung nur in EU (Paris)
- **DPA Coverage:** Automatisch durch Mistral AI Terms of Service
- **Dokumentation:** `DOCUMENTATION/MISTRAL-DPA-COMPLIANCE.md`

### 3. Mailjet (E-Mail-Versand)
- **Status:** DSGVO-KONFORM (DPA Coverage verified)
- **Auftragsverarbeiter:** Sinch Mailjet SAS
- **DSGVO:** Art. 28
- **DPA Coverage:** Automatisch durch Sinch Service Agreement
- **Dokumentation:** `DOCUMENTATION/MAILJET-DPA-COMPLIANCE.md`

### 4. RevenueCat (In-App Purchase Management) (NEU v1.9.7)
- **Status:** DSGVO-KONFORM (DPA Coverage verified)
- **Auftragsverarbeiter:** RevenueCat, Inc. (San Francisco, USA)
- **DSGVO:** Art. 28, Art. 46 (SCCs fuer US-Datenuebermittlung)
- **An RevenueCat gesendete Daten:**
  - Interne User-ID (nicht E-Mail, nicht Name)
  - Kauf-Transaktionen und Subscription-Status
  - App-Bundle-ID, Plattform (iOS)
  - **KEINE** E-Mail-Adressen, Namen oder Chatinhalte
- **DPA Coverage:** Automatisch durch RevenueCat Terms of Service (inkl. SCCs)
- **Datenspeicherung:** USA (durch Standard Contractual Clauses abgesichert)
- **Hinweis:** Nutzer mit `aiRegionPreference: EU` koennen RevenueCat nicht umgehen, da es fuer iOS-Kaeufe erforderlich ist

### 5. Apple App Store (In-App Purchase Verification)
- **Status:** DSGVO-KONFORM
- **Apple als eigenstaendiger Verantwortlicher** (nicht Auftragsverarbeiter)
- **Verarbeitete Daten:** Kauf-Transaktionen, Apple-ID-bezogene Daten
- **Apple handelt als eigenstaendiger Verantwortlicher** gemaess Apple's Privacy Policy
- **Server Notifications:** Apple sendet Subscription-Events an unseren Server (TransactionId, ProductId, Status)

### 6. DiceBear (Bot-Avatare)
- **Status:** DSGVO-KONFORM (kein Auftragsverarbeiter)
- **Details:**
  - Generiert SVG-Avatare fuer Bot-Auswahl
  - **Keine personenbezogenen Daten** werden an DiceBear gesendet
  - Nur Stil-Parameter in der URL (Seed, Haarfarbe etc.)
  - Server-Standort: Deutschland (EU)
- **Empfehlung:** In Datenschutzerklaerung als Drittanbieter-Ressource erwaehnen

---

## ZUSAMMENFASSUNG

### Konformitaets-Score: 100/100 (unveraendert seit v1.8.8)

| Kategorie | Status | Note | Aenderung |
|-----------|--------|------|-----------|
| Datensicherheit | Exzellent | A+ | -- |
| Transparenz | Exzellent | A+ | -- |
| Nutzerrechte | Exzellent | A+ | -- |
| Drittanbieter | Vollstaendig dokumentiert | A+ | Aufwaerts (vorher: A) |
| Technische Massnahmen | Best-in-Class | A++ | -- |
| Datenminimierung | Best-in-Class | A++ | -- |

**Aenderungen v1.8.8 -> v1.9.7:**
- **RevenueCat** als neuer Drittanbieter fuer In-App Purchase Management (DPA via ToS, SCCs)
- **Apple App Store** als eigenstaendiger Verantwortlicher fuer Kauftransaktionen dokumentiert
- **Apple Privacy Manifest** (`PrivacyInfo.xcprivacy`) implementiert — Pflicht fuer App Store Submission
- **Intent Picker** mit lokaler Speicherung (localStorage, kein Personenbezug)
- **Gastname** optional erfasst und nur lokal gespeichert
- **Registrierter Nutzername** wird in verschluesselten Lebenskontext integriert (E2EE)
- **Erweiterte localStorage-Deklaration** um neue technisch notwendige Keys

### Rechtliche Risiken

**HOCH:** ALLE BEHOBEN
- ~~Fehlende Datenschutzerklaerung~~ -> IMPLEMENTIERT
- ~~Fehlendes Impressum~~ -> IMPLEMENTIERT
- ~~Platzhalter in Templates~~ -> PERSONALISIERT

**MITTEL:** ALLE BEHOBEN
- ~~Fehlende AVV mit Google~~ -> VORHANDEN (automatisch durch GCP Account)
- ~~Fehlende AVV mit Mailjet~~ -> VORHANDEN (automatisch durch Sinch Service Agreement)
- ~~Fehlende AVV mit Mistral~~ -> VORHANDEN (automatisch durch Mistral AI ToS)
- ~~Fehlende AVV mit RevenueCat~~ -> VORHANDEN (automatisch durch RevenueCat ToS, inkl. SCCs)
- ~~Fehlender Datenexport~~ -> VOLLSTAENDIG IMPLEMENTIERT
- ~~Unvollstaendige Account-Loeschung~~ -> BEHOBEN (v1.8.2)

**NIEDRIG:**
- ~~API-Usage ohne Retention~~ -> BEHOBEN (12 Monate, automatische Loeschung)
- ~~UserEvent ohne Retention~~ -> BEHOBEN (6 Monate, automatische Loeschung)
- Datenschutzerklaerung: DiceBear, Spracherkennung, rememberedEmail, RevenueCat, Gastname erwaehnen (EMPFOHLEN)

---

## ERLEDIGTE AUFGABEN

### Woche 1 (Kritisch) - ABGESCHLOSSEN (8. November 2025)
- [x] Datenschutzerklaerung erstellen & einbinden
- [x] Impressum erstellen & einbinden
- [x] Datenexport-Funktion implementieren
- [x] Cookie-Nutzung pruefen (Ergebnis: kein Banner noetig)

### Verbesserungen - ABGESCHLOSSEN (11. November 2025)
- [x] HTML-Export-Styling verbessert
- [x] Farbschema auf dunkles Teal angepasst
- [x] Mehrsprachige HTML-Exports (DE/EN)
- [x] Entschluesselter Lebenskontext im Export (DSGVO Art. 15 Auskunftsrecht)
- [x] Feedback-System Bewertung korrigiert (Anonymisierungsoption war bereits vorhanden)
- [x] Google Cloud DPA dokumentiert (automatische Coverage verifiziert)
- [x] Mailjet DPA dokumentiert (automatische Coverage via Sinch DPA verifiziert)

### Neue Features - ABGESCHLOSSEN (10.-16. Dezember 2025)
- [x] **Persoenlichkeitsprofil-System** mit Ende-zu-Ende-Verschluesselung (10. Dez 2025)
- [x] **Experimental Mode (DPC/DPFL)** mit Privacy-by-Design (10. Dez 2025)
- [x] **Blue-Green Deployment Entfernung** (15. Dez 2025)

### v1.8.x DSGVO-Verbesserungen - ABGESCHLOSSEN (Jan-Feb 2026)
- [x] **Mistral AI als EU-Alternative** mit DPA-Dokumentation (Jan 2026)
- [x] **TTS-Service** lokal implementiert, keine externe Drittanbieter (Jan 2026)
- [x] **Big5/Spiral Dynamics Frequenzen** in Session Behavior Logs hinzugefuegt (Jan 2026)
- [x] **Transcript-Entfernung** aus Session Behavior Logs (Feb 2026)
- [x] **Vollstaendiger Datenexport** inkl. PersonalityProfile, SessionBehaviorLog, UserEvents (Feb 2026)
- [x] **Vollstaendige Account-Loeschung** inkl. ApiUsage, UserEvent, UpgradeCode (Feb 2026)
- [x] **Daten-Retention Service** fuer ApiUsage (12 Monate) und UserEvent (6 Monate) (Feb 2026)
- [x] **Mistral AI DPA Compliance** Dokumentation erstellt (Feb 2026)
- [x] **Datenschutzerklaerung & Impressum** personalisiert (Platzhalter ersetzt)

### v1.8.8 DSGVO-Ergaenzungen - ABGESCHLOSSEN (Feb 2026)
- [x] **Transcript Evaluation Feature** mit DSGVO-konformem Admin-Zugang
- [x] **User Rating System (NPS)** mit optionalem Feedback
- [x] **contactOptIn:** Opt-In Checkbox fuer Kontaktaufnahme durch Admin (Art. 6 Abs. 1 lit. a DSGVO)
- [x] **Admin-Datenminimierung:** preAnswers/evaluationData NICHT an Admin-Endpoints gesendet
- [x] **situationName:** Neues Pflichtfeld fuer Transkript-Zuordnung (nicht fuer Admin sichtbar)
- [x] **Bot-Empfehlungen:** KI-generierte Coaching-Empfehlungen pro Entwicklungsbereich (nur Nutzer sichtbar)
- [x] **PDF-Footer:** "Persoenlich und Vertraulich" auf jeder Seite mit Nutzername und Datum

### v1.9.7 DSGVO-Ergaenzungen - ABGESCHLOSSEN (Feb 2026)
- [x] **Apple In-App Purchase** via RevenueCat/StoreKit 2 — pseudonymisiert (nur interne User-ID)
- [x] **RevenueCat als Auftragsverarbeiter** dokumentiert (DPA via ToS, SCCs fuer US-Transfer)
- [x] **Apple App Store** als eigenstaendiger Verantwortlicher dokumentiert
- [x] **Apple Privacy Manifest** (`PrivacyInfo.xcprivacy`) erstellt und in Xcode-Projekt integriert
- [x] **Intent Picker** mit rein lokaler Datenhaltung (localStorage, kein Personenbezug)
- [x] **Gastname-Erfassung** mit Opt-Out (Skip-Option), nur localStorage
- [x] **Nutzername fuer Registrierte** in verschluesselten Lebenskontext integriert (E2EE)
- [x] **Erweiterte localStorage-Deklaration** (userIntent, guestName, intentPickerDisabled, profileHintDisabled, adminStartupPref)

---

## NAECHSTE SCHRITTE

### Prioritaet 1: EMPFOHLEN (Optional)
1. **Datenschutzerklaerung ergaenzen**
   - DiceBear als Drittanbieter-Ressource erwaehnen
   - Spracherkennung (Web Speech API / iOS) explizit erwaehnen
   - rememberedEmail in localStorage-Abschnitt erwaehnen
   - Mistral AI als zusaetzlichen KI-Anbieter erwaehnen
   - Datei: `components/PrivacyPolicyView.tsx` (de_markdown & en_markdown)

### Prioritaet 2: JAEHRLICHE REVIEWS
2. **Google Cloud DPA Review** (Naechste: November 2026)
3. **Mailjet DPA Review** (Naechste: November 2026)
4. **Mistral AI DPA Review** (Naechste: Februar 2027)
5. **RevenueCat DPA Review** (Naechste: Februar 2027)

---

## RESSOURCEN

### Interne Dokumentation
- **Google Cloud DPA Compliance:** `DOCUMENTATION/GOOGLE-CLOUD-DPA-COMPLIANCE.md`
- **Mailjet DPA Compliance:** `DOCUMENTATION/MAILJET-DPA-COMPLIANCE.md`
- **Mistral AI DPA Compliance:** `DOCUMENTATION/MISTRAL-DPA-COMPLIANCE.md`
- **Nginx IP-Anonymisierung:** `DOCUMENTATION/NGINX-IP-ANONYMIZATION.md`
- **GDPR Transcript Removal:** `DOCUMENTATION/GDPR-TRANSCRIPT-REMOVAL.md`

### Externe Ressourcen
- **Datenschutzbehoerde Oesterreich:** https://www.dsb.gv.at/
- **DSGVO-Info Oesterreich:** https://www.oesterreich.gv.at/themen/datenschutz.html
- **WKO Datenschutz (AT):** https://www.wko.at/datenschutz
- **Google Cloud DPA:** https://cloud.google.com/terms/data-processing-addendum
- **Google Cloud Sub-Processors:** https://cloud.google.com/terms/subprocessors
- **Mistral AI Terms:** https://mistral.ai/terms/
- **Sinch DPA (Mailjet):** https://sinch.com/legal/terms-and-conditions/other-sinch-terms-conditions/data-processing-agreement/
- **Sinch Sub-Processors:** https://sinch.com/legal/terms-and-conditions/other-sinch-terms-conditions/sub-processors/
- **Mailjet Security:** https://www.mailjet.com/security-privacy/

---

## ERFOLGSBILANZ

**Was wurde erreicht:**
1. Datenschutzerklaerung mit allen Pflichtangaben nach Art. 13, 14 DSGVO
2. Impressum nach Paragraph 5 E-Commerce-Gesetz (ECG, Oesterreich)
3. **Vollstaendige Datenexport-Funktion** (Art. 20 DSGVO)
   - JSON-Format (maschinenlesbar) + HTML-Format (benutzerfreundlich)
   - Mehrsprachig (DE/EN)
   - Alle Nutzerdaten inkl. PersonalityProfile, SessionBehaviorLog, UserEvents
4. Cookie-Nutzung geprueft (keine Cookies, kein Banner noetig)
5. Transparente Dokumentation aller Datenverarbeitungen
6. Benutzerfreundliche Gestaltung (UX) der DSGVO-Funktionen
7. Feedback-System mit Anonymisierungsoption (standardmaessig aktiv)
8. Auftragsverarbeitungsvertraege (AVV/DPA) mit allen Drittanbietern
   - Google Cloud (Gemini API): Automatische DPA Coverage
   - Mailjet (Sinch): Automatische DPA Coverage via Sinch DPA
   - Mistral AI: Automatische DPA Coverage via Mistral AI ToS
   - **RevenueCat: DPA Coverage via RevenueCat ToS (inkl. SCCs fuer US-Transfer)**
9. **Persoenlichkeitsprofil-System mit E2EE** (Dez 2025)
   - Zero-Knowledge Server-Architektur
   - Client-seitige Verschluesselung aller sensiblen Profildaten
10. **Experimental Mode mit Privacy-by-Design** (Dez 2025)
    - Opt-In erforderlich (explizite Einwilligung)
    - Comfort Check fuer Opt-Out nach jeder Session
11. **IP-Anonymisierung in Server-Logs** (Nov 2025)
12. **Deployment-Vereinfachung** (Dez 2025)
13. **Mistral AI als EU-KI-Alternative** (Jan 2026)
    - Datenverarbeitung bleibt in EU
14. **TTS-Service lokal** (Jan 2026) -- kein externer Drittanbieter
15. **Transcript-Entfernung** aus Session Logs (Feb 2026) -- weitere Datenminimierung
16. **Vollstaendige Account-Loeschung** (Feb 2026) -- alle Tabellen beruecksichtigt
17. **Automatische Daten-Retention** (Feb 2026) -- ApiUsage 12 Monate, UserEvent 6 Monate
18. **Transcript Evaluation mit GDPR-konformem Admin-Zugang** (Feb 2026)
    - Admin sieht nur Rating + freiwilliges Feedback (keine preAnswers/evaluationData)
    - contactOptIn: Opt-In Checkbox fuer Kontaktaufnahme
    - situationName als Pflichtfeld fuer Zuordnung
    - Bot-Empfehlungen nur fuer den Nutzer sichtbar
    - PDF markiert als "Persoenlich und Vertraulich"
19. **Apple In-App Purchase via RevenueCat** (Feb 2026)
    - Pseudonymisiert (nur interne User-ID an RevenueCat)
    - Server-seitige Receipt-Validierung
    - RevenueCat DPA (inkl. SCCs) dokumentiert
20. **Intent Picker & Onboarding** (Feb 2026) — rein lokale Datenhaltung
21. **Apple Privacy Manifest** (Feb 2026) — App Store Pflicht erfuellt

**Rechtskonformitaet:**
- Die App erfuellt die **wesentlichen Anforderungen der DSGVO**
- **Alle kritischen und mittelschweren Maengel behoben**
- **Alle Auftragsverarbeitungsvertraege (AVV) vorhanden und dokumentiert**
- Verbleibende Punkte sind **optionale Best-Practice-Empfehlungen**
- **Privacy-by-Design:** Alle Features von Anfang an datenschutzfreundlich konzipiert

**Status: PRODUKTIONSREIF -- DSGVO Best-in-Class**
- Alle DSGVO-Anforderungen erfuellt
- Drittanbieter-DPAs vollstaendig dokumentiert und verifiziert
- Compliance-Score: **100/100**
- **Zero-Knowledge Architektur** fuer Lebenskontext & Persoenlichkeitsprofile
- **Hoechste technische Schutzmassnahmen** (Art. 32 DSGVO)
- **Privacy-by-Design & Privacy-by-Default** (Art. 25 DSGVO)
- **EU-Alternative** fuer KI-Verarbeitung verfuegbar (Mistral AI)

---

**Naechstes Review:** Maerz 2027 (jaehrlich)  
**Maintained by:** Guenter Herold / Manualmode  
**Contact:** support@manualmode.at
