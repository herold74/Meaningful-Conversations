#!/usr/bin/env python3
"""Build App Store Connect screenshot sets from full-size device exports."""

from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'screenshots' / 'source' / 'v2.5.4'
SRC_242 = ROOT / 'screenshots' / 'app-store-v2.4.2'
OUT = ROOT / 'screenshots' / 'app-store-v2.5.4'

IPHONE_SIZE = (1284, 2778)
IPAD_SIZE = (2048, 2732)

IPHONE_PRACTICE = [
    ('iphone/IMG_1307.PNG', '05-practice-setup'),
    ('iphone/IMG_1308.PNG', '06-practice-contracting'),
    ('iphone/IMG_1310.PNG', '07-practice-evaluation'),
]

IPAD_PRACTICE = [
    ('ipad/IMG_0279.PNG', '05-practice-setup'),
    ('ipad/IMG_0280.PNG', '06-practice-scenarios'),
    ('ipad/IMG_0281.PNG', '07-practice-methods'),
    ('ipad/IMG_0282.PNG', '08-practice-contracting-setup'),
    ('ipad/IMG_0283.PNG', '09-practice-evaluation'),
]

IPHONE_CARRY = [
    '01-welcome-dark-iphone-de.png',
    '02-landing-hub-iphone-de.png',
    '03-bot-selection-iphone-de.png',
    '04-coaching-chat-iphone-de.png',
]

IPAD_CARRY = [
    '01-welcome-dark-ipad13-de.png',
    '02-landing-hub-ipad13-de.png',
    '03-bot-selection-ipad13-de.png',
    '04-coaching-chat-ipad13-de.png',
]


def edge_background(img: Image.Image) -> tuple[int, int, int]:
    px = img.load()
    w, h = img.size
    samples = [
        px[2, 2], px[w - 3, 2], px[2, h - 3], px[w - 3, h - 3],
        px[w // 2, 2], px[w // 2, h - 3],
    ]
    r = sum(c[0] for c in samples) // len(samples)
    g = sum(c[1] for c in samples) // len(samples)
    b = sum(c[2] for c in samples) // len(samples)
    return (r, g, b)


def resize_cover_crop(img: Image.Image, target: tuple[int, int]) -> Image.Image:
    """Scale to fill target, center-crop (for matching aspect ratios e.g. iPhone)."""
    tw, th = target
    sw, sh = img.size
    scale = max(tw / sw, th / sh)
    nw, nh = max(1, round(sw * scale)), max(1, round(sh * scale))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return resized.crop((left, top, left + tw, top + th))


def resize_fit_letterbox(img: Image.Image, target: tuple[int, int]) -> Image.Image:
    """Scale to fit inside target, letterbox with edge color (iPad aspect mismatch)."""
    tw, th = target
    sw, sh = img.size
    scale = min(tw / sw, th / sh)
    nw, nh = max(1, round(sw * scale)), max(1, round(sh * scale))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new('RGB', target, edge_background(img))
    ox, oy = (tw - nw) // 2, (th - nh) // 2
    canvas.paste(resized, (ox, oy))
    return canvas


def export_asc(src: Path, target: tuple[int, int], dest: Path, *, letterbox: bool) -> None:
    img = Image.open(src).convert('RGB')
    out = resize_fit_letterbox(img, target) if letterbox else resize_cover_crop(img, target)
    dest.parent.mkdir(parents=True, exist_ok=True)
    out.save(dest, format='PNG', optimize=True)
    print(f'  ✓ {dest.relative_to(ROOT)} ← {src.name} ({img.size[0]}×{img.size[1]} → {target[0]}×{target[1]})')


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f'Missing source folder: {SRC}')

    if OUT.exists():
        shutil.rmtree(OUT)
    (OUT / 'iphone').mkdir(parents=True)
    (OUT / 'ipad').mkdir(parents=True)

    print('Carry forward v2.4.2 base screens…')
    for name in IPHONE_CARRY:
        shutil.copy2(SRC_242 / 'iphone' / name, OUT / 'iphone' / name)
        print(f'  ✓ iphone/{name}')
    for name in IPAD_CARRY:
        shutil.copy2(SRC_242 / 'ipad' / name, OUT / 'ipad' / name)
        print(f'  ✓ ipad/{name}')

    print('Process iPhone practice screens (cover crop)…')
    for rel, stem in IPHONE_PRACTICE:
        export_asc(SRC / rel, IPHONE_SIZE, OUT / 'iphone' / f'{stem}-iphone-de.png', letterbox=False)

    print('Process iPad practice screens (letterbox)…')
    for rel, stem in IPAD_PRACTICE:
        export_asc(SRC / rel, IPAD_SIZE, OUT / 'ipad' / f'{stem}-ipad13-de.png', letterbox=True)

    readme = OUT / 'README.md'
    readme.write_text(
        '# App Store Screenshots v2.5.4 (Deutsch)\n\n'
        'Quelle: `screenshots/source/v2.5.4/` (volle Geräte-Auflösung).\n\n'
        'ASC-Pflichtmaße:\n'
        '- **iPhone 6.7"**: 1284×2778 px\n'
        '- **iPad Pro 13"**: 2048×2732 px\n\n'
        'Upload in App Store Connect → ManualMode → App Store → **Deutsch**.\n\n'
        '## iPhone (7 Screens)\n\n'
        '| # | Datei | Inhalt |\n'
        '|---|-------|--------|\n'
        '| 1 | 01-welcome-dark-iphone-de.png | Willkommen |\n'
        '| 2 | 02-landing-hub-iphone-de.png | Landing Hub |\n'
        '| 3 | 03-bot-selection-iphone-de.png | Coach-Auswahl |\n'
        '| 4 | 04-coaching-chat-iphone-de.png | Coaching-Chat |\n'
        '| 5 | 05-practice-setup-iphone-de.png | Coaching üben — Setup |\n'
        '| 6 | 06-practice-contracting-iphone-de.png | Anliegensklärung (Sage) |\n'
        '| 7 | 07-practice-evaluation-iphone-de.png | Übungsauswertung |\n\n'
        '## iPad (9 Screens)\n\n'
        '| # | Datei | Inhalt |\n'
        '|---|-------|--------|\n'
        '| 1–4 | 01–04 | Willkommen, Hub, Coaches, Chat (v2.4.2) |\n'
        '| 5 | 05-practice-setup-ipad13-de.png | Coaching üben — Setup |\n'
        '| 6 | 06-practice-scenarios-ipad13-de.png | Szenario-Auswahl |\n'
        '| 7 | 07-practice-methods-ipad13-de.png | Methoden-Auswahl |\n'
        '| 8 | 08-practice-contracting-setup-ipad13-de.png | Anliegensklärung Setup |\n'
        '| 9 | 09-practice-evaluation-ipad13-de.png | Übungsauswertung |\n\n'
        'Regenerate: `python3 scripts/prepare-asc-screenshots-from-assets.py`\n',
        encoding='utf-8',
    )
    print(f'\nDone → {OUT}')


if __name__ == '__main__':
    main()
