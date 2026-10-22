# Figma — App Store v2.6.0 (kostenlos)

## 1. Kit wählen (Community, 0 €)

In Figma: **Community** suchen nach z. B.:

- `App Store screenshot iPhone 15 Pro`
- `App Store mockup 1284`

Kriterien:

- Frame **1284 × 2778** (oder 1290 × 2796 mit Export-Skala auf 1284×2778)  
- **Editable** Device + Screen-Platzhalter  
- Optional leichte **Perspektive** (Structured-Look)

Datei lokal speichern (nicht ins Git — nur dieser README + Brief).

**Alternative:** [Apple Design Resources](https://developer.apple.com/design/resources/) → Product Bezels PNG — 2D, ohne Neigung, dafür offiziell.

---

## 2. Dateistruktur in Figma

Empfohlene Pages:

| Page | Inhalt |
|------|--------|
| `DE` | 5 Export-Frames + 1 Panorama-Master |
| `EN` | Duplikat von DE, Text + Screen-Swaps |
| `_assets` | Verläufe, Zoom-Radar-Crops |

### Panorama-Master (DE + EN je eine)

- Frame: **`2568 × 2778`**, Name: `panorama-01-02`  
- Vertikale Guide bei **x = 1284**  
- Hintergrund: Rechteck volle Breite, Linear Gradient  
  - Stop 0: `#D6ECEC`  
  - Stop 1: `#1B7272`  
  - Winkel ~135°  
- Text links (0…1284): Headline + Subline Slide 1  
- Text rechts (1284…2568): Headline + Subline Slide 2 (weiß/hell auf dunklerem Verlauf)  
- Device-Layer: über Guide zentriert oder rechts versetzt (siehe Brief)  
- Screen 1: `clean/de/01-about-coach-knows-you.png`  
- Screen 2: `clean/de/02-radar.png`  
- Optional: Group `radar-zoom` nur auf rechter Hälfte

**Export Panorama:**

- Variante A: Zwei Child-Frames `1284×2778` links/rechts, Inhalt im Master, Export 2 PNG  
- Variante B: Slice Tool auf Master bei x=1284  

Zielnamen: `01-brand-iphone-de.png`, `02-connector-radar-iphone-de.png` → Ordner `../iphone/`

### Slides 3–5

Je ein Frame **1284 × 2778**, Device + Text wie im [`SCREENSHOT-BRIEF.md`](../SCREENSHOT-BRIEF.md).

---

## 3. Screens einbinden

Quelle (nach Script):

```
_source/clean/de/*.png
_source/clean/en/*.png
```

In Figma: **Place image** in Screen-Mask des Mockups. Nicht strecken — **Fill** oder proportional skaliert.

---

## 4. EN-Locale

Page `EN` duplizieren von `DE`:

- Textlayer ersetzen (Brief EN-Spalte)  
- Screen-Platzhalter → `clean/en/…`  
- Panorama erneut exportieren  

---

## 5. Qualitätscheck vor ASC

- [ ] Karussell DE: Slide 1→2 Naht  
- [ ] Alle 10 Dateien **1284×2778**  
- [ ] Kein Statusleisten-Müll in Screens  
- [ ] Radar auf Slide 2 erkennbar  

---

## 6. Repo-Skripte (nur Prep)

```bash
python3 scripts/export-asc-clean-sources.py
```

Kein automatischer Figma-Export im Repo — Export manuell aus Figma (PNG 1×).
