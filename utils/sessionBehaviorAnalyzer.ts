/**
 * Client-side session behavior analyzer for DPFL
 * Mirrors the backend behaviorLogger.js functionality
 * Analyzes chat messages for personality dimension keywords
 */

// Riemann-Thomann Keywords (bidirectional)
const RIEMANN_KEYWORDS = {
  de: {
    naehe: {
      high: ['verbundenheit', 'beziehung', 'harmonie', 'zusammenhalt', 'geborgenheit',
        'wärme', 'vertrauen', 'nähe', 'intimität', 'gemeinsam', 'team',
        'empathie', 'fürsorge', 'zugehörigkeit', 'miteinander', 'emotional'],
      low: ['distanziert', 'abstand', 'zurückgezogen', 'isoliert', 'einsam', 'kühl', 'unpersönlich']
    },
    distanz: {
      high: ['autonomie', 'freiheit', 'unabhängigkeit', 'eigenständig', 'abgrenzung',
        'privatsphäre', 'selbstständig', 'allein', 'rational', 'logik', 'objektiv', 'sachlich'],
      low: ['abhängig', 'angewiesen', 'gebunden', 'verpflichtet', 'eingeengt', 'hilflos']
    },
    dauer: {
      high: ['sicherheit', 'stabilität', 'planung', 'ordnung', 'verlässlichkeit',
        'routine', 'struktur', 'beständig', 'vorhersehbar', 'systematisch', 'organisiert'],
      low: ['unsicherheit', 'chaos', 'planlos', 'unbeständig', 'wechselhaft', 'unzuverlässig']
    },
    wechsel: {
      high: ['veränderung', 'abwechslung', 'neues', 'spontaneität', 'flexibilität',
        'dynamik', 'improvisation', 'kreativ', 'innovation', 'abenteuer', 'neugierig'],
      low: ['festgefahren', 'starr', 'monoton', 'langweilig', 'unflexibel', 'stur', 'statisch']
    }
  },
  en: {
    naehe: {
      high: ['connection', 'relationship', 'harmony', 'togetherness', 'belonging',
        'warmth', 'trust', 'closeness', 'intimacy', 'together', 'team', 'empathy', 'care'],
      low: ['distant', 'detached', 'withdrawn', 'isolated', 'lonely', 'cold', 'impersonal']
    },
    distanz: {
      high: ['autonomy', 'freedom', 'independence', 'self-reliant', 'boundaries',
        'privacy', 'autonomous', 'alone', 'rational', 'logic', 'objective', 'factual'],
      low: ['dependent', 'reliant', 'bound', 'obligated', 'constrained', 'helpless']
    },
    dauer: {
      high: ['security', 'stability', 'planning', 'order', 'reliability',
        'routine', 'structure', 'consistent', 'predictable', 'systematic', 'organized'],
      low: ['insecurity', 'chaos', 'unplanned', 'unstable', 'erratic', 'unreliable']
    },
    wechsel: {
      high: ['change', 'variety', 'novelty', 'spontaneity', 'flexibility',
        'dynamic', 'improvisation', 'creative', 'innovation', 'adventure', 'curious'],
      low: ['stuck', 'rigid', 'monotonous', 'boring', 'inflexible', 'stubborn', 'static']
    }
  }
};

// Big5/OCEAN Keywords (bidirectional)
const BIG5_KEYWORDS = {
  de: {
    openness: {
      high: ['kreativ', 'neugierig', 'fantasievoll', 'offen', 'innovativ', 'originell', 'philosophisch', 'intellektuell'],
      low: ['traditionell', 'konventionell', 'konservativ', 'praktisch', 'routiniert', 'bodenständig']
    },
    conscientiousness: {
      high: ['organisiert', 'pünktlich', 'strukturiert', 'diszipliniert', 'gewissenhaft', 'zuverlässig', 'ordentlich', 'sorgfältig'],
      low: ['spontan', 'chaotisch', 'impulsiv', 'vergesslich', 'unorganisiert', 'nachlässig', 'planlos']
    },
    extraversion: {
      high: ['gesellig', 'gesprächig', 'energiegeladen', 'enthusiastisch', 'aktiv', 'kontaktfreudig', 'lebhaft'],
      low: ['ruhig', 'zurückhaltend', 'introvertiert', 'nachdenklich', 'still', 'schüchtern', 'reserviert']
    },
    agreeableness: {
      high: ['hilfsbereit', 'kooperativ', 'vertrauensvoll', 'freundlich', 'mitfühlend', 'einfühlsam', 'warmherzig'],
      low: ['kritisch', 'wettbewerbsorientiert', 'skeptisch', 'direkt', 'konfrontativ', 'misstrauisch']
    },
    neuroticism: {
      high: ['ängstlich', 'nervös', 'unsicher', 'besorgt', 'gestresst', 'emotional', 'verletzlich', 'angespannt'],
      low: ['gelassen', 'entspannt', 'stabil', 'selbstsicher', 'ausgeglichen', 'ruhig', 'belastbar']
    }
  },
  en: {
    openness: {
      high: ['creative', 'curious', 'imaginative', 'open', 'innovative', 'original', 'philosophical', 'intellectual'],
      low: ['traditional', 'conventional', 'conservative', 'practical', 'routine', 'down-to-earth']
    },
    conscientiousness: {
      high: ['organized', 'punctual', 'structured', 'disciplined', 'conscientious', 'reliable', 'orderly', 'careful'],
      low: ['spontaneous', 'chaotic', 'impulsive', 'forgetful', 'disorganized', 'careless', 'unplanned']
    },
    extraversion: {
      high: ['sociable', 'talkative', 'energetic', 'enthusiastic', 'active', 'outgoing', 'lively'],
      low: ['quiet', 'reserved', 'introverted', 'reflective', 'silent', 'shy', 'withdrawn']
    },
    agreeableness: {
      high: ['helpful', 'cooperative', 'trusting', 'friendly', 'compassionate', 'empathetic', 'warmhearted'],
      low: ['critical', 'competitive', 'skeptical', 'direct', 'confrontational', 'distrustful']
    },
    neuroticism: {
      high: ['anxious', 'nervous', 'insecure', 'worried', 'stressed', 'emotional', 'vulnerable', 'tense'],
      low: ['calm', 'relaxed', 'stable', 'confident', 'balanced', 'serene', 'resilient']
    }
  }
};

// Spiral Dynamics Keywords (bidirectional)
const SD_KEYWORDS = {
  de: {
    turquoise: {
      high: ['ganzheitlich', 'global', 'vernetzt', 'ökologisch', 'kollektiv', 'spirituell', 'bewusstsein', 'integral'],
      low: ['isoliert', 'fragmentiert', 'kurzfristig', 'materialistisch']
    },
    yellow: {
      high: ['systemisch', 'komplex', 'integriert', 'flexibel', 'multiperspektiv', 'autonom', 'wissen', 'funktional'],
      low: ['dogmatisch', 'starr', 'eindimensional', 'simplifiziert']
    },
    green: {
      high: ['gemeinschaft', 'gleichheit', 'harmonie', 'konsens', 'inklusion', 'empathie', 'vielfalt', 'kooperation'],
      low: ['hierarchie', 'ausgrenzung', 'konkurrenz', 'dominanz', 'elitär']
    },
    orange: {
      high: ['erfolg', 'leistung', 'fortschritt', 'wettbewerb', 'gewinn', 'effizienz', 'strategie', 'innovation'],
      low: ['mittelmäßigkeit', 'stagnation', 'ineffizient', 'unprofessionell']
    },
    blue: {
      high: ['ordnung', 'regeln', 'pflicht', 'disziplin', 'autorität', 'tradition', 'prinzipien', 'verantwortung'],
      low: ['chaos', 'regellos', 'unverantwortlich', 'undiszipliniert']
    },
    red: {
      high: ['macht', 'stärke', 'durchsetzung', 'kontrolle', 'dominanz', 'respekt', 'sofort', 'impuls'],
      low: ['schwach', 'unterwürfig', 'machtlos', 'ohnmächtig']
    },
    purple: {
      high: ['zugehörigkeit', 'ritual', 'tradition', 'ahnen', 'mystisch', 'stamm', 'familie', 'schutz'],
      low: ['entwurzelt', 'traditionslos', 'heimatlos']
    },
    beige: {
      high: ['überleben', 'instinkt', 'grundbedürfnis', 'sicherheit', 'schutz', 'gesundheit', 'körper'],
      low: ['überfluss', 'komfort', 'luxus']
    }
  },
  en: {
    turquoise: {
      high: ['holistic', 'global', 'interconnected', 'ecological', 'collective', 'spiritual', 'consciousness', 'integral'],
      low: ['isolated', 'fragmented', 'short-term', 'materialistic']
    },
    yellow: {
      high: ['systemic', 'complex', 'integrated', 'flexible', 'multiperspective', 'autonomous', 'knowledge', 'functional'],
      low: ['dogmatic', 'rigid', 'one-dimensional', 'simplified']
    },
    green: {
      high: ['community', 'equality', 'harmony', 'consensus', 'inclusion', 'empathy', 'diversity', 'cooperation'],
      low: ['hierarchy', 'exclusion', 'competition', 'dominance', 'elitist']
    },
    orange: {
      high: ['success', 'achievement', 'progress', 'competition', 'profit', 'efficiency', 'strategy', 'innovation'],
      low: ['mediocrity', 'stagnation', 'inefficient', 'unprofessional']
    },
    blue: {
      high: ['order', 'rules', 'duty', 'discipline', 'authority', 'tradition', 'principles', 'responsibility'],
      low: ['chaos', 'lawless', 'irresponsible', 'undisciplined']
    },
    red: {
      high: ['power', 'strength', 'assertion', 'control', 'dominance', 'respect', 'immediate', 'impulse'],
      low: ['weak', 'submissive', 'powerless', 'helpless']
    },
    purple: {
      high: ['belonging', 'ritual', 'tradition', 'ancestors', 'mystical', 'tribe', 'family', 'protection'],
      low: ['uprooted', 'traditionless', 'homeless']
    },
    beige: {
      high: ['survival', 'instinct', 'basic needs', 'safety', 'protection', 'health', 'body'],
      low: ['abundance', 'comfort', 'luxury']
    }
  }
};

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

/**
 * Count keyword matches in text (bidirectional)
 */
function countKeywords(text: string, highKeywords: string[], lowKeywords: string[]): { high: number; low: number; delta: number } {
  const lowerText = text.toLowerCase();
  let highCount = 0;
  let lowCount = 0;
  
  for (const word of highKeywords) {
    const regex = new RegExp(`\\b${word}\\w*\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) highCount += matches.length;
  }
  
  for (const word of lowKeywords) {
    const regex = new RegExp(`\\b${word}\\w*\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) lowCount += matches.length;
  }
  
  return { high: highCount, low: lowCount, delta: highCount - lowCount };
}

/**
 * Analyze chat history for Riemann-Thomann markers
 */
export function analyzeRiemann(chatHistory: Message[], lang: 'de' | 'en' = 'de'): Record<string, number> {
  const keywords = RIEMANN_KEYWORDS[lang] || RIEMANN_KEYWORDS.de;
  const userText = chatHistory
    .filter(m => m.role === 'user')
    .map(m => m.text)
    .join(' ');
  
  const result: Record<string, number> = {};
  for (const [dimension, { high, low }] of Object.entries(keywords)) {
    const { delta } = countKeywords(userText, high, low);
    result[dimension] = delta;
  }
  
  return result;
}

/**
 * Analyze chat history for Big5/OCEAN markers
 */
export function analyzeBig5(chatHistory: Message[], lang: 'de' | 'en' = 'de'): Record<string, number> {
  const keywords = BIG5_KEYWORDS[lang] || BIG5_KEYWORDS.de;
  const userText = chatHistory
    .filter(m => m.role === 'user')
    .map(m => m.text)
    .join(' ');
  
  const result: Record<string, number> = {};
  for (const [trait, { high, low }] of Object.entries(keywords)) {
    const { delta } = countKeywords(userText, high, low);
    result[trait] = delta;
  }
  
  return result;
}

/**
 * Analyze chat history for Spiral Dynamics markers
 */
export function analyzeSD(chatHistory: Message[], lang: 'de' | 'en' = 'de'): Record<string, number> {
  const keywords = SD_KEYWORDS[lang] || SD_KEYWORDS.de;
  const userText = chatHistory
    .filter(m => m.role === 'user')
    .map(m => m.text)
    .join(' ');
  
  const result: Record<string, number> = {};
  for (const [level, { high, low }] of Object.entries(keywords)) {
    const { delta } = countKeywords(userText, high, low);
    result[level] = delta;
  }
  
  return result;
}

/**
 * Analyze chat history for all profile types
 */
export function analyzeSession(chatHistory: Message[], lang: 'de' | 'en' = 'de') {
  return {
    riemann: analyzeRiemann(chatHistory, lang),
    big5: analyzeBig5(chatHistory, lang),
    sd: analyzeSD(chatHistory, lang)
  };
}
