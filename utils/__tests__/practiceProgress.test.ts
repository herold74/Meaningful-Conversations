import {
  buildRecommendedPracticeConfig,
  computePracticeProgress,
  practiceLevelFromSessions,
} from '../practiceProgress';
import type { PracticeCatalog, PracticeEvaluationSummary } from '../../types';

const baseEvaluationData = {
  summary: 'Solid contracting',
  methodCompliance: { score: 7, evidence: 'e', gaps: 'g', stagesCovered: ['Goal'] },
  effectiveness: { score: 6, evidence: 'e', gaps: 'g' },
  clarity: { score: 8, evidence: 'e', gaps: 'g' },
  coacheeAutonomy: { score: 7, evidence: 'e', gaps: 'g' },
  coacheeSatisfaction: { score: 7, evidence: 'e', gaps: 'g' },
  strengths: ['Good questions'],
  developmentAreas: ['Contracting depth', 'contracting depth'],
  nextDrills: [{ action: 'Practice opening', rationale: 'Start with welcome' }],
  calibration: { selfRating: 7, evidenceRating: 6, delta: '+1', interpretation: 'Close' },
  overallScore: 7,
};

const makeEval = (overrides: Partial<PracticeEvaluationSummary> = {}): PracticeEvaluationSummary => ({
  id: overrides.id || 'ev-1',
  createdAt: overrides.createdAt || '2026-07-01T10:00:00.000Z',
  language: 'de',
  frameworkId: 'four-stage-coaching',
  scenarioId: 'career-decision',
  difficulty: 'moderate',
  focusNote: null,
  summary: 'Session summary',
  overallScore: 7,
  evaluationData: baseEvaluationData,
  ...overrides,
});

const catalog: PracticeCatalog = {
  frameworks: [{ id: 'four-stage-coaching', name: 'Four-stage coaching', sourceBotId: null, isPracticeOnly: false, shortDescription: '', stages: [], complianceCriteria: [], explainer: { summary: '', why: '', goodCompliance: '' } }],
  scenarios: [{
    id: 'career-decision',
    coacheeName: 'Alex',
    concern: 'Career choice',
    emotionalTone: 'Uncertain',
    avatar: '/avatars/alex.png',
  }],
  defaultPair: { frameworkId: 'four-stage-coaching', scenarioId: 'career-decision' },
  difficulties: [
    { id: 'moderate', label: 'Moderate' },
  ],
  unlocks: { hard: false, liveMode: false },
};

describe('practiceProgress', () => {
  test('practiceLevelFromSessions maps counts to levels', () => {
    expect(practiceLevelFromSessions(0)).toBe('beginner');
    expect(practiceLevelFromSessions(5)).toBe('developing');
    expect(practiceLevelFromSessions(12)).toBe('advanced');
    expect(practiceLevelFromSessions(20)).toBe('expert');
  });

  test('computePracticeProgress aggregates scores and milestones', () => {
    const stats = computePracticeProgress([
      makeEval({ id: '1', overallScore: 6, createdAt: '2026-07-01T10:00:00.000Z' }),
      makeEval({ id: '2', overallScore: 8, createdAt: '2026-07-02T10:00:00.000Z', difficulty: 'challenging' }),
    ]);

    expect(stats.totalSessions).toBe(2);
    expect(stats.averageScore).toBe(7);
    expect(stats.bestScore).toBe(8);
    expect(stats.milestones.find((m) => m.id === 'first_session')?.achieved).toBe(true);
    expect(stats.milestones.find((m) => m.id === 'score_eight')?.achieved).toBe(true);
    expect(stats.milestones.find((m) => m.id === 'challenging_done')?.achieved).toBe(true);
    expect(stats.milestones.find((m) => m.id === 'hard_done')?.achieved).toBe(false);
    expect(stats.milestones.find((m) => m.id === 'live_overlay_done')?.achieved).toBe(false);
    expect(stats.recurringDevelopmentAreas[0].count).toBe(4);
    expect(stats.nextDrill?.action).toBe('Practice opening');
  });

  test('buildRecommendedPracticeConfig uses latest session and drill focus', () => {
    const stats = computePracticeProgress([makeEval()]);
    const config = buildRecommendedPracticeConfig(stats, catalog);
    expect(config?.frameworkId).toBe('four-stage-coaching');
    expect(config?.scenarioId).toBe('career-decision');
    expect(config?.focusNote).toBe('Practice opening');
    expect(config?.coacheeName).toBe('Alex');
  });

  test('buildRecommendedPracticeConfig falls back to defaultPair when no sessions', () => {
    const stats = computePracticeProgress([]);
    const config = buildRecommendedPracticeConfig(stats, catalog);
    expect(config?.frameworkId).toBe('four-stage-coaching');
    expect(config?.scenarioId).toBe('career-decision');
    expect(config?.focusNote).toBeUndefined();
  });
});
