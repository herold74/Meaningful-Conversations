import {
  buildContractingProgressMap,
  buildMethodScenarioProgressMap,
  buildPhase2ContextFromEvaluation,
  formatCompletionPillLabel,
} from '../practiceSetupProgress';
import { PracticeEvaluationSummary } from '../../types';

const labels = {
  easy: 'Easy',
  moderate: 'Moderate',
  challenging: 'Challenging',
  hard: 'Hard',
};

describe('buildContractingProgressMap', () => {
  it('tracks highest difficulty and follow-up source per contracting scenario', () => {
    const evaluations: PracticeEvaluationSummary[] = [
      {
        id: 'c1',
        createdAt: '2026-08-01T10:00:00Z',
        language: 'en',
        frameworkId: 'contracting',
        scenarioId: 'contract-return-work',
        difficulty: 'easy',
        summary: 'ok',
        overallScore: 6,
        evaluationData: {
          practiceMode: 'contracting',
          clarifiedConcern: 'Return to work',
          sessionContract: 'Define first week goals',
          transcript: 'Coach: Hi\nCoachee: Hello',
          summary: 'ok',
          effectiveness: { score: 6, evidence: '', gaps: '' },
          clarity: { score: 6, evidence: '', gaps: '' },
          coacheeSatisfaction: { score: 6, evidence: '', gaps: '' },
          strengths: [],
          developmentAreas: [],
          nextDrills: [],
          calibration: { selfRating: 0, evidenceRating: 6, delta: '', interpretation: '' },
          overallScore: 6,
        },
      },
      {
        id: 'c2',
        createdAt: '2026-08-02T10:00:00Z',
        language: 'en',
        frameworkId: 'contracting',
        scenarioId: 'contract-return-work',
        difficulty: 'moderate',
        summary: 'better',
        overallScore: 7,
        evaluationData: {
          practiceMode: 'contracting',
          clarifiedConcern: 'Return to work',
          sessionContract: 'Define first week goals',
          transcript: 'Coach: Hi again',
          summary: 'better',
          effectiveness: { score: 7, evidence: '', gaps: '' },
          clarity: { score: 7, evidence: '', gaps: '' },
          coacheeSatisfaction: { score: 7, evidence: '', gaps: '' },
          strengths: [],
          developmentAreas: [],
          nextDrills: [],
          calibration: { selfRating: 0, evidenceRating: 7, delta: '', interpretation: '' },
          overallScore: 7,
        },
      },
      {
        id: 'm1',
        createdAt: '2026-08-03T10:00:00Z',
        language: 'en',
        frameworkId: 'four-stage-coaching',
        scenarioId: 'contract-return-work',
        difficulty: 'moderate',
        summary: 'phase2',
        overallScore: 8,
        evaluationData: {
          followsContractingEvaluationId: 'c2',
          summary: 'phase2',
          effectiveness: { score: 8, evidence: '', gaps: '' },
          clarity: { score: 8, evidence: '', gaps: '' },
          coacheeSatisfaction: { score: 8, evidence: '', gaps: '' },
          strengths: [],
          developmentAreas: [],
          nextDrills: [],
          calibration: { selfRating: 0, evidenceRating: 8, delta: '', interpretation: '' },
          overallScore: 8,
        },
      },
    ];

    const map = buildContractingProgressMap(evaluations, labels);
    const entry = map.get('contract-return-work');
    expect(entry?.highestDifficulty).toBe('moderate');
    expect(entry?.highestDifficultyLabel).toBe('Moderate');
    expect(entry?.bestScore).toBe(7);
    expect(formatCompletionPillLabel(entry?.highestDifficultyLabel, entry?.bestScore)).toBe('Moderate 7/10');
    expect(entry?.followUpSource?.id).toBe('c2');
    expect(entry?.followUpCompleted).toBe(true);
  });

  it('keeps best score at highest difficulty when multiple attempts exist', () => {
    const evaluations: PracticeEvaluationSummary[] = [
      {
        id: 'c1',
        createdAt: '2026-08-01T10:00:00Z',
        language: 'en',
        frameworkId: 'contracting',
        scenarioId: 'contract-return-work',
        difficulty: 'moderate',
        summary: 'first',
        overallScore: 5,
        evaluationData: {
          practiceMode: 'contracting',
          summary: 'first',
          effectiveness: { score: 5, evidence: '', gaps: '' },
          clarity: { score: 5, evidence: '', gaps: '' },
          coacheeSatisfaction: { score: 5, evidence: '', gaps: '' },
          strengths: [],
          developmentAreas: [],
          nextDrills: [],
          calibration: { selfRating: 0, evidenceRating: 5, delta: '', interpretation: '' },
          overallScore: 5,
        },
      },
      {
        id: 'c2',
        createdAt: '2026-08-02T10:00:00Z',
        language: 'en',
        frameworkId: 'contracting',
        scenarioId: 'contract-return-work',
        difficulty: 'moderate',
        summary: 'retry',
        overallScore: 6,
        evaluationData: {
          practiceMode: 'contracting',
          summary: 'retry',
          effectiveness: { score: 6, evidence: '', gaps: '' },
          clarity: { score: 6, evidence: '', gaps: '' },
          coacheeSatisfaction: { score: 6, evidence: '', gaps: '' },
          strengths: [],
          developmentAreas: [],
          nextDrills: [],
          calibration: { selfRating: 0, evidenceRating: 6, delta: '', interpretation: '' },
          overallScore: 6,
        },
      },
    ];

    const entry = buildContractingProgressMap(evaluations, labels).get('contract-return-work');
    expect(entry?.bestScore).toBe(6);
    expect(formatCompletionPillLabel(entry?.highestDifficultyLabel, entry?.bestScore)).toBe('Moderate 6/10');
  });
});

describe('buildMethodScenarioProgressMap', () => {
  it('tracks highest difficulty and best score per method scenario', () => {
    const evaluations: PracticeEvaluationSummary[] = [
      {
        id: 'm1',
        createdAt: '2026-08-01T10:00:00Z',
        language: 'en',
        frameworkId: 'four-stage-coaching',
        scenarioId: 'return-work',
        difficulty: 'easy',
        summary: 'ok',
        overallScore: 8,
        evaluationData: {
          summary: 'ok',
          effectiveness: { score: 8, evidence: '', gaps: '' },
          clarity: { score: 8, evidence: '', gaps: '' },
          coacheeSatisfaction: { score: 8, evidence: '', gaps: '' },
          strengths: [],
          developmentAreas: [],
          nextDrills: [],
          calibration: { selfRating: 0, evidenceRating: 8, delta: '', interpretation: '' },
          overallScore: 8,
        },
      },
      {
        id: 'm2',
        createdAt: '2026-08-02T10:00:00Z',
        language: 'en',
        frameworkId: 'grow',
        scenarioId: 'return-work',
        difficulty: 'moderate',
        summary: 'better',
        overallScore: 6,
        evaluationData: {
          summary: 'better',
          effectiveness: { score: 6, evidence: '', gaps: '' },
          clarity: { score: 6, evidence: '', gaps: '' },
          coacheeSatisfaction: { score: 6, evidence: '', gaps: '' },
          strengths: [],
          developmentAreas: [],
          nextDrills: [],
          calibration: { selfRating: 0, evidenceRating: 6, delta: '', interpretation: '' },
          overallScore: 6,
        },
      },
    ];

    const entry = buildMethodScenarioProgressMap(evaluations, labels).get('return-work');
    expect(entry?.highestDifficulty).toBe('moderate');
    expect(entry?.bestScore).toBe(6);
    expect(formatCompletionPillLabel(entry?.highestDifficultyLabel, entry?.bestScore)).toBe('Moderate 6/10');
  });
});

describe('buildPhase2ContextFromEvaluation', () => {
  it('builds phase 2 context from stored contracting evaluation', () => {
    const evaluation: PracticeEvaluationSummary = {
      id: 'c2',
      createdAt: '2026-08-02T10:00:00Z',
      language: 'en',
      frameworkId: 'contracting',
      scenarioId: 'contract-return-work',
      difficulty: 'moderate',
      summary: 'better',
      overallScore: 7,
      evaluationData: {
        practiceMode: 'contracting',
        clarifiedConcern: 'Return to work',
        sessionContract: 'First week plan',
        transcript: 'Coach: Hello',
        liveMode: false,
        summary: 'better',
        effectiveness: { score: 7, evidence: '', gaps: '' },
        clarity: { score: 7, evidence: '', gaps: '' },
        coacheeSatisfaction: { score: 7, evidence: '', gaps: '' },
        strengths: [],
        developmentAreas: [],
        nextDrills: [],
        calibration: { selfRating: 0, evidenceRating: 7, delta: '', interpretation: '' },
        overallScore: 7,
      },
    };

    const ctx = buildPhase2ContextFromEvaluation(
      evaluation,
      { coacheeName: 'Nina', avatar: '/avatars/chloe.png', coacheeGender: 'female' },
      labels,
    );

    expect(ctx.contractingEvaluationId).toBe('c2');
    expect(ctx.priorTranscript).toBe('Coach: Hello');
    expect(ctx.clarifiedConcern).toBe('Return to work');
  });
});
