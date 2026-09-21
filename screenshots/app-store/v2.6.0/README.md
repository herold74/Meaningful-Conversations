# App Store Screenshots v2.6.0 (DE + English Canada)

## iPhone 6.7" — **1284×2778** (ASC upload)

**Ziel:** Store-Listing zeigt den Sprung von **2.5.7 → 2.6.0** — vor allem **The Connector**, plus vertraute Coaching-/Practice-Journey.

| # | Vorschlag (Dateiname) | Inhalt | Priorität |
|---|------------------------|--------|-----------|
| 1 | `01-welcome-dark-iphone-{de\|en}.png` | Welcome / ManualMode (Dark) — Vertrauen, DE/EN-Toggle sichtbar | Behalten oder aus v2.5.4 |
| 2 | `02-intent-picker-iphone-{de\|en}.png` | Intent „Coaching“ gewählt | Behalten oder aus v2.5.4 |
| 3 | `03-coach-grid-connector-iphone-{de\|en}.png` | **Coach-Auswahl:** Sektion Kommunikation mit **The Connector**-Tile (neues Icon, neben Coaches) | **NEU — Pflicht** |
| 4 | `04-connector-intro-iphone-{de\|en}.png` | Connector-Intro (Text/Sprache, Kurzerklärung) | **NEU — Pflicht** |
| 5 | `05-connector-results-radar-iphone-{de\|en}.png` | Auswertung mit **Radar** + Stärken/Entwicklung | **NEU — Pflicht** |
| 6 | `06-coaching-chat-iphone-{de\|en}.png` | Klassisches Coaching (Ava o.ä.) — Kernprodukt | Aus v2.5.4 oder neu |
| 7 | `07-session-review-iphone-{de\|en}.png` | Diskursanalyse / Session Review | Aus v2.5.4 |
| 8 | `08-practice-catalog-iphone-{de\|en}.png` | Coach Practice Katalog (Premium+) | Optional |
| 9 | `09-profile-connector-section-iphone-{de\|en}.png` | Profil: Connector unter „Wie du interagierst“ / Fremdsicht-Hinweis | Optional, stark für Differenzierung |
| 10 | `10-landing-hub-iphone-{de\|en}.png` | Lebenskontext / Hub | Optional |

**ASC-Upload:** Nur Dateien aus **`screenshots/app-store/v2.6.0/iphone/`** (nach Vorbereitung).

## Aufnahme

**Staging (empfohlen für Connector + neueste UI):** https://mc-beta.manualmode.at — Premium+-Account, eingeloggt.

```bash
# Dev-Server + Backend lokal ODER gegen Staging-Build im Simulator:
node scripts/capture-app-store-screenshots.mjs --lang all --version 2.6.0
# (Falls Script noch v2.5.4 hardcoded: manuell im Simulator/Xcode oder Script-Flag prüfen)

# Aus Journey-Masters / Rohscreenshots:
python3 scripts/prepare-asc-screenshots-from-assets.py
```

**Native Archive-Screenshots:** Nach `npm run build && npx cap sync ios` in Xcode **iPhone 15 Pro Max** Simulator → gleiche Flows wie oben (Production-API).

## EN (Canada)

- In ASC **English (Canada)** — nicht U.S.
- Playwright/Capture: `en-CA`; in-app locale `en`.
- Mindestens **Was ist neu** + ideally volle Screenshot-Parität zu DE (siehe `app-store-connect/SKILL.md`).

## Check vor Upload

- [ ] Alle PNG **1284×2778**, keine 1179×2556-Exports
- [ ] Keine persönlichen Daten / keine echten Namen in Chats
- [ ] Connector-Radar mit plausiblen Demo-Scores (Lab-Account oder abgeschlossener Lauf)
- [ ] Dark-Mode-Frames konsistent (Listing wirkt wie Live-App)
