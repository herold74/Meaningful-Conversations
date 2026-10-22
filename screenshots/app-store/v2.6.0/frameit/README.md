# App Store screenshots — fastlane frameit (kostenlos)

Echte **Device-Frames** (Open Source), keine Pillow-Bezel.

## Einmal-Setup

```bash
brew install fastlane imagemagick
fastlane frameit download_frames
```

Frames liegen unter `~/.fastlane/frameit/` (nicht ins Git).

## Slides bauen

```bash
python3 scripts/build-asc-screenshots-frameit.py
```

- Bereinigt UI aus `_source/` (Dynamic Island / Statusleiste via v260)
- Skaliert auf **1179×2556** (iPhone 14 Pro — passt zu Geräte-Exports)
- Hintergrund + Headline in **1284×2778** (Pillow)
- **Panorama 1↔2:** gemeinsamer Verlauf, linke/rechte Hälfte
- `fastlane frameit silver` pro Locale (de/en)
- Export nach `../iphone/` in ASC-Größe **1284×2778**

Arbeitsdateien: `work/` (gitignored).

## Fallbacks

| Skript | Nutzen |
|--------|--------|
| `compose-asc-marketing-slides-v260.py` | Flache Teal-Karten ohne Device |
| `compose-asc-marketing-slides-v261-modern.py` | **Deprecated** — gezeichnete Bezel |

## Radar-Zoom

Slide 2: Pentagon-Crop auf dem Screen vor dem Framen — `RADAR_BBOX_FRAC` in `build-asc-screenshots-frameit.py`.
