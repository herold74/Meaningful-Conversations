# DSGVO-KONFORMITÄTSPRÜFUNG
## Meaningful Conversations App

**Prüfungsdatum:** 29. Juli 2026  
**Geprüfte Version:** 2.5.0  
**Vorherige Prüfung:** 25. Februar 2026 (v1.9.7)  
**Betreiber-Standort:** Österreich  
**Server-Standort:** Hetzner, Deutschland (EU)  
**Zuständige Behörde:** Datenschutzbehörde Österreich (https://www.dsb.gv.at/)

---

## BEWERTUNGSLEGENDE

| Kennzeichnung | Bedeutung |
|---------------|-----------|
| **DSGVO-KONFORM** | Anforderung erfüllt; keine wesentlichen Lücken |
| **TEILWEISE** | Grundsätzlich ok, aber Formulierung/Dokumentation/Code weicht ab |
| **HANDLUNGSBEDARF** | Relevante Lücke; sollte vor Production/Store-Update adressiert werden |
| **EMPFOHLEN** | Best Practice; kein unmittelbarer Rechtsverstoß |

---

## POSITIVE BEFUNDE

### 1. Ende-zu-Ende-Verschlüsselung (E2EE) — Lebenskontext
- **Status:** DSGVO-KONFORM
- Lebenskontext wird client-seitig verschlüsselt (AES-GCM, PBKDF2); Schlüssel verlässt das Gerät nicht
- Server speichert nur Ciphertext + `encryptionSalt`
- **Art. 32 DSGVO:** Technische Schutzmaßnahmen
- **Dateien:** `routes/data.js`, Client-Crypto-Utils

### 2. Gastmodus — Chat & Lebenskontext lokal
- **Status:** TEILWEISE (siehe Abschnitt „Abweichungen“)
- Chat-Inhalte und Lebenskontext im Gastmodus bleiben **primär lokal** (kein persistierter LC auf dem Server)
- **Art. 5 Abs. 1 lit. c DSGVO:** Datenminimierung für Kerndaten

### 3. Kontolöschung
- **Status:** DSGVO-KONFORM (mit dokumentierter Einschränkung bei Käufen)
- `DELETE /api/data/user` — UI: `DeleteAccountModal.tsx`
- CASCADE: Feedback, PersonalityProfile, SessionBehaviorLog, PracticeEvaluations, TranscriptEvaluations
- Explizit gelöscht: ApiUsage, UserEvent; UpgradeCodes entkoppelt
- **Art. 17 DSGVO:** Recht auf Löschung
- **Datei:** `meaningful-conversations-backend/routes/data.js`

### 4. Datenminimierung — keine Session-Transkripte in DB
- **Status:** DSGVO-KONFORM
- Classic-Chat-Transkripte werden **nicht** dauerhaft in der DB gespeichert (Migration `20260208120000_remove_encrypted_transcript`)
- Session Behavior Logs: nur Frequenzzähler, kein Transkript
- **Art. 5 Abs. 1 lit. c DSGVO**
- **Dokumentation:** `DOCUMENTATION/GDPR-TRANSCRIPT-REMOVAL.md`

### 5. Datensicherheit
- **Status:** DSGVO-KONFORM
- Passwörter: bcrypt (10 Rounds)
- HTTPS/TLS; Hosting Hetzner DE
- JWT mit Invalidierung bei Passwortänderung (`tokensInvalidatedAt`)
- **Art. 32 DSGVO**

### 6. Transparenz & Rechtsinformationen
- **Status:** DSGVO-KONFORM
- Datenschutzerklärung: `PrivacyPolicyView.tsx`, statisch `public/privacy.html`
- Impressum, Disclaimer, FAQ, PII-Warnung
- **Art. 13, 14 DSGVO**

### 7. Datenexport (Auskunft / Übertragbarkeit)
- **Status:** DSGVO-KONFORM (mit dokumentierten Ausnahmen)
- `GET/POST /api/data/export` — `DataExportView.tsx`
- Formate: JSON + HTML (DE/EN)
- Enthält u.a.: Account, Gamification, Life Context (optional entschlüsselt), Feedback, Upgrade-Codes, ApiUsage (12-Mo-Fenster), PersonalityProfile, SessionBehaviorLogs, UserEvents, **PracticeEvaluations**, **TranscriptEvaluations**
- **Art. 15, 20 DSGVO**

### 8. Speicherbegrenzung (automatisiert)
- **Status:** DSGVO-KONFORM
- **ApiUsage:** 12 Monate — `services/dataRetention.js`
- **UserEvent:** 6 Monate
- **GuestUsage:** 7 Tage — `services/guestLimitTracker.js`
- Lauf alle 24h via `server.js`
- **Art. 5 Abs. 1 lit. e DSGVO**

### 9. Persönlichkeitsprofil (E2EE)
- **Status:** DSGVO-KONFORM
- Tabelle `personality_profiles`; Scores verschlüsselt; Metadaten (testType, completedLenses, …) unverschlüsselt
- Opt-Out / Comfort Check im DPFL-Flow
- Bei **Passwortänderung** (eingeloggt): Re-Encryption möglich via `newEncryptedLifeContext`
- **Art. 6 Abs. 1 lit. a, Art. 32 DSGVO**

### 10. DPC / DPFL (Experimental Mode)
- **Status:** DSGVO-KONFORM
- Opt-In; Pseudonymisierung gegenüber KI (keine userId/E-Mail an Provider)
- Session Behavior Logs ohne Transkript
- **Art. 25 DSGVO:** Privacy by Design

### 11. KI-Anbieter & Regionwahl
- **Status:** DSGVO-KONFORM
- Google Gemini (US, SCCs via Google Cloud DPA) und Mistral AI (EU, Paris)
- Nutzerwahl `aiRegionPreference`: `eu` / `us` / `optimal`
- Seit v2.5.0: Practice `send-message` und `practice-coach-turn` respektieren `userRegionPreference` (wie Classic-Chat)
- **DPA-Docs:** `GOOGLE-CLOUD-DPA-COMPLIANCE.md`, `MISTRAL-DPA-COMPLIANCE.md`

### 12. TTS (Text-to-Speech)
- **Status:** DSGVO-KONFORM
- Self-hosted Piper im eigenen Container; kein externer TTS-Dienst
- Text nur im Arbeitsspeicher; ApiUsage-Tracking
- **Art. 5 DSGVO:** Datenminimierung

### 13. Transcript Evaluation (Premium)
- **Status:** DSGVO-KONFORM
- Upload für Analyse; **Original-Transkript nicht dauerhaft** in DB nach Analyse
- Gespeichert: `preAnswers`, `evaluationData`, optionale NPS/Feedback, `contactOptIn`
- Admin sieht nur Rating/Feedback/contactOptIn — **keine** preAnswers/evaluationData
- CASCADE bei Kontolöschung
- **Art. 6 Abs. 1 lit. b, Art. 28 DSGVO**

### 14. Coach Practice Lab (NEU v2.3–2.5)
- **Status:** DSGVO-KONFORM (mit Transparenz-Empfehlung für Draft)
- **In-Progress-Draft:** `sessionStorage` (`mc_practice_draft_v1`), max. 24h, tab-scoped, **nicht** an Server — `utils/practiceSessionDraft.ts`
- **Abgeschlossene Sessions:** `practice_evaluations` — strukturierte Scores/JSON **+ Gesprächstranskript** (nach freiwilliger Auswertung; Download; **Nutzer kann Transkript einzeln in der Auswertungsansicht löschen**; vollständige Löschung bei Kontolöschung). **Nicht E2EE** — überlebt Passwort-Reset.
- Evaluation via KI (Google/Mistral je nach Region)
- Export in `/api/data/export` enthalten
- **Art. 6 Abs. 1 lit. b DSGVO**

### 15. Admin Practice Analytics (NEU v2.3)
- **Status:** DSGVO-KONFORM
- Aggregierte Statistiken only; **keine** userId, keine Transkript-Zitate, kein focusNote-Text
- **k-Anonymität (k=5):** Unterdrückung kleiner Kohorten — `services/practiceStatsService.js`
- UI: `AdminPracticeAnalyticsView.tsx`
- **Art. 5 Abs. 1 lit. c DSGVO**

### 16. In-App Purchase (Apple / RevenueCat) & PayPal
- **Status:** DSGVO-KONFORM *(Privacy-Texte v2.5.0 P1)*
- iOS: StoreKit 2 + RevenueCat (pseudonymisierte interne User-ID)
- Web: PayPal — `Purchase`-Tabelle (E-Mail, Transaktions-IDs)
- RevenueCat DPA via ToS (SCCs); Apple als eigenständiger Verantwortlicher
- **Art. 6 Abs. 1 lit. b, Art. 28 DSGVO**

### 17. Cookie-Nutzung
- **Status:** DSGVO-KONFORM
- **Keine Cookies** für Tracking; localStorage/sessionStorage für technisch notwendige Funktionen
- Kein Cookie-Banner erforderlich (ePrivacy)
- Dokumentiert in PrivacyPolicyView; `public/privacy.html` teilweise weniger detailliert

### 18. Apple Privacy Manifest
- **Status:** DSGVO-KONFORM
- `ios/App/App/PrivacyInfo.xcprivacy` — kein Tracking deklariert

### 19. Newsletter & Einwilligung
- **Status:** DSGVO-KONFORM
- Opt-in bei Registrierung; `unsubscribeToken`; Mailjet als AV
- **Art. 6 Abs. 1 lit. a DSGVO**

---

## ABWEICHUNGEN & HANDLUNGSBEDARF (v2.5.0)

### A1. Gastmodus — Server-seitige Metadaten
- **Status:** DSGVO-KONFORM *(behoben v2.5.0 P2)*
- **Fakt:** `GuestUsage` (Fingerprint-Hash, Nachrichtenzähler, 7-Tage-Retention), ggf. `ApiUsage` mit `isGuest`, IP-Hash für Rate-Limiting
- **Umsetzung:** `PrivacyPolicyView.tsx` + `public/privacy.html` präzisieren Gastmodus (lokal vs. Fingerprint)
- **Art. 13 DSGVO:** Transparenz

### A2. Passwort-Reset vs. Persönlichkeitsprofil
- **Status:** DSGVO-KONFORM *(behoben v2.5.0 P2)*
- **Umsetzung:** `clearPersonalityProfileOnPasswordReset()` in `auth.js` + `admin.js` — löscht `personality_profiles` bei Reset
- **Hinweis:** Eingeloggte Passwortänderung weiterhin mit Client-Re-Encryption (`newEncryptedLifeContext`)
- **Art. 17 DSGVO:** Löschung / Art. 5: Speicherbegrenzung

### A3. Käufe (`Purchase`) — Export & Löschung
- **Status:** DSGVO-KONFORM *(behoben v2.5.0 P1)*
- **Umsetzung:** `anonymizePurchasesForEmail()` bei Kontolöschung; Käufe im `/api/data/export`-Payload
- **Anonymisierung:** E-Mail, Name, PayPal-Payload entfernt; Transaktionsmetadaten für Buchhaltung
- **Art. 17, 20 DSGVO**

### A4. Support-Tickets (`Ticket`)
- **Status:** TEILWEISE *(P2: Löschung/Export behoben; kein User-Create-Pfad)*
- **Umsetzung:** Export + Löschung bei Account-Delete für Tickets mit `payload.email`
- **Offen:** Kein öffentlicher Ticket-Create-Endpoint — nur Admin-Queue
- **Art. 15, 17 DSGVO**

### A5. Datenschutzerklärung — Textlücken
- **Status:** DSGVO-KONFORM *(behoben v2.5.0 P1)*
- **Umsetzung:** RevenueCat, Apple IAP, PayPal, Practice-Draft, DiceBear, rememberedEmail in `PrivacyPolicyView.tsx` + `public/privacy.html`
- **Art. 13, 14 DSGVO**

### A6. NGINX Access-Log IP-Anonymisierung
- **Status:** DSGVO-KONFORM *(behoben v2.5.0 P3)*
- **Umsetzung:** `log_format anonymized` in `/etc/nginx/nginx.conf`; `access_log … anonymized` in `update-nginx-ips.sh` + Templates
- **Dokumentation:** `DOCUMENTATION/NGINX-IP-ANONYMIZATION.md`
- **Verifiziert:** 29.07.2026 — Staging + Production vhosts regeneriert
- **Art. 5 Abs. 1 lit. c DSGVO:** Datenminimierung (Server-Logs)

---

## DATENKATEGORIEN-ÜBERSICHT (v2.5.0)

| Kategorie | Speicherort | Retention / Löschung |
|-----------|-------------|----------------------|
| Lebenskontext (E2EE) | DB `User.lifeContext` | Bis Löschung; Reset → leer |
| Chat-Inhalte (Classic) | Nicht persistent DB | Nur KI-Request live |
| Session Behavior | DB | CASCADE bei User-Delete |
| Practice Draft | Client `sessionStorage` | Max. 24h / Tab close |
| Practice Evaluation | DB `practice_evaluations` | CASCADE |
| Transcript Evaluation | DB `transcript_evaluations` | CASCADE |
| Personality Profile | DB E2EE + Metadaten | CASCADE (Reset: siehe A2) |
| ApiUsage | DB | 12 Monate auto |
| UserEvent | DB | 6 Monate auto |
| GuestUsage | DB | 7 Tage auto |
| Feedback | DB | CASCADE |
| Purchase | DB (E-Mail-keyed) | **Nicht** an User gebunden |
| Newsletter-Logs | DB | Admin-only |

---

## DRITTANBIETER-DIENSTE

| Dienst | Rolle | Status | Dokumentation |
|--------|-------|--------|---------------|
| Google Gemini | AV (KI) | DSGVO-KONFORM | `GOOGLE-CLOUD-DPA-COMPLIANCE.md` |
| Mistral AI | AV (KI, EU) | DSGVO-KONFORM | `MISTRAL-DPA-COMPLIANCE.md` |
| Mailjet (Sinch) | AV (E-Mail) | DSGVO-KONFORM | `MAILJET-DPA-COMPLIANCE.md` |
| Hetzner | Hosting (EU) | DSGVO-KONFORM | privacy.html |
| RevenueCat | AV (IAP) | DSGVO-KONFORM | ToS + SCCs; Privacy §5.4 |
| Apple App Store | Verantwortlicher (Kauf) | DSGVO-KONFORM | Apple Privacy Policy |
| PayPal | Zahlungsabwicklung | DSGVO-KONFORM | Privacy §5.4 |
| Piper TTS | Self-hosted | DSGVO-KONFORM | `TTS-SETUP-GUIDE.md` |
| DiceBear | Avatar-CDN (DE) | DSGVO-KONFORM | In Privacy erwähnen (EMPFOHLEN) |

**An KI gesendet (Classic/Practice/Analysis):** Gesprächstexte, System-Prompts, ggf. entschlüsseltes Profil (DPC/DPFL); **keine** userId/E-Mail in Prompts.

---

## ÄNDERUNGEN SEIT v1.9.7 → v2.5.0

| Bereich | Änderung |
|---------|----------|
| Coach Practice Lab | DB-Evaluations, sessionStorage-Draft, Admin-k-Analytics |
| Practice KI-Routing | `userRegionPreference` in send-message + coach-turn (Fix v2.5.0) |
| **P1/P2 Nachbesserung (29.07.2026)** | Privacy-Texte IAP/PayPal; Purchase-Anonymisierung + Export; Personality-Delete bei Reset; Ticket Export/Löschung; Skill `gdpr-compliance` |
| SDK | `@google/genai` 2.x, `@mistralai/mistralai` 2.x (keine neue Datenkategorie) |
| Regression Harness | Intern QA; keine Nutzerdaten |
| Admin UI | Icon-only Tabs auf schmalen Screens (kein DSGVO-Impact) |

---

## ZUSAMMENFASSUNG

### Konformitäts-Score: **99/100** (v2.5.0 + P1/P2/P3)

| Kategorie | Status | Anmerkung |
|-----------|--------|-----------|
| Datensicherheit & E2EE | Exzellent | A+ |
| Nutzerrechte (Export/Löschung) | Exzellent | A+; Purchase/Tickets behoben |
| Transparenz (Privacy-Texte) | Exzellent | A |
| Datenminimierung | Exzellent | A+ |
| Drittparteien / AV | Sehr gut | A |
| Speicherbegrenzung | Exzellent | A+ |

**Rechtliche Risiken (offen):**

| Priorität | Thema | Status |
|-----------|-------|--------|
| P1 | Privacy-Texte IAP/PayPal/Practice-Draft | ✅ Behoben |
| P1 | Purchase bei Account-Delete / Export | ✅ Behoben |
| P2 | Personality-Profil bei Passwort-Reset | ✅ Behoben |
| P2 | Gastmodus-Formulierung präzisieren | ✅ Behoben |
| P3 | NGINX-IP-Dokumentation & Live-Config | ✅ Behoben |

**Gesamtbewertung:** Die App erfüllt die **wesentlichen DSGVO-Anforderungen** für Production/Store-Rollout. P1–P3 abgeschlossen. Verbleibend: A4 Ticket-Create optional; jährliche DPA-Reviews (Routine Q1 2027).

**Status: PRODUKTIONSREIF**

---

## NÄCHSTE SCHRITTE

### Jährliche Reviews (Routine)
1. Google / Mailjet / Mistral / RevenueCat DPA Review (Q1 2027)
2. Dieses Audit jährlich aktualisieren (Juli 2027)

### Agent-Skill
- **`.cursor/skills/meaningful-conversations/gdpr-compliance/SKILL.md`** — Implementierung, Export/Löschung, Audit-Workflow

---

## RESSOURCEN

### Interne Dokumentation
- `DOCUMENTATION/GOOGLE-CLOUD-DPA-COMPLIANCE.md`
- `DOCUMENTATION/MAILJET-DPA-COMPLIANCE.md`
- `DOCUMENTATION/MISTRAL-DPA-COMPLIANCE.md`
- `DOCUMENTATION/GDPR-TRANSCRIPT-REMOVAL.md`
- `.cursor/skills/meaningful-conversations/gdpr-compliance/SKILL.md`
- `public/privacy.html`

### Externe Ressourcen
- Datenschutzbehörde Österreich: https://www.dsb.gv.at/
- Google Cloud DPA: https://cloud.google.com/terms/data-processing-addendum
- Mistral AI Terms: https://mistral.ai/terms/
- Sinch DPA (Mailjet): https://sinch.com/legal/terms-and-conditions/other-sinch-terms-conditions/data-processing-agreement/

---

**Nächstes Review:** Juli 2027 (jährlich)  
**Maintained by:** Günter Herold / Manualmode  
**Contact:** support@manualmode.at
