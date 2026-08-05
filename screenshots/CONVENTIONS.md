# Screenshot conventions

## Folder layout

```
screenshots/
├── journey/           # UX documentation (correct ASC sizes; not slot-ordered)
├── app-store/vX.Y.Z/  # ASC upload sets (1284×2778 iPhone, 2048×2732 iPad)
├── _wip/              # Temporary captures (gitignored)
├── README.md
└── CONVENTIONS.md
```

## Valid dimensions

| Target | Accepted sizes (px) |
|--------|---------------------|
| **iPhone ASC** | 1284×2778 (preferred), 1242×2688, or landscape equivalents |
| **iPad ASC** | 2048×2732 (preferred) or landscape equivalent |

**Never commit** device exports at 1179×2556 or other sizes — resize via `scripts/prepare-asc-screenshots-from-assets.py` or capture at target size.

## Naming

**Journey:** `{NN}-{screen-id}-{device}-{locale}.png`  
Example: `04-bot-selection/02-coaching-section-iphone-de.png`

**App Store:** `{slot}-{screen-id}-{device}-{locale}.png`  
Example: `03-coach-grid-iphone-de.png` (slot 3 = coach selection, not welcome spinner)

**Screen IDs must match content.** Do not label loading spinners as `bot-selection`.

## Regenerate ASC v2.5.4

```bash
python3 scripts/prepare-asc-screenshots-from-assets.py
```

Upload only from `screenshots/app-store/v2.5.4/{iphone|ipad}/`. See `manifest.json` for source mapping.
