/**
 * Keyword Weighting Matrix
 * 
 * Defines primary/secondary/tertiary weights for keywords that overlap
 * across multiple frameworks (Riemann, Big5, Spiral Dynamics).
 * 
 * Without weighting: "team" triggers Riemann-Nähe + SD-Green + Big5-Agreeableness equally (1.0 each)
 * With weighting: "team" → Riemann-Nähe: 1.0, SD-Green: 0.4, Big5-Agreeableness: 0.3
 * 
 * Format:
 *   keyword: {
 *     primary: { framework: 'riemann|big5|sd', dimension: '...', weight: 1.0 },
 *     secondary: [{ framework: '...', dimension: '...', weight: 0.3-0.6 }]
 *   }
 */

const KEYWORD_WEIGHT_MATRIX = {
  // ============================================
  // SOCIAL / TEAM / CLOSENESS KEYWORDS
  // ============================================
  'team': {
    primary: { framework: 'riemann', dimension: 'naehe', weight: 1.0 },
    secondary: [
      { framework: 'sd', dimension: 'green', weight: 0.4 },
      { framework: 'big5', dimension: 'agreeableness', weight: 0.3 }
    ]
  },
  'gemeinsam': {
    primary: { framework: 'riemann', dimension: 'naehe', weight: 1.0 },
    secondary: [
      { framework: 'sd', dimension: 'green', weight: 0.4 }
    ]
  },
  'gemeinschaft': {
    primary: { framework: 'sd', dimension: 'green', weight: 1.0 },
    secondary: [
      { framework: 'riemann', dimension: 'naehe', weight: 0.3 }
    ]
  },
  'harmonie': {
    primary: { framework: 'riemann', dimension: 'naehe', weight: 1.0 },
    secondary: [
      { framework: 'sd', dimension: 'green', weight: 0.5 },
      { framework: 'big5', dimension: 'agreeableness', weight: 0.4 }
    ]
  },
  'vertrauen': {
    primary: { framework: 'riemann', dimension: 'naehe', weight: 1.0 },
    secondary: [
      { framework: 'big5', dimension: 'agreeableness', weight: 0.4 }
    ]
  },
  'empathie': {
    primary: { framework: 'riemann', dimension: 'naehe', weight: 1.0 },
    secondary: [
      { framework: 'sd', dimension: 'green', weight: 0.5 },
      { framework: 'big5', dimension: 'agreeableness', weight: 0.5 }
    ]
  },
  'kooperation': {
    primary: { framework: 'sd', dimension: 'green', weight: 1.0 },
    secondary: [
      { framework: 'big5', dimension: 'agreeableness', weight: 0.5 },
      { framework: 'riemann', dimension: 'naehe', weight: 0.3 }
    ]
  },

  // ============================================
  // STRUCTURE / ORDER / STABILITY KEYWORDS
  // ============================================
  'struktur': {
    primary: { framework: 'riemann', dimension: 'dauer', weight: 1.0 },
    secondary: [
      { framework: 'sd', dimension: 'blue', weight: 0.5 },
      { framework: 'big5', dimension: 'conscientiousness', weight: 0.4 }
    ]
  },
  'ordnung': {
    primary: { framework: 'sd', dimension: 'blue', weight: 1.0 },
    secondary: [
      { framework: 'riemann', dimension: 'dauer', weight: 0.5 },
      { framework: 'big5', dimension: 'conscientiousness', weight: 0.4 }
    ]
  },
  'organisiert': {
    primary: { framework: 'big5', dimension: 'conscientiousness', weight: 1.0 },
    secondary: [
      { framework: 'riemann', dimension: 'dauer', weight: 0.4 },
      { framework: 'sd', dimension: 'blue', weight: 0.3 }
    ]
  },
  'disziplin': {
    primary: { framework: 'sd', dimension: 'blue', weight: 1.0 },
    secondary: [
      { framework: 'big5', dimension: 'conscientiousness', weight: 0.5 },
      { framework: 'riemann', dimension: 'dauer', weight: 0.4 }
    ]
  },
  'systematisch': {
    primary: { framework: 'big5', dimension: 'conscientiousness', weight: 1.0 },
    secondary: [
      { framework: 'riemann', dimension: 'dauer', weight: 0.5 }
    ]
  },
  'sicherheit': {
    primary: { framework: 'riemann', dimension: 'dauer', weight: 1.0 },
    secondary: [
      { framework: 'sd', dimension: 'blue', weight: 0.4 }
    ]
  },
  'stabilität': {
    primary: { framework: 'riemann', dimension: 'dauer', weight: 1.0 },
    secondary: [
      { framework: 'big5', dimension: 'neuroticism', weight: 0.3 }  // low neuroticism
    ]
  },
  'routine': {
    primary: { framework: 'riemann', dimension: 'dauer', weight: 1.0 },
    secondary: [
      { framework: 'big5', dimension: 'conscientiousness', weight: 0.3 }
    ]
  },

  // ============================================
  // FLEXIBILITY / CHANGE / OPENNESS KEYWORDS
  // ============================================
  'flexibel': {
    primary: { framework: 'riemann', dimension: 'wechsel', weight: 1.0 },
    secondary: [
      { framework: 'sd', dimension: 'yellow', weight: 0.6 },
      { framework: 'big5', dimension: 'openness', weight: 0.3 }
    ]
  },
  'kreativ': {
    primary: { framework: 'big5', dimension: 'openness', weight: 1.0 },
    secondary: [
      { framework: 'riemann', dimension: 'wechsel', weight: 0.4 },
      { framework: 'sd', dimension: 'yellow', weight: 0.3 }
    ]
  },
  'innovativ': {
    primary: { framework: 'sd', dimension: 'orange', weight: 1.0 },
    secondary: [
      { framework: 'big5', dimension: 'openness', weight: 0.5 },
      { framework: 'riemann', dimension: 'wechsel', weight: 0.3 }
    ]
  },
  'spontan': {
    primary: { framework: 'riemann', dimension: 'wechsel', weight: 1.0 },
    secondary: [
      { framework: 'big5', dimension: 'openness', weight: 0.3 }
    ]
  },
  'adaptiv': {
    primary: { framework: 'sd', dimension: 'yellow', weight: 1.0 },
    secondary: [
      { framework: 'riemann', dimension: 'wechsel', weight: 0.4 }
    ]
  },
  'dynamisch': {
    primary: { framework: 'sd', dimension: 'yellow', weight: 1.0 },
    secondary: [
      { framework: 'riemann', dimension: 'wechsel', weight: 0.4 }
    ]
  },
  'neugierig': {
    primary: { framework: 'big5', dimension: 'openness', weight: 1.0 },
    secondary: [
      { framework: 'riemann', dimension: 'wechsel', weight: 0.3 }
    ]
  },

  // ============================================
  // AUTONOMY / INDEPENDENCE KEYWORDS
  // ============================================
  'unabhängig': {
    primary: { framework: 'riemann', dimension: 'distanz', weight: 1.0 },
    secondary: [
      { framework: 'sd', dimension: 'red', weight: 0.4 }
    ]
  },
  'independent': {
    primary: { framework: 'riemann', dimension: 'distanz', weight: 1.0 },
    secondary: [
      { framework: 'sd', dimension: 'red', weight: 0.3 }
    ]
  },
  'eigenständig': {
    primary: { framework: 'riemann', dimension: 'distanz', weight: 1.0 },
    secondary: [
      { framework: 'big5', dimension: 'openness', weight: 0.3 }
    ]
  },
  'autonom': {
    primary: { framework: 'riemann', dimension: 'distanz', weight: 1.0 },
    secondary: [
      { framework: 'sd', dimension: 'yellow', weight: 0.4 }
    ]
  },

  // ============================================
  // ACHIEVEMENT / POWER KEYWORDS
  // ============================================
  'erfolg': {
    primary: { framework: 'sd', dimension: 'orange', weight: 1.0 },
    secondary: [
      { framework: 'big5', dimension: 'conscientiousness', weight: 0.3 }
    ]
  },
  'leistung': {
    primary: { framework: 'sd', dimension: 'orange', weight: 1.0 },
    secondary: [
      { framework: 'big5', dimension: 'conscientiousness', weight: 0.4 }
    ]
  },
  'macht': {
    primary: { framework: 'sd', dimension: 'red', weight: 1.0 },
    secondary: [
      { framework: 'sd', dimension: 'orange', weight: 0.4 }
    ]
  },
  'durchsetzung': {
    primary: { framework: 'sd', dimension: 'red', weight: 1.0 },
    secondary: [
      { framework: 'big5', dimension: 'extraversion', weight: 0.3 }
    ]
  },

  // ============================================
  // ANXIETY / DISTRESS KEYWORDS (cross: Neuroticism + Wechsel)
  // ============================================
  'anxious': {
    primary: { framework: 'big5', dimension: 'neuroticism', weight: 1.0 },
    secondary: [
      { framework: 'riemann', dimension: 'wechsel', weight: 0.3 }  // only when context = fear of change
    ]
  },
  'ängstlich': {
    primary: { framework: 'big5', dimension: 'neuroticism', weight: 1.0 },
    secondary: [
      { framework: 'riemann', dimension: 'wechsel', weight: 0.3 }
    ]
  },
  'overwhelmed': {
    primary: { framework: 'big5', dimension: 'neuroticism', weight: 1.0 },
    secondary: [
      { framework: 'riemann', dimension: 'wechsel', weight: 0.3 }
    ]
  },
  'überfordert': {
    primary: { framework: 'big5', dimension: 'neuroticism', weight: 1.0 },
    secondary: [
      { framework: 'riemann', dimension: 'wechsel', weight: 0.3 }
    ]
  },
  'trapped': {
    primary: { framework: 'big5', dimension: 'neuroticism', weight: 1.0 },
    secondary: [
      { framework: 'riemann', dimension: 'wechsel', weight: 0.5 }  // feeling trapped = strong change-resistance signal
    ]
  },
  'gefangen': {
    primary: { framework: 'big5', dimension: 'neuroticism', weight: 1.0 },
    secondary: [
      { framework: 'riemann', dimension: 'wechsel', weight: 0.5 }
    ]
  },

  // ============================================
  // SOCIAL / COMMUNICATION KEYWORDS
  // ============================================
  'gesellig': {
    primary: { framework: 'big5', dimension: 'extraversion', weight: 1.0 },
    secondary: [
      { framework: 'riemann', dimension: 'naehe', weight: 0.3 }
    ]
  },
  'kommunikativ': {
    primary: { framework: 'big5', dimension: 'extraversion', weight: 1.0 },
    secondary: [
      { framework: 'riemann', dimension: 'naehe', weight: 0.3 }
    ]
  },
};

/**
 * Get weight entry for a keyword (if it has overlaps)
 * @param {string} keyword - The keyword to check
 * @returns {object|null} Weight entry or null if no overlap defined
 */
function getKeywordWeights(keyword) {
  return KEYWORD_WEIGHT_MATRIX[keyword.toLowerCase()] || null;
}

/**
 * Check if a keyword has cross-framework overlaps
 * @param {string} keyword - The keyword to check
 * @returns {boolean}
 */
function hasOverlap(keyword) {
  return keyword.toLowerCase() in KEYWORD_WEIGHT_MATRIX;
}

/**
 * Get all overlapping keywords as a flat list
 * @returns {string[]}
 */
function getOverlappingKeywords() {
  return Object.keys(KEYWORD_WEIGHT_MATRIX);
}

module.exports = {
  KEYWORD_WEIGHT_MATRIX,
  getKeywordWeights,
  hasOverlap,
  getOverlappingKeywords
};
