# PDF Export Implementation

**Status:** Current (v2.5.5)  
**Last updated:** 2026-08-05

## Stack (current)

PDF export uses **`@react-pdf/renderer`** — not html2pdf.js.

| Use case | File |
|----------|------|
| Personality survey PDF | [`utils/pdfGeneratorReact.tsx`](../utils/pdfGeneratorReact.tsx) |
| Survey HTML preview (legacy helper) | `utils/surveyResultHtmlFormatter.ts` |

## Agent workflow

See [`.cursor/skills/meaningful-conversations/pdf-export/SKILL.md`](../.cursor/skills/meaningful-conversations/pdf-export/SKILL.md).

## Historical note

Earlier versions (pre-2025-12) used `html2pdf.js` via `utils/pdfGenerator.ts`. That path is superseded; do not add new features there.

## Features

- Professional PDF from personality survey results (Riemann-Thomann, Big Five, Spiral Dynamics)
- Bilingual labels (DE + EN) via localization context
- Automatic encrypted profile save after download (registered users)

## Dependencies

- `@react-pdf/renderer` (root `package.json`)

## Testing

After PDF layout changes, manually export from Personality Profile flow in DE and EN.
