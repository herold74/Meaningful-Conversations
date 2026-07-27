import {
  compareToBaseline,
  parseRegressionSnapshot,
  validateScoreBands,
  PracticeRegressionSnapshot,
} from '../practiceRegression';
import { TestRunResult } from '../testScenarios';

describe('practiceRegression', () => {
  const baseline: PracticeRegressionSnapshot = {
    version: 1,
    exportedAt: '2026-01-01T00:00:00.000Z',
    scenarioId: 'motivation-dip',
    labMode: 'adaptive',
    language: 'en',
    difficulty: 'easy',
    transcript: [],
    scores: {
      overallScore: 8,
      methodCompliance: 8,
      effectiveness: 7,
      clarity: 8,
      coacheeAutonomy: 7,
      coacheeSatisfaction: 8,
      sessionFlowCoherent: true,
    },
  };

  test('validateScoreBands accepts valid scores', () => {
    const result = validateScoreBands(baseline.scores);
    expect(result.ok).toBe(true);
  });

  test('validateScoreBands rejects out-of-range scores', () => {
    const result = validateScoreBands({ ...baseline.scores, methodCompliance: 11 });
    expect(result.ok).toBe(false);
  });

  test('compareToBaseline flags method regression > 2', () => {
    const result: TestRunResult = {
      scenarioId: 'test',
      botId: 'sam-forward-focused',
      profileId: 'n/a',
      timestamp: new Date().toISOString(),
      responses: [],
      autoCheckResults: [],
      manualCheckResults: [],
      practiceEvaluation: {
        id: '1',
        durationMs: 100,
        evaluation: {
          overallScore: 8,
          methodCompliance: { score: 5, evidence: '' },
          effectiveness: { score: 7, evidence: '' },
          clarity: { score: 8, evidence: '' },
          coacheeAutonomy: { score: 7, evidence: '' },
          coacheeSatisfaction: { score: 8, evidence: '' },
          sessionFlow: { coherent: true, evidence: '' },
          summary: '',
        } as TestRunResult['practiceEvaluation']['evaluation'],
      },
    };

    const comparison = compareToBaseline(baseline, result);
    expect(comparison.ok).toBe(false);
    expect(comparison.flaggedFields).toContain('methodCompliance');
  });

  test('parseRegressionSnapshot validates version', () => {
    expect(() => parseRegressionSnapshot(JSON.stringify({ version: 99 }))).toThrow();
    const parsed = parseRegressionSnapshot(JSON.stringify(baseline));
    expect(parsed.scenarioId).toBe('motivation-dip');
  });
});
