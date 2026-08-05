# Screenshots Directory

UX journey captures and versioned App Store sets. See **[CONVENTIONS.md](CONVENTIONS.md)** for layout and valid dimensions.

## Directory structure

```
screenshots/
├── journey/              # Documentation captures (by flow)
│   ├── 01-landing/
│   ├── 03-context-setup/
│   ├── 04-bot-selection/
│   ├── 05-chat/
│   ├── 06-session-review/
│   ├── 07-achievements/
│   ├── 10-practice/
│   └── …
├── app-store/
│   ├── v2.4.2/           # Archived ASC set
│   └── v2.5.4/           # Current ASC upload (1284×2778 / 2048×2732)
├── _wip/                 # Temporary (gitignored)
├── CONVENTIONS.md
└── SCREENSHOT-QUICK-REFERENCE.md
```

## App Store regenerate

```bash
python3 scripts/prepare-asc-screenshots-from-assets.py
```

Upload from `screenshots/app-store/v2.5.4/{iphone|ipad}/` only.

## Capture (Playwright)

```bash
node scripts/capture-app-store-screenshots.mjs --lang all
```

## Current status (2026-08-05)

- **Journey:** 37+ screenshots under `journey/` (DE, iPhone + iPad Pro 13")
- **ASC v2.5.4:** 10 iPhone + 9 iPad — all valid ASC dimensions
- **Removed:** `source/` raw device exports (1179×2556 / wrong iPad size); use `journey/10-practice/` masters instead

See `journey/*/README` sections in this file's git history or `app-store/v2.5.4/manifest.json` for slot mapping.
