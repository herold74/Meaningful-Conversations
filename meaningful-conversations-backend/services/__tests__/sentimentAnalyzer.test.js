const {
  analyzeSentiment,
  analyzeKeywordSentiment,
  calculateSentiment,
  detectEmotionalContext,
  isNegated,
  detectIntensity,
  clearCache,
  NEGATION_WORDS,
  POSITIVE_INDICATORS,
  NEGATIVE_INDICATORS
} = require('../sentimentAnalyzer');

describe('sentimentAnalyzer', () => {

  beforeEach(() => {
    clearCache();
  });

  // ============================================
  // isNegated
  // ============================================

  describe('isNegated', () => {
    test('detects "nicht" before keyword (German)', () => {
      const words = ['ich', 'bin', 'nicht', 'spontan'];
      expect(isNegated(words, 3, 'de')).toBe(true);
    });

    test('detects "kein" before keyword (German)', () => {
      const words = ['das', 'ist', 'kein', 'problem'];
      expect(isNegated(words, 3, 'de')).toBe(true);
    });

    test('detects "nie" before keyword (German)', () => {
      const words = ['ich', 'war', 'nie', 'strukturiert'];
      expect(isNegated(words, 3, 'de')).toBe(true);
    });

    test('returns false when no negation present', () => {
      const words = ['ich', 'bin', 'sehr', 'spontan'];
      expect(isNegated(words, 3, 'de')).toBe(false);
    });

    test('only checks within negation window (3 words)', () => {
      const words = ['nicht', 'der', 'punkt', 'ist', 'eigentlich', 'spontan'];
      expect(isNegated(words, 5, 'de')).toBe(false);
    });

    test('detects "not" in English', () => {
      const words = ['i', 'am', 'not', 'spontaneous'];
      expect(isNegated(words, 3, 'en')).toBe(true);
    });

    test('detects "never" in English', () => {
      const words = ['i', 'never', 'felt', 'comfortable'];
      expect(isNegated(words, 3, 'en')).toBe(true);
    });

    test('returns false for position 0 (no words before)', () => {
      const words = ['spontan', 'bin', 'ich'];
      expect(isNegated(words, 0, 'de')).toBe(false);
    });
  });

  // ============================================
  // detectIntensity
  // ============================================

  describe('detectIntensity', () => {
    test('detects "sehr" as high intensity (German)', () => {
      const words = ['ich', 'bin', 'sehr', 'strukturiert'];
      expect(detectIntensity(words, 3, 'de')).toBe('high');
    });

    test('detects "extrem" as high intensity (German)', () => {
      const words = ['das', 'ist', 'extrem', 'wichtig'];
      expect(detectIntensity(words, 3, 'de')).toBe('high');
    });

    test('detects "etwas" as low intensity (German)', () => {
      const words = ['ich', 'bin', 'etwas', 'nervös'];
      expect(detectIntensity(words, 3, 'de')).toBe('low');
    });

    test('returns neutral when no modifier', () => {
      const words = ['ich', 'bin', 'auch', 'nervös'];
      expect(detectIntensity(words, 3, 'de')).toBe('neutral');
    });

    test('detects "very" in English', () => {
      const words = ['i', 'am', 'very', 'organized'];
      expect(detectIntensity(words, 3, 'en')).toBe('high');
    });

    test('detects "slightly" in English', () => {
      const words = ['i', 'am', 'slightly', 'nervous'];
      expect(detectIntensity(words, 3, 'en')).toBe('low');
    });

    test('returns neutral for position 0', () => {
      const words = ['nervös'];
      expect(detectIntensity(words, 0, 'de')).toBe('neutral');
    });
  });

  // ============================================
  // calculateSentiment
  // ============================================

  describe('calculateSentiment', () => {
    test('returns positive polarity for positive sentence (German)', () => {
      const result = calculateSentiment('Ich liebe es und bin sehr glücklich', 'de');
      expect(result).toBeGreaterThan(0);
    });

    test('returns negative polarity for negative sentence (German)', () => {
      const result = calculateSentiment('Das nervt mich und belastet mich sehr', 'de');
      expect(result).toBeLessThan(0);
    });

    test('returns 0 for neutral sentence', () => {
      const result = calculateSentiment('Ich gehe nach Hause', 'de');
      expect(result).toBe(0);
    });

    test('handles negation in sentiment', () => {
      const positive = calculateSentiment('Das ist gut', 'de');
      const negated = calculateSentiment('Das ist nicht gut', 'de');
      expect(negated).toBeLessThan(positive);
    });

    test('returns positive polarity in English', () => {
      const result = calculateSentiment('I love this and feel great', 'en');
      expect(result).toBeGreaterThan(0);
    });

    test('returns negative polarity in English', () => {
      const result = calculateSentiment('I am stressed and frustrated', 'en');
      expect(result).toBeLessThan(0);
    });

    test('returns 0 for empty string', () => {
      expect(calculateSentiment('', 'de')).toBe(0);
    });

    test('returns 0 for null', () => {
      expect(calculateSentiment(null, 'de')).toBe(0);
    });

    test('polarity is between -1.0 and 1.0', () => {
      const result = calculateSentiment(
        'Ich liebe es, bin glücklich, dankbar, begeistert, stolz und zufrieden',
        'de'
      );
      expect(result).toBeGreaterThanOrEqual(-1.0);
      expect(result).toBeLessThanOrEqual(1.0);
    });
  });

  // ============================================
  // detectEmotionalContext
  // ============================================

  describe('detectEmotionalContext', () => {
    test('detects desired_positive for "Ich genieße..."', () => {
      const result = detectEmotionalContext('Ich genieße die Ruhe', 0.5, 'de');
      expect(result).toBe('desired_positive');
    });

    test('detects desired_negative for desire with negative sentiment', () => {
      const result = detectEmotionalContext('Ich möchte nicht mehr leiden', -0.3, 'de');
      expect(result).toBe('desired_negative');
    });

    test('detects suffering for "Ich leide..."', () => {
      const result = detectEmotionalContext('Ich leide unter dem Stress', -0.5, 'de');
      expect(result).toBe('suffering');
    });

    test('detects suffering for strong negative sentiment without pattern', () => {
      const result = detectEmotionalContext('Alles ist schlecht', -0.5, 'de');
      expect(result).toBe('suffering');
    });

    test('detects positive for positive sentiment without specific pattern', () => {
      const result = detectEmotionalContext('Alles läuft wirklich super heute', 0.5, 'de');
      expect(result).toBe('positive');
    });

    test('returns neutral for neutral input', () => {
      const result = detectEmotionalContext('Ich gehe nach Hause', 0, 'de');
      expect(result).toBe('neutral');
    });

    test('returns neutral for null input', () => {
      const result = detectEmotionalContext(null, 0, 'de');
      expect(result).toBe('neutral');
    });

    test('works in English', () => {
      const result = detectEmotionalContext('I enjoy being alone', 0.5, 'en');
      expect(result).toBe('desired_positive');
    });
  });

  // ============================================
  // analyzeKeywordSentiment
  // ============================================

  describe('analyzeKeywordSentiment', () => {
    test('inverts direction when keyword is negated', () => {
      const result = analyzeKeywordSentiment(
        'spontan', 'Ich bin nicht spontan', 'high', 'de'
      );
      expect(result.negated).toBe(true);
      expect(result.adjustedDirection).toBe('low');
    });

    test('keeps direction when not negated', () => {
      const result = analyzeKeywordSentiment(
        'spontan', 'Ich bin spontan', 'high', 'de'
      );
      expect(result.negated).toBe(false);
      expect(result.adjustedDirection).toBe('high');
    });

    test('increases weight with high intensity', () => {
      const result = analyzeKeywordSentiment(
        'strukturiert', 'Ich bin sehr strukturiert', 'high', 'de'
      );
      expect(result.intensity).toBe('high');
      expect(result.weightMultiplier).toBeGreaterThan(1.0);
    });

    test('decreases weight with low intensity', () => {
      const result = analyzeKeywordSentiment(
        'nervös', 'Ich bin etwas nervös', 'high', 'de'
      );
      expect(result.intensity).toBe('low');
      expect(result.weightMultiplier).toBeLessThan(1.0);
    });

    test('returns default for null sentence', () => {
      const result = analyzeKeywordSentiment('team', null, 'high', 'de');
      expect(result.adjustedDirection).toBe('high');
      expect(result.weightMultiplier).toBe(1.0);
      expect(result.negated).toBe(false);
    });

    test('returns default for null keyword', () => {
      const result = analyzeKeywordSentiment(null, 'Ein Satz', 'high', 'de');
      expect(result.adjustedDirection).toBe('high');
      expect(result.weightMultiplier).toBe(1.0);
    });

    test('reduces weight for rejected high keyword in suffering context', () => {
      // Strong negative context: "nervt" + "belastet" + "frustriert" -> suffering
      const result = analyzeKeywordSentiment(
        'team', 'Das Team nervt mich, belastet und frustriert mich', 'high', 'de'
      );
      expect(result.weightMultiplier).toBeLessThan(1.0);
    });

    test('weightMultiplier stays within bounds (0.1 to 2.0)', () => {
      const result = analyzeKeywordSentiment(
        'strukturiert', 'Ich bin extrem sehr total strukturiert und liebe es', 'high', 'de'
      );
      expect(result.weightMultiplier).toBeGreaterThanOrEqual(0.1);
      expect(result.weightMultiplier).toBeLessThanOrEqual(2.0);
    });

    test('works in English with negation', () => {
      const result = analyzeKeywordSentiment(
        'spontaneous', 'I am not spontaneous', 'high', 'en'
      );
      expect(result.negated).toBe(true);
      expect(result.adjustedDirection).toBe('low');
    });
  });

  // ============================================
  // analyzeSentiment (full message + caching)
  // ============================================

  describe('analyzeSentiment', () => {
    test('returns full analysis object', () => {
      const result = analyzeSentiment('Ich liebe Teamwork', 'de');
      expect(result).toHaveProperty('polarity');
      expect(result).toHaveProperty('emotionalContext');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('isAmbiguous');
    });

    test('positive message has positive polarity', () => {
      const result = analyzeSentiment('Ich bin sehr glücklich und zufrieden', 'de');
      expect(result.polarity).toBeGreaterThan(0);
      expect(result.isAmbiguous).toBe(false);
    });

    test('negative message has negative polarity', () => {
      const result = analyzeSentiment('Ich bin gestresst und frustriert', 'de');
      expect(result.polarity).toBeLessThan(0);
    });

    test('neutral message is ambiguous', () => {
      const result = analyzeSentiment('Ich gehe morgen einkaufen', 'de');
      expect(result.isAmbiguous).toBe(true);
    });

    test('returns neutral for empty string', () => {
      const result = analyzeSentiment('', 'de');
      expect(result.polarity).toBe(0);
      expect(result.isAmbiguous).toBe(true);
    });

    test('returns neutral for null', () => {
      const result = analyzeSentiment(null, 'de');
      expect(result.polarity).toBe(0);
    });
  });

  // ============================================
  // Cache behavior
  // ============================================

  describe('Cache', () => {
    test('clearCache empties the cache', () => {
      analyzeSentiment('Test message for cache', 'de');
      const cached = analyzeSentiment('Test message for cache', 'de');
      expect(cached.fromCache).toBe(true);
      clearCache();
      const fresh = analyzeSentiment('Test message for cache', 'de');
      expect(fresh.fromCache).toBeUndefined();
    });

    test('second call returns cached result', () => {
      const first = analyzeSentiment('Ich bin zufrieden', 'de');
      const second = analyzeSentiment('Ich bin zufrieden', 'de');
      expect(second.fromCache).toBe(true);
      expect(second.polarity).toBe(first.polarity);
    });
  });

  // ============================================
  // Constants
  // ============================================

  describe('Constants', () => {
    test('NEGATION_WORDS has de and en', () => {
      expect(NEGATION_WORDS.de).toBeDefined();
      expect(NEGATION_WORDS.en).toBeDefined();
      expect(NEGATION_WORDS.de.length).toBeGreaterThan(0);
      expect(NEGATION_WORDS.en.length).toBeGreaterThan(0);
    });

    test('POSITIVE_INDICATORS has de and en', () => {
      expect(POSITIVE_INDICATORS.de).toBeDefined();
      expect(POSITIVE_INDICATORS.en).toBeDefined();
      expect(POSITIVE_INDICATORS.de.length).toBeGreaterThan(5);
    });

    test('NEGATIVE_INDICATORS has de and en', () => {
      expect(NEGATIVE_INDICATORS.de).toBeDefined();
      expect(NEGATIVE_INDICATORS.en).toBeDefined();
      expect(NEGATIVE_INDICATORS.de.length).toBeGreaterThan(5);
    });
  });
});
