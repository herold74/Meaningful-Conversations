#!/usr/bin/env python3
"""
Export App Store Connect iPhone screenshot upload sets from v2.6.0 masters.

Masters: screenshots/app-store/v{version}/iphone/*-{de|en}.png (1284×2778, composited).
Upload: 1179×2556 PNG RGB (no alpha) for ASC tab
        «iPhone mit Dynamic Island (Mitteldisplay) — 6,1″ / 6,3″».

See Apple's asset best practices (accurate UI, no prices/URLs in artwork):
https://developer.apple.com/app-store/asset-best-practices/

Usage:
  python3 scripts/export-asc-iphone-upload.py
  python3 scripts/export-asc-iphone-upload.py --version v2.6.0
  python3 scripts/export-asc-iphone-upload.py --also-large   # 1320×2868 optional slot
"""

from __future__ import annotations

import argparse
import struct
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]

# ASC — iPhone with Dynamic Island (medium display), portrait
ASC_MEDIUM = (1179, 2556)
# ASC — iPhone with Dynamic Island (large display), portrait (optional)
ASC_LARGE = (1320, 2868)

SLOTS = tuple(f"{i:02d}" for i in range(9))  # 00 … 08


def cover_crop(img: Image.Image, tw: int, th: int) -> Image.Image:
    img = img.convert("RGB")
    sw, sh = img.size
    scale = max(tw / sw, th / sh)
    nw, nh = int(sw * scale + 0.5), int(sh * scale + 0.5)
    img = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return img.crop((left, top, left + tw, top + th))


def png_color_type(path: Path) -> int:
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
            if ctype == b"IHDR":
                return data[9]
            if ctype == b"IEND":
                break
    raise ValueError(f"no IHDR in {path}")


def validate(path: Path, expected: tuple[int, int]) -> None:
    with Image.open(path) as im:
        if im.size != expected:
            raise SystemExit(f"✗ {path.name}: size {im.size}, expected {expected}")
    ct = png_color_type(path)
    if ct in (4, 6):
        raise SystemExit(f"✗ {path.name}: PNG has alpha (color type {ct}) — ASC rejects this")


def export_locale(
    masters: Path,
    out_dir: Path,
    locale: str,
    size: tuple[int, int],
) -> int:
    out_dir.mkdir(parents=True, exist_ok=True)
    count = 0
    for slot in SLOTS:
        matches = sorted(masters.glob(f"{slot}-*-{locale}.png"))
        if not matches:
            print(f"  ⚠ missing slot {slot} for {locale}")
            continue
        if len(matches) > 1:
            print(f"  ⚠ multiple matches for {slot}-{locale}, using {matches[0].name}")
        src = matches[0]
        dest = out_dir / src.name
        cover_crop(Image.open(src), size[0], size[1]).save(dest, "PNG", optimize=True)
        validate(dest, size)
        count += 1
    return count


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--version", default="v2.6.0", help="app-store folder version tag")
    parser.add_argument(
        "--also-large",
        action="store_true",
        help="also write 1320×2868 to asc-upload/iphone-dynamic-island-large/",
    )
    args = parser.parse_args()

    base = ROOT / "screenshots" / "app-store" / args.version
    masters = base / "iphone"
    if not masters.is_dir():
        raise SystemExit(f"Missing masters dir: {masters}\nRun: python3 scripts/frame-asc-marketing-device.py v260")

    medium_root = base / "asc-upload" / "iphone-dynamic-island-medium"
    print(f"Export ASC medium {ASC_MEDIUM[0]}×{ASC_MEDIUM[1]} → {medium_root.relative_to(ROOT)}/")
    for locale, folder in (("de", "de"), ("en", "en")):
        n = export_locale(masters, medium_root / folder, locale, ASC_MEDIUM)
        print(f"  ✓ {folder}/ — {n} screenshots")

    if args.also_large:
        large_root = base / "asc-upload" / "iphone-dynamic-island-large"
        print(f"Export ASC large {ASC_LARGE[0]}×{ASC_LARGE[1]} → {large_root.relative_to(ROOT)}/")
        for locale, folder in (("de", "de"), ("en", "en")):
            n = export_locale(masters, large_root / folder, locale, ASC_LARGE)
            print(f"  ✓ {folder}/ — {n} screenshots")

    print("\nUpload in App Store Connect:")
    print("  Tab: iPhone mit Dynamic Island (Mitteldisplay) — 6,1″ / 6,3″")
    print("  Lokalisierung Deutsch → asc-upload/.../medium/de/")
    print("  Lokalisierung English (Canada) → asc-upload/.../medium/en/")
    print("  Reihenfolge: 00 … 08 (Karussell-Story)")


if __name__ == "__main__":
    main()
