const express = require('express');
const router = express.Router();
const optionalAuthMiddleware = require('../middleware/optionalAuth.js');
const prisma = require('../prismaClient.js');
const { BOTS } = require('../constants.js');
const { analysisPrompts, interviewFormattingPrompts, getInterviewTemplate } = require('../services/geminiPrompts.js');
const { trackApiUsage } = require('../services/apiUsageTracker.js');
const { getOrCreateCache, getCacheStats } = require('../services/promptCache.js');
const aiProviderService = require('../services/aiProviderService.js');
const dynamicPromptController = require('../services/dynamicPromptController.js');
const behaviorLogger = require('../services/behaviorLogger.js');

// For backward compatibility with prompt cache (which needs direct Google AI access)
let googleAI;
import('@google/genai').then(({ GoogleGenAI }) => {
    googleAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
}).catch(err => {
    console.error("Failed to initialize Google AI:", err);
    googleAI = null;
});

// POST /api/gemini/translate
router.post('/translate', optionalAuthMiddleware, async (req, res) => {
    const { subject, body, sourceLang = 'de', targetLang = 'en' } = req.body;
    const userId = req.userId; // Admin-only access check

    // Only admins can translate
    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        if (!subject && !body) {
            return res.status(400).json({ error: 'At least subject or body must be provided' });
        }

        // Language names for system instruction
        const langNames = { de: 'German', en: 'English' };
        const sourceLanguage = langNames[sourceLang] || 'German';
        const targetLanguage = langNames[targetLang] || 'English';

        const modelName = 'gemini-2.5-flash'; // Gemini 2.5 Flash for fast, high-quality translations
        const systemInstruction = `You are a professional translator. Translate the following ${sourceLanguage} text to ${targetLanguage}. Preserve all Markdown formatting (e.g., **bold**, *italic*, # headings, - lists). Return ONLY the translated text without any additional explanation or commentary.`;

        const translationResults = {};

        // Timeout helper
        const withTimeout = (promise, timeoutMs = 25000) => {
            return Promise.race([
                promise,
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Translation timeout - text might be too long')), timeoutMs)
                )
            ]);
        };

        if (subject) {
            const subjectResult = await withTimeout(
                aiProviderService.generateContent({
                model: modelName,
                contents: subject,
                config: {
                    systemInstruction: systemInstruction,
                },
                context: 'chat' // Translation uses chat context
                })
            );
            translationResults.subject = subjectResult.text;
        }

        if (body) {
            const bodyResult = await withTimeout(
                aiProviderService.generateContent({
                model: modelName,
                contents: body,
                config: {
                    systemInstruction: systemInstruction,
                },
                context: 'chat' // Translation uses chat context
                })
            );
            translationResults.body = bodyResult.text;
        }

        return res.json(translationResults);

    } catch (error) {
        console.error('Translation error:', error);
        if (error.message.includes('timeout')) {
            return res.status(504).json({ 
                error: 'Translation timeout', 
                message: 'The text is too long. Please try with shorter content.',
                details: error.message 
            });
        }
        return res.status(500).json({ error: 'Translation failed', details: error.message });
    }
});

// POST /api/gemini/chat/send-message
router.post('/chat/send-message', optionalAuthMiddleware, async (req, res) => {
    const { 
        botId, context, history, lang, isNewSession, coachingMode, decryptedPersonalityProfile,
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
        comfortCheckTriggered: false,
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
            
            if (bot.accessTier === 'registered') {
                hasAccess = true; // Any registered user can access 'registered' bots
            } else if (bot.accessTier === 'premium') {
                // Beta testers get access to all premium bots.
                // Others need to have it explicitly unlocked.
                const unlockedCoaches = user.unlockedCoaches ? JSON.parse(user.unlockedCoaches) : [];
                if (user.isBetaTester || unlockedCoaches.includes(bot.id)) {
                    hasAccess = true;
                }
            }
        }
    }

    if (!hasAccess) {
        // Use 403 Forbidden for authorization errors, 401 is for authentication
        return res.status(403).json({ error: 'You do not have permission to access this coach.' });
    }

    let systemInstruction = lang === 'de' ? (bot.systemPrompt_de || bot.systemPrompt) : bot.systemPrompt;
    
    // Get and format the current date based on the request language.
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const locale = lang === 'de' ? 'de-DE' : 'en-US';
    const formattedDate = new Intl.DateTimeFormat(locale, options).format(today);

    // Replace the date placeholder in the system instruction.
    systemInstruction = systemInstruction.replace(/\[CURRENT_DATE\]/g, formattedDate);

    const isInitialMessage = history.length === 0;

    if (isInitialMessage && isNewSession) {
        if (lang === 'de') {
            systemInstruction += "\n\n## Besondere Anweisung für diese erste Nachricht:\nDies ist die allererste Interaktion des Benutzers in dieser Sitzung. Sie MÜSSEN alle Regeln der 'Priorität bei der ersten Interaktion' bezüglich der Überprüfung von 'Nächsten Schritten' ignorieren. Ihre erste Nachricht MUSS Ihre standardmäßige, herzliche Begrüßung sein, in der Sie fragen, was den Benutzer beschäftigt. Erwähnen Sie nichts von 'willkommen zurück' oder früheren Schritten.";
        } else {
            systemInstruction += "\n\n## Special Instruction for this First Message:\nThis is the user's very first interaction in this session. You MUST ignore any 'Initial Interaction Priority' rules about checking 'Next Steps'. Your first message MUST be your standard, warm welcome, asking what is on their mind. Do not mention anything about 'welcome back' or previous steps.";
        }
    } else if (isInitialMessage && !isNewSession) {
        // Returning user - enforce strict first-message rules for Next Steps check-in
        if (lang === 'de') {
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
                const adaptivePrompt = await dynamicPromptController.generatePromptForUser(
                    userId || 'guest',
                    profileToUse,
                    lang // Pass language to DPC
                );
                if (adaptivePrompt) {
                    finalSystemInstruction += adaptivePrompt;
                    
                    // Collect telemetry for test mode
                    if (isTestMode) {
                        testTelemetry.dpcInjectionPresent = true;
                        testTelemetry.dpcInjectionLength = adaptivePrompt.length;
                        // Extract strategy info from the prompt
                        const strategyMatches = adaptivePrompt.match(/(?:Riemann|Big5|SD|Spiral)[\w\s]*/gi) || [];
                        testTelemetry.dpcStrategiesUsed = [...new Set(strategyMatches)];
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
    
    // For all bots EXCEPT the interviewer, add the context.
    // The interviewer's purpose is to CREATE the context, so it doesn't need to read one.
    if (bot.id !== 'g-interviewer') {
        finalSystemInstruction += `\n\n## User Context\nThe user has provided the following context for this session. You MUST use this to inform your responses.\n\n<context>\n${context || 'The user has not provided a life context.'}\n</context>`;
    }

    const modelHistory = history.map((msg) => ({
        role: msg.role === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.text }],
    }));

    const startTime = Date.now();
    const modelName = 'gemini-2.5-flash';
    
    // Try to use prompt caching for registered users with Life Context
    // Note: Caching only works with Google AI currently
    let cachedContentName = null;
    let cacheUsed = false;
    const activeProvider = await aiProviderService.getActiveProvider();
    
    if (userId && bot.id !== 'g-interviewer' && context && activeProvider === 'google' && googleAI) {
        // Only cache for registered users with actual Life Context when using Google
        cachedContentName = await getOrCreateCache(googleAI, userId, finalSystemInstruction, modelName);
        cacheUsed = cachedContentName !== null;
    }
    
    try {
        const config = {
            temperature: 0.7,
        };
        
        // If cache is available, use it; otherwise use regular systemInstruction
        if (cachedContentName) {
            config.cachedContent = cachedContentName;
        } else {
            config.systemInstruction = finalSystemInstruction;
        }
        
        const response = await aiProviderService.generateContent({
            model: modelName,
            // For the initial message, we send an empty string to prompt the model's greeting.
            // For subsequent messages, we send the entire chat history.
            contents: isInitialMessage ? "" : modelHistory,
            config: config,
            context: 'chat', // Chat messages use chat context
            userRegionPreference: userRegionPreference // User's EU/US preference
        });
        
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
                const frequencies = behaviorLogger.analyzeMessage(messageToAnalyze, lang);
                // Collect detected keywords for telemetry
                const detectedKeywords = [];
                for (const [dimension, data] of Object.entries(frequencies)) {
                    // behaviorLogger returns { foundKeywords: { high: [], low: [] } }
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
                
                // Check for comfort check triggers (stress/emotional distress keywords)
                const comfortKeywords = ['stress', 'überfordert', 'angst', 'traurig', 'hoffnungslos', 
                                        'overwhelmed', 'anxious', 'sad', 'hopeless', 'depressed'];
                const lowerMessage = messageToAnalyze.toLowerCase();
                testTelemetry.comfortCheckTriggered = comfortKeywords.some(k => lowerMessage.includes(k));
            } catch (error) {
                console.error('[DPFL] Test mode behavior logging error:', error);
            }
        } else if (coachingMode === 'dpfl' && userId) {
            // Run in background - don't await
            setImmediate(async () => {
                try {
                    // Analyze current user message
                    const frequencies = behaviorLogger.analyzeMessage(messageToAnalyze, lang);
                    
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
        
        // Include telemetry in test mode
        if (isTestMode && includeTestTelemetry) {
            responseData.testTelemetry = testTelemetry;
        }
        
        res.json(responseData);
    } catch (error) {
        console.error('AI API error in /chat/send-message:', error);
        
        const durationMs = Date.now() - startTime;
        
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
        
        res.status(500).json({ error: 'Failed to get response from AI model.' });
    }
});

/**
 * Helper function to normalize text for comparison (remove punctuation, lowercase, trim)
 */
function normalizeForComparison(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .replace(/[.,!?;:()"\-–—]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ')            // Normalize whitespace
        .trim();
}

/**
 * Check if two strings are similar enough to be considered duplicates
 * Uses normalized comparison with optional deadline stripping
 */
function isSimilarText(text1, text2, threshold = 0.85) {
    // Strip deadline patterns like "(Deadline: 2026-01-11)" or "(bis: 2026-01-11)"
    const stripDeadline = (t) => t.replace(/\s*\((?:Deadline|bis):\s*\d{4}-\d{2}-\d{2}\)/gi, '');
    
    const norm1 = normalizeForComparison(stripDeadline(text1));
    const norm2 = normalizeForComparison(stripDeadline(text2));
    
    // Exact match after normalization
    if (norm1 === norm2) return true;
    
    // Check if one contains the other (for slight variations)
    if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
    
    // Simple similarity check: compare word overlap
    const words1 = new Set(norm1.split(' ').filter(w => w.length > 3));
    const words2 = new Set(norm2.split(' ').filter(w => w.length > 3));
    
    if (words1.size === 0 || words2.size === 0) return false;
    
    const intersection = [...words1].filter(w => words2.has(w)).length;
    const union = new Set([...words1, ...words2]).size;
    const jaccardSimilarity = intersection / union;
    
    return jaccardSimilarity >= threshold;
}

/**
 * Extract existing items from a markdown section
 */
function extractExistingItems(context, sectionPattern) {
    if (!context) return [];
    
    const regex = new RegExp(sectionPattern + '[\\s\\S]*?(?=##|$)', 'i');
    const match = context.match(regex);
    if (!match) return [];
    
    // Extract bullet points, but filter out description lines and metadata
    const items = [];
    const bulletRegex = /^\s*[*\-•]\s*(.+)$/gm;
    let bulletMatch;
    while ((bulletMatch = bulletRegex.exec(match[0])) !== null) {
        const item = bulletMatch[1].trim();
        
        // Skip description/metadata lines (italic text, short generic phrases)
        if (item.startsWith('*') && item.endsWith('*')) continue; // Italic markdown
        if (item.toLowerCase().includes('specific, actionable')) continue;
        if (item.toLowerCase().includes('tasks i have committed')) continue;
        if (item.toLowerCase().includes('aufgaben, zu denen ich mich')) continue;
        if (item.length < 20) continue; // Too short to be a real action item
        
        items.push(item);
    }
    return items;
}

/**
 * Deduplicate AI analysis response against existing context
 */
function deduplicateAnalysisResponse(jsonResponse, context) {
    console.log('🔍 Starting deduplication check...');
    
    if (!context || !jsonResponse) {
        console.log('⚠️ No context or response to deduplicate');
        return jsonResponse;
    }
    
    // Log raw nextSteps section from context for debugging
    const nextStepsMatch = context.match(/(?:✅\s*)?(?:Achievable Next Steps|Realisierbare nächste Schritte)[\s\S]*?(?=##|$)/i);
    if (nextStepsMatch) {
        console.log('📄 Raw Next Steps section from context:');
        console.log(nextStepsMatch[0].substring(0, 500));
    }
    
    // Extract existing next steps from context
    const existingNextSteps = extractExistingItems(
        context, 
        '(?:✅\\s*)?(?:Achievable Next Steps|Realisierbare nächste Schritte)'
    );
    
    console.log(`📋 Found ${existingNextSteps.length} existing next steps in context`);
    if (existingNextSteps.length > 0) {
        console.log('   Existing steps (full):', JSON.stringify(existingNextSteps, null, 2));
    }
    
    // Deduplicate nextSteps
    if (jsonResponse.nextSteps && Array.isArray(jsonResponse.nextSteps)) {
        console.log(`📝 AI proposed ${jsonResponse.nextSteps.length} next steps:`);
        jsonResponse.nextSteps.forEach((step, i) => {
            console.log(`   ${i+1}. "${step.action}" (Deadline: ${step.deadline})`);
        });
        const originalCount = jsonResponse.nextSteps.length;
        
        // First: Remove internal duplicates (AI proposing same step twice)
        const seenActions = new Set();
        jsonResponse.nextSteps = jsonResponse.nextSteps.filter(step => {
            const normalized = normalizeForComparison(step.action);
            if (seenActions.has(normalized)) {
                console.log(`🔄 Filtered internal duplicate: "${step.action.substring(0, 50)}..."`);
                return false;
            }
            seenActions.add(normalized);
            return true;
        });
        
        // Second: Remove duplicates against existing context
        jsonResponse.nextSteps = jsonResponse.nextSteps.filter(step => {
            console.log(`   Checking: "${step.action.substring(0, 60)}..."`);
            const isDuplicate = existingNextSteps.some(existing => {
                const similar = isSimilarText(step.action, existing);
                if (similar) {
                    console.log(`   ↳ MATCH with existing: "${existing.substring(0, 60)}..."`);
                }
                return similar;
            });
            if (isDuplicate) {
                console.log(`🔄 Filtered context duplicate: "${step.action.substring(0, 50)}..."`);
            }
            return !isDuplicate;
        });
        
        if (originalCount !== jsonResponse.nextSteps.length) {
            console.log(`✓ Deduplicated nextSteps: ${originalCount} → ${jsonResponse.nextSteps.length}`);
        } else {
            console.log(`✓ No duplicates found in nextSteps`);
        }
    }
    
    // Deduplicate append updates
    if (jsonResponse.updates && Array.isArray(jsonResponse.updates)) {
        const originalCount = jsonResponse.updates.length;
        jsonResponse.updates = jsonResponse.updates.filter(update => {
            if (update.type !== 'append') return true;
            
            // Extract existing items from the target section
            const existingInSection = extractExistingItems(context, update.headline.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
            
            // Check if the new content is a duplicate
            const newContent = update.content.replace(/^\s*[*\-•]\s*/, '').trim();
            const isDuplicate = existingInSection.some(existing => 
                isSimilarText(newContent, existing)
            );
            
            if (isDuplicate) {
                console.log(`🔄 Filtered duplicate append to "${update.headline}": "${newContent.substring(0, 50)}..."`);
            }
            return !isDuplicate;
        });
        if (originalCount !== jsonResponse.updates.length) {
            console.log(`✓ Deduplicated updates: ${originalCount} → ${jsonResponse.updates.length}`);
        }
    }
    
    return jsonResponse;
}

// POST /api/gemini/session/analyze
router.post('/session/analyze', optionalAuthMiddleware, async (req, res) => {
    const { history, context, lang } = req.body;
    
    // Detect the language of the context file. Default to 'en'.
    const docLang = (context && context.match(/^#\s*(Mein\s)?Lebenskontext/im)) ? 'de' : 'en';

    const analysisPromptConfig = lang === 'de' ? analysisPrompts.de : analysisPrompts.en;
    const conversation = history.map(msg => `${msg.role === 'user' ? 'User' : 'Coach'}: ${msg.text}`).join('\n\n');
    
    // Get current date in ISO format for deadline generation
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const fullPrompt = analysisPromptConfig.prompt({ conversation, context, docLang, currentDate });
    const startTime = Date.now();
    const modelName = 'gemini-2.5-pro'; // Using Gemini 2.5 Pro for improved reasoning
    const userId = req.userId;
    
    try {
        const response = await aiProviderService.generateContent({
            model: modelName, // Use a more powerful model for structured analysis
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisPrompts.schema,
                temperature: 0.2, // Lower temperature for more deterministic, structured output
            },
            context: 'analysis' // Session analysis uses analysis context
        });

        const durationMs = Date.now() - startTime;
        
        // Clean response text: Remove markdown code blocks (common with Mistral)
        let cleanedText = response.text.trim();
        
        // Remove ```json ... ``` or ``` ... ``` wrappers
        const codeBlockRegex = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/;
        const match = cleanedText.match(codeBlockRegex);
        if (match && match[1]) {
            cleanedText = match[1].trim();
        }
        
        // Parse JSON response with improved error handling
        let jsonResponse;
        try {
            jsonResponse = JSON.parse(cleanedText);
        } catch (parseError) {
            // First parse attempt failed - try Mistral-specific sanitization
            // Mistral sometimes outputs malformed escape sequences like: "quote": \"text\"
            // instead of: "quote": "text"
            console.log('⚠️ First JSON parse failed, attempting Mistral sanitization...');
            
            try {
                // Fix malformed escaped quotes outside of strings
                // Pattern: ": \" at the start of a value should be ": "
                // Pattern: \" at end of value before comma/newline should be "
                let sanitizedText = cleanedText
                    // Fix ": \" (colon followed by escaped quote) -> ": "
                    .replace(/:\s*\\"/g, ': "')
                    // Fix \", (escaped quote before comma) -> ",
                    .replace(/\\",/g, '",')
                    // Fix \" at end of line before } or ] -> "
                    .replace(/\\"(\s*[}\]])/g, '"$1')
                    // Fix \"\n (escaped quote before newline) -> "\n
                    .replace(/\\"\s*\n/g, '"\n');
                
                jsonResponse = JSON.parse(sanitizedText);
                console.log('✓ Mistral sanitization successful');
            } catch (secondParseError) {
                // Both attempts failed - log and throw
                console.error('❌ Failed to parse AI response as JSON:', parseError.message);
                console.error('   Provider:', response.provider);
                console.error('   Raw response (first 500 chars):', response.text.substring(0, 500));
                console.error('   Cleaned text (first 500 chars):', cleanedText.substring(0, 500));
            
                // Track API usage with actual model and provider used
                const actualModel = response.model || modelName;
                const tokenUsage = response.usage || { inputTokens: 0, outputTokens: 0 };
                
                await trackApiUsage({
                    userId: userId || null,
                    isGuest: !userId,
                    endpoint: 'analyze',
                    model: actualModel,
                    botId: null,
                    inputTokens: tokenUsage.inputTokens,
                    outputTokens: tokenUsage.outputTokens,
                    durationMs,
                    success: false,
                    errorMessage: `JSON parse error: ${parseError.message}`,
                    metadata: { 
                        provider: response.provider,
                        rawResponsePreview: response.text.substring(0, 200)
                    },
                });
                
                throw new Error(`AI returned invalid JSON format: ${parseError.message}`);
            }
        }
        
        // Track API usage with actual model and provider used
        const actualModel = response.model || modelName;
        const tokenUsage = response.usage || { inputTokens: 0, outputTokens: 0 };
        
        await trackApiUsage({
            userId: userId || null,
            isGuest: !userId,
            endpoint: 'analyze',
            model: actualModel,
            botId: null,
            inputTokens: tokenUsage.inputTokens,
            outputTokens: tokenUsage.outputTokens,
            durationMs,
            success: true,
            metadata: { provider: response.provider },
        });
        
        // Deduplicate response against existing context before sending
        const deduplicatedResponse = deduplicateAnalysisResponse(jsonResponse, context);
        
        res.json(deduplicatedResponse);
    } catch (error) {
        console.error('AI API error in /session/analyze:', error);
        
        const durationMs = Date.now() - startTime;
        
        // Track failed API call
        await trackApiUsage({
            userId: userId || null,
            isGuest: !userId,
            endpoint: 'analyze',
            model: modelName,
            botId: null,
            inputTokens: 0,
            outputTokens: 0,
            durationMs,
            success: false,
            errorMessage: error.message,
        });
        
        res.status(500).json({ error: 'Failed to analyze session.' });
    }
});

// POST /api/gemini/session/format-interview
router.post('/session/format-interview', optionalAuthMiddleware, async (req, res) => {
    const { history, lang } = req.body;

    const formattingPromptConfig = lang === 'de' ? interviewFormattingPrompts.de : interviewFormattingPrompts.en;
    const conversation = history.map(msg => `${msg.role === 'user' ? 'User' : 'Guide'}: ${msg.text}`).join('\n\n');
    const template = getInterviewTemplate(lang);

    const fullPrompt = formattingPromptConfig.prompt({ conversation, template });
    const startTime = Date.now();
    const modelName = 'gemini-2.5-pro'; // Using Gemini 2.5 Pro for improved formatting
    const userId = req.userId;

    try {
        const response = await aiProviderService.generateContent({
            model: modelName,
            contents: fullPrompt,
            context: 'analysis' // Formatting uses analysis context
        });
        
        const durationMs = Date.now() - startTime;
        let markdown = response.text.trim();

        // Clean up potential markdown code block wrappers from the AI's response.
        // This regex handles ```markdown ... ``` or just ``` ... ```
        const codeBlockRegex = /^```(?:markdown)?\s*\n([\s\S]+?)\n```$/;
        const match = markdown.match(codeBlockRegex);
        if (match && match[1]) {
            markdown = match[1].trim();
        }

        // Track API usage with actual model and provider used
        const actualModel = response.model || modelName;
        const tokenUsage = response.usage || { inputTokens: 0, outputTokens: 0 };
        
        await trackApiUsage({
            userId: userId || null,
            isGuest: !userId,
            endpoint: 'format-interview',
            model: actualModel,
            botId: 'g-interviewer',
            inputTokens: tokenUsage.inputTokens,
            outputTokens: tokenUsage.outputTokens,
            durationMs,
            success: true,
            metadata: { provider: response.provider },
        });

        res.json({ markdown });
    } catch (error) {
        console.error('AI API error in /session/format-interview:', error);
        
        const durationMs = Date.now() - startTime;
        
        // Track failed API call
        await trackApiUsage({
            userId: userId || null,
            isGuest: !userId,
            endpoint: 'format-interview',
            model: modelName,
            botId: 'g-interviewer',
            inputTokens: 0,
            outputTokens: 0,
            durationMs,
            success: false,
            errorMessage: error.message,
        });
        
        res.status(500).json({ error: 'Failed to format interview.' });
    }
});

// GET /api/gemini/cache/stats - Admin endpoint for cache statistics
router.get('/cache/stats', optionalAuthMiddleware, async (req, res) => {
    const userId = req.userId;
    
    // Only allow admins to view cache stats
    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    const stats = getCacheStats();
    res.json(stats);
});

// POST /api/gemini/test/simulate-coachee - Generate realistic coachee responses for testing
// This endpoint is specifically designed for the TestRunner to simulate user responses
router.post('/test/simulate-coachee', optionalAuthMiddleware, async (req, res) => {
    const userId = req.userId;
    
    // Only allow admins to use this endpoint
    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const { 
        lastBotMessage, 
        lastUserMessage, 
        scenarioDescription, 
        personalityContext,
        lang = 'de'
    } = req.body;

    if (!lastBotMessage) {
        return res.status(400).json({ error: 'lastBotMessage is required' });
    }

    const startTime = Date.now();

    try {
        // Build system prompt for coachee simulation
        const systemPrompt = lang === 'de' 
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
7. Antworte so, wie ein echter Mensch mit diesem Problem antworten würde`
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
7. Respond like a real person with this problem would respond`;

        const userPrompt = lang === 'de'
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

module.exports = router;