# App Store Screenshots v2.5.4 (Deutsch)

## iPhone 6.7" — **1284×2778** (ASC upload)

| # | Datei | Inhalt |
|---|-------|--------|
| 1 | 01-welcome-dark-iphone-de.png | Willkommen |
| 2 | 02-intent-picker-iphone-de.png | Intent-Auswahl |
| 3 | 03-coach-grid-iphone-de.png | Coach-Auswahl (Coaching-Sektion) |
| 4 | 04-coaching-chat-iphone-de.png | Coaching-Chat |
| 5 | 05-session-analyzing-iphone-de.png | Sitzung wird analysiert |
| 6 | 06-session-review-iphone-de.png | Diskursanalyse |
| 7 | 07-session-review-updates-iphone-de.png | Kontext-Aktualisierungen |
| 8 | 08-landing-hub-iphone-de.png | Landing / Lebenskontext |
| 9–10 | 09–10-practice-* | Practice (optional) |

**ASC-Upload (Roh-UI):** Dateien in **`iphone/`** — siehe `manifest.json`.

**Marketing (Silber-Rahmen + Überschrift):** **`iphone-framed/`** — 1284×2778, Rahmen = frameit-Asset *iPhone 14 Pro Max Silver*, lokal mit Alpha-Maske komponiert (keine Ecken außerhalb des Geräts), Headline oben, Gerät darunter.

> **Achtung:** In `iphone/` sind `04-coaching-chat` (nur Ladescreen) sowie `06`/`07` (Kopien des Welcome-Screens) inhaltlich falsch. Die gerahmte Version nutzt dafür `journey/05-chat/06-coaching-deep-tts-active`, `journey/06-session-review/05-review-findings` und `06-review-updates-diff`.

```bash
python3 scripts/frame-asc-marketing-device.py v254
python3 scripts/frame-asc-marketing-device.py v254 --all   # inkl. 09–10 Practice
```

Regenerate Roh-UI: `python3 scripts/prepare-asc-screenshots-from-assets.py`
