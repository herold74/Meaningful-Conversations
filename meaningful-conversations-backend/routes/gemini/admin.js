const express = require('express');
const router = express.Router();
const optionalAuthMiddleware = require('../../middleware/optionalAuth.js');
const prisma = require('../../prismaClient.js');
const { getCacheStats } = require('../../services/promptCache.js');
const { trackApiUsage } = require('../../services/apiUsageTracker.js');
const aiProviderService = require('../../services/aiProviderService.js');
const behaviorLogger = require('../../services/behaviorLogger.js');

// GET /api/gemini/cache/stats - Admin endpoint for cache statistics
router.get('/cache/stats', optionalAuthMiddleware, async (req, res) => {
    const userId = req.userId;

    // Only allow admins to view cache stats
    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || (!user.isAdmin && !user.isDeveloper)) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const stats = getCacheStats();
    res.json(stats);
});

// POST /api/gemini/test/simulate-coachee - Generate realistic coachee responses for testing
// This endpoint is specifically designed for the TestRunner to simulate user responses
router.post('/test/simulate-coachee', optionalAuthMiddleware, async (req, res) => {
    const userId = req.userId;

    // Only allow developers to use this endpoint (Test Runner is developer-only)
    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isDeveloper) {
        return res.status(403).json({ error: 'Developer access required' });
    }

    const {
        lastBotMessage,
        lastUserMessage,
        scenarioDescription,
        personalityContext,
        language = 'de'
    } = req.body;

    if (!lastBotMessage) {
        return res.status(400).json({ error: 'lastBotMessage is required' });
    }

    const startTime = Date.now();

    try {
        // Build system prompt for coachee simulation
        const systemPrompt = language === 'de'
            ? `Du bist ein Coachee (Klient) in einem Coaching-Gespräch. Du hast ein Problem und suchst Hilfe.

WICHTIG: Du bist NICHT der Coach! Du bist der Klient, der Unterstützung sucht.

${personalityContext ? `DEINE PERSÖNLICHKEIT:\n${personalityContext}\n` : ''}
${scenarioDescription ? `DEIN THEMA: ${scenarioDescription}\n` : ''}

REGELN für deine Antwort:
1. Beantworte die Frage des Coaches direkt und konkret
2. Teile deine Gefühle, Sorgen und Gedanken authentisch
3. Sei verletzlich - du bist jemand, der Hilfe sucht
4. Antworte in 1-3 kurzen Sätzen
5. KEINE Coaching-Phrasen wie "Lass uns...", "Ich verstehe...", "Was denkst du..."
6. KEINE Fragen zurück an den Coach (außer Verständnisfragen)
7. KEINE Verhaltenshinweise mit Sternchen (wie *seufzt*, *nickt*, *schaut weg*)
8. Antworte so, wie ein echter Mensch mit diesem Problem antworten würde - in normalem Text ohne Rollenspiel-Formatierung`
            : `You are a coachee (client) in a coaching conversation. You have a problem and are seeking help.

IMPORTANT: You are NOT the coach! You are the client seeking support.

${personalityContext ? `YOUR PERSONALITY:\n${personalityContext}\n` : ''}
${scenarioDescription ? `YOUR TOPIC: ${scenarioDescription}\n` : ''}

RULES for your response:
1. Answer the coach's question directly and concretely
2. Share your feelings, worries, and thoughts authentically
3. Be vulnerable - you are someone seeking help
4. Respond in 1-3 short sentences
5. NO coaching phrases like "Let's...", "I understand...", "What do you think..."
6. NO questions back to the coach (except clarifying questions)
7. NO action descriptions with asterisks (like *sighs*, *nods*, *looks away*)
8. Respond like a real person with this problem would respond - in plain text without roleplay formatting`;

        const userPrompt = language === 'de'
            ? `Der Coach hat gerade gesagt:
"${lastBotMessage}"

${lastUserMessage ? `Du hattest vorher gesagt:\n"${lastUserMessage}"\n` : ''}
Deine Antwort als Coachee (beantworte die Frage des Coaches direkt):`
            : `The coach just said:
"${lastBotMessage}"

${lastUserMessage ? `You had previously said:\n"${lastUserMessage}"\n` : ''}
Your response as coachee (answer the coach's question directly):`;

        // Use Gemini directly for coachee simulation (no bot personality)
        const result = await aiProviderService.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                maxOutputTokens: 1000, // Increased to ensure complete responses
                temperature: 0.8, // Slightly creative for natural responses
            },
            context: 'chat'
        });

        const generatedText = result.text || '';

        // Log for debugging truncation issues
        console.log(`[Coachee Simulation] Response length: ${generatedText.length} chars, finishReason: ${result.rawResponse?.candidates?.[0]?.finishReason || 'unknown'}`);
        const durationMs = Date.now() - startTime;

        // Track usage
        await trackApiUsage({
            userId,
            model: result.model || 'mistral-medium-latest',
            endpoint: '/api/gemini/test/simulate-coachee',
            botId: 'test-coachee-simulator',
            inputTokens: result.usage?.inputTokens || 0,
            outputTokens: result.usage?.outputTokens || 0,
            durationMs,
            success: true,
        });

        res.json({
            text: generatedText.trim(),
            durationMs
        });

    } catch (error) {
        console.error('Coachee simulation error:', error);
        const durationMs = Date.now() - startTime;

        await trackApiUsage({
            userId,
            model: 'mistral-medium-latest',
            endpoint: '/api/gemini/test/simulate-coachee',
            botId: 'test-coachee-simulator',
            inputTokens: 0,
            outputTokens: 0,
            durationMs,
            success: false,
            errorMessage: error.message,
        });

        res.status(500).json({ error: 'Failed to generate coachee response' });
    }
});

// POST /api/gemini/test/analyze-keywords - Diagnostic endpoint for keyword analysis
// Runs all three analyzers (Riemann, Big5, SD) + adaptive weighting on provided messages
router.post('/test/analyze-keywords', optionalAuthMiddleware, async (req, res) => {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isDeveloper) return res.status(403).json({ error: 'Developer access required' });

    const { messages, language = 'de' } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'messages array required' });
    }

    try {
        const perMessage = [];
        const cumulative = {
            riemann: {}, big5: {}, spiralDynamics: {},
            totalKeywords: 0, frameworkCoverage: { riemann: 0, big5: 0, sd: 0 }
        };

        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            const recentMsgs = messages.slice(Math.max(0, i - 4), i);
            const result = behaviorLogger.analyzeMessageEnhanced(msg, language, recentMsgs);

            const extractKws = (frameworkResult) => {
                const kws = [];
                for (const [dim, data] of Object.entries(frameworkResult)) {
                    for (const kw of (data.foundKeywords?.high || [])) kws.push({ dim, dir: 'high', kw });
                    for (const kw of (data.foundKeywords?.low || [])) kws.push({ dim, dir: 'low', kw });
                }
                return kws;
            };

            const rKws = extractKws(result.riemann);
            const bKws = extractKws(result.big5);
            const sKws = extractKws(result.spiralDynamics);

            cumulative.frameworkCoverage.riemann += rKws.length;
            cumulative.frameworkCoverage.big5 += bKws.length;
            cumulative.frameworkCoverage.sd += sKws.length;
            cumulative.totalKeywords += rKws.length + bKws.length + sKws.length;

            perMessage.push({
                index: i,
                text: msg.substring(0, 120) + (msg.length > 120 ? '...' : ''),
                keywords: { riemann: rKws, big5: bKws, sd: sKws },
                count: rKws.length + bKws.length + sKws.length,
                adaptive: result.adaptive ? {
                    topic: result.adaptive.context?.topic,
                    sentiment: result.adaptive.sentiment?.polarity,
                    adjustments: result.adaptive.adjustedKeywordCount
                } : null
            });
        }

        const frameworksHit = [
            cumulative.frameworkCoverage.riemann > 0 ? 'riemann' : null,
            cumulative.frameworkCoverage.big5 > 0 ? 'big5' : null,
            cumulative.frameworkCoverage.sd > 0 ? 'sd' : null
        ].filter(Boolean);

        res.json({
            summary: {
                messageCount: messages.length,
                totalKeywords: cumulative.totalKeywords,
                frameworkCoverage: cumulative.frameworkCoverage,
                frameworksHit: frameworksHit.length,
                frameworks: frameworksHit
            },
            perMessage
        });
    } catch (error) {
        console.error('[analyze-keywords] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
