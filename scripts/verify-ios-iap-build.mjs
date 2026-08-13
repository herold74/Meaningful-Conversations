#!/usr/bin/env node
/**
 * Pre-archive checks for iOS App Store builds with RevenueCat / IAP.
 * Run after: npm run build && npx cap sync ios
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = false;

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  failed = true;
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

// 1. RevenueCat public API key baked into Vite bundle (appl_ prefix)
const distDir = path.join(root, 'dist', 'assets');
if (!fs.existsSync(distDir)) {
  fail('dist/assets/ not found — run npm run build first');
} else {
  const mainJs = fs.readdirSync(distDir).filter((f) => f.startsWith('main-') && f.endsWith('.js'));
  if (mainJs.length === 0) {
    fail('No main-*.js in dist/assets — run npm run build first');
  } else {
    const bundlePath = path.join(distDir, mainJs[0]);
    const bundle = fs.readFileSync(bundlePath, 'utf8');
    if (/appl_[A-Za-z0-9]+/.test(bundle)) {
      ok('RevenueCat iOS API key (appl_…) found in bundle');
    } else {
      fail('RevenueCat key missing from bundle — set VITE_REVENUECAT_IOS_KEY in .env.local and rebuild');
    }

    const backends = [...bundle.matchAll(/mc-[a-z]+\.manualmode\.at/g)].map((m) => m[0]);
    const uniqueBackends = [...new Set(backends)];
    if (uniqueBackends.length === 1 && uniqueBackends[0] === 'mc-app.manualmode.at') {
      ok('Production API host (mc-app.manualmode.at) in bundle');
    } else if (uniqueBackends.includes('mc-beta.manualmode.at')) {
      fail(`Staging API in bundle: ${uniqueBackends.join(', ')} — use npm run build (not sync:ios-staging) for App Store`);
    } else {
      ok(`API hosts in bundle: ${uniqueBackends.join(', ') || '(none — runtime only)'}`);
    }
  }
}

// 2. RevenueCat Capacitor plugin present in ios/
const rcPlugin = path.join(root, 'node_modules', '@revenuecat', 'purchases-capacitor');
if (fs.existsSync(rcPlugin)) {
  ok('@revenuecat/purchases-capacitor installed');
} else {
  fail('@revenuecat/purchases-capacitor not found — run npm install');
}

// 3. Xcode marketing / build version sanity
const pbxproj = path.join(root, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');
if (fs.existsSync(pbxproj)) {
  const pbx = fs.readFileSync(pbxproj, 'utf8');
  const marketing = pbx.match(/MARKETING_VERSION = ([^;]+);/);
  const build = pbx.match(/CURRENT_PROJECT_VERSION = (\d+);/);
  if (marketing) ok(`MARKETING_VERSION = ${marketing[1].trim()}`);
  if (build) ok(`CURRENT_PROJECT_VERSION = ${build[1]}`);
} else {
  fail('ios/App/App.xcodeproj/project.pbxproj not found');
}

// 4. .env.local hint (do not print secret)
const envLocal = path.join(root, '.env.local');
if (fs.existsSync(envLocal)) {
  const env = fs.readFileSync(envLocal, 'utf8');
  if (/VITE_REVENUECAT_IOS_KEY\s*=\s*"?appl_/.test(env)) {
    ok('.env.local contains VITE_REVENUECAT_IOS_KEY');
  } else {
    fail('.env.local exists but VITE_REVENUECAT_IOS_KEY is missing or invalid (must start with appl_)');
  }
} else {
  fail('.env.local not found — create it with VITE_REVENUECAT_IOS_KEY=appl_… from RevenueCat dashboard');
}

if (failed) {
  console.error('\n_iOS IAP build verification failed. Fix issues before archiving for App Store._');
  process.exit(1);
}

console.log('\n_iOS IAP build verification passed. Ready for Xcode Archive._');
