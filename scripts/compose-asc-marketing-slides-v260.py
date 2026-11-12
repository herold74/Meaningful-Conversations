#!/usr/bin/env python3
"""App Store slides v2.6.0 — RunMotion-style cards, ManualMode teal palette."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "screenshots/app-store/v2.6.0/_source"
OUT = ROOT / "screenshots/app-store/v2.6.0/iphone"

W, H = 1284, 2778

# ManualMode brand
BG = (214, 236, 236)       # light teal panel
CARD = (255, 255, 255)
INK = (24, 28, 28)
MUTED = (72, 82, 82)
TEAL = (27, 114, 114)

CARD_X = 56
CARD_RADIUS = 44
CARD_PAD = 36
TITLE_SIZE = 86
TITLE_LINE = 96
BODY_SIZE = 38
BODY_LINE = 50

# Top band where Playwright / iOS show a Dynamic Island pill (fraction of height).
ISLAND_BAND_FRAC = 0.065


def neutralize_ios_status_chrome(shot: Image.Image) -> Image.Image:
    """Paint over time / signal / battery on light iOS status bars (native device exports)."""
    w, h = shot.size
    if h < 2400 or w < 1100:
        return shot
    band = max(int(h * 0.048), 44)
    px = shot.load()
    margin = max(12, w // 18)
    ref_y = min(int(h * 0.085), h - 1)
    side = [px[x, ref_y] for x in range(0, margin)] + [px[x, ref_y] for x in range(w - margin, w)]
    fill = tuple(sum(c[i] for c in side) // len(side) for i in range(3))
    out = shot.copy()
    ImageDraw.Draw(out).rectangle((0, 0, w, band), fill=fill)
    return out


def _has_light_ios_status_bar(shot: Image.Image) -> bool:
    """Modern device shots: grey status bar + Dynamic Island — do not top-crop (keeps XP row)."""
    w, h = shot.size
    if h < 2400 or w < 1100:
        return False
    margin = max(12, w // 18)
    ref_y = min(int(h * 0.06), h - 1)
    px = shot.load()
    side = [px[x, ref_y] for x in range(0, margin)] + [px[x, ref_y] for x in range(w - margin, w)]
    avg = sum(sum(p) / 3 for p in side) / len(side)
    return avg >= 165


def strip_ios_status_bar(shot: Image.Image) -> Image.Image:
    """Crop legacy dark status-bar exports (Playwright). Skip for light native device chrome."""
    w, h = shot.size
    if h < 2400 or w < 1100:
        return shot
    if _has_light_ios_status_bar(shot):
        return shot

    ymax = int(h * 0.075)
    last_dark_row = -1
    for y in range(ymax):
        lums = [sum(shot.getpixel((x, y))) / 3 for x in range(0, w, max(1, w // 60))]
        if min(lums) < 25:
            last_dark_row = y

    if last_dark_row < int(h * 0.02):
        return shot

    crop_y = last_dark_row + 1
    while crop_y < ymax:
        lums = [sum(shot.getpixel((x, crop_y))) / 3 for x in range(0, w, max(1, w // 60))]
        if min(lums) >= 180:
            break
        crop_y += 1

    if crop_y >= ymax:
        crop_y = int(h * 0.056)

    return shot.crop((0, crop_y, w, h))


def remove_dynamic_island(shot: Image.Image) -> Image.Image:
    """Paint over the centered Dynamic Island pill using the adjacent header color."""
    w, h = shot.size
    out = shot.copy()
    draw = ImageDraw.Draw(out)
    px = out.load()

    y_max = max(int(h * ISLAND_BAND_FRAC), 24)
    margin = max(12, w // 18)
    island_pixels: list[tuple[int, int]] = []

    for y in range(0, y_max):
        left = [px[x, y] for x in range(0, margin)]
        right = [px[x, y] for x in range(w - margin, w)]
        samples = left + right
        ref_lum = sum(sum(p) / 3 for p in samples) / len(samples)
        delta_thresh = max(8, ref_lum * 0.22) if ref_lum < 70 else max(18, ref_lum * 0.32)

        row_island: list[int] = []
        for x in range(margin, w - margin):
            lum = sum(px[x, y]) / 3
            if ref_lum - lum > delta_thresh:
                row_island.append(x)

        if not row_island:
            continue
        span = max(row_island) - min(row_island) + 1
        if span > w * 0.55:
            continue
        island_pixels.extend((x, y) for x in row_island)

    ref_y = 4
    side = [px[x, ref_y] for x in range(0, margin)] + [px[x, ref_y] for x in range(w - margin, w)]
    fill = tuple(sum(c) // len(c) for c in zip(*side))

    if island_pixels:
        x0 = min(p[0] for p in island_pixels)
        x1 = max(p[0] for p in island_pixels)
        y0 = min(p[1] for p in island_pixels)
        y1 = max(p[1] for p in island_pixels)
        pad = max(2, w // 200)
        radius = max(4, (y1 - y0 + 2 * pad) // 2)
        draw.rounded_rectangle((x0 - pad, y0 - pad, x1 + pad, y1 + pad), radius=radius, fill=fill)
    if w < 1100:
        # Browser / Playwright frames: flatten the centered island band in the top bar.
        y0, y1 = int(h * 0.018), int(h * 0.072)
        x0, x1 = int(w * 0.30), int(w * 0.70)
        radius = max(6, (y1 - y0) // 2)
        draw.rounded_rectangle((x0, y0, x1, y1), radius=radius, fill=fill)

    return out


def clean_phone_screenshot(shot: Image.Image) -> Image.Image:
    shot = neutralize_ios_status_chrome(shot)
    shot = strip_ios_status_bar(shot)
    shot = remove_dynamic_island(shot)
    return shot


SLIDES = [
    {
        "file": "01-brand-iphone-{locale}.png",
        "de": (
            "EIN COACH, DER SIE KENNT",
            "Lebenskontext und Verlauf — ein Gedächtnis, das mitdenkt. Sicher, privat, transparent.",
        ),
        "en": (
            "A COACH WHO KNOWS YOU",
            "Life context and history — memory that follows you. Secure, private, transparent.",
        ),
        "src_de": "about-coach-knows-you-de.png",
        "src_en": "about-coach-knows-you-en.png",
        "fallback": "IMG_1647.PNG",
    },
    {
        "file": "02-connector-radar-iphone-{locale}.png",
        "de": ("IHR VERBINDUNGS-RADAR", "The Connector zeigt Stärken in Empathie, Präsenz, Neugier und mehr."),
        "en": ("YOUR CONNECTION RADAR", "The Connector reveals empathy, presence, curiosity, and more."),
        "src_de": "IMG_1649.PNG",
        "src_en": "connector-radar-en-light.png",
    },
    {
        "file": "03-connector-persona-iphone-{locale}.png",
        "de": ("ECHTE ALLTAGSSZENEN", "Kurze Gespräche mit KI-Personas — zuhörend üben."),
        "en": (
            "THE CONNECTOR",
            "Pick a scenario from the catalog. One conversation — clear feedback.",
        ),
        "src_de": "IMG_1648.PNG",
        "src_en": "connector-catalog-en.png",
    },
    {
        "file": "04-practice-iphone-{locale}.png",
        "de": (
            "COACHING ÜBEN",
            "Du bist der Coach — die KI spielt deinen Klienten. Feedback direkt danach.",
        ),
        "en": (
            "PRACTICE COACHING",
            "You are the coach — the AI plays your client. Structured feedback right after.",
        ),
        "src_de": "about-coach-practice-de.png",
        "src_en": "about-coach-practice-en.png",
    },
    {
        "file": "05-ecosystem-iphone-{locale}.png",
        "de": ("THE CONNECTOR", "In der Coach-Auswahl — Alltagsgespräche mit Auswertung."),
        "en": ("MEET THE CONNECTOR", "On your coach grid — practice connection in everyday scenes."),
        "src_de": "IMG_1647.PNG",
        "src_en": "coach-grid-connector-en.png",
    },
]


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    paths = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/SFNS.ttf",
    ]
    for p in paths:
        if Path(p).exists():
            try:
                return ImageFont.truetype(p, size)
            except OSError:
                continue
    return ImageFont.load_default()


def wrap_lines(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_w: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    cur = ""
    for w in words:
        trial = f"{cur} {w}".strip()
        if draw.textlength(trial, font=font) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines or [text]


def draw_centered_block(
    draw: ImageDraw.ImageDraw,
    lines: list[str],
    y: int,
    font: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int],
    line_gap: int,
) -> int:
    for line in lines:
        tw = draw.textlength(line, font=font)
        draw.text(((W - tw) / 2, y), line, font=font, fill=fill)
        y += line_gap
    return y


def compose_store_card(headline: str, body: str, shot: Image.Image, lifestyle: bool = False) -> Image.Image:
    canvas = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(canvas)

    title_font = load_font(TITLE_SIZE, bold=True)
    body_font = load_font(BODY_SIZE)
    max_text_w = W - 120

    accent_y = 56
    draw.line([(W // 2 - 100, accent_y), (W // 2 + 100, accent_y)], fill=TEAL, width=5)

    y = 96
    for line in wrap_lines(draw, headline, title_font, max_text_w):
        tw = draw.textlength(line, font=title_font)
        draw.text(((W - tw) / 2, y), line, font=title_font, fill=INK)
        y += TITLE_LINE
    y += 16
    y = draw_centered_block(draw, wrap_lines(draw, body, body_font, max_text_w), y, body_font, MUTED, BODY_LINE)

    card_y = y + 36
    card_w = W - 2 * CARD_X
    card_h = H - card_y - 48

    card = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
    cd = ImageDraw.Draw(card)
    cd.rounded_rectangle((0, 0, card_w, card_h), radius=CARD_RADIUS, fill=(*CARD, 255))
    canvas.paste(card, (CARD_X, card_y), card)

    inner_w = card_w - 2 * CARD_PAD
    inner_h = card_h - 2 * CARD_PAD
    sw, sh = shot.size

    if lifestyle:
        scale = max(inner_w / sw, inner_h / sh)
        nw, nh = int(sw * scale), int(sh * scale)
        shot = shot.resize((nw, nh), Image.Resampling.LANCZOS)
        left = (nw - inner_w) // 2
        top = (nh - inner_h) // 2
        shot = shot.crop((left, top, left + inner_w, top + inner_h))
        nw, nh = inner_w, inner_h
    else:
        scale = min(inner_w / sw, inner_h / sh)
        nw, nh = int(sw * scale), int(sh * scale)
        shot = shot.resize((nw, nh), Image.Resampling.LANCZOS)

    px = CARD_X + CARD_PAD + (inner_w - nw) // 2
    py = card_y + CARD_PAD + (inner_h - nh) // 2

    mask = Image.new("L", (nw, nh), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, nw, nh), radius=28, fill=255)
    canvas.paste(shot, (px, py), mask)

    return canvas


def resolve_src(slide: dict, locale: str) -> Path:
    if locale == "de" and "src_de" in slide:
        p = SRC / slide["src_de"]
        if p.exists():
            return p
    if locale == "en" and "src_en" in slide:
        p = SRC / slide["src_en"]
        if p.exists():
            return p
    if "src" in slide:
        return SRC / slide["src"]
    if "fallback" in slide:
        p = SRC / slide["fallback"]
        if p.exists():
            return p
    raise FileNotFoundError(f"No source image for slide {slide['file']}")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for slide in SLIDES:
        for locale in ("de", "en"):
            headline, body = slide[locale]
            path = resolve_src(slide, locale)
            shot = clean_phone_screenshot(Image.open(path).convert("RGB"))
            lifestyle = slide.get("lifestyle", False) or (
                locale == "de" and slide.get("lifestyle_de", False)
            )
            img = compose_store_card(headline, body, shot, lifestyle=lifestyle)
            out_path = OUT / slide["file"].format(locale=locale)
            img.save(out_path, "PNG", optimize=True)
            print(f"Wrote {out_path} ({path.name})")


if __name__ == "__main__":
    main()
