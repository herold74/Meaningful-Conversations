/**
 * Connector ↔ narrative signature synthesis: prompt payload + post-generation validation.
 */

const { CONNECTOR_VIGNETTES } = require('../connector/vignettes.js');

const CONNECTOR_DIMENSIONS = ['empathy', 'presence', 'curiosity', 'nonJudgment', 'steadiness'];

const CONNECTOR_PERSONA_NAMES = [...new Set(CONNECTOR_VIGNETTES.map((v) => v.personaName).filter(Boolean))];

function validateConnectorPayload(connector) {
  if (!connector || typeof connector !== 'object') return false;
  if (connector.summary != null && typeof connector.summary !== 'string') return false;
  for (const dim of CONNECTOR_DIMENSIONS) {
    const score = connector[dim]?.score;
    if (score != null && (typeof score !== 'number' || score < 1 || score > 10)) {
      return false;
    }
  }
  const hasSummary = Boolean(String(connector.summary || '').trim());
  const hasScores = CONNECTOR_DIMENSIONS.some((dim) => connector[dim]?.score != null);
  return hasSummary || hasScores;
}

function summarizeConnectorForPrompt(connector) {
  const pickScore = (dim) => ({
    score: connector[dim]?.score ?? null,
    evidence: (connector[dim]?.evidence || []).slice(0, 1),
  });
  return {
    overallScore: connector.overallScore ?? null,
    summary: connector.summary || '',
    strengths: (connector.strengths || []).slice(0, 3),
    growthAreas: (connector.growthAreas || []).slice(0, 2),
    empathy: pickScore('empathy'),
    presence: pickScore('presence'),
    curiosity: pickScore('curiosity'),
    nonJudgment: pickScore('nonJudgment'),
    steadiness: pickScore('steadiness'),
    completedAt: connector.completedAt || null,
  };
}

function formatConnectorPerspectiveBlock(language, connector) {
  const lang = language === 'en' ? 'en' : 'de';
  if (!connector || !validateConnectorPayload(connector)) {
    return lang === 'de'
      ? 'Nicht vorhanden — ignoriere diesen Block vollständig. Erfinde keine Fremdsicht.'
      : 'Not available — ignore this block entirely. Do not invent an external view.';
  }
  return JSON.stringify(summarizeConnectorForPrompt(connector), null, 2);
}

function collectNarrativeText(narrativeProfile) {
  if (!narrativeProfile) return '';
  const parts = [
    narrativeProfile.operatingSystem || '',
    ...(narrativeProfile.superpowers || []).map((s) => `${s.name || ''} ${s.description || ''}`),
    ...(narrativeProfile.blindspots || []).map((b) => `${b.name || ''} ${b.description || ''}`),
    ...(narrativeProfile.growthOpportunities || []).map((g) => `${g.title || ''} ${g.recommendation || ''}`),
  ];
  return parts.join(' ');
}

/** Post-generation checks when Connector was (or was not) part of synthesis input. */
function validateNarrativeConnectorConsistency(narrativeProfile, connector, language = 'de') {
  const issues = [];
  const text = collectNarrativeText(narrativeProfile);
  const textLower = text.toLowerCase();
  const hasConnector = validateConnectorPayload(connector);

  const connectorMarkers = [
    'the connector',
    'verbindungs-signatur',
    'verbindungssignatur',
    'fremdsicht',
    'external view',
    'beobachtet',
    'observed in conversation',
    'drei kurzen gesprächen',
    'three short conversations',
  ];

  if (!hasConnector) {
    const mentionsConnector = connectorMarkers.some((m) => textLower.includes(m));
    if (mentionsConnector) {
      issues.push({
        type: 'invented_connector',
        severity: 'high',
        message: 'Narrative references Connector/external view but no Connector data was provided.',
      });
    }
    return { isConsistent: issues.length === 0, issues };
  }

  for (const name of CONNECTOR_PERSONA_NAMES) {
    const pattern = new RegExp(`\\b${name}\\b`, 'i');
    if (pattern.test(text)) {
      issues.push({
        type: 'vignette_persona_name',
        severity: 'high',
        message: `Narrative contains vignette persona name "${name}".`,
      });
    }
  }

  const empathyScore = connector.empathy?.score;
  if (typeof empathyScore === 'number' && empathyScore <= 4) {
    const highEmpathyPhrases = language === 'en'
      ? ['natural empath', 'highly empath', 'deeply empath', 'born empath', 'empathy is your gift']
      : ['natürlicher empath', 'hohe empathie', 'tiefe empathie', 'empathie ist dein geschenk', 'empathisch geboren'];
    if (highEmpathyPhrases.some((p) => textLower.includes(p))) {
      issues.push({
        type: 'score_direction_mismatch',
        severity: 'medium',
        message: 'Low Connector empathy score but narrative claims very high empathy without tension framing.',
      });
    }
  }

  const presenceScore = connector.presence?.score;
  if (typeof presenceScore === 'number' && presenceScore <= 4) {
    const highPresencePhrases = language === 'en'
      ? ['fully present', 'natural presence', 'grounding presence']
      : ['volle präsenz', 'natürliche präsenz', 'präsenz ist deine stärke'];
    if (highPresencePhrases.some((p) => textLower.includes(p))) {
      issues.push({
        type: 'score_direction_mismatch',
        severity: 'medium',
        message: 'Low Connector presence score but narrative claims strong presence without tension framing.',
      });
    }
  }

  const osWords = (narrativeProfile.operatingSystem || '').split(/\s+/).filter(Boolean).length;
  if (osWords > 110) {
    issues.push({
      type: 'operating_system_length',
      severity: 'low',
      message: `operatingSystem exceeds ~100 words (${osWords} words).`,
    });
  }

  return {
    isConsistent: !issues.some((i) => i.severity === 'high'),
    issues,
  };
}

module.exports = {
  CONNECTOR_PERSONA_NAMES,
  validateConnectorPayload,
  summarizeConnectorForPrompt,
  formatConnectorPerspectiveBlock,
  validateNarrativeConnectorConsistency,
  collectNarrativeText,
};
