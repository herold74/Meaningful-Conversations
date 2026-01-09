// Behavior Logger for DPFL (Dynamic Profile Feedback Loop)
// Analyzes user messages for personality dimension markers
// Uses bidirectional keywords (high/low) for accurate profile refinement

/**
 * Bidirectional keyword dictionaries for Riemann-Thomann dimensions
 * - high: Keywords that indicate high tendency towards this dimension
 * - low: Keywords that indicate low tendency (opposite pole behavior)
 * 
 * Important: Only explicit mentions cause changes. No keywords = no change.
 */
const RIEMANN_KEYWORDS = {
  de: {
    naehe: {
      high: [
        'verbundenheit', 'beziehung', 'harmonie', 'zusammenhalt', 'geborgenheit',
        'wärme', 'vertrauen', 'nähe', 'intimität', 'gemeinsam', 'team',
        'empathie', 'fürsorge', 'zugehörigkeit', 'miteinander', 'emotional',
        'gefühl', 'persönlich', 'herzlich', 'liebevoll'
      ],
      low: [
        'distanziert', 'abstand', 'zurückgezogen', 'isoliert', 'einsam',
        'kühl', 'unpersönlich', 'gleichgültig', 'oberflächlich'
      ]
    },
    distanz: {
      high: [
        'autonomie', 'freiheit', 'unabhängigkeit', 'eigenständig', 'abgrenzung',
        'privatsphäre', 'selbstständig', 'allein', 'rational', 'logik',
        'objektiv', 'sachlich', 'analyse', 'fakten', 'daten', 'professionell',
        'neutral', 'kritisch', 'fokussiert', 'effizient'
      ],
      low: [
        'abhängig', 'angewiesen', 'gebunden', 'verpflichtet', 'eingeengt',
        'klammern', 'unselbstständig', 'hilflos'
      ]
    },
    dauer: {
      high: [
        'sicherheit', 'stabilität', 'planung', 'ordnung', 'verlässlichkeit',
        'routine', 'struktur', 'beständig', 'vorhersehbar', 'systematisch',
        'organisiert', 'disziplin', 'kontinuität', 'tradition', 'gewohnheit',
        'langfristig', 'zuverlässig', 'konstant', 'methodisch'
      ],
      low: [
        'unsicherheit', 'chaos', 'planlos', 'unbeständig', 'wechselhaft',
        'unzuverlässig', 'unstrukturiert', 'instabil', 'unberechenbar'
      ]
    },
    wechsel: {
      high: [
        'veränderung', 'abwechslung', 'neues', 'spontaneität', 'flexibilität',
        'dynamik', 'improvisation', 'experimentier', 'kreativ', 'innovation',
        'abenteuer', 'überraschung', 'anpassung', 'beweglich', 'variieren',
        'anders', 'aufregend', 'neugierig', 'wandel'
      ],
      low: [
        'festgefahren', 'starr', 'monoton', 'langweilig', 'eingerostet',
        'unflexibel', 'stur', 'träge', 'statisch'
      ]
    }
  },
  en: {
    naehe: {
      high: [
        'connection', 'relationship', 'harmony', 'togetherness', 'belonging',
        'warmth', 'trust', 'closeness', 'intimacy', 'together', 'team',
        'empathy', 'care', 'community', 'emotional', 'feeling', 'personal',
        'heartfelt', 'loving', 'bonding'
      ],
      low: [
        'distant', 'detached', 'withdrawn', 'isolated', 'lonely',
        'cold', 'impersonal', 'indifferent', 'superficial'
      ]
    },
    distanz: {
      high: [
        'autonomy', 'freedom', 'independence', 'self-reliant', 'boundaries',
        'privacy', 'autonomous', 'alone', 'rational', 'logic',
        'objective', 'factual', 'analysis', 'facts', 'data', 'professional',
        'neutral', 'critical', 'focused', 'efficient'
      ],
      low: [
        'dependent', 'reliant', 'bound', 'obligated', 'constrained',
        'clingy', 'helpless', 'needy'
      ]
    },
    dauer: {
      high: [
        'security', 'stability', 'planning', 'order', 'reliability',
        'routine', 'structure', 'consistent', 'predictable', 'systematic',
        'organized', 'discipline', 'continuity', 'tradition', 'habit',
        'long-term', 'dependable', 'constant', 'methodical'
      ],
      low: [
        'insecurity', 'chaos', 'unplanned', 'unstable', 'erratic',
        'unreliable', 'unstructured', 'volatile', 'unpredictable'
      ]
    },
    wechsel: {
      high: [
        'change', 'variety', 'novelty', 'spontaneity', 'flexibility',
        'dynamic', 'improvisation', 'experiment', 'creative', 'innovation',
        'adventure', 'surprise', 'adaptation', 'agile', 'diverse',
        'different', 'exciting', 'curious', 'transformation'
      ],
      low: [
        'stuck', 'rigid', 'monotonous', 'boring', 'stagnant',
        'inflexible', 'stubborn', 'sluggish', 'static'
      ]
    }
  }
};

/**
 * Bidirectional keyword dictionaries for Big5/OCEAN dimensions
 * - high: Keywords indicating high trait expression
 * - low: Keywords indicating low trait expression (opposite behavior)
 */
const BIG5_KEYWORDS = {
  de: {
    openness: {
      high: [
        'kreativ', 'neugierig', 'experimentierfreudig', 'fantasievoll', 'künstlerisch',
        'offen', 'innovativ', 'visionär', 'originell', 'unkonventionell',
        'philosophisch', 'abstrakt', 'inspiriert', 'intellektuell', 'tiefgründig',
        'aufgeschlossen', 'ideenreich', 'träumerisch', 'erfindungsreich'
      ],
      low: [
        'traditionell', 'konventionell', 'konservativ', 'praktisch', 'routiniert',
        'bodenständig', 'realistisch', 'pragmatisch', 'gewohnt', 'bewährt',
        'einfach', 'unkompliziert', 'nüchtern'
      ]
    },
    conscientiousness: {
      high: [
        'organisiert', 'pünktlich', 'strukturiert', 'diszipliniert', 'gewissenhaft',
        'zuverlässig', 'ordentlich', 'geplant', 'sorgfältig', 'pflichtbewusst',
        'verantwortungsvoll', 'gründlich', 'systematisch', 'methodisch', 'genau',
        'akribisch', 'termingerecht', 'effizient', 'zielorientiert'
      ],
      low: [
        'spontan', 'chaotisch', 'impulsiv', 'aufschieben', 'vergesslich',
        'unorganisiert', 'nachlässig', 'planlos', 'unordentlich', 'schlampig',
        'unpünktlich', 'unzuverlässig', 'zerstreut'
      ]
    },
    extraversion: {
      high: [
        'gesellig', 'gesprächig', 'energiegeladen', 'enthusiastisch', 'aktiv',
        'kontaktfreudig', 'aufgeschlossen', 'lebhaft', 'unternehmungslustig',
        'redselig', 'selbstbewusst', 'dominant', 'party', 'ausgehen',
        'menschen', 'treffen', 'sozial', 'kommunikativ'
      ],
      low: [
        'ruhig', 'zurückhaltend', 'introvertiert', 'nachdenklich', 'still',
        'beobachtend', 'schüchtern', 'reserviert', 'verschlossen', 'einzelgänger',
        'allein', 'in sich gekehrt', 'wortkarg'
      ]
    },
    agreeableness: {
      high: [
        'hilfsbereit', 'kooperativ', 'vertrauensvoll', 'freundlich', 'mitfühlend',
        'harmoniebedürftig', 'einfühlsam', 'warmherzig', 'großzügig', 'nachgiebig',
        'rücksichtsvoll', 'tolerant', 'verständnisvoll', 'geduldig', 'fürsorglich',
        'bescheiden', 'höflich', 'respektvoll', 'unterstützend'
      ],
      low: [
        'kritisch', 'wettbewerbsorientiert', 'skeptisch', 'direkt', 'konfrontativ',
        'durchsetzungsstark', 'streitlustig', 'misstrauisch', 'egozentrisch',
        'kompromisslos', 'hartnäckig', 'unnachgiebig', 'fordernd'
      ]
    },
    neuroticism: {
      high: [
        'ängstlich', 'nervös', 'unsicher', 'besorgt', 'gestresst',
        'emotional', 'verletzlich', 'überfordert', 'unruhig', 'angespannt',
        'frustriert', 'gereizt', 'empfindlich', 'zweifelnd', 'pessimistisch',
        'belastet', 'erschöpft', 'verzweifelt', 'panisch', 'sorge'
      ],
      low: [
        'gelassen', 'entspannt', 'stabil', 'selbstsicher', 'ausgeglichen',
        'ruhig', 'belastbar', 'zuversichtlich', 'unerschütterlich', 'gefasst',
        'souverän', 'resilient', 'robust', 'optimistisch'
      ]
    }
  },
  en: {
    openness: {
      high: [
        'creative', 'curious', 'experimental', 'imaginative', 'artistic',
        'open', 'innovative', 'visionary', 'original', 'unconventional',
        'philosophical', 'abstract', 'inspired', 'intellectual', 'profound',
        'receptive', 'inventive', 'dreamy', 'idealistic'
      ],
      low: [
        'traditional', 'conventional', 'conservative', 'practical', 'routine',
        'down-to-earth', 'realistic', 'pragmatic', 'familiar', 'proven',
        'simple', 'straightforward', 'sober'
      ]
    },
    conscientiousness: {
      high: [
        'organized', 'punctual', 'structured', 'disciplined', 'conscientious',
        'reliable', 'orderly', 'planned', 'careful', 'dutiful',
        'responsible', 'thorough', 'systematic', 'methodical', 'precise',
        'meticulous', 'timely', 'efficient', 'goal-oriented'
      ],
      low: [
        'spontaneous', 'chaotic', 'impulsive', 'procrastinate', 'forgetful',
        'disorganized', 'careless', 'unplanned', 'messy', 'sloppy',
        'late', 'unreliable', 'scattered'
      ]
    },
    extraversion: {
      high: [
        'sociable', 'talkative', 'energetic', 'enthusiastic', 'active',
        'outgoing', 'gregarious', 'lively', 'adventurous',
        'confident', 'assertive', 'party', 'going out',
        'people', 'meeting', 'social', 'communicative'
      ],
      low: [
        'quiet', 'reserved', 'introverted', 'reflective', 'silent',
        'observant', 'shy', 'withdrawn', 'private', 'solitary',
        'alone', 'introspective', 'taciturn'
      ]
    },
    agreeableness: {
      high: [
        'helpful', 'cooperative', 'trusting', 'friendly', 'compassionate',
        'harmony-seeking', 'empathetic', 'warmhearted', 'generous', 'yielding',
        'considerate', 'tolerant', 'understanding', 'patient', 'caring',
        'modest', 'polite', 'respectful', 'supportive'
      ],
      low: [
        'critical', 'competitive', 'skeptical', 'direct', 'confrontational',
        'assertive', 'argumentative', 'distrustful', 'self-centered',
        'uncompromising', 'stubborn', 'unyielding', 'demanding'
      ]
    },
    neuroticism: {
      high: [
        'anxious', 'nervous', 'insecure', 'worried', 'stressed',
        'emotional', 'vulnerable', 'overwhelmed', 'restless', 'tense',
        'frustrated', 'irritated', 'sensitive', 'doubtful', 'pessimistic',
        'burdened', 'exhausted', 'desperate', 'panicky', 'worry'
      ],
      low: [
        'calm', 'relaxed', 'stable', 'confident', 'balanced',
        'serene', 'resilient', 'optimistic', 'unflappable', 'composed',
        'poised', 'robust', 'steady', 'secure'
      ]
    }
  }
};

/**
 * Analyze a user message for Riemann personality markers (bidirectional)
 * @param {string} message - User's message text
 * @param {string} lang - Language code ('de' or 'en')
 * @returns {object} - High/Low counts and found keywords for each dimension
 */
function analyzeMessage(message, lang = 'de') {
  if (!message || typeof message !== 'string') {
    return {
      naehe: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
      distanz: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
      dauer: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
      wechsel: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } }
    };
  }
  
  const keywords = RIEMANN_KEYWORDS[lang] || RIEMANN_KEYWORDS.de;
  const lowerMessage = message.toLowerCase();
  
  const results = {};
  
  for (const [dimension, directions] of Object.entries(keywords)) {
    const foundHigh = [];
    const foundLow = [];
    let highCount = 0;
    let lowCount = 0;
    
    // Count high keywords
    for (const word of directions.high) {
      const regex = new RegExp(`\\b${word}\\w*\\b`, 'gi');
      const matches = lowerMessage.match(regex);
      if (matches) {
        highCount += matches.length;
        foundHigh.push(word);
      }
    }
    
    // Count low keywords
    for (const word of directions.low) {
      const regex = new RegExp(`\\b${word}\\w*\\b`, 'gi');
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
 * @param {string} lang - Language code
 * @returns {object} - Aggregated analysis with deltas and found keywords
 */
function analyzeConversation(chatHistory, lang = 'de') {
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
    const analysis = analyzeMessage(message.text, lang);
    
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
 * @param {string} lang - Language code ('de' or 'en')
 * @returns {object} - High/Low counts and found keywords for each dimension
 */
function analyzeBig5Message(message, lang = 'de') {
  if (!message || typeof message !== 'string') {
    return {
      openness: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
      conscientiousness: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
      extraversion: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
      agreeableness: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
      neuroticism: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } }
    };
  }
  
  const keywords = BIG5_KEYWORDS[lang] || BIG5_KEYWORDS.de;
  const lowerMessage = message.toLowerCase();
  
  const results = {};
  
  for (const [dimension, directions] of Object.entries(keywords)) {
    const foundHigh = [];
    const foundLow = [];
    let highCount = 0;
    let lowCount = 0;
    
    // Count high keywords
    for (const word of directions.high) {
      const regex = new RegExp(`\\b${word}\\w*\\b`, 'gi');
      const matches = lowerMessage.match(regex);
      if (matches) {
        highCount += matches.length;
        foundHigh.push(word);
      }
    }
    
    // Count low keywords
    for (const word of directions.low) {
      const regex = new RegExp(`\\b${word}\\w*\\b`, 'gi');
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
 * @param {string} lang - Language code
 * @returns {object} - Aggregated analysis with deltas and found keywords
 */
function analyzeBig5Conversation(chatHistory, lang = 'de') {
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
    const analysis = analyzeBig5Message(message.text, lang);
    
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
