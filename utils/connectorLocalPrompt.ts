import type { Message } from '../types';
import { connectorField, CONNECTOR_MAX_USER_TURNS, getBundledVignette } from './connectorLocalBundle';

export const CONNECTOR_END_MARKER = '[CONNECTOR_END]';

export function buildConnectorLocalInstructions(input: {
  vignetteId: string;
  language: 'de' | 'en';
  userTurnCount: number;
  liveMode: boolean;
}): string | null {
  const vignette = getBundledVignette(input.vignetteId);
  if (!vignette) return null;
  const lang = input.language;
  const name = vignette.personaName;
  const relationship = connectorField(vignette.relationship, lang);
  const situation = connectorField(vignette.situation, lang);
  const tone = connectorField(vignette.emotionalTone, lang);
  const need = connectorField(vignette.innerNeed, lang);
  const exitLine = connectorField(vignette.exitLine, lang);
  const forceClose = input.userTurnCount >= CONNECTOR_MAX_USER_TURNS;
  const close = forceClose
    ? (lang === 'de'
      ? `Beende jetzt das Gespräch mit einem Alltagsgrund, sinngemäß: „${exitLine}". Hänge ganz am Ende exakt ${CONNECTOR_END_MARKER} an.`
      : `End the conversation now with an everyday excuse, along the lines of: "${exitLine}". Append exactly ${CONNECTOR_END_MARKER} at the very end.`)
    : '';
  const live = input.liveMode
    ? (lang === 'de' ? 'Sprich wie im Gespräch, in kurzen vollständigen Sätzen.' : 'Sound spoken, in short complete sentences.')
    : '';

  if (lang === 'de') {
    return `Du bist ${name}, ${relationship} der anderen Person. Du bist ein Mensch mit einem Anliegen, kein Coach und kein Assistent.
Situation: ${situation}
Stimmung: ${tone}
Inneres Bedürfnis, nicht aussprechen: ${need}
${live}
1 bis 4 Sätze. Keine Bühnenanweisungen, kein Ratschlag, kein Spiegeln.
${close}`.trim();
  }
  return `You are ${name}, the other person's ${relationship}. You are a person with a concern, not a coach and not an assistant.
Situation: ${situation}
Mood: ${tone}
Inner need, never state it: ${need}
${live}
1 to 4 sentences. No stage directions, no advice, no mirroring.
${close}`.trim();
}

export function buildConnectorLocalPrompt(history: Message[]): string {
  return history
    .slice(-8)
    .map((message) => `${message.role === 'user' ? 'Gegenüber' : 'Ich'}: ${message.text}`)
    .join('\n');
}

export function extractConnectorEnd(raw: string, userTurnCount: number): { text: string; ended: boolean; endType: 'heard' | 'timeout' | null } {
  const ended = raw.includes(CONNECTOR_END_MARKER) || userTurnCount >= CONNECTOR_MAX_USER_TURNS;
  const text = raw.split(CONNECTOR_END_MARKER).join('').trim();
  if (!ended) return { text, ended: false, endType: null };
  return {
    text,
    ended: true,
    endType: userTurnCount >= CONNECTOR_MAX_USER_TURNS ? 'timeout' : 'heard',
  };
}
