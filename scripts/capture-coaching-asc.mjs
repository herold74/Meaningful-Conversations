#!/usr/bin/env node
/**
 * Coaching chat for ASC slide 05 (light UI, premium login — no guest limit banner).
 * Output: screenshots/app-store/v2.6.0/_source/coaching-chat-{de|en}.png (1179×2556 device scale)
 *
 *   npm run build && npx vite preview --port 5173
 *   MC_DEV_PASSWORD=… node scripts/capture-coaching-asc.mjs --base "http://127.0.0.1:5173/?backend=staging&ascCapture=1"
 *
 * iPhone device capture: log in as Premium+ (not guest), open Ava, same dialog — save as coaching-chat-{de|en}.png
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../screenshots/app-store/v2.6.0/_source');

const BASE_URL = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : 'http://127.0.0.1:5173/?backend=staging&ascCapture=1';

const LANG_ARG = process.argv.includes('--lang')
  ? process.argv[process.argv.indexOf('--lang') + 1]
  : 'all';

const PASSWORD = process.env.MC_DEV_PASSWORD || 'local-dev-seed-password';
const LOGIN_CANDIDATES = [
  process.env.MC_SCREENSHOT_EMAIL || 'premium@manualmode.at',
  'developer@manualmode.at',
];

const LOCALES = {
  de: {
    code: 'de',
    playwrightLocale: 'de-DE',
    out: 'coaching-chat-de.png',
    login: 'Anmelden',
    loginError: /Ungültige Anmeldedaten|Invalid credentials/i,
    splashLoading: 'Deine Sitzung wird geladen',
    welcomeHints: ['Willkommen', 'Anmelden'],
    intentCoaching: /Gedanken strukturieren/i,
    skip: 'Überspringen',
    later: /Später/i,
    namePlaceholder: /Vorname|Synonym|Pseudonym/i,
    continue: 'Weiter',
    ocean: /Lerne dich selbst|Persönlichkeitstest/i,
    profileHint: /Spiral Dynamics|Riemann|Profil vervollständigen/i,
    landingHints: ['Mit Lebenskontext fortfahren', 'Neues Gespräch starten'],
    coachingSection: 'Coaching',
    chatMessage:
      'Ich habe ein Angebot für eine neue Rolle als Projektmanagerin, bin mir aber unsicher, ob das der richtige Weg für mich ist.',
    send: /Nachricht senden|Senden/i,
  },
  en: {
    code: 'en',
    playwrightLocale: 'en-CA',
    out: 'coaching-chat-en.png',
    login: 'Login',
    loginError: /Invalid email or password|Invalid credentials/i,
    splashLoading: 'Loading your experience',
    welcomeHints: ['Welcome', 'Login'],
    intentCoaching: /Structure thoughts/i,
    skip: 'Skip',
    later: /Later/i,
    namePlaceholder: /First name|Synonym|Pseudonym/i,
    continue: 'Continue',
    ocean: /Lerne dich selbst|Get to know yourself|personality/i,
    profileHint: /Spiral Dynamics|Riemann|complete your profile/i,
    landingHints: ['Continue with your Life Context', 'Start a new conversation'],
    coachingSection: 'Coaching',
    chatMessage:
      'I have an offer for a new role as a project manager, but I am not sure if this is the right path for me.',
    send: /Send message|Send/i,
  },
};

async function waitStable(page, ms = 800) {
  await page.waitForTimeout(ms);
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
}

async function clickText(page, text, { exact = false, timeout = 20000 } = {}) {
  const locator = page.getByRole('button', { name: text, exact });
  if (await locator.count()) {
    await locator.first().click({ timeout });
    return;
  }
  await page.getByText(text, { exact }).first().click({ timeout });
}

async function waitPastSplash(page, loc) {
  await page
    .waitForFunction((text) => !document.body?.innerText?.includes(text), loc.splashLoading, {
      timeout: 20000,
    })
    .catch(() => {});
  await page.waitForTimeout(400);
}

async function loginPremium(page, loc) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await waitPastSplash(page, loc);
  await waitStable(page, 600);

  for (const hint of loc.welcomeHints) {
    if (await page.getByText(hint).count()) break;
  }
  await clickText(page, loc.login);
  await page.waitForSelector('#email', { timeout: 15000 });

  for (const email of LOGIN_CANDIDATES) {
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(PASSWORD);
    await clickText(page, loc.login, { exact: true });
    await waitStable(page, 2500);
    const hasError = await page.getByText(loc.loginError).count();
    if (!hasError && !(await page.locator('#email').isVisible().catch(() => false))) {
      console.log(`  → logged in as ${email}`);
      return;
    }
  }
  throw new Error('Premium login failed — set MC_DEV_PASSWORD / MC_SCREENSHOT_EMAIL');
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
  } else if (await page.getByText(loc.skip).count()) {
    await clickText(page, loc.skip).catch(() => {});
    await waitStable(page, 800);
  }
  if (await page.getByText(loc.ocean).count()) {
    await page.getByText(loc.skip).first().click().catch(() => {});
    await waitStable(page, 1200);
  }
  if (await page.getByText(loc.profileHint).count()) {
    await clickText(page, loc.later).catch(() => {});
    await waitStable(page, 800);
  }
  await waitPastSplash(page, loc);
}

async function openAvaChat(page, loc) {
  for (const hint of loc.landingHints) {
    if (await page.getByText(hint).count()) {
      await page.getByText(hint).first().click({ timeout: 10000 }).catch(() => {});
      await waitStable(page, 1000);
      break;
    }
  }
  const coaching = page.getByText(loc.coachingSection, { exact: true }).first();
  if (await coaching.count()) {
    await coaching.scrollIntoViewIfNeeded().catch(() => {});
  }
  const avaCard = page.locator('button, [role="button"]').filter({ hasText: /^Ava$/ }).first();
  if (await avaCard.count()) {
    await avaCard.click({ timeout: 15000 });
  } else {
    await page.getByText('Ava', { exact: true }).first().click({ timeout: 15000 });
  }
  await waitStable(page, 2000);

  const input = page.locator('textarea').first();
  await input.waitFor({ timeout: 15000 });
  await input.fill(loc.chatMessage);
  const sendBtn = page.getByRole('button', { name: loc.send }).first();
  if (await sendBtn.count()) {
    await sendBtn.click().catch(() => page.keyboard.press('Enter'));
  } else {
    await page.keyboard.press('Enter');
  }
  await page
    .waitForFunction(
      () => document.querySelectorAll('[class*="message"], [data-role="message"], .prose').length >= 2,
      { timeout: 90000 },
    )
    .catch(() => waitStable(page, 8000));
  await waitStable(page, 1500);
}

async function captureLocale(loc) {
  const { chromium, devices } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const iphone = devices['iPhone 14 Pro Max'];
  const context = await browser.newContext({
    ...iphone,
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

  await loginPremium(page, loc);
  await dismissOnboarding(page, loc);
  await openAvaChat(page, loc);

  const outPath = path.join(OUT, loc.out);
  await page.screenshot({ path: outPath, fullPage: false, animations: 'disabled', scale: 'device' });
  console.log(`✓ ${outPath}`);
  await browser.close();
}

async function main() {
  const langs = LANG_ARG === 'all' ? ['de', 'en'] : [LANG_ARG];
  fs.mkdirSync(OUT, { recursive: true });
  for (const key of langs) {
    const loc = LOCALES[key];
    if (!loc) {
      console.error(`Unknown --lang ${key}`);
      process.exit(1);
    }
    await captureLocale(loc);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
