const {
  KEYWORD_WEIGHT_MATRIX,
  getKeywordWeights,
  hasOverlap,
  getOverlappingKeywords
} = require('../keywordWeightingMatrix');

describe('keywordWeightingMatrix', () => {

  // ============================================
  // KEYWORD_WEIGHT_MATRIX structure
  // ============================================

  describe('KEYWORD_WEIGHT_MATRIX', () => {
    test('contains at least 20 overlapping keywords', () => {
      const keys = Object.keys(KEYWORD_WEIGHT_MATRIX);
      expect(keys.length).toBeGreaterThanOrEqual(20);
    });

    test('every entry has primary with framework, dimension, and weight', () => {
      for (const [keyword, entry] of Object.entries(KEYWORD_WEIGHT_MATRIX)) {
        expect(entry.primary).toBeDefined();
        expect(entry.primary.framework).toBeDefined();
        expect(entry.primary.dimension).toBeDefined();
        expect(typeof entry.primary.weight).toBe('number');
        expect(entry.primary.weight).toBeGreaterThan(0);
        expect(entry.primary.weight).toBeLessThanOrEqual(1.0);
      }
    });

    test('every entry has secondary as an array', () => {
      for (const [keyword, entry] of Object.entries(KEYWORD_WEIGHT_MATRIX)) {
        expect(Array.isArray(entry.secondary)).toBe(true);
        expect(entry.secondary.length).toBeGreaterThan(0);
      }
    });

    test('secondary weights are lower than primary weights', () => {
      for (const [keyword, entry] of Object.entries(KEYWORD_WEIGHT_MATRIX)) {
        for (const sec of entry.secondary) {
          expect(sec.weight).toBeLessThanOrEqual(entry.primary.weight);
        }
      }
    });

    test('frameworks are valid values', () => {
      const validFrameworks = ['riemann', 'big5', 'sd'];
      for (const [keyword, entry] of Object.entries(KEYWORD_WEIGHT_MATRIX)) {
        expect(validFrameworks).toContain(entry.primary.framework);
        for (const sec of entry.secondary) {
          expect(validFrameworks).toContain(sec.framework);
        }
      }
    });
  });

  // ============================================
  // getKeywordWeights
  // ============================================

  describe('getKeywordWeights', () => {
    test('returns weight entry for known overlap keyword "team"', () => {
      const result = getKeywordWeights('team');
      expect(result).not.toBeNull();
      expect(result.primary.framework).toBe('riemann');
      expect(result.primary.dimension).toBe('naehe');
      expect(result.primary.weight).toBe(1.0);
      expect(result.secondary.length).toBeGreaterThan(0);
    });

    test('returns weight entry for "struktur"', () => {
      const result = getKeywordWeights('struktur');
      expect(result).not.toBeNull();
      expect(result.primary.framework).toBe('riemann');
      expect(result.primary.dimension).toBe('dauer');
    });

    test('returns null for unknown keyword', () => {
      const result = getKeywordWeights('xyznonexistent');
      expect(result).toBeNull();
    });

    test('is case-insensitive', () => {
      const lower = getKeywordWeights('team');
      const upper = getKeywordWeights('TEAM');
      const mixed = getKeywordWeights('Team');
      expect(lower).toEqual(upper);
      expect(lower).toEqual(mixed);
    });

    test('returns null for empty string', () => {
      const result = getKeywordWeights('');
      expect(result).toBeNull();
    });
  });

  // ============================================
  // hasOverlap
  // ============================================

  describe('hasOverlap', () => {
    test('returns true for known overlap keyword', () => {
      expect(hasOverlap('team')).toBe(true);
      expect(hasOverlap('harmonie')).toBe(true);
      expect(hasOverlap('struktur')).toBe(true);
    });

    test('returns false for non-overlap keyword', () => {
      expect(hasOverlap('xyznonexistent')).toBe(false);
      expect(hasOverlap('freizeit')).toBe(false);
    });

    test('is case-insensitive', () => {
      expect(hasOverlap('TEAM')).toBe(true);
      expect(hasOverlap('Team')).toBe(true);
    });
  });

  // ============================================
  // getOverlappingKeywords
  // ============================================

  describe('getOverlappingKeywords', () => {
    test('returns an array of strings', () => {
      const result = getOverlappingKeywords();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(typeof result[0]).toBe('string');
    });

    test('contains known overlap keywords', () => {
      const result = getOverlappingKeywords();
      expect(result).toContain('team');
      expect(result).toContain('struktur');
      expect(result).toContain('harmonie');
      expect(result).toContain('flexibel');
    });

    test('has same count as KEYWORD_WEIGHT_MATRIX keys', () => {
      const result = getOverlappingKeywords();
      expect(result.length).toBe(Object.keys(KEYWORD_WEIGHT_MATRIX).length);
    });
  });
});
