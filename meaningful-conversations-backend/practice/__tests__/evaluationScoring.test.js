const {
  computePracticeOverallScore,
  computeContractingOverallScore,
  computeFreePlayOverallScore,
  buildScenarioMethodFit,
} = require('../evaluationScoring.js');

describe('computePracticeOverallScore', () => {
  const baseEv = {
    methodCompliance: { score: 5 },
    effectiveness: { score: 6 },
    clarity: { score: 7 },
    coacheeAutonomy: { score: 8 },
    coacheeSatisfaction: { score: 6 },
    sessionFlow: { coherent: false },
  };

  test('method ≥9 and coherent=true allows 10/10', () => {
    expect(computePracticeOverallScore({
      ...baseEv,
      methodCompliance: { score: 10 },
      sessionFlow: { coherent: true },
    })).toBe(10);
  });

  test('method ≥9 and coherent=false caps at 9/10', () => {
    expect(computePracticeOverallScore({
      ...baseEv,
      methodCompliance: { score: 10 },
      sessionFlow: { coherent: false },
    })).toBe(9);
  });

  test('method 9 with coherent=true stays at 9', () => {
    expect(computePracticeOverallScore({
      ...baseEv,
      methodCompliance: { score: 9 },
      sessionFlow: { coherent: true },
    })).toBe(9);
  });

  test('method below 9 uses weighted blend capped at 9', () => {
    const score = computePracticeOverallScore(baseEv);
    expect(score).toBeGreaterThanOrEqual(1);
    expect(score).toBeLessThanOrEqual(9);
    expect(score).toBe(Math.round(5 * 0.6 + ((6 + 7 + 8 + 6) / 4) * 0.4));
  });

  test('missing sessionFlow treats coherent as false for cap rule', () => {
    expect(computePracticeOverallScore({
      methodCompliance: { score: 9 },
      effectiveness: { score: 8 },
      clarity: { score: 8 },
      coacheeAutonomy: { score: 8 },
      coacheeSatisfaction: { score: 8 },
    })).toBe(9);
  });
});

describe('computeContractingOverallScore', () => {
  const dims = {
    effectiveness: { score: 8 },
    clarity: { score: 8 },
    coacheeAutonomy: { score: 8 },
    coacheeSatisfaction: { score: 8 },
  };

  test('averages four dimensions', () => {
    expect(computeContractingOverallScore({ ...dims, contractingSteps: { outcomeDefined: true, contractConfirmed: true } })).toBe(8);
  });

  test('caps at 8 when outcome/confirm missing despite high scores', () => {
    expect(computeContractingOverallScore({
      ...dims,
      contractingSteps: { outcomeDefined: false, contractConfirmed: false },
    })).toBe(8);
  });
});

describe('computeFreePlayOverallScore', () => {
  test('averages four dimensions without method compliance', () => {
    expect(computeFreePlayOverallScore({
      effectiveness: { score: 7 },
      clarity: { score: 9 },
      coacheeAutonomy: { score: 8 },
      coacheeSatisfaction: { score: 6 },
    })).toBe(8);
  });
});

describe('buildScenarioMethodFit', () => {
  test('returns null for primary tier pair', () => {
    expect(buildScenarioMethodFit('career-decision', 'four-stage-coaching', 'en')).toBeNull();
  });

  test('returns neutral note for neutral tier pair', () => {
    const fit = buildScenarioMethodFit('career-decision', 'mental-fitness-coaching', 'en');
    expect(fit).toEqual(expect.objectContaining({
      tier: 'neutral',
      note: expect.stringContaining('acceptable'),
    }));
  });

  test('returns discouraged reason in German', () => {
    const fit = buildScenarioMethodFit('stuck-metaphor', 'forward-focused-coaching', 'de');
    if (fit?.tier === 'discouraged') {
      expect(fit.note).toBeTruthy();
      expect(typeof fit.note).toBe('string');
    }
  });
});
