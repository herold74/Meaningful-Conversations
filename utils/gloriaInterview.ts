import type { Language } from '../types';

export type GloriaInterviewMode = 'standard' | 'connectionPrep';

/** Phrases that activate Gloria's connection-prep interview flow (prompt + transcript). */
export const GLORIA_CONNECTION_PREP_MARKERS = [
  'gesprächsvorbereitung',
  'bewusst verbindung',
  'prepare for a conversation',
  'consciously build connection',
  'connection prep',
] as const;

export function isGloriaConnectionPrepMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return GLORIA_CONNECTION_PREP_MARKERS.some((marker) => lower.includes(marker));
}

export function detectGloriaConnectionPrepFromHistory(
  messages: Array<{ role: string; text: string }>,
): boolean {
  return messages
    .filter((m) => m.role === 'user')
    .some((m) => isGloriaConnectionPrepMessage(m.text));
}

export function buildGloriaConnectionPrepStarter(
  language: Language,
  focusTopic?: string,
): string {
  const topic = focusTopic?.trim() || '';
  if (language === 'de') {
    const focus = topic
      ? `Konkret geht es um: „${topic}". `
      : '';
    return `Ich möchte ein Gespräch vorbereiten und dabei bewusst Verbindung herstellen. ${focus}Bitte führe mich mit Fragen durch die Vorbereitung.`;
  }
  const focus = topic
    ? `Specifically, this is about: "${topic}". `
    : '';
  return `I'd like to prepare for a conversation and consciously build connection. ${focus}Please guide me through the preparation with your questions.`;
}
