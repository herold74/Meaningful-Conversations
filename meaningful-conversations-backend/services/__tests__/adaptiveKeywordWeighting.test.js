const {
  analyzeAdaptive,
  getKeywordAdjustment,
  processKeywordDetection,
  calculateAdjustedWeight,
  getTopicBoost,
  getPatternBoost,
  calculateCoKeywordBoost
} = require('../adaptiveKeywordWeighting');

const { clearCache } = require('../sentimentAnalyzer');

describe('adaptiveKeywordWeighting', () => {

  beforeEach(() => {
    clearCache();
  });

  // ============================================
  // getTopicBoost
  // ============================================

  describe('getTopicBoost', () => {
    test('work topic boosts big5', () => {
      expect(getTopicBoost('work', 'big5')).toBe(1.3);
    });

    test('work topic reduces riemann', () => {
      expect(getTopicBoost('work', 'riemann')).toBe(0.9);
    });

    test('relationships topic boosts riemann', () => {
      expect(getTopicBoost('relationships', 'riemann')).toBe(1.3);
    });

    test('values topic boosts sd', () => {
      expect(getTopicBoost('values', 'sd')).toBe(1.4);
    });

    test('returns 1.0 for null topic', () => {
      expect(getTopicBoost(null, 'big5')).toBe(1.0);
    });

    test('returns 1.0 for unknown topic', () => {
      expect(getTopicBoost('unknown', 'big5')).toBe(1.0);
    });

    test('returns 1.0 for unknown framework in valid topic', () => {
      expect(getTopicBoost('work', 'unknownFramework')).toBe(1.0);
    });
  });

  // ============================================
  // getPatternBoost
  // ============================================

  describe('getPatternBoost', () => {
    test('trait pattern boosts big5', () => {
      expect(getPatternBoost('trait', 'big5')).toBe(1.4);
    });

    test('trait pattern reduces riemann', () => {
      expect(getPatternBoost('trait', 'riemann')).toBe(0.8);
    });

    test('value pattern boosts sd', () => {
      expect(getPatternBoost('value', 'sd')).toBe(1.4);
    });

    test('need pattern boosts riemann', () => {
      expect(getPatternBoost('need', 'riemann')).toBe(1.4);
    });

    test('returns 1.0 for null pattern', () => {
      expect(getPatternBoost(null, 'big5')).toBe(1.0);
    });

    test('returns 1.0 for unknown pattern', () => {
      expect(getPatternBoost('unknown', 'big5')).toBe(1.0);
    });
  });

  // ============================================
  // calculateCoKeywordBoost
  // ============================================

  describe('calculateCoKeywordBoost', () => {
    test('returns 1.0 for single keyword', () => {
      expect(calculateCoKeywordBoost(['team'], 'riemann')).toBe(1.0);
    });

    test('returns 1.0 for null input', () => {
      expect(calculateCoKeywordBoost(null, 'riemann')).toBe(1.0);
    });

    test('returns 1.0 for empty array', () => {
      expect(calculateCoKeywordBoost([], 'riemann')).toBe(1.0);
    });

    test('increases boost for same-framework co-keywords', () => {
      const boost = calculateCoKeywordBoost(['team', 'harmonie'], 'riemann');
      expect(boost).toBeGreaterThan(1.0);
    });

    test('boost scales with number of same-framework co-keywords', () => {
      const boost2 = calculateCoKeywordBoost(['team', 'harmonie'], 'riemann');
      const boost3 = calculateCoKeywordBoost(['team', 'harmonie', 'vertrauen'], 'riemann');
      expect(boost3).toBeGreaterThan(boost2);
    });
  });

  // ============================================
  // calculateAdjustedWeight
  // ============================================

  describe('calculateAdjustedWeight', () => {
    const emptyContext = {
      topic: null,
      linguisticPattern: null,
      sentenceContexts: []
    };

    test('returns base weight with empty context and no sentiment', () => {
      const weight = calculateAdjustedWeight(1.0, 'riemann', emptyContext, null);
      expect(weight).toBe(1.0);
    });

    test('applies topic boost when confidence > 0.3', () => {
      const context = {
        topic: { topic: 'work', confidence: 0.5 },
        linguisticPattern: null
      };
      const weight = calculateAdjustedWeight(1.0, 'big5', context, null);
      expect(weight).toBeGreaterThan(1.0);
    });

    test('does not apply topic boost when confidence <= 0.3', () => {
      const context = {
        topic: { topic: 'work', confidence: 0.2 },
        linguisticPattern: null
      };
      const weight = calculateAdjustedWeight(1.0, 'big5', context, null);
      expect(weight).toBe(1.0);
    });

    test('applies pattern boost when confidence > 0.5', () => {
      const context = {
        topic: null,
        linguisticPattern: { pattern: 'trait', confidence: 0.8 }
      };
      const weight = calculateAdjustedWeight(1.0, 'big5', context, null);
      expect(weight).toBeGreaterThan(1.0);
    });

    test('applies sentiment weight multiplier', () => {
      const sentiment = { weightMultiplier: 1.5 };
      const weight = calculateAdjustedWeight(1.0, 'riemann', emptyContext, sentiment);
      expect(weight).toBe(1.5);
    });

    test('caps primary weight at 1.5', () => {
      const context = {
        topic: { topic: 'values', confidence: 1.0 },
        linguisticPattern: { pattern: 'value', confidence: 1.0 }
      };
      const sentiment = { weightMultiplier: 1.5 };
      const weight = calculateAdjustedWeight(1.0, 'sd', context, sentiment);
      expect(weight).toBeLessThanOrEqual(1.5);
    });

    test('caps secondary weight at 0.8', () => {
      const context = {
        topic: { topic: 'values', confidence: 1.0 },
        linguisticPattern: { pattern: 'value', confidence: 1.0 }
      };
      const weight = calculateAdjustedWeight(0.4, 'sd', context, null);
      expect(weight).toBeLessThanOrEqual(0.8);
    });

    test('minimum weight is 0.05', () => {
      const sentiment = { weightMultiplier: 0.01 };
      const weight = calculateAdjustedWeight(0.3, 'riemann', emptyContext, sentiment);
      expect(weight).toBeGreaterThanOrEqual(0.05);
    });
  });

  // ============================================
  // processKeywordDetection
  // ============================================

  describe('processKeywordDetection', () => {
    const emptyContext = {
      topic: null,
      linguisticPattern: null,
      sentenceContexts: [],
      sentences: []
    };

    test('non-overlap keyword returns single detection', () => {
      const results = processKeywordDetection(
        'freizeit', 'Ich genieße meine Freizeit', 'riemann', 'wechsel', 'high', emptyContext, 'de'
      );
      expect(results.length).toBe(1);
      expect(results[0].framework).toBe('riemann');
      expect(results[0].dimension).toBe('wechsel');
      expect(results[0].isPrimary).toBe(true);
    });

    test('overlap keyword returns primary + secondary detections', () => {
      const results = processKeywordDetection(
        'team', 'Ich bin ein Team-Player', 'riemann', 'naehe', 'high', emptyContext, 'de'
      );
      expect(results.length).toBeGreaterThan(1);
      const primary = results.find(r => r.isPrimary);
      expect(primary.framework).toBe('riemann');
      expect(primary.dimension).toBe('naehe');
      const secondaries = results.filter(r => !r.isPrimary);
      expect(secondaries.length).toBeGreaterThan(0);
    });

    test('secondary detections have lower weights than primary', () => {
      const results = processKeywordDetection(
        'team', 'Ich arbeite gerne im Team', 'riemann', 'naehe', 'high', emptyContext, 'de'
      );
      const primary = results.find(r => r.isPrimary);
      const secondaries = results.filter(r => !r.isPrimary);
      for (const sec of secondaries) {
        expect(sec.weight).toBeLessThan(primary.weight);
      }
    });

    test('negation inverts direction for all detections', () => {
      const results = processKeywordDetection(
        'spontan', 'Ich bin nicht spontan', 'riemann', 'wechsel', 'high', emptyContext, 'de'
      );
      for (const detection of results) {
        expect(detection.direction).toBe('low');
      }
    });
  });

  // ============================================
  // analyzeAdaptive
  // ============================================

  describe('analyzeAdaptive', () => {
    test('returns context and sentiment for German message', () => {
      const result = analyzeAdaptive(
        'Ich bin in meinem Job sehr strukturiert.',
        ['Im Büro arbeite ich mit meinen Kollegen zusammen.'],
        'de'
      );
      expect(result.context).toBeDefined();
      expect(result.context).toHaveProperty('topic');
      expect(result.context).toHaveProperty('topicConfidence');
      expect(result.context).toHaveProperty('linguisticPattern');
      expect(result.context).toHaveProperty('sentenceCount');
      expect(result.sentiment).toBeDefined();
      expect(result.sentiment).toHaveProperty('polarity');
      expect(result.sentiment).toHaveProperty('emotionalContext');
      expect(result._fullContext).toBeDefined();
      expect(result._overlappingKeywords).toBeDefined();
    });

    test('returns context and sentiment for English message', () => {
      const result = analyzeAdaptive(
        'I am a very organized person at work.',
        ['My job involves a lot of teamwork.'],
        'en'
      );
      expect(result.context).toBeDefined();
      expect(result.sentiment).toBeDefined();
    });

    test('handles empty recent messages', () => {
      const result = analyzeAdaptive('Ein Satz.', [], 'de');
      expect(result.context).toBeDefined();
      expect(result.sentiment).toBeDefined();
    });

    test('handles null recent messages', () => {
      const result = analyzeAdaptive('Ein Satz.', null, 'de');
      expect(result.context).toBeDefined();
    });

    test('detects work topic from recent messages', () => {
      const result = analyzeAdaptive(
        'Mein Projekt läuft gut.',
        ['Im Büro habe ich ein Meeting mit dem Chef.', 'Die Deadline für den Job ist nächste Woche.'],
        'de'
      );
      expect(result.context.topic).toBe('work');
    });

    test('detects linguistic pattern', () => {
      const result = analyzeAdaptive('Ich bin ein kreativer Mensch.', [], 'de');
      expect(result.context.linguisticPattern).toBe('trait');
    });
  });

  // ============================================
  // getKeywordAdjustment
  // ============================================

  describe('getKeywordAdjustment', () => {
    test('returns default for null adaptiveResult', () => {
      const result = getKeywordAdjustment('team', 'Im Team', 'riemann', 'naehe', 'high', null, 'de');
      expect(result.weight).toBe(1.0);
      expect(result.direction).toBe('high');
      expect(result.isPrimary).toBe(true);
    });

    test('adjusts weight for overlap keyword in matching framework', () => {
      const adaptive = analyzeAdaptive('Ich arbeite gerne im Team.', [], 'de');
      const result = getKeywordAdjustment('team', 'Ich arbeite gerne im Team', 'riemann', 'naehe', 'high', adaptive, 'de');
      expect(result.direction).toBe('high');
      expect(result.isPrimary).toBe(true);
      expect(typeof result.weight).toBe('number');
    });

    test('returns low weight (0.2) for overlap keyword in non-matrix framework', () => {
      const adaptive = analyzeAdaptive('Team ist wichtig.', [], 'de');
      const result = getKeywordAdjustment('team', 'Team ist wichtig', 'sd', 'turquoise', 'high', adaptive, 'de');
      expect(result.weight).toBe(0.2);
      expect(result.isPrimary).toBe(false);
    });

    test('returns weight for non-overlap keyword', () => {
      const adaptive = analyzeAdaptive('Ich bin sehr fokussiert.', [], 'de');
      const result = getKeywordAdjustment('fokussiert', 'Ich bin sehr fokussiert', 'riemann', 'distanz', 'high', adaptive, 'de');
      expect(result.isPrimary).toBe(true);
      expect(result.weight).toBeGreaterThan(0);
    });
  });

  // ============================================
  // Integration: Realistic scenarios
  // ============================================

  describe('Integration', () => {
    test('full analysis of realistic German message', () => {
      const message = 'Ich schätze Harmonie und arbeite gerne im Team, aber mir fehlt manchmal die Struktur.';
      const recentMessages = ['Erzählen Sie mir von Ihrer Arbeit.'];

      const adaptive = analyzeAdaptive(message, recentMessages, 'de');

      expect(adaptive.context).toBeDefined();
      expect(adaptive.sentiment).toBeDefined();

      const harmonieAdj = getKeywordAdjustment('harmonie', message, 'riemann', 'naehe', 'high', adaptive, 'de');
      expect(harmonieAdj.direction).toBe('high');
      expect(harmonieAdj.weight).toBeGreaterThan(0);

      const teamAdj = getKeywordAdjustment('team', message, 'riemann', 'naehe', 'high', adaptive, 'de');
      expect(teamAdj.direction).toBe('high');
      expect(teamAdj.weight).toBeGreaterThan(0);

      const strukturAdj = getKeywordAdjustment('struktur', message, 'riemann', 'dauer', 'high', adaptive, 'de');
      expect(strukturAdj.direction).toBe('high');
      expect(strukturAdj.weight).toBeGreaterThan(0);
    });

    test('full analysis of realistic English message', () => {
      const message = 'I enjoy teamwork but I am not very spontaneous.';

      const adaptive = analyzeAdaptive(message, [], 'en');

      expect(adaptive.context).toBeDefined();
      expect(adaptive.sentiment).toBeDefined();
      expect(adaptive.sentiment.polarity).toBeDefined();
    });

    test('negation is correctly applied in full flow', () => {
      const message = 'Ich bin nicht spontan und nicht besonders kreativ.';
      const adaptive = analyzeAdaptive(message, [], 'de');

      const spontanAdj = getKeywordAdjustment('spontan', message, 'riemann', 'wechsel', 'high', adaptive, 'de');
      expect(spontanAdj.direction).toBe('low');

      const kreativAdj = getKeywordAdjustment('kreativ', message, 'big5', 'openness', 'high', adaptive, 'de');
      expect(kreativAdj.direction).toBe('low');
    });
  });
});
