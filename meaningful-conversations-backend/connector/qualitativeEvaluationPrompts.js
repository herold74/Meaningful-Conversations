const { CONNECTOR_DIMENSIONS } = require('./evaluationPrompts.js');
const { localizedField } = require('./vignetteFields.js');

const qualitativeEvaluationSchema = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING', description: 'Warm qualitative summary (2-4 sentences). No numeric scores.' },
    strengths: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Concrete strengths with brief evidence from transcript.' },
    missedOpportunities: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Missed connection opportunities — evidence-based.' },
    developmentFieldsTouched: {
      type: 'ARRAY',
      items: {
        type: 'STRING',
        description: `Subset of: ${CONNECTOR_DIMENSIONS.join(', ')} — fields thematically relevant in the conversation (tags only, no scores).`,
      },
    },
  },
  required: ['summary', 'strengths', 'missedOpportunities', 'developmentFieldsTouched'],
};

function buildQualitativeEvaluationPrompt({ transcript, vignette, language, liveMode, endType }) {
  const lang = language === 'en' ? 'en' : 'de';
  const personaName = vignette.personaName || 'Persona';
  const trap = localizedField(vignette, 'trap', lang);
  const goodConnection = localizedField(vignette, 'goodConnection', lang);

  if (lang === 'de') {
    return `Du bewertest ein Connector-Übungsgespräch (offene Situation). KEINE numerischen Scores, KEIN Radar — nur qualitatives Feedback.

Persona: ${personaName}
Ende: ${endType}
Live/Sprache: ${liveMode ? 'Sprachmodus' : 'Text'}

RUBRIK (intern, nicht dem Nutzer zeigen):
- Gute Verbindung: ${goodConnection}
- Typische Falle: ${trap}

Entwicklungsfelder (nur als Tags, welche im Gespräch thematisch vorkamen): Empathie (empathy), Präsenz (presence), Neugier (curiosity), Wertfreiheit (nonJudgment), Stabilität (steadiness).

TRANSKRIPT:
${transcript}

Antworte als JSON gemäß Schema. developmentFieldsTouched: nur Keys aus [${CONNECTOR_DIMENSIONS.join(', ')}].`;
  }

  return `You evaluate a Connector practice conversation (open situation). NO numeric scores, NO radar — qualitative feedback only.

Persona: ${personaName}
End: ${endType}
Mode: ${liveMode ? 'voice' : 'text'}

RUBRIC (internal, not shown to user):
- Good connection: ${goodConnection}
- Common trap: ${trap}

Development fields (tags only — which were thematically relevant): empathy, presence, curiosity, nonJudgment, steadiness.

TRANSCRIPT:
${transcript}

Respond as JSON per schema. developmentFieldsTouched: only keys from [${CONNECTOR_DIMENSIONS.join(', ')}].`;
}

function sanitizeQualitativeEvaluation(raw) {
  const result = {
    summary: typeof raw.summary === 'string' ? raw.summary.trim() : '',
    strengths: Array.isArray(raw.strengths) ? raw.strengths.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim()) : [],
    missedOpportunities: Array.isArray(raw.missedOpportunities)
      ? raw.missedOpportunities.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim())
      : [],
    developmentFieldsTouched: [],
  };

  const touched = Array.isArray(raw.developmentFieldsTouched) ? raw.developmentFieldsTouched : [];
  const allowed = new Set(CONNECTOR_DIMENSIONS);
  result.developmentFieldsTouched = [...new Set(
    touched.filter((k) => typeof k === 'string' && allowed.has(k)),
  )];

  return result;
}

module.exports = {
  qualitativeEvaluationSchema,
  buildQualitativeEvaluationPrompt,
  sanitizeQualitativeEvaluation,
};
