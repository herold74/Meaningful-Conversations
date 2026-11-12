const express = require('express');
const router = express.Router();
const optionalAuthMiddleware = require('../../middleware/optionalAuth.js');
const { trackApiUsage } = require('../../services/apiUsageTracker.js');
const aiProviderService = require('../../services/aiProviderService.js');

const CONNECTION_PREP_MARKERS = [
    'gesprächsvorbereitung',
    'bewusst verbindung',
    'prepare for a conversation',
    'consciously build connection',
    'connection prep',
];

function detectConnectionPrep(history, explicitFlag) {
    if (explicitFlag === true) return true;
    const userText = history
        .filter((msg) => msg.role === 'user')
        .map((msg) => msg.text)
        .join(' ')
        .toLowerCase();
    return CONNECTION_PREP_MARKERS.some((marker) => userText.includes(marker));
}

function buildTranscriptPrompt({ conversation, language, userName, connectionPrep }) {
    const userLabel = userName || (language === 'de' ? 'Befragter' : 'Interviewee');
    const sectionCount = connectionPrep ? 'VIER' : 'DREI';
    const sectionCountEn = connectionPrep ? 'FOUR' : 'THREE';
    const separator = language === 'de' ? '---TRENNER---' : '---SEPARATOR---';

    const connectionSectionDe = connectionPrep
        ? `
**ABSCHNITT 4 — Verbindungspunkte:**
Extrahiere aus dem Interview die wichtigsten Verbindungspunkte, die der Befragte artikuliert hat (keine Ratschläge, keine neuen Ideen). Strukturiere als kurze Aufzählung mit bis zu fünf Punkten, z. B.:
- Gemeinsamer Boden
- Was dem anderen wichtig sein könnte
- Die eine Botschaft
- Was authentisch wirken würde
- Eine kleine Geste oder Frage zum Zuhören
Wenn ein Punkt nicht besprochen wurde, weglassen.`
        : '';

    const connectionSectionEn = connectionPrep
        ? `
**SECTION 4 — Connection Points:**
Extract the key connection points the interviewee articulated (no advice, no new ideas). Format as a short bullet list with up to five items, e.g.:
- Common ground
- What may matter to the other person
- The one message
- What would feel authentic
- A small gesture or question to show listening
Omit any point that was not discussed.`
        : '';

    if (language === 'de') {
        return `Du bist ein Redakteur. Dir wird ein Interview-Transkript zwischen einem Interviewer und ${userName ? userName : 'einem Befragten'} übergeben.

Das Gespräch besteht aus zwei Phasen: Zuerst einer kurzen **Auftragsklärung** (Thema, Dauer, Perspektive), dann dem eigentlichen **Interview**. Trenne diese Phasen in der Ausgabe.

Erstelle ${sectionCount} Abschnitte, getrennt durch die exakte Zeile "${separator}":

**ABSCHNITT 1 — Zusammenfassung:**
Erstelle eine prägnante Zusammenfassung des Interviews (5-10 Sätze). Erfasse die wichtigsten Themen, Erkenntnisse und Schlussfolgerungen des Gesprächs. Beziehe dich nur auf den inhaltlichen Teil des Interviews, nicht auf die Auftragsklärung.

**ABSCHNITT 2 — Interview Setup:**
Fasse die Auftragsklärung als kompakte Übersicht zusammen:
- Thema
- Vereinbarte Dauer
- Gewählte Perspektive/Rolle des Interviewers
- Ggf. besondere Wünsche
Formatiere dies als kurze, übersichtliche Auflistung (kein Dialog).

**ABSCHNITT 3 — Geglättetes Interview:**
Erstelle eine bereinigte, lesbare Version des eigentlichen Interviews (ohne die Auftragsklärung):
- Korrigiere Grammatik, Rechtschreibung und Zeichensetzung
- Entferne Füllwörter und Wiederholungen
- Bewahre den Inhalt, die Bedeutung und den Ton des Gesagten exakt
- Formatiere als klaren Dialog mit "Interviewer:" und "${userLabel}:" Kennzeichnungen
- Füge NICHTS hinzu, was nicht gesagt wurde
${connectionSectionDe}

Das Interview-Transkript:

${conversation}`;
    }

    return `You are an editor. You are given an interview transcript between an interviewer and ${userName ? userName : 'an interviewee'}.

The conversation consists of two phases: first a brief **setup** (topic, duration, perspective), then the actual **interview**. Separate these phases in your output.

Produce ${sectionCountEn} sections, separated by the exact line "${separator}":

**SECTION 1 — Summary:**
Write a concise summary of the interview (5-10 sentences). Capture the key topics, insights, and conclusions of the conversation. Focus only on the substantive interview content, not the setup.

**SECTION 2 — Interview Setup:**
Summarize the setup/clarification as a compact overview:
- Topic
- Agreed duration
- Chosen perspective/role of the interviewer
- Any special requests
Format this as a short, clear list (not dialogue).

**SECTION 3 — Smoothed Interview:**
Produce a clean, readable version of the actual interview (excluding the setup):
- Fix grammar, spelling, and punctuation
- Remove filler words and repetitions
- Preserve the content, meaning, and tone of what was said exactly
- Format as clear dialogue with "Interviewer:" and "${userLabel}:" labels
- Do NOT add anything that was not said
${connectionSectionEn}

The interview transcript:

${conversation}`;
}

// POST /api/gemini/interview/transcript — Generate summary + corrected transcript for Gloria Interview
router.post('/interview/transcript', optionalAuthMiddleware, async (req, res) => {
    const { history, language, userName, connectionPrep: connectionPrepFlag } = req.body;
    if (!history || !Array.isArray(history) || history.length === 0) {
        return res.status(400).json({ error: 'history is required and must be a non-empty array' });
    }

    const connectionPrep = detectConnectionPrep(history, connectionPrepFlag);
    const conversation = history.map(msg => `${msg.role === 'user' ? (userName || (language === 'de' ? 'Befragter' : 'Interviewee')) : 'Interviewer'}: ${msg.text}`).join('\n\n');
    const prompt = buildTranscriptPrompt({ conversation, language, userName, connectionPrep });

    const startTime = Date.now();
    const modelName = 'gemini-2.5-pro';
    const userId = req.userId;

    try {
        const response = await aiProviderService.generateContent({
            model: modelName,
            contents: prompt,
            context: 'analysis'
        });

        const durationMs = Date.now() - startTime;
        const text = response.text.trim();

        const separator = language === 'de' ? '---TRENNER---' : '---SEPARATOR---';
        const parts = text.split(separator);
        const summary = (parts[0] || '').trim();
        const setup = (parts[1] || '').trim();
        const transcript = (parts[2] || '').trim();
        const connectionPoints = connectionPrep ? (parts[3] || '').trim() : '';

        const actualModel = response.model || modelName;
        const tokenUsage = response.usage || { inputTokens: 0, outputTokens: 0 };

        await trackApiUsage({
            userId: userId || null,
            isGuest: !userId,
            endpoint: 'interview-transcript',
            model: actualModel,
            botId: 'gloria-interview',
            inputTokens: tokenUsage.inputTokens,
            outputTokens: tokenUsage.outputTokens,
            durationMs,
            success: true,
            metadata: { provider: response.provider, connectionPrep },
        });

        res.json({ summary, setup, transcript, connectionPoints, connectionPrep });
    } catch (error) {
        console.error('AI API error in /interview/transcript:', error);

        const durationMs = Date.now() - startTime;

        await trackApiUsage({
            userId: userId || null,
            isGuest: !userId,
            endpoint: 'interview-transcript',
            model: modelName,
            botId: 'gloria-interview',
            inputTokens: 0,
            outputTokens: 0,
            durationMs,
            success: false,
            errorMessage: error.message,
        });

        res.status(500).json({ error: 'Failed to generate interview transcript.' });
    }
});

module.exports = router;
