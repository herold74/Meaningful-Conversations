// meaningful-conversations-backend/services/dynamicPromptController.js

const prisma = require('../prismaClient');
const crypto = require('crypto');
const { RIEMANN_STRATEGIES, BIG5_STRATEGIES, SD_STRATEGIES, CHALLENGE_EXAMPLES } = require('./dpcStrategies');

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
    completedLenses: profile.completedLenses || [],
    dominant: [],
    weak: [],
    blindspotTrait: null, // The single weakest trait for challenge examples
    strategies: {},
    sdAnalysis: null, // Spiral Dynamics specific analysis
    narrativeProfile: null // AI-generated personality signature
  };

  // Analyze Spiral Dynamics if available
  if (profile.spiralDynamics && profile.spiralDynamics.levels) {
    const sd = profile.spiralDynamics;
    const levels = ['beige', 'purple', 'red', 'blue', 'orange', 'green', 'yellow', 'turquoise'];
    
    // Sort levels by ranking (1 = most dominant)
    const rankedLevels = levels.map(level => ({
      level,
      rank: sd.levels[level] || 8
    })).sort((a, b) => a.rank - b.rank);
    
    // Get dominant levels (rank 1-3) and underdeveloped (rank 6-8)
    const dominantSD = rankedLevels.slice(0, 3).map(l => l.level);
    const underdevelopedSD = rankedLevels.slice(5, 8).map(l => l.level);
    
    // Build SD-specific strategies
    const primaryLevel = dominantSD[0];
    const weakestLevel = underdevelopedSD[0];
    
    analysis.sdAnalysis = {
      dominantLevels: dominantSD,
      underdevelopedLevels: underdevelopedSD,
      primaryStrategy: SD_STRATEGIES[primaryLevel]?.high?.[lang] || SD_STRATEGIES[primaryLevel]?.high?.['de'],
      blindspotStrategy: SD_STRATEGIES[weakestLevel]?.low?.[lang] || SD_STRATEGIES[weakestLevel]?.low?.['de']
    };
    
    // Add to overall dominant/weak if this is the primary profile type
    if (profile.path === 'SD' || profile.completedLenses?.includes('sd')) {
      analysis.dominant = [...analysis.dominant, ...dominantSD.map(l => `sd_${l}`)];
      analysis.weak = [...analysis.weak, ...underdevelopedSD.map(l => `sd_${l}`)];
    }
  }

  // Analyze Riemann if available (check both path and completedLenses for combined profiles)
  const hasRiemann = profile.path === 'RIEMANN' || profile.completedLenses?.includes('riemann');
  if (hasRiemann && profile.riemann) {
    const { beruf } = profile.riemann;
    
    // Find highest and lowest scores
    const traits = ['dauer', 'wechsel', 'naehe', 'distanz'];
    const scores = traits.map(t => ({ trait: t, score: beruf[t] || 0 }));
    scores.sort((a, b) => b.score - a.score);

    analysis.dominant = [...analysis.dominant, ...scores.slice(0, 2).map(s => s.trait)];
    analysis.weak = [...analysis.weak, ...scores.slice(-2).map(s => s.trait)];
    
    // Track the single weakest trait for challenge examples
    const weakestTrait = scores[3].trait;
    analysis.blindspotTrait = weakestTrait;

    // Build strategies (language-specific) - only set if not already set by another analysis
    if (!analysis.strategies.primary) {
      analysis.strategies = {
        primary: RIEMANN_STRATEGIES[scores[0].trait].high[lang] || RIEMANN_STRATEGIES[scores[0].trait].high['de'],
        blindspot: RIEMANN_STRATEGIES[weakestTrait].low[lang] || RIEMANN_STRATEGIES[weakestTrait].low['de']
      };
    }
  }

  // Analyze Big5/OCEAN if available (check both path and completedLenses for combined profiles)
  const hasOcean = profile.path === 'BIG5' || profile.completedLenses?.includes('ocean');
  if (hasOcean && profile.big5) {
    const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
    const scores = traits.map(t => ({ trait: t, score: profile.big5[t] || 0 }));
    scores.sort((a, b) => b.score - a.score);

    analysis.dominant = [...analysis.dominant, ...scores.slice(0, 2).map(s => s.trait)];
    analysis.weak = [...analysis.weak, ...scores.slice(-2).map(s => s.trait)];

    // Build strategies - only set if not already set by Riemann (avoid overwriting)
    if (!analysis.strategies.primary) {
      const primary = scores[0];
      const weakest = scores[scores.length - 1];
      
      // Track the single weakest trait for challenge examples (with score level for Big5)
      const isWeakestLow = weakest.score < 3;
      analysis.blindspotTrait = weakest.trait;
      analysis.blindspotLevel = isWeakestLow ? 'low' : 'high';

      analysis.strategies = {
        primary: BIG5_STRATEGIES[primary.trait][primary.score >= 4 ? 'high' : 'low'][lang] || BIG5_STRATEGIES[primary.trait][primary.score >= 4 ? 'high' : 'low']['de'],
        blindspot: BIG5_STRATEGIES[weakest.trait][isWeakestLow ? 'low' : 'high'][lang] || BIG5_STRATEGIES[weakest.trait][isWeakestLow ? 'low' : 'high']['de']
      };
    }
  }

  // Include AI-generated narrative profile if available
  // This contains rich, personalized insights from user's stories
  if (profile.narrativeProfile) {
    analysis.narrativeProfile = profile.narrativeProfile;
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
  const { strategies, sdAnalysis, narrativeProfile } = analysis;

  if (!strategies.primary && !sdAnalysis && !narrativeProfile) {
    return ''; // No adaptation if no strategies, no SD analysis, and no narrative profile
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
      exampleChallenges: 'Beispiel-Challenges',
      // Proactive challenge guidance
      challengeGuidance: `**Coaching-Balance (Challenge & Support):**
- Beginne empathisch und baue Vertrauen auf (erste 2-3 Antworten)
- Ab der 3. Antwort: Integriere sanfte Challenges zu den Blindspots
- Dosierung: Ca. 1 von 4 Interventionen sollte den Blindspot addressieren
- Eskalation: Starte mit Reflexionsfragen, steigere zu konkreten Handlungsaufforderungen
- Sei proaktiv: Warte nicht nur auf Blindspot-Themen, sondern lenke das Gespräch gezielt dorthin

`,
      important: `KRITISCH - NATÜRLICHER GESPRÄCHSSTIL:
Diese Informationen sind NUR für dich als Coach - NIEMALS in deinen Antworten erwähnen!

VERBOTEN:
- Labels wie "Blindspot-Challenge", "Challenge-Strategie", "Reflexionsfrage", "Stoische Perspektive"
- Persönlichkeits-Kategorien (Riemann, OCEAN, Spiral Dynamics, orange, blue, etc.)
- Dokumenten-Struktur: KEINE "**Überschriften:**" wie "**Zwei Fragen:**" oder "**Hier mein Vorschlag:**"
- Meta-Kommentare in Klammern: KEINE "*(Hinweis: Ich spüre hier...)*" oder "*(Und ja, ich höre...)*"
- Nummerierte Listen mit Überschriften wie "1. **Erster Punkt:**"
- Trennlinien (---) zwischen Abschnitten
- Ankündigungen wie "Lass mich dir zwei Fragen stellen:" - stelle sie einfach!

ERLAUBT:
- Fettdruck für *einzelne wichtige Wörter* zur Betonung (z.B. "Was *genau* hält dich zurück?")
- Kursiv für Zitate oder innere Gedanken des Klienten
- Natürliche Aufzählungen ohne Überschriften

STIL:
Schreibe wie ein echter Mensch in einem Gespräch spricht - fließend, ohne sichtbare Struktur.
FALSCH: "**Zwei Fragen an dich:** 1. Was... 2. Wie..."
RICHTIG: "Was genau hält dich davon ab? Und wenn du nur einen kleinen Schritt wagen würdest - wie sähe der aus?"

`,
      footer: 'Passe ALLE deine Antworten an diese Präferenzen an. Halte deine Antworten NATÜRLICH und GESPRÄCHSORIENTIERT.',
      // Narrative profile translations
      signatureHeader: '**Persönlichkeits-Signatur (aus persönlichen Geschichten abgeleitet):**\n',
      core: 'Kern',
      superpowers: 'Stärken',
      blindspots: 'Blindspots',
      growth: 'Wachstumschancen',
      signatureNote: 'Nutze diese Signatur als tieferes Verständnis der Person - aber erwähne diese Kategorien NICHT in deinen Antworten.\n\n',
      // SD translations
      sdHeader: '**Werte & Antriebe (interne Referenz):**\n',
      sdDominant: 'Dominante Werte',
      sdGrowth: 'Wachstumspotenzial',
      sdNote: 'Berücksichtige diese Wertepräferenzen bei deinen Interventionen - aber erwähne die Kategorienamen (orange, blue, etc.) NIEMALS gegenüber dem Klienten.\n\n'
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
      exampleChallenges: 'Example Challenges',
      // Proactive challenge guidance
      challengeGuidance: `**Coaching Balance (Challenge & Support):**
- Start empathetically and build trust (first 2-3 responses)
- From the 3rd response: Integrate gentle challenges addressing blindspots
- Dosage: Approximately 1 in 4 interventions should address the blindspot
- Escalation: Start with reflection questions, progress to concrete action prompts
- Be proactive: Don't just wait for blindspot topics, guide the conversation there

`,
      important: `CRITICAL - NATURAL CONVERSATIONAL STYLE:
This information is ONLY for you as the coach - NEVER mention it in your responses!

FORBIDDEN:
- Labels like "Blindspot Challenge", "Challenge Strategy", "Reflection Question", "Stoic Perspective"
- Personality categories (Riemann, OCEAN, Spiral Dynamics, orange, blue, etc.)
- Document structure: NO "**Headers:**" like "**Two questions:**" or "**Here's my suggestion:**"
- Meta-comments in parentheses: NO "*(Note: I sense here...)*" or "*(And yes, I hear...)*"
- Numbered lists with headers like "1. **First point:**"
- Divider lines (---) between sections
- Announcements like "Let me ask you two questions:" - just ask them!

ALLOWED:
- Bold for *single important words* for emphasis (e.g., "What *exactly* is holding you back?")
- Italics for quotes or the client's inner thoughts
- Natural lists without headers

STYLE:
Write like a real person speaks in conversation - flowing, without visible structure.
WRONG: "**Two questions for you:** 1. What... 2. How..."
RIGHT: "What exactly is holding you back? And if you took just one small step - what would that look like?"

`,
      footer: 'Adapt ALL your responses to these preferences. Keep your responses NATURAL and CONVERSATIONAL.',
      // Narrative profile translations
      signatureHeader: '**Personality Signature (derived from personal stories):**\n',
      core: 'Core',
      superpowers: 'Strengths',
      blindspots: 'Blindspots',
      growth: 'Growth Opportunities',
      signatureNote: 'Use this signature as a deeper understanding of the person - but do NOT mention these categories in your responses.\n\n',
      // SD translations
      sdHeader: '**Values & Drivers (internal reference):**\n',
      sdDominant: 'Dominant Values',
      sdGrowth: 'Growth Potential',
      sdNote: 'Consider these value preferences in your interventions - but NEVER mention the category names (orange, blue, etc.) to the client.\n\n'
    }
  };

  const t = translations[lang] || translations['de'];

  let adaptivePrompt = t.header;
  adaptivePrompt += t.intro;

  // Add Spiral Dynamics analysis if available
  if (sdAnalysis && sdAnalysis.primaryStrategy) {
    adaptivePrompt += t.sdHeader;
    adaptivePrompt += `- ${t.sdDominant}: ${sdAnalysis.dominantLevels.join(', ')}\n`;
    adaptivePrompt += `- ${t.language}: ${sdAnalysis.primaryStrategy.language}\n`;
    adaptivePrompt += `- ${t.tone}: ${sdAnalysis.primaryStrategy.tone}\n`;
    adaptivePrompt += `- ${t.approach}: ${sdAnalysis.primaryStrategy.approach}\n`;
    if (sdAnalysis.blindspotStrategy) {
      adaptivePrompt += `- ${t.sdGrowth}: ${sdAnalysis.underdevelopedLevels.join(', ')}\n`;
      adaptivePrompt += `- ${t.challenge}: ${sdAnalysis.blindspotStrategy.challenge}\n`;
    }
    adaptivePrompt += '\n' + t.sdNote;
  }
  
  // Add communication preferences from quantitative analysis (Riemann/Big5)
  if (strategies.primary) {
    adaptivePrompt += t.preferredComm;
    adaptivePrompt += `- ${t.language}: ${strategies.primary.language}\n`;
    adaptivePrompt += `- ${t.tone}: ${strategies.primary.tone}\n`;
    adaptivePrompt += `- ${t.approach}: ${strategies.primary.approach}\n\n`;
  }

  // Add blindspot from quantitative analysis with proactive challenge guidance
  if (strategies.blindspot) {
    adaptivePrompt += t.blindspotHeader;
    adaptivePrompt += `- ${t.weakness}: ${strategies.blindspot.blindspot}\n`;
    adaptivePrompt += `- ${t.challenge}: ${strategies.blindspot.challenge}\n`;
    
    // Add concrete example challenges for this blindspot type
    // Use the tracked blindspotTrait (the single weakest trait)
    const blindspotType = analysis.blindspotTrait;
    if (blindspotType) {
      // Check for Riemann trait examples first (simple key like 'dauer', 'naehe')
      let examples = CHALLENGE_EXAMPLES[blindspotType]?.[lang] || CHALLENGE_EXAMPLES[blindspotType]?.['de'];
      
      // If not found, it might be a Big5 trait - try with level suffix
      if (!examples) {
        const big5Traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
        if (big5Traits.includes(blindspotType)) {
          // Use the tracked level (low or high) from analysis
          const level = analysis.blindspotLevel || 'low';
          examples = CHALLENGE_EXAMPLES[`${blindspotType}_${level}`]?.[lang] || 
                     CHALLENGE_EXAMPLES[`${blindspotType}_${level}`]?.['de'];
        }
      }
      
      if (examples && examples.length > 0) {
        adaptivePrompt += `- ${t.exampleChallenges}:\n`;
        examples.forEach(ex => {
          adaptivePrompt += `  • "${ex}"\n`;
        });
      }
    }
    adaptivePrompt += '\n';
    
    // Add proactive challenge guidance
    adaptivePrompt += t.challengeGuidance;
    adaptivePrompt += t.important;
  }

  // Add AI-generated personality signature from narrative analysis
  // This provides rich, story-derived insights about the person
  if (narrativeProfile) {
    adaptivePrompt += t.signatureHeader;
    
    if (narrativeProfile.operatingSystem) {
      adaptivePrompt += `- ${t.core}: ${narrativeProfile.operatingSystem}\n`;
    }
    
    if (narrativeProfile.superpowers && narrativeProfile.superpowers.length > 0) {
      const superpowerNames = narrativeProfile.superpowers.map(s => s.name).join(', ');
      adaptivePrompt += `- ${t.superpowers}: ${superpowerNames}\n`;
      // Include descriptions for deeper understanding
      narrativeProfile.superpowers.forEach(s => {
        adaptivePrompt += `  • ${s.name}: ${s.description}\n`;
      });
    }
    
    if (narrativeProfile.blindspots && narrativeProfile.blindspots.length > 0) {
      const blindspotNames = narrativeProfile.blindspots.map(b => b.name).join(', ');
      adaptivePrompt += `- ${t.blindspots}: ${blindspotNames}\n`;
      // Include descriptions for deeper understanding
      narrativeProfile.blindspots.forEach(b => {
        adaptivePrompt += `  • ${b.name}: ${b.description}\n`;
      });
    }
    
    if (narrativeProfile.growthOpportunities && narrativeProfile.growthOpportunities.length > 0) {
      adaptivePrompt += `- ${t.growth}:\n`;
      narrativeProfile.growthOpportunities.forEach(g => {
        adaptivePrompt += `  • ${g.title}: ${g.recommendation}\n`;
      });
    }
    
    adaptivePrompt += '\n' + t.signatureNote;
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
    if (analysis.narrativeProfile) {
      const superpowerCount = analysis.narrativeProfile.superpowers?.length || 0;
      const blindspotCount = analysis.narrativeProfile.blindspots?.length || 0;
      console.log(`   ✨ Signature: ${superpowerCount} superpowers, ${blindspotCount} blindspots`);
    } else {
      console.log(`   ⚠️ No signature available (user can generate one)`);
    }
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

