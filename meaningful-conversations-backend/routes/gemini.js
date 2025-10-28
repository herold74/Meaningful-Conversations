const express = require('express');
const router = express.Router();
const optionalAuthMiddleware = require('../middleware/optionalAuth.js');
const prisma = require('../prismaClient.js');
const { BOTS } = require('../constants.js');
const { analysisPrompts, interviewFormattingPrompts, getInterviewTemplate } = require('../services/geminiPrompts.js');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// POST /api/gemini/chat/send-message
router.post('/chat/send-message', optionalAuthMiddleware, async (req, res) => {
    const { botId, context, history, lang, isNewSession } = req.body;
    const userId = req.userId; // This will be undefined for guests

    const bot = BOTS.find(b => b.id === botId);
    if (!bot) {
        return res.status(404).json({ error: 'Bot not found' });
    }

    // Server-side access control
    let hasAccess = false;
    if (bot.accessTier === 'guest') {
        hasAccess = true;
    } else if (userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
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
    }

    let finalSystemInstruction = systemInstruction;
    // For all bots EXCEPT the interviewer, add the context.
    // The interviewer's purpose is to CREATE the context, so it doesn't need to read one.
    if (bot.id !== 'g-interviewer') {
        finalSystemInstruction = `${systemInstruction}\n\n## User Context\nThe user has provided the following context for this session. You MUST use this to inform your responses.\n\n<context>\n${context || 'The user has not provided a life context.'}\n</context>`;
    }

    const modelHistory = history.map((msg) => ({
        role: msg.role === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.text }],
    }));

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            // For the initial message, we send an empty string to prompt the model's greeting.
            // For subsequent messages, we send the entire chat history.
            contents: isInitialMessage ? "" : modelHistory,
            config: {
                systemInstruction: finalSystemInstruction,
                temperature: 0.7,
            },
        });
        
        const text = response.text;
        res.json({ text });
    } catch (error) {
        console.error('Gemini API error in /chat/send-message:', error);
        res.status(500).json({ error: 'Failed to get response from AI model.' });
    }
});

// POST /api/gemini/session/analyze
router.post('/session/analyze', optionalAuthMiddleware, async (req, res) => {
    const { history, context, lang } = req.body;
    
    // Detect the language of the context file. Default to 'en'.
    const docLang = (context && context.match(/^#\s*Lebenskontext/m)) ? 'de' : 'en';

    const analysisPromptConfig = lang === 'de' ? analysisPrompts.de : analysisPrompts.en;
    const conversation = history.map(msg => `${msg.role === 'user' ? 'User' : 'Coach'}: ${msg.text}`).join('\n\n');

    const fullPrompt = analysisPromptConfig.prompt({ conversation, context, docLang });
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro', // Use a more powerful model for structured analysis
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisPrompts.schema,
                temperature: 0.2, // Lower temperature for more deterministic, structured output
            },
        });

        const jsonResponse = JSON.parse(response.text);
        res.json(jsonResponse);
    } catch (error) {
        console.error('Gemini API error in /session/analyze:', error);
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

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: fullPrompt,
        });
        
        let markdown = response.text.trim();

        // Clean up potential markdown code block wrappers from the AI's response.
        // This regex handles ```markdown ... ``` or just ``` ... ```
        const codeBlockRegex = /^```(?:markdown)?\s*\n([\s\S]+?)\n```$/;
        const match = markdown.match(codeBlockRegex);
        if (match && match[1]) {
            markdown = match[1].trim();
        }

        res.json({ markdown });
    } catch (error) {
        console.error('Gemini API error in /session/format-interview:', error);
        res.status(500).json({ error: 'Failed to format interview.' });
    }
});


module.exports = router;