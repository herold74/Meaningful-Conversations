# User Types and Feature Access Matrix

This document outlines the different user types within the Meaningful Conversations application, their respective access levels, and a recommended pricing structure.

**Last Updated**: February 15, 2026 — v1.8.8

## User Types

1.  **Guest (Gast)**: Unregistered users who can try out the application with limited features. Data is stored locally in the browser.
2.  **Registered User (Registrierter Nutzer)**: Users who have created an account. They benefit from cloud synchronization and E2EE storage but have limited bot access unless they upgrade.
3.  **Premium User (Premium Nutzer)**: Registered users with an active subscription or a redeemed access pass. They have full access to all bots (except Rob & Victor) and advanced features including DPFL.
4.  **Client (Klient)**: Registered users who have been granted access to specific advanced coaches (Rob, Victor) and have full access to all bots, DPFL, and exclusive features like Transcript Evaluation.
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
| **Coaching Bots** | | | | | | |
| **Gloria** (Onboarding) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Nobody** (Management & Kommunikation) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Max** (Ambitioniert) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Ava** (Strategisch) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Kenji** (Stoisch) | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Chloe** (Strukturierte Reflexion) | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Rob** (Mentale Fitness) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Victor** (Systemisch) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Advanced Features** | | | | | | |
| DPC (Dynamic Prompt Composition) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| DPFL (Adaptive Learning) | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Comfort Check (DPFL) | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| PEP Solution Blockages (Dr. Bohne) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Transcript Evaluation | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Transcript Evaluation PDF Export | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Bot Recommendations (in Evaluation) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Crisis Response (Helplines) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Administration** | | | | | | |
| Admin Panel Access | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| User Management | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Upgrade Code Generation | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| API Usage Monitoring | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Transcript Ratings Overview | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Test Runner | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

## Bot Tier Summary

| Tier | Bots | Label |
| :--- | :--- | :--- |
| **Guest/Free** (Bronze) | Gloria, Nobody, Max, Ava | Management & Kommunikation |
| **Premium** (Silver) | Kenji, Chloe | Coaching |
| **Client** (Gold) | Rob, Victor | Exklusiv für Klienten |

## Access Pass Products (PayPal)

| Product | Custom ID | Duration | Tier Granted |
| :--- | :--- | :--- | :--- |
| 1-Monats-Pass | `ACCESS_PASS_1M` | 30 Tage | Premium |
| 3-Monats-Pass | `ACCESS_PASS_3M` | 90 Tage | Premium |
| 1-Jahres-Pass | `ACCESS_PASS_1Y` | 365 Tage | Premium |
| Kenji Coach Unlock | `KENJI_UNLOCK` | Permanent | Kenji (einzeln) |
| Chloe Coach Unlock | `CHLOE_UNLOCK` | Permanent | Chloe (einzeln) |

---

## Empfehlung: Kostenstruktur

### Grundprinzipien

1. **Kostenlose Einstiegshürde niedrig halten** — Guest/Free-User bekommen 4 vollwertige Bots (Gloria, Nobody, Max, Ava) und können die App sofort nutzen.
2. **Wert vor Paywall demonstrieren** — Registrierte User erhalten Cloud-Sync, Persönlichkeitsprofil (OCEAN), Narrative Signature und DPC. Das reicht, um den Mehrwert der App zu erleben.
3. **Premium als natürlicher Aufstieg** — Wer tiefer arbeiten möchte (Riemann, Spiral Dynamics, DPFL, Kenji, Chloe), steigt auf Premium um.
4. **Client als Begleitung** — Klienten arbeiten mit einem menschlichen Coach zusammen; Rob, Victor, Transcript Evaluation und PEP sind Werkzeuge für diese professionelle Beziehung.

### Empfohlene Preisstruktur

| Produkt | Empfohlener Preis | Zielgruppe | Begründung |
| :--- | ---: | :--- | :--- |
| **Registrierung** | Kostenlos | Alle | Senkt Hürde, erhöht Nutzerbindung |
| **1-Monats-Pass** | 9,90 € | Neugierige / Testphase | Niedriger Einstiegspreis, Kennenlernen von Kenji & Chloe, DPFL |
| **3-Monats-Pass** | 24,90 € | Aktive Nutzer | ~17% Ersparnis ggü. monatlich; genug Zeit für DPFL-Effekt |
| **1-Jahres-Pass** | 79,90 € | Power-User | ~33% Ersparnis ggü. monatlich; stärkste Bindung |
| **Einzelner Bot-Unlock** | 4,90 € | Gezieltes Interesse | Kenji ODER Chloe einzeln freischalten (permanent) |
| **Client-Zugang** | Individuell | Coaching-Klienten | Wird vom Coach vergeben, nicht käuflich |

### Begründung der Preisempfehlung

**Positionierung:** Die App positioniert sich zwischen kostenlosen Chat-Tools und professionellem Coaching (80–150 €/Stunde). Bei 9,90 €/Monat liegt der Preis im Bereich typischer Self-Improvement-Apps (Headspace: 12,99 €, Calm: 14,99 €), bietet aber personalisierten AI-Coaching-Zugang.

**API-Kosten als Untergrenze:**
- Gemini 2.5 Flash: ~0,075 $/1M Input-Tokens → Bei durchschnittlich 20 Sitzungen/Monat à 8.000 Tokens ≈ 0,02 $ pro User/Monat
- Gemini 2.5 Pro (Transcript Evaluation): ~1,25 $/1M Input-Tokens → teurer, aber nur für Client-Tier
- TTS-Kosten (Server-seitig) kommen hinzu
- **Marge bei 9,90 €/Monat ist komfortabel**, selbst bei intensiver Nutzung

**Einzelne Bot-Unlocks (4,90 €):**
- Für Nutzer, die nur einen bestimmten Coach wollen, ohne Full-Premium
- Permanent → kein Abo-Druck
- Einstiegsdroge: Wer Kenji mag, wird wahrscheinlich auf Premium upgraden

**Client-Zugang nicht käuflich:**
- Schützt die therapeutische Integrität der Client-Bots (Rob, Victor)
- Transcript Evaluation erfordert professionellen Kontext
- Wird durch den Coach per Code freigeschaltet

### Upselling-Pfad

```
Guest → Registrierung (kostenlos)
  → Erlebt: 4 Bots, Chat, Voice, Life Context
  → Trigger: Persönlichkeitsprofil Riemann/SD gesperrt, DPFL gesperrt

Registered → Premium (9,90 €/Monat oder Pass)
  → Erlebt: Kenji, Chloe, Riemann, SD, DPFL, Comfort Check
  → Trigger: Transcript Evaluation gesperrt, Rob/Victor gesperrt

Premium → Client (durch Coach vergeben)
  → Erlebt: Alles — inkl. Transcript Evaluation, Rob, Victor, PEP
```

### Noch nicht implementiert / Empfehlungen für die Zukunft

- **Trial-Periode**: 7 Tage Premium kostenlos nach Registrierung (kein Zahlungsmittel nötig)
- **Referral-Programm**: 1 Monat gratis für Einladung eines zahlenden Users
- **Team/Unternehmenslizenz**: Firmentarif für 10+ User mit Admin-Dashboard
- **Jährliche Abrechnung**: Automatisches Abo statt manuellem Pass-Kauf (PayPal Subscriptions API)

---

## Notes on Data Storage

*   **Guest:** All data (Life Context, Chat History, Settings) is stored in the browser's `localStorage`. Clearing browser data results in data loss.
*   **Registered/Premium/Client:** Life Context and Personality Profiles are encrypted client-side (E2EE) before being sent to the server. The server (and Admins) cannot read this content.

## Notes on Crisis Response

*   **All bots** include a Crisis Detection & Response Protocol in their system prompts. When a user expresses signs of emotional crisis (suicidal thoughts, extreme hopelessness, self-harm), the bot follows a two-step verification process and then provides crisis helpline numbers and a referral to manualmode.at for professional human coaching support. This safety feature is active for **all user types**, including guests.

## Notes on DPFL (Dynamic Prompt & Feedback Learning)

*   DPFL requires a persistent history of session analyses to "learn" and adapt the coaching style. Therefore, it is only fully effective for registered users where this history is securely stored and synchronized.
