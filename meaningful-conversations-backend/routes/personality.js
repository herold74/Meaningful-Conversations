const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient.js');
const authMiddleware = require('../middleware/auth.js');
const profileRefinement = require('../services/profileRefinement.js');
const aiProvider = require('../services/aiProviderService.js');

/**
 * POST /api/personality/save
 * Speichert verschluesseltes Persoenlichkeitsprofil
 */
router.post('/save', authMiddleware, async (req, res) => {
  try {
    const { testType, filterWorry, filterControl, encryptedData, adaptationMode } = req.body;
    const userId = req.userId;
    
    // Validation
    if (!testType || !encryptedData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate adaptationMode
    const validMode = adaptationMode === 'stable' ? 'stable' : 'adaptive';
    
    // Upsert (create or update)
    const profile = await prisma.personalityProfile.upsert({
      where: { userId },
      create: {
        userId,
        testType,
        filterWorry: filterWorry || 0,
        filterControl: filterControl || 0,
        adaptationMode: validMode,
        encryptedData
      },
      update: {
        testType,
        filterWorry: filterWorry || 0,
        filterControl: filterControl || 0,
        adaptationMode: validMode,
        encryptedData,
        sessionCount: 0 // Reset session count when profile is recreated
      }
    });
    
    res.json({ success: true, profileId: profile.id });
  } catch (error) {
    console.error('Error saving personality profile:', error);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

/**
 * GET /api/personality/profile
 * Holt verschluesseltes Profil (Client muss entschluesseln)
 */
router.get('/profile', authMiddleware, async (req, res) => {
  // #region agent log
  console.log('[DEBUG-A] GET /profile entry, userId:', req.userId);
  // #endregion
  try {
    // #region agent log
    console.log('[DEBUG-B] About to query prisma for userId:', req.userId);
    // #endregion
    const profile = await prisma.personalityProfile.findUnique({
      where: { userId: req.userId }
    });
    // #region agent log
    console.log('[DEBUG-C] Prisma query completed, profile found:', !!profile, profile ? { id: profile.id, testType: profile.testType, hasAdaptationMode: 'adaptationMode' in profile } : null);
    // #endregion
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json(profile);
  } catch (error) {
    // #region agent log
    console.error('[DEBUG-D] Prisma error:', error.message, error.code, error.meta);
    // #endregion
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * POST /api/personality/session-log
 * Loggt Session-Verhalten mit verschluesseltem Transkript
 */
router.post('/session-log', authMiddleware, async (req, res) => {
  try {
    const { sessionId, encryptedTranscript, frequencies } = req.body;
    
    if (!sessionId || !encryptedTranscript) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const log = await prisma.sessionBehaviorLog.create({
      data: {
        userId: req.userId,
        sessionId,
        encryptedTranscript,
        dauerFrequency: frequencies?.dauer || 0,
        wechselFrequency: frequencies?.wechsel || 0,
        naeheFrequency: frequencies?.naehe || 0,
        distanzFrequency: frequencies?.distanz || 0
      }
    });
    
    res.json({ success: true, logId: log.id });
  } catch (error) {
    console.error('Error logging session:', error);
    res.status(500).json({ error: 'Failed to log session' });
  }
});

/**
 * POST /api/personality/comfort-check
 * Speichert Comfort Score fuer eine Session
 */
router.post('/comfort-check', authMiddleware, async (req, res) => {
  try {
    const { sessionId, score, optOut } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }
    
    const updated = await prisma.sessionBehaviorLog.updateMany({
      where: {
        userId: req.userId,
        sessionId
      },
      data: {
        comfortScore: score,
        optedOut: optOut || false
      }
    });
    
    // Only increment session count for ADAPTIVE profiles and authentic sessions
    if (!optOut && score && score >= 3) {
      // Check if user has adaptive profile
      const profile = await prisma.personalityProfile.findUnique({
        where: { userId: req.userId },
        select: { adaptationMode: true }
      });
      
      if (profile && profile.adaptationMode === 'adaptive') {
        await prisma.personalityProfile.updateMany({
          where: { userId: req.userId },
          data: {
            sessionCount: { increment: 1 }
          }
        });
        console.log(`[DPFL] Incremented session count for user ${req.userId} (comfort: ${score}, adaptive mode)`);
      } else {
        console.log(`[DPFL] Skipping session count - user ${req.userId} has stable profile`);
      }
    }
    
    res.json({ success: true, updated: updated.count });
  } catch (error) {
    console.error('Error saving comfort check:', error);
    res.status(500).json({ error: 'Failed to save comfort check' });
  }
});

/**
 * GET /api/personality/adaptation-suggestions
 * Berechnet Profil-Update-Vorschlaege basierend auf Session-Logs
 * Nur fuer adaptive Profile
 */
router.get('/adaptation-suggestions', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Hole aktuelles Profil und pruefe adaptationMode
    const profile = await prisma.personalityProfile.findUnique({
      where: { userId }
    });
    
    if (!profile) {
      return res.json({ hasSuggestions: false, reason: 'No profile found' });
    }
    
    // Check adaptation mode - stable profiles don't get suggestions
    if (profile.adaptationMode === 'stable') {
      return res.json({ 
        hasSuggestions: false, 
        reason: 'Profile is set to stable mode',
        adaptationMode: 'stable'
      });
    }
    
    // Hole die letzten 5 Sessions (nicht opted-out)
    const recentLogs = await prisma.sessionBehaviorLog.findMany({
      where: {
        userId,
        optedOut: false,
        comfortScore: { gte: 3 } // Nur authentische Sessions
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    if (recentLogs.length < 3) {
      return res.json({ 
        hasSuggestions: false, 
        message: 'Not enough data yet (minimum 3 sessions)',
        adaptationMode: 'adaptive'
      });
    }
    
    // Note: Profile data is encrypted
    // Return raw session logs so client can decrypt profile and calculate suggestions
    // We can't calculate deltas server-side because we can't decrypt the profile
    res.json({
      hasSuggestions: true,
      sessionLogs: recentLogs.map(log => ({
        dauerFrequency: log.dauerFrequency,
        wechselFrequency: log.wechselFrequency,
        naeheFrequency: log.naeheFrequency,
        distanzFrequency: log.distanzFrequency,
        comfortScore: log.comfortScore
      })),
      sessionCount: recentLogs.length,
      profileType: profile.testType,
      adaptationMode: 'adaptive',
      message: 'Client must decrypt profile and use profileRefinement service'
    });
    
  } catch (error) {
    console.error('Error calculating adaptation suggestions:', error);
    res.status(500).json({ error: 'Failed to calculate suggestions' });
  }
});

/**
 * POST /api/personality/generate-narrative
 * Generates a narrative personality profile using AI
 */
router.post('/generate-narrative', authMiddleware, async (req, res) => {
  try {
    const { quantitativeData, narratives, language } = req.body;
    
    // Validation
    if (!quantitativeData || !narratives || !narratives.flowStory || !narratives.frictionStory) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const lang = language === 'en' ? 'en' : 'de';
    
    // Build the synthesis prompt
    const synthesisPrompt = NARRATIVE_SYNTHESIS_PROMPTS[lang]
      .replace('{{quantitativeData}}', JSON.stringify(quantitativeData, null, 2))
      .replace('{{flowStory}}', narratives.flowStory)
      .replace('{{frictionStory}}', narratives.frictionStory);
    
    console.log(`[Narrative] Generating narrative profile for user ${req.userId} in ${lang}`);
    
    // Call AI provider
    const result = await aiProvider.generateContent({
      model: 'gemini-2.5-flash',
      contents: synthesisPrompt,
      config: {
        temperature: 0.8,
        maxOutputTokens: 2500,
        responseMimeType: 'application/json',
        systemInstruction: lang === 'de' 
          ? 'Antworte ausschließlich mit validem JSON gemäß dem angeforderten Schema. Keine Erklärungen außerhalb des JSON.'
          : 'Respond only with valid JSON matching the requested schema. No explanations outside the JSON.'
      }
    });
    
    // Parse the response - strip markdown code fences if present
    let narrativeProfile;
    try {
      let jsonText = result.text.trim();
      // Remove markdown code fences if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7); // Remove ```json
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3); // Remove ```
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3); // Remove trailing ```
      }
      jsonText = jsonText.trim();
      
      narrativeProfile = JSON.parse(jsonText);
      narrativeProfile.generatedAt = new Date().toISOString();
    } catch (parseError) {
      console.error('[Narrative] Failed to parse AI response:', result.text);
      return res.status(500).json({ error: 'Failed to parse narrative profile' });
    }
    
    console.log(`[Narrative] Successfully generated profile with ${narrativeProfile.superpowers?.length || 0} superpowers`);
    
    res.json({ 
      success: true, 
      narrativeProfile,
      model: result.model,
      provider: result.provider
    });
    
  } catch (error) {
    console.error('Error generating narrative profile:', error);
    res.status(500).json({ error: 'Failed to generate narrative profile' });
  }
});

// Narrative Synthesis Prompts (Bilingual)
const NARRATIVE_SYNTHESIS_PROMPTS = {
  de: `Du bist ein psychologischer Profiler mit der sprachlichen Eleganz eines Romanautors. 
Dein Ziel: Ein tiefgehendes Persönlichkeitsprofil, das quantitative Daten mit qualitativen Erzählungen verwebt.

REGELN:
1. Synthetisiere Paradoxien: Zeigen die Daten widersprüchliche Eigenschaften (z.B. Wunsch nach Freiheit UND Wunsch nach Struktur), nenne es ein "Betriebssystem". Erkläre, wie beide Pole zusammenarbeiten (z.B. "Du brauchst Struktur, um wild sein zu können").
2. Kein Psychobabble und NUR deutsche Wörter: Keine englischen Fachbegriffe. Übersetze immer: openness→Offenheit, agreeableness→Verträglichkeit, conscientiousness→Gewissenhaftigkeit, extraversion→Extraversion, neuroticism→Emotionale Stabilität. Erfinde metaphorische Titel für Talente (z.B. "Prototypen-Alchemie" statt "Hohe Offenheit").
3. Nutze die User-Story als MUSTER: Beschreibe das dahinterliegende Muster (z.B. "kreative Autonomie"), NICHT das konkrete Ereignis (z.B. "App-Entwicklung"). Keine Projektnamen, Personennamen oder spezifische Situationen.
4. Tone: Empathisch, direkt, leicht poetisch, aber geerdet ("Du enthältst Multituden").
5. Auf Deutsch schreiben. Verwende "Du" als Anrede.
6. Zeitlosigkeit: Das Profil soll in 2 Jahren noch relevant klingen. Vermeide Referenzen auf aktuelle Ereignisse.

QUANTITATIVE DATEN (Testergebnisse):
{{quantitativeData}}

FLOW-ERLEBNIS (Was energetisiert diese Person):
{{flowStory}}

KONFLIKT-ERLEBNIS (Was kostet Energie):
{{frictionStory}}

Erstelle ein JSON mit exakt dieser Struktur:
{
  "operatingSystem": "1 packender Einleitungssatz + 1 Absatz über die Dynamik der Widersprüche. Maximal 100 Wörter. Keine konkreten Projekt- oder Personen-Referenzen.",
  "superpowers": [
    { "name": "Kreativer metaphorischer Titel auf Deutsch", "description": "Beschreibung des MUSTERS, das sich in der Flow-Story zeigt" },
    { "name": "Zweiter Titel", "description": "Zweite Stärke" },
    { "name": "Dritter Titel", "description": "Dritte Stärke" }
  ],
  "blindspots": [
    { "name": "Metaphorischer deutscher Name", "description": "Geframed als Unwucht der Talente oder falsche Umgebung, NICHT als Schwäche. Beschreibe das Muster aus der Konflikt-Story." },
    { "name": "Zweiter Blindspot", "description": "Zweites Risiko" }
  ],
  "growthOpportunities": [
    { "title": "Konkrete Übung mit kreativem Namen", "recommendation": "Praktische Handlungsempfehlung, die direkt aus den Blindspots abgeleitet ist" },
    { "title": "Zweite Übung", "recommendation": "Zweite Empfehlung" }
  ]
}`,

  en: `You are a psychological profiler with the linguistic elegance of a novelist.
Your goal: A deep personality profile that weaves quantitative data with qualitative narratives.

RULES:
1. Synthesize Paradoxes: If data shows contradictory traits (e.g., desire for freedom AND desire for structure), call it an "operating system". Explain how both poles work together (e.g., "You need structure to be wild").
2. No Psychobabble: No technical jargon. Use friendly terms: neuroticism→Emotional Stability. Invent metaphorical titles for talents (e.g., "Prototype Alchemy" instead of "High Openness").
3. Use the User-Story as PATTERN: Describe the underlying pattern (e.g., "creative autonomy"), NOT the specific event (e.g., "app development"). No project names, person names, or specific situations.
4. Tone: Empathetic, direct, slightly poetic, but grounded ("You contain multitudes").
5. Write in English. Use "You" as the form of address.
6. Timelessness: The profile should still be relevant in 2 years. Avoid references to current events.

QUANTITATIVE DATA (Test Results):
{{quantitativeData}}

FLOW EXPERIENCE (What energizes this person):
{{flowStory}}

CONFLICT EXPERIENCE (What drains energy):
{{frictionStory}}

Create a JSON with exactly this structure:
{
  "operatingSystem": "1 compelling opening sentence + 1 paragraph about the dynamics of contradictions. Maximum 100 words. No specific project or person references.",
  "superpowers": [
    { "name": "Creative metaphorical title", "description": "Description of the PATTERN shown in the flow story" },
    { "name": "Second title", "description": "Second strength" },
    { "name": "Third title", "description": "Third strength" }
  ],
  "blindspots": [
    { "name": "Metaphorical name", "description": "Framed as imbalance of talents or wrong environment, NOT as weakness. Describe the pattern from the conflict story." },
    { "name": "Second blindspot", "description": "Second risk" }
  ],
  "growthOpportunities": [
    { "title": "Concrete exercise with creative name", "recommendation": "Practical recommendation directly derived from the blindspots" },
    { "title": "Second exercise", "recommendation": "Second recommendation" }
  ]
}`
};

module.exports = router;

