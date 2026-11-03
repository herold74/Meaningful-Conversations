#!/usr/bin/env python3
"""
Search-results creative (5244×2950).

The café scene fills the frame. The headline card is drawn so the whole box
sits inside Apple's safe area (the search-result spacer).

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
OUT_ROOT = BASE / "asc-upload" / "universal"

W, H = 5244, 2950
# Apple search-result safe area — the whole headline card must stay inside this.
SAFE = (1921, 660, 1402, 962)

FILES = {
    "de": "manualmode-universal-de.png",
    "en": "manualmode-universal-en.png",
}


def _header():
    spec = importlib.util.spec_from_file_location(
        "asc_header", ROOT / "scripts" / "compose-asc-product-page-header.py"
    )
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(mod)
    return mod


def cover(src: Image.Image, tw: int, th: int) -> Image.Image:
    scale = max(tw / src.width, th / src.height)
    plate = src.resize((round(src.width * scale), round(src.height * scale)), Image.Resampling.LANCZOS)
    left = (plate.width - tw) // 2
    top = max(0, (plate.height - th) // 3)
    top = min(top, plate.height - th)
    return plate.crop((left, top, left + tw, top + th))


def place(locale: str, guides: bool) -> Image.Image:
    """Café full-bleed; headline card entirely inside the search safe area."""
    hdr = _header()
    canvas = cover(hdr.scene(locale).convert("RGB"), W, H).convert("RGBA")
    sx, sy, sw, sh = SAFE
    margin = 16
    canvas = hdr.paint_card(
        canvas,
        (sx + margin, sy + margin, sx + sw - margin, sy + sh - margin),
        locale,
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
    print("\nSearch slot: headline card is fully inside the safe area.")
    print("Upload: Kopfzeile und Suchergebnisse → Suchergebnisse")


if __name__ == "__main__":
    main()
