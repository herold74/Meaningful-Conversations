# App Store Screenshots v2.6.0 — Creative Brief (Figma)

**Ziel:** Upload-fähiges Set **DE + English (Canada)**, je **5× 1284×2778 PNG**.  
**Priorität:** Slide **1↔2 Panorama** (ein durchlaufendes Motiv über zwei Karussell-Frames).  
**Tool:** Primär **frameit** (Rahmen wie `04-practice_framed`) + Figma optional für Panorama-Feinschliff.

### Darstellung (ab jetzt)

| Regel | Detail |
|-------|--------|
| **Slides 1–5** | Nur **Hell**-UI (`isDarkMode: false`, About-Captures light) |
| **Slide 6** | **Extra:** 3 Farbschemata (Sommer / Herbst / Brand) × **Hell & Dunkel** auf einer Slide |
| **Kein Letterboxing** | Screens **cover-crop** auf 1179×2556 — **keine weißen/schwarzen Balken** oben/unten im Frame |
| **Dunkel in Einzel-Slides** | Nicht verwenden (nur in Slide-6-Grid) |

---

## Marken & Typo

| Token | Hex | Verwendung |
|-------|-----|------------|
| Mint | `#D6ECEC` | Hintergrund hell |
| Teal | `#1B7272` | Verlauf, Akzent |
| Dark teal | `#165a5a` | Verlauf tief |
| Orange | `#F59E0B` | Highlights (sparsam) |
| Ink | `#181c1c` | Headlines auf hell |
| White | `#FFFFFF` | Headlines auf dunkel |

Headline: **Bold Sans** (SF Pro / Inter), ~64–80 pt @ 1284 Breite.  
Subline: Regular/Medium, ~28–36 pt, max. **2 Zeilen**.

---

## 5 Slides — Inhalt & Quellen

| # | ASC-Datei | Screen (clean) | Headline DE | Headline EN |
|---|-----------|----------------|-------------|-------------|
| 1 | `01-brand-iphone-{de\|en}.png` | `clean/{locale}/01-about-coach-knows-you.png` | EIN COACH, DER SIE KENNT | A COACH WHO KNOWS YOU |
| 2 | `02-connector-radar-iphone-{de\|en}.png` | `clean/{locale}/02-radar.png` + **Zoom-Radar** als Extra-Layer | DEIN VERBINDUNGS-RADAR | YOUR CONNECTION RADAR |
| 3 | `03-connector-persona-iphone-{de\|en}.png` | `clean/{locale}/03-connector-scenario.png` | ECHTE ALLTAGSSZENEN | THE CONNECTOR |
| 4 | `04-practice-iphone-{de\|en}.png` | `clean/{locale}/04-practice-about.png` | COACHING ÜBEN | PRACTICE COACHING |
| 5 | `05-ecosystem-iphone-{de\|en}.png` | `clean/{locale}/05-coach-grid.png` | THE CONNECTOR | MEET THE CONNECTOR |
| 6 | `06-themes-iphone-{de\|en}.png` | `themes-grid-{locale}.png` (6er-Grid) | DREI FARBWELTEN | THREE COLOR WORLDS |

### Subline (DE / EN)

1. Lebenskontext und Verlauf — ein Gedächtnis, das mitdenkt. / Life context and history — memory that follows you.  
2. Empathie, Präsenz, Neugier — fünf Dimensionen auf einen Blick. / Empathy, presence, curiosity — five dimensions at a glance.  
3. Kurze Gespräche mit KI-Personas — zuhörend üben. / Pick a scenario. One conversation — clear feedback.  
4. Du bist der Coach — die KI spielt deinen Klienten. / You are the coach — the AI plays your client.  
5. In der Coach-Auswahl — Alltagsgespräche mit Auswertung. / On your coach grid — practice connection in everyday scenes.  
6. Sommer, Herbst, Brand — in Hell und Dunkel. Du wählst. / Summer, autumn, brand — light and dark. Your choice.

Captures für Slide 6: `node scripts/capture-asc-themes.mjs` → `_source/themes/*.png`, dann `build-asc-themes-grid-screen.py` (läuft in frameit-Build).

---

## Panorama Slides 1 ↔ 2 (Pflicht)

**Artboard:** `2568 × 2778` (zwei ASC-Frames nebeneinander).

```
|←—— 1284 ——→|←—— 1284 ——→|
|  Slide 1   |  Slide 2   |
|  Headline  |  Headline  |
|     [Phone läuft über die Naht bei ~x=1284]     |
|  About UI  |  Radar UI  |
```

- **Ein** Verlauf über die volle Breite (Mint → Teal, diagonal ~135°).  
- **Ein** Device-Mockup (Community-Kit): rechte Hälfte auf Slide 1 sichtbar, linke Fortsetzung auf Slide 2 — **oder** zwei Screens im selben Phone beim Wischen (Structured-Stil).  
- **Export:** Slice bei **x = 1284** → `01-…` und `02-…`. In Figma: zwei Frames 1284×2778 mit **gleichem** Hintergrund-Asset, Guides bei x=0 und x=1284 auf dem Master.  
- Slide 2 zusätzlich: **gezoomtes Pentagon** aus Radar (Crop aus `02-radar.png`, nur Chart) als Floating-Card — nicht im UI-Statusbereich.

Check: Im iPhone-ASC-Preview **wischen** — Verlauf und Device-Kante ohne Sprung.

---

## Slides 3–5

Einzel-Frames **1284×2778**.  
- **3, 5:** Teal-Verlauf (Variante von Slide 1, ohne Panorama).  
- **4:** Warm (Creme/Amber → Teal), „Café-Stimmung“ ohne Stock-Foto — weiche Blobs oder leichter Noise reichen.

Device: **dasselbe Mockup** wie Panorama (Farbe/Winkel konsistent).

---

## Do / Don’t

| Do | Don’t |
|----|--------|
| UI aus `_source/clean/` | Rohe Captures mit Dynamic Island / Statusleiste |
| Kurze Headline + 1 Subline | Fließtext-Feedback (`IMG_1650`) als Store-Slide |
| Connector-Radar auf Slide 2 lesbar | Vollbild-Auswertungstext |
| DE + EN gleiche Komposition | Unterschiedliche Slide-Anzahl |
| Export exakt **1284×2778** | 1179×2556 oder frameit-Rohgröße hochladen |

---

## Workflow (Reihenfolge)

1. `python3 scripts/export-asc-clean-sources.py`  
2. Figma: Kit duplizieren → [`figma/README.md`](figma/README.md)  
3. **Referenz:** nur Slide **1+2 Panorama DE** fertig → Review  
4. DE Slides 3–5, dann EN (Text tauschen, Screens aus `clean/en/`)  
5. Export → `iphone/`  
6. Checkliste unten in [`README.md`](README.md)

---

## Offene Entscheidungen (nach Referenz-Slide)

- Mockup: silber vs. graphit, leichte Rotation ja/nein  
- Slide 2: Radar nur im Phone vs. Phone + Zoom-Card  
- Browser- vs. Geräte-Screens vereinheitlichen (prefer Gerät für DE, EN nachziehen)
