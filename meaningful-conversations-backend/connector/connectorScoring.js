const { CONNECTOR_DIMENSIONS } = require('./evaluationPrompts');

function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(1, Math.min(10, Math.round(n)));
}

/**
 * Compute overall Connector score (1-10) as the rounded mean of the five
 * dimension scores. Missing/invalid dimensions are ignored; returns null if
 * no valid dimension exists.
 */
function computeConnectorOverallScore(evaluation) {
  const scores = CONNECTOR_DIMENSIONS
    .map((dim) => clampScore(evaluation?.[dim]?.score))
    .filter((s) => s !== null);
  if (scores.length === 0) return null;
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.max(1, Math.min(10, Math.round(mean)));
}

/** Sanitize per-dimension scores in place (clamp to 1-10 integers). */
function sanitizeConnectorEvaluation(evaluation) {
  CONNECTOR_DIMENSIONS.forEach((dim) => {
    if (evaluation?.[dim]) {
      const clamped = clampScore(evaluation[dim].score);
      evaluation[dim].score = clamped === null ? 1 : clamped;
      if (!Array.isArray(evaluation[dim].evidence)) {
        evaluation[dim].evidence = [];
      }
    }
  });
  return evaluation;
}

module.exports = {
  computeConnectorOverallScore,
  sanitizeConnectorEvaluation,
  clampScore,
};
