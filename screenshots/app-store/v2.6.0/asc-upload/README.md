# App Store Connect — Upload-Assets (v2.6.0)

**Quelle der Wahrheit für ASC-Upload** (iPhone). Masters zum Bearbeiten: `../iphone/` (1284×2778).

## iPhone — Dynamic Island (Mitteldisplay, 6,1″ / 6,3″)

| Ordner | Maße | ASC-Tab |
|--------|------|---------|
| `iphone-dynamic-island-medium/de/` | **1179 × 2556** | Deutsch → Screenshots hochladen |
| `iphone-dynamic-island-medium/en/` | **1179 × 2556** | English (Canada) |

**Nicht** die Dateien aus `../iphone/` (1284×2778) in diesen Tab ziehen — ASC meldet „Dateiabmessungen ungültig“.

## Product page header (iOS 27+, optional)

Breites Hero-Bild **über** Icon & Name auf der Produktseite.

| Ordner | Maße | ASC |
|--------|------|-----|
| `product-page-header/de/` | **3840 × 1646** (21:9) | Deutsch → **Product page header** |
| `product-page-header/en/` | **3840 × 1646** | English (Canada) |

**Inhalt:** Café-Szene (Lifestyle-Slide, Ausschnitt mit Blick und Coaching-Chat). Headline „Coaching, wo Sie sind.“ / „Coaching where you are.“ Untertitel: „Jederzeit. Persönlich. Privat.“ / „Anytime. Personal. Private.“  
Generierung: `python3 scripts/compose-asc-product-page-header.py` (optional `--guides`).  
Upload unter **Produktseiten-Informationen → Header und Suchergebnisse** — Placement **nur Header**, nicht Search Results (3:2).

## Universal (Header + Suche, ein Bild)

| Ordner | Maße | ASC |
|--------|------|-----|
| `universal/de/` | **5244 × 2950** PNG, 16:9, ohne Alpha | Deutsch → **universelles Creative Asset** |
| `universal/en/` | **5244 × 2950** | English (Canada) |

Ein Bild für Produktseiten-Header und Suchergebnisse. Safe Area **1402 × 962** bei (1921, 660) — Textkarte oben, Café-Telefon darunter.  
Generierung: `python3 scripts/compose-asc-universal-asset.py`

## iPad 13″

Unverändert: `../ipad/*-{de|en}.png` (**2048 × 2732**) im Tab **iPad 13″ Display**.

## Neu generieren

```bash
# 1) Marketing-Masters (1284×2778)
python3 scripts/frame-asc-marketing-device.py v260

# 2) ASC-Upload-Sets (1179×2556, RGB ohne Alpha)
python3 scripts/export-asc-iphone-upload.py

# Optional: großer Dynamic-Island-Tab (1320×2868)
python3 scripts/export-asc-iphone-upload.py --also-large

# Product page header (3840×1646, DE + EN)
python3 scripts/compose-asc-product-page-header.py
```

## Apple — Asset Best Practices (Kurz)

Richtlinie: [App Store asset best practices](https://developer.apple.com/app-store/asset-best-practices/)

| Do | Don't (in Screenshots) |
|----|-------------------------|
| Echte App-UI / euer Marketing-Layout | Konkrete Preise, Rabatte |
| Kurze Headlines, gut lesbar (Safe Area oben) | Website-URLs, Copyright-Zeichen |
| DE + EN (Canada) getrennt hochladen | Falsche App-Store-Auszeichnungen |
| PNG RGB, **ohne** Transparenz | 1284×2778 in den 6,3″-Tab |

**App-Vorschauen (Video):** separate Slots (886×1920 / 1920×886) — optional, nicht in diesem Ordner.

## Karussell-Reihenfolge (00–08)

Siehe [`../README.md`](../README.md) — Lifestyle → Brand → Connector → Radar → Coaches → Voice → Chat → Practice → Themes.
