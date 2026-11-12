import {
  getEffectiveCoachingMode,
  botSupportsDpflSessionFlow,
  isDpcOnlyCoachBot,
} from '../coachingMode';

describe('coachingMode', () => {
  it('marks Nobody and Sam as DPC-only', () => {
    expect(isDpcOnlyCoachBot('nexus-goal-path-solution')).toBe(true);
    expect(isDpcOnlyCoachBot('sam-forward-focused')).toBe(true);
    expect(isDpcOnlyCoachBot('victor-systemic-coaching')).toBe(false);
  });

  it('downgrades DPFL to DPC for DPC-only bots', () => {
    expect(getEffectiveCoachingMode('sam-forward-focused', 'dpfl')).toBe('dpc');
    expect(getEffectiveCoachingMode('nexus-goal-path-solution', 'dpfl')).toBe('dpc');
    expect(getEffectiveCoachingMode('victor-systemic-coaching', 'dpfl')).toBe('dpfl');
    expect(getEffectiveCoachingMode('sam-forward-focused', 'dpc')).toBe('dpc');
    expect(getEffectiveCoachingMode('sam-forward-focused', 'off')).toBe('off');
  });

  it('botSupportsDpflSessionFlow respects effective mode', () => {
    expect(botSupportsDpflSessionFlow('sam-forward-focused', 'dpfl')).toBe(false);
    expect(botSupportsDpflSessionFlow('victor-systemic-coaching', 'dpfl')).toBe(true);
  });
});
