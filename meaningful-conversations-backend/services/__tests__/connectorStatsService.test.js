/**
 * Unit tests for connectorStatsService (GDPR-safe admin aggregates).
 */

const { computeConnectorAdminStats, K_ANONYMITY } = require('../connectorStatsService');

const makeRow = (overrides = {}) => ({
  overallScore: 8,
  empathy: 8,
  presence: 7,
  curiosity: 8,
  nonJudgment: 9,
  steadiness: 7,
  vignetteIds: ['jonas-meeting', 'leila-breakup', 'tom-vancouver'],
  endTypes: ['heard', 'heard', 'timeout'],
  language: 'de',
  liveMode: false,
  createdAt: new Date('2026-07-20T10:00:00.000Z'),
  ...overrides,
});

describe('connectorStatsService', () => {
  test('aggregates runs and vignette counts', () => {
    const stats = computeConnectorAdminStats([
      makeRow(),
      makeRow({ overallScore: 6, vignetteIds: ['david-exhaustion', 'carmen-mia', 'jonas-meeting'] }),
    ], 8, { days: 90, language: 'en' });

    expect(stats.totals.completedRuns).toBe(2);
    expect(stats.totals.activeUsers).toBe(8);
    expect(stats.totals.avgOverallScore).toBe(7);
    const jonas = stats.byVignette.find((v) => v.id === 'jonas-meeting');
    expect(jonas?.displayCount).toBe(`<${K_ANONYMITY}`);
    expect(jonas?.suppressed).toBe(true);
  });

  test('suppresses active user count below k-anonymity threshold', () => {
    const stats = computeConnectorAdminStats([makeRow()], 3, { days: 90 });

    expect(stats.totals.activeUsersSuppressed).toBe(true);
    expect(stats.totals.activeUsers).toBeNull();
  });

  test('computes dimension averages and heard rate', () => {
    const rows = [];
    for (let i = 0; i < 5; i++) {
      rows.push(makeRow({ endTypes: ['heard', 'heard', 'heard'] }));
    }
    for (let i = 0; i < 5; i++) {
      rows.push(makeRow({ endTypes: ['timeout', 'timeout', 'timeout'] }));
    }
    const stats = computeConnectorAdminStats(rows, 10, { days: 90 });

    expect(stats.dimensionAverages.empathy).toBe(8);
    expect(stats.byEndType.heard.displayCount).toBe('15');
    expect(stats.byEndType.timeout.displayCount).toBe('15');
    expect(stats.totals.heardRatePercent).toBe(50);
  });

  test('tracks live mode split', () => {
    const stats = computeConnectorAdminStats([
      makeRow({ liveMode: false }),
      makeRow({ liveMode: true }),
    ], 10, { days: 90 });

    expect(stats.byLiveMode.text.displayCount).toBe('1');
    expect(stats.byLiveMode.voice.displayCount).toBe('1');
  });
});
