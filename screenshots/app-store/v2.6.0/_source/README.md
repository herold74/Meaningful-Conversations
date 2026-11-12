# v2.6.0 — Quellbilder (nicht ASC-upload)

**Regel:** Slides **01–05** und **07** nur aus **echten iPhone-Screenshots** (`IMG_*.PNG`, 1179×2556). Keine Browser-/Playwright-Captures in `frame-asc-marketing-device.py` — falsche Statusleiste, falsche Proportionen.

**Slide 06 (Fits your day):** Theme-Grid aus `themes/{de|en}/*` (Playwright) ist ok — bewusste Ausnahme.

Export aus **Fotos → Ablage → Exportieren → Volle Größe / Original** hier ablegen.

| Datei | Pixel | Inhalt | Verwendung |
|-------|-------|--------|------------|
| `IMG_1675.PNG` | 1179×2556 | About, „Ein Coach …“ (DE, Gerät) | Slide **01** DE |
| `IMG_1672.PNG` | 1179×2556 | About, „A coach who knows you“ (EN) | Slide **01** EN |
| `IMG_1677.PNG` | 1179×2556 | Verbindungs-Signatur Radar (DE) | Slide **02** DE |
| `IMG_1674.PNG` | 1179×2556 | Connection Signature Radar (EN) | Slide **02** EN |
| `IMG_1676.PNG` | 1179×2556 | Coaching üben About-Tab (DE) | Slide **04** DE |
| `IMG_1673.PNG` | 1179×2556 | Coach Practice About tab (EN) | Slide **04** EN |
| `connector-intro-de.png` | 1179×2556 | Connector-Einstieg (DE, `IMG_1666`) | Slide **03** DE |
| `connector-intro-en.png` | 1179×2556 | Connector intro (EN) — **Gerät nachziehen** wenn Browser | Slide **03** EN |
| `connector-coach-grid-de.png` | 1179×2556 | Coach-Grid Connector (DE, `IMG_1665`) | Slide **05** DE |
| `connector-coach-grid-en.png` | 1179×2556 | Coach grid (EN) — **Gerät nachziehen** wenn Browser | Slide **05** EN |
| `IMG_1647.PNG` | 1179×2556 | Coach-Auswahl (Reserve) | — |
| `IMG_1648.PNG` | 1179×2556 | Connector-Chat David | Reserve Slide 3 |
| `IMG_1649.PNG` / `IMG_1671.PNG` | 1179×2556 | Ältere Radar-Captures | Reserve |
| `about-coach-*` / `connector-radar-en-*.png` | Browser | **Nicht** für ASC-Framing verwenden | Archiv |
| `lifestyle/cafe-iphone.jpg` | 720×1280 | Café + leeres iPhone-Display | iPhone Slide **00** (Chat perspektivisch) |
| `IMG_1556.JPG` | 1152×864 | Café + iPad (Practice im Display) | **iPad Slide 00** — Aufmacher, unverändert optimal |
| `coaching-chat-de.png` | 1206×2622 | Coaching Gabrielle DE (Text) | iPhone **06** + **00** DE |
| `coaching-chat-en.png` | 1206×2622 | Coaching Gabrielle EN (Text) | iPhone **06** + **00** EN |
| `coach-grid-de.png` / `coach-grid-en.png` | 1206×2622 | Coach-Auswahl Coaching-Tab | Slide **06** |
| `coaching-voice-de.png` / `coaching-voice-en.png` | 1206×2622 | Sprachmodus Gabrielle | Slide **07** |
| `themes/{de,en}/*.png` | 1290×2796 | Theme-Vorschau (Capture-Skript) | Slide **06** |
| `IMG_1650.PNG` | 1179×2556 | Auswertung Fließtext | **Nicht** Store-Vollbild |

**Statusleiste:** Beim Framing werden Uhrzeit, Empfang und Batterie auf Device-Shots **neutralisiert** (einheitliche helle Leiste, Dynamic Island bereinigt) — siehe `clean_phone_screenshot()` in `scripts/compose-asc-marketing-slides-v260.py`.

**iPad-Rohscreens:** `ipad/IMG_0299.PNG` … `IMG_0315.PNG` (1668×2388) — Zuordnung `ipad/README.md`. Aufmacher: `IMG_1556.JPG`.

Fertige Slides → `../iphone/` (bzw. `../ipad/`). Generator: `python3 scripts/frame-asc-marketing-device.py v260` (iPad: in Arbeit).
