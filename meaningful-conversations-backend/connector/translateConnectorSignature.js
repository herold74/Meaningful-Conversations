const { CONNECTOR_DIMENSIONS } = require('./evaluationPrompts');

const evidenceOnlySchema = {
  type: 'OBJECT',
  properties: {
    evidence: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['evidence'],
};

const translateConnectorSignatureSchema = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING' },
    strengths: { type: 'ARRAY', items: { type: 'STRING' } },
    growthAreas: { type: 'ARRAY', items: { type: 'STRING' } },
    empathy: evidenceOnlySchema,
    presence: evidenceOnlySchema,
    curiosity: evidenceOnlySchema,
    nonJudgment: evidenceOnlySchema,
    steadiness: evidenceOnlySchema,
    perVignette: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          vignetteId: { type: 'STRING' },
          highlight: { type: 'STRING' },
          missedCue: { type: 'STRING' },
        },
        required: ['vignetteId', 'highlight', 'missedCue'],
      },
    },
  },
  required: [
    'summary',
    'strengths',
    'growthAreas',
    'empathy',
    'presence',
    'curiosity',
    'nonJudgment',
    'steadiness',
    'perVignette',
  ],
};

function pickTranslatableTexts(connector) {
  if (!connector || typeof connector !== 'object') {
    throw new Error('Invalid connector payload.');
  }
  const perVignette = (connector.perVignette || []).map((row) => ({
    vignetteId: String(row.vignetteId || ''),
    highlight: String(row.highlight || ''),
    missedCue: String(row.missedCue || ''),
  }));
  const dimensions = {};
  for (const dim of CONNECTOR_DIMENSIONS) {
    dimensions[dim] = {
      evidence: Array.isArray(connector[dim]?.evidence)
        ? connector[dim].evidence.map((e) => String(e))
        : [],
    };
  }
  return {
    summary: String(connector.summary || ''),
    strengths: Array.isArray(connector.strengths) ? connector.strengths.map((s) => String(s)) : [],
    growthAreas: Array.isArray(connector.growthAreas) ? connector.growthAreas.map((s) => String(s)) : [],
    ...dimensions,
    perVignette,
  };
}

function buildTranslatePrompt(payload, sourceLang, targetLang) {
  const langNames = { de: 'German', en: 'English' };
  const from = langNames[sourceLang] || 'German';
  const to = langNames[targetLang] || 'English';
  const duRule = targetLang === 'de'
    ? 'Use informal "du" in German.'
    : 'Use informal "you" in English.';
  return `You translate coaching observation text for a "connection signature" profile (The Connector).
Translate every string value from ${from} to ${to}. ${duRule}
Keep the same JSON structure and array lengths. Do not change vignetteId values.
Return ONLY valid JSON matching the schema — no markdown.

Input JSON:
${JSON.stringify(payload, null, 2)}`;
}

module.exports = {
  translateConnectorSignatureSchema,
  pickTranslatableTexts,
  buildTranslatePrompt,
  CONNECTOR_DIMENSIONS,
};
