import {
  buildCoachStarterPrompt,
  buildConnectorGloriaHandoffStarter,
  connectorHighScoreNeedsCoachBridge,
  getConnectorDimensionsWithAvailableCoach,
  getPrimaryMissedCue,
  getWeakestConnectorDimension,
  isConnectorCoachBotAvailable,
  rankConnectorDimensions,
  resolveConnectorHandoffPartnerName,
  shouldOfferConnectorCoachBridge,
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

  it('builds Sam connector coaching prep handoff for all dimension focus lines', () => {
    const eval_ = baseEval();
    eval_.perVignette = [{ vignetteId: 'nina-review', highlight: 'Ok', missedCue: 'x' }];
    for (const dim of ['empathy', 'presence', 'steadiness'] as const) {
      const prompt = buildCoachStarterPrompt(dim, 'long growth', 'en', 'sam-forward-focused', eval_);
      expect(prompt).toContain('real conversation in my life');
      expect(prompt).not.toContain('Nina');
      expect(prompt).toContain('Keep it brief');
      expect(prompt).not.toContain('long growth');
      expect(prompt).not.toContain('connector coaching prep');
    }
  });

  it('builds Nobody connector coaching prep handoff', () => {
    const eval_ = baseEval();
    const prompt = buildCoachStarterPrompt(
      'nonJudgment',
      'Try **not** to judge',
      'en',
      'nexus-goal-path-solution',
      eval_,
    );
    expect(prompt).toContain('listening without judging');
    expect(prompt).not.toContain('**');
    expect(prompt).not.toContain('connector coaching prep');
  });

  it('builds Gloria connector handoff starter with dimension focus (no practice persona)', () => {
    const eval_ = baseEval();
    eval_.perVignette = [{ vignetteId: 'nina-review', highlight: 'Good', missedCue: 'Jumped to fix' }];
    expect(resolveConnectorHandoffPartnerName(eval_)).toBe('Nina');
    const prompt = buildConnectorGloriaHandoffStarter('en', 'presence', eval_);
    expect(prompt).toContain('real conversation in my life');
    expect(prompt).not.toContain('Nina');
    expect(prompt).toContain('staying with the person');
    expect(prompt).toContain('questions only');
    expect(prompt).not.toContain('connection prep');
  });

  it('builds Gloria handoff via buildCoachStarterPrompt when evaluation provided', () => {
    const eval_ = baseEval();
    eval_.perVignette = [{ vignetteId: 'jonas-meeting', highlight: 'Ok', missedCue: '' }];
    const prompt = buildCoachStarterPrompt('empathy', 'Stay present longer', 'en', 'gloria-interview', eval_);
    expect(prompt).toContain('real conversation in my life');
    expect(prompt).not.toContain('Jonas');
    expect(prompt).toContain('recognizing and naming feelings');
  });

  it('falls back to generic Gloria prep without evaluation', () => {
    const prompt = buildCoachStarterPrompt('curiosity', 'Ask before advising', 'en', 'gloria-interview');
    expect(prompt).toContain('Ask before advising');
    expect(prompt).not.toContain('Connector practice');
  });

  it('filters connector coach dimensions by user access', () => {
    const eval_ = baseEval();
    const guestDims = getConnectorDimensionsWithAvailableCoach(eval_, null);
    expect(guestDims).toContain('nonJudgment');
    expect(guestDims).not.toContain('empathy');

    const registeredDims = getConnectorDimensionsWithAvailableCoach(eval_, { isPremium: false } as any);
    expect(registeredDims.length).toBeGreaterThan(guestDims.length);
    expect(isConnectorCoachBotAvailable('sam-forward-focused', { isPremium: false } as any)).toBe(true);
    expect(isConnectorCoachBotAvailable('sam-forward-focused', null)).toBe(false);
  });

  it('offers coach bridge for high overall score with weak dimension', () => {
    const eval_ = baseEval();
    eval_.overallScore = 8;
    eval_.curiosity = { score: 6, evidence: [] };
    expect(connectorHighScoreNeedsCoachBridge(eval_)).toBe(true);
    expect(showConnectorPracticeLadder(8)).toBe(false);
    expect(shouldOfferConnectorCoachBridge(eval_, { isPremium: false } as any)).toBe(true);
  });

  it('skips high-score coach bridge when all dimensions above 6 and no missed cue', () => {
    const eval_ = baseEval();
    eval_.overallScore = 8;
    eval_.empathy = { score: 7, evidence: [] };
    eval_.presence = { score: 7, evidence: [] };
    eval_.curiosity = { score: 7, evidence: [] };
    eval_.nonJudgment = { score: 7, evidence: [] };
    eval_.steadiness = { score: 8, evidence: [] };
    eval_.perVignette = [{ vignetteId: 'jonas-meeting', highlight: 'Good', missedCue: '' }];
    expect(connectorHighScoreNeedsCoachBridge(eval_)).toBe(false);
  });
});
