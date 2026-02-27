# UX Flows — Meaningful Conversations v1.9.9

Dieses Dokument beschreibt die User Experience fuer alle Benutzertypen als visuelle Flow-Diagramme.

**Zuletzt aktualisiert:** 27. Februar 2026

---

## Uebersicht der Benutzertypen

| Typ | Beschreibung | Einstieg |
|:---|:---|:---|
| **Gast** | Unregistriert, Daten nur lokal | "Als Gast fortfahren" |
| **Registriert (Neu)** | Frisch registriert, 9-Tage Premium-Trial | Registrierung + E-Mail-Verifizierung |
| **Registriert (Wiederkehrend)** | Hat Lebenskontext + Profil | Login |
| **Registriert (Trial abgelaufen)** | 9-Tage-Trial vorbei, kein Kauf | Login → Paywall |
| **Premium** | Aktives Abo oder Pass | Login |
| **Klient** | Coaching-Klient bei manualmode.at | Login (vom Coach freigeschaltet) |
| **Admin / Developer** | Verwaltungszugang | Login → Admin-Panel |

---

## Screenshots (Guest-Flow)

Die folgenden Screenshots dokumentieren den vollstaendigen Guest-Flow der Web-Version:

| Nr. | Bildschirm | Datei |
|:---|:---|:---|
| 1 | AuthView (Willkommen) | `screenshots/01-auth-welcome.png` |
| 2 | IntentPickerView | `screenshots/02-intent-picker.png` |
| 3 | NamePromptView | `screenshots/03-name-prompt.png` |
| 4 | LandingPage (mit Life-Context-Template) | `screenshots/04-landing-page-guest.png` |
| 5 | BotSelection (Management + Coaching) | `screenshots/05-bot-selection-guest.png` |
| 6 | BotSelection (Gesperrte Premium-Bots) | `screenshots/06-bot-selection-locked.png` |
| 7 | BotSelection (Klienten-Sektion) | `screenshots/07-bot-selection-client-locked.png` |

---

## 1. App-Start (alle User)

```mermaid
flowchart TD
    START([App oeffnen]) --> WELCOME[WelcomeScreen<br/>Logo + Ladeanimation]
    WELCOME -->|Session vorhanden?| CHECK{Gespeicherte<br/>Session?}
    CHECK -->|Ja| AUTO_LOGIN[Automatischer Login<br/>Session wiederherstellen]
    CHECK -->|Nein| AUTH[AuthView<br/>Willkommen-Bildschirm]

    AUTO_LOGIN --> ACCESS{Zugang<br/>gueltig?}
    ACCESS -->|Ja| LOGIN_SUCCESS[handleLoginSuccess]
    ACCESS -->|Nein / Abgelaufen| EXPIRED[handleAccessExpired]

    AUTH --> LOGIN_BTN[Anmelden]
    AUTH --> REGISTER_BTN[Registrieren]
    AUTH --> GUEST_BTN[Als Gast fortfahren]

    LOGIN_BTN --> LOGIN_VIEW[LoginView]
    REGISTER_BTN --> REGISTER_VIEW[RegisterView]
    GUEST_BTN --> GUEST_START[Gast-Flow starten]

    style WELCOME fill:#e8f5e9
    style AUTH fill:#e3f2fd
    style EXPIRED fill:#fff3e0
```

---

## 2. Gast-Flow

```mermaid
flowchart TD
    GUEST_START([Als Gast fortfahren]) --> CLEAR[guestName loeschen<br/>lifeContext leeren]
    CLEAR --> INTENT[IntentPickerView<br/>'Was moechten Sie heute erreichen?']

    INTENT -->|Kommunikation| INTENT_COMM[Intent = communication]
    INTENT -->|Coaching| INTENT_COACH[Intent = coaching]
    INTENT -->|Begleitendes Coaching| INTENT_LIFE[Intent = lifecoaching]

    INTENT_COMM --> HAS_NAME_C{guestName<br/>vorhanden?}
    INTENT_COACH --> HAS_NAME_CO{guestName<br/>vorhanden?}
    INTENT_LIFE --> HAS_NAME_L{guestName<br/>vorhanden?}

    HAS_NAME_C -->|Nein| NAME_PROMPT[NamePromptView<br/>'Wie heissen Sie?']
    HAS_NAME_CO -->|Nein| NAME_PROMPT
    HAS_NAME_L -->|Nein| NAME_PROMPT

    HAS_NAME_C -->|Ja| LANDING_C[LandingPage<br/>Highlight: Management-Sektion]
    HAS_NAME_CO -->|Ja| BOT_SEL_CO[BotSelection<br/>Highlight: TopicSearch]
    HAS_NAME_L -->|Ja| BOT_SEL_L[BotSelection<br/>Highlight: TopicSearch]

    NAME_PROMPT -->|Name eingeben| TEMPLATE[Minimales Life-Context-Template<br/>mit Name generieren]
    NAME_PROMPT -->|Ueberspringen| LANDING_SKIP[LandingPage<br/>ohne Name]

    TEMPLATE --> LANDING_NAME[LandingPage]
    LANDING_NAME --> EXPLORE[App erkunden<br/>3 Bots verfuegbar:<br/>Nobody, Max, Ava]

    LANDING_SKIP --> EXPLORE

    style GUEST_START fill:#e8f5e9
    style INTENT fill:#fff9c4
    style NAME_PROMPT fill:#fce4ec
    style EXPLORE fill:#e1f5fe
```

### Gast: Verfuegbare Features

| Feature | Verfuegbar | Hinweis |
|:---|:---:|:---|
| Chat mit Nobody, Max, Ava | Ja | Vollwertiges Coaching |
| Voice Mode (Web Speech) | Ja | Browser-TTS |
| Server TTS (hohe Qualitaet) | Nein | Nur registriert |
| Lebenskontext | Ja | Nur lokal im Browser |
| Persoenlichkeitsprofil | Nein | Registrierung noetig |
| Cloud-Sync | Nein | Daten gehen bei Browser-Reset verloren |
| Coach-Empfehlung | Nein | Anmelde-Hinweis stattdessen |

---

## 3. Registrierung (Neuer User)

```mermaid
flowchart TD
    REG_START([Registrieren]) --> REG_FORM[RegisterView<br/>Name, E-Mail, Passwort]
    REG_FORM --> PENDING[RegistrationPendingView<br/>'Bestaetigen Sie Ihre E-Mail']
    PENDING --> VERIFY[VerifyEmailView<br/>Token aus E-Mail-Link]
    VERIFY -->|Erfolgreich| LOGIN_SUCCESS[handleLoginSuccess<br/>9-Tage Premium-Trial aktiv]

    LOGIN_SUCCESS --> WELCOME_SPLASH[WelcomeScreen<br/>Kurz sichtbar]
    WELCOME_SPLASH --> LOAD_DATA[Nutzerdaten laden<br/>Lebenskontext, Gamification]
    LOAD_DATA --> ROUTE[routeWithIntentPicker<br/>hasContext = false]

    ROUTE --> PICKER_CHECK{IntentPicker<br/>deaktiviert?}
    PICKER_CHECK -->|Nein<br/>Erster Besuch| INTENT[IntentPickerView]
    PICKER_CHECK -->|Ja| NAME[NamePromptView<br/>Kein Kontext vorhanden]

    INTENT -->|Intent gewaehlt| HAS_LC{Lebenskontext<br/>vorhanden?}
    HAS_LC -->|Nein| NAME

    NAME -->|Name eingeben| SAVE_LC[Life-Context-Template<br/>erstellen und verschluesselt speichern]
    SAVE_LC --> HAS_PROFILE{Persoenlichkeits-<br/>profil vorhanden?}

    HAS_PROFILE -->|Nein| OCEAN[OceanOnboarding<br/>'Entdecken Sie Ihr<br/>Persoenlichkeitsprofil']
    HAS_PROFILE -->|Ja| LANDING[LandingPage]

    OCEAN -->|Abschliessen| SAVE_OCEAN[OCEAN-Profil speichern<br/>verschluesselt]
    OCEAN -->|Ueberspringen| LANDING
    SAVE_OCEAN --> PROFILE_HINT_CHECK{Premium +<br/>OCEAN fertig +<br/>SD/Riemann fehlt?}

    PROFILE_HINT_CHECK -->|Ja<br/>Im Trial| PROFILE_HINT[ProfileHintView<br/>'Vertiefen Sie Ihr Profil']
    PROFILE_HINT_CHECK -->|Nein| INTENT_LOGIC[Intent-basiertes Routing]

    PROFILE_HINT -->|Entdecken| SURVEY[PersonalitySurvey<br/>Riemann oder SD]
    PROFILE_HINT -->|Spaeter| INTENT_LOGIC
    PROFILE_HINT -->|Nicht mehr zeigen| INTENT_LOGIC

    INTENT_LOGIC --> BOT_OR_CONTEXT{Intent?}
    BOT_OR_CONTEXT -->|communication| BOT_SEL_M[BotSelection<br/>Management hervorgehoben]
    BOT_OR_CONTEXT -->|coaching / lifecoaching| BOT_SEL_T[BotSelection<br/>TopicSearch hervorgehoben]
    BOT_OR_CONTEXT -->|kein Intent| LANDING

    style REG_START fill:#e8f5e9
    style OCEAN fill:#f3e5f5
    style PROFILE_HINT fill:#fff3e0
    style INTENT fill:#fff9c4
```

---

## 4. Login: Wiederkehrender Registrierter User

```mermaid
flowchart TD
    LOGIN_START([Anmelden]) --> LOGIN[LoginView<br/>E-Mail + Passwort]
    LOGIN -->|Erfolgreich| SUCCESS[handleLoginSuccess]

    SUCCESS --> WELCOME[WelcomeScreen]
    WELCOME --> LOAD[Nutzerdaten laden]
    LOAD --> ROUTE[routeWithIntentPicker<br/>hasContext = true]

    ROUTE --> PICKER{IntentPicker<br/>deaktiviert?}
    PICKER -->|Nein| INTENT[IntentPickerView]
    PICKER -->|Ja + Profil vorhanden| CONTEXT_CHOICE[ContextChoiceView<br/>'Vorherigen Kontext laden<br/>oder neu starten?']

    INTENT -->|Intent gewaehlt| HAS_ALL{LC + Profil<br/>vorhanden?}
    HAS_ALL -->|Ja| HINT_CHECK{Profile Hint<br/>anzeigen?}
    HAS_ALL -->|Nur LC, kein Profil| OCEAN[OceanOnboarding]
    OCEAN --> HINT_CHECK

    HINT_CHECK -->|Ja: Premium + OCEAN + fehlt SD/Riemann| HINT[ProfileHintView]
    HINT_CHECK -->|Nein| APPLY[Intent-Routing]

    HINT -->|Spaeter / Deaktivieren| APPLY
    HINT -->|Entdecken| SURVEY[PersonalitySurvey]

    APPLY --> DEST{Intent?}
    DEST -->|communication| BOT_M[BotSelection<br/>Management]
    DEST -->|coaching / lifecoaching| BOT_T[BotSelection<br/>TopicSearch]
    DEST -->|keiner| CONTEXT_CHOICE

    CONTEXT_CHOICE --> CONTINUE[Weiter mit gespeichertem Kontext]
    CONTEXT_CHOICE --> NEW[Neu starten - LandingPage]

    CONTINUE --> BOT_SELECT[BotSelection]
    NEW --> LANDING[LandingPage]

    style LOGIN_START fill:#e3f2fd
    style CONTEXT_CHOICE fill:#e8f5e9
    style HINT fill:#fff3e0
```

---

## 5. Login: Trial abgelaufen (Paywall)

```mermaid
flowchart TD
    LOGIN([Anmelden]) --> CHECK[LoginView prueft<br/>accessExpiresAt]
    CHECK -->|Abgelaufen| EXPIRED[handleAccessExpired]

    EXPIRED --> WELCOME[WelcomeScreen]
    WELCOME --> LOAD[Nutzerdaten + RevenueCat sync]
    LOAD --> RC_SYNC{RevenueCat:<br/>Zugang wiederhergestellt?}

    RC_SYNC -->|Ja: Abo gefunden| RESTORED[routeWithIntentPicker<br/>Normaler Flow]
    RC_SYNC -->|Nein: Kein aktives Abo| PAYWALL[PaywallView]

    PAYWALL --> OPTIONS{Plattform?}

    OPTIONS -->|iOS| IOS_OPTIONS[Native In-App Purchase<br/>RevenueCat / StoreKit 2]
    OPTIONS -->|Web| WEB_OPTIONS[PayPal Checkout<br/>oder Code eingeben]

    IOS_OPTIONS --> IAP_PRODUCTS[Produktauswahl:<br/>Registered Monthly 3,99 EUR<br/>Premium Monthly 9,99 EUR<br/>Premium Yearly 79,99 EUR<br/>Registered Lifetime 14,99 EUR]
    WEB_OPTIONS --> PAYPAL[PayPal-Link<br/>oder Upgrade-Code]

    IAP_PRODUCTS -->|Kauf erfolgreich| PURCHASE_SUCCESS[onPurchaseSuccess<br/>User aktualisieren]
    PAYPAL -->|Code eingeloest| PURCHASE_SUCCESS

    PURCHASE_SUCCESS --> ROUTE[routeWithIntentPicker]

    PAYWALL --> DOWNLOAD[Daten herunterladen<br/>Life Context + Profil als Backup]
    PAYWALL --> CODE[Code eingeben]
    CODE -->|Gueltig| PURCHASE_SUCCESS

    style PAYWALL fill:#ffebee
    style PURCHASE_SUCCESS fill:#e8f5e9
    style RC_SYNC fill:#fff9c4
```

### Paywall: Produktuebersicht

| Produkt | iOS (IAP) | Web (PayPal) | Tier |
|:---|---:|---:|:---|
| Registered Monthly | 3,99 EUR/Mo | 3,90 EUR/Mo | Registered |
| Registered Lifetime | 14,99 EUR | 14,90 EUR | Registered (permanent) |
| Premium Monthly | 9,99 EUR/Mo | 9,90 EUR/Mo | Premium |
| Premium Yearly | 79,99 EUR/Jr | 79,90 EUR/Jr | Premium |
| Kenji Unlock | 3,99 EUR | 3,90 EUR | Einzelbot |
| Chloe Unlock | 3,99 EUR | 3,90 EUR | Einzelbot |

---

## 6. Premium User

```mermaid
flowchart TD
    LOGIN([Anmelden]) --> SUCCESS[handleLoginSuccess<br/>isPremium = true]
    SUCCESS --> WELCOME[WelcomeScreen]
    WELCOME --> LOAD[Nutzerdaten laden]
    LOAD --> ROUTE[routeWithIntentPicker<br/>hasContext = true]

    ROUTE --> PICKER{IntentPicker<br/>deaktiviert?}
    PICKER -->|Nein| INTENT[IntentPickerView]
    PICKER -->|Ja| CONTEXT[ContextChoiceView]

    INTENT -->|Intent gewaehlt| HINT_CHECK{OCEAN fertig +<br/>SD oder Riemann fehlt?}
    HINT_CHECK -->|Ja| HINT[ProfileHintView<br/>'Vertiefen Sie Ihr Profil<br/>mit Riemann-Thomann<br/>oder Spiral Dynamics']
    HINT_CHECK -->|Nein| APPLY[Intent-Routing]

    HINT -->|Entdecken| SURVEY[PersonalitySurvey<br/>Riemann-Thomann oder<br/>Spiral Dynamics]
    HINT -->|Spaeter| APPLY
    HINT -->|Nicht mehr zeigen| APPLY

    APPLY --> DEST{Intent?}
    DEST -->|communication| BOT_M[BotSelection<br/>6 Bots verfuegbar:<br/>+ Kenji, Chloe]
    DEST -->|coaching / lifecoaching| BOT_T[BotSelection<br/>TopicSearch + DPFL aktiv]

    style LOGIN fill:#e3f2fd
    style HINT fill:#fff3e0
    style BOT_M fill:#e8f5e9
    style BOT_T fill:#e8f5e9
```

### Premium: Zusaetzliche Features (gegenueber Registered)

| Feature | Registriert | Premium |
|:---|:---:|:---:|
| Kenji (Stoisch) | Gesperrt | Freigeschaltet |
| Chloe (Strukturierte Reflexion) | Gesperrt | Freigeschaltet |
| Riemann-Thomann Profil | Gesperrt | Freigeschaltet |
| Spiral Dynamics Profil | Gesperrt | Freigeschaltet |
| DPFL (Adaptive Learning) | Gesperrt | Freigeschaltet |
| Comfort Check | Gesperrt | Freigeschaltet |
| Transkript-Auswertung | Gesperrt | Freigeschaltet |
| Transkript-PDF-Export | Gesperrt | Freigeschaltet |

---

## 7. Klient

```mermaid
flowchart TD
    LOGIN([Anmelden]) --> SUCCESS[handleLoginSuccess<br/>isClient = true]
    SUCCESS --> WELCOME[WelcomeScreen]
    WELCOME --> LOAD[Nutzerdaten laden]
    LOAD --> ROUTE[routeWithIntentPicker]

    ROUTE --> PICKER{IntentPicker<br/>deaktiviert?}
    PICKER -->|Nein| INTENT[IntentPickerView]
    PICKER -->|Ja| CONTEXT[ContextChoiceView]

    INTENT -->|Intent gewaehlt| APPLY[Intent-Routing]
    APPLY --> DEST{Intent?}

    DEST -->|communication| BOT_M[BotSelection<br/>Alle 8 Bots verfuegbar:<br/>+ Rob, Victor]
    DEST -->|coaching / lifecoaching| BOT_T[BotSelection<br/>DPFL + PEP + Audio]

    BOT_M --> CHAT[ChatView<br/>Voller Funktionsumfang]
    BOT_T --> CHAT

    CHAT --> REVIEW[SessionReview]
    CHAT --> EVAL[Transkript-Auswertung<br/>inkl. Audio-Upload-Tab]

    style LOGIN fill:#e3f2fd
    style BOT_M fill:#fff8e1
    style BOT_T fill:#fff8e1
```

### Klient: Exklusive Features

| Feature | Nur Klient |
|:---|:---|
| Rob (Mentale Fitness) | Exklusiv |
| Victor (Systemisch) | Exklusiv |
| PEP Loesungsblockaden | Exklusiv |
| Audio-Transkription (Upload) | Exklusiv |

---

## 8. Admin / Developer

```mermaid
flowchart TD
    LOGIN([Anmelden]) --> SUCCESS[handleLoginSuccess<br/>isAdmin = true]
    SUCCESS --> WELCOME[WelcomeScreen]
    WELCOME --> LOAD[Nutzerdaten laden]

    LOAD --> PREF{adminStartupPref?}
    PREF -->|'admin' oder nicht gesetzt| ADMIN[AdminView<br/>Verwaltungspanel]
    PREF -->|'normal'| ROUTE[routeWithIntentPicker<br/>Normaler User-Flow]

    ADMIN --> MGMT[User Management<br/>Code-Generierung<br/>API-Monitoring<br/>Ratings-Uebersicht]

    ROUTE --> INTENT[IntentPickerView]
    INTENT --> NORMAL_FLOW[Normaler App-Flow<br/>Vollzugang zu allen Bots]

    style ADMIN fill:#ede7f6
    style PREF fill:#fff9c4
```

### Visual Redesign (Brand-Driven Design System)
Seit v1.9.6 nutzt die App ein markengesteuertes Design-System mit White-Label-Unterstuetzung:
- **Farben:** 4-stufige Markenpallette + Akzentfarbe (definiert über CSS-Variablen, per Brand konfigurierbar).
- **Typografie:** Inter Variable Font.
- **Komponenten:** Abgerundete Karten, schwebende Schatten, Pill-Buttons.
- **Animationen:** Framer Motion für weiche Übergänge.
- **White-Label:** W4F (Work4Flow) als erste Zusatzmarke mit eigenem Farbschema und Loader.

Admins und Developer koennen in den Einstellungen (`AdminView`) waehlen:
- **Admin-Panel** (Standard): Direkt zum Verwaltungsbereich
- **Normaler Start**: Wie ein regulaerer User mit Intent Picker

Die Praeferenz wird in `localStorage.adminStartupPref` gespeichert.

---

## 9. Intent-basiertes Routing (Detail)

```mermaid
flowchart TD
    INTENT[IntentPickerView] --> SELECT{User waehlt Intent}

    SELECT -->|Kommunikation| COMM[intent = 'communication'<br/>highlight = 'management']
    SELECT -->|Coaching| COACH[intent = 'coaching'<br/>highlight = 'topicSearch']
    SELECT -->|Begl. Coaching| LIFE[intent = 'lifecoaching'<br/>highlight = 'topicSearch']

    COMM --> BS_MGMT[BotSelection<br/>Management-Sektion hervorgehoben:<br/>Suchfeld + Sektions-Header]
    COACH --> BS_TOPIC[BotSelection<br/>TopicSearch hervorgehoben]
    LIFE --> BS_TOPIC

    BS_MGMT --> BOT_TILES[Bot-Kacheln anzeigen<br/>Hervorhebung = Suchfeld +<br/>zugehoeriger Sektions-Header<br/>Pulsierender Ring, Shadow, 8s Dauer]
    BS_TOPIC --> BOT_TILES

    INTENT -->|Permanent ueberspringen| SKIP{Kontext?}
    SKIP -->|Kein Kontext| NAME[NamePromptView]
    SKIP -->|Kontext, kein Profil| OCEAN[OceanOnboarding]
    SKIP -->|Kontext + Profil| CC[ContextChoiceView]

    style INTENT fill:#fff9c4
    style BS_MGMT fill:#e8eaf6
    style BS_TOPIC fill:#e8eaf6
```

### Intent-Beschreibungen

| Intent | Deutsch | Englisch | Ziel-Sektion |
|:---|:---|:---|:---|
| Kommunikation | "Bereiten Sie schwierige Gespraeche vor" | "Prepare for difficult conversations" | Management & Kommunikation |
| Coaching | "Arbeiten Sie an Ihren persoenlichen Zielen" | "Work on your personal goals" | TopicSearch (Coaching) |
| Begleitendes Coaching | "Professionelles Coaching mit KI-Unterstuetzung" | "Professional coaching with AI support" | TopicSearch (Coaching) |

---

## 10. Onboarding-Komponenten (Detail)

### 10.1 IntentPickerView

- **Anzeige:** Drei Karten mit Icon, Titel, Beschreibung
- **"Nicht mehr anzeigen":** Setzt `intentPickerDisabled = true` in localStorage
- **Positionierung:** Zentriert, etwas tiefer als Bildschirmmitte
- **Animation:** Framer Motion fade-in

### 10.2 NamePromptView

- **Fuer Gaeste:** Name optional (Ueberspringen moeglich), wird in `localStorage.guestName` gespeichert
- **Fuer Registrierte:** Name erforderlich (kein Ueberspringen), wird in verschluesselten Lebenskontext integriert
- **Template:** Generiert minimales Life-Context-Template mit allen Ueberschriften (auch wenn nur Name ausgefuellt)
- **Anzeige:** Wenn bereits ein Lebenskontext existiert, wird der Name nicht erneut abgefragt

### 10.3 OceanOnboarding

- **Trigger:** Registrierte User ohne Persoenlichkeitsprofil
- **Inhalt:** Kurzversion des Big-5 (OCEAN) Fragebogens
- **Ergebnis:** Verschluesseltes Profil wird gespeichert
- **Ueberspringen:** Moeglich, fuehrt direkt zur LandingPage

### 10.4 ProfileHintView

- **Trigger:** Premium-User mit OCEAN-Profil, aber ohne Spiral Dynamics ODER Riemann-Thomann
- **Optionen:**
  - "Entdecken" → PersonalitySurvey (Riemann oder SD)
  - "Spaeter" → Weiter zum Intent-Routing
  - "Nicht mehr zeigen" → `profileHintDisabled = true`, weiter zum Intent-Routing
- **Badge:** Burger-Menue zeigt Benachrichtigungs-Badge solange ProfileHint aktiv

---

## 10.5 Gloria Interview Flow (v1.8.9+)

```mermaid
flowchart TD
    START([BotSelection]) --> BTN[Gloria Interview waehlen]
    BTN --> CHAT[ChatView<br/>Bot: gloria-interview]
    
    CHAT --> INTRO[Bot: Fragt nach Thema und Dauer]
    INTRO --> USER[User: Definiert Thema]
    USER --> INTERVIEW[Interview-Phase<br/>Strukturierte Fragen]
    
    INTERVIEW --> END[Sitzung beenden]
    END --> REVIEW[SessionReview<br/>isInterviewReview = true]
    
    REVIEW --> TABS{Ansicht}
    TABS -->|Zusammenfassung| SUMMARY[Zusammenfassung<br/>des Themas]
    TABS -->|Setup| SETUP[Metadaten:<br/>Thema, Dauer, Fokus]
    TABS -->|Transkript| TRANSCRIPT[Geglaettetes Transkript<br/>(Interviewer / User)]
    
    TRANSCRIPT --> EXPORT[Als Markdown exportieren]
    EXPORT --> DASHBOARD[Zurueck zum Dashboard]
```

### Gloria Interview
Ein spezialisierter Flow für strukturierte Interviews ohne Coaching-Ratschläge.
- **Einstieg:** Über die "Management & Kommunikation"-Sektion in der BotSelection.
- **Bot:** `gloria-interview` (nicht zu verwechseln mit `gloria-life-context`).
- **Output:** Ein grammatikalisch geglättetes Transkript und eine strukturierte Zusammenfassung, ideal für Brainstorming oder Projektplanung.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BILDSCHIRM-ABFOLGE                                   │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬───────────┤
│  Schritt │   Gast   │ Reg.Neu  │ Reg.Wied.│ Expired  │ Premium  │  Admin    │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼───────────┤
│    1     │ Auth     │ Auth     │ Auth     │ Auth     │ Auth     │ Auth      │
│    2     │ —        │ Register │ Login    │ Login    │ Login    │ Login     │
│    3     │ —        │ Pending  │ Welcome  │ Welcome  │ Welcome  │ Welcome   │
│    4     │ Intent   │ Verify   │ Intent*  │ RC Sync  │ Intent*  │ Admin**   │
│    5     │ Name*    │ Welcome  │ Context  │ Paywall  │ Hint*    │ —         │
│    6     │ Landing  │ Intent   │ BotSel.  │ Kauf     │ BotSel.  │ —         │
│    7     │ BotSel.  │ Name     │ Chat     │ Intent   │ Chat     │ —         │
│    8     │ Chat     │ OCEAN*   │ —        │ ...      │ —        │ —         │
│    9     │ —        │ Hint*    │ —        │ —        │ —        │ —         │
│   10     │ —        │ BotSel.  │ —        │ —        │ —        │ —         │
│   11     │ —        │ Chat     │ —        │ —        │ —        │ —         │
├──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴───────────┤
│  * = optional/uebersprungbar    ** = oder normaler Flow je nach Praeferenz  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Bot-Zugang nach Tier

```mermaid
flowchart LR
    subgraph GUEST[Gast]
        G_NOBODY[Nobody]
        G_MAX[Max]
        G_AVA[Ava]
    end

    subgraph REGISTERED[Registriert]
        R_ALL["Gloria Interview<br/>Cloud Sync<br/>Server TTS<br/>OCEAN, DPC"]
    end

    subgraph PREMIUM[Premium]
        P_KENJI[Kenji]
        P_CHLOE[Chloe]
        P_MORE["Riemann, SD<br/>DPFL<br/>Transcript Eval"]
    end

    subgraph CLIENT[Klient]
        C_ROB[Rob]
        C_VICTOR[Victor]
        C_MORE["PEP<br/>Audio Upload"]
    end

    GUEST --> REGISTERED --> PREMIUM --> CLIENT
```

---

## 12. Plattform-Unterschiede: iOS vs. Web

| Aspekt | iOS (Capacitor) | Web (Browser) |
|:---|:---|:---|
| Installation | App Store Download | PWA zum Homescreen |
| Zahlungen | In-App Purchase (RevenueCat) | PayPal Direct Checkout |
| PayPal-Links | Ausgeblendet (Apple 3.1.1) | Sichtbar |
| TTS | Native iOS Stimmen | Server TTS (Piper, ab Registered) + Web Speech API Fallback |
| STT | Native Speech Recognition | Web Speech API |
| Safe Area | Dynamic Island / Notch beruecksichtigt | Standard-Padding |
| Datenexport | Ueber Share-Sheet | Browser-Download |
| PII-Warnung | Angepasste Textgroesse fuer Mobilbildschirm | Standard |

---

*Dieses Dokument basiert auf dem implementierten Code in `App.tsx` (v1.9.9) und spiegelt die tatsaechliche Routing-Logik wider.*
