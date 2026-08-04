#!/usr/bin/env node
/**
 * App Store screenshot capture (iPhone 6.5" + iPad Pro 12.9"/13"), DE and/or EN.
 *
 * Usage:
 *   node scripts/capture-app-store-screenshots.mjs [--base URL] [--headed]
 *     [--device iphone|ipad] [--lang de|en|all]
 *
 * Requires: local frontend (5173) + backend (3001), npx playwright chromium
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_ROOT = path.join(ROOT, 'screenshots/app-store-v2.5.4');

const BASE_URL = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : 'http://localhost:5173/?backend=local';

const HEADED = process.argv.includes('--headed');
const DEVICE_FILTER = process.argv.includes('--device')
  ? process.argv[process.argv.indexOf('--device') + 1]
  : null;

const LANG_ARG = process.argv.includes('--lang')
  ? process.argv[process.argv.indexOf('--lang') + 1]
  : 'all';

const DEVICES = {
  iphone: {
    label: 'iPhone 6.5"/6.7"',
    viewport: { width: 428, height: 926 },
    deviceScaleFactor: 3,
  },
  ipad: {
    label: 'iPad Pro 13"',
    viewport: { width: 1024, height: 1366 },
    deviceScaleFactor: 2,
  },
};

const LOCALES = {
  de: {
    code: 'de',
    playwrightLocale: 'de-DE',
    suffix: { iphone: 'iphone-de', ipad: 'ipad13-de' },
    splashLoading: 'Deine Sitzung wird geladen',
    welcomeHints: ['Willkommen', 'Anmelden'],
    login: 'Anmelden',
    loginError: /Ungültige Anmeldedaten|Invalid credentials/i,
    guest: 'Als Gast fortfahren',
    intentCoaching: /Gedanken strukturieren/i,
    skip: 'Überspringen',
    continue: 'Weiter',
    later: /Später|Later/i,
    namePlaceholder: /Vorname|Synonym|Pseudonym/i,
    landingHints: [
      'Mit Lebenskontext fortfahren',
      'Neues Gespräch starten',
      'Lebenskontext-Datei',
    ],
    botSelection: 'Wählen Sie einen Coach',
    coachingSection: 'Coaching',
    chatMessage:
      'Ich überlege einen Karrierewechsel und möchte Klarheit darüber gewinnen, was mich zurückhält.',
    send: /Nachricht senden|Senden/i,
    voice: /Sprachmodus wechseln|Voice mode/i,
    endSession: /Sitzung beenden|End Session/i,
    sessionReview: /Diskursanalyse|Zusammenfassung|Erkenntnisse|Sitzungsauswertung|Session Review/i,
    updates: /Vorgeschlagene Aktualisierungen|Proposed Updates|Diff|Unterschied/i,
    menu: /^Menü$/,
    achievements: /Erfolge|Achievements/i,
    achievementsHints: ['Erfolge', 'Level', 'XP'],
    ocean: /Lerne dich selbst|Persönlichkeitstest/i,
    profileHint: /Spiral Dynamics|Riemann|Profil vervollständigen/i,
    sampleLc: `# Lebenskontext

## 👤 Kernprofil
**Ich bin...**: Sarah, UX-Designerin Mitte 30
**Land / Bundesland**: Österreich
**Grundwerte**: Authentizität, Wachstum, Kreativität
**Allgemeine Stimmung**: Reflektiert, offen für Veränderung

## 💼 Karriere & Beruf
**Aktuelle Situation**: UX-Designerin in einem Tech-Unternehmen, überlegt einen Karrierewechsel
**Ziele**: Klarheit über nächste berufliche Schritte gewinnen
**Herausforderungen**: Angst vor dem Unbekannten, aber Sehnsucht nach mehr Sinnhaftigkeit
`,
  },
  en: {
    code: 'en',
    playwrightLocale: 'en-US',
    suffix: { iphone: 'iphone-en', ipad: 'ipad13-en' },
    splashLoading: 'Loading your experience',
    welcomeHints: ['Welcome', 'Login'],
    login: 'Login',
    loginError: /Invalid email or password|Invalid credentials/i,
    guest: 'Continue as Guest',
    intentCoaching: /Structure thoughts/i,
    skip: 'Skip',
    continue: 'Continue',
    later: /Later/i,
    namePlaceholder: /First name|Synonym|Pseudonym/i,
    landingHints: [
      'Continue with your Life Context',
      'Start a new conversation',
      'Life Context',
    ],
    botSelection: 'Select a Coach',
    coachingSection: 'Coaching',
    chatMessage:
      'I am considering a career change and want clarity on what is holding me back.',
    send: /Send message|Send/i,
    voice: /Switch to voice|Voice mode/i,
    endSession: /End Session|Sitzung beenden/i,
    sessionReview: /Session Review|Summary|Insights|Discourse analysis/i,
    updates: /Proposed Updates|Suggested updates|Diff|Changes/i,
    menu: /^Menu$/,
    achievements: /Achievements|Erfolge/i,
    achievementsHints: ['Achievements', 'Level', 'XP'],
    ocean: /Learn about yourself|personality test|OCEAN/i,
    profileHint: /Spiral Dynamics|Riemann|Complete your profile/i,
    sampleLc: `# My Life Context

## 👤 Core Profile
**I am...**: Sarah, UX designer in her mid-30s
**Country / State**: Austria
**Core values**: Authenticity, growth, creativity
**General mood**: Reflective, open to change

## 💼 Career & Work
**Current situation**: UX designer at a tech company, considering a career change
**Goals**: Gain clarity on next career steps
**Challenges**: Fear of the unknown, but longing for more meaning
`,
  },
};

const PASSWORD = process.env.MC_DEV_PASSWORD || 'local-dev-seed-password';
const LOGIN_CANDIDATES = [
  process.env.MC_SCREENSHOT_EMAIL || 'premium@manualmode.at',
  'developer@manualmode.at',
];

function resolveLangs() {
  if (LANG_ARG === 'all') return ['de', 'en'];
  if (LOCALES[LANG_ARG]) return [LANG_ARG];
  console.error(`Unknown --lang ${LANG_ARG}. Use de, en, or all.`);
  process.exit(1);
}

function outPath(deviceKey, name, loc) {
  const dir = path.join(OUT_ROOT, deviceKey);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${name}-${loc.suffix[deviceKey]}.png`);
}

async function snap(page, deviceKey, name, loc) {
  const filepath = outPath(deviceKey, name, loc);
  await page.screenshot({ path: filepath, fullPage: false, animations: 'disabled' });
  console.log(`  ✓ ${filepath}`);
  return filepath;
}

async function waitStable(page, ms = 800) {
  await page.waitForTimeout(ms);
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
}

async function initLocale(page, loc, { dark = true } = {}) {
  await page.addInitScript(({ lang, darkMode }) => {
    localStorage.setItem('language', lang);
    localStorage.setItem('isDarkMode', darkMode ? 'dark' : 'light');
    localStorage.setItem('intentPickerDisabled', 'true');
    localStorage.setItem('profileHintDisabled', 'true');
    localStorage.setItem('oceanOnboardingDisabled', 'true');
    localStorage.setItem('userIntent', 'coaching');
    localStorage.setItem('intentPickerVersion', '1.9.7');
    localStorage.setItem('adminStartupPref', 'normal');
  }, { lang: loc.code, darkMode: dark });
}

async function waitPastSplash(page, loc, timeout = 20000) {
  await page.waitForFunction(
    (text) => !document.body?.innerText?.includes(text),
    loc.splashLoading,
    { timeout },
  ).catch(() => {});
  await page.waitForTimeout(400);
}

async function gotoApp(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
}

async function clickText(page, text, { exact = false, timeout = 20000 } = {}) {
  const pattern = text;
  const locator = page.getByRole('button', { name: pattern, exact });
  if (await locator.count()) {
    await locator.first().click({ timeout });
    return true;
  }
  const fallback = page.getByText(pattern, { exact });
  await fallback.first().click({ timeout });
  return true;
}

async function waitForAnyText(page, texts, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    for (const text of texts) {
      if (await page.getByText(text).count()) return text;
    }
    await page.waitForTimeout(300);
  }
  throw new Error(`Timed out waiting for: ${texts.join(' | ')}`);
}

async function loginPremium(page, loc) {
  await gotoApp(page);
  await waitPastSplash(page, loc);
  await waitStable(page, 600);

  await waitForAnyText(page, loc.welcomeHints, 15000);
  await clickText(page, loc.login);
  await page.waitForSelector('#email', { timeout: 15000 });

  let loggedIn = false;
  for (const email of LOGIN_CANDIDATES) {
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(PASSWORD);
    await clickText(page, loc.login, { exact: true });
    await waitStable(page, 2500);

    const hasError = await page.getByText(loc.loginError).count();
    if (!hasError && !(await page.locator('#email').isVisible().catch(() => false))) {
      console.log(`  → logged in as ${email}`);
      loggedIn = true;
      break;
    }
    if (await page.locator('#email').isVisible()) {
      await page.locator('#password').fill('');
    }
  }

  if (!loggedIn) throw new Error('Login failed for all candidate accounts');

  await waitPastSplash(page, loc);
  await dismissOnboarding(page, loc);
}

async function skipOceanOnboarding(page, loc) {
  if (!(await page.getByText(loc.ocean).count())) return;
  await page.getByText(loc.skip).first().click().catch(() => {});
  await page.waitForTimeout(700);
  const confirmSkip = page.locator('.fixed.bottom-6 button').filter({ hasText: loc.skip }).last();
  if (await confirmSkip.count()) {
    await confirmSkip.click();
  }
  await waitStable(page, 1500);
  await waitPastSplash(page, loc);
}

async function dismissOnboarding(page, loc) {
  if (await page.getByText(loc.intentCoaching).count()) {
    await page.getByText(loc.intentCoaching).first().click();
    await waitStable(page, 800);
  }

  const nameInput = page.getByPlaceholder(loc.namePlaceholder);
  if (await nameInput.count()) {
    await nameInput.fill('Sarah');
    await clickText(page, loc.continue, { exact: true });
    await waitStable(page, 1200);
    await waitPastSplash(page, loc);
  } else if (await page.getByText(loc.skip).count()) {
    await clickText(page, loc.skip).catch(() => {});
    await waitStable(page, 800);
  }

  await skipOceanOnboarding(page, loc);

  if (await page.getByText(loc.profileHint).count()) {
    await clickText(page, loc.later).catch(() => {});
    await waitStable(page, 800);
  }

  await waitPastSplash(page, loc);
}

async function continueAsGuest(page, loc) {
  await gotoApp(page);
  await waitPastSplash(page, loc);
  await waitForAnyText(page, [...loc.welcomeHints, loc.guest], 15000);
  await clickText(page, loc.guest);
  await waitStable(page, 800);

  if (await page.getByText(loc.intentCoaching).count()) {
    await page.getByText(loc.intentCoaching).first().click();
    await waitStable(page, 800);
  }

  if (await page.getByPlaceholder(loc.namePlaceholder).count()) {
    await clickText(page, loc.skip).catch(() => {});
    await waitStable(page, 800);
  }

  await waitPastSplash(page, loc);
}

async function captureWelcome(page, deviceKey, loc) {
  await gotoApp(page);
  await waitPastSplash(page, loc);
  await waitForAnyText(page, loc.welcomeHints, 15000);
  await snap(page, deviceKey, '01-welcome-dark', loc);
}

async function captureLanding(page, deviceKey, loc) {
  await waitForAnyText(page, loc.landingHints, 20000);
  await waitStable(page, 1000);
  await snap(page, deviceKey, '02-landing-hub', loc);
}

async function goToBotSelection(page, loc) {
  if (await page.getByText(loc.botSelection).count()) return;

  await page.locator('#file-upload').setInputFiles({
    name: loc.code === 'de' ? 'Lebenskontext.md' : 'Life-Context.md',
    mimeType: 'text/markdown',
    buffer: Buffer.from(loc.sampleLc),
  });
  await waitStable(page, 2000);
  await waitForAnyText(page, [loc.botSelection, 'Ava'], 20000);
}

async function captureBotSelection(page, deviceKey, loc) {
  await goToBotSelection(page, loc);
  await page.evaluate((section) => {
    const coaching = [...document.querySelectorAll('h2,h3,p,span')].find(
      (el) => el.textContent?.trim() === section,
    );
    coaching?.scrollIntoView({ block: 'center' });
  }, loc.coachingSection);
  await waitStable(page, 800);
  await snap(page, deviceKey, '03-bot-selection', loc);
}

async function captureChat(page, deviceKey, loc) {
  const avaCard = page.locator('button, [role="button"]').filter({ hasText: /^Ava$/ }).first();
  if (await avaCard.count()) {
    await avaCard.scrollIntoViewIfNeeded().catch(() => {});
    await avaCard.click({ timeout: 15000 });
  } else {
    await page.getByText('Ava', { exact: true }).first().click({ timeout: 15000 });
  }
  await waitStable(page, 2500);

  const input = page.locator('textarea').first();
  await input.waitFor({ timeout: 15000 });
  await input.fill(loc.chatMessage);

  const sendBtn = page.getByRole('button', { name: loc.send }).first();
  if (await sendBtn.count()) {
    await sendBtn.click().catch(() => page.keyboard.press('Enter'));
  } else {
    await page.keyboard.press('Enter');
  }

  await page.waitForFunction(
    () => document.querySelectorAll('[class*="message"], [data-role="message"], .prose').length >= 2,
    { timeout: 90000 },
  ).catch(async () => {
    await waitStable(page, 8000);
  });
  await waitStable(page, 1500);
  await snap(page, deviceKey, '04-coaching-chat', loc);

  const voiceBtn = page.getByRole('button', { name: loc.voice }).first();
  if (await voiceBtn.count()) {
    await voiceBtn.click().catch(() => {});
    await waitStable(page, 2000);
    await snap(page, deviceKey, '05-voice-mode', loc);
  } else {
    console.log('  ⚠ voice mode button not found');
  }
}

async function captureSessionReview(page, deviceKey, loc) {
  await clickText(page, loc.endSession).catch(() => {});
  await waitStable(page, 2000);

  await page.getByText(loc.sessionReview).first()
    .waitFor({ timeout: 120000 }).catch(() => {});
  await waitStable(page, 1500);
  await snap(page, deviceKey, '06-session-review', loc);

  const diffSection = page.getByText(loc.updates).first();
  if (await diffSection.count()) {
    await diffSection.scrollIntoViewIfNeeded().catch(() => {});
  } else {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.55));
  }
  await waitStable(page, 800);
  await snap(page, deviceKey, '07-session-review-updates', loc);
}

async function captureAchievements(page, deviceKey, loc) {
  await gotoApp(page);
  await dismissOnboarding(page, loc);
  await waitPastSplash(page, loc);

  const menuBtn = page.getByRole('button', { name: loc.menu }).first();
  if (!(await menuBtn.count())) {
    console.log('  ⚠ menu button not found');
    return;
  }
  await menuBtn.click();
  await waitStable(page, 800);

  const achievementsLink = page.getByRole('button', { name: loc.achievements }).first();
  if (await achievementsLink.count()) {
    await achievementsLink.click();
  } else {
    await clickText(page, loc.achievements).catch(() => {});
  }
  await waitStable(page, 1200);
  await waitForAnyText(page, loc.achievementsHints, 15000).catch(() => {});
  await snap(page, deviceKey, '08-achievements', loc);
}

async function runDevice(browser, deviceKey, loc) {
  const device = DEVICES[deviceKey];
  console.log(`\n📱 ${device.label} [${loc.code.toUpperCase()}]`);

  const context = await browser.newContext({
    viewport: device.viewport,
    deviceScaleFactor: device.deviceScaleFactor,
    locale: loc.playwrightLocale,
    colorScheme: 'dark',
    isMobile: deviceKey === 'iphone',
    hasTouch: true,
  });

  const page = await context.newPage();
  await initLocale(page, loc, { dark: true });

  try {
    await captureWelcome(page, deviceKey, loc);

    try {
      await loginPremium(page, loc);
    } catch {
      console.log('  (login failed — using guest flow)');
      await continueAsGuest(page, loc);
    }

    await captureLanding(page, deviceKey, loc);
    await captureBotSelection(page, deviceKey, loc);
    await captureChat(page, deviceKey, loc);
    await captureSessionReview(page, deviceKey, loc);
    await captureAchievements(page, deviceKey, loc);
  } catch (err) {
    console.error(`  ⚠ ${deviceKey}/${loc.code}: ${err.message}`);
  } finally {
    await context.close();
  }
}

async function main() {
  let playwright;
  try {
    playwright = await import('playwright');
  } catch {
    console.error('Install Playwright first: npm install -D playwright && npx playwright install chromium');
    process.exit(1);
  }

  const langs = resolveLangs();
  fs.mkdirSync(OUT_ROOT, { recursive: true });
  console.log(`App Store screenshots → ${OUT_ROOT}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Languages: ${langs.join(', ')}`);

  const browser = await playwright.chromium.launch({ headless: !HEADED });
  try {
    const deviceKeys = DEVICE_FILTER ? [DEVICE_FILTER] : Object.keys(DEVICES);
    for (const langCode of langs) {
      const loc = LOCALES[langCode];
      for (const deviceKey of deviceKeys) {
        if (!DEVICES[deviceKey]) {
          console.error(`Unknown device: ${deviceKey}`);
          continue;
        }
        await runDevice(browser, deviceKey, loc);
      }
    }
  } finally {
    await browser.close();
  }

  console.log('\n✓ Capture complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
