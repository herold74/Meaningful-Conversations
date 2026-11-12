#!/usr/bin/env node
/**
 * Capture About view tabs via Playwright (browser chrome — NOT for framed ASC slides 01/04).
 * Store listing device shots: iPhone screenshots → `_source/IMG_*.PNG` + frame-asc-marketing-device.py.
 *
 * Usage: node scripts/capture-about-asc.mjs [--base URL] [--lang de|en|all]
 *
 *   npm run build && npx vite preview --port 5173
 *   node scripts/capture-about-asc.mjs --base "http://127.0.0.1:5173/?backend=staging"
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../screenshots/app-store/v2.6.0/_source');

const BASE_URL = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : 'http://127.0.0.1:5173/?backend=staging';

const LANG_ARG = process.argv.includes('--lang')
  ? process.argv[process.argv.indexOf('--lang') + 1]
  : 'all';

const LOCALES = {
  de: {
    code: 'de',
    playwrightLocale: 'de-DE',
    guest: /Als Gast fortfahren/i,
    intentSelect: /Auswählen: Coaching zu meinem Anliegen/i,
    skip: /Überspringen/i,
    menu: 'Menü',
    aboutMenu: 'Über diese App',
    tabs: [
      { pattern: /EIN COACH, DER SIE KENNT/i, out: 'about-coach-knows-you-de.png' },
      { pattern: /COACHING ÜBEN/i, out: 'about-coach-practice-de-light.png' },
    ],
  },
  en: {
    code: 'en',
    playwrightLocale: 'en-CA',
    guest: /Continue as Guest/i,
    intentSelect: /Choose: Coaching for my concern/i,
    skip: /^Skip$/i,
    menu: 'Menu',
    aboutMenu: /About this app/i,
    tabs: [
      { pattern: /A COACH WHO KNOWS YOU|COACH WHO KNOWS/i, out: 'about-coach-knows-you-en.png' },
      { pattern: /PRACTICE COACHING|Coach Practice/i, out: 'about-coach-practice-en.png' },
    ],
  },
};

async function guestToAbout(page, loc) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: loc.guest }).click({ timeout: 20000 });
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: loc.intentSelect }).click({ timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: loc.skip }).click({ timeout: 10000 });
  await page.waitForTimeout(2000);
  await page.getByLabel(loc.menu).first().click({ timeout: 20000 });
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: loc.aboutMenu }).click({ timeout: 10000 });
  await page.waitForTimeout(1500);
}

async function main() {
  const { chromium } = await import('playwright');
  const langs = LANG_ARG === 'all' ? ['de', 'en'] : [LANG_ARG];
  fs.mkdirSync(OUT, { recursive: true });

  for (const key of langs) {
    const loc = LOCALES[key];
    if (!loc) continue;
    const browser = await chromium.launch({ headless: true });
    const { devices } = await import('playwright');
    const iphone = devices['iPhone 14 Pro Max'];
    const context = await browser.newContext({
      ...iphone,
      // device.viewport is the mobile-browser chrome height (740) — use full screen for ASC (932).
      viewport: iphone.screen,
      locale: loc.playwrightLocale,
      colorScheme: 'light',
    });
    const page = await context.newPage();
    await page.addInitScript(({ lang }) => {
      localStorage.setItem('language', lang);
      localStorage.setItem('isDarkMode', 'false');
      localStorage.setItem('colorTheme', 'brand');
      localStorage.setItem('intentPickerDisabled', 'true');
      localStorage.setItem('profileHintDisabled', 'true');
      localStorage.setItem('oceanOnboardingDisabled', 'true');
      document.documentElement.classList.remove('dark');
    }, { lang: loc.code });

    await guestToAbout(page, loc);
    await page.evaluate(() => {
      localStorage.setItem('isDarkMode', 'false');
      document.documentElement.classList.remove('dark');
    });

    for (const tab of loc.tabs) {
      await page.getByRole('button', { name: tab.pattern }).first().click({ timeout: 10000 });
      await page.waitForTimeout(1200);
      await page.evaluate(() => window.scrollTo(0, 0));
      const outPath = path.join(OUT, tab.out);
      await page.screenshot({ path: outPath, fullPage: false, animations: 'disabled', scale: 'device' });
      console.log(`✓ ${outPath}`);
    }

    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
