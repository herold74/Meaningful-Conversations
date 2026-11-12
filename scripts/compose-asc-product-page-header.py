#!/usr/bin/env python3
"""
App Store Connect — Product page header (21:9).

Spec: 3840 × 1646 px, PNG/JPEG, RGB without alpha.
Art safe area (Apple template): 1646 × 661 at (1097, 493) — keep headline + focal UI inside.

https://developer.apple.com/help/app-store-connect/reference/app-information/creative-assets-specifications/
https://developer.apple.com/app-store/asset-best-practices/

Usage:
  python3 scripts/compose-asc-product-page-header.py
  python3 scripts/compose-asc-product-page-header.py --guides   # draw safe-area box (review only)
"""

from __future__ import annotations

import argparse
import importlib.util
import struct
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
VERSION = "v2.6.0"
BASE = ROOT / "screenshots" / "app-store" / VERSION
# Sharper café scene than the 1179 set (same photo, larger export).
CAFE = BASE / "asc-upload" / "iphone-dynamic-island-large"
# Vertical window into the portrait café shot (below the burned-in slide headline).
CAFE_CROP_Y = 1000
CHAT = {
    "de": BASE / "_source" / "coaching-chat-de.png",
    "en": BASE / "_source" / "coaching-chat-en.png",
}
OUT_ROOT = BASE / "asc-upload" / "product-page-header"

W, H = 3840, 1646
SAFE_X, SAFE_Y, SAFE_W, SAFE_H = 1097, 493, 1646, 661

# ManualMode brand (match ASC marketing slides)
BG_LEFT = (232, 245, 244)
BG_MID = (170, 214, 211)
BG_RIGHT = (27, 114, 114)
INK = (14, 52, 52)
MUTED = (44, 84, 84)
ACCENT = (245, 158, 11)

COPY = {
    "de": {
        "headline": "Coaching,\nwo Sie sind.",
        "sub": "Jederzeit. Persönlich. Privat.",
        "slide": "00-lifestyle-iphone-de.png",
        "out": "manualmode-product-page-header-de.png",
    },
    "en": {
        "headline": "Coaching\nwhere you are.",
        "sub": "Anytime. Personal. Private.",
        "slide": "00-lifestyle-iphone-en.png",
        "out": "manualmode-product-page-header-en.png",
    },
}

def _first_font(*candidates: Path) -> Path:
    for path in candidates:
        if path.is_file():
            return path
    return candidates[-1]


TITLE_FONT = _first_font(
    Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf"),
    Path("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"),
)
BODY_FONT = _first_font(
    Path("/System/Library/Fonts/Supplemental/Arial.ttf"),
    Path("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"),
)


def load_font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    if path.exists():
        return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def _lifestyle():
    spec = importlib.util.spec_from_file_location(
        "frame_asc", ROOT / "scripts" / "frame-asc-marketing-device.py"
    )
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader
    import sys
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)
    return mod


def _screen_mask_on_header(photo: Image.Image, header_size: tuple[int, int]) -> Image.Image:
    """Occlusion mask from the café photo (fingers, island), mapped onto the header crop."""
    mod = _lifestyle()
    mask = mod._lifestyle_screen_mask(photo)
    slide_h = 2778
    scale = slide_h / photo.height
    slide = mask.resize((round(photo.width * scale), slide_h), Image.Resampling.NEAREST)
    slide = slide.crop((mod.LIFESTYLE_CROP_X, 0, mod.LIFESTYLE_CROP_X + 1284, slide_h))
    # Same cover the large export uses (1320×2868 from 1284×2778).
    cover = max(1320 / slide.width, 2868 / slide.height)
    large = slide.resize((round(slide.width * cover), round(slide.height * cover)), Image.Resampling.NEAREST)
    left = (large.width - 1320) // 2
    top = (large.height - 2868) // 2
    large = large.crop((left, top, left + 1320, top + 2868))
    band_h = round(1320 * header_size[1] / header_size[0])
    band = large.crop((0, CAFE_CROP_Y, 1320, CAFE_CROP_Y + band_h))
    return band.resize(header_size, Image.Resampling.BILINEAR)


def _quad_on_header(photo: Image.Image) -> list[tuple[float, float]]:
    mod = _lifestyle()
    slide_h = 2778
    scale = slide_h / photo.height
    cover = max(1320 / 1284, 2868 / 2778)
    large_w, large_h = round(1284 * cover), round(2778 * cover)
    left = (large_w - 1320) // 2
    top = (large_h - 2868) // 2
    band_h = round(1320 * H / W)
    sx, sy = W / 1320, H / band_h
    quad = []
    for x, y in mod.LIFESTYLE_SCREEN_QUAD:
        lx = x * scale - mod.LIFESTYLE_CROP_X
        ly = y * scale
        hx = (lx * cover - left) * sx
        hy = (ly * cover - top - CAFE_CROP_Y) * sy
        quad.append((hx, hy))
    return quad


def rescreen(canvas: Image.Image, locale: str) -> Image.Image:
    """Paint the native chat screenshot into the phone, at header resolution."""
    mod = _lifestyle()
    photo = Image.open(mod.LIFESTYLE_PHOTO).convert("RGB")
    chat = mod._hide_status_island(Image.open(CHAT[locale]).convert("RGB"))
    quad = _quad_on_header(photo)
    corners = [(0, 0), (chat.width, 0), (chat.width, chat.height), (0, chat.height)]
    warped = chat.transform(
        canvas.size,
        Image.Transform.PERSPECTIVE,
        mod._perspective_coeffs(quad, corners),
        Image.Resampling.BICUBIC,
    )
    mask = _screen_mask_on_header(photo, canvas.size)
    # Keep the photo's light falloff; the UI itself stays sharp.
    old = np.asarray(canvas.convert("RGB")).astype(np.float32)
    new = np.asarray(warped).astype(np.float32)
    m = np.asarray(mask) > 140
    if m.any():
        lum = old.mean(axis=2)
        shade = np.clip(lum / np.percentile(lum[m], 96), 0.78, 1.0)
        new *= shade[..., None]
    out = Image.fromarray(np.clip(new, 0, 255).astype(np.uint8))
    edge = mask.filter(ImageFilter.GaussianBlur(0.8))
    return Image.composite(out, canvas.convert("RGB"), edge)


def cafe_frame(path: Path) -> Image.Image:
    """21:9 slice of the café portrait, below the slide's own headline."""
    im = Image.open(path).convert("RGB")
    sw, sh = im.size
    band_h = round(sw * H / W)
    y0 = min(CAFE_CROP_Y, sh - band_h)
    frame = im.crop((0, y0, sw, y0 + band_h)).resize((W, H), Image.Resampling.LANCZOS)
    return frame.filter(ImageFilter.UnsharpMask(radius=1.4, percent=50, threshold=2))


def _text_width(text: str, font: ImageFont.FreeTypeFont) -> float:
    return ImageDraw.Draw(Image.new("RGB", (4, 4))).textlength(text, font=font)


def _fit_font(text: str, path: Path, max_w: int, max_size: int = 240) -> ImageFont.FreeTypeFont:
    lo, hi, best = 28, max_size, 28
    while lo <= hi:
        mid = (lo + hi) // 2
        font = load_font(path, mid)
        if _text_width(text, font) <= max_w:
            best = mid
            lo = mid + 1
        else:
            hi = mid - 1
    return load_font(path, best)


def scene(locale: str) -> Image.Image:
    """Café + phone, no headline card."""
    meta = COPY[locale]
    slide = CAFE / locale / meta["slide"]
    if not slide.is_file():
        raise SystemExit(f"Missing café slide: {slide}")
    canvas = cafe_frame(slide).convert("RGB")
    return rescreen(canvas, locale).convert("RGBA")


def paint_card(
    canvas: Image.Image,
    bounds: tuple[int, int, int, int],
    locale: str,
    *,
    max_title: int = 360,
    sub_ratio: float = 0.42,
    pad: int = 48,
    anchor: str = "center",
    shift_x: float = 0,
    shift_y: float = 0,
) -> Image.Image:
    """Draw the headline card so the whole rounded box stays inside `bounds`."""
    meta = COPY[locale]
    x0, y0, x1, y1 = bounds
    inner_w = max(80, (x1 - x0) - pad * 2)
    inner_h = max(80, (y1 - y0) - pad * 2)
    lines = [ln.strip() for ln in meta["headline"].split("\n") if ln.strip()]
    longest = max(lines, key=len)
    title_font = body_font = None
    title_h = body_h = 0
    for size in range(max_title, 48, -2):
        title_font = load_font(TITLE_FONT, size)
        body_font = load_font(BODY_FONT, max(32, int(size * sub_ratio)))
        if _text_width(longest, title_font) > inner_w:
            continue
        if _text_width(meta["sub"], body_font) > inner_w:
            continue
        title_h = int(size * 1.05)
        body_h = int(body_font.size * 1.2)
        block_h = title_h * len(lines) + 28 + body_h
        if block_h <= inner_h:
            break
    assert title_font and body_font
    block_h = title_h * len(lines) + 28 + body_h
    box_w = min(inner_w, int(_text_width(longest, title_font)) + 8) + pad * 2
    box_h = block_h + pad * 2
    left = x0 + ((x1 - x0) - box_w) // 2 + int(box_w * shift_x)
    if anchor == "top":
        top = y0 + 8
    else:
        top = y0 + ((y1 - y0) - box_h) // 2
    top += int(box_h * shift_y)
    box = (left, top, left + box_w, top + box_h)

    scrim = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(scrim).rounded_rectangle(box, radius=36, fill=(255, 248, 240, 210))
    scrim = scrim.filter(ImageFilter.GaussianBlur(8))
    canvas = Image.alpha_composite(canvas, scrim)

    draw = ImageDraw.Draw(canvas)
    x = box[0] + pad
    y = box[1] + pad
    for line in lines:
        draw.text((x, y), line, fill=INK, font=title_font)
        y += title_h
    y += 8
    draw.rounded_rectangle((x, y, x + min(320, inner_w // 3), y + 12), radius=6, fill=ACCENT)
    y += 28
    draw.text((x, y), meta["sub"], fill=MUTED, font=body_font)
    return canvas


def compose(locale: str, guides: bool = False) -> Image.Image:
    canvas = scene(locale)
    inset = 12
    bounds = (
        SAFE_X + inset,
        SAFE_Y + inset,
        SAFE_X + SAFE_W - inset,
        SAFE_Y + SAFE_H - inset,
    )
    canvas = paint_card(canvas, bounds, locale)
    if guides:
        ImageDraw.Draw(canvas).rectangle(
            (SAFE_X, SAFE_Y, SAFE_X + SAFE_W, SAFE_Y + SAFE_H),
            outline=(255, 0, 128),
            width=4,
        )
    return canvas.convert("RGB")


def validate_png(path: Path) -> None:
    with Image.open(path) as im:
        if im.size != (W, H):
            raise SystemExit(f"✗ {path.name}: expected {W}×{H}, got {im.size}")
        if im.mode != "RGB":
            raise SystemExit(f"✗ {path.name}: expected RGB, got {im.mode}")
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
                ct = data[9]
                if ct in (4, 6):
                    raise SystemExit(f"✗ {path.name}: alpha channel not allowed (type {ct})")
                break
            if ctype == b"IEND":
                break


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--guides", action="store_true", help="draw safe-area outline")
    args = parser.parse_args()

    if not CAFE.is_dir():
        raise SystemExit(f"Missing café slides: {CAFE}")

    OUT_ROOT.mkdir(parents=True, exist_ok=True)
    for locale in ("de", "en"):
        out_dir = OUT_ROOT / locale
        out_dir.mkdir(parents=True, exist_ok=True)
        dest = out_dir / COPY[locale]["out"]
        img = compose(locale, guides=args.guides)
        img.save(dest, "PNG", optimize=True)
        validate_png(dest)
        print(f"  ✓ {dest.relative_to(ROOT)}  ({W}×{H})")

    print("\nUpload: App Store Connect → Product Page Information → Header and Search Results")
    print("  Placement: Product page header only (21:9)")
    print("  DE → asc-upload/product-page-header/de/")
    print("  EN (Canada) → asc-upload/product-page-header/en/")
    print("  Preview in ASC on iPhone + iPad before submit.")


if __name__ == "__main__":
    main()
