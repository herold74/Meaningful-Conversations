const { getMatchTier, getDiscouragedReason } = require('./methodScenarioMap.js');

const NEUTRAL_FIT_NOTES = {
  en: 'This method-scenario combination is acceptable but not a primary recommendation.',
  de: 'Diese Methoden-Szenario-Kombination ist akzeptabel, aber keine Primary-Empfehlung.',
};

function computePracticeOverallScore(ev) {
  const m = ev.methodCompliance?.score ?? 0;
  const coherent = ev.sessionFlow?.coherent === true;
  if (m >= 9) return coherent ? Math.min(10, m) : Math.min(9, m);
  const others = [ev.effectiveness, ev.clarity, ev.coacheeAutonomy, ev.coacheeSatisfaction]
    .map((d) => d?.score)
    .filter((s) => typeof s === 'number');
  const avgOthers = others.length ? others.reduce((a, b) => a + b, 0) / others.length : m;
  return Math.max(1, Math.min(9, Math.round(m * 0.6 + avgOthers * 0.4)));
}

function buildScenarioMethodFit(scenarioId, frameworkId, language) {
  const tier = getMatchTier(scenarioId, frameworkId);
  if (tier !== 'neutral' && tier !== 'discouraged') return null;
  const lang = language === 'en' ? 'en' : 'de';
  const note = tier === 'discouraged'
    ? getDiscouragedReason(scenarioId, frameworkId, lang)
    : NEUTRAL_FIT_NOTES[lang];
  return { tier, note };
}

module.exports = {
  computePracticeOverallScore,
  buildScenarioMethodFit,
  NEUTRAL_FIT_NOTES,
};
