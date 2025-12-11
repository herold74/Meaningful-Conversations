// Behavior Logger for DPFL (Dynamic Profile Feedback Loop)
// Analyzes user messages for personality dimension markers
// Used to refine personality profiles over time

/**
 * Keyword dictionaries for Riemann-Thomann dimensions
 * Each dimension has markers that indicate tendency towards that pole
 */
const RIEMANN_KEYWORDS = {
  de: {
    dauer: [
      'planung', 'plan', 'struktur', 'routine', 'gewohnheit', 'sicherheit',
      'langfristig', 'beständig', 'verlässlich', 'stabilität', 'ordnung',
      'kontinuität', 'vorhersehbar', 'systematisch', 'organisiert', 'disziplin'
    ],
    wechsel: [
      'spontan', 'flexibel', 'abwechslung', 'neu', 'anders', 'veränderung',
      'improvisation', 'anpassung', 'experimentier', 'variieren', 'abenteuer',
      'überraschung', 'kreativ', 'innovation', 'dynamisch', 'beweglich'
    ],
    naehe: [
      'gefühl', 'emotion', 'beziehung', 'zusammen', 'verbindung', 'team',
      'gemeinsam', 'persönlich', 'empathie', 'vertrauen', 'nähe', 'intimität',
      'harmonie', 'verbunden', 'zugehörigkeit', 'miteinander', 'fürsorge'
    ],
    distanz: [
      'analyse', 'logik', 'objektiv', 'rational', 'fakten', 'daten',
      'allein', 'unabhängig', 'eigenständig', 'sachlich', 'kritisch',
      'distanz', 'neutral', 'professionell', 'effizient', 'fokussiert'
    ]
  },
  en: {
    dauer: [
      'planning', 'plan', 'structure', 'routine', 'habit', 'security',
      'long-term', 'stable', 'reliable', 'stability', 'order',
      'continuity', 'predictable', 'systematic', 'organized', 'discipline'
    ],
    wechsel: [
      'spontaneous', 'flexible', 'variety', 'new', 'different', 'change',
      'improvisation', 'adaptation', 'experiment', 'vary', 'adventure',
      'surprise', 'creative', 'innovation', 'dynamic', 'agile'
    ],
    naehe: [
      'feeling', 'emotion', 'relationship', 'together', 'connection', 'team',
      'shared', 'personal', 'empathy', 'trust', 'closeness', 'intimacy',
      'harmony', 'connected', 'belonging', 'collaboration', 'care'
    ],
    distanz: [
      'analysis', 'logic', 'objective', 'rational', 'facts', 'data',
      'alone', 'independent', 'autonomous', 'factual', 'critical',
      'distance', 'neutral', 'professional', 'efficient', 'focused'
    ]
  }
};

/**
 * Analyze a user message for personality dimension markers
 * @param {string} message - User's message text
 * @param {string} lang - Language code ('de' or 'en')
 * @returns {object} - Frequency counts for each dimension
 */
function analyzeMessage(message, lang = 'de') {
  if (!message || typeof message !== 'string') {
    return { dauer: 0, wechsel: 0, naehe: 0, distanz: 0 };
  }
  
  const keywords = RIEMANN_KEYWORDS[lang] || RIEMANN_KEYWORDS.de;
  const lowerMessage = message.toLowerCase();
  
  const frequencies = {
    dauer: 0,
    wechsel: 0,
    naehe: 0,
    distanz: 0
  };
  
  // Count keyword occurrences for each dimension
  for (const [dimension, wordList] of Object.entries(keywords)) {
    for (const word of wordList) {
      // Use word boundaries to avoid partial matches
      const regex = new RegExp(`\\b${word}\\w*\\b`, 'gi');
      const matches = lowerMessage.match(regex);
      if (matches) {
        frequencies[dimension] += matches.length;
      }
    }
  }
  
  return frequencies;
}

/**
 * Analyze an entire conversation history
 * Returns aggregated frequencies for user messages only
 * @param {Array} chatHistory - Array of message objects with role and text
 * @param {string} lang - Language code
 * @returns {object} - Aggregated frequency counts
 */
function analyzeConversation(chatHistory, lang = 'de') {
  const aggregated = {
    dauer: 0,
    wechsel: 0,
    naehe: 0,
    distanz: 0,
    messageCount: 0
  };
  
  if (!Array.isArray(chatHistory)) {
    return aggregated;
  }
  
  // Only analyze user messages (not bot responses)
  const userMessages = chatHistory.filter(msg => msg.role === 'user');
  
  for (const message of userMessages) {
    const frequencies = analyzeMessage(message.text, lang);
    aggregated.dauer += frequencies.dauer;
    aggregated.wechsel += frequencies.wechsel;
    aggregated.naehe += frequencies.naehe;
    aggregated.distanz += frequencies.distanz;
    aggregated.messageCount++;
  }
  
  return aggregated;
}

/**
 * Get normalized frequencies (per message)
 * Useful for comparing sessions of different lengths
 * @param {object} frequencies - Raw frequency counts
 * @returns {object} - Normalized frequencies (0-10 scale)
 */
function normalizeFrequencies(frequencies) {
  if (!frequencies.messageCount || frequencies.messageCount === 0) {
    return { dauer: 0, wechsel: 0, naehe: 0, distanz: 0 };
  }
  
  // Calculate average per message, then scale to 0-10
  // Typical range is 0-5 keywords per message, so we scale accordingly
  const scaleFactor = 2; // 5 keywords/message → 10 on scale
  
  return {
    dauer: Math.min(10, Math.round((frequencies.dauer / frequencies.messageCount) * scaleFactor)),
    wechsel: Math.min(10, Math.round((frequencies.wechsel / frequencies.messageCount) * scaleFactor)),
    naehe: Math.min(10, Math.round((frequencies.naehe / frequencies.messageCount) * scaleFactor)),
    distanz: Math.min(10, Math.round((frequencies.distanz / frequencies.messageCount) * scaleFactor))
  };
}

module.exports = {
  analyzeMessage,
  analyzeConversation,
  normalizeFrequencies,
  RIEMANN_KEYWORDS // Export for testing
};

