# App Store Connect — Upload-Assets (v2.6.0)

Masters (Bearbeitung): `../iphone/` (**1284×2778** — **nicht** in ASC hochladen).

Detail-Anleitung (ASC-Klicks ↔ Dateipfade): Project store `docs/asc-2.6.0-upload-anleitung.md`.

---

## Tab „Kopfzeile und Suchergebnisse“ (zwei getrennte Felder)

| ASC-Unterpunkt | Repo-Ordner | Dateiname | Maße |
|----------------|-------------|-----------|------|
| **Kopfzeile** | `product-page-header/de/` | `manualmode-product-page-header-de.png` | **3840×1646** |
| **Kopfzeile** | `product-page-header/en/` | `manualmode-product-page-header-en.png` | **3840×1646** |
| **Suchergebnisse** | `universal/de/` | `manualmode-universal-de.png` | **5244×2950** |
| **Suchergebnisse** | `universal/en/` | `manualmode-universal-en.png` | **5244×2950** |

Generierung: `python3 scripts/compose-asc-product-page-header.py` → danach `python3 scripts/compose-asc-universal-asset.py`

---

## Tab „App-Vorschauen und Bildschirmfotos“

### iPhone Dynamic Island (6,1″ / 6,3″)

| Ordner | Maße | Anzahl |
|--------|------|--------|
| `iphone-dynamic-island-medium/de/` | **1179×2556** | 9 (`00`–`08`) |
| `iphone-dynamic-island-medium/en/` | **1179×2556** | 9 |

Optional: `iphone-dynamic-island-large/{de|en}/` (**1320×2868**) — nur wenn ASC den Tab verlangt.

Export: `python3 scripts/frame-asc-marketing-device.py v260` → `python3 scripts/export-asc-iphone-upload.py` (`--also-large` optional)

### iPad 13″

| Ordner | Maße | Anzahl |
|--------|------|--------|
| `../ipad/DE/` | **2048×2732** | 8 |
| `../ipad/EN/` | **2048×2732** | 8 |

Karussell-Reihenfolge: `../README.md` (Lifestyle → … → Themes).

---

Metadaten: `DOCUMENTATION/APP-STORE-METADATA.md`
