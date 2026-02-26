const { createKeywordRegex } = require('./analyzerCore');
const { RIEMANN_KEYWORDS } = require('./riemannKeywords');
const { BIG5_KEYWORDS } = require('./big5Keywords');
const { SD_KEYWORDS } = require('./sdKeywords');

/**
 * Analyze a user message for Riemann personality markers (bidirectional)
 * @param {string} message - User's message text
 * @param {string} language - Language code ('de' or 'en')
 * @returns {object} - High/Low counts and found keywords for each dimension
 */
function analyzeMessage(message, language = 'de') {
  if (!message || typeof message !== 'string') {
    return {
      naehe: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
      distanz: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
      dauer: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
      wechsel: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } }
    };
  }

  const keywords = RIEMANN_KEYWORDS[language] || RIEMANN_KEYWORDS.de;
  const lowerMessage = message.toLowerCase();

  const results = {};

  for (const [dimension, directions] of Object.entries(keywords)) {
    const foundHigh = [];
    const foundLow = [];
    let highCount = 0;
    let lowCount = 0;

    // Count high keywords
    for (const word of directions.high) {
      const regex = createKeywordRegex(word);
      const matches = lowerMessage.match(regex);
      if (matches) {
        highCount += matches.length;
        foundHigh.push(word);
      }
    }

    // Count low keywords
    for (const word of directions.low) {
      const regex = createKeywordRegex(word);
      const matches = lowerMessage.match(regex);
      if (matches) {
        lowCount += matches.length;
        foundLow.push(word);
      }
    }

    results[dimension] = {
      high: highCount,
      low: lowCount,
      delta: highCount - lowCount,
      foundKeywords: { high: foundHigh, low: foundLow }
    };
  }

  return results;
}

/**
 * Analyze an entire conversation history for Riemann markers (bidirectional)
 * Returns aggregated high/low counts for user messages only
 * @param {Array} chatHistory - Array of message objects with role and text
 * @param {string} language - Language code
 * @returns {object} - Aggregated analysis with deltas and found keywords
 */
function analyzeConversation(chatHistory, language = 'de') {
  const aggregated = {
    naehe: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
    distanz: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
    dauer: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
    wechsel: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
    messageCount: 0
  };

  if (!Array.isArray(chatHistory)) {
    return aggregated;
  }

  // Only analyze user messages (not bot responses)
  const userMessages = chatHistory.filter(msg => msg.role === 'user');

  for (const message of userMessages) {
    const analysis = analyzeMessage(message.text, language);

    for (const dimension of ['naehe', 'distanz', 'dauer', 'wechsel']) {
      aggregated[dimension].high += analysis[dimension].high;
      aggregated[dimension].low += analysis[dimension].low;

      // Collect unique found keywords
      for (const kw of analysis[dimension].foundKeywords.high) {
        if (!aggregated[dimension].foundKeywords.high.includes(kw)) {
          aggregated[dimension].foundKeywords.high.push(kw);
        }
      }
      for (const kw of analysis[dimension].foundKeywords.low) {
        if (!aggregated[dimension].foundKeywords.low.includes(kw)) {
          aggregated[dimension].foundKeywords.low.push(kw);
        }
      }
    }
    aggregated.messageCount++;
  }

  // Calculate final deltas
  for (const dimension of ['naehe', 'distanz', 'dauer', 'wechsel']) {
    aggregated[dimension].delta = aggregated[dimension].high - aggregated[dimension].low;
  }

  return aggregated;
}

/**
 * Analyze a user message for Big5/OCEAN personality markers (bidirectional)
 * @param {string} message - User's message text
 * @param {string} language - Language code ('de' or 'en')
 * @returns {object} - High/Low counts and found keywords for each dimension
 */
function analyzeBig5Message(message, language = 'de') {
  if (!message || typeof message !== 'string') {
    return {
      openness: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
      conscientiousness: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
      extraversion: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
      agreeableness: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
      neuroticism: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } }
    };
  }

  const keywords = BIG5_KEYWORDS[language] || BIG5_KEYWORDS.de;
  const lowerMessage = message.toLowerCase();

  const results = {};

  for (const [dimension, directions] of Object.entries(keywords)) {
    const foundHigh = [];
    const foundLow = [];
    let highCount = 0;
    let lowCount = 0;

    // Count high keywords
    for (const word of directions.high) {
      const regex = createKeywordRegex(word);
      const matches = lowerMessage.match(regex);
      if (matches) {
        highCount += matches.length;
        foundHigh.push(word);
      }
    }

    // Count low keywords
    for (const word of directions.low) {
      const regex = createKeywordRegex(word);
      const matches = lowerMessage.match(regex);
      if (matches) {
        lowCount += matches.length;
        foundLow.push(word);
      }
    }

    results[dimension] = {
      high: highCount,
      low: lowCount,
      delta: highCount - lowCount,
      foundKeywords: { high: foundHigh, low: foundLow }
    };
  }

  return results;
}

/**
 * Analyze an entire conversation history for Big5/OCEAN markers (bidirectional)
 * Returns aggregated high/low counts for user messages only
 * @param {Array} chatHistory - Array of message objects with role and text
 * @param {string} language - Language code
 * @returns {object} - Aggregated analysis with deltas and found keywords
 */
function analyzeBig5Conversation(chatHistory, language = 'de') {
  const dimensions = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];

  const aggregated = {
    messageCount: 0
  };

  // Initialize all dimensions
  for (const dim of dimensions) {
    aggregated[dim] = { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } };
  }

  if (!Array.isArray(chatHistory)) {
    return aggregated;
  }

  // Only analyze user messages (not bot responses)
  const userMessages = chatHistory.filter(msg => msg.role === 'user');

  for (const message of userMessages) {
    const analysis = analyzeBig5Message(message.text, language);

    for (const dimension of dimensions) {
      aggregated[dimension].high += analysis[dimension].high;
      aggregated[dimension].low += analysis[dimension].low;

      // Collect unique found keywords
      for (const kw of analysis[dimension].foundKeywords.high) {
        if (!aggregated[dimension].foundKeywords.high.includes(kw)) {
          aggregated[dimension].foundKeywords.high.push(kw);
        }
      }
      for (const kw of analysis[dimension].foundKeywords.low) {
        if (!aggregated[dimension].foundKeywords.low.includes(kw)) {
          aggregated[dimension].foundKeywords.low.push(kw);
        }
      }
    }
    aggregated.messageCount++;
  }

  // Calculate final deltas
  for (const dimension of dimensions) {
    aggregated[dimension].delta = aggregated[dimension].high - aggregated[dimension].low;
  }

  return aggregated;
}

/**
 * Analyze a user message for Spiral Dynamics level markers (bidirectional)
 * @param {string} message - User's message text
 * @param {string} language - Language code ('de' or 'en')
 * @returns {object} - High/Low counts and found keywords for each SD level
 */
function analyzeSDMessage(message, language = 'de') {
  const levels = ['turquoise', 'yellow', 'green', 'orange', 'blue', 'red', 'purple', 'beige'];

  if (!message || typeof message !== 'string') {
    const empty = {};
    for (const level of levels) {
      empty[level] = { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } };
    }
    return empty;
  }

  const keywords = SD_KEYWORDS[language] || SD_KEYWORDS.de;
  const lowerMessage = message.toLowerCase();

  const results = {};

  for (const [level, directions] of Object.entries(keywords)) {
    const foundHigh = [];
    const foundLow = [];
    let highCount = 0;
    let lowCount = 0;

    // Count high keywords
    for (const word of directions.high) {
      const regex = createKeywordRegex(word);
      const matches = lowerMessage.match(regex);
      if (matches) {
        highCount += matches.length;
        foundHigh.push(word);
      }
    }

    // Count low keywords
    for (const word of directions.low) {
      const regex = createKeywordRegex(word);
      const matches = lowerMessage.match(regex);
      if (matches) {
        lowCount += matches.length;
        foundLow.push(word);
      }
    }

    results[level] = {
      high: highCount,
      low: lowCount,
      delta: highCount - lowCount,
      foundKeywords: { high: foundHigh, low: foundLow }
    };
  }

  return results;
}

/**
 * Analyze an entire conversation history for Spiral Dynamics markers (bidirectional)
 * Returns aggregated high/low counts for user messages only
 * @param {Array} chatHistory - Array of message objects with role and text
 * @param {string} language - Language code
 * @returns {object} - Aggregated analysis with deltas and found keywords
 */
function analyzeSDConversation(chatHistory, language = 'de') {
  const levels = ['turquoise', 'yellow', 'green', 'orange', 'blue', 'red', 'purple', 'beige'];

  const aggregated = {
    messageCount: 0
  };

  // Initialize all levels
  for (const level of levels) {
    aggregated[level] = { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } };
  }

  if (!Array.isArray(chatHistory)) {
    return aggregated;
  }

  // Only analyze user messages (not bot responses)
  const userMessages = chatHistory.filter(msg => msg.role === 'user');

  for (const message of userMessages) {
    const analysis = analyzeSDMessage(message.text, language);

    for (const level of levels) {
      aggregated[level].high += analysis[level].high;
      aggregated[level].low += analysis[level].low;

      // Collect unique found keywords
      for (const kw of analysis[level].foundKeywords.high) {
        if (!aggregated[level].foundKeywords.high.includes(kw)) {
          aggregated[level].foundKeywords.high.push(kw);
        }
      }
      for (const kw of analysis[level].foundKeywords.low) {
        if (!aggregated[level].foundKeywords.low.includes(kw)) {
          aggregated[level].foundKeywords.low.push(kw);
        }
      }
    }
    aggregated.messageCount++;
  }

  // Calculate final deltas
  for (const level of levels) {
    aggregated[level].delta = aggregated[level].high - aggregated[level].low;
  }

  return aggregated;
}

/**
 * Get normalized frequencies (per message) for Riemann - LEGACY COMPATIBILITY
 * @deprecated Use the new bidirectional analysis instead
 */
function normalizeFrequencies(frequencies) {
  // Legacy format - extract just the counts for backward compatibility
  const result = { dauer: 0, wechsel: 0, naehe: 0, distanz: 0 };

  for (const dim of ['dauer', 'wechsel', 'naehe', 'distanz']) {
    if (frequencies[dim]) {
      // New format: has high/low
      if (typeof frequencies[dim] === 'object' && 'high' in frequencies[dim]) {
        result[dim] = frequencies[dim].high + frequencies[dim].low;
      } else {
        // Old format: just a number
        result[dim] = frequencies[dim];
      }
    }
  }

  return result;
}

/**
 * Get normalized frequencies (per message) for Big5 - LEGACY COMPATIBILITY
 * @deprecated Use the new bidirectional analysis instead
 */
function normalizeBig5Frequencies(frequencies) {
  const dimensions = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
  const result = {};

  for (const dim of dimensions) {
    if (frequencies[dim]) {
      // New format: has high/low
      if (typeof frequencies[dim] === 'object' && 'high' in frequencies[dim]) {
        result[dim] = frequencies[dim].high + frequencies[dim].low;
      } else {
        // Old format: just a number
        result[dim] = frequencies[dim];
      }
    } else {
      result[dim] = 0;
    }
  }

  return result;
}

module.exports = {
  createKeywordRegex,
  analyzeMessage,
  analyzeConversation,
  normalizeFrequencies,
  analyzeBig5Message,
  analyzeBig5Conversation,
  normalizeBig5Frequencies,
  analyzeSDMessage,
  analyzeSDConversation
};
