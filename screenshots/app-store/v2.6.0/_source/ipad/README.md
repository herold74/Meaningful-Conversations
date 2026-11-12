# iPad-Rohscreens v2.6.0 (ASC 2048×2732 Ziel)

**Herkunft:** `~/Desktop/MyCoach AI/V2.6.0 Ergänzungen/` (Import 2026-10-27)  
**Gerät:** iPad-Screenshots **1668×2388** — beim Framing auf **2048×2732** skalieren.

**Slide 00 (Aufmacher):** `../IMG_1556.JPG` (Café + iPad).

## Produktentscheidungen (iPad ≠ iPhone)

| Thema | iPad |
|--------|------|
| **Chrome** | **Dark Mode** in den Device-Slides — **absicht**, nicht an iPhone-Hell angleichen. |
| **Voice** | **Keine eigene Slide** — auf iPad nicht vorrangig; Karussell ohne Sprachmodus-Screen. |
| **Anzahl** | **00 + 01–07** (8 Inhaltsslides nach Aufmacher); iPhone hat zusätzlich **05 Voice** und **08 Themes** als eigene Slots. |

## Zuordnung → fertige ASC-Dateien (geplant)

| Slot | Dateiname (Ziel) | DE-Quelle | EN-Quelle | Headline (wie iPhone) |
|------|-------------------|-----------|-----------|------------------------|
| **00** | `00-lifestyle-ipad-{de\|en}.png` | `IMG_1556.JPG` | gleiches Motiv | COACHING, WO SIE SIND / COACHING WHERE YOU ARE |
| **01** | `01-brand-ipad-{de\|en}.png` | `IMG_0305.PNG` | `IMG_0310.PNG` | EIN COACH … / A COACH WHO KNOWS YOU |
| **02** | `02-connector-ipad-{de\|en}.png` | `IMG_0300.PNG` | `IMG_0308.PNG` | THE CONNECTOR |
| **03** | `03-connector-radar-ipad-{de\|en}.png` | `IMG_0302.PNG` | `IMG_0309.PNG` | IHR VERBINDUNGS-RADAR / YOUR CONNECTION RADAR |
| **04** | `04-coach-grid-ipad-{de\|en}.png` | `IMG_0299.PNG` | `IMG_0307.PNG` | IHR COACH-TEAM / YOUR COACH TEAM |
| **05** | `05-coaching-chat-ipad-{de\|en}.png` | `IMG_0301.PNG` | `IMG_0312.PNG` | TIEFGEHENDE GESPRÄCHE / CONVERSATIONS WITH DEPTH |
| **06** | `06-practice-ipad-{de\|en}.png` | `IMG_0304.PNG` | `IMG_0311.PNG` | COACHING ÜBEN / PRACTICE COACHING (Setup DE · About EN) |
| **07** | `07-themes-ipad-{de\|en}.png` | Hell/Dunkel-Gerätepaare (diagonal) | siehe Tabelle unten |

| Farbwelt | Hell | Dunkel | Screen |
|----------|------|--------|--------|
| Sommer | `IMG_0317` | `IMG_0320` | Welcome Back |
| Brand | `IMG_0316` | `IMG_0321` | Coach-Grid |
| Herbst | `IMG_0318` | `IMG_0319` | Life-Context-Editor |

`python3 scripts/frame-asc-marketing-device.py v260-ipad`

**Practice DE:** Alternative About-Tab `IMG_0306.PNG` statt Setup `0304` — bei Framing mit iPhone-Story (`07-practice` = Setup) vergleichen.

## Reserve (nicht im Karussell)

| Datei | Inhalt |
|-------|--------|
| `IMG_0303.PNG` | Bot-Auswahl / Hub |
| `IMG_0306.PNG` | Practice About (DE) |
| `IMG_0313.PNG` | Benutzerhandbuch |
| `IMG_0314.PNG` | Intent-Picker |
| `IMG_0315.PNG` | Coach-Auswahl EN, Practice gesperrt |

## Optional später

- **DE 01:** `IMG_0305` mit „dich“ — nur bei Bedarf heller About-Screen mit **Sie** (Store-DE).
- **EN 02 vs DE 02:** Katalog (`0308`) vs Intro (`0300`) — bewusst unterschiedliche Connector-Ansicht.

Generator: `frame-asc-marketing-device.py` iPad-Modus (in Arbeit) → `../../ipad/`.
