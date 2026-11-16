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

After PDF layout changes:

1. **Local QA:** `npm run qa:personality-pdf` — writes synthetic DE/EN samples to `tmp/personality-pdf-qa/` (requires Vite via `vite-node`; no real profile text).
2. **Manual:** export from Personality Profile on staging in DE and EN.

## Layout rules (personality PDF)

- **Single `<Page>` flow** — do not split content across multiple hard-coded `<Page>` elements; overflow pagination only. A second page caused near-empty sheets when page 1 auto-broke mid-document.
- **`SectionBlock` (`wrap={false}`)** — keep insight groups and cards intact; avoid splitting a group across pages when possible.
- **Signature + Connector parity** — narrative quote in a white card; superpowers / blindspots / growth and Connector strengths / growth as standalone `PdfInsightGroup` blocks (left stripe, tinted background). Connector header card: score, summary, dimension bars, disclaimer only.
- **Connector copy** — use `renderPdfInline()` for `**bold**` and `*italic*` (Helvetica / WinAnsi); do not show raw Markdown.
- **Glyphs** — avoid Unicode not in WinAnsi (e.g. use ` – ` instead of `↔` in axis labels).

## Do not

- Add features to deprecated `utils/pdfGenerator.ts` (html2pdf path)
- Block UI thread with large images — optimize assets in PDF components
