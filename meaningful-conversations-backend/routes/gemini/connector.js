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
const { requireConnectorPremium } = require('../../connector/connectorPremiumAccess.js');
const { getCustomScenario, putCustomScenario } = require('../../connector/customScenarioStore.js');
const { OPEN_LENGTH_PRESETS } = require('../../connector/connectorLimits.js');
const {
  validateOpenSituationInput,
  buildScenarioCompilerPrompt,
  compilerResponseSchema,
  sanitizeCompiledVignette,
  publicPayloadFromCompiled,
} = require('../../connector/scenarioCompiler.js');
const {
  qualitativeEvaluationSchema,
  buildQualitativeEvaluationPrompt,
  sanitizeQualitativeEvaluation,
} = require('../../connector/qualitativeEvaluationPrompts.js');

const MAX_MESSAGE_LENGTH = 5000;
const CONNECTOR_BOT_ID = 'the-connector';

function isPracticeConnectorRunMode(runMode) {
  return runMode === 'practice' || runMode === 'open';
}

async function sendConnectorPremiumRequired(res, userId, lang) {
  const gate = await requireConnectorPremium(userId, lang);
  if (!gate.ok) {
    res.status(gate.status).json({ error: gate.error, errorCode: gate.errorCode });
    return false;
  }
  return true;
}

function resolveTurnVignette({ vignetteId, customScenarioId, userId }) {
  if (customScenarioId) {
    const session = getCustomScenario(customScenarioId, userId);
    if (!session) return null;
    return {
      vignette: session.vignette,
      vignetteId: session.vignette.id,
      maxUserTurns: session.maxUserTurns,
      meta: session,
    };
  }
  const vignette = getVignetteById(vignetteId);
  if (!vignette) return null;
  return { vignette, vignetteId: vignette.id, maxUserTurns: MAX_USER_TURNS, meta: null };
}

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
async function persistConnectorRunStat(evaluationResult, { language, liveMode, vignetteIds, endTypes, runMode = 'assessment' }) {
  const overallScore = evaluationResult.overallScore;
  if (overallScore == null) return;

  const dimensionScores = {};
  for (const dim of CONNECTOR_DIMENSIONS) {
    dimensionScores[dim] = clampScore(evaluationResult[dim]?.score) ?? 1;
  }

  try {
    await prisma.connectorRunStat.create({
      data: {
        runMode,
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

async function persistOpenConnectorRunStat({
  language,
  liveMode,
  vignetteIds,
  endTypes,
  lengthPreset,
  relationshipBucket,
  developmentFieldsTouched,
}) {
  try {
    await prisma.connectorRunStat.create({
      data: {
        runMode: 'open',
        overallScore: null,
        empathy: null,
        presence: null,
        curiosity: null,
        nonJudgment: null,
        steadiness: null,
        vignetteIds,
        endTypes,
        lengthPreset,
        relationshipBucket,
        developmentFieldsTouched,
        language,
        liveMode: !!liveMode,
      },
    });
  } catch (err) {
    console.error('[Connector] Failed to persist open run stat:', err.message);
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
  if (!(await sendConnectorPremiumRequired(res, req.userId, lang))) return;
  res.json({
    vignettes: getAllPublicVignettesCatalog(lang),
    maxUserTurns: MAX_USER_TURNS,
  });
});

// GET /api/gemini/connector/vignette/:id — one scenario with opening (practice chat start)
router.get('/connector/vignette/:id', authMiddleware, async (req, res) => {
  const lang = normalizeLanguage(req.query.language);
  if (!(await sendConnectorPremiumRequired(res, req.userId, lang))) return;
  const vignette = getVignetteById(req.params.id);
  if (!vignette) {
    return res.status(404).json({ error: 'Unknown vignette.' });
  }
  res.json({ vignette: toPublicVignette(vignette, lang), maxUserTurns: MAX_USER_TURNS });
});

// POST /api/gemini/connector/scenario/from-description — compile open situation (Premium)
router.post('/connector/scenario/from-description', authMiddleware, async (req, res) => {
  const startTime = Date.now();
  const userId = req.userId;
  const { relationship, situation, lengthPreset, language, personaName, personaGender } = req.body;
  const lang = normalizeLanguage(language);

  if (!(await sendConnectorPremiumRequired(res, userId, lang))) return;

  const validation = validateOpenSituationInput({
    relationship,
    situation,
    lengthPreset,
    personaName,
    personaGender,
  });
  if (!validation.ok) {
    return res.status(400).json({ error: validation.errors.join(' ') });
  }

  const preset = OPEN_LENGTH_PRESETS[validation.lengthPreset];

  try {
    const costCheck = await checkDailyCostCap(userId);
    if (!costCheck.allowed) {
      return res.status(429).json({ error: 'Daily usage limit reached. Please try again tomorrow.', errorCode: 'DAILY_COST_CAP' });
    }

    const userRegionPreference = await getUserRegionPreference(userId);
    const prompt = buildScenarioCompilerPrompt({
      relationship: validation.relationship,
      situation: validation.situation,
      language: lang,
      personaName: validation.personaName,
      personaGender: validation.personaGender,
    });

    const result = await withTimeout(
      aiProviderService.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: compilerResponseSchema,
          temperature: 0.4,
        },
        context: 'analysis',
        userRegionPreference,
        language: lang,
      }),
      90000,
      'Connector scenario compile timed out',
    );

    let compiled;
    try {
      compiled = parseStructuredJsonResponse(result.text, 'connector scenario compile');
    } catch (parseErr) {
      console.error('[Connector] compile JSON parse error:', parseErr.message);
      return res.status(500).json({ error: 'Failed to parse compiled scenario.' });
    }

    const vignette = sanitizeCompiledVignette(compiled, {
      relationship: validation.relationship,
      language: lang,
      personaName: validation.personaName,
      personaGender: validation.personaGender,
    });

    const customScenarioId = putCustomScenario({
      userId,
      vignette,
      maxUserTurns: preset.maxUserTurns,
      lengthPreset: validation.lengthPreset,
      relationshipBucket: vignette.relationshipBucket,
    });
    vignette.id = customScenarioId;

    const durationMs = Date.now() - startTime;
    await trackApiUsage({
      userId,
      endpoint: '/api/gemini/connector/scenario/from-description',
      model: result.model || 'gemini-2.5-flash',
      botId: CONNECTOR_BOT_ID,
      inputTokens: result.usage?.inputTokens || 0,
      outputTokens: result.usage?.outputTokens || 0,
      durationMs,
      success: true,
    });

    res.json({
      customScenarioId,
      vignette: publicPayloadFromCompiled({ ...vignette, id: customScenarioId }, lang),
      maxUserTurns: preset.maxUserTurns,
      lengthPreset: validation.lengthPreset,
      durationMs,
    });
  } catch (error) {
    console.error('[Connector] from-description error:', error);
    await trackApiUsage({
      userId,
      endpoint: '/api/gemini/connector/scenario/from-description',
      model: 'gemini-2.5-flash',
      botId: CONNECTOR_BOT_ID,
      inputTokens: 0,
      outputTokens: 0,
      durationMs: Date.now() - startTime,
      success: false,
      errorMessage: error.message,
    });
    res.status(500).json({ error: error.message || 'Failed to compile scenario.' });
  }
});

// POST /api/gemini/connector/turn — persona reply for one vignette
router.post('/connector/turn', authMiddleware, async (req, res) => {
  const startTime = Date.now();
  const userId = req.userId;
  const {
    vignetteId,
    customScenarioId,
    runMode = 'assessment',
    history,
    language,
    liveMode = false,
    stream = false,
  } = req.body;
  const lang = normalizeLanguage(language);

  try {
    if (customScenarioId || isPracticeConnectorRunMode(runMode)) {
      if (!(await sendConnectorPremiumRequired(res, userId, lang))) return;
    }

    const resolved = resolveTurnVignette({ vignetteId, customScenarioId, userId });
    if (!resolved) {
      return res.status(400).json({ error: 'Invalid vignette or expired custom scenario.' });
    }
    const { vignette, maxUserTurns } = resolved;

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
      vignette,
      language: lang,
      userTurnCount,
      liveMode: !!liveMode,
      maxUserTurns,
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
        temperature: 0.72,
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
      const forceEnded = userTurnCount >= maxUserTurns;

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
        maxUserTurns,
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
    const forceEnded = userTurnCount >= maxUserTurns;

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
      maxUserTurns,
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

    const isPracticeRun = vignettes.length === 1 && !String(vignettes[0].vignetteId || '').startsWith('custom-');
    if (isPracticeRun) {
      if (!(await sendConnectorPremiumRequired(res, userId, lang))) return;
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

    const scoredRunMode = isPracticeRun ? 'practice' : 'assessment';
    await persistConnectorRunStat(evaluationResult, {
      language: lang,
      liveMode: !!liveMode,
      vignetteIds: evaluationResult.vignetteIds,
      endTypes: evaluationResult.endTypes,
      runMode: scoredRunMode,
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

// POST /api/gemini/connector/evaluate-qualitative — open situation (no scores)
router.post('/connector/evaluate-qualitative', authMiddleware, async (req, res) => {
  const startTime = Date.now();
  const userId = req.userId;
  const {
    customScenarioId,
    history,
    endType,
    language,
    liveMode = false,
    lengthPreset,
    relationshipBucket,
  } = req.body;
  const lang = normalizeLanguage(language);

  if (!(await sendConnectorPremiumRequired(res, userId, lang))) return;

  try {
    if (!customScenarioId || !Array.isArray(history)) {
      return res.status(400).json({ error: 'customScenarioId and history are required.' });
    }

    const session = getCustomScenario(customScenarioId, userId);
    if (!session) {
      return res.status(400).json({ error: 'Invalid or expired custom scenario.' });
    }

    const vignette = session.vignette;
    const transcript = buildTranscriptFromHistory(history, vignette, lang);
    if (!transcript.trim()) {
      return res.status(400).json({ error: 'Empty transcript.' });
    }
    if (transcript.length > 60000) {
      return res.status(400).json({ error: 'Transcripts exceed maximum length.' });
    }

    const resolvedEndType = ['heard', 'timeout', 'aborted'].includes(endType) ? endType : 'timeout';

    const costCheck = await checkDailyCostCap(userId);
    if (!costCheck.allowed) {
      return res.status(429).json({ error: 'Daily usage limit reached. Please try again tomorrow.', errorCode: 'DAILY_COST_CAP' });
    }

    const userRegionPreference = await getUserRegionPreference(userId);
    const modelName = 'gemini-2.5-pro';
    const prompt = buildQualitativeEvaluationPrompt({
      transcript,
      vignette,
      language: lang,
      liveMode: !!liveMode,
      endType: resolvedEndType,
    });

    const result = await withTimeout(
      aiProviderService.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: qualitativeEvaluationSchema,
          temperature: 0.2,
        },
        context: 'analysis',
        userRegionPreference,
        language: lang,
      }),
      120000,
      'Connector qualitative evaluation timed out',
    );

    let parsed;
    try {
      parsed = parseStructuredJsonResponse(result.text, 'connector qualitative evaluation');
    } catch (parseErr) {
      console.error('[Connector] qualitative JSON parse error:', parseErr.message);
      return res.status(500).json({ error: 'Failed to parse qualitative evaluation.' });
    }

    const evaluation = sanitizeQualitativeEvaluation(parsed);
    evaluation.completedAt = new Date().toISOString();
    evaluation.endType = resolvedEndType;
    evaluation.customScenarioId = customScenarioId;

    const durationMs = Date.now() - startTime;
    await trackApiUsage({
      userId,
      endpoint: '/api/gemini/connector/evaluate-qualitative',
      model: result.model || modelName,
      botId: CONNECTOR_BOT_ID,
      inputTokens: result.usage?.inputTokens || 0,
      outputTokens: result.usage?.outputTokens || 0,
      durationMs,
      success: true,
    });

    const bucket = relationshipBucket || session.relationshipBucket;
    const preset = lengthPreset || session.lengthPreset;
    await persistOpenConnectorRunStat({
      language: lang,
      liveMode: !!liveMode,
      vignetteIds: [customScenarioId],
      endTypes: [resolvedEndType],
      lengthPreset: preset,
      relationshipBucket: bucket,
      developmentFieldsTouched: evaluation.developmentFieldsTouched,
    });

    res.json({ evaluation, durationMs });
  } catch (error) {
    console.error('[Connector] evaluate-qualitative error:', error);
    await trackApiUsage({
      userId,
      endpoint: '/api/gemini/connector/evaluate-qualitative',
      model: 'gemini-2.5-pro',
      botId: CONNECTOR_BOT_ID,
      inputTokens: 0,
      outputTokens: 0,
      durationMs: Date.now() - startTime,
      success: false,
      errorMessage: error.message,
    });
    res.status(500).json({ error: error.message || 'Failed to evaluate open situation.' });
  }
});

module.exports = router;
