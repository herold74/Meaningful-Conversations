// Behavior Logger for DPFL (Dynamic Profile Feedback Loop)
// Analyzes user messages for personality dimension markers
// Uses bidirectional keywords (high/low) for accurate profile refinement
// Phase 2a: Enhanced with adaptive keyword weighting + sentiment analysis
//
// Facade: Re-exports from services/behavior/ modules

const adaptiveWeighting = require('./adaptiveKeywordWeighting');

const {
  createKeywordRegex,
  analyzeMessage,
  analyzeConversation,
  normalizeFrequencies,
  analyzeBig5Message,
  analyzeBig5Conversation,
  normalizeBig5Frequencies,
  analyzeSDMessage,
  analyzeSDConversation
} = require('./behavior/analyzers');

const { RIEMANN_KEYWORDS } = require('./behavior/riemannKeywords');
const { BIG5_KEYWORDS } = require('./behavior/big5Keywords');
const { SD_KEYWORDS } = require('./behavior/sdKeywords');

// ============================================
// PHASE 2a: ENHANCED ANALYSIS WITH ADAPTIVE WEIGHTING
// ============================================

/**
 * Enhanced analysis that applies adaptive weighting (context + sentiment) to keyword detections.
 * This wraps the standard analyzeMessage/analyzeBig5Message/analyzeSDMessage functions
 * and adjusts the weights based on conversation context, linguistic patterns, and sentiment.
 *
 * @param {string} message - Current user message
 * @param {string} language - Language code ('de' or 'en')
 * @param {string[]} recentMessages - Last 3-5 user messages for topic detection
 * @returns {object} Enhanced analysis result with weighted scores + adaptive metadata
 */
function analyzeMessageEnhanced(message, language, recentMessages) {
  language = language || 'de';
  recentMessages = recentMessages || [];

  // Step 1: Run standard analysis (unchanged)
  const riemannResult = analyzeMessage(message, language);
  const big5Result = analyzeBig5Message(message, language);
  const sdResult = analyzeSDMessage(message, language);

  // Step 2: Run adaptive analysis (context + sentiment)
  var adaptiveResult;
  try {
    adaptiveResult = adaptiveWeighting.analyzeAdaptive(message, recentMessages, language);
  } catch (err) {
    console.error('[DPFL] Adaptive analysis failed, using standard results:', err.message);
    return {
      riemann: riemannResult,
      big5: big5Result,
      spiralDynamics: sdResult,
      adaptive: null
    };
  }

  // Step 3: Apply adaptive weights to each found keyword
  var weightingDetails = [];

  // Process Riemann keywords
  for (const [dimension, data] of Object.entries(riemannResult)) {
    // Adjust high keywords
    for (const keyword of data.foundKeywords.high) {
      var adj = adaptiveWeighting.getKeywordAdjustment(
        keyword, message, 'riemann', dimension, 'high', adaptiveResult, language
      );

      if (adj.direction !== 'high') {
        // Negation detected: move from high to low
        data.high = Math.max(0, data.high - 1);
        data.low += adj.weight;
        data.delta = data.high - data.low;
      } else if (adj.weight !== 1.0) {
        // Weight adjustment
        var diff = adj.weight - 1.0;
        data.high = Math.max(0, data.high + diff);
        data.delta = data.high - data.low;
      }

      if (adj.weight !== 1.0 || adj.sentimentAdjusted) {
        weightingDetails.push({
          keyword: keyword,
          framework: 'riemann',
          dimension: dimension,
          originalDirection: 'high',
          adjustedDirection: adj.direction,
          weight: Math.round(adj.weight * 100) / 100,
          isPrimary: adj.isPrimary,
          sentimentAdjusted: adj.sentimentAdjusted
        });
      }
    }

    // Adjust low keywords
    for (const keyword of data.foundKeywords.low) {
      var adj = adaptiveWeighting.getKeywordAdjustment(
        keyword, message, 'riemann', dimension, 'low', adaptiveResult, language
      );

      if (adj.direction !== 'low') {
        data.low = Math.max(0, data.low - 1);
        data.high += adj.weight;
        data.delta = data.high - data.low;
      } else if (adj.weight !== 1.0) {
        var diff = adj.weight - 1.0;
        data.low = Math.max(0, data.low + diff);
        data.delta = data.high - data.low;
      }

      if (adj.weight !== 1.0 || adj.sentimentAdjusted) {
        weightingDetails.push({
          keyword: keyword,
          framework: 'riemann',
          dimension: dimension,
          originalDirection: 'low',
          adjustedDirection: adj.direction,
          weight: Math.round(adj.weight * 100) / 100,
          isPrimary: adj.isPrimary,
          sentimentAdjusted: adj.sentimentAdjusted
        });
      }
    }
  }

  // Process Big5 keywords
  for (const [dimension, data] of Object.entries(big5Result)) {
    for (const keyword of data.foundKeywords.high) {
      var adj = adaptiveWeighting.getKeywordAdjustment(
        keyword, message, 'big5', dimension, 'high', adaptiveResult, language
      );

      if (adj.direction !== 'high') {
        data.high = Math.max(0, data.high - 1);
        data.low += adj.weight;
        data.delta = data.high - data.low;
      } else if (adj.weight !== 1.0) {
        var diff = adj.weight - 1.0;
        data.high = Math.max(0, data.high + diff);
        data.delta = data.high - data.low;
      }

      if (adj.weight !== 1.0 || adj.sentimentAdjusted) {
        weightingDetails.push({
          keyword: keyword, framework: 'big5', dimension: dimension,
          originalDirection: 'high', adjustedDirection: adj.direction,
          weight: Math.round(adj.weight * 100) / 100,
          isPrimary: adj.isPrimary, sentimentAdjusted: adj.sentimentAdjusted
        });
      }
    }

    for (const keyword of data.foundKeywords.low) {
      var adj = adaptiveWeighting.getKeywordAdjustment(
        keyword, message, 'big5', dimension, 'low', adaptiveResult, language
      );

      if (adj.direction !== 'low') {
        data.low = Math.max(0, data.low - 1);
        data.high += adj.weight;
        data.delta = data.high - data.low;
      } else if (adj.weight !== 1.0) {
        var diff = adj.weight - 1.0;
        data.low = Math.max(0, data.low + diff);
        data.delta = data.high - data.low;
      }

      if (adj.weight !== 1.0 || adj.sentimentAdjusted) {
        weightingDetails.push({
          keyword: keyword, framework: 'big5', dimension: dimension,
          originalDirection: 'low', adjustedDirection: adj.direction,
          weight: Math.round(adj.weight * 100) / 100,
          isPrimary: adj.isPrimary, sentimentAdjusted: adj.sentimentAdjusted
        });
      }
    }
  }

  // Process Spiral Dynamics keywords
  for (const [level, data] of Object.entries(sdResult)) {
    for (const keyword of data.foundKeywords.high) {
      var adj = adaptiveWeighting.getKeywordAdjustment(
        keyword, message, 'sd', level, 'high', adaptiveResult, language
      );

      if (adj.direction !== 'high') {
        data.high = Math.max(0, data.high - 1);
        data.low += adj.weight;
        data.delta = data.high - data.low;
      } else if (adj.weight !== 1.0) {
        var diff = adj.weight - 1.0;
        data.high = Math.max(0, data.high + diff);
        data.delta = data.high - data.low;
      }

      if (adj.weight !== 1.0 || adj.sentimentAdjusted) {
        weightingDetails.push({
          keyword: keyword, framework: 'sd', dimension: level,
          originalDirection: 'high', adjustedDirection: adj.direction,
          weight: Math.round(adj.weight * 100) / 100,
          isPrimary: adj.isPrimary, sentimentAdjusted: adj.sentimentAdjusted
        });
      }
    }

    for (const keyword of data.foundKeywords.low) {
      var adj = adaptiveWeighting.getKeywordAdjustment(
        keyword, message, 'sd', level, 'low', adaptiveResult, language
      );

      if (adj.direction !== 'low') {
        data.low = Math.max(0, data.low - 1);
        data.high += adj.weight;
        data.delta = data.high - data.low;
      } else if (adj.weight !== 1.0) {
        var diff = adj.weight - 1.0;
        data.low = Math.max(0, data.low + diff);
        data.delta = data.high - data.low;
      }

      if (adj.weight !== 1.0 || adj.sentimentAdjusted) {
        weightingDetails.push({
          keyword: keyword, framework: 'sd', dimension: level,
          originalDirection: 'low', adjustedDirection: adj.direction,
          weight: Math.round(adj.weight * 100) / 100,
          isPrimary: adj.isPrimary, sentimentAdjusted: adj.sentimentAdjusted
        });
      }
    }
  }

  return {
    riemann: riemannResult,
    big5: big5Result,
    spiralDynamics: sdResult,
    adaptive: {
      context: adaptiveResult.context,
      sentiment: adaptiveResult.sentiment,
      weightingDetails: weightingDetails,
      adjustedKeywordCount: weightingDetails.length
    }
  };
}

module.exports = {
  createKeywordRegex,
  analyzeMessage,
  analyzeConversation,
  normalizeFrequencies,
  RIEMANN_KEYWORDS,
  analyzeBig5Message,
  analyzeBig5Conversation,
  normalizeBig5Frequencies,
  BIG5_KEYWORDS,
  analyzeSDMessage,
  analyzeSDConversation,
  SD_KEYWORDS,
  analyzeMessageEnhanced
};
