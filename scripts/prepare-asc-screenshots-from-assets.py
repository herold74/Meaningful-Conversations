#!/usr/bin/env python3
"""Build App Store Connect iPhone set (1284×2778) from repo sources + device exports."""

from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC_DEVICE = ROOT / 'screenshots' / 'source' / 'v2.5.4'
OUT = ROOT / 'screenshots' / 'app-store-v2.5.4'
IPHONE_SIZE = (1284, 2778)

# Matches current ASC upload order (iPhone 6.5"/6.7", Deutsch)
IPHONE_ASC = [
    ('app-store-v2.4.2/iphone/01-welcome-dark-iphone-de.png', '01-welcome-dark-iphone-de.png'),
    ('03-context-setup/06-intent-picker-dark-iphone-de.png', '02-intent-picker-iphone-de.png'),
    ('app-store-v2.4.2/iphone/03-bot-selection-iphone-de.png', '03-bot-selection-iphone-de.png'),
    ('app-store-v2.4.2/iphone/04-coaching-chat-iphone-de.png', '04-coaching-chat-iphone-de.png'),
    ('05-chat/07-session-analyzing-iphone-de.png', '05-session-analyzing-iphone-de.png'),
    ('app-store-v2.4.2/iphone/06-session-review-iphone-de.png', '06-session-review-iphone-de.png'),
    ('app-store-v2.4.2/iphone/07-session-review-updates-iphone-de.png', '07-session-review-updates-iphone-de.png'),
    ('01-landing/04-landing-template-context-iphone-de.png', '08-welcome-back-iphone-de.png'),
]

IPHONE_PRACTICE = [
    ('iphone/IMG_1311.PNG', '09-practice-setup-iphone-de.png'),
    ('iphone/IMG_1312.PNG', '10-practice-contracting-iphone-de.png'),
]

IPAD_PRACTICE = [
    ('ipad/IMG_0279.PNG', '05-practice-setup-ipad13-de.png'),
    ('ipad/IMG_0280.PNG', '06-practice-scenarios-ipad13-de.png'),
    ('ipad/IMG_0281.PNG', '07-practice-methods-ipad13-de.png'),
    ('ipad/IMG_0282.PNG', '08-practice-contracting-setup-ipad13-de.png'),
    ('ipad/IMG_0283.PNG', '09-practice-evaluation-ipad13-de.png'),
]

IPAD_CARRY = [
    '01-welcome-dark-ipad13-de.png',
    '02-landing-hub-ipad13-de.png',
    '03-bot-selection-ipad13-de.png',
    '04-coaching-chat-ipad13-de.png',
]

IPAD_SIZE = (2048, 2732)
SRC_242 = ROOT / 'screenshots' / 'app-store-v2.4.2'


def edge_background(img: Image.Image) -> tuple[int, int, int]:
    px = img.load()
    w, h = img.size
    samples = [
        px[2, 2], px[w - 3, 2], px[2, h - 3], px[w - 3, h - 3],
        px[w // 2, 2], px[w // 2, h - 3],
    ]
    return (
        sum(c[0] for c in samples) // len(samples),
        sum(c[1] for c in samples) // len(samples),
        sum(c[2] for c in samples) // len(samples),
    )


def resize_cover_crop(img: Image.Image, target: tuple[int, int]) -> Image.Image:
    tw, th = target
    sw, sh = img.size
    scale = max(tw / sw, th / sh)
    nw, nh = max(1, round(sw * scale)), max(1, round(sh * scale))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left, top = (nw - tw) // 2, (nh - th) // 2
    return resized.crop((left, top, left + tw, top + th))


def resize_fit_letterbox(img: Image.Image, target: tuple[int, int]) -> Image.Image:
    tw, th = target
    sw, sh = img.size
    scale = min(tw / sw, th / sh)
    nw, nh = max(1, round(sw * scale)), max(1, round(sh * scale))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new('RGB', target, edge_background(img))
    canvas.paste(resized, ((tw - nw) // 2, (th - nh) // 2))
    return canvas


def copy_or_resize(src: Path, dest: Path, target: tuple[int, int], *, letterbox: bool) -> None:
    img = Image.open(src).convert('RGB')
    if img.size == target:
        dest.parent.mkdir(parents=True, exist_ok=True)
        img.save(dest, format='PNG', optimize=True)
    else:
        out = resize_fit_letterbox(img, target) if letterbox else resize_cover_crop(img, target)
        dest.parent.mkdir(parents=True, exist_ok=True)
        out.save(dest, format='PNG', optimize=True)
    print(f'  ✓ {dest.name} ← {src.name} ({img.size[0]}×{img.size[1]} → {target[0]}×{target[1]})')


def rebuild_iphone(out_dir: Path) -> None:
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True)

    print('iPhone ASC set (8 screens)…')
    for rel, name in IPHONE_ASC:
        src = ROOT / 'screenshots' / rel
        if not src.exists():
            raise FileNotFoundError(src)
        copy_or_resize(src, out_dir / name, IPHONE_SIZE, letterbox=False)

    print('iPhone practice (1311, 1312)…')
    for rel, name in IPHONE_PRACTICE:
        src = SRC_DEVICE / rel
        if not src.exists():
            raise FileNotFoundError(src)
        copy_or_resize(src, out_dir / name, IPHONE_SIZE, letterbox=False)


def rebuild_ipad(out_dir: Path) -> None:
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True)

    print('iPad base (v2.4.2)…')
    for name in IPAD_CARRY:
        shutil.copy2(SRC_242 / 'ipad' / name, out_dir / name)
        print(f'  ✓ {name}')

    print('iPad practice…')
    for rel, name in IPAD_PRACTICE:
        src = SRC_DEVICE / rel
        if not src.exists():
            raise FileNotFoundError(src)
        copy_or_resize(src, out_dir / name, IPAD_SIZE, letterbox=True)


def write_readme() -> None:
    (OUT / 'README.md').write_text(
        '# App Store Screenshots v2.5.4 (Deutsch)\n\n'
        '## iPhone 6.7" — **1284×2778** (aktuelle ASC-Auswahl)\n\n'
        '| # | Datei | Inhalt |\n'
        '|---|-------|--------|\n'
        '| 1 | 01-welcome-dark-iphone-de.png | Willkommen |\n'
        '| 2 | 02-intent-picker-iphone-de.png | Intent-Auswahl |\n'
        '| 3 | 03-bot-selection-iphone-de.png | Coach-Auswahl |\n'
        '| 4 | 04-coaching-chat-iphone-de.png | Coaching-Chat |\n'
        '| 5 | 05-session-analyzing-iphone-de.png | Sitzung wird analysiert |\n'
        '| 6 | 06-session-review-iphone-de.png | Diskursanalyse |\n'
        '| 7 | 07-session-review-updates-iphone-de.png | Kontext-Aktualisierungen |\n'
        '| 8 | 08-welcome-back-iphone-de.png | Lebenskontext / Sitzung starten |\n'
        '| 9–10 | 09–10-practice-* | Practice (optional, nicht in aktueller ASC-8er-Liste) |\n\n'
        'Quellen: `screenshots/` Journey + `source/v2.5.4/iphone/IMG_1311|1312`.\n\n'
        'Regenerate: `python3 scripts/prepare-asc-screenshots-from-assets.py`\n',
        encoding='utf-8',
    )


def main() -> None:
    # Ensure device sources for 1311/1312 live under source/
    src_iphone = SRC_DEVICE / 'iphone'
    src_iphone.mkdir(parents=True, exist_ok=True)
    for name in ('IMG_1311.PNG', 'IMG_1312.PNG'):
        loose = OUT / 'iphone' / name
        if loose.exists() and not (src_iphone / name).exists():
            shutil.copy2(loose, src_iphone / name)

    rebuild_iphone(OUT / 'iphone')
    rebuild_ipad(OUT / 'ipad')
    write_readme()
    print(f'\nDone → {OUT}')


if __name__ == '__main__':
    main()
