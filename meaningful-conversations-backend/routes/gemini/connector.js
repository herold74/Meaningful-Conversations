const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth.js');
const prisma = require('../../prismaClient.js');
const {
  getVignetteById,
  toPublicVignette,
  getAllPublicVignettesCatalog,
  VIGNETTES_PER_RUN,
} = require('../../connector/vignettes.js');
const { pickAssessmentVignetteIds } = require('../../connector/vignetteSelection.js');
const {
  buildConnectorPersonaPrompt,
  extractConnectorEnd,
  CONNECTOR_END_MARKER,
  MAX_USER_TURNS,
} = require('../../connector/personaPrompt.js');
const { connectorEvaluationPrompts } = require('../../connector/evaluationPrompts.js');
const { CONNECTOR_DIMENSIONS } = require('../../connector/evaluationPrompts.js');
const {
  computeConnectorOverallScore,
  sanitizeConnectorEvaluation,
  clampScore,
} = require('../../connector/connectorScoring.js');
const { stripCoacheeStageDirections } = require('../../practice/coacheeResponseSanitizer.js');
const { trackApiUsage, checkDailyCostCap } = require('../../services/apiUsageTracker.js');
const aiProviderService = require('../../services/aiProviderService.js');
const { withTimeout, parseStructuredJsonResponse } = require('./shared.js');
const { normalizeLanguage } = require('../../utils/language.js');

const MAX_MESSAGE_LENGTH = 5000;
const CONNECTOR_BOT_ID = 'the-connector';

function formatHistoryForGemini(history) {
  return (history || []).map((msg) => ({
    role: msg.role === 'bot' ? 'model' : 'user',
    parts: [{ text: msg.parts?.[0]?.text || msg.text || '' }],
  }));
}

function countUserTurns(history) {
  return (history || []).filter((msg) => msg.role === 'user').length;
}

function buildTranscriptFromHistory(history, vignette, language) {
  const personaLabel = vignette?.personaName || 'Persona';
  const userLabel = 'User';
  return (history || [])
    .map((msg) => {
      const text = msg.parts?.[0]?.text || msg.text || '';
      const label = msg.role === 'user' ? userLabel : personaLabel;
      return `${label}: ${text}`;
    })
    .join('\n\n');
}

async function getUserRegionPreference(userId) {
  const regionUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiRegionPreference: true },
  });
  return regionUser?.aiRegionPreference || 'optimal';
}

/** Persist anonymized scores for GDPR-safe admin aggregates (no userId, no text). */
async function persistConnectorRunStat(evaluationResult, { language, liveMode, vignetteIds, endTypes }) {
  const overallScore = evaluationResult.overallScore;
  if (overallScore == null) return;

  const dimensionScores = {};
  for (const dim of CONNECTOR_DIMENSIONS) {
    dimensionScores[dim] = clampScore(evaluationResult[dim]?.score) ?? 1;
  }

  try {
    await prisma.connectorRunStat.create({
      data: {
        overallScore,
        ...dimensionScores,
        vignetteIds,
        endTypes,
        language,
        liveMode: !!liveMode,
      },
    });
  } catch (err) {
    console.error('[Connector] Failed to persist anonymized run stat:', err.message);
  }
}

// GET /api/gemini/connector/start — stratified random trio for first assessment run
router.get('/connector/start', authMiddleware, async (req, res) => {
  const lang = normalizeLanguage(req.query.language);
  const ids = pickAssessmentVignetteIds(VIGNETTES_PER_RUN);
  res.json({
    mode: 'assessment',
    vignettes: ids.map((id) => toPublicVignette(getVignetteById(id), lang)),
    maxUserTurns: MAX_USER_TURNS,
  });
});

// GET /api/gemini/connector/catalog — all scenarios for practice mode (no openings)
router.get('/connector/catalog', authMiddleware, async (req, res) => {
  const lang = normalizeLanguage(req.query.language);
  res.json({
    vignettes: getAllPublicVignettesCatalog(lang),
    maxUserTurns: MAX_USER_TURNS,
  });
});

// GET /api/gemini/connector/vignette/:id — one scenario with opening (practice chat start)
router.get('/connector/vignette/:id', authMiddleware, async (req, res) => {
  const lang = normalizeLanguage(req.query.language);
  const vignette = getVignetteById(req.params.id);
  if (!vignette) {
    return res.status(404).json({ error: 'Unknown vignette.' });
  }
  res.json({ vignette: toPublicVignette(vignette, lang), maxUserTurns: MAX_USER_TURNS });
});

// POST /api/gemini/connector/turn — persona reply for one vignette
router.post('/connector/turn', authMiddleware, async (req, res) => {
  const startTime = Date.now();
  const userId = req.userId;
  const {
    vignetteId,
    history,
    language,
    liveMode = false,
    stream = false,
  } = req.body;
  const lang = normalizeLanguage(language);

  try {
    const vignette = getVignetteById(vignetteId);
    if (!vignette) {
      return res.status(400).json({ error: 'Invalid vignetteId.' });
    }

    const lastUserMsg = history?.[history.length - 1];
    const userText = lastUserMsg?.parts?.[0]?.text || lastUserMsg?.text || '';
    if (!userText.trim()) {
      return res.status(400).json({ error: 'Last history entry must be a non-empty user message.' });
    }
    if (userText.length > MAX_MESSAGE_LENGTH) {
      return res.status(413).json({ error: `Message too long. Maximum is ${MAX_MESSAGE_LENGTH}.` });
    }

    const costCheck = await checkDailyCostCap(userId);
    if (!costCheck.allowed) {
      return res.status(429).json({ error: 'Daily usage limit reached. Please try again tomorrow.', errorCode: 'DAILY_COST_CAP' });
    }

    const userTurnCount = countUserTurns(history);
    const userRegionPreference = await getUserRegionPreference(userId);

    const systemInstruction = buildConnectorPersonaPrompt({
      vignetteId,
      language: lang,
      userTurnCount,
      liveMode: !!liveMode,
    });

    const geminiHistory = formatHistoryForGemini(history.slice(0, -1));
    const generateOpts = {
      model: 'gemini-2.5-flash',
      contents: geminiHistory.length > 0
        ? [...geminiHistory, { role: 'user', parts: [{ text: userText }] }]
        : userText,
      config: {
        systemInstruction,
        maxOutputTokens: 1500,
        temperature: 0.85,
      },
      context: 'chat',
      userRegionPreference,
      language: lang,
    };

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      const generator = aiProviderService.streamContent(generateOpts);

      // Hold back a tail buffer so the end marker never reaches the client mid-chunk.
      const holdback = CONNECTOR_END_MARKER.length;
      let pending = '';
      let finalEvent = null;
      for await (const event of generator) {
        if (event.type === 'chunk') {
          pending += event.text;
          if (pending.length > holdback) {
            const emit = pending.slice(0, pending.length - holdback);
            pending = pending.slice(pending.length - holdback);
            if (emit) {
              res.write(`data: ${JSON.stringify({ chunk: emit.split(CONNECTOR_END_MARKER).join('') })}\n\n`);
            }
          }
        } else if (event.type === 'done') {
          finalEvent = event;
        }
      }

      // Flush holdback tail so client TTS receives the full spoken text (not just done.text).
      if (pending.length > 0) {
        const tailChunk = pending.split(CONNECTOR_END_MARKER).join('');
        if (tailChunk) {
          res.write(`data: ${JSON.stringify({ chunk: tailChunk })}\n\n`);
        }
        pending = '';
      }

      const { text: fullText, ended } = extractConnectorEnd(finalEvent?.fullText || '');
      const cleanText = stripCoacheeStageDirections(fullText);
      const forceEnded = userTurnCount >= MAX_USER_TURNS;

      const durationMs = Date.now() - startTime;
      await trackApiUsage({
        userId,
        endpoint: '/api/gemini/connector/turn',
        model: finalEvent?.model || 'gemini-2.5-flash',
        botId: CONNECTOR_BOT_ID,
        inputTokens: finalEvent?.usage?.inputTokens || 0,
        outputTokens: finalEvent?.usage?.outputTokens || 0,
        durationMs,
        success: true,
      });

      res.write(`data: ${JSON.stringify({
        done: true,
        text: cleanText,
        ended: ended || forceEnded,
        endType: (ended && !forceEnded) ? 'heard' : (forceEnded ? 'timeout' : null),
        provider: finalEvent?.provider ?? null,
      })}\n\n`);
      res.end();
      return;
    }

    const result = await withTimeout(
      aiProviderService.generateContent(generateOpts),
      60000,
      'Connector persona response timed out'
    );

    const { text: fullText, ended } = extractConnectorEnd(result.text || '');
    const cleanText = stripCoacheeStageDirections(fullText);
    const forceEnded = userTurnCount >= MAX_USER_TURNS;

    const durationMs = Date.now() - startTime;
    await trackApiUsage({
      userId,
      endpoint: '/api/gemini/connector/turn',
      model: result.model || 'gemini-2.5-flash',
      botId: CONNECTOR_BOT_ID,
      inputTokens: result.usage?.inputTokens || 0,
      outputTokens: result.usage?.outputTokens || 0,
      durationMs,
      success: true,
    });

    res.json({
      text: cleanText,
      ended: ended || forceEnded,
      endType: (ended && !forceEnded) ? 'heard' : (forceEnded ? 'timeout' : null),
      provider: result.model || null,
    });
  } catch (error) {
    console.error('[Connector] turn error:', error);
    await trackApiUsage({
      userId,
      endpoint: '/api/gemini/connector/turn',
      model: 'gemini-2.5-flash',
      botId: CONNECTOR_BOT_ID,
      inputTokens: 0,
      outputTokens: 0,
      durationMs: Date.now() - startTime,
      success: false,
      errorMessage: error.message,
    });
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate persona response.' });
    }
  }
});

// POST /api/gemini/connector/evaluate — evaluate a whole run (transcripts are NOT persisted)
router.post('/connector/evaluate', authMiddleware, async (req, res) => {
  const startTime = Date.now();
  const userId = req.userId;
  const { vignettes, language, liveMode = false } = req.body;
  const lang = normalizeLanguage(language);

  try {
    if (!Array.isArray(vignettes) || vignettes.length === 0) {
      return res.status(400).json({ error: 'vignettes array is required.' });
    }

    const prepared = [];
    for (const entry of vignettes) {
      const vignette = getVignetteById(entry.vignetteId);
      if (!vignette) {
        return res.status(400).json({ error: `Invalid vignetteId: ${entry.vignetteId}` });
      }
      const transcript = buildTranscriptFromHistory(entry.history, vignette, lang);
      if (!transcript.trim()) {
        return res.status(400).json({ error: `Empty transcript for vignette ${entry.vignetteId}.` });
      }
      prepared.push({
        vignetteId: entry.vignetteId,
        transcript,
        endType: ['heard', 'timeout', 'aborted'].includes(entry.endType) ? entry.endType : 'timeout',
      });
    }

    const totalLength = prepared.reduce((sum, p) => sum + p.transcript.length, 0);
    if (totalLength > 60000) {
      return res.status(400).json({ error: 'Transcripts exceed maximum length.' });
    }

    const costCheck = await checkDailyCostCap(userId);
    if (!costCheck.allowed) {
      return res.status(429).json({ error: 'Daily usage limit reached. Please try again tomorrow.', errorCode: 'DAILY_COST_CAP' });
    }

    const userRegionPreference = await getUserRegionPreference(userId);
    const currentDate = new Date().toISOString().split('T')[0];
    const modelName = 'gemini-2.5-pro';

    const promptFn = connectorEvaluationPrompts[lang]?.prompt || connectorEvaluationPrompts.en.prompt;
    const prompt = promptFn({ vignettes: prepared, currentDate, liveMode: !!liveMode });

    const result = await withTimeout(
      aiProviderService.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: connectorEvaluationPrompts.schema,
          temperature: 0.2,
        },
        context: 'analysis',
        userRegionPreference,
        language: lang,
      }),
      120000,
      'Connector evaluation timed out'
    );

    let evaluationResult;
    try {
      evaluationResult = parseStructuredJsonResponse(result.text, 'connector evaluation');
    } catch (parseErr) {
      console.error('[Connector] evaluate JSON parse error:', parseErr.message);
      if (parseErr.rawPreview) {
        console.error('[Connector] raw preview:', parseErr.rawPreview);
      }
      return res.status(500).json({ error: 'Failed to parse evaluation response.' });
    }

    sanitizeConnectorEvaluation(evaluationResult);
    evaluationResult.overallScore = computeConnectorOverallScore(evaluationResult);
    evaluationResult.vignetteIds = prepared.map((p) => p.vignetteId);
    evaluationResult.endTypes = prepared.map((p) => p.endType);
    evaluationResult.completedAt = new Date().toISOString();

    const durationMs = Date.now() - startTime;
    await trackApiUsage({
      userId,
      endpoint: '/api/gemini/connector/evaluate',
      model: result.model || modelName,
      botId: CONNECTOR_BOT_ID,
      inputTokens: result.usage?.inputTokens || 0,
      outputTokens: result.usage?.outputTokens || 0,
      durationMs,
      success: true,
      isGuest: false,
    });

    await persistConnectorRunStat(evaluationResult, {
      language: lang,
      liveMode: !!liveMode,
      vignetteIds: evaluationResult.vignetteIds,
      endTypes: evaluationResult.endTypes,
    });

    // Client stores full result E2EE as the 'connector' lens in the personality profile.
    res.json({ evaluation: evaluationResult, durationMs });
  } catch (error) {
    console.error('[Connector] evaluate error:', error);
    await trackApiUsage({
      userId,
      endpoint: '/api/gemini/connector/evaluate',
      model: 'gemini-2.5-pro',
      botId: CONNECTOR_BOT_ID,
      inputTokens: 0,
      outputTokens: 0,
      durationMs: Date.now() - startTime,
      success: false,
      errorMessage: error.message,
    });
    res.status(500).json({ error: error.message || 'Failed to evaluate connector run.' });
  }
});

module.exports = router;
