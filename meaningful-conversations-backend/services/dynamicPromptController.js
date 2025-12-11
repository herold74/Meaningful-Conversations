// meaningful-conversations-backend/services/dynamicPromptController.js

const prisma = require('../prismaClient');
const crypto = require('crypto');
const { RIEMANN_STRATEGIES, BIG5_STRATEGIES } = require('./dpcStrategies');

/**
 * Dynamic Prompt Controller (DPC)
 * Generates adaptive system prompts based on user's personality profile
 */

// Strategies are now imported from dpcStrategies.js
/* OLD CODE - Moved to dpcStrategies.js
const RIEMANN_STRATEGIES = {
  dauer: {
    high: {
      de: {
        language: 'strukturiert, schrittweise, mit klaren Deadlines',
        tone: 'beruhigend, bestätigend, zuverlässig',
        approach: 'Biete konkrete To-Do-Listen, Zeitpläne und Sicherheit an.'
      },
      en: {
        language: 'structured, step-by-step, with clear deadlines',
        tone: 'reassuring, affirming, reliable',
        approach: 'Offer concrete to-do lists, timelines, and security.'
      }
    },
    low: {
      de: {
        blindspot: 'Flexibilität, spontane Anpassung, Risiko-Toleranz',
        challenge: 'Fordere gezielt auf, etwas Unstrukturiertes oder Ungewisses auszuprobieren.'
      },
      en: {
        blindspot: 'Flexibility, spontaneous adaptation, risk tolerance',
        challenge: 'Specifically challenge them to try something unstructured or uncertain.'
      }
    }
  },
  wechsel: {
    high: {
      language: 'dynamisch, inspirierend, abwechslungsreich',
      tone: 'begeisternd, energiegeladen, ermutigend',
      approach: 'Nutze Metaphern, springe zwischen Perspektiven, sei spontan.'
    },
    low: {
      blindspot: 'Routine, langfristige Planung, Disziplin',
      challenge: 'Fordere auf, einen langfristigen, strukturierten Plan zu entwickeln.'
    }
  },
  naehe: {
    high: {
      language: 'empathisch, warm, persönlich',
      tone: 'fürsorglich, unterstützend, verbindlich',
      approach: 'Nutze "Wir"-Sprache, erkundige dich nach Gefühlen, zeige Mitgefühl.'
    },
    low: {
      blindspot: 'Emotionale Abgrenzung, Konfliktfähigkeit, sachliche Kritik',
      challenge: 'Fordere auf, ein klares "Nein" zu sagen oder sachliche Distanz einzunehmen.'
    }
  },
  distanz: {
    high: {
      language: 'rational, kurz, prägnant',
      tone: 'objektiv, sachlich, direkt',
      approach: 'Nutze Daten, Fakten, logische Argumente. Vermeide übermäßige Emotion.'
    },
    low: {
      blindspot: 'Unabhängigkeit, Objektivität, emotionale Selbstregulation',
      challenge: 'Fordere auf, eine rein rationale Analyse zu machen, ohne Emotionen.'
    }
  }
};

// Big Five Adaptation Strategies
const BIG5_STRATEGIES = {
  openness: {
    high: {
      language: 'abstrakt, theoretisch, visionär',
      tone: 'neugierig, explorativ, philosophisch',
      approach: 'Nutze Gedankenexperimente, neue Perspektiven, unkonventionelle Lösungen.'
    },
    low: {
      language: 'konkret, bewährt, pragmatisch',
      tone: 'bodenständig, verlässlich, bewahrt',
      approach: 'Nutze bekannte Methoden, vermeide zu viel Abstraktion.'
    }
  },
  conscientiousness: {
    high: {
      language: 'detailliert, strukturiert, geplant',
      tone: 'gewissenhaft, präzise, zuverlässig',
      approach: 'Nutze Checklisten, klare Fristen, messbare Ziele.'
    },
    low: {
      language: 'flexibel, spontan, experimentell',
      tone: 'locker, adaptiv, improvisierend',
      approach: 'Erlaube Unordnung, akzeptiere Prokrastination, betone Flexibilität.'
    }
  },
  extraversion: {
    high: {
      language: 'gesellig, energiegeladen, expressiv',
      tone: 'enthusiastisch, motivierend, aktivierend',
      approach: 'Schlage soziale Aktivitäten vor, nutze "Du" oder "Wir"-Sprache.'
    },
    low: {
      language: 'zurückhaltend, reflektiert, ruhig',
      tone: 'bedacht, nachdenklich, introspektiv',
      approach: 'Respektiere Stille, schlage Einzel-Reflexionen vor.'
    }
  },
  agreeableness: {
    high: {
      language: 'kooperativ, harmonisch, unterstützend',
      tone: 'freundlich, rücksichtsvoll, einfühlsam',
      approach: 'Betone Teamwork, Konsens, gemeinsame Lösungen.'
    },
    low: {
      language: 'direkt, wettbewerbsorientiert, kritisch',
      tone: 'herausfordernd, konfrontativ, durchsetzungsstark',
      approach: 'Nutze sachliche Kritik, erlaube Wettbewerb.'
    }
  },
  neuroticism: {
    low: {
      language: 'gelassen, optimistisch, risikobereit',
      tone: 'entspannt, zuversichtlich, ermütigend',
      approach: 'Ermutige zu mutigen Entscheidungen, minimiere Risiko-Warnungen.'
    },
    high: {
      language: 'beruhigend, strukturiert, sicherheitsgebend',
      tone: 'empathisch, geduldig, verständnisvoll',
      approach: 'Biete Sicherheit, erkenne Sorgen an, gehe schrittweise vor.'
    }
  }
};

/**
 * Decrypts profile data using the user's encryption key
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @param {string} derivationInfo - Key derivation info from user
 * @returns {Object} Decrypted profile
 */
async function decryptProfile(encryptedData, derivationInfo) {
  try {
    // Parse encrypted data (format: iv:authTag:ciphertext)
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, ciphertextHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');

    // Note: The actual decryption must happen client-side
    // This is a placeholder - the frontend will need to send decrypted profile
    // or we need to implement a different architecture where keys are managed server-side
    
    // For now, we'll expect the profile to be sent in plaintext from the frontend
    // after client-side decryption (secure via HTTPS)
    throw new Error('Server-side decryption not supported for E2EE. Profile must be decrypted client-side.');
  } catch (error) {
    console.error('Profile decryption error:', error);
    throw error;
  }
}

/**
 * Analyzes personality profile and determines dominant traits
 * @param {Object} profile - Decrypted personality profile
 * @param {string} lang - Language ('de' or 'en')
 * @returns {Object} Analysis with dominant and weak traits
 */
function analyzeProfile(profile, lang = 'de') {
  const analysis = {
    testType: profile.path,
    dominant: [],
    weak: [],
    strategies: {}
  };

  if (profile.path === 'RIEMANN' && profile.riemann) {
    const { beruf } = profile.riemann;
    
    // Find highest and lowest scores
    const traits = ['dauer', 'wechsel', 'naehe', 'distanz'];
    const scores = traits.map(t => ({ trait: t, score: beruf[t] || 0 }));
    scores.sort((a, b) => b.score - a.score);

    analysis.dominant = scores.slice(0, 2).map(s => s.trait);
    analysis.weak = scores.slice(-2).map(s => s.trait);

    // Build strategies (language-specific)
    analysis.strategies = {
      primary: RIEMANN_STRATEGIES[scores[0].trait].high[lang] || RIEMANN_STRATEGIES[scores[0].trait].high['de'],
      blindspot: RIEMANN_STRATEGIES[scores[3].trait].low[lang] || RIEMANN_STRATEGIES[scores[3].trait].low['de']
    };
  }

  if (profile.path === 'BIG5' && profile.big5) {
    const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
    const scores = traits.map(t => ({ trait: t, score: profile.big5[t] || 0 }));
    scores.sort((a, b) => b.score - a.score);

    analysis.dominant = scores.slice(0, 2).map(s => s.trait);
    analysis.weak = scores.slice(-2).map(s => s.trait);

    // Build strategies
    const primary = scores[0];
    const weakest = scores[scores.length - 1];

    analysis.strategies = {
      primary: BIG5_STRATEGIES[primary.trait][primary.score >= 4 ? 'high' : 'low'][lang] || BIG5_STRATEGIES[primary.trait][primary.score >= 4 ? 'high' : 'low']['de'],
      blindspot: BIG5_STRATEGIES[weakest.trait][weakest.score >= 3 ? 'high' : 'low'][lang] || BIG5_STRATEGIES[weakest.trait][weakest.score >= 3 ? 'high' : 'low']['de']
    };
  }

  return analysis;
}

/**
 * Generates adaptive system prompt based on profile analysis
 * @param {Object} analysis - Profile analysis
 * @param {string} lang - Language ('de' or 'en')
 * @returns {string} Adaptive system prompt addition
 */
function generateAdaptivePrompt(analysis, lang = 'de') {
  const { strategies } = analysis;

  if (!strategies.primary) {
    return ''; // No adaptation if no strategies
  }

  const translations = {
    de: {
      header: '\n\n--- PERSONALISIERTES COACHING-PROFIL (DPC-Modus) ---\n\n',
      intro: 'Du coachst eine Person mit folgenden Präferenzen:\n\n',
      preferredComm: '**Bevorzugte Kommunikation:**\n',
      language: 'Sprache',
      tone: 'Ton',
      approach: 'Ansatz',
      blindspotHeader: '**Blinder Fleck (Herausforderungszone):**\n',
      weakness: 'Schwäche',
      challenge: 'Challenge-Strategie',
      important: 'WICHTIG: Wenn die Person Themen anspricht, die diesen Blindspot betreffen, formuliere eine gezielte Herausforderung, um sie aus ihrer Komfortzone zu locken. Sei dabei respektvoll, aber bestimmt.\n\n',
      footer: 'Passe ALLE deine Antworten an diese Präferenzen an. Dies ist ein experimenteller Modus, der die Coaching-Effektivität maximieren soll.'
    },
    en: {
      header: '\n\n--- PERSONALIZED COACHING PROFILE (DPC Mode) ---\n\n',
      intro: 'You are coaching a person with the following preferences:\n\n',
      preferredComm: '**Preferred Communication:**\n',
      language: 'Language',
      tone: 'Tone',
      approach: 'Approach',
      blindspotHeader: '**Blindspot (Challenge Zone):**\n',
      weakness: 'Weakness',
      challenge: 'Challenge Strategy',
      important: 'IMPORTANT: When the person addresses topics related to this blindspot, formulate a targeted challenge to move them out of their comfort zone. Be respectful but firm.\n\n',
      footer: 'Adapt ALL your responses to these preferences. This is an experimental mode designed to maximize coaching effectiveness.'
    }
  };

  const t = translations[lang] || translations['de'];

  let adaptivePrompt = t.header;
  adaptivePrompt += t.intro;
  adaptivePrompt += t.preferredComm;
  adaptivePrompt += `- ${t.language}: ${strategies.primary.language}\n`;
  adaptivePrompt += `- ${t.tone}: ${strategies.primary.tone}\n`;
  adaptivePrompt += `- ${t.approach}: ${strategies.primary.approach}\n\n`;

  if (strategies.blindspot) {
    adaptivePrompt += t.blindspotHeader;
    adaptivePrompt += `- ${t.weakness}: ${strategies.blindspot.blindspot}\n`;
    adaptivePrompt += `- ${t.challenge}: ${strategies.blindspot.challenge}\n\n`;
    adaptivePrompt += t.important;
  }

  adaptivePrompt += t.footer;

  return adaptivePrompt;
}

/**
 * Main function: Generate adaptive prompt for a user
 * @param {string} userId - User ID
 * @param {Object} decryptedProfile - Already decrypted profile (from frontend)
 * @param {string} lang - Language ('de' or 'en')
 * @returns {string} Adaptive system prompt
 */
async function generatePromptForUser(userId, decryptedProfile, lang = 'de') {
  try {
    if (!decryptedProfile) {
      console.warn(`DPC: No profile provided for user ${userId}`);
      return '';
    }

    // Analyze profile
    const analysis = analyzeProfile(decryptedProfile, lang);

    // Generate adaptive prompt
    const adaptivePrompt = generateAdaptivePrompt(analysis, lang);

    console.log(`🧪 [DPC] Generated adaptive prompt for user ${userId}`);
    console.log(`   Profile: ${analysis.testType}, Language: ${lang}`);
    console.log(`   Dominant: ${analysis.dominant.join(', ')}`);
    console.log(`   Weak: ${analysis.weak.join(', ')}`);
    return adaptivePrompt;
  } catch (error) {
    console.error('DPC Error:', error);
    return ''; // Fail gracefully
  }
}

module.exports = {
  generatePromptForUser,
  analyzeProfile,
  generateAdaptivePrompt
};

