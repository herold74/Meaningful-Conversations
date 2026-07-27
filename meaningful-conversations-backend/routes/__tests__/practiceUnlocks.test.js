const {
  practicePairKey,
  isHardUnlockedForPair,
} = require('../../practice/practiceUnlocks.js');
const {
  resolveScopeBoundaryTheme,
  VALID_DIFFICULTIES,
} = require('../practice.js');

describe('resolveScopeBoundaryTheme', () => {
  const originalRandom = Math.random;

  afterEach(() => {
    Math.random = originalRandom;
  });

  test('returns null for non-hard difficulty', () => {
    expect(resolveScopeBoundaryTheme('moderate', 'career-decision', 'trauma')).toBeNull();
  });

  test('honors explicit null from client (no re-roll)', () => {
    Math.random = () => 0;
    expect(resolveScopeBoundaryTheme('hard', 'motivation-dip', null)).toBeNull();
  });

  test('honors valid client theme', () => {
    expect(resolveScopeBoundaryTheme('hard', 'motivation-dip', 'trauma')).toBe('trauma');
  });

  test('rolls when client theme is undefined', () => {
    Math.random = () => 0;
    expect(resolveScopeBoundaryTheme('hard', 'motivation-dip', undefined)).toBeTruthy();
  });
});

describe('VALID_DIFFICULTIES', () => {
  test('includes hard', () => {
    expect(VALID_DIFFICULTIES).toContain('hard');
  });
});

describe('practiceUnlocks', () => {
  describe('practicePairKey', () => {
    test('normalizes legacy framework aliases', () => {
      expect(practicePairKey('grow', 'career-decision')).toBe(
        practicePairKey('four-stage-coaching', 'career-decision'),
      );
    });
  });

  describe('isHardUnlockedForPair', () => {
    const pairs = [
      { frameworkId: 'four-stage-coaching', scenarioId: 'career-decision' },
      { frameworkId: 'forward-focused-coaching', scenarioId: 'motivation-dip' },
    ];

    test('privileged users always unlocked', () => {
      expect(isHardUnlockedForPair([], 'four-stage-coaching', 'career-decision', true)).toBe(true);
    });

    test('unlocked when exact pair completed on challenging', () => {
      expect(isHardUnlockedForPair(pairs, 'four-stage-coaching', 'career-decision', false)).toBe(true);
    });

    test('locked for different scenario with same method', () => {
      expect(isHardUnlockedForPair(pairs, 'four-stage-coaching', 'motivation-dip', false)).toBe(false);
    });

    test('locked for different method with same scenario', () => {
      expect(isHardUnlockedForPair(pairs, 'ambivalence-coaching', 'career-decision', false)).toBe(false);
    });

    test('matches legacy framework id in completed pairs', () => {
      const legacyPairs = [{ frameworkId: 'grow', scenarioId: 'career-decision' }];
      expect(isHardUnlockedForPair(legacyPairs, 'four-stage-coaching', 'career-decision', false)).toBe(true);
    });
  });
});
