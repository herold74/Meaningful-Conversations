const MAX_HIGHLIGHT = 80;
const MAX_MISSED = 80;
const { getNoConcreteConversationPhaseBlock } = require('./connectorPrepExamples.js');

const FOCUS_EN = {
  empathy: 'recognizing feelings before solutions',
  presence: 'staying with the person',
  curiosity: 'genuine questions before advice',
  nonJudgment: 'listening without judging or instant reassurance',
  steadiness: 'calm when tension rises',
};

const FOCUS_DE = {
  empathy: 'Gefühle wahrnehmen vor Lösungen',
  presence: 'bei der Person bleiben',
  curiosity: 'echte Fragen vor Ratschlägen',
  nonJudgment: 'zuhören ohne zu bewerten oder reflexhaft zu beruhigen',
  steadiness: 'ruhig bleiben bei Spannung',
};

function truncate(text, max) {
  const t = (text || '').trim();
  if (!t) return '';
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function countAssistantTurns(history) {
  return (history || []).filter((m) => m.role === 'bot' || m.role === 'model').length;
}

/** First model call of session (incl. pre-seeded user-only history). */
function isFirstConnectorHandoffTurn(history) {
  return countAssistantTurns(history) === 0;
}

function buildConnectorHandoffContext(payload, lang) {
  if (!payload || !payload.vignetteId) return '';

  const focusKey = payload.focusDimension || 'curiosity';
  const focus =
    lang === 'de' ? FOCUS_DE[focusKey] || FOCUS_DE.curiosity : FOCUS_EN[focusKey] || FOCUS_EN.curiosity;
  const highlight = truncate(payload.highlight, MAX_HIGHLIGHT);
  const missed = truncate(payload.missedCue, MAX_MISSED);
  const feedback = highlight || '—';
  const missedPart = missed ? (lang === 'de' ? `; Entwicklung: ${missed}` : `; growth edge: ${missed}`) : '';
  const phase2 = getNoConcreteConversationPhaseBlock(lang, focusKey, { questionsOnly: true });

  if (lang === 'de') {
    return `

## Connector-Hintergrund (nur für Sie — nicht vorlesen)
Practice-Rückmeldung (Verhalten, nicht Rollenspiel): ${feedback}${missedPart}. Prep-Fokus: ${focus}.
**Phase 1:** Kurz bestätigen (z. B. „Alles klar. Konzentrieren wir uns auf dein echtes Gespräch."), dann **eine** Frage — mit wem es geht und was auf dem Spiel steht. Keine Übungspersonas nennen, es sei denn, der Nutzer bringt sie ein.
${phase2}`;
  }

  return `

## Connector background (interviewer-only — do not read aloud)
Practice feedback (behavior, not role-play): ${feedback}${missedPart}. Prep focus: ${focus}.
**Phase 1:** Brief acknowledgment (e.g. “Got it. Let's focus on the real conversation.”), then **one** question — who it is with and what's at stake. Do not name practice personas unless the user does.
${phase2}`;
}

function getConnectorHandoffContinuationReminder(lang, mode) {
  if (mode === 'gloria') {
    return lang === 'de'
      ? '\n\n## Connector-Vorbereitung (Fortsetzung)\nWeiter nur Fragen, keine Ratschläge. Bezug aus dem Thread — keine Übungspersonas.'
      : '\n\n## Connector prep (continuation)\nQuestions only, no advice. Use the thread — do not re-introduce practice personas.';
  }
  return lang === 'de'
    ? '\n\n## Connector-Coaching-Vorbereitung (Fortsetzung)\nKurz halten; Bezug aus dem Thread — kein volles Coaching/GPS.'
    : '\n\n## Connector coaching prep (continuation)\nStay brief; use the thread — not full coaching/GPS.';
}

module.exports = {
  buildConnectorHandoffContext,
  countAssistantTurns,
  getConnectorHandoffContinuationReminder,
  isFirstConnectorHandoffTurn,
};
