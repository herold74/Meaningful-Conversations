// meaningful-conversations-backend/services/dynamicPromptController.js

const prisma = require('../prismaClient');
const crypto = require('crypto');
const { RIEMANN_STRATEGIES, BIG5_STRATEGIES, SD_STRATEGIES, CHALLENGE_EXAMPLES } = require('./dpcStrategies');
const { StrategyMerger } = require('./dpcStrategyMerger');

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
 * @param {string} language - Language ('de' or 'en')
 * @returns {Object} Analysis with dominant and weak traits
 */
function analyzeProfile(profile, language = 'de') {
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
      primaryStrategy: SD_STRATEGIES[primaryLevel]?.high?.[language] || SD_STRATEGIES[primaryLevel]?.high?.['de'],
      blindspotStrategy: SD_STRATEGIES[weakestLevel]?.low?.[language] || SD_STRATEGIES[weakestLevel]?.low?.['de']
    };
    
    // Add to overall dominant/weak if this is the primary profile type
    if (profile.path === 'SD' || profile.completedLenses?.includes('sd')) {
      analysis.dominant = [...analysis.dominant, ...dominantSD.map(l => `sd_${l}`)];
      analysis.weak = [...analysis.weak, ...underdevelopedSD.map(l => `sd_${l}`)];
    }
  }

  // Analyze Riemann if available (check both path and completedLenses for combined profiles)
  // Uses 'selbst' (self-image) as primary context — in a coaching session the client
  // presents as "themselves", not in a work or private role. See dpcStrategyMerger.js.
  // The Riemann test always collects all 3 contexts (beruf, privat, selbst) together,
  // so there is no scenario where selbst would be missing while others exist.
  const hasRiemann = profile.path === 'RIEMANN' || profile.completedLenses?.includes('riemann');
  if (hasRiemann && profile.riemann && profile.riemann.selbst) {
    const selbst = profile.riemann.selbst;
    
    // Find highest and lowest scores
    const traits = ['dauer', 'wechsel', 'naehe', 'distanz'];
    const scores = traits.map(t => ({ trait: t, score: selbst[t] || 0 }));
    scores.sort((a, b) => b.score - a.score);

    analysis.dominant = [...analysis.dominant, ...scores.slice(0, 2).map(s => s.trait)];
    analysis.weak = [...analysis.weak, ...scores.slice(-2).map(s => s.trait)];
    
    // Track the single weakest trait for challenge examples
    const weakestTrait = scores[3].trait;
    analysis.blindspotTrait = weakestTrait;

    // Build strategies (language-specific) - only set if not already set by another analysis
    if (!analysis.strategies.primary) {
      analysis.strategies = {
        primary: RIEMANN_STRATEGIES[scores[0].trait].high[language] || RIEMANN_STRATEGIES[scores[0].trait].high['de'],
        blindspot: RIEMANN_STRATEGIES[weakestTrait].low[language] || RIEMANN_STRATEGIES[weakestTrait].low['de']
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
        primary: BIG5_STRATEGIES[primary.trait][primary.score >= 4 ? 'high' : 'low'][language] || BIG5_STRATEGIES[primary.trait][primary.score >= 4 ? 'high' : 'low']['de'],
        blindspot: BIG5_STRATEGIES[weakest.trait][isWeakestLow ? 'low' : 'high'][language] || BIG5_STRATEGIES[weakest.trait][isWeakestLow ? 'low' : 'high']['de']
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
 * @param {string} language - Language ('de' or 'en')
 * @returns {string} Adaptive system prompt addition
 */
function generateAdaptivePrompt(analysis, language = 'de') {
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
- Beginne empathisch und baue Vertrauen auf
- Gelegentlich (nicht in jeder Antwort): Integriere sanfte Challenges zu den Blindspots
- Eskalation: Starte mit Reflexionsfragen, steigere zu konkreten Handlungsaufforderungen
- Warte auf passende Gelegenheiten - forciere keine Blindspot-Themen

`,
      important: `KRITISCH - NATÜRLICHER GESPRÄCHSSTIL:
Diese Informationen sind NUR für dich als Coach - NIEMALS in deinen Antworten erwähnen!

VERBOTEN:
- Labels wie "Blindspot-Challenge", "Challenge-Strategie", "Reflexionsfrage", "Stoische Perspektive"
- Persönlichkeits-Kategorien (Riemann, OCEAN, Spiral Dynamics, orange, blue, etc.)
- Dokumenten-Struktur: KEINE "**Überschriften:**" wie "**Zwei Fragen:**" oder "**Hier mein Vorschlag:**"
- Meta-Kommentare in Klammern: KEINE "*(Hinweis: Ich spüre hier...)*" oder "*(Und ja, ich höre...)*"
- Aktionsbeschreibungen: KEINE "*Atmet tief ein*", "*Lehnt sich vor*", "*Nickt verständnisvoll*", etc.
- Rollenspielerische Beschreibungen: Schreibe wie ein Mensch spricht, nicht wie ein Theater-Skript
- Nummerierte Listen mit Überschriften wie "1. **Erster Punkt:**"
- Trennlinien (---) zwischen Abschnitten
- Ankündigungen wie "Lass mich dir zwei Fragen stellen:" - stelle sie einfach!
- Ganze Sätze fett markieren: KEINE "**Dein Ziel ist also, Klarheit zu gewinnen**" - nur einzelne Wörter!
- Bestätigungen vorwegnehmen: NICHT "Verstanden. Dein Ziel ist also..." oder "Ich verstehe. Es geht dir um..."
- Paraphrasieren ohne Rückfrage: NICHT annehmen, dass du richtig verstanden hast

ERLAUBT:
- Fettdruck für *einzelne wichtige Wörter* zur Betonung (z.B. "Was *genau* hält dich zurück?")
- Kursiv für Zitate oder innere Gedanken des Klienten
- Natürliche Aufzählungen ohne Überschriften
- Nachfragen zur Bestätigung: "Habe ich das richtig verstanden?" oder "Ist das der Kern?"

STIL:
Schreibe wie ein echter Mensch in einem Gespräch spricht - fließend, ohne sichtbare Struktur.
FALSCH: "Verstanden. Dein Ziel für heute ist also, **Klarheit darüber zu gewinnen, wie du deine eigene Stimme erkennst**."
RICHTIG: "Wenn ich dich richtig verstehe, geht es dir weniger um die Entscheidung selbst, sondern darum, *deine* Stimme wiederzufinden. Ist das der Kern?"

`,
      footer: `Passe ALLE deine Antworten an diese Präferenzen an. Halte deine Antworten NATÜRLICH und GESPRÄCHSORIENTIERT.

⚠️ ERSTE NACHRICHT - STRIKTE REGELN (überschreibt alles andere):
Wenn dies die ERSTE Nachricht einer Session ist und du nach "Next Steps" fragst:
- KEIN LOB für Fortschritte die du noch nicht gehört hast ("herzlichen Glückwunsch", "beeindruckt mich", etc.)
- NUR EINE einzige Frage stellen (z.B. "Wie lief es damit?")
- KEINE Alternativen anbieten ("falls Sie lieber...", "wenn Sie etwas anderes...")
- KEINE detaillierten Nachfragen zu spezifischen Aspekten
- STOPP nach der einen Frage. Warte auf die Antwort.`,
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
- Start empathetically and build trust
- Occasionally (not every response): Integrate gentle challenges addressing blindspots
- Escalation: Start with reflection questions, progress to concrete action prompts
- Wait for fitting opportunities - don't force blindspot topics

`,
      important: `CRITICAL - NATURAL CONVERSATIONAL STYLE:
This information is ONLY for you as the coach - NEVER mention it in your responses!

FORBIDDEN:
- Labels like "Blindspot Challenge", "Challenge Strategy", "Reflection Question", "Stoic Perspective"
- Personality categories (Riemann, OCEAN, Spiral Dynamics, orange, blue, etc.)
- Document structure: NO "**Headers:**" like "**Two questions:**" or "**Here's my suggestion:**"
- Meta-comments in parentheses: NO "*(Note: I sense here...)*" or "*(And yes, I hear...)*"
- Action descriptions: NO "*Takes a deep breath*", "*Leans forward*", "*Nods understandingly*", etc.
- Roleplay-style descriptions: Write like a human speaks, not like a theater script
- Numbered lists with headers like "1. **First point:**"
- Divider lines (---) between sections
- Announcements like "Let me ask you two questions:" - just ask them!
- Bold entire sentences: NO "**Your goal is to gain clarity**" - only single words!
- Presuming confirmation: NOT "I understand. So your goal is..." or "Got it. What you're saying is..."
- Paraphrasing without checking: Do NOT assume you understood correctly

ALLOWED:
- Bold for *single important words* for emphasis (e.g., "What *exactly* is holding you back?")
- Italics for quotes or the client's inner thoughts
- Natural lists without headers
- Checking for understanding: "Did I get that right?" or "Is that the core of it?"

STYLE:
Write like a real person speaks in conversation - flowing, without visible structure.
WRONG: "I understand. So your goal for today is **to gain clarity about how to recognize your own voice**."
RIGHT: "If I'm hearing you right, it's less about the decision itself and more about finding *your* voice again. Is that the heart of it?"

`,
      footer: `Adapt ALL your responses to these preferences. Keep your responses NATURAL and CONVERSATIONAL.

⚠️ FIRST MESSAGE - STRICT RULES (overrides everything else):
If this is the FIRST message of a session and you're asking about "Next Steps":
- NO PRAISING progress you haven't heard about yet ("congratulations", "impressed", etc.)
- Ask ONLY ONE simple question (e.g., "How did it go?")
- NO offering alternatives ("if you'd rather...", "in case you want something else...")
- NO detailed follow-up questions about specific aspects
- STOP after the one question. Wait for the response.`,
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

  const t = translations[language] || translations['de'];

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
      let examples = CHALLENGE_EXAMPLES[blindspotType]?.[language] || CHALLENGE_EXAMPLES[blindspotType]?.['de'];
      
      // If not found, it might be a Big5 trait - try with level suffix
      if (!examples) {
        const big5Traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
        if (big5Traits.includes(blindspotType)) {
          // Use the tracked level (low or high) from analysis
          const level = analysis.blindspotLevel || 'low';
          examples = CHALLENGE_EXAMPLES[`${blindspotType}_${level}`]?.[language] || 
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
 * Main function: Generate adaptive prompt for a user using StrategyMerger
 * @param {string} userId - User ID
 * @param {Object} decryptedProfile - Already decrypted profile (from frontend)
 * @param {string} language - Language ('de' or 'en')
 * @param {string} botId - Bot ID for bot-specific adaptations
 * @returns {Object} { prompt: string, strategiesUsed: string[], mergeMetadata: Object } - Adaptive system prompt and strategies used
 */
async function generatePromptForUser(userId, decryptedProfile, language = 'de', botId = null) {
  try {
    if (!decryptedProfile) {
      console.warn(`DPC: No profile provided for user ${userId}`);
      return { prompt: '', strategiesUsed: [], mergeMetadata: null };
    }

    // Use StrategyMerger to intelligently merge strategies
    const merger = new StrategyMerger(decryptedProfile, language);
    const mergeResult = merger.merge();

    // Validate narrative consistency if narrative profile exists
    let narrativeValidation = null;
    if (decryptedProfile.narrativeProfile) {
      narrativeValidation = StrategyMerger.validateNarrativeConsistency(
        decryptedProfile.narrativeProfile,
        mergeResult
      );
    }

    // Generate adaptive prompt using merged strategies
    const adaptivePrompt = generateAdaptivePromptFromMerge(
      mergeResult,
      decryptedProfile.narrativeProfile,
      narrativeValidation,
      language,
      botId
    );

    if (botId === 'dan-clean-language' && adaptivePrompt) {
      console.log('🧪 [DPC] Dan: restricted Clean Language injection (no blindspots/challenges)');
    }

    // Build human-readable strategy list for telemetry
    const strategiesUsed = buildStrategyTelemetry(mergeResult, language);

    console.log(`🧪 [DPC] Generated adaptive prompt for user ${userId}`);
    console.log(`   Language: ${language}`);
    console.log(`   Models: ${mergeResult.metadata.models.join(', ')}`);
    console.log(`   Merge Type: ${mergeResult.metadata.mergeType}`);
    console.log(`   Strategies: ${strategiesUsed.join(', ')}`);
    if (mergeResult.conflicts.length > 0) {
      console.log(`   ⚠️ Conflicts Resolved: ${mergeResult.conflicts.length}`);
      mergeResult.conflicts.forEach(c => {
        console.log(`      - ${c.kept} kept, ${c.excluded} excluded (${c.reason})`);
      });
    }
    if (decryptedProfile.narrativeProfile) {
      console.log(`   ✨ Narrative: ${narrativeValidation?.isConsistent ? 'Consistent' : 'Inconsistent'}`);
    }
    
    return { 
      prompt: adaptivePrompt, 
      strategiesUsed,
      mergeMetadata: {
        models: mergeResult.metadata.models,
        mergeType: mergeResult.metadata.mergeType,
        conflicts: mergeResult.conflicts.length,
        topDimensions: mergeResult.metadata.topDimensions,
        narrativeConsistent: narrativeValidation?.isConsistent ?? true,
        ...(botId === 'dan-clean-language' ? { danRestrictedInjection: true } : {})
      }
    };
  } catch (error) {
    console.error('DPC Error:', error);
    return { prompt: '', strategiesUsed: [], mergeMetadata: null }; // Fail gracefully
  }
}

/**
 * DPC/DPFL injection for Dan (Clean Language): pacing / courtesy only — no blindspots,
 * challenges, or narrative blindspots/growth (conflicts with verbatim Clean Language).
 */
function buildDanCleanLanguageAdaptivePrompt(mergeResult, narrativeProfile, narrativeValidation, language, t) {
  const dan = {
    de: {
      header: '\n\n--- PERSONALISIERTES PROFIL (Clean Language — eingeschränkt) ---\n\n',
      intro:
        'Du arbeitest als Dan mit Clean Language (Hauptprompt). Die folgenden Profilhinweise wirken **nur** auf Tempo, Ruhe und Höflichkeit im Gespräch — **nicht** auf Inhaltsdeutungen, Ziele oder Entwicklungsthemen.\n\n',
      pacingGuide: '**Wie du Ton/Ansatz nutzt (intern — dem Klienten gegenüber nicht erklären):**\n',
      pacingBullets:
        '- Übersetze „Ton“ und „Ansatz“ **nicht** in neue Wörter im Gespräch. Nutze sie nur, um zu entscheiden: etwas langsamer/mehr Raum vs. knapper vs. warm-sparsam bleiben.\n' +
        '- Es gilt weiterhin: nur **Clean-Language-Fragen** mit **exakten** Zitaten der Person; maximal **eine** zentrale Frage pro Nachricht.\n' +
        '- Keine empathischen Etikettierungen („das ist belastend“), keine Blindspot-/Challenge-/Coaching-Jargon-Anteile aus dem Profil.\n\n',
      forbiddenBlock:
        '**Ignorieren:** sämtliche Blindspots, Entwicklungsfelder, Beispiel-Challenges sowie narrative „Blinde Flecken“ oder Wachstum — nicht verwenden. Keine Modellnamen (Riemann, OCEAN, Spiral Dynamics).\n\n',
      narrativeCoreHeader: '**Optionaler Kontext (nur Timing/Sensibilität, nicht ansprechen):**\n',
      narrativeCorePrefix: '- Kern (aus Signatur): ',
      narrativeInconsistent:
        '(Quantitatives vs. narratives Profil kann divergieren — für Dan keine Entwicklungs-/Challenge-Inhalte daraus ableiten.)\n\n',
      formatFooter:
        '**Output:** Natürliche Sprache; keine Markdown-Trennlinien (---); keine Meta-Kommentare zur Strategie; keine „Verstanden, dein Ziel ist …“-Paraphrasen — bei Bedarf höchstens eine kurze neutrale Bestätigung vor der einen Clean-Language-Frage.\n'
    },
    en: {
      header: '\n\n--- PERSONALIZED PROFILE (Clean Language — restricted) ---\n\n',
      intro:
        'You are Dan using Clean Language (main prompt). The profile notes below affect **only** pacing, spaciousness, and conversational courtesy — **not** interpretations, goals, or development agendas.\n\n',
      pacingGuide: '**How to use tone/approach (internal — never explain this to the client):**\n',
      pacingBullets:
        '- Do **not** translate "tone" or "approach" into new wording in dialogue. Use them only to choose: slightly slower/more spacious vs. tighter vs. staying warm-sparse.\n' +
        '- Still follow: **Clean Language questions** using **exact** client wording; at most **one** primary question per message.\n' +
        '- No empathic labeling ("that sounds distressing"), no blindspot/challenge/coaching jargon from the profile.\n\n',
      forbiddenBlock:
        '**Ignore:** all blind spots, development fields, example challenges, and narrative blind spots or growth — do not use. No model names (Riemann, Big Five, Spiral Dynamics).\n\n',
      narrativeCoreHeader: '**Optional context (timing/sensitivity only — do not surface):**\n',
      narrativeCorePrefix: '- Core (from signature): ',
      narrativeInconsistent:
        '(Quantitative vs. narrative profiles may diverge — do not derive development/challenge content for Dan.)\n\n',
      formatFooter:
        '**Output:** Natural language; no markdown dividers (---); no strategy meta-comments; no "I understand, your goal is…" paraphrases — at most one brief neutral acknowledgment before the single Clean Language question.\n'
    }
  };

  const d = dan[language] || dan.de;
  let adaptivePrompt = d.header + d.intro;

  if (mergeResult.conflicts && mergeResult.conflicts.length > 0) {
    adaptivePrompt += t.conflictsHeader;
    mergeResult.conflicts.forEach(conflict => {
      adaptivePrompt += `- Kept: ${conflict.kept}, Excluded: ${conflict.excluded} (${conflict.reason})\n`;
    });
    adaptivePrompt += '\n';
  }

  if (mergeResult.primary && (mergeResult.primary.language || mergeResult.primary.tone || mergeResult.primary.approach)) {
    adaptivePrompt += t.preferredComm;
    if (mergeResult.primary.language) {
      adaptivePrompt += `- ${t.language}: ${mergeResult.primary.language}\n`;
    }
    if (mergeResult.primary.tone) {
      adaptivePrompt += `- ${t.tone}: ${mergeResult.primary.tone}\n`;
    }
    if (mergeResult.primary.approach) {
      adaptivePrompt += `- ${t.approach}: ${mergeResult.primary.approach}\n`;
    }
    adaptivePrompt += '\n';
  }

  adaptivePrompt += d.pacingGuide + d.pacingBullets;
  adaptivePrompt += d.forbiddenBlock;

  if (narrativeProfile?.operatingSystem) {
    adaptivePrompt += d.narrativeCoreHeader;
    adaptivePrompt += `${d.narrativeCorePrefix}${narrativeProfile.operatingSystem}\n`;
    if (narrativeValidation && !narrativeValidation.isConsistent) {
      adaptivePrompt += d.narrativeInconsistent;
    } else {
      adaptivePrompt += '\n';
    }
  }

  adaptivePrompt += d.formatFooter;

  return adaptivePrompt;
}

/**
 * Generate adaptive prompt from merge result
 * @param {Object} mergeResult - Result from StrategyMerger
 * @param {Object} narrativeProfile - AI-generated narrative profile
 * @param {Object} narrativeValidation - Narrative consistency validation result
 * @param {string} language - Language
 * @param {string} botId - Bot ID for bot-specific adaptations
 * @returns {string} Adaptive prompt
 */
function generateAdaptivePromptFromMerge(mergeResult, narrativeProfile, narrativeValidation, language = 'de', botId = null) {
  const translations = {
    de: {
      header: '**Dynamische Persönlichkeits-Anpassung (DPC)**\n',
      intro: 'Passe deine Kommunikation an die Persönlichkeit und Präferenzen dieses Menschen an.\n\n',
      preferredComm: '**Bevorzugte Kommunikationsweise:**\n',
      language: 'Sprache',
      tone: 'Ton',
      approach: 'Ansatz',
      blindspotHeader: '\n**Entwicklungsfelder (Proaktives Coaching):**\n',
      weakness: 'Blinder Fleck',
      challenge: 'Herausforderung',
      exampleChallenges: 'Beispiel-Challenges',
      challengeGuidance: '\n💡 **Coaching-Hinweis:** Fordere diese Person sanft aber bestimmt heraus, ihre blinden Flecken zu erkunden. Nutze die Beispiel-Challenges als Inspiration für konkrete, maßgeschneiderte Interventionen.\n',
      // AVA-specific: Extended challenge guidance with state-awareness (Option A+)
      challengeGuidanceAva: `\n**BLINDSPOT-CHALLENGE-STRATEGIE (Coaching-Trigger + State-Awareness):**

TRIGGER-DETEKTION (wann challengen?):

1. USER ZEIGT FORTSCHRITT/SELBSTSICHERHEIT:
   Signal-Wörter: "hat geklappt", "verstanden", "ist mir klar", "ich werde", "ich kann", "schaffe ich", "gelungen"
   → DEINE AUFGABE: Challenge Blindspot SOFORT
   - Würdige Fortschritt kurz (1 Satz: "Das ist ein wichtiger Schritt!")
   - Dann direkt provokative Frage: "Und wenn du jetzt noch einen Schritt weiter gehst - [Challenge-Frage aus Blindspot-Liste oben]?"
   - Ton: Wertschätzend aber fordernd
   - Nur 1 Challenge pro Antwort, nicht mehrere
   
   **ESKALATIONS-LOGIK (wichtig):**
   - Prüfe Conversation History: Habe ich diesen Blindspot BEREITS in den letzten 3-4 Nachrichten challenged?
   - JA → Wähle einen ANDEREN Blindspot aus der Liste, um Monotonie zu vermeiden
   - NEIN → Fahre fort wie geplant

2. USER IST FESTGEFAHREN/RATLOS:
   Signal-Wörter: "weiß nicht weiter", "festgefahren", "geht nicht voran", "kann nicht", "bringt nichts", "überfordert"
   
   **STATE-CHECK (KRITISCH - prüfe Conversation History):**
   Bevor du handelst, analysiere die letzten 2-3 Bot-Nachrichten:
   
   A) Habe ich bereits nach RESSOURCEN gefragt (frühere Erfolge, Stärken, Support)?
      - JA → Du bist in **PHASE 2** → Gehe zu "Phase 2: Brücke zu Blindspot" unten
      - NEIN → Du bist in **PHASE 1** → Gehe zu "Phase 1: Nur Ressourcen" unten
   
   **PHASE 1 (DIESE Nachricht - NUR Ressourcen, KEINE Blindspots):**
   - Frage nach früheren Erfolgen: "Wann hast du schon mal etwas Ähnliches gemeistert?"
   - Aktiviere Stärken aus Signatur (falls vorhanden): "Deine [Superpower] - wie könnte die helfen?"
   - Frage nach Support: "Wer könnte dich dabei unterstützen?"
   - **WICHTIG: Noch KEINEN Blindspot erwähnen! Setze ein mentales Flag: "Ressourcen-Phase aktiv"**
   
   **PHASE 2 (NACHDEM User Ressourcen genannt hat UND du bereits in Phase 1 warst):**
   - **STATE-CHECK:** Suche in den letzten 2 Nachrichten nach deinen Ressourcen-Fragen
   - Wenn gefunden → User hat jetzt Ressourcen aktiviert → Fahre fort:
   - Verknüpfe Ressourcen mit Blindspot: "Du hast gerade [Ressource] aktiviert. Vielleicht hilft dir das auch bei [Blindspot]..."
   - Sanfter Ton: "Könnte hier auch eine Chance liegen, [Blindspot] zu entwickeln?"
   - Nutze Challenge-Frage aus Blindspot-Liste
   - Nach diesem Challenge: Setze mentales Flag zurück "Ressourcen-Phase abgeschlossen"

3. KEINE CHALLENGE (warte ab):
   - User teilt erstmals ein Thema (erste 1-2 Nachrichten der GESAMTEN Conversation) → Nur verstehen und containen
   - User ist emotional aufgewühlt (Signal-Wörter: "traurig", "wütend", "angst", "verzweifelt") → Erst emotional stabilisieren
   - User stellt Frage → Beantworte, challenge nicht parallel

**ESKALATIONS-STRATEGIE (für wiederholte Blindspot-Challenges):**

WICHTIG: Prüfe Conversation History auf frühere Blindspot-Erwähnungen.

- **Level 1 (erste Erwähnung eines Blindspots):** Sanfte Reflexionsfrage
  - Beispiel: "Hast du schon mal überlegt, wie [Blindspot] sich hier zeigen könnte?"
  
- **Level 2 (zweite Erwähnung desselben Blindspots, ca. 5-6 Nachrichten später):** Konkrete Handlungsaufforderung
  - Beispiel: "Was wäre ein kleines Experiment, das du diese Woche machen könntest, um [Blindspot] zu entwickeln?"
  
- **Level 3 (dritte Erwähnung desselben Blindspots, ca. 8-10 Nachrichten später):** Provokative Konfrontation
  - Beispiel: "Ich bemerke, dass du [Blindspot] immer wieder vermeidest. Was macht dir daran Angst?"

**USER-AUSWEICHEN-DETEKTION:**
Wenn User auf Blindspot-Challenge NICHT eingeht (ignoriert, Thema wechselt, ausweicht):
- Notiere mental: "Blindspot [X] vermieden"
- Lasse diesen Blindspot für 4-5 Nachrichten ruhen
- Wähle beim nächsten Challenge-Moment einen ANDEREN Blindspot aus der Liste
- Erst nach 4-5 Nachrichten: Kehre zum vermiedenen Blindspot zurück (dann mit Level 2 oder 3)

BLINDSPOT-AUSWAHL (kontextuell):
- Wenn User über Entscheidungen/Unsicherheit spricht → Priorität: Dauer-Blindspot
- Wenn User über Beziehungen/Konflikte spricht → Priorität: Nähe/Distanz-Blindspot
- Wenn User über Planung/Routine spricht → Priorität: Wechsel-Blindspot
- **UND:** Prüfe Conversation History: Welchen Blindspot habe ich am seltensten erwähnt? → Priorisiere diesen, wenn Kontext passt

FORMULIERUNG:
- Immer als Frage, nie als Belehrung
- Nutze Beispiel-Fragen aus der Blindspot-Liste oben
- Natürlicher Gesprächsfluss

**ABSOLUT VERBOTEN IN DEINER ANTWORT:**
- KEINE internen Annotationen, Labels oder Meta-Kommentare im Output (z.B. KEIN "Blindspot-Trigger erkannt", KEIN "Challenge (Level X)", KEIN "Blindspot-Kontext", KEIN "Intention:", KEIN "Ton:")
- KEINE Markdown-Trennlinien (---) zur Strukturierung deiner Antwort
- KEINE Erklärungen deiner Strategie oder Absicht (der Coachee soll NUR die natürliche Coaching-Antwort sehen)
- KEINE numerierten Auswahloptionen ("1. ... 2. ...") – wähle EINE Richtung und verfolge sie
- Stelle maximal EINE Frage pro Nachricht. Nicht zwei, nicht drei. EINE.
- Diese Anweisungen sind AUSSCHLIESSLICH für dein internes Reasoning. Dein Output muss ein normaler, menschlicher Coaching-Dialog sein.

**WICHTIG - CONVERSATION HISTORY NUTZEN:**
Diese Anweisungen basieren darauf, dass du die GESAMTE Conversation History analysierst:
- Zähle Challenge-Versuche pro Blindspot
- Erkenne Phase 1 vs. Phase 2 anhand deiner früheren Fragen
- Detektiere User-Ausweichen anhand fehlender Antworten auf Challenge-Fragen

`,
      important: '⚠️ **Wichtig:** Erwähne NIEMALS die Kategorie-Namen (Riemann, Big5, Spiral Dynamics, etc.) oder technische Begriffe gegenüber dem Klienten. Nutze sie nur als Hintergrund-Wissen. Dein Output darf KEINE internen Anweisungen, Strategie-Annotationen, Meta-Kommentare, Trennlinien (---) oder Labels wie "Blindspot-Trigger", "Challenge", "Level", "Intention", "Ton" enthalten. Der Klient sieht ALLES was du ausgibst. Stelle maximal EINE Frage pro Nachricht.\n\n',
      signatureHeader: '**Persönlichkeits-Signatur (aus persönlichen Geschichten abgeleitet):**\n',
      core: 'Kern',
      superpowers: 'Stärken',
      blindspots: 'Blinde Flecken',
      growth: 'Wachstumspotenzial',
      signatureNote: 'Nutze diese Signatur als tieferes Verständnis der Person - erwähne diese Kategorien jedoch NICHT in deinen Antworten.\n\n',
      narrativeNote: '**Hinweis:** Die quantitativen und narrativen Profile zeigen einige Unterschiede. Priorisiere die quantitativen Strategien (oben), während du den narrativen Kontext berücksichtigst.\n\n',
      conflictsHeader: '**Strategie-Konflikte (aufgelöst):**\n'
    },
    en: {
      header: '**Dynamic Personality Coaching (DPC)**\n',
      intro: 'Adapt your communication to this person\'s personality and preferences.\n\n',
      preferredComm: '**Preferred Communication Style:**\n',
      language: 'Language',
      tone: 'Tone',
      approach: 'Approach',
      blindspotHeader: '\n**Development Areas (Proactive Coaching):**\n',
      weakness: 'Blind Spot',
      challenge: 'Challenge',
      exampleChallenges: 'Example Challenges',
      challengeGuidance: '\n💡 **Coaching Note:** Gently but firmly challenge this person to explore their blind spots. Use the example challenges as inspiration for concrete, tailored interventions.\n',
      // AVA-specific: Extended challenge guidance with state-awareness (Option A+)
      challengeGuidanceAva: `\n**BLINDSPOT CHALLENGE STRATEGY (Coaching Triggers + State-Awareness):**

TRIGGER DETECTION (when to challenge?):

1. USER SHOWS PROGRESS/CONFIDENCE:
   Signal words: "worked", "understood", "realized", "I will", "I can", "I got this", "succeeded"
   → YOUR TASK: Challenge blindspot IMMEDIATELY
   - Acknowledge progress briefly (1 sentence: "That's an important step!")
   - Then ask provocative question directly: "And if you go one step further - [Challenge question from blindspot list above]?"
   - Tone: Appreciative but demanding
   - Only 1 challenge per response, not multiple
   
   **ESCALATION LOGIC (important):**
   - Check Conversation History: Have I ALREADY challenged this blindspot in the last 3-4 messages?
   - YES → Choose a DIFFERENT blindspot from the list to avoid monotony
   - NO → Proceed as planned

2. USER IS STUCK/HELPLESS:
   Signal words: "don't know", "stuck", "not progressing", "can't", "doesn't work", "overwhelmed"
   
   **STATE CHECK (CRITICAL - check Conversation History):**
   Before acting, analyze the last 2-3 bot messages:
   
   A) Have I already asked about RESOURCES (past successes, strengths, support)?
      - YES → You are in **PHASE 2** → Go to "Phase 2: Bridge to Blindspot" below
      - NO → You are in **PHASE 1** → Go to "Phase 1: Resources Only" below
   
   **PHASE 1 (THIS message - ONLY Resources, NO Blindspots):**
   - Ask about past successes: "When have you mastered something similar before?"
   - Activate strengths from signature (if available): "Your [Superpower] - how could that help?"
   - Ask about support: "Who could support you with this?"
   - **IMPORTANT: Do NOT mention blindspots yet! Set a mental flag: "Resources phase active"**
   
   **PHASE 2 (AFTER user mentioned resources AND you were already in Phase 1):**
   - **STATE CHECK:** Search last 2 messages for your resource questions
   - If found → User has now activated resources → Proceed:
   - Link resources to blindspot: "You just activated [Resource]. Maybe this can also help with [Blindspot]..."
   - Gentle tone: "Could there be an opportunity here to develop [Blindspot]?"
   - Use challenge question from blindspot list
   - After this challenge: Reset mental flag "Resources phase completed"

3. NO CHALLENGE (wait):
   - User shares a topic for the first time (first 1-2 messages of ENTIRE conversation) → Only understand and contain
   - User is emotionally activated (signal words: "sad", "angry", "scared", "desperate") → First stabilize emotionally
   - User asks a question → Answer, don't challenge in parallel

**ESCALATION STRATEGY (for repeated blindspot challenges):**

IMPORTANT: Check Conversation History for previous blindspot mentions.

- **Level 1 (first mention of a blindspot):** Gentle reflection question
  - Example: "Have you ever considered how [Blindspot] might show up here?"
  
- **Level 2 (second mention of same blindspot, approx. 5-6 messages later):** Concrete action invitation
  - Example: "What would be a small experiment you could try this week to develop [Blindspot]?"
  
- **Level 3 (third mention of same blindspot, approx. 8-10 messages later):** Provocative confrontation
  - Example: "I notice you keep avoiding [Blindspot]. What about it makes you anxious?"

**USER AVOIDANCE DETECTION:**
When user does NOT engage with blindspot challenge (ignores, changes topic, avoids):
- Note mentally: "Blindspot [X] avoided"
- Let this blindspot rest for 4-5 messages
- Choose a DIFFERENT blindspot from the list at next challenge moment
- Only after 4-5 messages: Return to avoided blindspot (then with Level 2 or 3)

BLINDSPOT SELECTION (contextual):
- When user talks about decisions/uncertainty → Priority: Dauer blindspot
- When user talks about relationships/conflicts → Priority: Nähe/Distanz blindspot
- When user talks about planning/routine → Priority: Wechsel blindspot
- **AND:** Check Conversation History: Which blindspot have I mentioned least? → Prioritize it if context fits

FORMULATION:
- Always as question, never as lecture
- Use example questions from blindspot list above
- Natural conversation flow

**ABSOLUTELY FORBIDDEN IN YOUR OUTPUT:**
- NO internal annotations, labels, or meta-comments in output (e.g., NO "Blindspot trigger detected", NO "Challenge (Level X)", NO "Blindspot context", NO "Intention:", NO "Tone:")
- NO markdown dividers (---) to structure your response
- NO explanations of your strategy or intent (the coachee must ONLY see the natural coaching response)
- NO numbered choice options ("1. ... 2. ...") – choose ONE direction and pursue it
- Ask at most ONE question per message. Not two, not three. ONE.
- These instructions are EXCLUSIVELY for your internal reasoning. Your output must be a normal, human coaching dialogue.

**IMPORTANT - USE CONVERSATION HISTORY:**
These instructions rely on you analyzing the ENTIRE Conversation History:
- Count challenge attempts per blindspot
- Recognize Phase 1 vs. Phase 2 based on your previous questions
- Detect user avoidance based on missing responses to challenge questions

`,
      important: '⚠️ **Important:** NEVER mention category names (Riemann, Big5, Spiral Dynamics, etc.) or technical terms to the client. Use them only as background knowledge. Your output must NEVER contain internal instructions, strategy annotations, meta-comments, dividers (---), or labels like "Blindspot trigger", "Challenge", "Level", "Intention", "Tone". The client sees EVERYTHING you output. Ask at most ONE question per message.\n\n',
      signatureHeader: '**Personality Signature (derived from personal stories):**\n',
      core: 'Core',
      superpowers: 'Strengths',
      blindspots: 'Blind Spots',
      growth: 'Growth Potential',
      signatureNote: 'Use this signature as a deeper understanding of the person - but do NOT mention these categories in your responses.\n\n',
      narrativeNote: '**Note:** Quantitative and narrative profiles show some differences. Prioritize quantitative strategies (above) while acknowledging narrative context.\n\n',
      conflictsHeader: '**Strategy Conflicts (resolved):**\n'
    }
  };

  const t = translations[language] || translations['de'];

  if (botId === 'dan-clean-language') {
    return buildDanCleanLanguageAdaptivePrompt(
      mergeResult,
      narrativeProfile,
      narrativeValidation,
      language,
      t
    );
  }

  let adaptivePrompt = t.header;
  adaptivePrompt += t.intro;

  // Add conflict resolution info if conflicts were detected
  if (mergeResult.conflicts && mergeResult.conflicts.length > 0) {
    adaptivePrompt += t.conflictsHeader;
    mergeResult.conflicts.forEach(conflict => {
      adaptivePrompt += `- Kept: ${conflict.kept}, Excluded: ${conflict.excluded} (${conflict.reason})\n`;
    });
    adaptivePrompt += '\n';
  }

  // Add communication preferences from merged strategies
  if (mergeResult.primary && (mergeResult.primary.language || mergeResult.primary.tone || mergeResult.primary.approach)) {
    adaptivePrompt += t.preferredComm;
    if (mergeResult.primary.language) {
      adaptivePrompt += `- ${t.language}: ${mergeResult.primary.language}\n`;
    }
    if (mergeResult.primary.tone) {
      adaptivePrompt += `- ${t.tone}: ${mergeResult.primary.tone}\n`;
    }
    if (mergeResult.primary.approach) {
      adaptivePrompt += `- ${t.approach}: ${mergeResult.primary.approach}\n`;
    }
    adaptivePrompt += '\n';
  }

  // Add blindspots from merged result
  if (mergeResult.blindspots && mergeResult.blindspots.length > 0) {
    adaptivePrompt += t.blindspotHeader;
    mergeResult.blindspots.forEach((blindspot, index) => {
      adaptivePrompt += `${index + 1}. ${t.weakness}: ${blindspot.blindspot}\n`;
      adaptivePrompt += `   ${t.challenge}: ${blindspot.challenge}\n`;
      
      // Add challenge examples if available
      const exampleKey = blindspot.trait;
      let examples = CHALLENGE_EXAMPLES[exampleKey]?.[language] || CHALLENGE_EXAMPLES[exampleKey]?.['de'];
      
      // Try with level suffix for Big5
      if (!examples && blindspot.model === 'big5') {
        const level = blindspot.severity > 0.5 ? 'high' : 'low';
        examples = CHALLENGE_EXAMPLES[`${exampleKey}_${level}`]?.[language] || 
                   CHALLENGE_EXAMPLES[`${exampleKey}_${level}`]?.['de'];
      }
      
      if (examples && examples.length > 0) {
        adaptivePrompt += `   ${t.exampleChallenges}:\n`;
        examples.slice(0, 2).forEach(ex => {
          adaptivePrompt += `   • "${ex}"\n`;
        });
      }
      adaptivePrompt += '\n';
    });
    
    // Option A+: Kontext-Mapping for AVA (contextual blindspot selection)
    if (botId === 'ava-strategic' && mergeResult.blindspots.length > 1) {
      adaptivePrompt += language === 'de'
        ? '\n**BLINDSPOT-KONTEXT-MATCHING:**\n'
        : '\n**BLINDSPOT CONTEXT-MATCHING:**\n';
      
      mergeResult.blindspots.forEach((bs, idx) => {
        let contexts = [];
        
        // Riemann-specific contexts
        if (bs.model === 'riemann') {
          if (bs.trait === 'dauer') {
            contexts = language === 'de'
              ? ['wenn User über Entscheidungen unter Unsicherheit spricht', 'wenn User Spontanität vermeidet oder zu viel plant']
              : ['when user talks about decisions under uncertainty', 'when user avoids spontaneity or over-plans'];
          }
          if (bs.trait === 'wechsel') {
            contexts = language === 'de'
              ? ['wenn User über Routine oder Langeweile spricht', 'wenn User langfristige Planung vermeidet']
              : ['when user talks about routine or boredom', 'when user avoids long-term planning'];
          }
          if (bs.trait === 'naehe') {
            contexts = language === 'de'
              ? ['wenn User über Konflikte oder Abgrenzung spricht', 'wenn User zu viel für andere tut oder sich ausgenutzt fühlt']
              : ['when user talks about conflicts or boundaries', 'when user does too much for others or feels taken advantage of'];
          }
          if (bs.trait === 'distanz') {
            contexts = language === 'de'
              ? ['wenn User emotionale Themen oder Verletzlichkeit vermeidet', 'wenn User Beziehungsprobleme schildert']
              : ['when user avoids emotional topics or vulnerability', 'when user describes relationship problems'];
          }
        }
        
        // Big5-specific contexts
        if (bs.model === 'big5') {
          if (bs.trait === 'conscientiousness' && bs.severity < 0.5) {
            contexts = language === 'de'
              ? ['wenn User über Prokrastination oder Ziele spricht']
              : ['when user talks about procrastination or goals'];
          }
          if (bs.trait === 'openness' && bs.severity < 0.5) {
            contexts = language === 'de'
              ? ['wenn User in Routinen feststeckt']
              : ['when user is stuck in routines'];
          }
          if (bs.trait === 'extraversion' && bs.severity < 0.5) {
            contexts = language === 'de'
              ? ['wenn User über soziale Situationen spricht']
              : ['when user talks about social situations'];
          }
          if (bs.trait === 'agreeableness' && bs.severity > 0.7) {
            contexts = language === 'de'
              ? ['wenn User über Grenzen setzen spricht']
              : ['when user talks about setting boundaries'];
          }
          if (bs.trait === 'neuroticism' && bs.severity > 0.7) {
            contexts = language === 'de'
              ? ['wenn User über Ängste oder Stress spricht']
              : ['when user talks about fears or stress'];
          }
        }
        
        // Spiral Dynamics-specific contexts
        if (bs.model === 'sd') {
          if (bs.trait === 'orange') {
            contexts = language === 'de'
              ? ['wenn User über Effizienz oder Erfolg spricht']
              : ['when user talks about efficiency or success'];
          }
          if (bs.trait === 'green') {
            contexts = language === 'de'
              ? ['wenn User über Beziehungen oder Harmonie spricht']
              : ['when user talks about relationships or harmony'];
          }
          if (bs.trait === 'blue') {
            contexts = language === 'de'
              ? ['wenn User über Struktur oder Regeln spricht']
              : ['when user talks about structure or rules'];
          }
        }
        
        if (contexts.length > 0) {
          const joinWord = language === 'de' ? ' oder ' : ' or ';
          adaptivePrompt += `${idx + 1}. ${bs.blindspot} → Challenge ${contexts.join(joinWord)}\n`;
        }
      });
      
      adaptivePrompt += '\n';
    }
    
    // Use AVA-specific challenge guidance if bot is AVA, otherwise use standard
    if (botId === 'ava-strategic') {
      adaptivePrompt += t.challengeGuidanceAva || t.challengeGuidance;
    } else {
      adaptivePrompt += t.challengeGuidance;
    }
    
    adaptivePrompt += t.important;
  }

  // Add narrative profile with consistency note if needed
  if (narrativeProfile) {
    if (narrativeValidation && !narrativeValidation.isConsistent) {
      adaptivePrompt += t.narrativeNote;
    }
    
    adaptivePrompt += t.signatureHeader;
    
    if (narrativeProfile.operatingSystem) {
      adaptivePrompt += `- ${t.core}: ${narrativeProfile.operatingSystem}\n`;
    }
    
    if (narrativeProfile.superpowers && narrativeProfile.superpowers.length > 0) {
      const superpowerNames = narrativeProfile.superpowers.map(s => s.name).join(', ');
      adaptivePrompt += `- ${t.superpowers}: ${superpowerNames}\n`;
      narrativeProfile.superpowers.forEach(s => {
        adaptivePrompt += `  • ${s.name}: ${s.description}\n`;
      });
    }
    
    if (narrativeProfile.blindspots && narrativeProfile.blindspots.length > 0) {
      const blindspotNames = narrativeProfile.blindspots.map(b => b.name).join(', ');
      adaptivePrompt += `- ${t.blindspots}: ${blindspotNames}\n`;
      narrativeProfile.blindspots.forEach(b => {
        adaptivePrompt += `  • ${b.name}: ${b.description}\n`;
      });
    }
    
    if (narrativeProfile.growthOpportunities && narrativeProfile.growthOpportunities.length > 0) {
      const growthNames = narrativeProfile.growthOpportunities.map(g => g.name).join(', ');
      adaptivePrompt += `- ${t.growth}: ${growthNames}\n`;
    }
    
    adaptivePrompt += '\n' + t.signatureNote;
  }

  // Add formatting instructions (same as before)
  adaptivePrompt += `**Wichtige Formatierungs-Regeln:**

VERBOTEN:
- Labels wie "Blindspot-Challenge", "Challenge-Strategie", "Reflexionsfrage"
- Persönlichkeits-Kategorien (Riemann, OCEAN, Spiral Dynamics, orange, blue, etc.)
- Dokumenten-Struktur: KEINE "**Überschriften:**" wie "**Zwei Fragen:**"
- Meta-Kommentare in Klammern: KEINE "*(Hinweis: Ich spüre hier...)*"
- Aktionsbeschreibungen: KEINE "*Atmet tief ein*", "*Lehnt sich vor*", "*Nickt verständnisvoll*"
- Rollenspielerische Beschreibungen: Schreibe wie ein Mensch spricht, nicht wie ein Theater-Skript
- Nummerierte Listen mit Überschriften
- Trennlinien (---) zwischen Abschnitten
- Ankündigungen wie "Lass mich dir zwei Fragen stellen:" - stelle sie einfach!
- Ganze Sätze fett markieren: KEINE "**Dein Ziel ist Klarheit**" - nur einzelne Wörter!
- Bestätigungen vorwegnehmen: NICHT "Verstanden. Dein Ziel ist also..."
- Paraphrasieren ohne Rückfrage: NICHT annehmen, dass du richtig verstanden hast

ERLAUBT:
- Fettdruck für *einzelne wichtige Wörter* zur Betonung (z.B. "Was *genau* hält dich zurück?")
- Kursiv für Zitate oder innere Gedanken
- Natürliche Aufzählungen ohne Überschriften
- Rückfragen zum Verständnis: "Habe ich das richtig verstanden?" oder "Ist das der Kern?"

STIL:
Schreibe wie ein echter Mensch im Gespräch spricht - fließend, ohne sichtbare Struktur.
FALSCH: "Ich verstehe. Dein Ziel für heute ist also **Klarheit über deine eigene Stimme zu gewinnen**."
RICHTIG: "Wenn ich dich richtig verstehe, geht es weniger um die Entscheidung selbst als darum, deine *eigene* Stimme wiederzufinden. Ist das der Kern?"

`;

  adaptivePrompt += `Adapt ALL your responses to these preferences. Keep your responses NATURAL and CONVERSATIONAL.

⚠️ FIRST MESSAGE - STRICT RULES (overrides everything else):
If this is the FIRST message of a session and you're asking about "Next Steps":
- NO PRAISING progress you haven't heard about yet ("congratulations", "impressed", etc.)
- Ask ONLY ONE simple question (e.g., "How did it go?")
- NO offering alternatives ("if you'd rather...", "in case you want something else...")
- NO detailed follow-up questions about specific aspects
- STOP after the one question. Wait for the response.`;

  return adaptivePrompt;
}

/**
 * Build human-readable strategy list for telemetry
 * @param {Object} mergeResult - Result from StrategyMerger
 * @param {string} language - Language
 * @returns {Array} Array of strategy descriptions
 */
function buildStrategyTelemetry(mergeResult, language) {
  const strategiesUsed = [];
  
  const riemannLabels = {
    dauer: { de: 'Dauer', en: 'Duration' },
    wechsel: { de: 'Wechsel', en: 'Change' },
    naehe: { de: 'Nähe', en: 'Closeness' },
    distanz: { de: 'Distanz', en: 'Distance' }
  };
  
  const big5Labels = {
    openness: { de: 'Offenheit', en: 'Openness' },
    conscientiousness: { de: 'Gewissenhaftigkeit', en: 'Conscientiousness' },
    extraversion: { de: 'Extraversion', en: 'Extraversion' },
    agreeableness: { de: 'Verträglichkeit', en: 'Agreeableness' },
    neuroticism: { de: 'Neurotizismus', en: 'Neuroticism' }
  };
  
  const sdLabels = {
    beige: 'Beige', purple: 'Purple', red: 'Red', blue: 'Blue',
    orange: 'Orange', green: 'Green', yellow: 'Yellow', turquoise: 'Turquoise'
  };

  // Build strategy list from top dimensions
  if (mergeResult.metadata && mergeResult.metadata.topDimensions) {
    mergeResult.metadata.topDimensions
      .filter(d => d.included)
      .forEach(dim => {
        if (dim.model === 'riemann') {
          const label = riemannLabels[dim.trait]?.[language] || dim.trait;
          strategiesUsed.push(`${label} (${language === 'de' ? 'hoch' : 'high'})`);
        } else if (dim.model === 'big5') {
          const label = big5Labels[dim.trait]?.[language] || big5Labels[dim.trait]?.en || dim.trait;
          strategiesUsed.push(`${label} (${language === 'de' ? 'hoch' : 'high'})`);
        } else if (dim.model === 'sd') {
          strategiesUsed.push(`SD: ${sdLabels[dim.trait] || dim.trait}`);
        }
      });
  }

  return strategiesUsed;
}

module.exports = {
  generatePromptForUser,
  analyzeProfile,
  generateAdaptivePrompt
};

