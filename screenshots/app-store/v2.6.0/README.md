# App Store Screenshots v2.6.0 (DE + English Canada)

## Strategie: Marketing-first (nicht Vollbild-UI)

Store-Karussell braucht **eine Zeile Claim + großes Motiv**. Lange Feedback-Texte und Intro-Wände wirken im Listing leer.

| Ansatz | Verwenden für ASC `iphone/` |
|--------|------------------------------|
| **Marketing-Slide** (Teal/Orange, Headline, optional Lifestyle) | Ja — Hauptformat |
| **Echter UI-Crop** im Phone-Rahmen | Ja — Radar, David-Modal, Practice-Setup |
| **Roher Vollbild-Screenshot** (nur Text/Chips) | Nein — nur als `_source/` für Crops |

**ASC-Upload:** nur **`iphone/*-{de|en}.png`** · **1284×2778** · PNG.

**Quellen:** Slides 01–05 + 07 = **iPhone `IMG_*.PNG`** (kein Browser). Slide 06 = Theme-Captures (Ausnahme). Statusleiste (Uhrzeit/Empfang/Batterie) wird beim Framing **neutralisiert** — siehe `_source/README.md`.

## Ordner

| Pfad | Inhalt |
|------|--------|
| `_source/` | Vollauflösung aus Fotos / iPhone (unbearbeitet) — siehe `_source/README.md` |
| `iphone/` | Fertige Store-Slides nach Compositing |
| `moodboard-{de\|en}.png` | Alle 7 Slides im Raster (Optik-Review Chrome hell vs. saisonal) — `python3 scripts/build-asc-moodboard.py` |
| `ipad/` | **2048×2732** — gleiche Story wie iPhone; Slide **00** aus `IMG_1556.JPG` (Café + iPad) |

## 5-Slides-Set (iPhone 6,7″)

Pro Lokalisierung **Deutsch** und **English (Canada)** — gleiches Layout, Textebene tauschen.

| Slot | Dateiname (Ziel) | Inhalt | Headline DE | Headline EN (Canada) |
|------|------------------|--------|-------------|----------------------|
| **0 (Aufmacher)** | `00-lifestyle-iphone-{de\|en}.png` | Café + Chat | COACHING, WO SIE SIND | COACHING WHERE YOU ARE |
| 1 | `01-brand-iphone-{de\|en}.png` | Brand / Vertrauen (Welcome) | EIN COACH, DER SIE KENNT | A COACH WHO KNOWS YOU |
| 2 | `02-connector-persona-iphone-{de\|en}.png` | **Connector-Intro** (David-Modal + Chat) | THE CONNECTOR | THE CONNECTOR |
| 3 | `03-connector-radar-iphone-{de\|en}.png` | **Radar + Score** (Verbindungs-Signatur) | Ihr Verbindungs-Radar | Your connection radar |
| 4 | `04-coach-grid-iphone-{de\|en}.png` | Coach-Auswahl (Coaching-Tab) | IHR COACH-TEAM | YOUR COACH TEAM |
| 5 | `05-voice-coaching-iphone-{de\|en}.png` | Sprachmodus Gabrielle | COACHING PER SPRACHE | COACHING BY VOICE |
| 6 | `06-coaching-chat-iphone-{de\|en}.png` | **Coaching-Sitzung** Gabrielle (Text) | TIEFGEHENDE GESPRÄCHE | CONVERSATIONS WITH DEPTH |
| 7 | `07-practice-iphone-{de\|en}.png` | Coach Practice (Setup-UI) | Coaching üben | Practice coaching |
| 8 | `08-themes-iphone-{de\|en}.png` | Drei Farbwelten | PASST ZU IHREM TAG | FITS YOUR DAY |

### iPad (12.9″/13″, 2048×2732)

**Abweichungen zu iPhone:** Device-UI **Dark Mode** (absicht). **Keine Voice-Slide.** Rohmaterial: `_source/ipad/` + `IMG_1556.JPG`.

| Slot | Ziel | Inhalt |
|------|------|--------|
| **00** | `00-lifestyle-ipad-*` | `IMG_1556.JPG` — Café + iPad |
| **01–06** | Brand … Practice | `IMG_0299`–`0312` — siehe `_source/ipad/README.md` |
| **07** | Themes | Hell `0317/0316/0318` + Dunkel `0320/0321/0319` (Gerätepaare, diagonal) |

```bash
python3 scripts/frame-asc-marketing-device.py v260-ipad
python3 scripts/build-asc-moodboard.py --device ipad   # moodboard-ipad-{de,en}.png
```

iPhone **05 Voice** entfällt; Chat/Practice/Themes rücken auf **05–07**.

**Nicht als eigene Slide:** Auswertung mit Fließtext + „Deine Stärken“ (`IMG_1650`) — In-App-Tiefe, im Store unlesbar.

## Rohmaterial → Slide (Stand Export)

| Datei in `_source/` | Maße | Rolle |
|---------------------|------|--------|
| `IMG_1649.PNG` | 1179×2556 | **Slide 2** — Radar/Score crop |
| `IMG_1648.PNG` | 1179×2556 | **Slide 3** — Persona-Modal |
| `IMG_1647.PNG` | 1179×2556 | **Slide 5** — Coach-Grid (nur Connector-Karte / Icon) |
| `IMG_1650.PNG` | 1179×2556 | Nur Referenz — **nicht** Vollbild-ASC |
| `IMG_1556.JPG` | 1152×864 | **iPad Slide 00** — Café + iPad (Aufmacher); iPhone 00 = `lifestyle/cafe-iphone.jpg` |

Chat-Komprimierung liefert ~472×1024 — **immer aus Fotos nach `_source/` exportieren** (Original / volle Größe).

## Slides erstellen (Repo)

**Standard:** **frameit** (Rahmen wie Slide 4 Practice) — siehe **[`SCREENSHOT-BRIEF.md`](SCREENSHOT-BRIEF.md)**.

```bash
# About-Tabs neu in HELL (optional):
# npm run build && npx vite preview --port 5173
# node scripts/capture-about-asc.mjs --base "http://127.0.0.1:5173/?backend=staging"
# node scripts/capture-asc-themes.mjs   # Slide 6

python3 scripts/build-asc-screenshots-frameit.py
```

- Slides **1–5:** nur **Hell**-UI, **cover-crop** (keine weißen Balken bei dunklen Screens).  
- Slide **6:** 3 Schemata × Hell/Dunkel (Grid).  
- Panorama 1↔2: weiter [`figma/README.md`](figma/README.md) optional.

**Silber-Rahmen (DE + EN, Slides 1–6):** `python3 scripts/frame-asc-marketing-device.py v260` — *iPhone 14 Pro Max Silver*, Alpha-Maske, überschreibt alle `iphone/0[1-6]-{de|en}.png`.

Vorher (Hell, Vollbild 1290×2796):
- `node scripts/capture-about-asc.mjs --lang de|en|all`
- `node scripts/capture-asc-themes.mjs --lang de|en|all` → `_source/themes/{de|en}/{theme}-{light|dark}.png`

Slide 6: drei gefächerte Geräte, diagonal hell/dunkel; DE „PASST ZU IHREM TAG“, EN „FITS YOUR DAY“.

Slide 7 (Lifestyle, Auflockerung): `_source/lifestyle/cafe-iphone.jpg` (generiertes Café-Foto, 720×1280, Display leer) + echter Coaching-Chat perspektivisch ins Display gesetzt (`LIFESTYLE_SCREEN_QUAD` im Frame-Script). DE „COACHING, WO SIE SIND“ ← `journey/05-chat/06-coaching-deep-tts-active-iphone-de.png`; EN „COACHING WHERE YOU ARE“ ← `_source/coaching-chat-en.png` (Ava-Chat EN, hell, 1179×2556). Neues Foto → Display-Ecken neu vermessen.

**Nur UI-Prep für Figma:** `python3 scripts/export-asc-clean-sources.py`

| Slide | Layout (Figma) |
|-------|----------------|
| **1 + 2** | Panorama **2568×2778**, Device über Naht, Verlauf Mint→Teal |
| **2** | Radar-Screen + optional `02-radar-zoom-chart.png` |
| **4** | Warmes Café-Gradient (Brief) |

**Fallback (flache Karten):** `compose-asc-marketing-slides-v260.py` · **Deprecated:** v261, frameit-Auto-Layout.

**About neu capturen:** `node scripts/capture-about-asc.mjs --base "http://127.0.0.1:5173/?backend=staging"` → `_source/about-coach-knows-you-{de|en}.png`.

## Compositing (manuell verfeinern)

Optional in Keynote/Figma nachbearbeiten (Lifestyle iPhone für Slide 4, schärfere Typo):

1. Canvas **1284×2778**, Hintergrund ManualMode (Teal `#1B7272` / Dark `#111827` oder Foto).
2. Headline oben (~10–15 % Höhe), **Phone-Mock** mit UI-Crop (~55–70 % Höhe).
3. Statusleiste in Crops optional weichzeichnen; keine persönlichen echten Namen in öffentlichen Chats.
4. Export PNG → `iphone/`.

**Skalierung Roh-iPhone (1179×2556 → eingebettet):** Seitenverhältnis passt nahezu zu 1284×2778; lieber **einbetten** als blind auf 1284×2778 strecken. Schärfer: erneut **iPhone 15 Pro Max** Simulator @ 1284×2778.

## Optional: UI-Captures aus Staging

https://mc-beta.manualmode.at — Premium+-Account.

```bash
node scripts/capture-app-store-screenshots.mjs --lang all
# Ausgabepfad / --version prüfen; Ziel iphone/ nach Compositing
```

Production-Archive-Screens: `npm run build && npx cap sync ios` → Simulator **iPhone 15 Pro Max**.

## ASC

- Lokalisierung **English (Canada)** — nicht U.S. (`app-store-connect` Skill).
- Copy „Was ist neu“: `DOCUMENTATION/APP-STORE-METADATA.md` (Block v2.6.0).
- Mindestens **3** Screenshots pro Lokalisierung; empfohlen **5** wie oben.

## Check vor Upload

- [ ] Alle `iphone/*.png` exakt **1284×2778**
- [ ] DE- und EN-Satz **gleiche Anzahl** Slides
- [ ] Connector **Radar** auf mindestens einer Slide klar erkennbar (Slide 2: Zoom-Karte + Device)
- [ ] **Panorama 1↔2:** im ASC-Karussell wischen — Verlauf und iPhone-Kante ohne Sprung
- [ ] Keine 1179×2556-Rohdateien direkt in ASC hochladen
- [ ] Disclaimer-Kleintext in Crops nicht als Hauptbotschaft
