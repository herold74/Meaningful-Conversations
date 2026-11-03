#!/usr/bin/env python3
"""
Search-results creative (3:2).

Apple's search card is 3:2, not the 16:9 universal image. A 5244×2950 file
gets cropped to a short strip and the headline is cut off.

Canvas: 3840 × 2560. Safe area (Apple template): 2168 × 1030 at (836, 765).
The whole headline card stays inside that box.

Usage:
  python3 scripts/compose-asc-universal-asset.py
  python3 scripts/compose-asc-universal-asset.py --guides
"""

from __future__ import annotations

import argparse
import struct
from pathlib import Path

from PIL import Image, ImageDraw

import importlib.util

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "screenshots" / "app-store" / "v2.6.0"
OUT_ROOT = BASE / "asc-upload" / "search-results"

W, H = 3840, 2560
# Apple search-results safe area on the 3840×2560 template.
SAFE = (836, 765, 2168, 1030)

FILES = {
    "de": "manualmode-search-de.png",
    "en": "manualmode-search-en.png",
}


def _header():
    spec = importlib.util.spec_from_file_location(
        "asc_header", ROOT / "scripts" / "compose-asc-product-page-header.py"
    )
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(mod)
    return mod


# Window into the portrait café slide (1320×2868): hands and phone, no face.
# x, y, width — height follows the 3:2 frame.
# Full phone including the top bezel, both hands, cup. No face or hair.
PHOTO_WINDOW = (200, 1380, 1120)


def photo(locale: str) -> Image.Image:
    """Hands and phone, higher in the frame, cheek cropped out."""
    hdr = _header()
    slide = hdr.CAFE / locale / hdr.COPY[locale]["slide"]
    if not slide.is_file():
        raise SystemExit(f"Missing café slide: {slide}")
    im = Image.open(slide).convert("RGB")
    x, y, w = PHOTO_WINDOW
    h = round(w * H / W)
    return im.crop((x, y, x + w, y + h)).resize((W, H), Image.Resampling.LANCZOS)


def place(locale: str, guides: bool) -> Image.Image:
    """Café full-bleed; headline card entirely inside the search safe area."""
    hdr = _header()
    canvas = photo(locale).convert("RGBA")
    sx, sy, sw, sh = SAFE
    # iPhone search shows a shorter strip than the template box. Keep the
    # card in the upper part so the subtitle is not cut off.
    canvas = hdr.paint_card(
        canvas,
        (sx + 80, sy + 12, sx + sw - 80, sy + int(sh * 0.72)),
        locale,
        max_title=210,
        sub_ratio=0.36,
        pad=32,
        anchor="top",
    )
    if guides:
        ImageDraw.Draw(canvas).rectangle(
            (sx, sy, sx + sw - 1, sy + sh - 1), outline=(255, 0, 128), width=6
        )
    return canvas.convert("RGB")


def validate(path: Path) -> None:
    with Image.open(path) as im:
        if im.size != (W, H) or im.mode != "RGB":
            raise SystemExit(f"✗ {path.name}: {im.size} {im.mode}")
    with path.open("rb") as f:
        f.read(8)
        while True:
            ln = f.read(4)
            if len(ln) < 4:
                break
            length = struct.unpack(">I", ln)[0]
            ctype = f.read(4)
            data = f.read(length)
            f.read(4)
            if ctype == b"IHDR" and data[9] in (4, 6):
                raise SystemExit(f"✗ {path.name}: alpha not allowed")
            if ctype in (b"IHDR", b"IEND"):
                break


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--guides", action="store_true")
    args = parser.parse_args()
    for locale, out_name in FILES.items():
        img = place(locale, guides=args.guides)
        dest = OUT_ROOT / locale / out_name
        dest.parent.mkdir(parents=True, exist_ok=True)
        img.save(dest, "PNG", optimize=True)
        validate(dest)
        print(f"  ✓ {dest.relative_to(ROOT)}  ({W}×{H})")
    print("\nSearch slot is 3:2 (3840×2560), not the 16:9 universal file.")
    print("Upload: Kopfzeile und Suchergebnisse → Suchergebnisse")


if __name__ == "__main__":
    main()
