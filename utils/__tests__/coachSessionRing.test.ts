import {
  getCoachSessionRing,
  getCoachSessionRingClass,
} from '../coachSessionRing';

describe('coachSessionRing', () => {
  test('Sam and Max use forward (session-flow) ring', () => {
    expect(getCoachSessionRing('sam-forward-focused')).toBe('forward');
    expect(getCoachSessionRing('max-ambitious')).toBe('forward');
  });

  test('forward ring class uses theme-aware session-ring token', () => {
    expect(getCoachSessionRingClass('forward', false)).toBe('bg-session-ring-forward');
  });

  test('Gloria Interview uses develop (interview), not clarify', () => {
    expect(getCoachSessionRing('gloria-interview')).toBe('develop');
  });

  test('Gabrielle uses clarify ring', () => {
    expect(getCoachSessionRing('gabrielle-four-stage')).toBe('clarify');
  });

  test('Kenji uses develop ring', () => {
    expect(getCoachSessionRing('kenji-resilience')).toBe('develop');
  });
});
