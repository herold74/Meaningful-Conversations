#!/usr/bin/env python3
"""Align circular avatar backgrounds with connector-tile.png (Bot Selection utility tiles + Nobody)."""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
AVATARS = ROOT / "public" / "avatars"
REFERENCE = AVATARS / "connector-tile.png"
TARGETS = ("transcript-tile.png", "nobody.png")


def is_foreground(r: int, g: int, b: int) -> bool:
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    if lum < 95:
        return True
    if r > 180 and g > 100 and b < 120:
        return True
    if r > 200 and g > 200 and b > 200:
        return True
    return False


def sync_backgrounds() -> None:
    conn = Image.open(REFERENCE).convert("RGBA")
    cw, ch = conn.size
    ccx, ccy = cw // 2, ch // 2
    max_r = cw * 0.495

    for name in TARGETS:
        path = AVATARS / name
        im = Image.open(path).convert("RGBA")
        if im.size != (cw, ch):
            im = im.resize((cw, ch), Image.Resampling.LANCZOS)
        out = Image.new("RGBA", (cw, ch), (255, 255, 255, 255))
        src = im.load()
        ref = conn.load()
        dst = out.load()
        for y in range(ch):
            for x in range(cw):
                r, g, b, a = src[x, y]
                if math.hypot(x - ccx, y - ccy) > max_r or a < 5:
                    continue
                if is_foreground(r, g, b):
                    dst[x, y] = (r, g, b, 255)
                else:
                    cr, cg, cb, _ = ref[x, y]
                    dst[x, y] = (cr, cg, cb, 255)
        out.convert("RGB").save(path, optimize=True)
        print(f"Updated {path.relative_to(ROOT)}")


if __name__ == "__main__":
    sync_backgrounds()
