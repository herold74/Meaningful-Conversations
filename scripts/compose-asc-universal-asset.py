#!/usr/bin/env python3
"""
Universal creative asset from the approved 21:9 product-page header.

The approved 21:9 header is scaled up and cropped to 5244×2950. One sharp picture —
no second blurred layer above or below.

Usage:
  python3 scripts/compose-asc-universal-asset.py
  python3 scripts/compose-asc-universal-asset.py --guides
"""

from __future__ import annotations

import argparse
import struct
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "screenshots" / "app-store" / "v2.6.0"
HEADER = BASE / "asc-upload" / "product-page-header"
OUT_ROOT = BASE / "asc-upload" / "universal"

W, H = 5244, 2950
SAFE = (1921, 660, 1402, 962)

# Headline ink on the approved header (measured on the DE master).
TEXT_BOX = (1139, 590, 2323, 956)

FILES = {
    "de": ("manualmode-product-page-header-de.png", "manualmode-universal-de.png"),
    "en": ("manualmode-product-page-header-en.png", "manualmode-universal-en.png"),
}


def place_header(src: Image.Image, locale: str) -> Image.Image:
    """Cover-crop the approved header. Sharp edge to edge; headline pulled into the safe area."""
    del locale  # DE and EN share the same crop; the artwork already differs.
    sx, sy, sw, sh = SAFE
    x0, y0, x1, y1 = TEXT_BOX
    safe_bottom = sy + sh - 20
    # Scale past a plain cover so the subline can move up into the safe area
    # without leaving a gap. Everything stays the sharp header — no blur pass.
    scale = max(
        W / src.width,
        H / src.height,
        (H - safe_bottom) / (src.height - y1),
    )
    plate = src.resize((round(src.width * scale), round(src.height * scale)), Image.Resampling.LANCZOS)

    text_cx = (x0 + x1) / 2 * scale
    crop_x = round(text_cx - (sx + sw / 2))
    crop_x = max(0, min(crop_x, plate.width - W))

    text_bottom = y1 * scale
    crop_y = round(text_bottom - (sy + sh - 20))
    crop_y = max(0, min(crop_y, plate.height - H))

    return plate.crop((crop_x, crop_y, crop_x + W, crop_y + H))


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
    for locale, (src_name, out_name) in FILES.items():
        src_path = HEADER / locale / src_name
        if not src_path.is_file():
            raise SystemExit(f"Missing approved header: {src_path}")
        img = place_header(Image.open(src_path).convert("RGB"), locale)
        if args.guides:
            sx, sy, sw, sh = SAFE
            ImageDraw.Draw(img).rectangle((sx, sy, sx + sw - 1, sy + sh - 1), outline=(255, 0, 128), width=6)
        dest = OUT_ROOT / locale / out_name
        dest.parent.mkdir(parents=True, exist_ok=True)
        img.save(dest, "PNG", optimize=True)
        validate(dest)
        print(f"  ✓ {dest.relative_to(ROOT)}  ({W}×{H})")
    print("\nSame artwork as the product-page header, framed for the universal slot.")
    print("Upload: Header and Search Results → universal asset")


if __name__ == "__main__":
    main()
