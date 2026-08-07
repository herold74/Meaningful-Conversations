#!/usr/bin/env node
/**
 * Ensures Capacitor plugin Package.swift files were not corrupted by cap sync.
 * Restores from the published npm tarball when invalid.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const plugins = [
  '@revenuecat/purchases-capacitor',
  '@capacitor/filesystem',
  '@capacitor/share',
  '@capacitor-community/native-audio',
];

function isValidPackageSwift(content) {
  if (!content.includes('import PackageDescription')) return false;
  if (/\^1\^/.test(content)) return false;
  if (!/\.library\s*\(\s*\n\s*name:/.test(content)) return false;
  return true;
}

function restoreFromNpm(packageName) {
  const pkgJsonPath = path.join(root, 'node_modules', packageName, 'package.json');
  const version = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')).version;
  const tmpDir = fs.mkdtempSync(path.join(root, '.tmp-ios-spm-'));
  try {
    execSync(`npm pack ${packageName}@${version} --silent`, { cwd: tmpDir, stdio: 'pipe' });
    const tgz = fs.readdirSync(tmpDir).find((f) => f.endsWith('.tgz'));
    if (!tgz) throw new Error(`npm pack produced no tarball for ${packageName}`);
    execSync(`tar -xzf ${JSON.stringify(tgz)} -C ${JSON.stringify(tmpDir)}`, { cwd: tmpDir, stdio: 'pipe' });
    const extracted = fs.readdirSync(tmpDir).find((f) => f.startsWith('package'));
    const source = path.join(tmpDir, extracted, 'Package.swift');
    const target = path.join(root, 'node_modules', packageName, 'Package.swift');
    fs.copyFileSync(source, target);
    console.log(`Restored Package.swift for ${packageName}@${version}`);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

for (const plugin of plugins) {
  const filePath = path.join(root, 'node_modules', plugin, 'Package.swift');
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf8');
  if (isValidPackageSwift(content)) {
    console.log(`OK ${plugin}`);
    continue;
  }
  console.warn(`Invalid Package.swift detected for ${plugin} — restoring from npm`);
  restoreFromNpm(plugin);
}
