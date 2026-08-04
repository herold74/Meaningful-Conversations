const { normalizeLanguage } = require('../language');

describe('normalizeLanguage', () => {
  test('returns en for explicit English', () => {
    expect(normalizeLanguage('en')).toBe('en');
  });

  test('returns de for explicit German', () => {
    expect(normalizeLanguage('de')).toBe('de');
  });

  test('defaults to de for missing or invalid values', () => {
    expect(normalizeLanguage(undefined)).toBe('de');
    expect(normalizeLanguage(null)).toBe('de');
    expect(normalizeLanguage('')).toBe('de');
    expect(normalizeLanguage('en-US')).toBe('de');
    expect(normalizeLanguage('fr')).toBe('de');
  });
});
