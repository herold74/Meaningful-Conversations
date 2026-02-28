const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth.js');
const prisma = require('../../prismaClient.js');
const { botRecommendationPrompts } = require('../../services/geminiPrompts.js');
const { trackApiUsage } = require('../../services/apiUsageTracker.js');
const aiProviderService = require('../../services/aiProviderService.js');
const { botRecommendationLimiter } = require('../../middleware/rateLimiter.js');

// POST /api/gemini/bot-recommendation
// Returns a primary and secondary bot recommendation for a given topic
// Requires authentication (registered users and above)
router.post('/bot-recommendation', authMiddleware, botRecommendationLimiter, async (req, res) => {
    const startTime = Date.now();
    const userId = req.userId;
    const { topic, language = 'de' } = req.body;

    try {
        if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
            return res.status(400).json({ error: 'topic is required.' });
        }

        if (topic.length > 2000) {
            return res.status(400).json({ error: 'Topic exceeds maximum length of 2000 characters.' });
        }

        const promptFn = botRecommendationPrompts[language]?.prompt || botRecommendationPrompts.de.prompt;
        const prompt = promptFn({ topic: topic.trim() });

        // Respect user's AI region preference (GDPR)
        let userRegionPreference = 'optimal';
        if (userId) {
            const recUser = await prisma.user.findUnique({ where: { id: userId }, select: { aiRegionPreference: true } });
            userRegionPreference = recUser?.aiRegionPreference || 'optimal';
        }

        const modelName = 'gemini-2.5-flash';
        const result = await aiProviderService.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: botRecommendationPrompts.schema,
                temperature: 0.3,
            },
            context: 'bot-recommendation',
            userRegionPreference,
            language,
        });

        const durationMs = Date.now() - startTime;
        const tokenUsage = result.usage || {};

        let recommendation;
        try {
            let cleanedText = (result.text || '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            try {
                recommendation = JSON.parse(cleanedText);
            } catch (firstParseErr) {
                cleanedText = cleanedText
                    .replace(/""(\w+)":\s*:/g, '"$1":')
                    .replace(/""(\w+)":/g, '"$1":')
                    .replace(/"(\w+)"::/g, '"$1":')
                    .replace(/:\s*\\"/g, ': "')
                    .replace(/\\",/g, '",')
                    .replace(/\\"(\s*[}\]])/g, '"$1')
                    .replace(/,(\s*[}\]])/g, '$1');
                recommendation = JSON.parse(cleanedText);
                console.log('✓ Bot recommendation JSON sanitization successful');
            }
        } catch (parseErr) {
            console.error('Failed to parse bot recommendation response:', parseErr);
            return res.status(500).json({ error: 'Failed to parse recommendation response.' });
        }

        await trackApiUsage({
            userId,
            endpoint: 'bot-recommendation',
            model: modelName,
            botId: null,
            inputTokens: tokenUsage.inputTokens || 0,
            outputTokens: tokenUsage.outputTokens || 0,
            durationMs,
            success: true,
        });

        res.json({ primary: recommendation.primary, secondary: recommendation.secondary, durationMs });

    } catch (error) {
        console.error('Bot recommendation error:', error);
        const durationMs = Date.now() - startTime;

        await trackApiUsage({
            userId,
            endpoint: 'bot-recommendation',
            model: 'gemini-2.5-flash',
            botId: null,
            inputTokens: 0,
            outputTokens: 0,
            durationMs,
            success: false,
            errorMessage: error.message,
        });

        res.status(500).json({ error: 'Bot recommendation failed. Please try again.' });
    }
});

module.exports = router;
