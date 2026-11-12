const { computeConnectorOverallScore, sanitizeConnectorEvaluation } = require('../connectorScoring');
const { connectorEvaluationPrompts } = require('../evaluationPrompts');

function makeEval(scores) {
  const [empathy, presence, curiosity, nonJudgment, steadiness] = scores;
  return {
    empathy: { score: empathy, evidence: [] },
    presence: { score: presence, evidence: [] },
    curiosity: { score: curiosity, evidence: [] },
    nonJudgment: { score: nonJudgment, evidence: [] },
    steadiness: { score: steadiness, evidence: [] },
  };
}

describe('computeConnectorOverallScore', () => {
  test('rounded mean of five dimensions', () => {
    expect(computeConnectorOverallScore(makeEval([8, 8, 8, 8, 8]))).toBe(8);
    expect(computeConnectorOverallScore(makeEval([10, 9, 8, 7, 6]))).toBe(8);
    expect(computeConnectorOverallScore(makeEval([3, 4, 3, 4, 3]))).toBe(3);
  });

  test('ignores missing dimensions, null when none valid', () => {
    expect(computeConnectorOverallScore({ empathy: { score: 6 } })).toBe(6);
    expect(computeConnectorOverallScore({})).toBeNull();
  });

  test('clamps out-of-range values', () => {
    expect(computeConnectorOverallScore(makeEval([15, 15, 15, 15, 15]))).toBe(10);
    expect(computeConnectorOverallScore(makeEval([0, 0, 0, 0, 0]))).toBe(1);
  });
});

describe('sanitizeConnectorEvaluation', () => {
  test('clamps scores and ensures evidence arrays', () => {
    const evaluation = {
      empathy: { score: 42, evidence: 'not-an-array' },
      presence: { score: 'x', evidence: ['ok'] },
    };
    sanitizeConnectorEvaluation(evaluation);
    expect(evaluation.empathy.score).toBe(10);
    expect(evaluation.empathy.evidence).toEqual([]);
    expect(evaluation.presence.score).toBe(1);
    expect(evaluation.presence.evidence).toEqual(['ok']);
  });
});

describe('connectorEvaluationPrompts', () => {
  const sampleVignettes = [
    { vignetteId: 'jonas-meeting', transcript: 'User: Hey.\n\nJonas: Sorry, ich muss das loswerden.', endType: 'heard' },
    { vignetteId: 'leila-breakup', transcript: 'User: Wie geht es dir?\n\nLeila: Nicht gut.', endType: 'timeout' },
  ];

  test('DE prompt contains dimensions, rubrics, and end-type evidence rule', () => {
    const prompt = connectorEvaluationPrompts.de.prompt({ vignettes: sampleVignettes, currentDate: '2026-09-04', liveMode: false });
    expect(prompt).toContain('Stärkenprofil');
    expect(prompt).toContain('KEIN Coaching-Zertifikat');
    ['empathy', 'presence', 'curiosity', 'nonJudgment', 'steadiness'].forEach((d) => expect(prompt).toContain(d));
    expect(prompt).toContain('Gelungene Verbindung sieht hier so aus');
    expect(prompt).toContain('Typische Falle');
    expect(prompt).toContain('nicht bestrafen');
  });

  test('EN prompt parity', () => {
    const prompt = connectorEvaluationPrompts.en.prompt({ vignettes: sampleVignettes, currentDate: '2026-09-04', liveMode: true });
    expect(prompt).toContain('strengths profile');
    expect(prompt).toContain('NOT a coaching certificate');
    expect(prompt).toContain('Good connection here looks like');
    expect(prompt).toContain('Live mode');
  });

  test('schema requires all five dimensions and perVignette', () => {
    const { schema } = connectorEvaluationPrompts;
    ['empathy', 'presence', 'curiosity', 'nonJudgment', 'steadiness', 'perVignette', 'summary', 'strengths', 'growthAreas'].forEach((key) => {
      expect(schema.required).toContain(key);
      expect(schema.properties[key]).toBeDefined();
    });
  });
});
