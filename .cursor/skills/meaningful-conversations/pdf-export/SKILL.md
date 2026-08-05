---
name: mc-pdf-export
description: Guides personality and transcript PDF export via @react-pdf/renderer. Use when adding or fixing PDF layouts, survey export, or print styling.
---

# PDF Export Skill

## Implementation

**Stack:** `@react-pdf/renderer` (not html2pdf.js)

| File | Purpose |
|------|---------|
| `utils/pdfGeneratorReact.tsx` | Main PDF document components |
| `utils/surveyResultHtmlFormatter.ts` | HTML preview helper (legacy) |

See [`DOCUMENTATION/PDF-IMPLEMENTATION.md`](../../../DOCUMENTATION/PDF-IMPLEMENTATION.md).

## Workflow

1. Survey completes → user taps export
2. `pdfGeneratorReact.tsx` builds React-PDF document
3. Registered users: profile encrypted and saved after download

## i18n

PDF labels must support DE + EN — use localization keys or inline bilingual blocks matching survey language.

## Testing

Manual: export personality PDF in DE and EN after layout changes. No automated PDF snapshot tests in CI.

## Do not

- Add features to deprecated `utils/pdfGenerator.ts` (html2pdf path)
- Block UI thread with large images — optimize assets in PDF components
