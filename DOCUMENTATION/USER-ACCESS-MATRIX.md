# User Types and Feature Access Matrix

This document outlines the different user types within the Meaningful Conversations application, their respective access levels, and a recommended pricing structure.

**Last Updated**: February 19, 2026 — v1.9.2

## User Types

1.  **Guest (Gast)**: Unregistered users who can try out the application with limited features. Data is stored locally in the browser.
2.  **Registered User (Registrierter Nutzer)**: Users who have created an account. They start with a **14-day Premium trial** (full feature access including all Premium features). After expiry, they see a paywall with a full product catalog (Registered Lifetime, Premium passes, or code redemption) and can download their Life Context and Personality Profile. Registered Lifetime users benefit from cloud synchronization, E2EE storage, and access to coaching bots (Max, Ava) plus personality profiling (OCEAN). Early adopters (registered in 2025) receive Premium access until June 30, 2026.
3.  **Premium User (Premium Nutzer)**: Registered users with an active subscription or a redeemed access pass. They unlock advanced coaching bots (Kenji, Chloe), extended personality profiling (Riemann, Spiral Dynamics), and adaptive learning (DPFL).
4.  **Client (Klient)**: Users working with a professional manualmode.at coach. They receive full access to all bots (Rob, Victor), Transcript Evaluation, and PEP. Access is granted by the coach, not purchased.
5.  **Admin**: Administrators with access to the backend management panel.
6.  **Developer**: Technical staff with access to debugging tools and the Test Runner.

## Feature Access Matrix

| Feature / Resource | Guest | Registered | Premium | Client | Admin | Developer |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Core Functions** | | | | | | |
| Chat Interface | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Voice Mode (Web Speech API) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Server TTS (High Quality) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Life Context (Markdown) | ✅ (Local) | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) |
| Personality Profile (OCEAN) | ❌ | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) |
| Personality Profile (Riemann & SD) | ❌ | ❌ | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) |
| Narrative Profile (Signature) | ❌ | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) |
| PDF Export (Profile) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Data Persistence | ⚠️ Browser | ✅ Cloud DB | ✅ Cloud DB | ✅ Cloud DB | ✅ Cloud DB | ✅ Cloud DB |
| Sync across devices | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Calendar Export (.ics) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gamification (XP, Levels) | ✅ (Local) | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Management & Kommunikation** | | | | | | |
| **Nobody** (GPS, Problemlösung) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Gloria Interview** (Strukturierte Interviews) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Gloria** (Onboarding) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Coaching Bots** | | | | | | |
| **Max** (Ambitioniert) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Ava** (Strategisch) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Kenji** (Stoisch) | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Chloe** (Strukturierte Reflexion) | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Exklusiv für Klienten** | | | | | | |
| **Rob** (Mentale Fitness) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Victor** (Systemisch) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Advanced Features** | | | | | | |
| DPC (Dynamic Prompt Composition) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| DPFL (Adaptive Learning) | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Comfort Check (DPFL) | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| PEP Solution Blockages (Dr. Bohne) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Transcript Evaluation | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Transcript Evaluation PDF Export | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Bot Recommendations (in Evaluation) | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Audio Transcription (Record & Upload) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Crisis Response (Helplines) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Payment & Access** | | | | | | |
| PayPal Direct Checkout (Web) | — | — | — | — | — | — |
| Code Redemption | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bot Code blocked when expired | — | ✅ | — | — | — | — |
| **Administration** | | | | | | |
| Admin Panel Access | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| User Management | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Upgrade Code Generation | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| API Usage Monitoring | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Transcript Ratings Overview | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Test Runner | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

## Bot-Kategorien in der App

Die App gruppiert Bots in drei Sektionen mit visuellem Farbschema:

| Sektion | Farbschema | Bots | Besonderheit |
| :--- | :--- | :--- | :--- |
| **Management & Kommunikation** | Bronze | Nobody, Gloria Interview | Kein Coaching — GPS-Ansatz, Problemlösung, Kommunikationsanalyse, strukturierte Interviews |
| **Coaching** | Silver | Max, Ava (Guest), Kenji, Chloe (Premium) | Persönlichkeitsentwicklung und Zielerreichung |
| **Exklusiv für Klienten** | Gold | Rob, Victor | Nur mit manualmode.at Coaching-Beziehung |

Gloria (Onboarding) erscheint nicht in der Bot-Auswahl, da sie nur beim ersten Kontakt automatisch zugewiesen wird.

**Wichtig:** Max und Ava sind vollwertige Coaching-Bots auf Guest-Tier. Sie sind der Hauptgrund, warum die kostenlose App bereits substantiellen Wert bietet.

## Access Pass Products (PayPal)

### Standardprodukte

| Product | Custom ID (PayPal) | Internal botId | Duration | Tier Granted |
| :--- | :--- | :--- | :--- | :--- |
| Registered Lifetime | `REGISTERED_LIFETIME` | `REGISTERED_LIFETIME` | Permanent | Registered |
| Premium 1-Monats-Pass | `ACCESS_PASS_1M` | `ACCESS_PASS_1M` | 30 Tage | Premium |
| Premium 3-Monats-Pass | `ACCESS_PASS_3M` | `ACCESS_PASS_3M` | 90 Tage | Premium |
| Premium 1-Jahres-Pass | `ACCESS_PASS_1Y` | `ACCESS_PASS_1Y` | 365 Tage | Premium |
| Kenji Coach Unlock | `KENJI_UNLOCK` | `kenji-stoic` | Permanent | Kenji (einzeln) |
| Chloe Coach Unlock | `CHLOE_UNLOCK` | `chloe-cbt` | Permanent | Chloe (einzeln) |

### Upgrade-Produkte (rabattiert, gleiche Wirkung wie Standardprodukte)

Die Upgrade-Codes lösen in der App dasselbe aus wie Standard-Premium-Pässe. Der Rabatt wird auf der Website/PayPal-Seite abgebildet.

| Product | Custom ID (PayPal) | Internal botId | Rabatt-Basis | Beispiel (1M) |
| :--- | :--- | :--- | :--- | ---: |
| Upgrade Lifetime → Premium 1M | `UPGRADE_LT_PREMIUM_1M` | `ACCESS_PASS_1M` | Loyalty ~20% | 7,90 € |
| Upgrade Lifetime → Premium 3M | `UPGRADE_LT_PREMIUM_3M` | `ACCESS_PASS_3M` | Loyalty ~24% | 18,90 € |
| Upgrade Lifetime → Premium 1Y | `UPGRADE_LT_PREMIUM_1Y` | `ACCESS_PASS_1Y` | Loyalty ~25% | 59,90 € |
| Upgrade Bot → Premium 1M | `UPGRADE_BOT_PREMIUM_1M` | `ACCESS_PASS_1M` | 3,90 € Anrechnung | 6,00 € |
| Upgrade Bot → Premium 3M | `UPGRADE_BOT_PREMIUM_3M` | `ACCESS_PASS_3M` | 3,90 € Anrechnung | 21,00 € |
| Upgrade Bot → Premium 1Y | `UPGRADE_BOT_PREMIUM_1Y` | `ACCESS_PASS_1Y` | 3,90 € Anrechnung | 76,00 € |
| Upgrade Lifetime+Bot → Premium 1M | `UPGRADE_LT_BOT_PREMIUM_1M` | `ACCESS_PASS_1M` | Loyalty + Bot | 4,00 € |
| Upgrade Lifetime+Bot → Premium 3M | `UPGRADE_LT_BOT_PREMIUM_3M` | `ACCESS_PASS_3M` | Loyalty + Bot | 15,00 € |
| Upgrade Lifetime+Bot → Premium 1Y | `UPGRADE_LT_BOT_PREMIUM_1Y` | `ACCESS_PASS_1Y` | Loyalty + Bot | 56,00 € |

### Admin-Only Codes (nicht käuflich)

| Product | Internal botId | Duration | Effekt |
| :--- | :--- | :--- | :--- |
| Premium Status | `premium` | Permanent | `isPremium = true`, kein Ablaufdatum |
| Client Status | `client` | Permanent | `isClient = true`, kein Ablaufdatum |
| OCEAN Profil | `big5` | Permanent | OCEAN-Fragebogen freigeschaltet |
| Einzelner Coach | `{bot-id}` | Permanent | Bot zu `unlockedCoaches` hinzugefügt |

---

## Empfehlung: Kostenstruktur

### Was jede Stufe bietet

| Stufe | Wert für den Nutzer | Anreiz zum Upgrade |
| :--- | :--- | :--- |
| **Guest** (kostenlos) | 4 Bots (Nobody, Gloria, Max, Ava), Chat, Voice, Life Context (lokal), Kalenderexport | Daten gehen bei Browser-Reset verloren; kein TTS, kein Profil, kein DPC, kein Gloria Interview |
| **Registered** (3,90 €/Monat) | + Gloria Interview, Cloud-Sync, Server-TTS, OCEAN-Profil, Narrative Signature, DPC, PDF-Export, Gamification | Kein Riemann/SD-Profil, kein DPFL, kein Kenji/Chloe |
| **Premium** (9,90 €/Monat) | + Riemann-Thomann, Spiral Dynamics, DPFL, Comfort Check, Kenji, Chloe, Transcript Evaluation mit PDF & Bot-Empfehlungen | Kein Rob/Victor, kein PEP |
| **Client** (durch Coach) | + Rob, Victor, PEP Lösungsblockaden | — Vollzugang — |

### Grundprinzipien

1. **Guest ist kostenlos** — Zum Ausprobieren mit 4 Bots, Chat und Voice. Daten nur lokal → natürlicher Anreiz zur Registrierung.
2. **Registered (3,90 €/Monat) hat echten Wert** — Cloud-Sync, Server-TTS, OCEAN-Profil, Narrative Signature und DPC. Das ist eine produktiv nutzbare App, kein Teaser. Der Preis deckt Infrastrukturkosten (TTS, Cloud-Storage, Sync) und liegt unter der "Kaffee-pro-Woche"-Schwelle.
3. **Premium (9,90 €/Monat) lohnt sich für Vertiefer** — Wer über Wochen mit der App arbeitet und tiefer gehen will, bekommt mit Riemann, Spiral Dynamics, DPFL und Transcript Evaluation ein umfassendes System plus zwei spezialisierte Coaches (Kenji, Chloe).
4. **Client ist kein Produkt** — Der Client-Zugang ergänzt eine reale Coaching-Beziehung. Er wird nicht verkauft, sondern vom Coach freigeschaltet.

### Empfohlene Preisstruktur

| Produkt | Empfohlener Preis | Zielgruppe | Was wird freigeschaltet |
| :--- | ---: | :--- | :--- |
| | | **Registered** | |
| **Registered Monatsabo** | 3,90 €/Monat | Alle Nutzer | Cloud-Sync, TTS, OCEAN, Signature, DPC, PDF |
| **Registered Einmalzahlung** | 14,90 € (einmalig) | Abo-Skeptiker | Wie Monatsabo, permanent (≈ 4 Monate) |
| | | **Premium** | |
| **Premium 1-Monats-Pass** | 9,90 € | Neugierige / Testphase | Kenji, Chloe, Riemann, SD, DPFL, Comfort Check, Transcript Evaluation (PDF & Bot-Empfehlungen) |
| **Premium 3-Monats-Pass** | 24,90 € | Regelmäßige Nutzer | Wie 1M; ~17% Ersparnis; genug Zeit für DPFL-Lerneffekt |
| **Premium 1-Jahres-Pass** | 79,90 € | Power-User | Wie 1M; ~33% Ersparnis; stärkste Bindung |
| **Einzelner Bot-Unlock** | 3,90 € | Gezieltes Interesse | Kenji ODER Chloe permanent (ohne restlichen Premium-Umfang) |
| | | **Client** | |
| **Client-Zugang** | Nicht käuflich | Coaching-Klienten | Wird vom Coach per Code vergeben |

### Begründung

**Warum 3,90 €/Monat für Registered?**
- Unter der "Kaffee-pro-Woche"-Schwelle → Impulsentscheidung
- Deckt reale Infrastrukturkosten: Server-TTS (~0,01–0,03 $/Anfrage), Cloud-Storage, E2EE-Sync, API-Tokens für OCEAN-Auswertung
- Filtert Gelegenheitsnutzer, die Serverressourcen verbrauchen aber nicht konvertieren
- Genug Abstand zu Premium (2,5x), damit das Upgrade attraktiv bleibt
- **Einmalzahlung 14,90 €** als Alternative für Abo-Skeptiker (≈ 4 Monate, amortisiert sich schnell)

**Warum 9,90 €/Monat für Premium?**
- Positionierung zwischen kostenlosen Chat-Tools und professionellem Coaching (80–150 €/Stunde)
- Vergleichbar mit Self-Improvement-Apps (Headspace: 12,99 €, Calm: 14,99 €)
- API-Kosten (Gemini 2.5 Flash: ~0,075 $/1M Tokens) erlauben komfortable Marge
- Niedrig genug als Impulskauf, hoch genug für wahrgenommenen Wert

**Warum Einzelbot-Unlock (3,90 €)?**
- Für Nutzer, die genau Kenji oder Chloe wollen, aber kein Abo möchten
- Permanent → kein Abo-Druck, senkt Kaufhemmung
- Upselling-Effekt: Wer einen Coach mag, will oft den vollen Premium-Umfang

**Warum Client nicht käuflich?**
- Schützt die therapeutische Integrität der Client-Bots (Rob, Victor)
- Transcript Evaluation erzeugt sensible Daten → professioneller Kontext nötig
- PEP (Dr. Bohne) erfordert Verständnis des Verfahrens
- Positioniert manualmode.at als Premium-Dienstleister

### Upselling-Pfad

```
Guest (kostenlos, sofort nutzbar)
  → Erlebt: Nobody, Max, Ava, Gloria, Chat, Voice, Life Context (lokal) — kein Gloria Interview
  → Trigger: "Daten nur im Browser" + kein TTS + kein Profil
  ↓
14-Tage Premium-Trial (kostenlos nach Registrierung)
  → Erlebt: ALLES was Premium bietet — Kenji, Chloe, Riemann, SD, DPFL, etc.
  → Nach 14 Tagen: Paywall mit vollem Produktkatalog
  → Daten-Download (Life Context, Profil) auch nach Ablauf möglich
  ↓
Registered (3,90 €/Monat oder 14,90 € einmalig)
  → Erlebt: Cloud-Sync, Server-TTS, OCEAN-Profil, Signature, DPC, PDF
  → Trigger: Riemann/SD gesperrt, DPFL gesperrt, Kenji/Chloe gesperrt
  ↓
Premium (9,90 €/Monat oder Pass)
  → Erlebt: Kenji, Chloe, Riemann, SD, DPFL, Comfort Check, Transcript Evaluation mit PDF & Bot-Empfehlungen
  → Trigger: Rob/Victor gesperrt, PEP gesperrt
  ↓
Client (durch Coach vergeben, nicht käuflich)
  → Erlebt: Alles — Rob, Victor, PEP
```

### Upgrade-Pfade & Rabatte

Grundprinzip: Frühere Investitionen werden immer anerkannt. Kein Buyer's Remorse.

#### 1. Registered Monatsabo → Premium

Premium *ersetzt* Registered (alle Registered-Features sind in Premium enthalten). Der User kauft einen Premium-Pass und das Monatsabo wird beendet. Die Restlaufzeit des aktuellen Monats wird als Guthaben angerechnet (pro-rata).

- Kein zusätzlicher Rabatt nötig — der User spart die 3,90 €/Monat automatisch

#### 2. Registered Lifetime (14,90 €) → Premium

Loyalty-Rabatt als Anerkennung der Einmalzahlung. Die Registered-Features bleiben permanent aktiv — auch wenn der Premium-Pass abläuft, fällt der User auf Registered Lifetime zurück (nicht auf Guest).

| Premium-Produkt | Normalpreis | Upgrade-Preis | Ersparnis |
| :--- | ---: | ---: | :--- |
| **Premium 1-Monats-Pass** | 9,90 € | 7,90 € | ~20% |
| **Premium 3-Monats-Pass** | 24,90 € | 18,90 € | ~24% |
| **Premium 1-Jahres-Pass** | 79,90 € | 59,90 € | ~25% |

#### 3. Bot-Unlock (3,90 €) → Premium

Der Einzelbot-Kaufpreis wird als Guthaben auf den ersten Premium-Pass angerechnet.

| Premium-Produkt | Normalpreis | Mit 1 Bot-Unlock | Mit 2 Bot-Unlocks |
| :--- | ---: | ---: | ---: |
| **Premium 1-Monats-Pass** | 9,90 € | 6,00 € | 2,10 € |
| **Premium 3-Monats-Pass** | 24,90 € | 21,00 € | 17,10 € |
| **Premium 1-Jahres-Pass** | 79,90 € | 76,00 € | 72,10 € |

#### 4. Registered Lifetime + Bot-Unlock → Premium

Für die loyalsten User: Loyalty-Rabatt und Bot-Guthaben werden kumuliert.

| Premium-Produkt | Normalpreis | Lifetime + 1 Bot | Lifetime + 2 Bots |
| :--- | ---: | ---: | ---: |
| **Premium 1-Monats-Pass** | 9,90 € | 4,00 € | 0,10 € |
| **Premium 3-Monats-Pass** | 24,90 € | 15,00 € | 11,10 € |
| **Premium 1-Jahres-Pass** | 79,90 € | 56,00 € | 52,10 € |

#### 5. Guest → Premium (direkt)

Kein Rabatt. Premium enthält bereits alle Registered-Features. Der User spart sich die Registered-Kosten und steigt direkt ein.

#### Prinzipien

1. **Kein Buyer's Remorse** — Frühere Investitionen werden als Guthaben oder Rabatt anerkannt
2. **Fallback-Sicherheit** — Registered Lifetime bleibt aktiv wenn Premium abläuft
3. **Kumulierbar** — Loyalty-Rabatt und Bot-Guthaben stapeln sich
4. **Einfach kommunizierbar** — "Deine bisherigen Käufe werden angerechnet"
5. **Technisch umsetzbar** — PayPal Custom IDs erlauben Tracking früherer Käufe

### Implementierungsstand (v1.9.1)

| Feature | Status | Details |
| :--- | :---: | :--- |
| **28-Tage Trial** | ✅ | `accessExpiresAt` bei Registrierung gesetzt |
| **Paywall (abgelaufene User)** | ✅ | Responsive 2-Spalten-Layout, PayPal + Code |
| **PayPal Direct Checkout** | ✅ | €14.90 Registered Lifetime (Web only, hidden on iOS) |
| **Bot-Code-Sperre bei Ablauf** | ✅ | Server blockiert Bot-Codes, zeigt Warnung |
| **Paywall-Bypass-Schutz** | ✅ | Burger-Menü bei Paywall-View versteckt |
| **Registered Monatsabo** | ❌ | Noch nicht implementiert (3,90 €/Monat) |
| **Premium-Pässe (PayPal)** | ❌ | Upgrade-UI und Backend-Endpoints fehlen |
| **Bot-Unlock (PayPal)** | ❌ | Einzelkauf Kenji/Chloe fehlt |
| **Upgrade-Rabatte** | ❌ | Loyalty-Rabatt-Logik fehlt |
| **iOS In-App Purchase** | ❌ | Apple StoreKit-Integration geplant (siehe Sektion unten) |
| **Referral-Programm** | ❌ | 1 Monat gratis für Einladung eines zahlenden Users |
| **Team/Unternehmenslizenz** | ❌ | Firmentarif für 10+ User mit Admin-Dashboard |
| **Jährliche Abrechnung** | ❌ | Automatisches Abo (PayPal Subscriptions API) |

---

## iOS In-App Purchase (Geplant)

### Plattform-Strategie

- **iOS (Capacitor App):** Native In-App Purchases via StoreKit 2
- **Web-Browser:** PayPal bleibt bestehen (externer Link + Upgrade-Codes)
- PayPal-Links werden in der iOS-Version ausgeblendet (Apple Guideline 3.1.1)

### App Store Produkt-Mapping

#### Subscription Group: "Meaningful Conversations Access"

| Level | App Store Product ID | Typ | iOS-Preis | Web-Preis | Netto (15%) | Tier |
| :--- | :--- | :--- | ---: | ---: | ---: | :--- |
| 1 | `mc.registered.monthly` | Auto-Renewable | 3,99 €/Mo | 3,90 €/Mo | ~3,39 € | Registered |
| 2 | `mc.premium.monthly` | Auto-Renewable | 9,99 €/Mo | 9,90 €/Mo | ~8,49 € | Premium |
| 3 | `mc.premium.yearly` | Auto-Renewable | 79,99 €/Jr | 79,90 €/Jr | ~67,99 € | Premium |

#### Non-Consumable Purchases

| App Store Product ID | Typ | iOS-Preis | Web-Preis | Netto (15%) | Effekt |
| :--- | :--- | ---: | ---: | ---: | :--- |
| `mc.registered.lifetime` | Non-Consumable | 14,99 € | 14,90 € | ~12,74 € | Permanent Registered |
| `mc.coach.kenji` | Non-Consumable | 3,99 € | 3,90 € | ~3,39 € | Kenji Unlock (permanent) |
| `mc.coach.chloe` | Non-Consumable | 3,99 € | 3,90 € | ~3,39 € | Chloe Unlock (permanent) |

#### Nicht als IAP verfügbar

- **Premium 3-Monats-Pass** — ersetzt durch Auto-Renewable Subscriptions
- **Upgrade-Produkte** — Apple Subscription Offers / Promotional Offers statt separater Produkte
- **Client-Zugang** — weiterhin per Admin-Code

### Preisdifferenz Web vs. iOS

Apple Small Business Program (Umsatz < 1M USD/Jahr): **15% Provision**. iOS-Preise sind leicht höher, um die Provision zu kompensieren. Web-Nutzer profitieren vom günstigeren PayPal-Preis.

### Product ID → Internal ID Mapping

| App Store Product ID | Internal botId / Effekt |
| :--- | :--- |
| `mc.registered.monthly` | Registered-Tier setzen, `accessExpiresAt` +30d |
| `mc.premium.monthly` | Entspricht `ACCESS_PASS_1M`, `isPremium`, `accessExpiresAt` +30d |
| `mc.premium.yearly` | Entspricht `ACCESS_PASS_1Y`, `isPremium`, `accessExpiresAt` +365d |
| `mc.registered.lifetime` | Entspricht `REGISTERED_LIFETIME`, permanent |
| `mc.coach.kenji` | `kenji-stoic` zu `unlockedCoaches` hinzugefügt |
| `mc.coach.chloe` | `chloe-cbt` zu `unlockedCoaches` hinzugefügt |

### Implementierungsdetails

Vollständige technische Dokumentation: `.cursor/skills/meaningful-conversations/in-app-purchase/SKILL.md`

---

## Notes on Data Storage

*   **Guest:** All data (Life Context, Chat History, Settings) is stored in the browser's `localStorage`. Clearing browser data results in data loss.
*   **Registered/Premium/Client:** Life Context and Personality Profiles are encrypted client-side (E2EE) before being sent to the server. The server (and Admins) cannot read this content.

## Notes on Crisis Response

*   **All bots** include a Crisis Detection & Response Protocol in their system prompts. When a user expresses signs of emotional crisis (suicidal thoughts, extreme hopelessness, self-harm), the bot follows a two-step verification process and then provides crisis helpline numbers and a referral to manualmode.at for professional human coaching support. This safety feature is active for **all user types**, including guests.

## Notes on DPFL (Dynamic Prompt & Feedback Learning)

*   DPFL requires a persistent history of session analyses to "learn" and adapt the coaching style. Therefore, it is only fully effective for registered users where this history is securely stored and synchronized.
