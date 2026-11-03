# App Store Connect — Upload-Assets (v2.6.0)

**Quelle der Wahrheit für ASC-Upload** (iPhone). Masters zum Bearbeiten: `../iphone/` (1284×2778).

## iPhone — Dynamic Island (Mitteldisplay, 6,1″ / 6,3″)

| Ordner | Maße | ASC-Tab |
|--------|------|---------|
| `iphone-dynamic-island-medium/de/` | **1179 × 2556** | Deutsch → Screenshots hochladen |
| `iphone-dynamic-island-medium/en/` | **1179 × 2556** | English (Canada) |

**Nicht** die Dateien aus `../iphone/` (1284×2778) in diesen Tab ziehen — ASC meldet „Dateiabmessungen ungültig“.

Optional größerer iPhone-Tab: `iphone-dynamic-island-large/{de|en}/` (**1320 × 2868**) — nur wenn ASC den Slot verlangt (`export-asc-iphone-upload.py --also-large`).

## Product page header (optional, 21:9)

Breites Hero-Bild **über** Icon & Name auf der Produktseite.

| Ordner | Maße | ASC |
|--------|------|-----|
| `product-page-header/de/` | **3840 × 1646** (21:9) | Deutsch → Placement **nur Kopfzeile** |
| `product-page-header/en/` | **3840 × 1646** | English (Canada) |

**Inhalt:** Café-Szene (Lifestyle). Headline „Coaching, wo Sie sind.“ / „Coaching where you are.“ · Untertitel „Jederzeit. Persönlich. Privat.“ / „Anytime. Personal. Private.“  
Generierung: `python3 scripts/compose-asc-product-page-header.py`

## Universal (Kopfzeile + Suche, ein Bild)

| Ordner | Maße | ASC |
|--------|------|-----|
| `universal/de/` | **5244 × 2950** PNG, 16:9, ohne Alpha | Deutsch → Tab **Kopfzeile und Suchergebnisse** (Header + Suche) |
| `universal/en/` | **5244 × 2950** | English (Canada) |

Safe Area **1402 × 962** bei (1921, 660). Generierung: `python3 scripts/compose-asc-universal-asset.py`

## iPad 13″

`../ipad/*-{de|en}.png` (**2048 × 2732**) im Tab **iPad 13″ Display** (8 Slides je Sprache, ohne Voice).

## Neu generieren

```bash
python3 scripts/frame-asc-marketing-device.py v260
python3 scripts/export-asc-iphone-upload.py
python3 scripts/export-asc-iphone-upload.py --also-large   # optional
python3 scripts/compose-asc-product-page-header.py
python3 scripts/compose-asc-universal-asset.py
```

## Apple — Asset Best Practices (Kurz)

[Richtlinie](https://developer.apple.com/app-store/asset-best-practices/) · PNG RGB ohne Alpha · DE + EN (Canada) getrennt · keine Preise/URLs in Screenshots.

## Karussell-Reihenfolge (00–08)

Siehe [`../README.md`](../README.md) — Lifestyle → Brand → Connector → Radar → Coaches → Voice → Chat → Practice → Themes.

Metadaten: `DOCUMENTATION/APP-STORE-METADATA.md`, Project store `docs/asc-2.6.0-einreichung-texte.md`.
