#!/usr/bin/env python3
"""Grid overview of v2.6.0 ASC iPhone / iPad slides (DE / EN) for visual consistency review."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "screenshots/app-store/v2.6.0"

IPHONE_STEMS = [
    ("00", "lifestyle"),
    ("01", "brand"),
    ("02", "connector-persona"),
    ("03", "connector-radar"),
    ("04", "coach-grid"),
    ("05", "voice-coaching"),
    ("06", "coaching-chat"),
    ("07", "practice"),
    ("08", "themes"),
]

IPAD_STEMS = [
    ("00", "lifestyle"),
    ("01", "brand"),
    ("02", "connector"),
    ("03", "connector-radar"),
    ("04", "coach-grid"),
    ("05", "coaching-chat"),
    ("06", "practice"),
    ("07", "themes"),
]

THUMB_W = 342
GAP = 28
PAD = 48
HEADER_H = 100
LABEL_H = 56
COLS = 4
BG = (245, 247, 248)
CELL_BG = (255, 255, 255)
INK = (24, 28, 28)
MUTED = (90, 100, 100)

TITLE_FONT = Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf")
BODY_FONT = Path("/System/Library/Fonts/Supplemental/Arial.ttf")


def slide_path(device: str, locale: str, num: str, name: str) -> Path:
    folder = OUT / device
    return folder / f"{num}-{name}-{device}-{locale}.png"


def ordered_slides(device: str, locale: str) -> list[tuple[str, str, Path]]:
    stems = IPHONE_STEMS if device == "iphone" else IPAD_STEMS
    out: list[tuple[str, str, Path]] = []
    for num, name in stems:
        path = slide_path(device, locale, num, name)
        if not path.is_file():
            raise FileNotFoundError(path)
        out.append((num, name, path))
    return out


def sample_in_app_header_rgb(img: Image.Image) -> tuple[int, int, int]:
    """Rough sample of status-bar region inside the framed device (marketing slide)."""
    w, h = img.size
    x = int(w * 0.52)
    y = int(h * 0.22)
    return img.getpixel((x, y))[:3]


def build_moodboard(device: str, locale: str) -> Image.Image:
    slides = ordered_slides(device, locale)
    if device == "ipad":
        thumb_h = int(THUMB_W * 2732 / 2048)
        slide_range = "00–07"
        chrome_hint = "Oberteil = Marketing-Gradient; im Gerät: Dark Mode (absicht)"
    else:
        thumb_h = int(THUMB_W * 2778 / 1284)
        slide_range = "00–08"
        chrome_hint = "Oberteil = Marketing-Gradient; im Gerät: App-Chrome (hell vs. saisonal)"
    row_h = thumb_h + LABEL_H + GAP

    rows = (len(slides) + COLS - 1) // COLS
    grid_w = COLS * THUMB_W + (COLS - 1) * GAP
    canvas_w = grid_w + 2 * PAD
    canvas_h = HEADER_H + rows * row_h + PAD

    canvas = Image.new("RGB", (canvas_w, canvas_h), BG)
    draw = ImageDraw.Draw(canvas)
    title_f = ImageFont.truetype(str(TITLE_FONT), 36)
    label_f = ImageFont.truetype(str(BODY_FONT), 22)
    hint_f = ImageFont.truetype(str(BODY_FONT), 18)

    loc_label = "Deutsch" if locale == "de" else "English (Canada)"
    dev_label = "iPad" if device == "ipad" else "iPhone"
    draw.text(
        (PAD, 28),
        f"v2.6.0 App Store — {loc_label} · {dev_label} · Slides {slide_range}",
        fill=INK,
        font=title_f,
    )
    draw.text((PAD, 68), chrome_hint, fill=MUTED, font=hint_f)

    for i, (num, name, path) in enumerate(slides):
        row, col = divmod(i, COLS)
        row_cols = min(COLS, len(slides) - row * COLS)
        row_offset = 0
        if row_cols < COLS:
            row_offset = (grid_w - (row_cols * THUMB_W + (row_cols - 1) * GAP)) // 2

        x = PAD + row_offset + col * (THUMB_W + GAP)
        y = HEADER_H + row * row_h

        im = Image.open(path).convert("RGB")
        im = im.resize((THUMB_W, thumb_h), Image.Resampling.LANCZOS)
        sample = sample_in_app_header_rgb(Image.open(path).convert("RGB"))

        cell = Image.new("RGB", (THUMB_W + 8, thumb_h + 8), CELL_BG)
        cell.paste(im, (4, 4))
        canvas.paste(cell, (x - 4, y - 4))

        draw.text((x, y + thumb_h + 8), f"{num} · {name}", fill=INK, font=label_f)
        sw = 20
        draw.rectangle((x, y + thumb_h + 34, x + sw, y + thumb_h + 34 + sw), fill=sample, outline=MUTED)
        draw.text(
            (x + sw + 8, y + thumb_h + 32),
            f"Chrome ~{sample[0]},{sample[1]},{sample[2]}",
            fill=MUTED,
            font=hint_f,
        )

    return canvas


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--device", choices=("iphone", "ipad", "all"), default="all")
    args = parser.parse_args()
    devices = ("iphone", "ipad") if args.device == "all" else (args.device,)
    for device in devices:
        for locale in ("de", "en"):
            board = build_moodboard(device, locale)
            suffix = f"-{device}" if device == "ipad" else ""
            out_path = OUT / f"moodboard{suffix}-{locale}.png"
            board.save(out_path, optimize=True)
            print(f"Wrote {out_path} ({board.size[0]}×{board.size[1]})")


if __name__ == "__main__":
    main()
