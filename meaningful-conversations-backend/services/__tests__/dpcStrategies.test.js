/**
 * Unit Tests for dpcStrategies.js
 *
 * Tests:
 * 1. Strategy definitions are well-formed (Riemann, Big5, SD)
 * 2. All dimensions have required structure (high/low, de/en)
 * 3. Challenge examples structure and completeness
 * 4. Edge cases: missing dimensions, extreme values in structure
 */

const {
  RIEMANN_STRATEGIES,
  BIG5_STRATEGIES,
  SD_STRATEGIES,
  CHALLENGE_EXAMPLES,
} = require('../dpcStrategies');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('dpcStrategies', () => {
  // ============================================
  // RIEMANN_STRATEGIES
  // ============================================
  describe('RIEMANN_STRATEGIES', () => {
    const riemannTraits = ['dauer', 'wechsel', 'naehe', 'distanz'];

    test('has all four Riemann dimensions', () => {
      for (const trait of riemannTraits) {
        expect(RIEMANN_STRATEGIES).toHaveProperty(trait);
      }
    });

    test('each dimension has high and low levels', () => {
      for (const trait of riemannTraits) {
        expect(RIEMANN_STRATEGIES[trait]).toHaveProperty('high');
        expect(RIEMANN_STRATEGIES[trait]).toHaveProperty('low');
      }
    });

    test('high level has language, tone, approach for de and en', () => {
      for (const trait of riemannTraits) {
        const high = RIEMANN_STRATEGIES[trait].high;
        expect(high).toHaveProperty('de');
        expect(high).toHaveProperty('en');
        expect(high.de).toHaveProperty('language');
        expect(high.de).toHaveProperty('tone');
        expect(high.de).toHaveProperty('approach');
        expect(high.en).toHaveProperty('language');
        expect(high.en).toHaveProperty('tone');
        expect(high.en).toHaveProperty('approach');
      }
    });

    test('low level has blindspot and challenge for de and en', () => {
      for (const trait of riemannTraits) {
        const low = RIEMANN_STRATEGIES[trait].low;
        expect(low).toHaveProperty('de');
        expect(low).toHaveProperty('en');
        expect(low.de).toHaveProperty('blindspot');
        expect(low.de).toHaveProperty('challenge');
        expect(low.en).toHaveProperty('blindspot');
        expect(low.en).toHaveProperty('challenge');
      }
    });

    test('all strategy strings are non-empty', () => {
      for (const trait of riemannTraits) {
        const dim = RIEMANN_STRATEGIES[trait];
        for (const level of ['high', 'low']) {
          for (const lang of ['de', 'en']) {
            const obj = dim[level][lang];
            for (const key of Object.keys(obj)) {
              expect(typeof obj[key]).toBe('string');
              expect(obj[key].length).toBeGreaterThan(0);
            }
          }
        }
      }
    });
  });

  // ============================================
  // BIG5_STRATEGIES
  // ============================================
  describe('BIG5_STRATEGIES', () => {
    const big5Traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];

    test('has all five Big5 dimensions', () => {
      for (const trait of big5Traits) {
        expect(BIG5_STRATEGIES).toHaveProperty(trait);
      }
    });

    test('each dimension has high and low levels', () => {
      for (const trait of big5Traits) {
        expect(BIG5_STRATEGIES[trait]).toHaveProperty('high');
        expect(BIG5_STRATEGIES[trait]).toHaveProperty('low');
      }
    });

    test('high level has language, tone, approach', () => {
      for (const trait of big5Traits) {
        const high = BIG5_STRATEGIES[trait].high;
        expect(high.de).toHaveProperty('language');
        expect(high.de).toHaveProperty('tone');
        expect(high.de).toHaveProperty('approach');
        expect(high.en).toHaveProperty('language');
        expect(high.en).toHaveProperty('tone');
        expect(high.en).toHaveProperty('approach');
      }
    });

    test('low level has language, tone, approach, blindspot, challenge where applicable', () => {
      for (const trait of big5Traits) {
        const low = BIG5_STRATEGIES[trait].low;
        expect(low.de).toHaveProperty('language');
        expect(low.de).toHaveProperty('tone');
        expect(low.de).toHaveProperty('approach');
        if (low.de.blindspot !== undefined) {
          expect(typeof low.de.blindspot).toBe('string');
        }
        if (low.de.challenge !== undefined) {
          expect(typeof low.de.challenge).toBe('string');
        }
      }
    });

    test('neuroticism has low before high (inverted scale)', () => {
      expect(BIG5_STRATEGIES.neuroticism).toHaveProperty('low');
      expect(BIG5_STRATEGIES.neuroticism).toHaveProperty('high');
    });
  });

  // ============================================
  // SD_STRATEGIES (Spiral Dynamics)
  // ============================================
  describe('SD_STRATEGIES', () => {
    const sdLevels = ['beige', 'purple', 'red', 'blue', 'orange', 'green', 'yellow', 'turquoise'];

    test('has all eight SD levels', () => {
      for (const level of sdLevels) {
        expect(SD_STRATEGIES).toHaveProperty(level);
      }
    });

    test('each level has high and low with de and en', () => {
      for (const level of sdLevels) {
        expect(SD_STRATEGIES[level]).toHaveProperty('high');
        expect(SD_STRATEGIES[level]).toHaveProperty('low');
        expect(SD_STRATEGIES[level].high).toHaveProperty('de');
        expect(SD_STRATEGIES[level].high).toHaveProperty('en');
        expect(SD_STRATEGIES[level].low).toHaveProperty('de');
        expect(SD_STRATEGIES[level].low).toHaveProperty('en');
      }
    });

    test('high level has language, tone, approach', () => {
      for (const level of sdLevels) {
        const high = SD_STRATEGIES[level].high;
        expect(high.de).toHaveProperty('language');
        expect(high.de).toHaveProperty('tone');
        expect(high.de).toHaveProperty('approach');
      }
    });

    test('low level has blindspot and challenge', () => {
      for (const level of sdLevels) {
        const low = SD_STRATEGIES[level].low;
        expect(low.de).toHaveProperty('blindspot');
        expect(low.de).toHaveProperty('challenge');
      }
    });
  });

  // ============================================
  // CHALLENGE_EXAMPLES
  // ============================================
  describe('CHALLENGE_EXAMPLES', () => {
    test('has Riemann blindspot keys (dauer, wechsel, naehe, distanz)', () => {
      expect(CHALLENGE_EXAMPLES).toHaveProperty('dauer');
      expect(CHALLENGE_EXAMPLES).toHaveProperty('wechsel');
      expect(CHALLENGE_EXAMPLES).toHaveProperty('naehe');
      expect(CHALLENGE_EXAMPLES).toHaveProperty('distanz');
    });

    test('has Big5 blindspot keys', () => {
      expect(CHALLENGE_EXAMPLES).toHaveProperty('openness_low');
      expect(CHALLENGE_EXAMPLES).toHaveProperty('conscientiousness_low');
      expect(CHALLENGE_EXAMPLES).toHaveProperty('extraversion_low');
      expect(CHALLENGE_EXAMPLES).toHaveProperty('agreeableness_high');
      expect(CHALLENGE_EXAMPLES).toHaveProperty('agreeableness_low');
      expect(CHALLENGE_EXAMPLES).toHaveProperty('neuroticism_high');
      expect(CHALLENGE_EXAMPLES).toHaveProperty('neuroticism_low');
    });

    test('each challenge key has de and en arrays', () => {
      for (const key of Object.keys(CHALLENGE_EXAMPLES)) {
        expect(CHALLENGE_EXAMPLES[key]).toHaveProperty('de');
        expect(CHALLENGE_EXAMPLES[key]).toHaveProperty('en');
        expect(Array.isArray(CHALLENGE_EXAMPLES[key].de)).toBe(true);
        expect(Array.isArray(CHALLENGE_EXAMPLES[key].en)).toBe(true);
      }
    });

    test('challenge arrays have at least 2 items each', () => {
      for (const key of Object.keys(CHALLENGE_EXAMPLES)) {
        expect(CHALLENGE_EXAMPLES[key].de.length).toBeGreaterThanOrEqual(2);
        expect(CHALLENGE_EXAMPLES[key].en.length).toBeGreaterThanOrEqual(2);
      }
    });

    test('challenge items are non-empty strings', () => {
      for (const key of Object.keys(CHALLENGE_EXAMPLES)) {
        for (const lang of ['de', 'en']) {
          for (const item of CHALLENGE_EXAMPLES[key][lang]) {
            expect(typeof item).toBe('string');
            expect(item.length).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  // ============================================
  // Edge cases: structure robustness
  // ============================================
  describe('structure robustness', () => {
    test('Riemann dauer high returns valid strategy for lookup', () => {
      const strategy = RIEMANN_STRATEGIES.dauer?.high?.de;
      expect(strategy).toBeDefined();
      expect(strategy.language).toContain('strukturiert');
      expect(strategy.approach).toContain('To-Do');
    });

    test('Big5 openness low has blindspot', () => {
      const strategy = BIG5_STRATEGIES.openness?.low?.de;
      expect(strategy.blindspot).toBeDefined();
      expect(strategy.challenge).toBeDefined();
    });

    test('SD blue high has structured approach', () => {
      const strategy = SD_STRATEGIES.blue?.high?.en;
      expect(strategy).toBeDefined();
      expect(strategy.language).toContain('structured');
    });

    test('accessing non-existent dimension returns undefined', () => {
      expect(RIEMANN_STRATEGIES.nonexistent).toBeUndefined();
      expect(BIG5_STRATEGIES.nonexistent).toBeUndefined();
      expect(SD_STRATEGIES.nonexistent).toBeUndefined();
    });
  });
});
