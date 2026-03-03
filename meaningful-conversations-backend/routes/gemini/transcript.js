const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth.js');
const prisma = require('../../prismaClient.js');
const { transcriptEvaluationPrompts } = require('../../services/geminiPrompts.js');
const { trackApiUsage } = require('../../services/apiUsageTracker.js');
const aiProviderService = require('../../services/aiProviderService.js');
const { audioTranscribeLimiter } = require('../../middleware/rateLimiter.js');
const { audioUpload, withTimeout } = require('./shared.js');

// POST /api/gemini/transcript/evaluate
// Requires authentication and Premium+ access
router.post('/transcript/evaluate', authMiddleware, async (req, res) => {
    const startTime = Date.now();
    const userId = req.userId;
    const { preAnswers, transcript, language = 'de', decryptedPersonalityProfile } = req.body;

    try {
        // Validate required fields
        if (!preAnswers || !transcript) {
            return res.status(400).json({ error: 'preAnswers and transcript are required.' });
        }

        if (!preAnswers.situationName || !preAnswers.goal || !preAnswers.personalTarget || !preAnswers.assumptions || !preAnswers.satisfaction) {
            return res.status(400).json({ error: 'Pre-answers must include situationName, goal, personalTarget, assumptions, and satisfaction.' });
        }

        // Transcript length limit (50,000 chars)
        if (transcript.length > 50000) {
            return res.status(400).json({ error: 'Transcript exceeds maximum length of 50,000 characters.' });
        }

        // Access check: Premium+ only
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isPremium: true, isClient: true, isAdmin: true, isDeveloper: true, lifeContext: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        if (!user.isPremium && !user.isClient && !user.isAdmin && !user.isDeveloper) {
            return res.status(403).json({ error: 'Transcript evaluation requires Premium access or higher.' });
        }

        let personalityProfileSummary = null;
        if (decryptedPersonalityProfile) {
            const parts = [];
            if (decryptedPersonalityProfile.riemann?.selbst) {
                const s = decryptedPersonalityProfile.riemann.selbst;
                parts.push(`Riemann-Thomann (Selbst): Nähe=${s.naehe}, Distanz=${s.distanz}, Dauer=${s.dauer}, Wechsel=${s.wechsel}`);
            }
            if (decryptedPersonalityProfile.big5) {
                const b = decryptedPersonalityProfile.big5;
                parts.push(`Big5/OCEAN: O=${b.openness}, C=${b.conscientiousness}, E=${b.extraversion}, A=${b.agreeableness}, N=${b.neuroticism}`);
            }
            if (decryptedPersonalityProfile.spiralDynamics?.levels) {
                const levels = decryptedPersonalityProfile.spiralDynamics.levels;
                const top = Object.entries(levels).sort((a, b) => b[1] - a[1]).slice(0, 3);
                parts.push(`Spiral Dynamics (top 3): ${top.map(([k, v]) => `${k}=${v}`).join(', ')}`);
            }
            if (decryptedPersonalityProfile.narrativeProfile) {
                const np = decryptedPersonalityProfile.narrativeProfile;
                if (np.blindspots?.length > 0) {
                    parts.push(`Known Blindspots: ${np.blindspots.map(b => b.name).join(', ')}`);
                }
                if (np.superpowers?.length > 0) {
                    parts.push(`Superpowers: ${np.superpowers.map(s => s.name).join(', ')}`);
                }
            }
            personalityProfileSummary = parts.join('\n');
        }

        // Determine document language from context
        const context = user.lifeContext || null;
        const docLang = context && context.startsWith('# Mein Lebenskontext') ? 'de' : 'en';
        const currentDate = new Date().toISOString().split('T')[0];

        // Build evaluation prompt
        const promptFn = transcriptEvaluationPrompts[language]?.prompt || transcriptEvaluationPrompts.en.prompt;
        const evaluationPrompt = promptFn({
            preAnswers,
            transcript,
            personalityProfile: personalityProfileSummary,
            context,
            docLang,
            currentDate
        });

        // AI call — respect user's AI region preference (GDPR)
        const userRegionPreference = user.aiRegionPreference || 'optimal';
        const modelName = 'gemini-2.5-pro';
        const result = await withTimeout(
            aiProviderService.generateContent({
                model: modelName,
                contents: evaluationPrompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: transcriptEvaluationPrompts.schema,
                    temperature: 0.2,
                },
                context: 'transcript-evaluation',
                userRegionPreference,
                language: language || 'de',
            }),
            120000,
            'Transcript evaluation'
        );

        const durationMs = Date.now() - startTime;
        const generatedText = result.text || '';
        const tokenUsage = result.usage || {};

        // Parse response
        let evaluationResult;
        try {
            let cleanedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            try {
                evaluationResult = JSON.parse(cleanedText);
            } catch (firstParseErr) {
                cleanedText = cleanedText
                    .replace(/""(\w+)":\s*:/g, '"$1":')
                    .replace(/""(\w+)":/g, '"$1":')
                    .replace(/"(\w+)"::/g, '"$1":')
                    .replace(/:\s*\\"/g, ': "')
                    .replace(/\\",/g, '",')
                    .replace(/\\"(\s*[}\]])/g, '"$1')
                    .replace(/,(\s*[}\]])/g, '$1');
                evaluationResult = JSON.parse(cleanedText);
                console.log('✓ Transcript evaluation JSON sanitization successful');
            }
        } catch (parseErr) {
            console.error('Failed to parse transcript evaluation response:', parseErr);
            return res.status(500).json({ error: 'Failed to parse evaluation response.' });
        }

        // Persist evaluation (transcript is NOT stored)
        const savedEvaluation = await prisma.transcriptEvaluation.create({
            data: {
                userId,
                preAnswers: JSON.stringify(preAnswers),
                evaluationData: JSON.stringify(evaluationResult),
                language,
            }
        });

        // Track usage
        await trackApiUsage({
            userId,
            endpoint: 'transcript-evaluate',
            model: modelName,
            botId: null,
            inputTokens: tokenUsage.inputTokens || 0,
            outputTokens: tokenUsage.outputTokens || 0,
            durationMs,
            success: true,
        });

        res.json({
            id: savedEvaluation.id,
            evaluation: evaluationResult,
            durationMs,
        });

    } catch (error) {
        console.error('Transcript evaluation error:', error);
        const durationMs = Date.now() - startTime;

        await trackApiUsage({
            userId,
            endpoint: 'transcript-evaluate',
            model: 'gemini-2.5-pro',
            botId: null,
            inputTokens: 0,
            outputTokens: 0,
            durationMs,
            success: false,
            errorMessage: error.message,
        });

        res.status(500).json({ error: 'Transcript evaluation failed. Please try again.' });
    }
});

// GET /api/gemini/transcript/evaluations
// Returns list of past evaluations for the authenticated user
router.get('/transcript/evaluations', authMiddleware, async (req, res) => {
    const userId = req.userId;

    try {
        const evaluations = await prisma.transcriptEvaluation.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                preAnswers: true,
                evaluationData: true,
                language: true,
                createdAt: true,
                userRating: true,
                userFeedback: true,
                contactOptIn: true,
            }
        });

        // Parse JSON fields and return summary for list view
        const result = evaluations.map(e => {
            let preAnswers, evaluationData;
            try {
                preAnswers = JSON.parse(e.preAnswers);
                evaluationData = JSON.parse(e.evaluationData);
            } catch {
                preAnswers = {};
                evaluationData = {};
            }
            return {
                id: e.id,
                createdAt: e.createdAt,
                language: e.language,
                goal: preAnswers.goal || '',
                summary: evaluationData.summary || '',
                overallScore: evaluationData.overallScore || 0,
                // Full data for detail view
                preAnswers,
                evaluationData,
                // Rating data
                userRating: e.userRating,
                userFeedback: e.userFeedback,
                contactOptIn: e.contactOptIn,
            };
        });

        res.json(result);
    } catch (error) {
        console.error('Error fetching transcript evaluations:', error);
        res.status(500).json({ error: 'Failed to fetch evaluations.' });
    }
});

// DELETE /api/gemini/transcript/evaluations/:id - Delete a transcript evaluation
router.delete('/transcript/evaluations/:id', authMiddleware, async (req, res) => {
    const userId = req.userId;
    const { id } = req.params;

    try {
        // Verify ownership before deleting
        const evaluation = await prisma.transcriptEvaluation.findUnique({
            where: { id },
            select: { userId: true }
        });

        if (!evaluation) {
            return res.status(404).json({ error: 'Evaluation not found.' });
        }

        if (evaluation.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized to delete this evaluation.' });
        }

        // Delete the evaluation
        await prisma.transcriptEvaluation.delete({
            where: { id }
        });

        res.json({ success: true, message: 'Evaluation deleted successfully.' });
    } catch (error) {
        console.error('Error deleting transcript evaluation:', error);
        res.status(500).json({ error: 'Failed to delete evaluation.' });
    }
});

// POST /api/gemini/transcript/evaluations/:id/rate - Rate a transcript evaluation
router.post('/transcript/evaluations/:id/rate', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { rating, feedback, contactOptIn } = req.body;
    const userId = req.userId;

    try {
        // Validate rating (0-10 NPS scale)
        if (typeof rating !== 'number' || rating < 0 || rating > 10) {
            return res.status(400).json({ error: 'Rating must be a number between 0 and 10.' });
        }

        // Verify ownership
        const evaluation = await prisma.transcriptEvaluation.findUnique({
            where: { id },
            select: { userId: true }
        });

        if (!evaluation) {
            return res.status(404).json({ error: 'Evaluation not found.' });
        }

        if (evaluation.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized to rate this evaluation.' });
        }

        // Update rating
        await prisma.transcriptEvaluation.update({
            where: { id },
            data: {
                userRating: rating,
                userFeedback: feedback || null,
                contactOptIn: !!contactOptIn,
                ratedAt: new Date()
            }
        });

        res.json({ success: true, message: 'Rating submitted successfully.' });
    } catch (error) {
        console.error('Error rating transcript evaluation:', error);
        res.status(500).json({ error: 'Failed to submit rating.' });
    }
});

// POST /api/gemini/transcript/smooth
// Smooths a raw transcript: fixes grammar, removes filler words, preserves meaning.
// Optionally returns a summary. Respects user's AI region preference (GDPR).
// Requires authentication and Client+ access
router.post('/transcript/smooth', authMiddleware, async (req, res) => {
    const startTime = Date.now();
    const userId = req.userId;

    try {
        const { transcript, language = 'de' } = req.body;

        if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
            return res.status(400).json({ error: 'transcript is required.' });
        }

        if (transcript.length > 50000) {
            return res.status(400).json({ error: 'Transcript exceeds maximum length of 50,000 characters.' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isClient: true, isAdmin: true, isDeveloper: true, aiRegionPreference: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        if (!user.isClient && !user.isAdmin && !user.isDeveloper) {
            return res.status(403).json({ error: 'Transcript smoothing requires Client access or higher.' });
        }

        const prompt = language === 'de'
            ? `Du bist ein erfahrener Redakteur. Dir wird ein Gesprächstranskript übergeben.

Erstelle ZWEI Abschnitte, getrennt durch die exakte Zeile "---TRENNER---":

**ABSCHNITT 1 — Zusammenfassung:**
Erstelle eine prägnante Zusammenfassung des Gesprächs (5-10 Sätze). Erfasse die wichtigsten Themen, Erkenntnisse und Schlussfolgerungen.

**ABSCHNITT 2 — Geglättetes Transkript:**
Erstelle eine bereinigte, lesbare Version des Gesprächs:
- Korrigiere Grammatik, Rechtschreibung und Zeichensetzung
- Entferne Füllwörter (ähm, also, halt, quasi, sozusagen) und Wiederholungen
- Bewahre den Inhalt, die Bedeutung und den Ton des Gesagten exakt
- Behalte die Sprecher-Labels bei (z.B. [Sprecher 1]:, [Person A]:)
- Füge Absätze bei thematischen Wechseln ein
- Füge NICHTS hinzu, was nicht gesagt wurde

Das Transkript:

${transcript}`
            : `You are an experienced editor. You are given a conversation transcript.

Produce TWO sections, separated by the exact line "---SEPARATOR---":

**SECTION 1 — Summary:**
Write a concise summary of the conversation (5-10 sentences). Capture the key topics, insights, and conclusions.

**SECTION 2 — Smoothed Transcript:**
Produce a clean, readable version of the conversation:
- Fix grammar, spelling, and punctuation
- Remove filler words (um, like, you know, basically, sort of) and repetitions
- Preserve the content, meaning, and tone of what was said exactly
- Keep speaker labels intact (e.g. [Speaker 1]:, [Person A]:)
- Add paragraph breaks at topical shifts
- Do NOT add anything that was not said

The transcript:

${transcript}`;

        const userRegionPreference = user.aiRegionPreference || 'optimal';
        const modelName = 'gemini-2.5-pro';

        const result = await withTimeout(
            aiProviderService.generateContent({
                model: modelName,
                contents: prompt,
                config: { temperature: 0.2 },
                context: 'analysis',
                userRegionPreference,
                language: language || 'de',
            }),
            120000,
            'Transcript smoothing'
        );

        const durationMs = Date.now() - startTime;
        const text = result.text || '';
        const tokenUsage = result.usage || {};

        const separator = language === 'de' ? '---TRENNER---' : '---SEPARATOR---';
        const parts = text.split(separator);
        const summary = (parts[0] || '').trim();
        const smoothedTranscript = (parts[1] || '').trim();

        await trackApiUsage({
            userId,
            endpoint: 'transcript-smooth',
            model: result.model || modelName,
            botId: null,
            inputTokens: tokenUsage.inputTokens || 0,
            outputTokens: tokenUsage.outputTokens || 0,
            durationMs,
            success: true,
        });

        res.json({ summary, smoothedTranscript });

    } catch (error) {
        console.error('Transcript smoothing error:', error);
        const durationMs = Date.now() - startTime;

        await trackApiUsage({
            userId,
            endpoint: 'transcript-smooth',
            model: 'gemini-2.5-pro',
            botId: null,
            inputTokens: 0,
            outputTokens: 0,
            durationMs,
            success: false,
            errorMessage: error.message,
        });

        res.status(500).json({ error: 'Transcript smoothing failed. Please try again.' });
    }
});

// POST /api/gemini/transcript/transcribe-audio
// Transcribes audio with speaker diarization via Gemini (Google-only, no Mistral fallback)
// Requires authentication and Client+ access
router.post('/transcript/transcribe-audio', authMiddleware, audioTranscribeLimiter, audioUpload.single('audio'), async (req, res) => {
    const startTime = Date.now();
    const userId = req.userId;

    try {
        // Validate file presence
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided.' });
        }

        const { language = 'de', speakerHint } = req.body;

        // Reject extremely small files — they contain no meaningful audio and
        // cause Gemini to hallucinate entire transcripts from nothing.
        const MIN_AUDIO_BYTES = 10000; // ~10 KB
        if (req.file.size < MIN_AUDIO_BYTES) {
            return res.status(400).json({
                error: language === 'de'
                    ? 'Die Audiodatei ist zu kurz oder leer. Bitte nimm mindestens einige Sekunden Audio auf.'
                    : 'The audio file is too short or empty. Please record at least a few seconds of audio.'
            });
        }

        // Access check: Client+ only (Client, Admin, Developer)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isClient: true, isAdmin: true, isDeveloper: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        if (!user.isClient && !user.isAdmin && !user.isDeveloper) {
            return res.status(403).json({ error: 'Audio transcription requires Client access or higher.' });
        }

        // Build diarization prompt
        const speakerHintNum = speakerHint ? parseInt(speakerHint, 10) : null;
        const speakerInstruction = speakerHintNum && speakerHintNum >= 2 && speakerHintNum <= 4
            ? (language === 'de'
                ? `Es sind genau ${speakerHintNum} Sprecher im Gespräch.`
                : `There are exactly ${speakerHintNum} speakers in this conversation.`)
            : '';

        const diarizationPrompt = language === 'de'
            ? `Transkribiere die folgende Audiodatei vollständig und wortgetreu.

SPRECHERIDENTIFIKATION:
- Identifiziere die verschiedenen Sprecher anhand ihrer Stimmen.
- Verwende die Labels [Sprecher 1], [Sprecher 2], [Sprecher 3] usw.
${speakerInstruction}

FORMAT:
- Beginne mit einer kurzen Sprecherzuordnung im Format:
  ---SPRECHER---
  Sprecher 1: [kurze Stimmbeschreibung, z.B. "männliche Stimme, tiefer Tonfall"]
  Sprecher 2: [kurze Stimmbeschreibung]
  ---SPRECHER---
- Danach folgt das vollständige Transkript.
- Jeder Sprecherwechsel beginnt in einer neuen Zeile mit dem Sprecher-Label.
- Format: [Sprecher N]: Text des Sprechers
- Füge Absätze bei thematischen Wechseln ein.
- Behalte Füllwörter und natürliche Sprachmuster bei, aber korrigiere offensichtliche Grammatikfehler leicht.

WICHTIG: Gib NUR die Sprecherzuordnung und das Transkript aus, keine zusätzlichen Kommentare oder Zusammenfassungen.`
            : `Transcribe the following audio file completely and verbatim.

SPEAKER IDENTIFICATION:
- Identify the different speakers based on their voices.
- Use labels [Speaker 1], [Speaker 2], [Speaker 3] etc.
${speakerInstruction}

FORMAT:
- Start with a brief speaker identification section in this format:
  ---SPEAKERS---
  Speaker 1: [brief voice description, e.g. "male voice, deep tone"]
  Speaker 2: [brief voice description]
  ---SPEAKERS---
- Then provide the complete transcript.
- Each speaker change starts on a new line with the speaker label.
- Format: [Speaker N]: Speaker's text
- Add paragraph breaks at topical shifts.
- Keep filler words and natural speech patterns, but lightly correct obvious grammar errors.

IMPORTANT: Output ONLY the speaker identification and transcript, no additional comments or summaries.`;

        // Send to Gemini with audio inline data (Google-only, no Mistral fallback)
        const client = await aiProviderService.getGoogleClient();
        const audioBase64 = req.file.buffer.toString('base64');

        const response = await withTimeout(
            client.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: [{
                    role: 'user',
                    parts: [
                        { inlineData: { mimeType: req.file.mimetype, data: audioBase64 } },
                        { text: diarizationPrompt }
                    ]
                }],
                config: { temperature: 0.1, maxOutputTokens: 65536 }
            }),
            120000,
            'Audio transcription'
        );

        const transcript = response.text || '';
        const tokenUsage = response.usageMetadata || {};

        // Hallucination guard: if the audio contributed very few tokens but Gemini
        // produced a long transcript, the output is almost certainly fabricated.
        // Typical audio encodes at ~25 tokens/second, so < 50 prompt tokens means
        // less than ~2 seconds of real audio — yet the prompt text itself accounts
        // for ~200-300 tokens. We flag when the output is suspiciously long relative
        // to the audio input.
        const promptTokens = tokenUsage.promptTokenCount || 0;
        const outputTokens = tokenUsage.candidatesTokenCount || 0;
        const PROMPT_TEXT_OVERHEAD = 350; // approximate tokens used by the diarization prompt itself
        const audioTokens = Math.max(0, promptTokens - PROMPT_TEXT_OVERHEAD);

        if (audioTokens < 50 && outputTokens > 100) {
            console.warn(`[Audio Transcription] Hallucination suspected: audioTokens=${audioTokens}, outputTokens=${outputTokens}`);
            return res.status(400).json({
                error: language === 'de'
                    ? 'Die Audiodatei enthält keine erkennbare Sprache. Bitte stelle sicher, dass die Aufnahme Gesprächsinhalte enthält.'
                    : 'The audio file does not contain recognizable speech. Please make sure the recording contains conversation content.'
            });
        }

        // Count speakers from the transcript
        const speakerPattern = language === 'de' ? /\[Sprecher (\d+)\]/g : /\[Speaker (\d+)\]/g;
        const speakerNumbers = new Set();
        let match;
        while ((match = speakerPattern.exec(transcript)) !== null) {
            speakerNumbers.add(parseInt(match[1], 10));
        }
        const speakerCount = speakerNumbers.size;

        const durationMs = Date.now() - startTime;

        await trackApiUsage({
            userId,
            endpoint: '/api/gemini/transcript/transcribe-audio',
            botId: 'audio-transcription',
            inputTokens: promptTokens,
            outputTokens: outputTokens,
            durationMs,
            success: true,
        });

        res.json({ transcript, speakerCount });

    } catch (error) {
        console.error('Audio transcription error:', error);
        const durationMs = Date.now() - startTime;

        await trackApiUsage({
            userId,
            endpoint: '/api/gemini/transcript/transcribe-audio',
            botId: 'audio-transcription',
            inputTokens: 0,
            outputTokens: 0,
            durationMs,
            success: false,
            errorMessage: error.message,
        });

        if (error.message?.includes('Unsupported audio format')) {
            return res.status(400).json({ error: 'Unsupported audio format. Please use a supported format.' });
        }

        res.status(500).json({ error: 'Failed to transcribe audio.' });
    }
});

module.exports = router;
