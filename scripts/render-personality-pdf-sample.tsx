/**
 * Render synthetic personality PDFs for layout QA (DE + EN).
 *
 * Usage: npm run qa:personality-pdf
 */

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToFile } from '@react-pdf/renderer';
import { PersonalityPdfDocument } from '../utils/pdfGeneratorReact.tsx';
import { buildPersonalityPdfSampleResult } from './personalityPdfSampleFixture.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../tmp/personality-pdf-qa');

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  for (const language of ['de', 'en'] as const) {
    const outPath = path.join(outDir, `sample-${language}.pdf`);
    await renderToFile(
      React.createElement(PersonalityPdfDocument, {
        result: buildPersonalityPdfSampleResult(language),
        language,
        userEmail: 'qa@example.com',
      }),
      outPath,
    );
    console.log(`✓ ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
