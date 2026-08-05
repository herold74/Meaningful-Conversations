#!/usr/bin/env node
/**
 * Verify DE and EN locale files have identical key sets.
 * Usage: node scripts/check-locale-parity.mjs
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dePath = join(root, 'public/locales/de.json');
const enPath = join(root, 'public/locales/en.json');

function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const pathKey = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flattenKeys(v, pathKey));
    } else {
      keys.push(pathKey);
    }
  }
  return keys;
}

const de = JSON.parse(readFileSync(dePath, 'utf8'));
const en = JSON.parse(readFileSync(enPath, 'utf8'));

const deKeys = new Set(flattenKeys(de));
const enKeys = new Set(flattenKeys(en));

const onlyDe = [...deKeys].filter((k) => !enKeys.has(k)).sort();
const onlyEn = [...enKeys].filter((k) => !deKeys.has(k)).sort();

if (onlyDe.length || onlyEn.length) {
  console.error('Locale key mismatch between de.json and en.json');
  if (onlyDe.length) {
    console.error(`\nOnly in de.json (${onlyDe.length}):`);
    onlyDe.slice(0, 30).forEach((k) => console.error(`  - ${k}`));
    if (onlyDe.length > 30) console.error(`  ... and ${onlyDe.length - 30} more`);
  }
  if (onlyEn.length) {
    console.error(`\nOnly in en.json (${onlyEn.length}):`);
    onlyEn.slice(0, 30).forEach((k) => console.error(`  - ${k}`));
    if (onlyEn.length > 30) console.error(`  ... and ${onlyEn.length - 30} more`);
  }
  process.exit(1);
}

console.log(`Locale parity OK (${deKeys.size} keys in de.json and en.json)`);
