/**
 * Unit tests for practiceStatsService (GDPR-safe admin aggregates).
 */

const { computePracticeAdminStats, K_ANONYMITY } = require('../practiceStatsService');

const makeRow = (overrides = {}) => ({
  frameworkId: 'four-stage-coaching',
  scenarioId: 'career-decision',
  difficulty: 'moderate',
  userId: 'user-1',
  createdAt: new Date('2026-07-20T10:00:00.000Z'),
  evaluationData: JSON.stringify({
    overallScore: 7,
    methodCompliance: { score: 7 },
    effectiveness: { score: 7 },
    clarity: { score: 8 },
    coacheeAutonomy: { score: 6 },
    coacheeSatisfaction: { score: 7 },
    calibration: { selfRating: 7, evidenceRating: 6 },
  }),
  ...overrides,
});

describe('practiceStatsService', () => {
  test('aggregates framework and scenario counts', () => {
    const stats = computePracticeAdminStats([
      makeRow(),
      makeRow({ userId: 'user-2', frameworkId: 'four-stage-coaching', scenarioId: 'team-conflict' }),
    ], { days: 90, language: 'en' });

    expect(stats.totals.completedSessions).toBe(2);
    const grow = stats.byFramework.find((f) => f.id === 'four-stage-coaching');
    expect(grow?.displayCount).toBe(`<${K_ANONYMITY}`);
    expect(stats.underusedScenarios.length).toBeGreaterThan(0);
  });

  test('suppresses active coach count below k-anonymity threshold', () => {
    const stats = computePracticeAdminStats([
      makeRow({ userId: 'u1' }),
      makeRow({ userId: 'u2' }),
    ], { days: 90 });

    expect(K_ANONYMITY).toBe(5);
    expect(stats.totals.activeCoachesSuppressed).toBe(true);
    expect(stats.totals.activeCoaches).toBeNull();
    expect(stats.learningImpact.suppressed).toBe(true);
  });

  test('suppresses small matrix cells', () => {
    const stats = computePracticeAdminStats([makeRow()], { days: 90 });
    const cell = stats.matrix.find((m) => m.frameworkId === 'four-stage-coaching' && m.scenarioId === 'career-decision');
    expect(cell?.suppressed).toBe(true);
    expect(cell?.displayCount).toBe(`<${K_ANONYMITY}`);
    expect(cell?.avgScore).toBeNull();
  });

  test('learning impact visible with enough coaches', () => {
    const rows = [];
    for (let i = 0; i < 5; i++) {
      rows.push(makeRow({
        userId: `coach-${i}`,
        evaluationData: JSON.stringify({
          overallScore: 8,
          methodCompliance: { score: 8 },
          effectiveness: { score: 8 },
          clarity: { score: 8 },
          coacheeSatisfaction: { score: 8 },
        }),
      }));
      rows.push(makeRow({
        userId: `coach-${i}`,
        createdAt: new Date('2026-07-22T10:00:00.000Z'),
        evaluationData: JSON.stringify({
          overallScore: 9,
          methodCompliance: { score: 9 },
          effectiveness: { score: 9 },
          clarity: { score: 9 },
          coacheeSatisfaction: { score: 9 },
        }),
      }));
    }
    const stats = computePracticeAdminStats(rows, { days: 90 });
    expect(stats.learningImpact.suppressed).toBe(false);
    expect(stats.learningImpact.cohortSize).toBe(5);
    expect(stats.learningImpact.avgDelta).toBe(1);
  });
});
