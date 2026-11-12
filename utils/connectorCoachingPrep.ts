import type { Language } from '../types';

/** Activates lightweight Connector→coach handoff behavior (Sam / Nobody). */
export const CONNECTOR_COACHING_PREP_MARKERS = [
  'connector coaching prep',
  'kurze connector-coaching-vorbereitung',
] as const;

export function isConnectorCoachingPrepMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return CONNECTOR_COACHING_PREP_MARKERS.some((marker) => lower.includes(marker));
}

export function detectConnectorCoachingPrepFromHistory(
  messages: Array<{ role: string; text: string }>,
): boolean {
  return messages
    .filter((m) => m.role === 'user')
    .some((m) => isConnectorCoachingPrepMessage(m.text));
}
