/**
 * Generate DOCUMENTATION/FALKENBERG-BUSINESS-CASE.pdf for print.
 *
 * Usage: npm run generate:falkenberg-business-case-pdf
 *    or: npx tsx scripts/generate-falkenberg-business-case-pdf.ts
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToFile } from '@react-pdf/renderer';
import { FalkenbergBusinessCasePDFDocument } from '../utils/falkenbergBusinessCasePDF.tsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(__dirname, '../DOCUMENTATION/FALKENBERG-BUSINESS-CASE.pdf');

async function main() {
  await renderToFile(React.createElement(FalkenbergBusinessCasePDFDocument), outPath);
  console.log(`✓ PDF written: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
