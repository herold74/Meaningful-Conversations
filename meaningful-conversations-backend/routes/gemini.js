const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const authMiddleware = require('../middleware/auth');
const { analysisPrompts, contextResponseSchema, blockageAnalysisPrompts, blockageResponseSchema } = require('../services/geminiPrompts');

const router = express.Router();
router.use(authMiddleware);

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// POST /api/gemini/chat/send-message
router.post('/chat/send-message', async (req, res) => {
    const { bot, context, history: historyForApi, lang } = req.body;

    if (!bot || !context || !historyForApi) {
        return res.status(400).json({ error: "Missing bot, context, or history." });
    }

    const botSystemPrompt = lang === 'de' ? bot.systemPrompt_de : bot.systemPrompt;

    try {
        const contents = [];
        
        // Prepend context to the first user message
        if (historyForApi.length > 0 && historyForApi[0].role === 'user') {
            const firstUserMessage = historyForApi.shift();
            contents.push({
                role: 'user',
                parts: [{ text: `My Life Context:\n---\n${context}\n---\n\nMy message:\n${firstUserMessage.text}` }]
            });
        }

        // Add the rest of the history
        historyForApi.forEach(msg => {
            contents.push({
                role: (msg.role === 'user' ? 'user' : 'model'),
                parts: [{ text: msg.text }]
            });
        });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            // FIX: systemInstruction must be inside a config object
            config: {
                systemInstruction: botSystemPrompt
            }
        });

        res.status(200).json({ text: response.text });

    } catch (error) {
        console.error("Error in send-message:", error);
        res.status(500).json({ error: "Failed to get response from AI." });
    }
});


// POST /api/gemini/session/analyze
router.post('/session/analyze', async (req, res) => {
    const { history, context, lang } = req.body;

    if (!history || !context) {
        return res.status(400).json({ error: "Missing history or context." });
    }

    const chatTranscript = history.map(h => `${h.role === 'user' ? 'Client' : 'Coach'}: ${h.text}`).join('\n');
    const existingHeadlines = (context.match(/^(#+\s.*|\*\*.+\*\*.*)/gm) || []).join('\n');

    try {
        // Parallelize the two analysis calls
        const [contextResult, blockageResult] = await Promise.all([
            ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `${analysisPrompts[lang]}\n\nExisting Headlines:\n${existingHeadlines}\n\nLife Context:\n${context}\n\nConversation Transcript:\n${chatTranscript}`,
                config: { responseMimeType: "application/json", responseSchema: contextResponseSchema },
            }),
            ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `${blockageAnalysisPrompts[lang]}\n\nConversation Transcript:\n${chatTranscript}`,
                config: { responseMimeType: "application/json", responseSchema: blockageResponseSchema },
            })
        ]);

        let parsedUpdates = { summary: '', updates: [], nextSteps: [] };
        if (contextResult && contextResult.text) {
             try {
                parsedUpdates = JSON.parse(contextResult.text);
            } catch (e) {
                console.error('Failed to parse context updates JSON:', e, 'Raw text:', contextResult.text);
                // Gracefully continue with empty updates
            }
        }
       
        let parsedBlockages = [];
        if (blockageResult && blockageResult.text) {
             try {
                parsedBlockages = JSON.parse(blockageResult.text);
            } catch (e) {
                console.error('Failed to parse blockage analysis JSON:', e, 'Raw text:', blockageResult.text);
                // Gracefully continue with empty blockages
            }
        }

        res.status(200).json({
            summary: parsedUpdates.summary,
            updates: parsedUpdates.updates,
            nextSteps: parsedUpdates.nextSteps,
            solutionBlockages: parsedBlockages
        });

    } catch (e) {
        console.error("Analysis error:", e);
        res.status(500).json({ error: "Failed to analyze session." });
    }
});

module.exports = router;
