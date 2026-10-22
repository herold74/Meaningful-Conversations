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

Requires the frameit frames once: `brew install fastlane && fastlane frameit download_frames`.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASC_SIZE = (1284, 2778)

FRAME_PATH = Path.home() / ".fastlane/frameit/latest/Apple iPhone 14 Pro Max Silver.png"
SCREEN_OFFSET = (67, 55)
SCREEN_SIZE = (1290, 2796)
# Inset so UI chrome (status bar icons) stays inside the curved display mask.
SCREEN_INSET = (16, 12, 26, 8)  # left, top, right, bottom — keep header icons inside curved mask

BG_TOP = (232, 245, 244)
BG_MID = (170, 214, 211)
BG_BOTTOM = (27, 114, 114)
INK = (14, 52, 52)
MUTED = (44, 84, 84)
TITLE_FONT = Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf")
BODY_FONT = Path("/System/Library/Fonts/Supplemental/Arial.ttf")

TITLE_SIZE = 84
BODY_SIZE = 48
TEXT_TOP = 120
H_PAD = 80
DEVICE_TOP = 470
DEVICE_BOTTOM_MARGIN = 70

V254 = ROOT / "screenshots/app-store/v2.5.4/iphone"
JOURNEY = ROOT / "screenshots/journey"
V260_SRC = ROOT / "screenshots/app-store/v2.6.0/_source"
V254_OUT = ROOT / "screenshots/app-store/v2.5.4/iphone-framed"
V260_OUT = ROOT / "screenshots/app-store/v2.6.0/iphone"

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

SLIDES_V260 = [
    ("01-brand-iphone-de.png", V260_SRC / "about-coach-knows-you-de.png",
     "EIN COACH, DER SIE KENNT", "Lebenskontext und Verlauf — ein Gedächtnis, das mitdenkt."),
    ("02-connector-radar-iphone-de.png", V260_SRC / "IMG_1649.PNG",
     "DEIN VERBINDUNGS-RADAR", "Empathie, Präsenz, Neugier — auf einen Blick."),
    ("03-connector-persona-iphone-de.png", V260_SRC / "connector-intro-de.png",
     "THE CONNECTOR", "Drei Alltagsgespräche — dann dein Verbindungsprofil."),
    ("04-practice-iphone-de.png", V260_SRC / "about-coach-practice-de-light.png",
     "COACHING ÜBEN", "Du bist der Coach — die KI spielt deinen Klienten."),
    ("05-ecosystem-iphone-de.png", V260_SRC / "connector-coach-grid-de.png",
     "THE CONNECTOR", "In der Coach-Auswahl — Alltagsgespräche mit Auswertung."),
]

SLIDES_V260_EN = [
    ("01-brand-iphone-en.png", V260_SRC / "about-coach-knows-you-en.png",
     "A COACH WHO KNOWS YOU", "Life context and history — memory that follows you."),
    ("02-connector-radar-iphone-en.png", V260_SRC / "connector-radar-en-light.png",
     "YOUR CONNECTION RADAR", "Empathy, presence, curiosity — at a glance."),
    ("03-connector-persona-iphone-en.png", V260_SRC / "connector-intro-en.png",
     "THE CONNECTOR", "Three everyday talks — then your connection profile."),
    ("04-practice-iphone-en.png", V260_SRC / "about-coach-practice-en.png",
     "PRACTICE COACHING", "You are the coach — the AI plays your client."),
    ("05-ecosystem-iphone-en.png", V260_SRC / "connector-coach-grid-en.png",
     "THE CONNECTOR", "On your coach grid — practice connection in everyday scenes."),
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
    "de": ("07-lifestyle-iphone-de.png", JOURNEY / "05-chat/06-coaching-deep-tts-active-iphone-de.png",
           "COACHING, WO SIE SIND", "Ob Café oder unterwegs — Ihr Coach ist da."),
    "en": ("07-lifestyle-iphone-en.png", V260_SRC / "coaching-chat-en.png",
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


def load_frame() -> tuple[Image.Image, Image.Image]:
    if not FRAME_PATH.exists():
        raise FileNotFoundError(f"{FRAME_PATH} — run `fastlane frameit download_frames`")
    frame = Image.open(FRAME_PATH).convert("RGBA")
    hole = frame.getchannel("A").point(lambda a: 255 if a < 128 else 0)
    center = (SCREEN_OFFSET[0] + SCREEN_SIZE[0] // 2, SCREEN_OFFSET[1] + SCREEN_SIZE[1] // 2)
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


def _pad_to_display_aspect(shot: Image.Image) -> Image.Image:
    """Top-align short captures; extend bottom with app background (no white letterbox)."""
    tw, th = _inner_screen_size()
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


def _inner_screen_size() -> tuple[int, int]:
    l, t, r, b = SCREEN_INSET
    return SCREEN_SIZE[0] - l - r, SCREEN_SIZE[1] - t - b


def fit_screen(shot: Image.Image) -> Image.Image:
    """Map UI into the Pro Max display opening; top-aligned, no white letterbox."""
    shot = _pad_to_display_aspect(shot)
    tw, th = _inner_screen_size()
    sw, sh = shot.width, shot.height
    scale = max(tw / sw, th / sh)
    nw, nh = round(sw * scale), round(sh * scale)
    im = shot.resize((nw, nh), Image.Resampling.LANCZOS)
    left = max(0, (nw - tw) // 2)
    top = 0
    if nh > th:
        return im.crop((left, top, left + tw, top + th))
    canvas = Image.new("RGB", (tw, th), _screen_fill_color(shot))
    canvas.paste(im, (left, top))
    return canvas


def framed_device(src: Path | Image.Image, frame: Image.Image, hole: Image.Image) -> Image.Image:
    shot = src if isinstance(src, Image.Image) else Image.open(src)
    screen = fit_screen(shot.convert("RGB"))
    layer = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    full = Image.new("RGB", frame.size, _screen_fill_color(screen))
    l, t, _, _ = SCREEN_INSET
    ox, oy = SCREEN_OFFSET[0] + l, SCREEN_OFFSET[1] + t
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


def draw_headlines(canvas: Image.Image, title: str, body: str) -> int:
    draw = ImageDraw.Draw(canvas)
    max_w = ASC_SIZE[0] - 2 * H_PAD
    title_font, title_lines = fit_font(draw, title, TITLE_FONT, TITLE_SIZE, max_w, 1)
    body_font, body_lines = fit_font(draw, body, BODY_FONT, BODY_SIZE, max_w, 2)
    y = TEXT_TOP
    for line in title_lines:
        tw = draw.textlength(line, font=title_font)
        draw.text(((ASC_SIZE[0] - tw) / 2, y), line, font=title_font, fill=INK)
        y += int(title_font.size * 1.18)
    y += 22
    for line in body_lines:
        tw = draw.textlength(line, font=body_font)
        draw.text(((ASC_SIZE[0] - tw) / 2, y), line, font=body_font, fill=MUTED)
        y += int(body_font.size * 1.32)
    return y


def compose_slide(src_path: Path, title: str, body: str, frame: Image.Image, hole: Image.Image) -> Image.Image:
    canvas = background(ASC_SIZE).convert("RGBA")
    text_bottom = draw_headlines(canvas, title, body)
    device_top = max(DEVICE_TOP, text_bottom + 50)

    device = framed_device(src_path, frame, hole)
    max_h = ASC_SIZE[1] - device_top - DEVICE_BOTTOM_MARGIN
    scale = max_h / device.height
    nw, nh = round(device.width * scale), round(device.height * scale)
    device = device.resize((nw, nh), Image.Resampling.LANCZOS)
    x = (ASC_SIZE[0] - nw) // 2

    shadow = Image.new("RGBA", ASC_SIZE, (0, 0, 0, 0))
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


def themes_capture_dir(locale: str) -> Path:
    nested = THEMES_SRC / locale
    if nested.is_dir() and (nested / "summer-light.png").exists():
        return nested
    if locale == "de" and (THEMES_SRC / "summer-light.png").exists():
        return THEMES_SRC
    return nested


def compose_themes_slide(
    frame: Image.Image, hole: Image.Image, title: str, body: str, themes_dir: Path
) -> Image.Image:
    canvas = background(ASC_SIZE).convert("RGBA")
    text_bottom = draw_headlines(canvas, title, body)
    devices = []
    for theme in THEME_FAN:
        light = Image.open(themes_dir / f"{theme}-light.png").convert("RGB")
        dark = Image.open(themes_dir / f"{theme}-dark.png").convert("RGB")
        devices.append(framed_device(split_light_dark(light, dark), frame, hole))

    center_top = max(DEVICE_TOP, text_bottom + 50)
    # Smaller than the single-device slides so the side devices stay visible.
    center_h = ASC_SIZE[1] - center_top - DEVICE_BOTTOM_MARGIN - 140
    side_h = int(center_h * 0.86)
    W = ASC_SIZE[0]

    def scaled(d: Image.Image, h: int) -> Image.Image:
        return d.resize((round(d.width * h / d.height), h), Image.Resampling.LANCZOS)

    left, center, right = scaled(devices[0], side_h), scaled(devices[1], center_h), scaled(devices[2], side_h)
    cx = (W - center.width) // 2
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
    draw_headlines(canvas, title, body)
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


def process(slides: list[tuple[str, Path, str, str]], out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    frame, hole = load_frame()
    for out_name, src_path, title, body in slides:
        if not src_path.exists():
            print(f"  ⚠ skip {out_name} — missing {src_path}")
            continue
        img = compose_slide(src_path, title, body, frame, hole)
        dest = out_dir / out_name
        img.save(dest, "PNG", optimize=True)
        print(f"  ✓ {dest.relative_to(ROOT)}  ← {src_path.relative_to(ROOT)}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("set", choices=("v254", "v260"))
    parser.add_argument("--all", action="store_true", help="v254: include 09–10 practice")
    args = parser.parse_args()

    if args.set == "v254":
        slides = list(SLIDES_V254)
        if args.all:
            slides.extend(SLIDES_V254_OPTIONAL)
        process(slides, V254_OUT)
    else:
        process(SLIDES_V260, V260_OUT)
        process(SLIDES_V260_EN, V260_OUT)
        frame, hole = load_frame()
        for locale in ("de", "en"):
            td = themes_capture_dir(locale)
            if not all((td / f"{t}-{m}.png").exists() for t in THEME_FAN for m in ("light", "dark")):
                print(f"  ⚠ skip 06-themes-{locale} — run scripts/capture-asc-themes.mjs --lang {locale}")
                continue
            title, body = THEMES_LOCALE_COPY[locale]
            img = compose_themes_slide(frame, hole, title, body, td)
            dest = V260_OUT / f"06-themes-iphone-{locale}.png"
            img.save(dest, "PNG", optimize=True)
            print(f"  ✓ {dest.relative_to(ROOT)}  ← {td.relative_to(ROOT)}/*")
        process_lifestyle(V260_OUT)


if __name__ == "__main__":
    main()
