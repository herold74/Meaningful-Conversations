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
 * Keyword dictionaries for Big5/OCEAN dimensions
 * Each dimension has markers that indicate tendency towards that trait
 */
const BIG5_KEYWORDS = {
  de: {
    openness: [
      'kreativ', 'neugierig', 'fantasie', 'kunst', 'ideen', 'experimentier',
      'originell', 'unkonventionell', 'philosophisch', 'abstrakt', 'vision',
      'inspirier', 'erfind', 'künstlerisch', 'intellektuell', 'tiefgründig',
      'offen', 'aufgeschlossen', 'innovativ', 'vorstellung', 'träum'
    ],
    conscientiousness: [
      'organisiert', 'zuverlässig', 'pflicht', 'disziplin', 'sorgfältig',
      'gewissenhaft', 'pünktlich', 'ordentlich', 'verantwortung', 'gründlich',
      'systematisch', 'effizient', 'zielorientiert', 'fleißig', 'genau',
      'methodisch', 'konsequent', 'akribisch', 'termingerecht', 'strukturiert'
    ],
    extraversion: [
      'gesellig', 'energie', 'begeister', 'unterhalten', 'aktiv',
      'gesprächig', 'lebhaft', 'kontaktfreudig', 'aufgeschlossen', 'dominant',
      'durchsetzung', 'enthusias', 'optimist', 'selbstbewusst', 'redselig',
      'party', 'leute', 'treffen', 'ausgeh', 'sozial'
    ],
    agreeableness: [
      'hilfsbereit', 'kooperativ', 'vertrauen', 'mitgefühl', 'freundlich',
      'warmherzig', 'großzügig', 'rücksichtsvoll', 'nachgiebig', 'tolerant',
      'verständnisvoll', 'geduldig', 'fürsorglich', 'einfühlsam', 'harmonie',
      'friedlich', 'bescheiden', 'höflich', 'respektvoll', 'unterstütz'
    ],
    neuroticism: [
      'angst', 'sorge', 'stress', 'nervös', 'unsicher', 'ängstlich',
      'besorgt', 'unruhig', 'gestresst', 'überwältigt', 'frustriert',
      'gereizt', 'empfindlich', 'verletzlich', 'zweifel', 'pessimist',
      'belastet', 'erschöpft', 'überfordert', 'verzweifelt', 'panisch'
    ]
  },
  en: {
    openness: [
      'creative', 'curious', 'imagination', 'art', 'ideas', 'experiment',
      'original', 'unconventional', 'philosophical', 'abstract', 'vision',
      'inspire', 'invent', 'artistic', 'intellectual', 'profound',
      'open', 'receptive', 'innovative', 'imagine', 'dream'
    ],
    conscientiousness: [
      'organized', 'reliable', 'duty', 'discipline', 'thorough',
      'conscientious', 'punctual', 'orderly', 'responsibility', 'careful',
      'systematic', 'efficient', 'goal-oriented', 'diligent', 'precise',
      'methodical', 'consistent', 'meticulous', 'deadline', 'structured'
    ],
    extraversion: [
      'social', 'energy', 'enthusiastic', 'outgoing', 'active',
      'talkative', 'lively', 'gregarious', 'assertive', 'dominant',
      'confident', 'optimistic', 'cheerful', 'expressive', 'bold',
      'party', 'people', 'meeting', 'hangout', 'sociable'
    ],
    agreeableness: [
      'helpful', 'cooperative', 'trust', 'compassion', 'friendly',
      'warmhearted', 'generous', 'considerate', 'yielding', 'tolerant',
      'understanding', 'patient', 'caring', 'empathetic', 'harmony',
      'peaceful', 'modest', 'polite', 'respectful', 'supportive'
    ],
    neuroticism: [
      'anxiety', 'worry', 'stress', 'nervous', 'insecure', 'anxious',
      'concerned', 'restless', 'stressed', 'overwhelmed', 'frustrated',
      'irritated', 'sensitive', 'vulnerable', 'doubt', 'pessimistic',
      'burdened', 'exhausted', 'struggling', 'desperate', 'panic'
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
 * Get normalized frequencies (per message) for Riemann
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

/**
 * Analyze a user message for Big5/OCEAN personality markers
 * @param {string} message - User's message text
 * @param {string} lang - Language code ('de' or 'en')
 * @returns {object} - Frequency counts for each Big5 dimension
 */
function analyzeBig5Message(message, lang = 'de') {
  if (!message || typeof message !== 'string') {
    return { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0 };
  }
  
  const keywords = BIG5_KEYWORDS[lang] || BIG5_KEYWORDS.de;
  const lowerMessage = message.toLowerCase();
  
  const frequencies = {
    openness: 0,
    conscientiousness: 0,
    extraversion: 0,
    agreeableness: 0,
    neuroticism: 0
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
 * Analyze an entire conversation history for Big5/OCEAN markers
 * Returns aggregated frequencies for user messages only
 * @param {Array} chatHistory - Array of message objects with role and text
 * @param {string} lang - Language code
 * @returns {object} - Aggregated frequency counts for Big5 dimensions
 */
function analyzeBig5Conversation(chatHistory, lang = 'de') {
  const aggregated = {
    openness: 0,
    conscientiousness: 0,
    extraversion: 0,
    agreeableness: 0,
    neuroticism: 0,
    messageCount: 0
  };
  
  if (!Array.isArray(chatHistory)) {
    return aggregated;
  }
  
  // Only analyze user messages (not bot responses)
  const userMessages = chatHistory.filter(msg => msg.role === 'user');
  
  for (const message of userMessages) {
    const frequencies = analyzeBig5Message(message.text, lang);
    aggregated.openness += frequencies.openness;
    aggregated.conscientiousness += frequencies.conscientiousness;
    aggregated.extraversion += frequencies.extraversion;
    aggregated.agreeableness += frequencies.agreeableness;
    aggregated.neuroticism += frequencies.neuroticism;
    aggregated.messageCount++;
  }
  
  return aggregated;
}

/**
 * Get normalized frequencies (per message) for Big5
 * @param {object} frequencies - Raw frequency counts
 * @returns {object} - Normalized frequencies (0-10 scale)
 */
function normalizeBig5Frequencies(frequencies) {
  if (!frequencies.messageCount || frequencies.messageCount === 0) {
    return { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0 };
  }
  
  const scaleFactor = 2; // 5 keywords/message → 10 on scale
  
  return {
    openness: Math.min(10, Math.round((frequencies.openness / frequencies.messageCount) * scaleFactor)),
    conscientiousness: Math.min(10, Math.round((frequencies.conscientiousness / frequencies.messageCount) * scaleFactor)),
    extraversion: Math.min(10, Math.round((frequencies.extraversion / frequencies.messageCount) * scaleFactor)),
    agreeableness: Math.min(10, Math.round((frequencies.agreeableness / frequencies.messageCount) * scaleFactor)),
    neuroticism: Math.min(10, Math.round((frequencies.neuroticism / frequencies.messageCount) * scaleFactor))
  };
}

module.exports = {
  // Riemann analysis
  analyzeMessage,
  analyzeConversation,
  normalizeFrequencies,
  RIEMANN_KEYWORDS,
  // Big5 analysis
  analyzeBig5Message,
  analyzeBig5Conversation,
  normalizeBig5Frequencies,
  BIG5_KEYWORDS
};

