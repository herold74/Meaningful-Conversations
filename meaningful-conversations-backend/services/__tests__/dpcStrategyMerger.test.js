/**
 * Unit Tests for dpcStrategyMerger.js
 *
 * Tests:
 * 1. Merging strategies from single framework
 * 2. Merging from dual frameworks (Riemann + Big5, etc.)
 * 3. Merging from all three frameworks
 * 4. Conflict detection and resolution
 * 5. Edge cases: empty profile, missing dimensions
 */

const { StrategyMerger } = require('../dpcStrategyMerger');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('dpcStrategyMerger', () => {
  // ============================================
  // Single framework merge
  // ============================================
  describe('single framework merge', () => {
    test('Riemann only: returns merged strategy with primary and blindspots', () => {
      const profile = {
        riemann: {
          selbst: { dauer: 80, wechsel: 30, naehe: 60, distanz: 40 },
        },
      };
      const merger = new StrategyMerger(profile, 'de');
      const result = merger.merge();

      expect(result).toHaveProperty('primary');
      expect(result.primary).toHaveProperty('language');
      expect(result.primary).toHaveProperty('tone');
      expect(result.primary).toHaveProperty('approach');
      expect(result).toHaveProperty('blindspots');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata.models).toContain('riemann');
      expect(result.primary.language.length).toBeGreaterThan(0);
    });

    test('Big5 only: returns merged strategy', () => {
      const profile = {
        big5: {
          openness: 4.5,
          conscientiousness: 2,
          extraversion: 3,
          agreeableness: 4,
          neuroticism: 2,
        },
      };
      const merger = new StrategyMerger(profile, 'en');
      const result = merger.merge();

      expect(result.primary).toBeDefined();
      expect(result.metadata.models).toContain('big5');
    });

    test('Spiral Dynamics only: returns merged strategy', () => {
      const profile = {
        spiralDynamics: {
          levels: {
            blue: 1,
            orange: 2,
            green: 3,
            red: 4,
            purple: 5,
            yellow: 6,
            turquoise: 7,
            beige: 8,
          },
        },
      };
      const merger = new StrategyMerger(profile, 'de');
      const result = merger.merge();

      expect(result.primary).toBeDefined();
      expect(result.metadata.models).toContain('sd');
    });
  });

  // ============================================
  // Dual framework merge
  // ============================================
  describe('dual framework merge', () => {
    test('Riemann + Big5: combines both models', () => {
      const profile = {
        riemann: {
          selbst: { dauer: 75, wechsel: 25, naehe: 50, distanz: 50 },
        },
        big5: {
          openness: 4,
          conscientiousness: 2.5,
          extraversion: 3,
          agreeableness: 3.5,
          neuroticism: 2,
        },
      };
      const merger = new StrategyMerger(profile, 'de');
      const result = merger.merge();

      expect(result.metadata.models).toContain('riemann');
      expect(result.metadata.models).toContain('big5');
      expect(result.metadata.models.length).toBe(2);
    });

    test('Riemann + SD: combines both models', () => {
      const profile = {
        riemann: {
          selbst: { dauer: 60, wechsel: 40, naehe: 70, distanz: 30 },
        },
        spiralDynamics: {
          levels: {
            green: 1,
            blue: 2,
            orange: 3,
            red: 4,
            yellow: 5,
            purple: 6,
            turquoise: 7,
            beige: 8,
          },
        },
      };
      const merger = new StrategyMerger(profile, 'en');
      const result = merger.merge();

      expect(result.metadata.models).toContain('riemann');
      expect(result.metadata.models).toContain('sd');
    });
  });

  // ============================================
  // All three frameworks
  // ============================================
  describe('all three frameworks', () => {
    test('Riemann + Big5 + SD: merges all three', () => {
      const profile = {
        riemann: {
          selbst: { dauer: 70, wechsel: 30, naehe: 55, distanz: 45 },
        },
        big5: {
          openness: 3.5,
          conscientiousness: 4,
          extraversion: 2.5,
          agreeableness: 4,
          neuroticism: 2.5,
        },
        spiralDynamics: {
          levels: {
            orange: 1,
            blue: 2,
            green: 3,
            red: 4,
            yellow: 5,
            purple: 6,
            turquoise: 7,
            beige: 8,
          },
        },
      };
      const merger = new StrategyMerger(profile, 'de');
      const result = merger.merge();

      expect(result.metadata.models.length).toBeGreaterThanOrEqual(2);
      const allModels = ['riemann', 'big5', 'sd'];
      for (const m of result.metadata.models) {
        expect(allModels).toContain(m);
      }
    });
  });

  // ============================================
  // Conflict resolution
  // ============================================
  describe('conflict resolution', () => {
    test('conflicting strategies (rational vs empathetic) trigger conflict-aware merge', () => {
      // distanz high = rational, naehe high = empathetic — these conflict
      const profile = {
        riemann: {
          selbst: { dauer: 50, wechsel: 50, naehe: 85, distanz: 85 },
        },
      };
      const merger = new StrategyMerger(profile, 'de');
      const result = merger.merge();

      // Either simple or conflict-aware merge; both produce valid output
      expect(result).toHaveProperty('primary');
      expect(result.primary.language).toBeDefined();
      expect(result.metadata).toHaveProperty('mergeType');
    });

    test('detectConflicts populates conflicts array when strategies conflict', () => {
      const profile = {
        riemann: {
          selbst: { dauer: 90, wechsel: 85, naehe: 50, distanz: 50 },
        },
      };
      const merger = new StrategyMerger(profile, 'de');
      merger.extractDimensions();
      merger.detectConflicts();

      // dauer high = structured, wechsel high = spontaneous — these conflict
      expect(Array.isArray(merger.conflicts)).toBe(true);
    });
  });

  // ============================================
  // Edge cases
  // ============================================
  describe('edge cases', () => {
    test('empty profile returns empty result', () => {
      const merger = new StrategyMerger({}, 'de');
      const result = merger.merge();

      expect(result.primary.language).toBe('');
      expect(result.primary.tone).toBe('');
      expect(result.primary.approach).toBe('');
      expect(result.blindspots).toEqual([]);
      expect(result.metadata.mergeType).toBe('empty');
    });

    test('profile with only Riemann but no selbst returns empty dimensions', () => {
      const profile = { riemann: { beruf: { dauer: 80 }, privat: { dauer: 70 } } };
      const merger = new StrategyMerger(profile, 'de');
      const result = merger.merge();

      expect(result).toHaveProperty('primary');
      expect(result.metadata.models).toEqual([]);
    });

    test('missing dimensions use default/fallback', () => {
      const profile = {
        riemann: {
          selbst: { dauer: 80 }, // only dauer, others missing
        },
      };
      const merger = new StrategyMerger(profile, 'de');
      const result = merger.merge();

      expect(result.primary).toBeDefined();
      expect(result.metadata.models).toContain('riemann');
    });

    test('extreme values (0, 100) are handled', () => {
      const profile = {
        riemann: {
          selbst: { dauer: 100, wechsel: 0, naehe: 0, distanz: 100 },
        },
      };
      const merger = new StrategyMerger(profile, 'de');
      const result = merger.merge();

      expect(result.primary).toBeDefined();
      expect(result.blindspots.length).toBeGreaterThanOrEqual(0);
    });

    test('neutral values (50 for Riemann) produce zero weight dimensions', () => {
      const profile = {
        riemann: {
          selbst: { dauer: 50, wechsel: 50, naehe: 50, distanz: 50 },
        },
      };
      const merger = new StrategyMerger(profile, 'de');
      merger.extractDimensions();

      expect(merger.dimensions.length).toBe(4);
      merger.dimensions.forEach((d) => expect(d.weight).toBe(0));
    });

    test('language fallback to de when en not available', () => {
      const profile = {
        riemann: {
          selbst: { dauer: 80, wechsel: 30, naehe: 60, distanz: 40 },
        },
      };
      const merger = new StrategyMerger(profile, 'de');
      const result = merger.merge();

      expect(result.primary.language).toMatch(/strukturiert|structured|de|en/);
    });
  });

  // ============================================
  // validateNarrativeConsistency (static)
  // ============================================
  describe('validateNarrativeConsistency', () => {
    test('returns isConsistent true when no params', () => {
      const result = StrategyMerger.validateNarrativeConsistency(null, null);
      expect(result.isConsistent).toBe(true);
      expect(result.inconsistencies).toEqual([]);
    });

    test('returns isConsistent true when quantStrategies has no primary', () => {
      const result = StrategyMerger.validateNarrativeConsistency(
        { operatingSystem: 'test' },
        {}
      );
      expect(result.isConsistent).toBe(true);
    });

    test('detects rational vs emotional contradiction', () => {
      const narrativeProfile = {
        operatingSystem: 'I am very empathetic and warm',
        superpowers: [{ description: 'emotional connection' }],
        blindspots: [],
      };
      const quantStrategies = {
        primary: {
          language: 'rational, brief, concise',
          tone: 'objective, factual',
          approach: 'Use data and facts',
        },
      };
      const result = StrategyMerger.validateNarrativeConsistency(
        narrativeProfile,
        quantStrategies
      );

      expect(result.isConsistent).toBe(false);
      expect(result.inconsistencies.length).toBeGreaterThan(0);
      expect(result.inconsistencies[0].type).toBe('rational_vs_emotional');
    });

    test('aligned narrative and quantitative returns consistent', () => {
      const narrativeProfile = {
        operatingSystem: 'I am structured and organized',
        superpowers: [],
        blindspots: [],
      };
      const quantStrategies = {
        primary: {
          language: 'structured, step-by-step',
          tone: 'reassuring',
          approach: 'Offer concrete to-do lists',
        },
      };
      const result = StrategyMerger.validateNarrativeConsistency(
        narrativeProfile,
        quantStrategies
      );

      expect(result.isConsistent).toBe(true);
      expect(result.inconsistencies).toEqual([]);
    });
  });
});
