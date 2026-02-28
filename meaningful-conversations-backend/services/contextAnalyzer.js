/**
 * Context Analyzer Service
 * 
 * Analyzes conversational context to improve keyword weighting accuracy.
 * Detects:
 * - Topic (work, relationships, values, personal growth)
 * - Linguistic patterns ("ich bin", "ich schätze", "ich brauche")
 * - Co-occurring keywords within the same sentence
 * 
 * Performance: ~10ms per message
 */

// ============================================
// TOPIC DETECTION PATTERNS
// ============================================

const TOPIC_PATTERNS = {
  work: {
    de: ['arbeit', 'job', 'karriere', 'beruf', 'projekt', 'kollege', 'chef', 'unternehmen',
         'büro', 'meeting', 'deadline', 'firma', 'abteilung', 'vorgesetzt', 'aufgabe',
         'professionell', 'geschäft', 'angestellt', 'branche', 'position',
         'stelle', 'angebot', 'bewerbung', 'kündigung', 'team', 'gehalt',
         'arbeitsplatz', 'jobwechsel', 'beförderung', 'vorstellungsgespräch'],
    en: ['work', 'job', 'career', 'profession', 'project', 'colleague', 'boss', 'company',
         'office', 'meeting', 'deadline', 'firm', 'department', 'supervisor', 'task',
         'professional', 'business', 'employee', 'industry', 'position',
         'offer', 'application', 'resignation', 'team', 'salary',
         'workplace', 'job change', 'promotion', 'interview']
  },
  relationships: {
    de: ['beziehung', 'freund', 'familie', 'partner', 'liebe', 'nähe', 'ehe',
         'eltern', 'kinder', 'geschwister', 'vertrauen', 'trennung', 'zusammen',
         'bindung', 'zuneigung', 'intimität', 'freundschaft',
         'einsam', 'rückzug', 'zurückgezogen', 'halt', 'verbindung', 'verbunden',
         'geborgenheit', 'zugehörigkeit', 'kontakt', 'gemeinschaft'],
    en: ['relationship', 'friend', 'family', 'partner', 'love', 'closeness', 'marriage',
         'parents', 'children', 'siblings', 'trust', 'separation', 'together',
         'bond', 'affection', 'intimacy', 'friendship',
         'lonely', 'withdrawn', 'connection', 'belonging', 'contact', 'community']
  },
  values: {
    de: ['wert', 'prinzip', 'moral', 'ethik', 'glaube', 'überzeugung', 'bedeutung',
         'sinn', 'zweck', 'gerechtigkeit', 'wahrheit', 'ideal', 'verantwortung',
         'pflicht', 'gewissen', 'haltung', 'einstellung',
         'verpflichtung', 'tradition', 'treue', 'schuld', 'undankbar', 'loyalität',
         'ehre', 'schuldig', 'dankbar', 'opfer', 'integrität'],
    en: ['value', 'principle', 'moral', 'ethic', 'belief', 'conviction', 'meaning',
         'purpose', 'justice', 'truth', 'ideal', 'responsibility',
         'duty', 'conscience', 'attitude', 'stance',
         'obligation', 'tradition', 'loyalty', 'guilt', 'ungrateful', 'honor',
         'grateful', 'sacrifice', 'integrity']
  },
  personalGrowth: {
    de: ['entwicklung', 'wachstum', 'lernen', 'veränderung', 'ziel', 'potential',
         'stärke', 'schwäche', 'reflexion', 'fortschritt', 'selbst', 'bewusst',
         'erkenntnis', 'reife', 'persönlichkeit', 'verbessern',
         'ausgebrannt', 'burnout', 'erschöpft', 'überlast', 'grenz', 'am limit',
         'achtsamkeit', 'selbstfürsorge', 'balance', 'ressource', 'energie',
         'belastbar', 'resilienz', 'regenerat'],
    en: ['development', 'growth', 'learning', 'change', 'goal', 'potential',
         'strength', 'weakness', 'reflection', 'progress', 'self', 'aware',
         'insight', 'maturity', 'personality', 'improve',
         'burned out', 'burnout', 'exhausted', 'overload', 'boundar', 'at my limit',
         'mindfulness', 'self-care', 'balance', 'resource', 'energy',
         'resilience', 'recovery']
  }
};

// ============================================
// LINGUISTIC PATTERNS
// ============================================

const LINGUISTIC_PATTERNS = {
  // "ich bin..." → Describes personality trait → Big5 primary
  trait: {
    de: [
      /\bich bin\b/i,
      /\bich fühle mich\b/i,
      /\bich war schon immer\b/i,
      /\bvon natur aus\b/i,
      /\bich neige dazu\b/i,
      /\bich tendiere\b/i
    ],
    en: [
      /\bi am\b/i,
      /\bi feel\b/i,
      /\bi've always been\b/i,
      /\bby nature\b/i,
      /\bi tend to\b/i
    ]
  },
  // "ich schätze..." → Describes values → Spiral Dynamics primary
  value: {
    de: [
      /\bich schätze\b/i,
      /\bwichtig ist mir\b/i,
      /\bich glaube an\b/i,
      /\bmir ist wichtig\b/i,
      /\bich stehe für\b/i,
      /\bich vertrete\b/i,
      /\bfür mich zählt\b/i
    ],
    en: [
      /\bi value\b/i,
      /\bi appreciate\b/i,
      /\bimportant to me\b/i,
      /\bi believe in\b/i,
      /\bi stand for\b/i,
      /\bwhat matters to me\b/i
    ]
  },
  // "ich brauche..." → Describes need → Riemann primary
  need: {
    de: [
      /\bich brauche\b/i,
      /\bich benötige\b/i,
      /\bes ist wichtig für mich\b/i,
      /\bmir fehlt\b/i,
      /\bich sehne mich\b/i,
      /\bich wünsche mir\b/i,
      /\bich vermisse\b/i
    ],
    en: [
      /\bi need\b/i,
      /\bi require\b/i,
      /\bit's important for me\b/i,
      /\bi miss\b/i,
      /\bi long for\b/i,
      /\bi wish for\b/i
    ]
  }
};

// ============================================
// TOPIC DETECTION
// ============================================

/**
 * Detect conversation topic from recent messages.
 * Uses keyword counting across full conversation history with recency weighting.
 * Earlier messages that established the topic still contribute (topic persistence).
 * 
 * @param {string[]} recentMessages - All available user messages
 * @param {string} language - Language code ('de' or 'en')
 * @returns {{ topic: string|null, confidence: number, scores: object }}
 */
function detectTopic(recentMessages, language = 'de') {
  if (!recentMessages || recentMessages.length === 0) {
    return { topic: null, confidence: 0, scores: {} };
  }

  const scores = {};

  for (const [topic, patterns] of Object.entries(TOPIC_PATTERNS)) {
    const langPatterns = patterns[language] || patterns.de;
    let score = 0;

    for (let i = 0; i < recentMessages.length; i++) {
      const msgText = recentMessages[i].toLowerCase();
      // Older messages get slightly reduced weight (0.7 base + 0.3 recency)
      const recencyWeight = 0.7 + 0.3 * (i / Math.max(1, recentMessages.length - 1));

      for (const keyword of langPatterns) {
        const regex = new RegExp(`\\b${keyword}\\w*\\b`, 'gi');
        const matches = msgText.match(regex);
        if (matches) {
          score += matches.length * recencyWeight;
        }
      }
    }

    scores[topic] = Math.round(score * 100) / 100;
  }

  const sortedTopics = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topScore = sortedTopics[0][1];
  const secondScore = sortedTopics.length > 1 ? sortedTopics[1][1] : 0;

  // Threshold: at least 1.5 weighted score, and 1.3x the runner-up (lowered for topic persistence)
  if (topScore >= 1.5 && (secondScore === 0 || topScore / secondScore >= 1.3)) {
    return {
      topic: sortedTopics[0][0],
      confidence: Math.min(1.0, topScore / 4),
      scores
    };
  }

  return { topic: null, confidence: 0, scores };
}

// ============================================
// LINGUISTIC PATTERN DETECTION
// ============================================

/**
 * Detect linguistic pattern in a sentence.
 * 
 * @param {string} sentence - Single sentence to analyze
 * @param {string} language - Language code
 * @returns {{ pattern: string|null, confidence: number }}
 */
function detectLinguisticPattern(sentence, language = 'de') {
  if (!sentence) {
    return { pattern: null, confidence: 0 };
  }

  for (const [patternName, patterns] of Object.entries(LINGUISTIC_PATTERNS)) {
    const langPatterns = patterns[language] || patterns.de;

    for (const regex of langPatterns) {
      if (regex.test(sentence)) {
        return {
          pattern: patternName,
          confidence: 0.8 // Regex match → fairly confident
        };
      }
    }
  }

  return { pattern: null, confidence: 0 };
}

// ============================================
// CO-KEYWORD DETECTION
// ============================================

/**
 * Split message into sentences.
 * @param {string} message - Full message
 * @returns {string[]}
 */
function splitIntoSentences(message) {
  // Split on sentence-ending punctuation, keeping sentences that are at least 2 chars
  return message
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 1);
}

/**
 * Find co-occurring keywords within the same sentence.
 * 
 * @param {string} sentence - Single sentence
 * @param {string[]} allKeywords - All possible keywords to check
 * @returns {string[]} Keywords found in this sentence
 */
function findCoKeywords(sentence, allKeywords) {
  if (!sentence || !allKeywords || allKeywords.length === 0) {
    return [];
  }

  const lowerSentence = sentence.toLowerCase();
  const found = [];

  for (const keyword of allKeywords) {
    const regex = new RegExp(`\\b${keyword.toLowerCase()}\\w*\\b`, 'i');
    if (regex.test(lowerSentence)) {
      found.push(keyword.toLowerCase());
    }
  }

  return found;
}

// ============================================
// MAIN CONTEXT ANALYSIS
// ============================================

/**
 * Perform full context analysis on a user message.
 * 
 * @param {string} message - Current user message
 * @param {string[]} recentMessages - Last 3-5 user messages (for topic detection)
 * @param {string[]} overlappingKeywords - Keywords that appear in multiple frameworks
 * @param {string} language - Language code
 * @returns {object} Context analysis result
 */
function analyzeContext(message, recentMessages = [], overlappingKeywords = [], language = 'de') {
  if (!message) {
    return {
      topic: { topic: null, confidence: 0, scores: {} },
      linguisticPattern: { pattern: null, confidence: 0 },
      sentences: [],
      sentenceContexts: []
    };
  }

  // Include current message in topic detection
  const allMessages = [...recentMessages, message];

  // 1. Detect topic from conversation history
  const topic = detectTopic(allMessages, language);

  // 2. Split message into sentences for fine-grained analysis
  const sentences = splitIntoSentences(message);

  // 3. Analyze each sentence
  const sentenceContexts = sentences.map(sentence => {
    const linguisticPattern = detectLinguisticPattern(sentence, language);
    const coKeywords = findCoKeywords(sentence, overlappingKeywords);

    return {
      sentence,
      linguisticPattern,
      coKeywords,
      coKeywordCount: coKeywords.length
    };
  });

  // 4. Overall linguistic pattern (from full message)
  const overallPattern = detectLinguisticPattern(message, language);

  return {
    topic,
    linguisticPattern: overallPattern,
    sentences,
    sentenceContexts
  };
}

module.exports = {
  analyzeContext,
  detectTopic,
  detectLinguisticPattern,
  findCoKeywords,
  splitIntoSentences,
  TOPIC_PATTERNS,
  LINGUISTIC_PATTERNS
};
