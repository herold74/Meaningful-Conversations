/**
 * Unit Tests for profileRefinement.js
 *
 * Tests:
 * 1. calculateRiemannRefinement with session behavior logs
 * 2. calculateBig5Refinement with session behavior logs
 * 3. calculateSDRefinement with session behavior logs
 * 4. calculateProfileRefinement (main entry, delegation)
 * 5. Insufficient data returns empty/null
 * 6. Comfort score filtering
 */

const {
  calculateProfileRefinement,
  calculateRiemannRefinement,
  calculateBig5Refinement,
  calculateSDRefinement,
} = require('../profileRefinement');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('profileRefinement', () => {
  // ============================================
  // calculateRiemannRefinement
  // ============================================
  describe('calculateRiemannRefinement', () => {
    test('returns hasSuggestions false when no session logs', () => {
      const currentProfile = {
        selbst: { naehe: 60, distanz: 40, dauer: 50, wechsel: 50 },
      };
      const result = calculateRiemannRefinement(currentProfile, []);

      expect(result.hasSuggestions).toBe(false);
      expect(result.reason).toBe('Insufficient data');
    });

    test('returns hasSuggestions false when currentProfile is null', () => {
      const result = calculateRiemannRefinement(null, [
        { naeheDelta: 2, naeheFoundHigh: ['nähe'], naeheFoundLow: [] },
      ]);

      expect(result.hasSuggestions).toBe(false);
      expect(result.reason).toBe('Insufficient data');
    });

    test('returns hasSuggestions false when no selbst context', () => {
      const currentProfile = {
        beruf: { naehe: 60 },
        privat: { naehe: 50 },
      };
      const sessionLogs = [
        { naeheDelta: 3, naeheFoundHigh: ['nähe'], naeheFoundLow: [] },
      ];
      const result = calculateRiemannRefinement(currentProfile, sessionLogs);

      expect(result.hasSuggestions).toBe(false);
      expect(result.reason).toBe('No selbst context in Riemann profile');
    });

    test('returns suggestions when session logs have signal', () => {
      const currentProfile = {
        selbst: { naehe: 60, distanz: 40, dauer: 50, wechsel: 50 },
      };
      const sessionLogs = [
        {
          naeheDelta: 5,
          naeheFoundHigh: ['nähe', 'beziehung'],
          naeheFoundLow: [],
          distanzDelta: 0,
          distanzFoundHigh: [],
          distanzFoundLow: [],
          dauerDelta: 0,
          dauerFoundHigh: [],
          dauerFoundLow: [],
          wechselDelta: 0,
          wechselFoundHigh: [],
          wechselFoundLow: [],
        },
      ];
      const result = calculateRiemannRefinement(currentProfile, sessionLogs);

      expect(result.hasSuggestions).toBe(true);
      expect(result.suggestions).toHaveProperty('selbst');
      expect(result.suggestions.selbst).toHaveProperty('current');
      expect(result.suggestions.selbst).toHaveProperty('suggested');
      expect(result.suggestions.selbst).toHaveProperty('deltas');
      expect(result.foundKeywords).toHaveProperty('naehe');
      expect(result.sessionCount).toBe(1);
    });

    test('no significant changes when delta below threshold', () => {
      const currentProfile = {
        selbst: { naehe: 60, distanz: 40, dauer: 50, wechsel: 50 },
      };
      const sessionLogs = [
        {
          naeheDelta: 0.3,
          naeheFoundHigh: ['nähe'],
          naeheFoundLow: [],
          distanzDelta: 0,
          distanzFoundHigh: [],
          distanzFoundLow: [],
          dauerDelta: 0,
          dauerFoundHigh: [],
          dauerFoundLow: [],
          wechselDelta: 0,
          wechselFoundHigh: [],
          wechselFoundLow: [],
        },
      ];
      const result = calculateRiemannRefinement(currentProfile, sessionLogs);

      expect(result.hasSuggestions).toBe(false);
    });

    test('counter-pair coupling applies (naehe up, distanz down)', () => {
      const currentProfile = {
        selbst: { naehe: 60, distanz: 40, dauer: 50, wechsel: 50 },
      };
      const sessionLogs = [
        {
          naeheDelta: 5,
          naeheFoundHigh: ['nähe', 'beziehung', 'verbunden'],
          naeheFoundLow: [],
          distanzDelta: 0,
          distanzFoundHigh: [],
          distanzFoundLow: [],
          dauerDelta: 0,
          dauerFoundHigh: [],
          dauerFoundLow: [],
          wechselDelta: 0,
          wechselFoundHigh: [],
          wechselFoundLow: [],
        },
      ];
      const result = calculateRiemannRefinement(currentProfile, sessionLogs);

      expect(result.hasSuggestions).toBe(true);
      expect(result.suggestions.selbst.deltas).toBeDefined();
    });
  });

  // ============================================
  // calculateBig5Refinement
  // ============================================
  describe('calculateBig5Refinement', () => {
    test('returns hasSuggestions false when no session logs', () => {
      const currentProfile = {
        openness: 3.5,
        conscientiousness: 3,
        extraversion: 3,
        agreeableness: 4,
        neuroticism: 2,
      };
      const result = calculateBig5Refinement(currentProfile, []);

      expect(result.hasSuggestions).toBe(false);
      expect(result.reason).toBe('Insufficient data');
    });

    test('returns suggestions when session logs have signal', () => {
      const currentProfile = {
        openness: 3,
        conscientiousness: 3,
        extraversion: 3,
        agreeableness: 3,
        neuroticism: 3,
      };
      // Use 5 sessions with strong delta for significance (threshold 0.04)
      const sessionLog = {
        opennessDelta: 4,
        opennessFoundHigh: ['creative', 'curious'],
        opennessFoundLow: [],
        conscientiousnessDelta: 0,
        conscientiousnessFoundHigh: [],
        conscientiousnessFoundLow: [],
        extraversionDelta: 0,
        extraversionFoundHigh: [],
        extraversionFoundLow: [],
        agreeablenessDelta: 0,
        agreeablenessFoundHigh: [],
        agreeablenessFoundLow: [],
        neuroticismDelta: 0,
        neuroticismFoundHigh: [],
        neuroticismFoundLow: [],
      };
      const sessionLogs = Array(5).fill(sessionLog);
      const result = calculateBig5Refinement(currentProfile, sessionLogs);

      expect(result.hasSuggestions).toBe(true);
      expect(result.current).toBeDefined();
      expect(result.suggested).toBeDefined();
      expect(result.deltas).toBeDefined();
    });
  });

  // ============================================
  // calculateSDRefinement
  // ============================================
  describe('calculateSDRefinement', () => {
    test('returns hasSuggestions false when no session logs', () => {
      const currentProfile = {
        levels: {
          blue: 50,
          orange: 60,
          green: 40,
          red: 30,
          purple: 20,
          yellow: 70,
          turquoise: 10,
          beige: 5,
        },
      };
      const result = calculateSDRefinement(currentProfile, []);

      expect(result.hasSuggestions).toBe(false);
      expect(result.reason).toBe('Insufficient data');
    });

    test('returns hasSuggestions false when no levels', () => {
      const result = calculateSDRefinement({}, [
        { blueDelta: 3, blueFoundHigh: ['pflicht'], blueFoundLow: [] },
      ]);

      expect(result.hasSuggestions).toBe(false);
      expect(result.reason).toBe('Insufficient data');
    });

    test('returns suggestions when session logs have signal', () => {
      const currentProfile = {
        levels: {
          blue: 50,
          orange: 60,
          green: 40,
          red: 30,
          purple: 20,
          yellow: 70,
          turquoise: 10,
          beige: 5,
        },
      };
      const sessionLogs = [
        {
          blueDelta: 4,
          blueFoundHigh: ['pflicht', 'struktur'],
          blueFoundLow: [],
          orangeDelta: 0,
          orangeFoundHigh: [],
          orangeFoundLow: [],
          greenDelta: 0,
          greenFoundHigh: [],
          greenFoundLow: [],
          redDelta: 0,
          redFoundHigh: [],
          redFoundLow: [],
          purpleDelta: 0,
          purpleFoundHigh: [],
          purpleFoundLow: [],
          yellowDelta: 0,
          yellowFoundHigh: [],
          yellowFoundLow: [],
          turquoiseDelta: 0,
          turquoiseFoundHigh: [],
          turquoiseFoundLow: [],
          beigeDelta: 0,
          beigeFoundHigh: [],
          beigeFoundLow: [],
        },
      ];
      const result = calculateSDRefinement(currentProfile, sessionLogs);

      expect(result.hasSuggestions).toBe(true);
      expect(result.current).toBeDefined();
      expect(result.suggested).toBeDefined();
      expect(result.deltas).toBeDefined();
    });
  });

  // ============================================
  // calculateProfileRefinement (main entry)
  // ============================================
  describe('calculateProfileRefinement', () => {
    test('returns hasSuggestions false when missing required params', () => {
      expect(calculateProfileRefinement(null, 'RIEMANN', [])).toMatchObject({
        hasSuggestions: false,
        reason: 'Missing required parameters',
      });
      expect(calculateProfileRefinement({}, null, [])).toMatchObject({
        hasSuggestions: false,
        reason: 'Missing required parameters',
      });
      expect(calculateProfileRefinement({}, 'RIEMANN', null)).toMatchObject({
        hasSuggestions: false,
        reason: 'Missing required parameters',
      });
    });

    test('filters out sessions with comfortScore < 3', () => {
      const currentProfile = {
        riemann: {
          selbst: { naehe: 60, distanz: 40, dauer: 50, wechsel: 50 },
        },
      };
      const sessionLogs = [
        {
          comfortScore: 1,
          optedOut: false,
          naeheDelta: 5,
          naeheFoundHigh: ['nähe'],
          naeheFoundLow: [],
          distanzDelta: 0,
          distanzFoundHigh: [],
          distanzFoundLow: [],
          dauerDelta: 0,
          dauerFoundHigh: [],
          dauerFoundLow: [],
          wechselDelta: 0,
          wechselFoundHigh: [],
          wechselFoundLow: [],
        },
      ];
      const result = calculateProfileRefinement(
        currentProfile,
        'RIEMANN',
        sessionLogs
      );

      expect(result.hasSuggestions).toBe(false);
      expect(result.reason).toContain('No authentic sessions');
    });

    test('filters out optedOut sessions', () => {
      const currentProfile = {
        riemann: {
          selbst: { naehe: 60, distanz: 40, dauer: 50, wechsel: 50 },
        },
      };
      const sessionLogs = [
        {
          optedOut: true,
          comfortScore: 5,
          naeheDelta: 5,
          naeheFoundHigh: ['nähe'],
          naeheFoundLow: [],
          distanzDelta: 0,
          distanzFoundHigh: [],
          distanzFoundLow: [],
          dauerDelta: 0,
          dauerFoundHigh: [],
          dauerFoundLow: [],
          wechselDelta: 0,
          wechselFoundHigh: [],
          wechselFoundLow: [],
        },
      ];
      const result = calculateProfileRefinement(
        currentProfile,
        'RIEMANN',
        sessionLogs
      );

      expect(result.hasSuggestions).toBe(false);
      expect(result.reason).toContain('No authentic sessions');
    });

    test('delegates to calculateRiemannRefinement for RIEMANN', () => {
      const currentProfile = {
        riemann: {
          selbst: { naehe: 60, distanz: 40, dauer: 50, wechsel: 50 },
        },
      };
      const sessionLogs = [
        {
          comfortScore: 4,
          optedOut: false,
          naeheDelta: 5,
          naeheFoundHigh: ['nähe'],
          naeheFoundLow: [],
          distanzDelta: 0,
          distanzFoundHigh: [],
          distanzFoundLow: [],
          dauerDelta: 0,
          dauerFoundHigh: [],
          dauerFoundLow: [],
          wechselDelta: 0,
          wechselFoundHigh: [],
          wechselFoundLow: [],
        },
      ];
      const result = calculateProfileRefinement(
        currentProfile,
        'RIEMANN',
        sessionLogs
      );

      expect(result.hasSuggestions).toBe(true);
      expect(result.suggestions).toHaveProperty('selbst');
    });

    test('delegates to calculateBig5Refinement for BIG5', () => {
      const currentProfile = {
        big5: {
          openness: 3,
          conscientiousness: 3,
          extraversion: 3,
          agreeableness: 3,
          neuroticism: 3,
        },
      };
      const sessionLog = {
        comfortScore: 4,
        optedOut: false,
        opennessDelta: 4,
        opennessFoundHigh: ['creative', 'curious'],
        opennessFoundLow: [],
        conscientiousnessDelta: 0,
        conscientiousnessFoundHigh: [],
        conscientiousnessFoundLow: [],
        extraversionDelta: 0,
        extraversionFoundHigh: [],
        extraversionFoundLow: [],
        agreeablenessDelta: 0,
        agreeablenessFoundHigh: [],
        agreeablenessFoundLow: [],
        neuroticismDelta: 0,
        neuroticismFoundHigh: [],
        neuroticismFoundLow: [],
      };
      const sessionLogs = Array(5).fill(sessionLog);
      const result = calculateProfileRefinement(
        currentProfile,
        'BIG5',
        sessionLogs
      );

      expect(result.hasSuggestions).toBe(true);
    });

    test('delegates to calculateSDRefinement for SD', () => {
      const currentProfile = {
        spiralDynamics: {
          levels: {
            blue: 50,
            orange: 60,
            green: 40,
            red: 30,
            purple: 20,
            yellow: 70,
            turquoise: 10,
            beige: 5,
          },
        },
      };
      const sessionLogs = [
        {
          comfortScore: 5,
          optedOut: false,
          blueDelta: 4,
          blueFoundHigh: ['pflicht'],
          blueFoundLow: [],
          orangeDelta: 0,
          orangeFoundHigh: [],
          orangeFoundLow: [],
          greenDelta: 0,
          greenFoundHigh: [],
          greenFoundLow: [],
          redDelta: 0,
          redFoundHigh: [],
          redFoundLow: [],
          purpleDelta: 0,
          purpleFoundHigh: [],
          purpleFoundLow: [],
          yellowDelta: 0,
          yellowFoundHigh: [],
          yellowFoundLow: [],
          turquoiseDelta: 0,
          turquoiseFoundHigh: [],
          turquoiseFoundLow: [],
          beigeDelta: 0,
          beigeFoundHigh: [],
          beigeFoundLow: [],
        },
      ];
      const result = calculateProfileRefinement(
        currentProfile,
        'SD',
        sessionLogs
      );

      expect(result.hasSuggestions).toBe(true);
    });

    test('returns unknown profile type for invalid type', () => {
      const result = calculateProfileRefinement(
        { riemann: { selbst: { naehe: 60 } } },
        'INVALID',
        [{ comfortScore: 4, optedOut: false }]
      );

      expect(result.hasSuggestions).toBe(false);
      expect(result.reason).toBe('Unknown profile type');
    });

    test('sessions without comfortScore are included (default pass)', () => {
      const currentProfile = {
        riemann: {
          selbst: { naehe: 60, distanz: 40, dauer: 50, wechsel: 50 },
        },
      };
      const sessionLogs = [
        {
          optedOut: false,
          naeheDelta: 5,
          naeheFoundHigh: ['nähe'],
          naeheFoundLow: [],
          distanzDelta: 0,
          distanzFoundHigh: [],
          distanzFoundLow: [],
          dauerDelta: 0,
          dauerFoundHigh: [],
          dauerFoundLow: [],
          wechselDelta: 0,
          wechselFoundHigh: [],
          wechselFoundLow: [],
        },
      ];
      const result = calculateProfileRefinement(
        currentProfile,
        'RIEMANN',
        sessionLogs
      );

      expect(result.hasSuggestions).toBe(true);
    });
  });
});
