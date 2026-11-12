#!/usr/bin/env node
/**
 * Renders iOS homescreen icon assets from assets/brand/logo-wheel.svg.
 *
 * Outputs:
 * - ios/App/App/AppIcon.icon/Assets/icon-main-1024.png (transparent wheel for Glass Icon)
 * - ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png (gradient + wheel fallback)
 *
 * Gradient matches ios/App/App/AppIcon.icon/icon.json light appearance.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SIZE = 1024;
/** Matches AppIcon.icon layer scale so the opaque fallback matches Glass rendering. */
const WHEEL_SCALE = 0.9;

const WHEEL_SVG_PATH = join(ROOT, 'assets/brand/logo-wheel.svg');
const GLASS_WHEEL_OUT = join(ROOT, 'ios/App/App/AppIcon.icon/Assets/icon-main-1024.png');
const FALLBACK_OUT = join(
  ROOT,
  'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png',
);

/** Cyan → blue from icon.json fill-specializations (light). */
const GRADIENT_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
  <defs>
    <linearGradient id="bg" gradientUnits="userSpaceOnUse"
      x1="${SIZE / 2}" y1="0" x2="${SIZE / 2}" y2="${SIZE * 0.7}">
      <stop offset="0%" stop-color="#00C8B3"/>
      <stop offset="100%" stop-color="#0088FF"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)"/>
</svg>`;

async function renderWheelPng(size) {
  const svg = readFileSync(WHEEL_SVG_PATH);
  return sharp(svg).resize(size, size).png().toBuffer();
}

async function main() {
  const wheelFull = await renderWheelPng(SIZE);
  await sharp(wheelFull).png().toFile(GLASS_WHEEL_OUT);

  const scaled = Math.round(SIZE * WHEEL_SCALE);
  const offset = Math.round((SIZE - scaled) / 2);
  const wheelScaled = await renderWheelPng(scaled);
  const gradient = Buffer.from(GRADIENT_SVG);

  await sharp(gradient)
    .composite([{ input: wheelScaled, left: offset, top: offset }])
    .png()
    .toFile(FALLBACK_OUT);

  console.log('Wrote', GLASS_WHEEL_OUT);
  console.log('Wrote', FALLBACK_OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
