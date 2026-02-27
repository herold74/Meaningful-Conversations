const express = require('express');
const router = express.Router();
const optionalAuthMiddleware = require('../../middleware/optionalAuth.js');
const prisma = require('../../prismaClient.js');
const aiProviderService = require('../../services/aiProviderService.js');

// Timeout helper (local to translate - different default than shared)
const withTimeout = (promise, timeoutMs = 25000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Translation timeout - text might be too long')), timeoutMs)
        )
    ]);
};

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
        if (!user || (!user.isAdmin && !user.isDeveloper)) {
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
                message: 'The text is too long. Please try with shorter content.'
            });
        }
        return res.status(500).json({ error: 'Translation failed' });
    }
});

module.exports = router;
