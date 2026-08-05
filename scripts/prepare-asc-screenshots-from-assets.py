#!/usr/bin/env python3
"""Build App Store Connect sets from journey + archived app-store sources."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
JOURNEY = ROOT / 'screenshots' / 'journey'
APP_STORE = ROOT / 'screenshots' / 'app-store'
VERSION = 'v2.5.4'
OUT = APP_STORE / VERSION
SRC_242 = APP_STORE / 'v2.4.2'

IPHONE_SIZE = (1284, 2778)
IPAD_SIZE = (2048, 2732)

# ASC upload order — sources must match screen content (see manifest.json)
IPHONE_ASC: list[tuple[str, str, str]] = [
    ('app-store/v2.4.2/iphone/01-welcome-dark-iphone-de.png', '01-welcome-dark-iphone-de.png', 'Welcome / auth'),
    ('journey/03-context-setup/06-intent-picker-dark-iphone-de.png', '02-intent-picker-iphone-de.png', 'Intent picker'),
    ('journey/04-bot-selection/02-coaching-section-iphone-de.png', '03-coach-grid-iphone-de.png', 'Coach selection (Coaching section)'),
    ('app-store/v2.4.2/iphone/04-coaching-chat-iphone-de.png', '04-coaching-chat-iphone-de.png', 'Coaching chat'),
    ('journey/05-chat/07-session-analyzing-iphone-de.png', '05-session-analyzing-iphone-de.png', 'Session analyzing'),
    ('app-store/v2.4.2/iphone/06-session-review-iphone-de.png', '06-session-review-iphone-de.png', 'Session review'),
    ('app-store/v2.4.2/iphone/07-session-review-updates-iphone-de.png', '07-session-review-updates-iphone-de.png', 'Context updates diff'),
    ('journey/01-landing/04-landing-template-context-iphone-de.png', '08-landing-hub-iphone-de.png', 'Landing hub / life context'),
]

IPHONE_PRACTICE: list[tuple[str, str, str]] = [
    ('journey/10-practice/iphone/01-practice-setup-iphone-de.png', '09-practice-setup-iphone-de.png', 'Practice setup'),
    ('journey/10-practice/iphone/02-practice-contracting-iphone-de.png', '10-practice-contracting-iphone-de.png', 'Practice contracting'),
]

IPAD_CARRY = [
    '01-welcome-dark-ipad13-de.png',
    '02-landing-hub-ipad13-de.png',
    '03-bot-selection-ipad13-de.png',
    '04-coaching-chat-ipad13-de.png',
]

IPAD_PRACTICE: list[tuple[str, str, str]] = [
    ('journey/10-practice/ipad/01-practice-setup-ipad13-de.png', '05-practice-setup-ipad13-de.png', 'Practice setup'),
    ('journey/10-practice/ipad/02-practice-scenarios-ipad13-de.png', '06-practice-scenarios-ipad13-de.png', 'Practice scenarios'),
    ('journey/10-practice/ipad/03-practice-methods-ipad13-de.png', '07-practice-methods-ipad13-de.png', 'Practice methods'),
    ('journey/10-practice/ipad/04-practice-contracting-setup-ipad13-de.png', '08-practice-contracting-setup-ipad13-de.png', 'Practice contracting'),
    ('journey/10-practice/ipad/05-practice-evaluation-ipad13-de.png', '09-practice-evaluation-ipad13-de.png', 'Practice evaluation'),
]


def resolve_src(rel: str) -> Path:
    if rel.startswith('journey/'):
        return ROOT / 'screenshots' / rel
    if rel.startswith('app-store/'):
        return ROOT / 'screenshots' / rel.replace('app-store/', 'app-store/', 1)
    return ROOT / 'screenshots' / rel


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


def copy_or_resize(src: Path, dest: Path, target: tuple[int, int]) -> None:
    img = Image.open(src).convert('RGB')
    if img.size != target:
        img = resize_cover_crop(img, target)
    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, format='PNG', optimize=True)
    print(f'  ✓ {dest.name} ← {src.name} ({img.size[0]}×{img.size[1]})')


def rebuild_iphone(out_dir: Path) -> list[dict]:
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True)
    manifest: list[dict] = []

    print('iPhone ASC set (8 screens)…')
    for rel, name, label in IPHONE_ASC:
        src = resolve_src(rel)
        if not src.exists():
            raise FileNotFoundError(src)
        copy_or_resize(src, out_dir / name, IPHONE_SIZE)
        manifest.append({'file': name, 'source': rel, 'screen': label, 'size': list(IPHONE_SIZE)})

    print('iPhone practice…')
    for rel, name, label in IPHONE_PRACTICE:
        src = resolve_src(rel)
        if not src.exists():
            raise FileNotFoundError(src)
        copy_or_resize(src, out_dir / name, IPHONE_SIZE)
        manifest.append({'file': name, 'source': rel, 'screen': label, 'size': list(IPHONE_SIZE), 'optional': True})

    return manifest


def rebuild_ipad(out_dir: Path) -> list[dict]:
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True)
    manifest: list[dict] = []

    print('iPad base (v2.4.2)…')
    for name in IPAD_CARRY:
        src = SRC_242 / 'ipad' / name
        if not src.exists():
            raise FileNotFoundError(src)
        copy_or_resize(src, out_dir / name, IPAD_SIZE)
        manifest.append({'file': name, 'source': f'app-store/v2.4.2/ipad/{name}', 'screen': name, 'size': list(IPAD_SIZE)})

    print('iPad practice…')
    for rel, name, label in IPAD_PRACTICE:
        src = resolve_src(rel)
        if not src.exists():
            raise FileNotFoundError(src)
        copy_or_resize(src, out_dir / name, IPAD_SIZE)
        manifest.append({'file': name, 'source': rel, 'screen': label, 'size': list(IPAD_SIZE), 'optional': True})

    return manifest


def write_manifest(iphone: list[dict], ipad: list[dict]) -> None:
    payload = {
        'version': VERSION,
        'iphoneAscSize': list(IPHONE_SIZE),
        'ipadAscSize': list(IPAD_SIZE),
        'iphone': iphone,
        'ipad': ipad,
    }
    (OUT / 'manifest.json').write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def main() -> None:
    iphone_manifest = rebuild_iphone(OUT / 'iphone')
    ipad_manifest = rebuild_ipad(OUT / 'ipad')
    write_manifest(iphone_manifest, ipad_manifest)
    print(f'\nDone → {OUT}')
    print('Update README.md manually if slot table changed; see manifest.json for sources.')


if __name__ == '__main__':
    main()
