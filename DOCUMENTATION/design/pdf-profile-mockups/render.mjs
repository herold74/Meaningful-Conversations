/**
 * Render PDF profile mockup HTML pages to PNG @2x via Playwright + Chrome.
 * Usage: node DOCUMENTATION/design/pdf-profile-mockups/render.mjs
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MOCKUPS = [
  { html: 'mockup-a-cards.html', pages: 2, prefix: 'mockup-a-cards' },
  { html: 'mockup-b-editorial.html', pages: 1, prefix: 'mockup-b-editorial' },
];

// A4 at 96dpi
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;
const SCALE = 2;

async function renderMockup(browser, mockup) {
  const filePath = path.join(__dirname, mockup.html);
  const page = await browser.newPage({
    viewport: { width: A4_WIDTH, height: A4_HEIGHT },
    deviceScaleFactor: SCALE,
  });

  await page.goto(`file://${filePath}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500); // allow fonts to settle

  const pageElements = await page.$$('.page');
  console.log(`  Found ${pageElements.length} page(s) in ${mockup.html}`);

  for (let i = 0; i < pageElements.length; i++) {
    const outPath = path.join(__dirname, `${mockup.prefix}-page${i + 1}.png`);
    await pageElements[i].screenshot({ path: outPath, type: 'png' });
    console.log(`  ✓ ${path.basename(outPath)}`);
  }

  await page.close();
}

async function main() {
  console.log('Rendering PDF profile mockups...\n');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  try {
    for (const mockup of MOCKUPS) {
      console.log(`→ ${mockup.html}`);
      await renderMockup(browser, mockup);
      console.log('');
    }
    console.log('Done.');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Render failed:', err);
  process.exit(1);
});
