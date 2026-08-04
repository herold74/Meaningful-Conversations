import {
  buildContractingProgressMap,
  buildPhase2ContextFromEvaluation,
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
    expect(entry?.followUpSource?.id).toBe('c2');
    expect(entry?.followUpCompleted).toBe(true);
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
