const { getVignetteById } = require('../connector/vignettes.js');

const MAX_SCENE = 220;
const MAX_OPENING = 120;
const MAX_PLANNING = 90;
const MAX_HIGHLIGHT = 80;
const MAX_MISSED = 80;

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

function localized(vignette, field, lang) {
  const block = vignette[field];
  if (!block) return '';
  return block[lang] || block.en || block.de || '';
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

  const vignette = getVignetteById(payload.vignetteId);
  if (!vignette) {
    if (lang === 'de') {
      return `

## Connector-Hintergrund (nur für Sie — nicht vorlesen)
Kein Katalog-Szenario. Practice-Feedback: ${highlight || '—'}${missed ? `; Lücke: ${missed}` : ''}. Prep-Fokus: ${focus}.
Fragen Sie einmal nach Kontext zum echten Gespräch; danach Perspektiven des Nutzers und des Gegenübers — nicht „was wissen Sie über …?" bei null Wissen.`;
    }
    return `

## Connector background (interviewer-only — do not read aloud)
No catalog vignette. Practice feedback: ${highlight || '—'}${missed ? `; gap: ${missed}` : ''}. Prep focus: ${focus}.
Ask once for real-conversation context; then user vs. other perspectives — not “what do you know about …?” from zero.`;
  }

  const name = vignette.personaName || 'partner';
  const scene = truncate(localized(vignette, 'scenarioBrief', lang), MAX_SCENE);
  const rel = truncate(localized(vignette, 'relationship', lang), 40);
  const opening = truncate(localized(vignette, 'opening', lang), MAX_OPENING);
  const need = truncate(localized(vignette, 'innerNeed', lang), MAX_PLANNING);

  if (lang === 'de') {
    return `

## Connector-Hintergrund (nur für Sie — nicht vorlesen)
Szenario: ${scene}
Beziehung: ${rel}. ${name} begann mit: „${opening}"
Was sie/er brauchen könnte (Planung, nicht behaupten): ${need}
Practice: + ${highlight || '—'}${missed ? ` / Lücke: ${missed}` : ''}. Prep-Fokus: ${focus}.
Nutzen Sie das für informierte Fragen. Bitten Sie den Nutzer, fürs echte Gespräch zu bestätigen/korrigieren — nicht „Was wissen Sie über ${name}?" von null.`;
  }

  return `

## Connector background (interviewer-only — do not read aloud)
Scene: ${scene}
Relationship: ${rel}. ${name} opened with: "${opening}"
What they may need (planning only): ${need}
Practice: + ${highlight || '—'}${missed ? ` / gap: ${missed}` : ''}. Prep focus: ${focus}.
Use this for informed questions. Ask the user to confirm/correct for their real talk — not “what do you already know about ${name}?” from zero.`;
}

function getConnectorHandoffContinuationReminder(lang, mode) {
  if (mode === 'gloria') {
    return lang === 'de'
      ? '\n\n## Connector-Vorbereitung (Fortsetzung)\nWeiter nur Fragen, keine Ratschläge. Bezug aus dem Thread oben — keine Wiederholung des Szenarios.'
      : '\n\n## Connector prep (continuation)\nQuestions only, no advice. Use the thread above — do not re-introduce the scenario.';
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
