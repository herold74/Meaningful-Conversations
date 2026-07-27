const {
  resolveFrameworkId,
  resolveBotId,
  normalizeUnlockedCoaches,
  LEGACY_BOT_ALIASES,
} = require('../methodTaxonomy.js');

describe('methodTaxonomy legacy aliases', () => {
  describe('resolveBotId', () => {
    test.each([
      ['kenji-stoic', 'kenji-resilience'],
      ['nexus-gps', 'nexus-goal-path-solution'],
      ['victor-bowen', 'victor-systemic-coaching'],
      ['chloe-cbt', 'chloe-structured-reflection'],
      ['dan-clean-language', 'dan-client-language'],
      ['steve-solution-focused', 'sam-forward-focused'],
      ['gabrielle-grow', 'gabrielle-four-stage'],
      ['mike-motivational-interviewing', 'mike-ambivalence-coaching'],
    ])('%s → %s', (legacy, canonical) => {
      expect(resolveBotId(legacy)).toBe(canonical);
    });

    test('passes through canonical bot ids', () => {
      expect(resolveBotId('kenji-resilience')).toBe('kenji-resilience');
    });

    test('does not map canonical ids to themselves via alias table only', () => {
      Object.entries(LEGACY_BOT_ALIASES).forEach(([legacy, canonical]) => {
        expect(legacy).not.toBe(canonical);
      });
    });
  });

  describe('resolveFrameworkId', () => {
    test.each([
      ['grow', 'four-stage-coaching'],
      ['gps', 'goal-path-solution'],
      ['stoic', 'resilience-coaching'],
      ['solution-focused', 'forward-focused-coaching'],
      ['motivational-interviewing', 'ambivalence-coaching'],
      ['clean-language', 'client-exact-language'],
      ['cbt', 'structured-reflection'],
      ['bowen', 'systemic-coaching'],
    ])('%s → %s', (legacy, canonical) => {
      expect(resolveFrameworkId(legacy)).toBe(canonical);
    });
  });

  describe('normalizeUnlockedCoaches', () => {
    test('deduplicates legacy and canonical ids for the same coach', () => {
      expect(normalizeUnlockedCoaches(['kenji-stoic', 'kenji-resilience'])).toEqual([
        'kenji-resilience',
      ]);
    });
  });
});
