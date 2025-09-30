const express = require('express');
const { GoogleGenAI, Type } = require('@google/genai');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Note: In a production app, you might apply middleware selectively if some
// features are available to guests. For now, all Gemini interactions require auth.
router.use(authMiddleware);

// POST /api/gemini/chat/send-message
router.post('/chat/send-message', async (req, res) => {
    const { bot, context, history, lang, message } = req.body;

    if (!bot || !context || !history || !lang || !message) {
        return res.status(400).json({ error: 'Missing required fields for chat message.' });
    }

    try {
        const systemPrompt = lang === 'de' ? bot.systemPrompt_de : bot.systemPrompt;
        
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: `${systemPrompt}\n\n## User's Life Context:\n${context}`,
            },
            history: history.map(msg => ({
                role: msg.role === 'bot' ? 'model' : 'user',
                parts: [{ text: msg.text }],
            })),
        });

        // NOTE: For simplicity, this implementation uses the non-streaming sendMessage.
        // The frontend will need to be adapted to handle a single response object
        // instead of a stream when it's switched over to use this backend.
        const result = await chat.sendMessage(message);
        
        res.status(200).json({ text: result.text });

    } catch (error) {
        console.error("Error in Gemini chat proxy:", error);
        res.status(500).json({ error: 'Failed to get response from AI model.' });
    }
});


// POST /api/gemini/session/analyze
router.post('/session/analyze', async (req, res) => {
    const { history, context, lang } = req.body;
    
    if (!history || !context || !lang) {
        return res.status(400).json({ error: 'Missing required fields for session analysis.' });
    }

    // Replicate the analysis logic from the frontend's geminiService.
    // This logic can now live securely on the backend.
    const relevantHistory = history.slice(1);
    const conversation = relevantHistory.map(msg => `${msg.role}: ${msg.text}`).join('\n');
    
    // Using require here to avoid circular dependencies if these were in a separate file
    const { analysisPrompts, contextResponseSchema, blockageAnalysisPrompts, blockageResponseSchema } = require('../services/geminiPrompts');
    
    const contextAnalysisPrompt = `${analysisPrompts[lang]}\n\n**Life Context:**\n${context}\n\n**Conversation:**\n${conversation}`;
    const blockageAnalysisPrompt = `${blockageAnalysisPrompts[lang]}\n\n**Conversation:**\n${conversation}`;

    try {
        const contextAnalysisPromise = ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contextAnalysisPrompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: contextResponseSchema,
            },
        });

        const blockageAnalysisPromise = ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: blockageAnalysisPrompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: blockageResponseSchema,
            },
        });
        
        const [contextResponse, blockageResponse] = await Promise.all([contextAnalysisPromise, blockageAnalysisPromise]);

        const contextJsonText = contextResponse.text.trim();
        const parsedContext = JSON.parse(contextJsonText);

        const blockageJsonText = blockageResponse.text.trim();
        const parsedBlockages = JSON.parse(blockageJsonText);
        
        // Combine and send the full analysis payload
        res.status(200).json({ ...parsedContext, solutionBlockages: parsedBlockages });

    } catch (error) {
        console.error("Error analyzing session on backend:", error);
        res.status(500).json({ error: "Failed to analyze session." });
    }
});

// A small helper module to keep prompts separate
module.exports = router;
