#!/usr/bin/env python3
"""Build single screen PNG for ASC slide 6 — 3 color schemes × light/dark grid."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "screenshots/app-store/v2.6.0/_source"
THEMES_DIR = SRC / "themes"
OUT_W, OUT_H = 1179, 2556

# Preview swatches (accent-ish) when captures missing — ManualMode seasonal + brand
SWATCHES = {
    "summer": {"light": (34, 197, 94), "dark": (22, 120, 60)},
    "autumn": {"light": (245, 158, 11), "dark": (180, 100, 8)},
    "brand": {"light": (27, 114, 114), "dark": (18, 24, 38)},
}

LABELS = {
    "de": {
        "cols": ("HELL", "DUNKEL"),
        "rows": ("SOMMER", "HERBST", "BRAND"),
        "keys": ("summer", "autumn", "brand"),
    },
    "en": {
        "cols": ("LIGHT", "DARK"),
        "rows": ("SUMMER", "AUTUMN", "BRAND"),
        "keys": ("summer", "autumn", "brand"),
    },
}


def load_font(size: int) -> ImageFont.FreeTypeFont:
    path = Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf")
    if path.exists():
        return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def cell_image(theme: str, mode: str, w: int, h: int) -> Image.Image:
    """Prefer capture themes/{theme}-{mode}.png; else swatch."""
    cap = THEMES_DIR / f"{theme}-{mode}.png"
    if cap.exists():
        im = Image.open(cap).convert("RGB")
        scale = min(w / im.width, h / im.height)
        nw, nh = int(im.width * scale), int(im.height * scale)
        im = im.resize((nw, nh), Image.Resampling.LANCZOS)
        out = Image.new("RGB", (w, h), SWATCHES[theme][mode])
        out.paste(im, ((w - nw) // 2, (h - nh) // 2))
        return out
    return Image.new("RGB", (w, h), SWATCHES[theme][mode])


def build(locale: str) -> Path:
    meta = LABELS[locale]
    canvas = Image.new("RGB", (OUT_W, OUT_H), (248, 250, 252))
    draw = ImageDraw.Draw(canvas)
    font = load_font(28)
    small = load_font(22)

    pad = 48
    header_h = 120
    col_w = (OUT_W - 3 * pad) // 2
    row_h = (OUT_H - header_h - 4 * pad) // 3

    for ci, col in enumerate(meta["cols"]):
        x = pad + ci * (col_w + pad)
        tw = draw.textlength(col, font=font)
        draw.text((x + (col_w - tw) / 2, pad), col, font=font, fill=(24, 28, 28))

    for ri, (row_label, theme) in enumerate(zip(meta["rows"], meta["keys"])):
        y0 = header_h + pad + ri * (row_h + pad)
        draw.text((pad, y0 + row_h // 2 - 14), row_label, font=small, fill=(72, 82, 82))
        for ci, mode in enumerate(("light", "dark")):
            x = pad + ci * (col_w + pad)
            cell = cell_image(theme, mode, col_w, row_h)
            canvas.paste(cell, (x, y0))
            draw.rounded_rectangle((x, y0, x + col_w, y0 + row_h), radius=16, outline=(200, 205, 210), width=2)

    out = SRC / f"themes-grid-{locale}.png"
    canvas.save(out, "PNG", optimize=True)
    return out


def main() -> None:
    for loc in ("de", "en"):
        p = build(loc)
        print(f"Wrote {p}")
        if not THEMES_DIR.exists() or not any(THEMES_DIR.glob("*.png")):
            print(f"  (Swatch placeholders — add captures under {THEMES_DIR}/)")


if __name__ == "__main__":
    main()
