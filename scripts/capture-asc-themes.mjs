#!/usr/bin/env node
/**
 * Capture 6 theme previews per locale for ASC slide 6 (3 schemes × light/dark).
 * Output:
 *   iphone: _source/themes/{de|en}/{theme}-{light|dark}.png  (~1290×2796)
 *   ipad:   _source/themes/ipad/{de|en}/{theme}-{light|dark}.png  (~2048×2732)
 *
 *   npm run build && npx vite preview --port 5173
 *   node scripts/capture-asc-themes.mjs --base "http://127.0.0.1:5173/?backend=staging" [--lang de|en|all] [--device iphone|ipad|all]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const THEMES_ROOT = path.join(__dirname, '../screenshots/app-store/v2.6.0/_source/themes');

const BASE_URL = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : 'http://127.0.0.1:5173/?backend=staging';

const LANG_ARG = process.argv.includes('--lang')
  ? process.argv[process.argv.indexOf('--lang') + 1]
  : 'all';

const DEVICE_ARG = process.argv.includes('--device')
  ? process.argv[process.argv.indexOf('--device') + 1]
  : 'iphone';

const THEMES = ['summer', 'autumn', 'brand'];

const DEVICE_PROFILES = {
  iphone: {
    label: 'iPhone 14 Pro Max',
    playwrightDevice: 'iPhone 14 Pro Max',
    outSubdir: (locale) => locale,
  },
  ipad: {
    label: 'iPad Pro 13"',
    playwrightDevice: null,
    viewport: { width: 1024, height: 1366 },
    deviceScaleFactor: 2,
    outSubdir: (locale) => path.join('ipad', locale),
  },
};

const LOCALES = {
  de: {
    code: 'de',
    playwrightLocale: 'de-DE',
    guest: /Als Gast fortfahren/i,
    intentSelect: /Auswählen: Coaching zu meinem Anliegen/i,
    skip: /Überspringen/i,
  },
  en: {
    code: 'en',
    playwrightLocale: 'en-CA',
    guest: /Continue as Guest/i,
    intentSelect: /Choose: Coaching for my concern/i,
    skip: /^Skip$/i,
  },
};

function currentSeason() {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return 'spring';
  if (m >= 5 && m <= 7) return 'summer';
  if (m >= 8 && m <= 10) return 'autumn';
  return 'winter';
}

async function guestToLanding(page, loc) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: loc.guest }).click({ timeout: 20000 });
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: loc.intentSelect }).click({ timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: loc.skip }).click({ timeout: 10000 });
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function main() {
  const { chromium, devices } = await import('playwright');
  const deviceKeys =
    DEVICE_ARG === 'all' ? ['iphone', 'ipad'] : [DEVICE_ARG];
  const langs = LANG_ARG === 'all' ? ['de', 'en'] : [LANG_ARG];
  const browser = await chromium.launch({ headless: true });
  const season = currentSeason();

  for (const deviceKey of deviceKeys) {
    const profile = DEVICE_PROFILES[deviceKey];
    if (!profile) {
      console.error(`Unknown --device ${deviceKey}`);
      process.exit(1);
    }
    const iphone = profile.playwrightDevice ? devices[profile.playwrightDevice] : null;

    for (const key of langs) {
      const loc = LOCALES[key];
      if (!loc) continue;
      const OUT = path.join(THEMES_ROOT, profile.outSubdir(key));
      fs.mkdirSync(OUT, { recursive: true });

      for (const theme of THEMES) {
        for (const mode of ['light', 'dark']) {
          const contextOptions = iphone
            ? {
                ...iphone,
                viewport: iphone.screen,
                locale: loc.playwrightLocale,
                colorScheme: mode,
              }
            : {
                viewport: profile.viewport,
                deviceScaleFactor: profile.deviceScaleFactor,
                isMobile: true,
                hasTouch: true,
                locale: loc.playwrightLocale,
                colorScheme: mode,
              };
          const context = await browser.newContext(contextOptions);
        const page = await context.newPage();
        await page.addInitScript(({ theme, mode, season, lang }) => {
          localStorage.setItem('language', lang);
          localStorage.setItem('isDarkMode', mode === 'dark' ? 'dark' : 'false');
          localStorage.setItem('colorTheme', theme);
          localStorage.setItem('lastAppliedSeason', season);
          localStorage.setItem('autoThemeEnabled', 'false');
          localStorage.setItem('intentPickerDisabled', 'true');
          localStorage.setItem('profileHintDisabled', 'true');
          localStorage.setItem('oceanOnboardingDisabled', 'true');
          if (mode === 'dark') document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
        }, { theme, mode, season, lang: loc.code });

        await guestToLanding(page, loc);
        await page.evaluate(() => {
          localStorage.setItem('isDarkMode', document.documentElement.classList.contains('dark') ? 'dark' : 'false');
        });
          const outPath = path.join(OUT, `${theme}-${mode}.png`);
          await page.screenshot({ path: outPath, fullPage: false, animations: 'disabled', scale: 'device' });
          console.log(`✓ [${deviceKey}] ${outPath}`);
          await context.close();
        }
      }
    }
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
