const { rollScopeBoundaryTheme, getThemeLabel, isValidTheme, SCOPE_BOUNDARY_PROBABILITY } = require('../scopeBoundary');

describe('scopeBoundary', () => {
  test('rollScopeBoundaryTheme returns valid theme or null', () => {
    const originalRandom = Math.random;
    try {
      Math.random = () => 0.5;
      expect(rollScopeBoundaryTheme('motivation-dip')).toBeNull();

      Math.random = () => 0;
      const theme = rollScopeBoundaryTheme('motivation-dip');
      expect(isValidTheme(theme)).toBe(true);
    } finally {
      Math.random = originalRandom;
    }
  });

  test('getThemeLabel returns localized label', () => {
    expect(getThemeLabel('trauma', 'en')).toMatch(/Trauma/i);
    expect(getThemeLabel('trauma', 'de')).toMatch(/Trauma/i);
  });

  test('probability constant is 33%', () => {
    expect(SCOPE_BOUNDARY_PROBABILITY).toBe(0.33);
  });
});
