/**
 * Generate DOCUMENTATION/CONNECTOR-OPTIMAL-CONVERSATIONS.pdf for print.
 *
 * Usage: npm run generate:connector-pdf
 *    or: npx tsx scripts/generate-connector-optimal-pdf.ts
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToFile } from '@react-pdf/renderer';
import { ConnectorOptimalConversationsPDFDocument } from '../utils/connectorOptimalConversationsPDF.tsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(__dirname, '../DOCUMENTATION/CONNECTOR-OPTIMAL-CONVERSATIONS.pdf');

async function main() {
  await renderToFile(
    React.createElement(ConnectorOptimalConversationsPDFDocument),
    outPath,
  );
  console.log(`✓ PDF written: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
