import { buildConnectorHandoffPayload } from '../connectorHandoffPayload';
import type { ConnectorEvaluationResult } from '../../types';

const sampleEval: ConnectorEvaluationResult = {
  summary: '',
  empathy: { score: 7, evidence: [] },
  presence: { score: 6, evidence: [] },
  curiosity: { score: 5, evidence: [] },
  nonJudgment: { score: 7, evidence: [] },
  steadiness: { score: 8, evidence: [] },
  strengths: [],
  growthAreas: [],
  perVignette: [
    {
      vignetteId: 'nina-review',
      highlight: 'Good pause',
      missedCue: 'Jumped to advice',
    },
  ],
  overallScore: 6,
  vignetteIds: ['nina-review'],
  endTypes: ['heard'],
  completedAt: '2026-01-01T00:00:00.000Z',
};

describe('buildConnectorHandoffPayload', () => {
  it('maps eval slice and focus dimension', () => {
    const payload = buildConnectorHandoffPayload(sampleEval, 'curiosity');
    expect(payload).toEqual({
      vignetteId: 'nina-review',
      focusDimension: 'curiosity',
      highlight: 'Good pause',
      missedCue: 'Jumped to advice',
    });
  });
});
