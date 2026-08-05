import { Language } from '../types';

/** Machine-readable Art. 50(2) marker line — keep stable for detection tooling. */
export const AI_CONTENT_MARKER_PREFIX = 'AI-Content-Marker: v1; generated=true; system=meaningful-conversations';

export type AiExportContentType = 'session-summary' | 'practice-evaluation' | 'personality-report';

export function buildAiContentMarkerLine(contentType: AiExportContentType): string {
  return `${AI_CONTENT_MARKER_PREFIX}; type=${contentType}`;
}

export function buildAiContentHumanLabel(language: Language): string {
  return language === 'de'
    ? '[KI-generiert — Meaningful Conversations]'
    : '[AI-generated — Meaningful Conversations]';
}

/** Prepends machine-readable + human-readable AI provenance lines to exported text. */
export function wrapAiGeneratedTextExport(
  content: string,
  language: Language,
  contentType: AiExportContentType,
): string {
  const marker = buildAiContentMarkerLine(contentType);
  const label = buildAiContentHumanLabel(language);
  return `${marker}\n${label}\n\n${content.trim()}`;
}
