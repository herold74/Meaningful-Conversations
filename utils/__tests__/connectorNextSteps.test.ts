import {
  buildCoachStarterPrompt,
  getPrimaryMissedCue,
  getWeakestConnectorDimension,
  rankConnectorDimensions,
  showConnectorPracticeLadder,
} from '../connectorNextSteps';
import type { ConnectorEvaluationResult } from '../../types';

const baseEval = (): ConnectorEvaluationResult => ({
  summary: 'Test',
  empathy: { score: 7, evidence: [] },
  presence: { score: 4, evidence: [] },
  curiosity: { score: 6, evidence: [] },
  nonJudgment: { score: 5, evidence: [] },
  steadiness: { score: 8, evidence: [] },
  strengths: ['Listening'],
  growthAreas: ['Stay present longer'],
  perVignette: [{ vignetteId: 'jonas-meeting', highlight: 'Good', missedCue: 'Asked too soon' }],
  overallScore: 6,
  vignetteIds: ['jonas-meeting'],
  endTypes: ['heard'],
  completedAt: new Date().toISOString(),
});

describe('connectorNextSteps', () => {
  it('ranks dimensions by ascending score', () => {
    const ranked = rankConnectorDimensions(baseEval());
    expect(ranked[0]).toBe('presence');
    expect(ranked[ranked.length - 1]).toBe('steadiness');
  });

  it('returns weakest dimension', () => {
    expect(getWeakestConnectorDimension(baseEval())).toBe('presence');
  });

  it('returns first missed cue', () => {
    expect(getPrimaryMissedCue(baseEval())).toBe('Asked too soon');
  });

  it('shows ladder below practice threshold', () => {
    expect(showConnectorPracticeLadder(7)).toBe(true);
    expect(showConnectorPracticeLadder(8)).toBe(false);
    expect(showConnectorPracticeLadder(null)).toBe(true);
  });

  it('builds coach starter with growth area', () => {
    const prompt = buildCoachStarterPrompt('presence', 'Stay present longer', 'en');
    expect(prompt).toContain('Stay present longer');
    expect(prompt).toContain('prepare');
  });

  it('builds Gloria-specific connection prep starter from connector handoff', () => {
    const prompt = buildCoachStarterPrompt('curiosity', 'Ask before advising', 'en', 'gloria-interview');
    expect(prompt).toContain('prepare for a conversation');
    expect(prompt).toContain('Ask before advising');
    expect(prompt).not.toContain('practice everyday conversation skills');
  });
});
