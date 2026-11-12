# PDF Export Implementation

**Status:** Current (2.6.0)
**Last updated:** 2026-10-30

## Stack (current)

PDF export uses **`@react-pdf/renderer`** — not html2pdf.js.

| Use case | File |
|----------|------|
| Personality survey PDF | [`utils/pdfGeneratorReact.tsx`](../utils/pdfGeneratorReact.tsx) |
| Connector optimal conversations (docs) | [`utils/connectorOptimalConversationsPDF.tsx`](../utils/connectorOptimalConversationsPDF.tsx) |
| Survey HTML preview (legacy helper) | `utils/surveyResultHtmlFormatter.ts` |

## Agent workflow

See [`.cursor/skills/meaningful-conversations/pdf-export/SKILL.md`](../.cursor/skills/meaningful-conversations/pdf-export/SKILL.md).

## Historical note

Earlier versions (pre-2025-12) used `html2pdf.js` via `utils/pdfGenerator.ts`. That path is superseded; do not add new features there.

## Features

- Professional PDF from personality survey results (Riemann-Thomann, Big Five, Spiral Dynamics, Signature, Connector)
- Bilingual labels (DE + EN) in `pdfGeneratorReact.tsx` translation tables
- Automatic encrypted profile save after download (registered users)

## Layout (personality PDF)

- One continuous `<Page>`; hero band uses negative top margin for full-bleed header on sheet 1.
- Pagination: `SectionBlock` with `wrap={false}` on cards and insight groups.
- Signature and Connector insight lists share `PdfInsightGroup` styling; Connector Markdown rendered via inline helper.

## Dependencies

- `@react-pdf/renderer` (root `package.json`)

## Testing

1. **Local:** `npm run qa:personality-pdf` → `tmp/personality-pdf-qa/sample-{de,en}.pdf` (synthetic fixture in `scripts/personalityPdfSampleFixture.ts`).
2. **Staging:** export from profile after deploy; check page breaks and Connector formatting.
