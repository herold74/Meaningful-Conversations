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
    Math.random = () => 0; // would roll a theme if re-rolled
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
