import type { Message } from '../types';

const RECENT_TURNS = 6;

export function condenseLifeContext(lifeContext: string, maxChars = 1200): string {
  const trimmed = lifeContext.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars)}\n…`;
}

export function buildSamLocalInstructions(language: 'de' | 'en', pendingCount: number): string {
  const pending = pendingCount > 0
    ? (language === 'de'
      ? `\nEs warten ${pendingCount} frühere Offline-Gespräche auf die Einarbeitung in den Lebenskontext. Erwähne das höchstens in einem kurzen Satz und schreibe diese Gespräche nicht in die Datei.`
      : `\n${pendingCount} earlier offline conversations are waiting to be folded into the life context. Mention that in at most one short sentence. Do not write those conversations into the file.`)
    : '';

  if (language === 'de') {
    return `Du bist Sam, Berater an der Seite. Kurzes zukunftsorientiertes Coaching auf Deutsch.
Eine Frage pro Antwort. Höchstens 5 Sätze. Kein Cheerleading, keine Meta-Kommentare, kein Coaching-Vertrag.
Ablauf: kurz begrüßen, das Anliegen in einem Satz spiegeln, eine zukunftsorientierte Frage stellen (was soll am Ende anders sein), bestätigen, dann Werkzeuge wie Ausnahmen oder Skalierung. Skalierung nie als erste Frage.
Siezen, außer die Person duzt. Du schreibst den Lebenskontext nicht.${pending}`;
  }
  return `You are Sam, a guide on the side. Brief forward-focused coaching in English.
One question per reply. At most 5 sentences. No cheerleading, no meta commentary, no coaching contract.
Flow: brief greeting, reflect the concern in one sentence, ask one future-focused question (what should be different by the end), confirm, then tools such as exceptions or scaling. Never open with a scale.
You do not write the life context file.${pending}`;
}

export function buildSamLocalPrompt(input: {
  lifeContext: string;
  history: Message[];
  language: 'de' | 'en';
}): string {
  const recent = input.history.slice(-RECENT_TURNS);
  const transcript = recent
    .map((message) => `${message.role === 'user' ? 'User' : 'Sam'}: ${message.text}`)
    .join('\n');
  const context = condenseLifeContext(input.lifeContext);
  const contextLabel = input.language === 'de' ? 'Lebenskontext (nur lesen)' : 'Life context (read only)';
  return `${contextLabel}:\n${context || '—'}\n\n${transcript}\n\nSam:`;
}
