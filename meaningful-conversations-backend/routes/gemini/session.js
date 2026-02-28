const express = require('express');
const router = express.Router();
const optionalAuthMiddleware = require('../../middleware/optionalAuth.js');
const prisma = require('../../prismaClient.js');
const { analysisPrompts, interviewFormattingPrompts, getInterviewTemplate } = require('../../services/geminiPrompts.js');
const { trackApiUsage } = require('../../services/apiUsageTracker.js');
const aiProviderService = require('../../services/aiProviderService.js');

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
    const { history, context, language } = req.body;

    // Detect the language of the context file. Default to 'en'.
    const docLang = (context && context.match(/^#\s*(Mein\s)?Lebenskontext/im)) ? 'de' : 'en';

    const analysisPromptConfig = language === 'de' ? analysisPrompts.de : analysisPrompts.en;
    const conversation = history.map(msg => `${msg.role === 'user' ? 'User' : 'Coach'}: ${msg.text}`).join('\n\n');

    // Get current date in ISO format for deadline generation
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const fullPrompt = analysisPromptConfig.prompt({ conversation, context, docLang, currentDate });
    const startTime = Date.now();
    const modelName = 'gemini-2.5-pro';
    const userId = req.userId;

    // Respect user's AI region preference (GDPR)
    let userRegionPreference = 'optimal';
    if (userId) {
        const analysisUser = await prisma.user.findUnique({ where: { id: userId }, select: { aiRegionPreference: true } });
        userRegionPreference = analysisUser?.aiRegionPreference || 'optimal';
    }

    try {
        const response = await aiProviderService.generateContent({
            model: modelName,
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisPrompts.schema,
                temperature: 0.2,
            },
            context: 'analysis',
            userRegionPreference,
            language: language || 'de',
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
                    // Fix ""key":: "value" → "key": "value"
                    .replace(/""(\w+)":\s*:/g, '"$1":')
                    // Fix ""key": "value" → "key": "value"
                    .replace(/""(\w+)":/g, '"$1":')
                    // Fix "key":: "value" → "key": "value"
                    .replace(/"(\w+)"::/g, '"$1":')
                    // Fix ": \" → ": "
                    .replace(/:\s*\\"/g, ': "')
                    // Fix \", → ",
                    .replace(/\\",/g, '",')
                    // Fix \" before } or ] → "
                    .replace(/\\"(\s*[}\]])/g, '"$1')
                    // Fix \" before newline → "
                    .replace(/\\"\s*\n/g, '"\n')
                    // Fix trailing commas before } or ]
                    .replace(/,(\s*[}\]])/g, '$1');

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

        // Strip solutionBlockages for users without Client or Admin access (PEP is client/admin/developer feature)
        if (deduplicatedResponse.solutionBlockages) {
            let hasPepAccess = false;
            if (userId) {
                const analysisUser = await prisma.user.findUnique({ where: { id: userId } });
                hasPepAccess = analysisUser?.isClient === true || analysisUser?.isAdmin === true || analysisUser?.isDeveloper === true;
            }
            if (!hasPepAccess) {
                deduplicatedResponse.solutionBlockages = [];
            }
        }

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
    const { history, language } = req.body;

    const formattingPromptConfig = language === 'de' ? interviewFormattingPrompts.de : interviewFormattingPrompts.en;
    const conversation = history.map(msg => `${msg.role === 'user' ? 'User' : 'Guide'}: ${msg.text}`).join('\n\n');
    const template = getInterviewTemplate(language);

    const fullPrompt = formattingPromptConfig.prompt({ conversation, template });
    const startTime = Date.now();
    const modelName = 'gemini-2.5-pro';
    const userId = req.userId;

    // Respect user's AI region preference (GDPR)
    let userRegionPreference = 'optimal';
    if (userId) {
        const fmtUser = await prisma.user.findUnique({ where: { id: userId }, select: { aiRegionPreference: true } });
        userRegionPreference = fmtUser?.aiRegionPreference || 'optimal';
    }

    try {
        const response = await aiProviderService.generateContent({
            model: modelName,
            contents: fullPrompt,
            context: 'analysis',
            userRegionPreference,
            language: language || 'de',
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
            botId: 'gloria-life-context',
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
            botId: 'gloria-life-context',
            inputTokens: 0,
            outputTokens: 0,
            durationMs,
            success: false,
            errorMessage: error.message,
        });

        res.status(500).json({ error: 'Failed to format interview.' });
    }
});

module.exports = router;
