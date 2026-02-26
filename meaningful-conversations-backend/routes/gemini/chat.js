const express = require('express');
const router = express.Router();
const optionalAuthMiddleware = require('../middleware/optionalAuth.js');
const prisma = require('../prismaClient.js');
const { BOTS } = require('../constants.js');
const { trackApiUsage } = require('../services/apiUsageTracker.js');
const aiProviderService = require('../services/aiProviderService.js');
const dynamicPromptController = require('../services/dynamicPromptController.js');
const behaviorLogger = require('../services/behaviorLogger.js');
const { withTimeout } = require('./shared.js');

// POST /api/gemini/chat/send-message
router.post('/chat/send-message', optionalAuthMiddleware, async (req, res) => {
    const {
        botId, context, history, language, isNewSession, coachingMode, decryptedPersonalityProfile,
        // Test mode support
        testProfileOverride, includeTestTelemetry, userMessage: testUserMessage
    } = req.body;
    const userId = req.userId; // This will be undefined for guests
    const isTestMode = req.headers['x-test-mode'] === 'true';

    // Telemetry collection for test mode
    const testTelemetry = {
        dpcInjectionPresent: false,
        dpcInjectionLength: 0,
        dpcStrategiesUsed: [],
        dpflKeywordsDetected: [],
        stressKeywordsDetected: false, // Track stress keywords (not used for triggering comfort check)
    };

    const bot = BOTS.find(b => b.id === botId);
    if (!bot) {
        return res.status(404).json({ error: 'Bot not found' });
    }

    // Server-side access control
    let hasAccess = false;
    let userRegionPreference = 'optimal'; // Default for guests

    if (bot.accessTier === 'guest') {
        hasAccess = true;
    } else if (userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
            // Store user's AI region preference for later use
            userRegionPreference = user.aiRegionPreference || 'optimal';

            // Admins and Developers have full access to all bots
            if (user.isAdmin) {
                hasAccess = true;
            } else if (bot.accessTier === 'registered') {
                hasAccess = true; // Any registered user can access 'registered' bots
            } else if (bot.accessTier === 'premium') {
                // Premium users and clients get access to all premium bots.
                // Others need to have it explicitly unlocked.
                const unlockedCoaches = user.unlockedCoaches ? JSON.parse(user.unlockedCoaches) : [];
                if (user.isPremium || user.isClient || unlockedCoaches.includes(bot.id)) {
                    hasAccess = true;
                }
            } else if (bot.accessTier === 'client') {
                // Client-only bots (e.g. Rob, Victor) require isClient flag.
                // Also allow if individually unlocked via unlockedCoaches.
                const unlockedCoaches = user.unlockedCoaches ? JSON.parse(user.unlockedCoaches) : [];
                if (user.isClient || unlockedCoaches.includes(bot.id)) {
                    hasAccess = true;
                }
            }
        }
    }

    if (!hasAccess) {
        // Use 403 Forbidden for authorization errors, 401 is for authentication
        return res.status(403).json({ error: 'You do not have permission to access this coach.' });
    }

    let systemInstruction = language === 'de' ? (bot.systemPrompt_de || bot.systemPrompt) : bot.systemPrompt;

    // Get and format the current date based on the request language.
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const locale = language === 'de' ? 'de-DE' : 'en-US';
    const formattedDate = new Intl.DateTimeFormat(locale, options).format(today);

    // Replace the date placeholder in the system instruction.
    systemInstruction = systemInstruction.replace(/\[CURRENT_DATE\]/g, formattedDate);

    const isInitialMessage = history.length === 0;

    if (isInitialMessage && isNewSession) {
        if (language === 'de') {
            systemInstruction += "\n\n## Besondere Anweisung für diese erste Nachricht:\nDies ist die allererste Interaktion des Benutzers in dieser Sitzung. Sie MÜSSEN alle Regeln der 'Priorität bei der ersten Interaktion' bezüglich der Überprüfung von 'Nächsten Schritten' ignorieren. Ihre erste Nachricht MUSS Ihre standardmäßige, herzliche Begrüßung sein, in der Sie fragen, was den Benutzer beschäftigt. Erwähnen Sie nichts von 'willkommen zurück' oder früheren Schritten.";
        } else {
            systemInstruction += "\n\n## Special Instruction for this First Message:\nThis is the user's very first interaction in this session. You MUST ignore any 'Initial Interaction Priority' rules about checking 'Next Steps'. Your first message MUST be your standard, warm welcome, asking what is on their mind. Do not mention anything about 'welcome back' or previous steps.";
        }
    } else if (isInitialMessage && !isNewSession) {
        // Returning user - enforce strict first-message rules for Next Steps check-in
        if (language === 'de') {
            systemInstruction += `\n\n## ⚠️ STRIKTE REGELN FÜR DIESE ERSTE NACHRICHT (ÜBERSCHREIBT ALLES ANDERE):
Wenn du nach "Next Steps" oder früheren Vorhaben fragst:
1. Kurze Begrüßung
2. Du darfst die Ziele/Vorhaben erwähnen
3. Stelle NUR EINE einzige Frage (z.B. "Wie lief es damit?")
4. STOPP. Warte auf die Antwort.

STRIKT VERBOTEN in dieser ersten Nachricht:
- KEIN LOB für Fortschritte die du noch nicht gehört hast
- KEINE mehrfachen Fragen
- KEINE detaillierten Nachfragen zu spezifischen Aspekten
- KEINE Alternativen anbieten ("falls Sie lieber...", "oder gibt es etwas anderes...")
- KEIN "Ich bin gespannt..." oder "Was können Sie mir berichten?"`;
        } else {
            systemInstruction += `\n\n## ⚠️ STRICT RULES FOR THIS FIRST MESSAGE (OVERRIDES EVERYTHING ELSE):
If you're asking about "Next Steps" or previous intentions:
1. Brief greeting
2. You MAY mention the goals/intentions
3. Ask ONLY ONE simple question (e.g., "How did it go?")
4. STOP. Wait for the response.

STRICTLY FORBIDDEN in this first message:
- NO praising progress you haven't heard about yet
- NO multiple questions
- NO detailed follow-up questions about specific aspects
- NO offering alternatives ("if you'd rather...", "or is there something else...")
- NO "I'm curious to hear..." or "What can you tell me?"`;
        }
    }

    let finalSystemInstruction = systemInstruction;

    // DPC/DPFL: Dynamic Personality Coaching - inject profile context into prompt
    // In test mode, use testProfileOverride if provided
    const profileToUse = (isTestMode && testProfileOverride) ? testProfileOverride : decryptedPersonalityProfile;

    if (coachingMode === 'dpc' || coachingMode === 'dpfl' || isTestMode) {
        if (profileToUse) {
            try {
                const dpcResult = await dynamicPromptController.generatePromptForUser(
                    userId || 'guest',
                    profileToUse,
                    language, // Pass language to DPC
                    botId // Pass botId for bot-specific adaptations (e.g., AVA's enhanced challenge logic)
                );

                if (dpcResult?.prompt) {
                    finalSystemInstruction += dpcResult.prompt;

                    // Collect telemetry for test mode
                    if (isTestMode) {
                        testTelemetry.dpcInjectionPresent = true;
                        testTelemetry.dpcInjectionLength = dpcResult.prompt.length;
                        testTelemetry.dpcStrategiesUsed = dpcResult.strategiesUsed || [];
                        testTelemetry.dpcMergeMetadata = dpcResult.mergeMetadata || null;
                    }
                }
            } catch (error) {
                console.error('[DPC] Error generating adaptive prompt:', error);
                // Fail gracefully - continue with standard prompt
            }
        } else if (!isTestMode) {
            console.warn(`[DPC] Coaching mode ${coachingMode} active but no profile provided`);
        }
    }

    // Option A+: Conversation History Summary for AVA (pseudo-state tracking)
    if (botId === 'ava-strategic' && (coachingMode === 'dpc' || coachingMode === 'dpfl') && profileToUse) {
        const recentHistory = history.slice(-6); // Last 6 messages (3 turns)

        // Extract bot's challenge questions from history
        const botChallenges = recentHistory
            .filter(msg => msg.role === 'bot')
            .map(msg => {
                // Simple heuristic: Contains challenge keywords + question mark
                const text = msg.text.toLowerCase();
                const hasChallengeKeyword =
                    text.includes('blindspot') ||
                    text.includes('entwickeln') ||
                    text.includes('develop') ||
                    text.includes('schritt weiter') ||
                    text.includes('one step further') ||
                    text.includes('experiment') ||
                    text.includes('herausforderung') ||
                    text.includes('challenge');
                const hasQuestion = text.includes('?');
                return hasChallengeKeyword && hasQuestion ? msg.text : null;
            })
            .filter(Boolean);

        // Extract resource exploration questions
        const resourceQuestions = recentHistory
            .filter(msg => msg.role === 'bot')
            .map(msg => {
                const text = msg.text.toLowerCase();
                const hasResourceKeyword =
                    text.includes('gemeistert') ||
                    text.includes('mastered') ||
                    text.includes('erfolg') ||
                    text.includes('success') ||
                    text.includes('stärke') ||
                    text.includes('strength') ||
                    text.includes('unterstützen') ||
                    text.includes('support') ||
                    text.includes('ressource') ||
                    text.includes('resource');
                const hasQuestion = text.includes('?');
                return hasResourceKeyword && hasQuestion ? msg.text : null;
            })
            .filter(Boolean);

        // Build history summary for LLM
        let historySummary = '\n\n**CONVERSATION-STATE-KONTEXT (für deine State-Awareness):**\n\n';

        if (botChallenges.length > 0) {
            historySummary += language === 'de'
                ? `Du hast bereits ${botChallenges.length} Blindspot-Challenge(s) gestellt:\n`
                : `You have already posed ${botChallenges.length} blindspot challenge(s):\n`;
            botChallenges.slice(-2).forEach((q, idx) => {
                historySummary += `${idx + 1}. "${q.substring(0, 80)}..."\n`;
            });
            historySummary += '\n';
        } else {
            historySummary += language === 'de'
                ? 'Du hast noch KEINE Blindspot-Challenges gestellt.\n\n'
                : 'You have NOT posed any blindspot challenges yet.\n\n';
        }

        if (resourceQuestions.length > 0) {
            historySummary += language === 'de'
                ? `Du hast bereits nach RESSOURCEN gefragt (${resourceQuestions.length}× in den letzten Nachrichten):\n`
                : `You have already asked about RESOURCES (${resourceQuestions.length}× in recent messages):\n`;
            resourceQuestions.slice(-1).forEach(q => {
                historySummary += `"${q.substring(0, 80)}..."\n`;
            });
            historySummary += language === 'de'
                ? '→ Du bist vermutlich in **PHASE 2** (Ressourcen aktiviert, bereit für Blindspot-Brücke)\n\n'
                : '→ You are likely in **PHASE 2** (Resources activated, ready for blindspot bridge)\n\n';
        } else {
            historySummary += language === 'de'
                ? 'Du hast noch NICHT nach Ressourcen gefragt.\n→ Wenn User "festgefahren" signalisiert: Starte mit **PHASE 1** (Ressourcen-Exploration)\n\n'
                : 'You have NOT asked about resources yet.\n→ If user signals "stuck": Start with **PHASE 1** (Resource exploration)\n\n';
        }

        const userLastMessage = recentHistory.filter(msg => msg.role === 'user').slice(-1)[0]?.text || '';
        const userRespondedToChallenge = botChallenges.length > 0 && userLastMessage.length > 30;

        if (botChallenges.length > 0 && !userRespondedToChallenge) {
            historySummary += language === 'de'
                ? '⚠️ User hat auf letzte Challenge NICHT geantwortet (Ausweichen?) → Wähle anderen Blindspot oder warte ab\n\n'
                : '⚠️ User did NOT respond to last challenge (Avoidance?) → Choose different blindspot or wait\n\n';
        }

        finalSystemInstruction += historySummary;
    }

    // Exclude context injection for bots that don't need it:
    // - gloria-life-context: creates the context, doesn't read one
    // - gloria-interview: conducts topic-based interviews independent of life context
    if (bot.id !== 'gloria-life-context' && bot.id !== 'gloria-interview') {
        finalSystemInstruction += `\n\n## User Context\nThe user has provided the following context for this session. You MUST use this to inform your responses.\n\n<context>\n${context || 'The user has not provided a life context.'}\n</context>`;
    }

    const modelHistory = history.map((msg) => ({
        role: msg.role === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.text }],
    }));

    const startTime = Date.now();
    const modelName = 'gemini-2.5-flash';

    // Explicit prompt caching disabled — Google Gemini 2.5 Flash has automatic
    // implicit caching (since May 2025) which handles repeated system instructions
    // without needing explicit cache creation. The previous explicit caching via
    // ai.caches.create() failed because the API requires a `contents` array with
    // ≥1024 tokens, but we only passed `systemInstruction` (which doesn't count
    // toward total_token_count). Adding dummy contents would pollute chat history.
    // Implicit caching provides the same cost savings automatically.
    let cacheUsed = false;
    const activeProvider = await aiProviderService.getActiveProvider();

    try {
        const config = {
            temperature: 0.7,
            systemInstruction: finalSystemInstruction,
        };

        const response = await withTimeout(
            aiProviderService.generateContent({
                model: modelName,
                // For the initial message, we send an empty string to prompt the model's greeting.
                // For subsequent messages, we send the entire chat history.
                contents: isInitialMessage ? "" : modelHistory,
                config: config,
                context: 'chat', // Chat messages use chat context
                userRegionPreference: userRegionPreference // User's EU/US preference
            }),
            30000,
            'Chat AI response'
        );

        const durationMs = Date.now() - startTime;
        const text = response.text;

        // Track API usage with actual model and provider used
        const actualModel = response.model || modelName;
        const tokenUsage = response.usage || { inputTokens: 0, outputTokens: 0 };

        await trackApiUsage({
            userId: userId || null,
            isGuest: !userId,
            endpoint: 'chat',
            model: actualModel,
            botId: botId,
            inputTokens: tokenUsage.inputTokens,
            outputTokens: tokenUsage.outputTokens,
            durationMs,
            success: true,
            metadata: {
                provider: response.provider,
                cacheUsed: cacheUsed || undefined,
            },
        });

        // DPFL: Behavior logging
        // In test mode, we do this synchronously to collect telemetry
        // Otherwise, async (does not block response)
        const messageToAnalyze = testUserMessage || req.body.userMessage || '';

        if (isTestMode && messageToAnalyze) {
            try {
                // Phase 2a: Use enhanced analysis with adaptive weighting + sentiment
                const recentUserMessages = (req.body.chatHistory || [])
                    .filter(m => m.role === 'user')
                    .slice(-5)
                    .map(m => m.text || m.content || '');

                const enhancedResult = behaviorLogger.analyzeMessageEnhanced(
                    messageToAnalyze, language, recentUserMessages
                );

                // Helper: extract keywords from framework analysis result
                const extractKeywords = (frameworkResult, prefix) => {
                    const keywords = [];
                    for (const [dimension, data] of Object.entries(frameworkResult)) {
                        if (data.foundKeywords) {
                            if (data.foundKeywords.high && data.foundKeywords.high.length > 0) {
                                keywords.push(...data.foundKeywords.high.map(k => `${prefix}:${dimension}:high:${k}`));
                            }
                            if (data.foundKeywords.low && data.foundKeywords.low.length > 0) {
                                keywords.push(...data.foundKeywords.low.map(k => `${prefix}:${dimension}:low:${k}`));
                            }
                        }
                    }
                    return keywords;
                };

                // Collect detected keywords for ALL frameworks
                const allDetectedKeywords = {
                    riemann: extractKeywords(enhancedResult.riemann, 'riemann'),
                    big5: extractKeywords(enhancedResult.big5, 'big5'),
                    spiralDynamics: extractKeywords(enhancedResult.spiralDynamics, 'sd')
                };

                // Legacy format (Riemann-only, without prefix) for backward compatibility
                const detectedKeywords = [];
                for (const [dimension, data] of Object.entries(enhancedResult.riemann)) {
                    if (data.foundKeywords) {
                        if (data.foundKeywords.high && data.foundKeywords.high.length > 0) {
                            detectedKeywords.push(...data.foundKeywords.high.map(k => `${dimension}:high:${k}`));
                        }
                        if (data.foundKeywords.low && data.foundKeywords.low.length > 0) {
                            detectedKeywords.push(...data.foundKeywords.low.map(k => `${dimension}:low:${k}`));
                        }
                    }
                }
                testTelemetry.dpflKeywordsDetected = detectedKeywords;
                testTelemetry.allFrameworkKeywords = allDetectedKeywords;

                // Phase 2a: Include adaptive weighting metadata in telemetry
                if (enhancedResult.adaptive) {
                    testTelemetry.adaptiveWeighting = {
                        context: enhancedResult.adaptive.context,
                        sentiment: enhancedResult.adaptive.sentiment,
                        adjustedKeywordCount: enhancedResult.adaptive.adjustedKeywordCount,
                        weightingDetails: enhancedResult.adaptive.weightingDetails
                    };
                }

                // Test-only: Track if message contains stress keywords for telemetry
                // Note: Comfort Check is shown after EVERY DPFL session, not just when keywords are found
                const stressKeywords = [
                    // German keywords (15)
                    'stress', 'überfordert', 'angst', 'traurig', 'hoffnungslos',
                    'verzweifelt', 'erschöpft', 'deprimiert', 'ausgebrannt', 'hilflos',
                    'panik', 'einsam', 'mutlos', 'leer', 'verloren',
                    // English keywords (15)
                    'overwhelmed', 'anxious', 'sad', 'hopeless', 'depressed',
                    'desperate', 'exhausted', 'burnt out', 'burnout', 'helpless',
                    'panic', 'lonely', 'discouraged', 'empty', 'lost'
                ];
                const lowerMessage = messageToAnalyze.toLowerCase();
                testTelemetry.stressKeywordsDetected = stressKeywords.some(k => lowerMessage.includes(k));
            } catch (error) {
                console.error('[DPFL] Test mode behavior logging error:', error);
            }
        } else if (coachingMode === 'dpfl' && userId) {
            // Run in background - don't await
            setImmediate(async () => {
                try {
                    // Analyze current user message
                    const frequencies = behaviorLogger.analyzeMessage(messageToAnalyze, language);

                    // Note: Full conversation logging will be done at session end
                    // This is just real-time analysis for debugging/monitoring
                } catch (error) {
                    console.error('[DPFL] Behavior logging error:', error);
                    // Fail silently - don't impact user experience
                }
            });
        }

        // Build response
        const responseData = { text };

        // Add LLM metadata in test mode for comparison purposes
        if (isTestMode) {
            responseData.llmMetadata = {
                model: actualModel,
                provider: response.provider || 'unknown',
                tokenUsage: {
                    input: tokenUsage.inputTokens || 0,
                    output: tokenUsage.outputTokens || 0,
                    total: (tokenUsage.inputTokens || 0) + (tokenUsage.outputTokens || 0)
                },
                responseTimeMs: durationMs,
                cacheUsed: cacheUsed || false,
                timestamp: new Date().toISOString()
            };

            // Include telemetry in test mode
            if (includeTestTelemetry) {
                responseData.testTelemetry = testTelemetry;
            }
        }

        res.json(responseData);
    } catch (error) {
        console.error('AI API error in /chat/send-message:', error);

        const durationMs = Date.now() - startTime;
        const isTimeout = error.message && error.message.includes('timeout');

        // Track failed API call
        await trackApiUsage({
            userId: userId || null,
            isGuest: !userId,
            endpoint: 'chat',
            model: modelName,
            botId: botId,
            inputTokens: 0,
            outputTokens: 0,
            durationMs,
            success: false,
            errorMessage: error.message,
        });

        if (isTimeout) {
            res.status(504).json({ error: 'The AI model took too long to respond. Please try again.' });
        } else {
            res.status(500).json({ error: 'Failed to get response from AI model.' });
        }
    }
});

module.exports = router;
