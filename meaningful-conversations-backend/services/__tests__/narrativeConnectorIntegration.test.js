const {
  validateConnectorPayload,
  summarizeConnectorForPrompt,
  formatConnectorPerspectiveBlock,
  validateNarrativeConnectorConsistency,
} = require('../narrativeConnectorIntegration');

const sampleConnector = {
  overallScore: 7,
  summary: 'Warm and curious in conversation.',
  strengths: ['Open questions'],
  growthAreas: ['Stay with emotion longer'],
  empathy: { score: 3, evidence: ['Rushed to solutions'] },
  presence: { score: 8, evidence: ['Held space'] },
  curiosity: { score: 7, evidence: [] },
  nonJudgment: { score: 8, evidence: [] },
  steadiness: { score: 7, evidence: [] },
  completedAt: '2026-09-01T12:00:00.000Z',
};

const sampleNarrative = {
  operatingSystem: 'Du balancierst Nähe und Distanz mit feiner Wahrnehmung.',
  superpowers: [{ name: 'Brückenbauer', description: 'Du verbindest Welten.' }],
  blindspots: [{ name: 'Tempo', description: 'Manchmal zu schnell zur Lösung.' }],
  growthOpportunities: [{ title: 'Pause', recommendation: 'Einen Atemzug länger bleiben.' }],
};

describe('narrativeConnectorIntegration', () => {
  test('validateConnectorPayload accepts summary or scores', () => {
    expect(validateConnectorPayload(sampleConnector)).toBe(true);
    expect(validateConnectorPayload({ summary: 'ok' })).toBe(true);
    expect(validateConnectorPayload({ empathy: { score: 11 } })).toBe(false);
    expect(validateConnectorPayload(null)).toBe(false);
  });

  test('summarizeConnectorForPrompt trims evidence and lists', () => {
    const summary = summarizeConnectorForPrompt(sampleConnector);
    expect(summary.empathy.evidence).toHaveLength(1);
    expect(summary.strengths).toHaveLength(1);
    expect(summary.growthAreas).toHaveLength(1);
  });

  test('formatConnectorPerspectiveBlock without connector', () => {
    expect(formatConnectorPerspectiveBlock('de', null)).toMatch(/Nicht vorhanden/i);
    expect(formatConnectorPerspectiveBlock('en', null)).toMatch(/Not available/i);
  });

  test('flags invented connector when none provided', () => {
    const narrative = {
      ...sampleNarrative,
      operatingSystem: 'Deine Fremdsicht aus The Connector zeigt eine andere Seite.',
    };
    const result = validateNarrativeConnectorConsistency(narrative, null, 'de');
    expect(result.isConsistent).toBe(false);
    expect(result.issues.some((i) => i.type === 'invented_connector')).toBe(true);
  });

  test('flags vignette persona names', () => {
    const narrative = {
      ...sampleNarrative,
      operatingSystem: 'Wie bei Jonas im Gespräch zeigst du Präsenz.',
    };
    const result = validateNarrativeConnectorConsistency(narrative, sampleConnector, 'de');
    expect(result.issues.some((i) => i.type === 'vignette_persona_name')).toBe(true);
  });

  test('flags empathy score direction mismatch', () => {
    const narrative = {
      ...sampleNarrative,
      superpowers: [{ name: 'Empath', description: 'Du bist ein natürlicher Empath.' }],
    };
    const result = validateNarrativeConnectorConsistency(narrative, sampleConnector, 'de');
    expect(result.issues.some((i) => i.type === 'score_direction_mismatch')).toBe(true);
  });

  test('passes when connector woven without persona names', () => {
    const narrative = {
      ...sampleNarrative,
      blindspots: [{
        name: 'Tempo',
        description: 'In Gesprächen wirkt deine Präsenz stark, manchmal wechselst du aber schnell zur Lösung.',
      }],
    };
    const result = validateNarrativeConnectorConsistency(narrative, sampleConnector, 'de');
    expect(result.isConsistent).toBe(true);
  });
});
