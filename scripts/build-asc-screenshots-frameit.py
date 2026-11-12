#!/usr/bin/env python3
"""App Store v2.6.0 — free device frames via fastlane frameit + MC backgrounds (Pillow prep)."""

from __future__ import annotations

import importlib.util
import json
import math
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "screenshots/app-store/v2.6.0"
SRC = BASE / "_source"
OUT = BASE / "iphone"
WORK = BASE / "frameit/work"
FONT_DIR = BASE / "frameit/fonts"
FONT_FILE = FONT_DIR / "Arial-Bold.ttf"
SYSTEM_FONT = Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf")

ASC_SIZE = (1284, 2778)
PAN_W = ASC_SIZE[0] * 2
# fastlane frameit (iPhone 14 Pro — matches 1179×2556 device exports)
SCREEN_SIZE = (1179, 2556)
DEVICE_TYPE = "iPhone 14 Pro"
FRAME_COLOR = "silver"

MINT = (214, 236, 236)
TEAL_DARK = (27, 114, 114)
TEAL_MID = (91, 191, 191)
INK = (24, 28, 28)
MUTED = (72, 82, 82)
AMBER = (245, 158, 11)
RADAR_BBOX_FRAC = (0.05, 0.30, 0.95, 0.58)

_v260 = importlib.util.spec_from_file_location(
    "compose_v260", ROOT / "scripts/compose-asc-marketing-slides-v260.py"
)
_v260_mod = importlib.util.module_from_spec(_v260)
assert _v260.loader
_v260.loader.exec_module(_v260_mod)
clean_phone_screenshot = _v260_mod.clean_phone_screenshot

SLIDES = [
    {
        "id": "01-brand",
        "out": "01-brand-iphone-{locale}.png",
        "src_de": "about-coach-knows-you-de.png",
        "src_en": "about-coach-knows-you-en.png",
        "bg": "panorama_left",
        "copy": {
            "de": ("EIN COACH, DER SIE KENNT", "Lebenskontext und Verlauf — ein Gedächtnis, das mitdenkt."),
            "en": ("A COACH WHO KNOWS YOU", "Life context and history — memory that follows you."),
        },
    },
    {
        "id": "02-connector-radar",
        "out": "02-connector-radar-iphone-{locale}.png",
        "src_de": "IMG_1649.PNG",
        "src_en": "connector-radar-en-light.png",
        "bg": "panorama_right",
        "radar_card": True,
        "copy": {
            "de": ("IHR VERBINDUNGS-RADAR", "Empathie, Präsenz, Neugier — fünf Dimensionen auf einen Blick."),
            "en": ("YOUR CONNECTION RADAR", "Empathy, presence, curiosity — five dimensions at a glance."),
        },
    },
    {
        "id": "03-connector-persona",
        "out": "03-connector-persona-iphone-{locale}.png",
        "src_de": "IMG_1648.PNG",
        "src_en": "connector-catalog-en.png",
        "bg": "teal",
        "copy": {
            "de": ("ECHTE ALLTAGSSZENEN", "Kurze Gespräche mit KI-Personas — zuhörend üben."),
            "en": ("THE CONNECTOR", "Pick a scenario. One conversation — clear feedback."),
        },
    },
    {
        "id": "04-practice",
        "out": "04-practice-iphone-{locale}.png",
        "src_de": "about-coach-practice-de-light.png",
        "src_en": "about-coach-practice-en.png",
        "bg": "cafe",
        "copy": {
            "de": ("COACHING ÜBEN", "Du bist der Coach — die KI spielt deinen Klienten."),
            "en": ("PRACTICE COACHING", "You are the coach — the AI plays your client."),
        },
    },
    {
        "id": "05-ecosystem",
        "out": "05-ecosystem-iphone-{locale}.png",
        "src_de": "IMG_1647.PNG",
        "src_en": "coach-grid-connector-en.png",
        "bg": "teal_deep",
        "copy": {
            "de": ("THE CONNECTOR", "In der Coach-Auswahl — Alltagsgespräche mit Auswertung."),
            "en": ("MEET THE CONNECTOR", "On your coach grid — practice connection in everyday scenes."),
        },
    },
    {
        "id": "06-themes",
        "out": "06-themes-iphone-{locale}.png",
        "src_de": "themes-grid-de.png",
        "src_en": "themes-grid-en.png",
        "bg": "cafe",
        "copy": {
            "de": (
                "DREI FARBWELTEN",
                "Sommer, Herbst, Brand — in Hell und Dunkel. Du wählst.",
            ),
            "en": (
                "THREE COLOR WORLDS",
                "Summer, autumn, brand — light and dark. Your choice.",
            ),
        },
    },
]


def load_font(size: int) -> ImageFont.FreeTypeFont:
    path = SYSTEM_FONT if SYSTEM_FONT.exists() else FONT_FILE
    if not path.exists():
        raise FileNotFoundError(f"No bold font — install Arial or add {FONT_FILE}")
    return ImageFont.truetype(str(path), size)


def gradient(size: tuple[int, int], c0: tuple[int, int, int], c1: tuple[int, int, int], angle: float = 135) -> Image.Image:
    w, h = size
    img = Image.new("RGB", (w, h))
    px = img.load()
    rad = math.radians(angle)
    dx, dy = math.cos(rad), math.sin(rad)
    corners = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    projs = [x * dx + y * dy for x, y in corners]
    pmin, pmax = min(projs), max(projs)
    span = pmax - pmin or 1.0
    for y in range(h):
        for x in range(w):
            t = max(0.0, min(1.0, (x * dx + y * dy - pmin) / span))
            px[x, y] = (
                int(c0[0] + (c1[0] - c0[0]) * t),
                int(c0[1] + (c1[1] - c0[1]) * t),
                int(c0[2] + (c1[2] - c0[2]) * t),
            )
    return img


def warm_cafe_bg(size: tuple[int, int]) -> Image.Image:
    base = gradient(size, (255, 248, 240), TEAL_MID, 120)
    overlay = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    w, h = size
    for cx, cy, r, color, alpha in [
        (int(w * 0.2), int(h * 0.55), int(w * 0.5), AMBER, 40),
        (int(w * 0.7), int(h * 0.4), int(w * 0.4), (255, 220, 180), 35),
    ]:
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(*color, alpha))
    from PIL import ImageFilter

    overlay = overlay.filter(ImageFilter.GaussianBlur(radius=55))
    return Image.alpha_composite(base.convert("RGBA"), overlay).convert("RGB")


def wrap_lines(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_w: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    cur = ""
    for word in words:
        trial = f"{cur} {word}".strip()
        if draw.textlength(trial, font=font) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines or [text]


def draw_marketing_text(canvas: Image.Image, headline: str, body: str, ink: tuple[int, int, int] = INK, muted: tuple[int, int, int] = MUTED) -> None:
    draw = ImageDraw.Draw(canvas)
    title_font = load_font(68)
    body_font = load_font(32)
    max_w = ASC_SIZE[0] - 120
    y = 110
    for line in wrap_lines(draw, headline, title_font, max_w):
        tw = draw.textlength(line, font=title_font)
        draw.text(((ASC_SIZE[0] - tw) / 2, y), line, font=title_font, fill=ink)
        y += 78
    y += 8
    for line in wrap_lines(draw, body, body_font, max_w):
        tw = draw.textlength(line, font=body_font)
        draw.text(((ASC_SIZE[0] - tw) / 2, y), line, font=body_font, fill=muted)
        y += 44


def panorama_master() -> Image.Image:
    return gradient((PAN_W, ASC_SIZE[1]), MINT, TEAL_DARK, 135)


def background_for(slide: dict, locale: str) -> Image.Image:
    headline, body = slide["copy"][locale]
    kind = slide["bg"]
    if kind == "panorama_left":
        master = panorama_master()
        canvas = master.crop((0, 0, ASC_SIZE[0], ASC_SIZE[1]))
        draw_marketing_text(canvas, headline, body)
        return canvas
    elif kind == "panorama_right":
        master = panorama_master()
        canvas = master.crop((ASC_SIZE[0], 0, PAN_W, ASC_SIZE[1]))
        draw_marketing_text(canvas, headline, body, ink=(255, 255, 255), muted=(220, 230, 230))
        return canvas
    elif kind == "cafe":
        canvas = warm_cafe_bg(ASC_SIZE)
        draw_marketing_text(canvas, headline, body, ink=(32, 28, 24), muted=(80, 72, 68))
        return canvas
    elif kind == "teal_deep":
        canvas = gradient(ASC_SIZE, (180, 220, 220), TEAL_DARK, 125)
    else:
        canvas = gradient(ASC_SIZE, MINT, (22, 90, 90), 150)
    draw_marketing_text(canvas, headline, body)
    return canvas


def _lum(px: tuple[int, int, int]) -> float:
    return sum(px) / 3


def trim_uniform_border(im: Image.Image, max_frac: float = 0.12, tol: int = 18) -> Image.Image:
    """Remove empty/browser margins before cover-crop."""
    w, h = im.size
    px = im.load()
    x0, y0, x1, y1 = 0, 0, w - 1, h - 1
    ymax = int(h * max_frac)
    xmax = int(w * max_frac)

    def row_uniform(y: int) -> bool:
        edge = px[0, y]
        return all(_lum(px[x, y]) > 240 or abs(_lum(px[x, y]) - _lum(edge)) < tol for x in range(0, w, max(1, w // 40)))

    def col_uniform(x: int) -> bool:
        edge = px[x, 0]
        return all(_lum(px[x, y]) > 240 or abs(_lum(px[x, y]) - _lum(edge)) < tol for y in range(0, h, max(1, h // 40)))

    while y0 < ymax and row_uniform(y0):
        y0 += 1
    while h - 1 - y1 < ymax and row_uniform(y1):
        y1 -= 1
    while x0 < xmax and col_uniform(x0):
        x0 += 1
    while w - 1 - x1 < xmax and col_uniform(x1):
        x1 -= 1
    if x1 <= x0 or y1 <= y0:
        return im
    return im.crop((x0, y0, x1 + 1, y1 + 1))


def fit_screen(shot: Image.Image) -> Image.Image:
    """Cover-crop to device screen — no letterbox bars (white or dark)."""
    shot = trim_uniform_border(shot)
    tw, th = SCREEN_SIZE
    sw, sh = shot.size
    scale = max(tw / sw, th / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    im = shot.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return im.crop((left, top, left + tw, top + th))


def radar_zoom_crop(shot: Image.Image) -> Image.Image:
    w, h = shot.size
    l, t, r, b = RADAR_BBOX_FRAC
    crop = shot.crop((int(w * l), int(h * t), int(w * r), int(h * b)))
    pad = 20
    card = Image.new("RGBA", (crop.width + 2 * pad, crop.height + 2 * pad), (0, 0, 0, 0))
    cd = ImageDraw.Draw(card)
    cd.rounded_rectangle((0, 0, card.width - 1, card.height - 1), radius=18, fill=(255, 255, 255, 255))
    card.paste(crop, (pad, pad))
    return card


def composite_radar_card(screen: Image.Image, radar_src: Image.Image) -> Image.Image:
    out = screen.copy()
    card = radar_zoom_crop(radar_src)
    target_w = int(screen.width * 0.42)
    scale = target_w / card.width
    card = card.resize((target_w, int(card.height * scale)), Image.Resampling.LANCZOS)
    x = screen.width - card.width - int(screen.width * 0.06)
    y = int(screen.height * 0.22)
    out.paste(card, (x, y), card)
    return out


def load_src(name: str) -> Image.Image:
    path = SRC / name
    if not path.exists():
        raise FileNotFoundError(path)
    return clean_phone_screenshot(Image.open(path).convert("RGB"))


def resize_to_asc(img: Image.Image) -> Image.Image:
    tw, th = ASC_SIZE
    sw, sh = img.size
    scale = max(tw / sw, th / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left, top = (nw - tw) // 2, (nh - th) // 2
    return resized.crop((left, top, left + tw, top + th))


def build_locale(locale: str) -> None:
    screens_dir = WORK / locale
    bg_dir = WORK / "backgrounds" / locale
    if screens_dir.exists():
        shutil.rmtree(screens_dir)
    screens_dir.mkdir(parents=True)
    bg_dir.mkdir(parents=True, exist_ok=True)

    frame_data: list[dict] = []
    for slide in SLIDES:
        src_key = f"src_{locale}"
        shot = load_src(slide[src_key])
        screen = fit_screen(shot)
        if slide.get("radar_card"):
            screen = composite_radar_card(screen, shot)
        screen_path = screens_dir / f"{slide['id']}.png"
        screen.save(screen_path, "PNG", optimize=True)

        bg_path = bg_dir / f"{slide['id']}.png"
        background_for(slide, locale).save(bg_path, "PNG", optimize=True)

        frame_data.append(
            {
                "filter": slide["id"],
                "background": f"../backgrounds/{locale}/{slide['id']}.png",
            }
        )

    framefile = {
        "device_frame_version": "latest",
        "default": {
            "padding": 75,
            "force_device_type": DEVICE_TYPE,
        },
        "data": frame_data,
    }
    (screens_dir / "Framefile.json").write_text(json.dumps(framefile, indent=2) + "\n", encoding="utf-8")

    print(f"→ fastlane frameit {FRAME_COLOR} ({locale}) …")
    subprocess.run(
        ["fastlane", "frameit", FRAME_COLOR],
        cwd=screens_dir,
        check=True,
    )

    OUT.mkdir(parents=True, exist_ok=True)
    for slide in SLIDES:
        framed = screens_dir / f"{slide['id']}_framed.png"
        if not framed.exists():
            raise FileNotFoundError(f"frameit did not produce {framed}")
        out_name = slide["out"].format(locale=locale)
        resize_to_asc(Image.open(framed).convert("RGB")).save(OUT / out_name, "PNG", optimize=True)
        print(f"  ✓ {out_name}")


def main() -> None:
    if shutil.which("fastlane") is None:
        print("Install: brew install fastlane imagemagick && fastlane frameit download_frames", file=sys.stderr)
        sys.exit(1)
    themes_script = ROOT / "scripts/build-asc-themes-grid-screen.py"
    subprocess.run([sys.executable, str(themes_script)], check=True)
    WORK.mkdir(parents=True, exist_ok=True)
    for locale in ("de", "en"):
        build_locale(locale)
    n = len(list(OUT.glob("*.png")))
    print(f"\nDone — {OUT}/ ({n}× {ASC_SIZE[0]}×{ASC_SIZE[1]})")


if __name__ == "__main__":
    main()
