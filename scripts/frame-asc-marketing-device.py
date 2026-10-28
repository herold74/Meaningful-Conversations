#!/usr/bin/env python3
"""
Frame ASC-ready UI PNGs in the silver iPhone 14 Pro Max bezel (fastlane frameit asset)
with headline + subline above the device. Output: 1284×2778.

The bezel is composited locally (no `fastlane frameit` run): the screenshot is masked to the
bezel's transparent display opening, so nothing shows outside the device silhouette.

Usage:
  python3 scripts/frame-asc-marketing-device.py v254        # 8× DE → v2.5.4/iphone-framed/
  python3 scripts/frame-asc-marketing-device.py v254 --all  # + 09–10 practice
  python3 scripts/frame-asc-marketing-device.py v260        # 01–07 DE + EN → v2.6.0/iphone/
  python3 scripts/frame-asc-marketing-device.py v260-ipad   # 00–07 DE + EN → v2.6.0/ipad/ (2048×2732)

Requires the frameit frames once: `brew install fastlane && fastlane frameit download_frames`.
"""

from __future__ import annotations

import argparse
import importlib.util
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

_v260_spec = importlib.util.spec_from_file_location(
    "compose_v260_clean",
    Path(__file__).resolve().parent / "compose-asc-marketing-slides-v260.py",
)
_v260_mod = importlib.util.module_from_spec(_v260_spec)
assert _v260_spec.loader
_v260_spec.loader.exec_module(_v260_mod)
clean_phone_screenshot = _v260_mod.clean_phone_screenshot

ROOT = Path(__file__).resolve().parents[1]


@dataclass(frozen=True)
class FrameLayout:
    asc_size: tuple[int, int]
    frame_path: Path
    screen_offset: tuple[int, int]
    screen_size: tuple[int, int]
    screen_inset: tuple[int, int, int, int]
    title_size: int
    body_size: int
    text_top: int = 120
    h_pad: int = 80
    device_top: int = 470
    device_bottom_margin: int = 70
    themes_fan_margin: int = 140


PHONE_LAYOUT = FrameLayout(
    asc_size=(1284, 2778),
    frame_path=Path.home() / ".fastlane/frameit/latest/Apple iPhone 14 Pro Max Silver.png",
    screen_offset=(67, 55),
    screen_size=(1290, 2796),
    screen_inset=(16, 12, 26, 8),
    title_size=84,
    body_size=48,
)

IPAD_LAYOUT = FrameLayout(
    asc_size=(2048, 2732),
    frame_path=Path.home()
    / ".fastlane/frameit/latest/Apple iPad Pro (12.9-inch) (4th generation) Silver.png",
    screen_offset=(96, 102),
    screen_size=(2048, 2732),
    screen_inset=(14, 12, 14, 10),
    title_size=112,
    body_size=62,
    text_top=140,
    h_pad=100,
    device_top=520,
    device_bottom_margin=85,
    themes_fan_margin=180,
)

# Legacy names (iPhone lifestyle + v254)
ASC_SIZE = PHONE_LAYOUT.asc_size
FRAME_PATH = PHONE_LAYOUT.frame_path
SCREEN_OFFSET = PHONE_LAYOUT.screen_offset
SCREEN_SIZE = PHONE_LAYOUT.screen_size
SCREEN_INSET = PHONE_LAYOUT.screen_inset
TITLE_SIZE = PHONE_LAYOUT.title_size
BODY_SIZE = PHONE_LAYOUT.body_size
TEXT_TOP = PHONE_LAYOUT.text_top
H_PAD = PHONE_LAYOUT.h_pad
DEVICE_TOP = PHONE_LAYOUT.device_top
DEVICE_BOTTOM_MARGIN = PHONE_LAYOUT.device_bottom_margin

BG_TOP = (232, 245, 244)
BG_MID = (170, 214, 211)
BG_BOTTOM = (27, 114, 114)
INK = (14, 52, 52)
MUTED = (44, 84, 84)
TITLE_FONT = Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf")
BODY_FONT = Path("/System/Library/Fonts/Supplemental/Arial.ttf")

V254 = ROOT / "screenshots/app-store/v2.5.4/iphone"
JOURNEY = ROOT / "screenshots/journey"
V260_SRC = ROOT / "screenshots/app-store/v2.6.0/_source"
V254_OUT = ROOT / "screenshots/app-store/v2.5.4/iphone-framed"
V260_OUT = ROOT / "screenshots/app-store/v2.6.0/iphone"
V260_IPAD_SRC = V260_SRC / "ipad"
V260_IPAD_OUT = ROOT / "screenshots/app-store/v2.6.0/ipad"
IPAD_LIFESTYLE_PHOTO = V260_SRC / "IMG_1556.JPG"

SLIDES_V260_IPAD_DE = [
    ("01-brand-ipad-de.png", V260_IPAD_SRC / "IMG_0305.PNG",
     "EIN COACH, DER SIE KENNT", "Lebenskontext und Verlauf — ein Gedächtnis, das mitdenkt."),
    ("02-connector-ipad-de.png", V260_IPAD_SRC / "IMG_0300.PNG",
     "THE CONNECTOR", "Drei Alltagsgespräche — dann Ihr Verbindungsprofil."),
    ("03-connector-radar-ipad-de.png", V260_IPAD_SRC / "IMG_0302.PNG",
     "IHR VERBINDUNGS-RADAR", "Empathie, Präsenz, Neugier — auf einen Blick."),
    ("04-coach-grid-ipad-de.png", V260_IPAD_SRC / "IMG_0299.PNG",
     "IHR COACH-TEAM", "Persönlichkeiten für jedes Anliegen."),
    ("05-coaching-chat-ipad-de.png", V260_IPAD_SRC / "IMG_0301.PNG",
     "TIEFGEHENDE GESPRÄCHE", "Text oder Sprache — reflektierend, nicht beratend."),
    ("06-practice-ipad-de.png", V260_IPAD_SRC / "IMG_0304.PNG",
     "COACHING ÜBEN", "Du bist der Coach — die KI spielt deinen Klienten."),
]

SLIDES_V260_IPAD_EN = [
    ("01-brand-ipad-en.png", V260_IPAD_SRC / "IMG_0310.PNG",
     "A COACH WHO KNOWS YOU", "Life context and history — memory that follows you."),
    ("02-connector-ipad-en.png", V260_IPAD_SRC / "IMG_0308.PNG",
     "THE CONNECTOR", "Three everyday talks — then your connection profile."),
    ("03-connector-radar-ipad-en.png", V260_IPAD_SRC / "IMG_0309.PNG",
     "YOUR CONNECTION RADAR", "Empathy, presence, curiosity — at a glance."),
    ("04-coach-grid-ipad-en.png", V260_IPAD_SRC / "IMG_0307.PNG",
     "YOUR COACH TEAM", "Personalities for every concern."),
    ("05-coaching-chat-ipad-en.png", V260_IPAD_SRC / "IMG_0312.PNG",
     "CONVERSATIONS WITH DEPTH", "Text or voice — reflective, not advisory."),
    ("06-practice-ipad-en.png", V260_IPAD_SRC / "IMG_0311.PNG",
     "PRACTICE COACHING", "You are the coach — the AI plays your client."),
]

IPAD_LIFESTYLE_COPY = {
    "de": ("COACHING, WO SIE SIND", "Ob Café oder unterwegs — Ihr Coach ist da."),
    "en": ("COACHING WHERE YOU ARE", "At the café or on the go — your coach is there."),
}

# 04/06/07 in v2.5.4/iphone/ are a loading screen and two welcome-screen copies;
# the framed set uses the real chat / review captures from the journey folder.
SLIDES_V254 = [
    ("01-welcome-dark-iphone-de.png", V254 / "01-welcome-dark-iphone-de.png",
     "MEANINGFUL CONVERSATIONS", "Coaching mit Gedächtnis und Tiefe."),
    ("02-intent-picker-iphone-de.png", V254 / "02-intent-picker-iphone-de.png",
     "WAS BESCHÄFTIGT SIE?", "In wenigen Schritten zum passenden Coach."),
    ("03-coach-grid-iphone-de.png", V254 / "03-coach-grid-iphone-de.png",
     "IHR COACH-TEAM", "Persönlichkeiten für jedes Anliegen."),
    ("04-coaching-chat-iphone-de.png", JOURNEY / "05-chat/06-coaching-deep-tts-active-iphone-de.png",
     "TIEFGEHENDE GESPRÄCHE", "Text oder Sprache — reflektierend, nicht beratend."),
    ("05-session-analyzing-iphone-de.png", V254 / "05-session-analyzing-iphone-de.png",
     "REFLEXION MIT TIEFE", "Jede Sitzung wird strukturiert ausgewertet."),
    ("06-session-review-iphone-de.png", JOURNEY / "06-session-review/05-review-findings-iphone-de.png",
     "DISKURSANALYSE", "Neue Erkenntnisse, Muster und nächste Schritte."),
    ("07-session-review-updates-iphone-de.png", JOURNEY / "06-session-review/06-review-updates-diff-iphone-de.png",
     "IHR LEBENSKONTEXT", "Wächst mit — transparent und unter Ihrer Kontrolle."),
    ("08-landing-hub-iphone-de.png", V254 / "08-landing-hub-iphone-de.png",
     "ALLES AN EINEM ORT", "Coaching, Kontext und Fortschritt."),
]

SLIDES_V254_OPTIONAL = [
    ("09-practice-setup-iphone-de.png", V254 / "09-practice-setup-iphone-de.png",
     "COACHING ÜBEN", "Du bist der Coach — die KI spielt deinen Klienten."),
    ("10-practice-contracting-iphone-de.png", V254 / "10-practice-contracting-iphone-de.png",
     "KLARES CONTRACTING", "Rahmen setzen — wie im echten Coaching."),
]

def load_ui_screenshot(src_path: Path) -> Image.Image:
    """Device exports: neutralize status chrome + island before framing when tall enough."""
    im = Image.open(src_path).convert("RGB")
    w, h = im.size
    if w >= 1100 and h >= 2000:
        return clean_phone_screenshot(im)
    return im


SLIDES_V260 = [
    ("01-brand-iphone-de.png", V260_SRC / "IMG_1675.PNG",
     "EIN COACH, DER SIE KENNT", "Lebenskontext und Verlauf — ein Gedächtnis, das mitdenkt."),
    ("02-connector-persona-iphone-de.png", V260_SRC / "connector-intro-de.png",
     "THE CONNECTOR", "Drei Alltagsgespräche — dann Ihr Verbindungsprofil."),
    ("03-connector-radar-iphone-de.png", V260_SRC / "IMG_1677.PNG",
     "IHR VERBINDUNGS-RADAR", "Empathie, Präsenz, Neugier — auf einen Blick."),
    ("04-coach-grid-iphone-de.png", V260_SRC / "coach-grid-de.png",
     "IHR COACH-TEAM", "Persönlichkeiten für jedes Anliegen."),
    ("05-voice-coaching-iphone-de.png", V260_SRC / "coaching-voice-de.png",
     "COACHING PER SPRACHE", "Sprechen oder tippen — reflektierend, nicht beratend."),
    ("06-coaching-chat-iphone-de.png", V260_SRC / "coaching-chat-de.png",
     "TIEFGEHENDE GESPRÄCHE", "Text oder Sprache — reflektierend, nicht beratend."),
    ("07-practice-iphone-de.png", V260_SRC / "IMG_1676.PNG",
     "COACHING ÜBEN", "Du bist der Coach — die KI spielt deinen Klienten."),
]

SLIDES_V260_EN = [
    ("01-brand-iphone-en.png", V260_SRC / "IMG_1672.PNG",
     "A COACH WHO KNOWS YOU", "Life context and history — memory that follows you."),
    ("02-connector-persona-iphone-en.png", V260_SRC / "connector-intro-en.png",
     "THE CONNECTOR", "Three everyday talks — then your connection profile."),
    ("03-connector-radar-iphone-en.png", V260_SRC / "IMG_1674.PNG",
     "YOUR CONNECTION RADAR", "Empathy, presence, curiosity — at a glance."),
    ("04-coach-grid-iphone-en.png", V260_SRC / "coach-grid-en.png",
     "YOUR COACH TEAM", "Personalities for every concern."),
    ("05-voice-coaching-iphone-en.png", V260_SRC / "coaching-voice-en.png",
     "COACHING BY VOICE", "Speak or type — reflective, not advisory."),
    ("06-coaching-chat-iphone-en.png", V260_SRC / "coaching-chat-en.png",
     "CONVERSATIONS WITH DEPTH", "Text or voice — reflective, not advisory."),
    ("07-practice-iphone-en.png", V260_SRC / "IMG_1673.PNG",
     "PRACTICE COACHING", "You are the coach — the AI plays your client."),
]

THEMES_LOCALE_COPY = {
    "de": ("PASST ZU IHREM TAG", "Hell oder dunkel — in drei Farbwelten."),
    "en": ("FITS YOUR DAY", "Light or dark — in three color worlds."),
}

LIFESTYLE_PHOTO = V260_SRC / "lifestyle/cafe-iphone.jpg"
# Display corners in LIFESTYLE_PHOTO pixels (TL, TR, BR, BL), measured along the device axis.
LIFESTYLE_SCREEN_QUAD = [(427.1, 606.3), (528.9, 616.3), (473.3, 861.6), (369.4, 842.5)]
LIFESTYLE_SCREEN_SEED = (450, 735)
LIFESTYLE_CROP_X = 170  # slide px; keeps her profile left and the coffee cup right
LIFESTYLE_SLIDES = {
    "de": ("00-lifestyle-iphone-de.png", V260_SRC / "coaching-chat-de.png",
           "COACHING, WO SIE SIND", "Ob Café oder unterwegs — Ihr Coach ist da."),
    "en": ("00-lifestyle-iphone-en.png", V260_SRC / "coaching-chat-en.png",
           "COACHING WHERE YOU ARE", "At the café or on the go — your coach is there."),
}


def background(size: tuple[int, int]) -> Image.Image:
    w, h = size
    col = Image.new("RGB", (1, h))
    px = col.load()
    split = 0.38
    for y in range(h):
        t = y / (h - 1)
        if t < split:
            u = t / split
            c0, c1 = BG_TOP, BG_MID
        else:
            u = (t - split) / (1 - split)
            c0, c1 = BG_MID, BG_BOTTOM
        px[0, y] = tuple(int(a + (b - a) * u) for a, b in zip(c0, c1))
    return col.resize((w, h), Image.Resampling.BILINEAR)


def load_frame(layout: FrameLayout = PHONE_LAYOUT) -> tuple[Image.Image, Image.Image]:
    if not layout.frame_path.exists():
        raise FileNotFoundError(f"{layout.frame_path} — run `fastlane frameit download_frames`")
    frame = Image.open(layout.frame_path).convert("RGBA")
    hole = frame.getchannel("A").point(lambda a: 255 if a < 128 else 0)
    ox, oy = layout.screen_offset
    sw, sh = layout.screen_size
    center = (ox + sw // 2, oy + sh // 2)
    ImageDraw.floodfill(hole, center, 128)
    hole = hole.point(lambda v: 255 if v == 128 else 0)
    return frame, hole.filter(ImageFilter.MaxFilter(5))


def _screen_fill_color(shot: Image.Image) -> tuple[int, int, int]:
    w, h = shot.size
    samples = [
        shot.getpixel((min(24, w - 1), min(120, h - 1))),
        shot.getpixel((w - min(24, w), min(120, h - 1))),
        shot.getpixel((w // 2, min(200, h - 1))),
    ]
    return tuple(sum(c[i] for c in samples) // len(samples) for i in range(3))


def _inner_screen_size(layout: FrameLayout) -> tuple[int, int]:
    l, t, r, b = layout.screen_inset
    return layout.screen_size[0] - l - r, layout.screen_size[1] - t - b


def _pad_to_display_aspect(shot: Image.Image, layout: FrameLayout) -> Image.Image:
    """Top-align short captures; extend bottom with app background (no white letterbox)."""
    tw, th = _inner_screen_size(layout)
    sw, sh = shot.size
    scale = tw / sw
    im = shot.resize((tw, round(sh * scale)), Image.Resampling.LANCZOS)
    if im.height >= th * 0.985:
        return im
    canvas = Image.new("RGB", (tw, th))
    canvas.paste(im, (0, 0))
    y0 = im.height
    edge = im.getpixel((tw // 2, max(0, im.height - 2)))
    top_glow = im.getpixel((min(40, tw - 1), min(80, im.height - 1)))
    for y in range(y0, th):
        t = (y - y0) / max(th - y0, 1)
        fill = tuple(int(edge[i] + (top_glow[i] - edge[i]) * (1 - t) * 0.35) for i in range(3))
        for x in range(tw):
            canvas.putpixel((x, y), fill)
    return canvas


def _screen_from_scaled_window(
    scaled: Image.Image, origin_left: int, origin_top: int, layout: FrameLayout
) -> Image.Image:
    tw, th = _inner_screen_size(layout)
    canvas = Image.new("RGB", (tw, th), _screen_fill_color(scaled))
    canvas.paste(scaled, (-origin_left, -origin_top))
    return canvas


def _crop_cover_screen(
    shot: Image.Image,
    scale: float,
    layout: FrameLayout,
    origin_dx: int = 0,
    origin_dy: int = 0,
) -> Image.Image:
    tw, th = _inner_screen_size(layout)
    nw, nh = round(shot.width * scale), round(shot.height * scale)
    scaled = shot.resize((nw, nh), Image.Resampling.LANCZOS)
    left = max(0, (nw - tw) // 2) + origin_dx
    top = origin_dy
    return _screen_from_scaled_window(scaled, left, top, layout)


def _estimate_light_dark_shift(light: Image.Image, dark: Image.Image) -> tuple[int, int]:
    """Shift dark crop origin to match light; anchor on bottom chrome (tab pills), not full-screen phase."""
    w = min(400, light.width, dark.width)
    full_scale = light.width / w

    def edges_scaled(im: Image.Image) -> np.ndarray:
        ratio = w / im.width
        small = im.resize((w, round(im.height * ratio)), Image.Resampling.LANCZOS)
        return np.array(small.convert("L").filter(ImageFilter.FIND_EDGES), dtype=np.float32)

    le, de = edges_scaled(light), edges_scaled(dark)
    ww = min(le.shape[1], de.shape[1])
    le, de = le[:, :ww], de[:, :ww]
    y0 = int(min(le.shape[0], de.shape[0]) * 0.76)

    best_dx, best_dy, best_err = 0, 0, float("inf")
    max_dy = int(140 / full_scale)
    max_dx = int(50 / full_scale)
    for dy in range(-max_dy, max_dy + 1):
        yd = y0 + dy
        if yd < 0:
            continue
        hh = min(le.shape[0] - y0, de.shape[0] - yd)
        if hh < 30:
            continue
        for dx in range(-max_dx, max_dx + 1):
            if dx >= 0:
                a = le[y0 : y0 + hh, : le.shape[1] - dx]
                b = de[yd : yd + hh, dx:]
            else:
                a = le[y0 : y0 + hh, -dx:]
                b = de[yd : yd + hh, : de.shape[1] + dx]
            if a.shape != b.shape or a.size < 500:
                continue
            err = float(np.mean((a - b) ** 2))
            if err < best_err:
                best_dx, best_dy, best_err = dx, dy, err

    return int(round(best_dx * full_scale)), int(round(best_dy * full_scale))


def fit_screen(shot: Image.Image, layout: FrameLayout = PHONE_LAYOUT) -> Image.Image:
    """Map UI into the display opening; top-aligned, no white letterbox."""
    shot = _pad_to_display_aspect(shot, layout)
    tw, th = _inner_screen_size(layout)
    scale = max(tw / shot.width, th / shot.height)
    return _crop_cover_screen(shot, scale, layout)


def fit_screen_pair(
    light: Image.Image,
    dark: Image.Image,
    layout: FrameLayout,
    *,
    align: bool = False,
    align_nudge: tuple[int, int] = (0, 0),
) -> tuple[Image.Image, Image.Image]:
    """Same scale + crop; optional edge alignment so light/dark meet at the diagonal."""
    light = _pad_to_display_aspect(light.convert("RGB"), layout)
    dark = _pad_to_display_aspect(dark.convert("RGB"), layout)
    tw, th = _inner_screen_size(layout)
    scale = max(
        max(tw / light.width, th / light.height),
        max(tw / dark.width, th / dark.height),
    )
    dx, dy = (0, 0)
    if align:
        dx, dy = _estimate_light_dark_shift(light, dark)
        dx += align_nudge[0]
        dy += align_nudge[1]
    return (
        _crop_cover_screen(light, scale, layout),
        _crop_cover_screen(dark, scale, layout, origin_dx=dx, origin_dy=dy),
    )


def framed_inner_screen(
    screen: Image.Image, frame: Image.Image, hole: Image.Image, layout: FrameLayout
) -> Image.Image:
    """Place a screen bitmap already fitted to the inner display opening."""
    tw, th = _inner_screen_size(layout)
    if screen.size != (tw, th):
        screen = screen.resize((tw, th), Image.Resampling.LANCZOS)
    layer = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    full = Image.new("RGB", frame.size, _screen_fill_color(screen))
    l, t, _, _ = layout.screen_inset
    ox, oy = layout.screen_offset[0] + l, layout.screen_offset[1] + t
    full.paste(screen, (ox, oy))
    layer.paste(full, (0, 0), hole)
    return Image.alpha_composite(layer, frame)


def framed_device(
    src: Path | Image.Image,
    frame: Image.Image,
    hole: Image.Image,
    layout: FrameLayout = PHONE_LAYOUT,
) -> Image.Image:
    if isinstance(src, Image.Image):
        shot = src.convert("RGB")
    else:
        shot = load_ui_screenshot(src)
    screen = fit_screen(shot, layout)
    layer = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    full = Image.new("RGB", frame.size, _screen_fill_color(screen))
    l, t, _, _ = layout.screen_inset
    ox, oy = layout.screen_offset[0] + l, layout.screen_offset[1] + t
    full.paste(screen, (ox, oy))
    layer.paste(full, (0, 0), hole)
    return Image.alpha_composite(layer, frame)


def wrap_lines(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_w: int) -> list[str]:
    lines: list[str] = []
    cur = ""
    for word in text.split():
        trial = f"{cur} {word}".strip()
        if draw.textlength(trial, font=font) <= max_w or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def fit_font(draw: ImageDraw.ImageDraw, text: str, path: Path, size: int, max_w: int, max_lines: int) -> tuple[ImageFont.FreeTypeFont, list[str]]:
    while True:
        font = ImageFont.truetype(str(path), size)
        lines = wrap_lines(draw, text, font, max_w)
        if len(lines) <= max_lines and all(draw.textlength(l, font=font) <= max_w for l in lines):
            return font, lines
        size -= 2


def draw_headlines(
    canvas: Image.Image, title: str, body: str, layout: FrameLayout = PHONE_LAYOUT
) -> int:
    draw = ImageDraw.Draw(canvas)
    w, _ = layout.asc_size
    max_w = w - 2 * layout.h_pad
    title_font, title_lines = fit_font(draw, title, TITLE_FONT, layout.title_size, max_w, 1)
    body_font, body_lines = fit_font(draw, body, BODY_FONT, layout.body_size, max_w, 2)
    y = layout.text_top
    for line in title_lines:
        tw = draw.textlength(line, font=title_font)
        draw.text(((w - tw) / 2, y), line, font=title_font, fill=INK)
        y += int(title_font.size * 1.18)
    y += 22
    for line in body_lines:
        tw = draw.textlength(line, font=body_font)
        draw.text(((w - tw) / 2, y), line, font=body_font, fill=MUTED)
        y += int(body_font.size * 1.32)
    return y


def compose_slide(
    src_path: Path,
    title: str,
    body: str,
    frame: Image.Image,
    hole: Image.Image,
    layout: FrameLayout = PHONE_LAYOUT,
) -> Image.Image:
    canvas = background(layout.asc_size).convert("RGBA")
    text_bottom = draw_headlines(canvas, title, body, layout)
    device_top = max(layout.device_top, text_bottom + 50)

    device = framed_device(src_path, frame, hole, layout)
    max_h = layout.asc_size[1] - device_top - layout.device_bottom_margin
    scale = max_h / device.height
    nw, nh = round(device.width * scale), round(device.height * scale)
    device = device.resize((nw, nh), Image.Resampling.LANCZOS)
    x = (layout.asc_size[0] - nw) // 2

    shadow = Image.new("RGBA", layout.asc_size, (0, 0, 0, 0))
    sil = device.getchannel("A").point(lambda a: int(a * 0.35))
    shadow.paste((10, 40, 40, 255), (x, device_top + 24), sil)
    shadow = shadow.filter(ImageFilter.GaussianBlur(28))
    canvas = Image.alpha_composite(canvas, shadow)
    canvas.alpha_composite(device, (x, device_top))
    return canvas.convert("RGB")


def split_light_dark(light: Image.Image, dark: Image.Image) -> Image.Image:
    """Same screen in both modes, split along a diagonal (light top-left, dark bottom-right)."""
    dark = dark.resize(light.size, Image.Resampling.LANCZOS)
    w, h = light.size
    mask = Image.new("L", (w, h), 0)
    seam = [(w, int(h * 0.36)), (0, int(h * 0.64))]
    ImageDraw.Draw(mask).polygon([(0, 0), (w, 0), seam[0], seam[1]], fill=255)
    out = Image.composite(light, dark, mask)
    ImageDraw.Draw(out).line(seam, fill=(255, 255, 255), width=max(4, w // 260))
    return out


def drop_shadow(canvas: Image.Image, layer: Image.Image, pos: tuple[int, int], opacity: float = 0.35) -> Image.Image:
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sil = layer.getchannel("A").point(lambda a: int(a * opacity))
    shadow.paste((10, 40, 40, 255), (pos[0], pos[1] + 24), sil)
    return Image.alpha_composite(canvas, shadow.filter(ImageFilter.GaussianBlur(28)))


THEMES_SRC = V260_SRC / "themes"
# left, center (front), right
THEME_FAN = ["summer", "brand", "autumn"]
# Real iPad device shots — one per Farbwelt (light UI); DE + EN share the same fan.
THEME_FAN_IPAD_LIGHT = {
    "summer": V260_IPAD_SRC / "IMG_0317.PNG",
    "brand": V260_IPAD_SRC / "IMG_0316.PNG",
    "autumn": V260_IPAD_SRC / "IMG_0318.PNG",
}
THEME_FAN_IPAD_DARK = {
    "summer": V260_IPAD_SRC / "IMG_0320.PNG",
    "brand": V260_IPAD_SRC / "IMG_0321.PNG",
    "autumn": V260_IPAD_SRC / "IMG_0319.PNG",
}
# Extra pixels on dark crop origin after auto-align (tune per pair if needed).
THEME_FAN_IPAD_ALIGN_NUDGE: dict[str, tuple[int, int]] = {}


def ipad_theme_fan_device_pairs_ready() -> bool:
    return all(p.is_file() for p in THEME_FAN_IPAD_LIGHT.values()) and all(
        p.is_file() for p in THEME_FAN_IPAD_DARK.values()
    )


def themes_capture_dir(locale: str, device: str = "iphone") -> Path:
    if device == "ipad":
        return THEMES_SRC / "ipad" / locale
    nested = THEMES_SRC / locale
    if nested.is_dir() and (nested / "summer-light.png").exists():
        return nested
    if locale == "de" and (THEMES_SRC / "summer-light.png").exists():
        return THEMES_SRC
    return nested


def _place_theme_fan_devices(
    canvas: Image.Image,
    devices: list[Image.Image],
    layout: FrameLayout,
    text_bottom: int,
) -> Image.Image:
    center_top = max(layout.device_top, text_bottom + 50)
    center_h = layout.asc_size[1] - center_top - layout.device_bottom_margin - layout.themes_fan_margin
    side_h = int(center_h * 0.86)
    w = layout.asc_size[0]

    def scaled(d: Image.Image, h: int) -> Image.Image:
        return d.resize((round(d.width * h / d.height), h), Image.Resampling.LANCZOS)

    left, center, right = scaled(devices[0], side_h), scaled(devices[1], center_h), scaled(devices[2], side_h)
    cx = (w - center.width) // 2
    side_top = center_top + (center_h - side_h) // 2
    side_overlap = int(left.width * 0.42)
    lx = cx + side_overlap - left.width
    rx = cx + center.width - side_overlap

    for img, x, y in ((left, lx, side_top), (right, rx, side_top)):
        canvas = drop_shadow(canvas, img, (x, y), 0.28)
        layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        layer.paste(img, (x, y), img)
        canvas = Image.alpha_composite(canvas, layer)
    canvas = drop_shadow(canvas, center, (cx, center_top), 0.4)
    canvas.alpha_composite(center, (cx, center_top))
    return canvas.convert("RGB")


def compose_themes_slide(
    frame: Image.Image,
    hole: Image.Image,
    title: str,
    body: str,
    themes_dir: Path,
    layout: FrameLayout = PHONE_LAYOUT,
) -> Image.Image:
    canvas = background(layout.asc_size).convert("RGBA")
    text_bottom = draw_headlines(canvas, title, body, layout)
    devices = []
    for theme in THEME_FAN:
        light = Image.open(themes_dir / f"{theme}-light.png").convert("RGB")
        dark = Image.open(themes_dir / f"{theme}-dark.png").convert("RGB")
        devices.append(framed_device(split_light_dark(light, dark), frame, hole, layout))
    return _place_theme_fan_devices(canvas, devices, layout, text_bottom)


def compose_themes_slide_ipad_device_pairs(
    frame: Image.Image,
    hole: Image.Image,
    title: str,
    body: str,
    layout: FrameLayout,
) -> Image.Image:
    """Hell/Dunkel aus Geräte-Paaren 0317–0318 / 0320–0321 / 0319; diagonal split wie iPhone."""
    canvas = background(layout.asc_size).convert("RGBA")
    text_bottom = draw_headlines(canvas, title, body, layout)
    devices = []
    for theme in THEME_FAN:
        light = load_ui_screenshot(THEME_FAN_IPAD_LIGHT[theme])
        dark = load_ui_screenshot(THEME_FAN_IPAD_DARK[theme])
        nudge = THEME_FAN_IPAD_ALIGN_NUDGE.get(theme, (0, 0))
        light_fit, dark_fit = fit_screen_pair(light, dark, layout, align=True, align_nudge=nudge)
        combined = split_light_dark(light_fit, dark_fit)
        devices.append(framed_inner_screen(combined, frame, hole, layout))
    return _place_theme_fan_devices(canvas, devices, layout, text_bottom)


def _perspective_coeffs(dst: list[tuple[float, float]], src: list[tuple[float, float]]) -> list[float]:
    """Coefficients for Image.transform(PERSPECTIVE): output (dst) pixel → input (src) pixel."""
    rows, rhs = [], []
    for (x, y), (u, v) in zip(dst, src):
        rows.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        rows.append([0, 0, 0, x, y, 1, -v * x, -v * y])
        rhs.extend([u, v])
    return np.linalg.solve(np.array(rows, float), np.array(rhs, float)).tolist()


def _hide_status_island(shot: Image.Image) -> Image.Image:
    """Paint over the captured Dynamic Island; the photo's own island stays on top."""
    a = np.array(shot.convert("RGB"))
    h, w = a.shape[:2]
    band = a[: int(h * 0.07), int(w * 0.3): int(w * 0.7)]
    dark = band.mean(axis=2) < 60
    if not dark.any():
        return shot
    ys, xs = np.nonzero(dark)
    pad = 8
    y0, y1 = max(0, ys.min() - pad), ys.max() + pad
    x0, x1 = int(w * 0.3) + xs.min() - pad, int(w * 0.3) + xs.max() + pad
    fill = np.median(a[y0:y1, max(0, x0 - 40): x0 - 10].reshape(-1, 3), axis=0).astype(np.uint8)
    a[y0:y1, x0:x1] = fill
    return Image.fromarray(a)


def _lifestyle_screen_mask(photo: Image.Image) -> Image.Image:
    """Lit display pixels only: excludes the Dynamic Island and anything in front of the glass."""
    a = np.asarray(photo.convert("RGB")).astype(int)
    lum, sat = a.mean(axis=2), a.max(axis=2) - a.min(axis=2)
    lit = Image.fromarray((((lum > 205) & (sat < 30)) * 255).astype(np.uint8)).copy()
    ImageDraw.floodfill(lit, LIFESTYLE_SCREEN_SEED, 128)
    screen = np.array(lit) == 128
    outside = Image.fromarray((~screen * 255).astype(np.uint8)).copy()
    ImageDraw.floodfill(outside, (0, 0), 100)
    holes = (np.array(outside) != 100) & ~screen
    grow = lambda m: np.array(Image.fromarray(m.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(3))) > 0
    return Image.fromarray(((grow(screen) & ~grow(holes)) * 255).astype(np.uint8))


def compose_lifestyle_slide(src_path: Path, title: str, body: str) -> Image.Image:
    photo = Image.open(LIFESTYLE_PHOTO).convert("RGB")
    scale = ASC_SIZE[1] / photo.height
    size = (round(photo.width * scale), ASC_SIZE[1])
    box = (LIFESTYLE_CROP_X, 0, LIFESTYLE_CROP_X + ASC_SIZE[0], ASC_SIZE[1])
    base = photo.resize(size, Image.Resampling.LANCZOS).crop(box)
    base = base.filter(ImageFilter.UnsharpMask(radius=2, percent=40, threshold=2))

    quad = [(x * scale - LIFESTYLE_CROP_X, y * scale) for x, y in LIFESTYLE_SCREEN_QUAD]
    poly = Image.new("L", ASC_SIZE, 0)
    ImageDraw.Draw(poly).polygon(quad, fill=255)
    lit = _lifestyle_screen_mask(photo).resize(size, Image.Resampling.BILINEAR).crop(box)
    mask = ImageChops.multiply(lit, poly).filter(ImageFilter.GaussianBlur(1.2))

    shot = _hide_status_island(Image.open(src_path)).resize(ASC_SIZE, Image.Resampling.LANCZOS)
    corners = [(0, 0), (ASC_SIZE[0], 0), (ASC_SIZE[0], ASC_SIZE[1]), (0, ASC_SIZE[1])]
    warped = shot.transform(ASC_SIZE, Image.Transform.PERSPECTIVE, _perspective_coeffs(quad, corners),
                            Image.Resampling.BICUBIC)
    lum = np.asarray(base.convert("L")).astype(float)
    inside = np.asarray(mask) > 200
    shade = np.clip(lum / np.percentile(lum[inside], 97), 0.82, 1.0)[..., None]
    warped = Image.fromarray((np.asarray(warped).astype(float) * shade).astype(np.uint8))
    canvas = Image.composite(warped, base, mask).convert("RGBA")

    veil = Image.new("RGBA", ASC_SIZE, (0, 0, 0, 0))
    veil_px = ImageDraw.Draw(veil)
    fade_end = 820
    for y in range(fade_end):
        t = y / fade_end
        veil_px.line([(0, y), (ASC_SIZE[0], y)], fill=(251, 245, 236, int(215 * (1 - t) ** 1.6)))
    canvas = Image.alpha_composite(canvas, veil)
    draw_headlines(canvas, title, body, PHONE_LAYOUT)
    return canvas.convert("RGB")


def compose_lifestyle_ipad_slide(title: str, body: str, layout: FrameLayout = IPAD_LAYOUT) -> Image.Image:
    """Full-bleed café + iPad (IMG_1556) with marketing headlines."""
    photo = Image.open(IPAD_LIFESTYLE_PHOTO).convert("RGB")
    tw, th = layout.asc_size
    pw, ph = photo.size
    scale = max(tw / pw, th / ph)
    nw, nh = round(pw * scale), round(ph * scale)
    im = photo.resize((nw, nh), Image.Resampling.LANCZOS)
    x0, y0 = (nw - tw) // 2, (nh - th) // 2
    base = im.crop((x0, y0, x0 + tw, y0 + th)).convert("RGBA")
    veil = Image.new("RGBA", layout.asc_size, (0, 0, 0, 0))
    veil_px = ImageDraw.Draw(veil)
    fade_end = int(th * 0.36)
    for y in range(fade_end):
        t = y / fade_end
        veil_px.line([(0, y), (tw, y)], fill=(251, 245, 236, int(210 * (1 - t) ** 1.6)))
    canvas = Image.alpha_composite(base, veil)
    draw_headlines(canvas, title, body, layout)
    return canvas.convert("RGB")


def process_lifestyle(out_dir: Path) -> None:
    if not LIFESTYLE_PHOTO.exists():
        print(f"  ⚠ skip 07-lifestyle — missing {LIFESTYLE_PHOTO.relative_to(ROOT)}")
        return
    for locale, (out_name, src_path, title, body) in LIFESTYLE_SLIDES.items():
        if not src_path.exists():
            print(f"  ⚠ skip {out_name} — missing {src_path.relative_to(ROOT)}")
            continue
        dest = out_dir / out_name
        compose_lifestyle_slide(src_path, title, body).save(dest, "PNG", optimize=True)
        print(f"  ✓ {dest.relative_to(ROOT)}  ← {src_path.relative_to(ROOT)} + {LIFESTYLE_PHOTO.name}")


def process(
    slides: list[tuple[str, Path, str, str]],
    out_dir: Path,
    layout: FrameLayout = PHONE_LAYOUT,
) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    frame, hole = load_frame(layout)
    for out_name, src_path, title, body in slides:
        if not src_path.exists():
            print(f"  ⚠ skip {out_name} — missing {src_path}")
            continue
        img = compose_slide(src_path, title, body, frame, hole, layout)
        dest = out_dir / out_name
        img.save(dest, "PNG", optimize=True)
        print(f"  ✓ {dest.relative_to(ROOT)}  ← {src_path.relative_to(ROOT)}")


def run_v260_iphone() -> None:
    process(SLIDES_V260, V260_OUT, PHONE_LAYOUT)
    process(SLIDES_V260_EN, V260_OUT, PHONE_LAYOUT)
    frame, hole = load_frame(PHONE_LAYOUT)
    for locale in ("de", "en"):
        td = themes_capture_dir(locale)
        if not all((td / f"{t}-{m}.png").exists() for t in THEME_FAN for m in ("light", "dark")):
            print(f"  ⚠ skip 08-themes-{locale} — run scripts/capture-asc-themes.mjs --lang {locale}")
            continue
        title, body = THEMES_LOCALE_COPY[locale]
        img = compose_themes_slide(frame, hole, title, body, td, PHONE_LAYOUT)
        dest = V260_OUT / f"08-themes-iphone-{locale}.png"
        img.save(dest, "PNG", optimize=True)
        print(f"  ✓ {dest.relative_to(ROOT)}  ← {td.relative_to(ROOT)}/*")
    process_lifestyle(V260_OUT)


def run_v260_ipad() -> None:
    layout = IPAD_LAYOUT
    V260_IPAD_OUT.mkdir(parents=True, exist_ok=True)
    if not IPAD_LIFESTYLE_PHOTO.exists():
        print(f"  ⚠ skip 00-lifestyle — missing {IPAD_LIFESTYLE_PHOTO.relative_to(ROOT)}")
    else:
        for locale in ("de", "en"):
            title, body = IPAD_LIFESTYLE_COPY[locale]
            dest = V260_IPAD_OUT / f"00-lifestyle-ipad-{locale}.png"
            compose_lifestyle_ipad_slide(title, body, layout).save(dest, "PNG", optimize=True)
            print(f"  ✓ {dest.relative_to(ROOT)}  ← {IPAD_LIFESTYLE_PHOTO.name}")
    process(SLIDES_V260_IPAD_DE, V260_IPAD_OUT, layout)
    process(SLIDES_V260_IPAD_EN, V260_IPAD_OUT, layout)
    frame, hole = load_frame(layout)
    for locale in ("de", "en"):
        title, body = THEMES_LOCALE_COPY[locale]
        dest = V260_IPAD_OUT / f"07-themes-ipad-{locale}.png"
        td = themes_capture_dir(locale, "ipad")
        if ipad_theme_fan_device_pairs_ready():
            img = compose_themes_slide_ipad_device_pairs(frame, hole, title, body, layout)
            src_note = "IMG_0317–0318 (hell) + IMG_0320–0321/0319 (dunkel)"
        elif all((td / f"{t}-{m}.png").is_file() for t in THEME_FAN for m in ("light", "dark")):
            img = compose_themes_slide(frame, hole, title, body, td, layout)
            src_note = f"{td.relative_to(ROOT)}/* (light+dark captures)"
        else:
            print(
                f"  ⚠ skip 07-themes-{locale} — need ipad/IMG_0316–0318 + IMG_0319–0321 "
                f"or themes/ipad/{locale}/* (capture-asc-themes.mjs --device ipad)"
            )
            continue
        img.save(dest, "PNG", optimize=True)
        print(f"  ✓ {dest.relative_to(ROOT)}  ← {src_note}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("set", choices=("v254", "v260", "v260-ipad"))
    parser.add_argument("--all", action="store_true", help="v254: include 09–10 practice")
    args = parser.parse_args()

    if args.set == "v254":
        slides = list(SLIDES_V254)
        if args.all:
            slides.extend(SLIDES_V254_OPTIONAL)
        process(slides, V254_OUT, PHONE_LAYOUT)
    elif args.set == "v260-ipad":
        run_v260_ipad()
    else:
        run_v260_iphone()


if __name__ == "__main__":
    main()
