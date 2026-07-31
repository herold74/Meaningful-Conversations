const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth.js');
const prisma = require('../../prismaClient.js');
const { requirePracticeAccess, resolveScopeBoundaryTheme, VALID_DIFFICULTIES, getPracticeUnlocks } = require('../practice.js');
const { isHardUnlockedForPair } = require('../../practice/practiceUnlocks.js');
const { buildCoacheeSystemPrompt } = require('../../practice/coacheePrompt.js');
const { getFrameworkById, getFrameworkForEvaluation } = require('../../practice/frameworks.js');
const { getScenarioById } = require('../../practice/scenarios.js');
const { getMatchTier, getDiscouragedReason } = require('../../practice/methodScenarioMap.js');
const { resolveFrameworkId } = require('../../practice/methodTaxonomy.js');
const { getThemeLabel } = require('../../practice/scopeBoundary.js');
const { computePracticeOverallScore, buildScenarioMethodFit } = require('../../practice/evaluationScoring.js');
const { practiceEvaluationPrompts } = require('../../services/geminiPrompts.js');
const { trackApiUsage, checkDailyCostCap } = require('../../services/apiUsageTracker.js');
const aiProviderService = require('../../services/aiProviderService.js');
const { withTimeout, parseStructuredJsonResponse } = require('./shared.js');
const {
  isClientOnlyPracticeFramework,
  practiceAccessErrorMessage,
} = require('../../utils/practiceAccess.js');

const MAX_MESSAGE_LENGTH = 5000;
const PRACTICE_BOT_ID = 'practice-coachee';

function formatHistoryForGemini(history) {
  return (history || []).map((msg) => ({
    role: msg.role === 'bot' ? 'model' : 'user',
    parts: [{ text: msg.parts?.[0]?.text || msg.text || '' }],
  }));
}

function buildTranscriptFromHistory(history, language) {
  const coachLabel = language === 'en' ? 'Coach' : 'Coach';
  const coacheeLabel = language === 'en' ? 'Coachee' : 'Coachee';
  return (history || [])
    .map((msg) => {
      const text = msg.parts?.[0]?.text || msg.text || '';
      const label = msg.role === 'user' ? coachLabel : coacheeLabel;
      return `${label}: ${text}`;
    })
    .join('\n\n');
}

async function validatePracticeSessionParams(userId, user, {
  difficulty,
  liveMode,
  scopeBoundaryTheme,
  frameworkId,
  scenarioId,
}) {
  const diff = VALID_DIFFICULTIES.includes(difficulty) ? difficulty : 'moderate';
  const unlocks = await getPracticeUnlocks(userId, user);
  const pairUnlocked = isHardUnlockedForPair(
    unlocks.hardUnlockedPairs,
    frameworkId,
    scenarioId,
    unlocks.privileged,
  );

  if (diff === 'hard' && !pairUnlocked) {
    return {
      ok: false,
      status: 403,
      error: 'Complete a Challenging session with this method and scenario to unlock Hard difficulty.',
    };
  }
  if (liveMode && !pairUnlocked) {
    return {
      ok: false,
      status: 403,
      error: 'Complete a Challenging session with this method and scenario to unlock Live mode.',
    };
  }

  const resolvedTheme =
    diff === 'hard' ? resolveScopeBoundaryTheme(diff, scenarioId, scopeBoundaryTheme) : null;

  return { ok: true, difficulty: diff, liveMode: !!liveMode, scopeBoundaryTheme: resolvedTheme };
}

// POST /api/gemini/practice/send-message
router.post('/practice/send-message', authMiddleware, async (req, res) => {
  const startTime = Date.now();
  const userId = req.userId;
  const {
    history,
    language = 'de',
    frameworkId,
    scenarioId,
    difficulty = 'moderate',
    focusNote = '',
    stream = false,
    liveMode = false,
    scopeBoundaryTheme = null,
  } = req.body;

  try {
    const access = await requirePracticeAccess(userId);
    if (!access.ok) {
      return res.status(access.status).json({ error: access.error, reason: access.reason });
    }

    const resolvedFrameworkId = resolveFrameworkId(frameworkId);
    if (!resolvedFrameworkId || !scenarioId) {
      return res.status(400).json({ error: 'frameworkId and scenarioId are required.' });
    }
    const framework = getFrameworkById(resolvedFrameworkId);
    if (!framework || !getScenarioById(scenarioId)) {
      return res.status(400).json({ error: 'Invalid frameworkId or scenarioId.' });
    }
    if (isClientOnlyPracticeFramework(framework) && !access.canUseClientFrameworks) {
      return res.status(403).json({
        error: practiceAccessErrorMessage('client_framework'),
        reason: 'client_framework',
      });
    }

    const sessionParams = await validatePracticeSessionParams(userId, access.user, {
      difficulty,
      liveMode,
      scopeBoundaryTheme,
      frameworkId: resolvedFrameworkId,
      scenarioId,
    });
    if (!sessionParams.ok) {
      return res.status(sessionParams.status).json({ error: sessionParams.error });
    }

    const lastCoachMsg = history?.[history.length - 1];
    const coachText = lastCoachMsg?.parts?.[0]?.text || lastCoachMsg?.text || '';
    if (coachText.length > MAX_MESSAGE_LENGTH) {
      return res.status(413).json({ error: `Message too long. Maximum is ${MAX_MESSAGE_LENGTH}.` });
    }

    const costCheck = await checkDailyCostCap(userId);
    if (!costCheck.allowed) {
      return res.status(429).json({ error: 'Daily usage limit reached. Please try again tomorrow.', errorCode: 'DAILY_COST_CAP' });
    }

    const regionUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { aiRegionPreference: true },
    });
    const userRegionPreference = regionUser?.aiRegionPreference || 'optimal';

    const systemInstruction = buildCoacheeSystemPrompt({
      frameworkId: resolvedFrameworkId,
      scenarioId,
      difficulty: sessionParams.difficulty,
      language,
      focusNote,
      scopeBoundaryTheme: sessionParams.scopeBoundaryTheme,
      liveMode: sessionParams.liveMode,
    });

    const geminiHistory = formatHistoryForGemini(history.slice(0, -1));
    const userPrompt = coachText;

    const generateOpts = {
      model: 'gemini-2.5-flash',
      contents: geminiHistory.length > 0
        ? [...geminiHistory, { role: 'user', parts: [{ text: userPrompt }] }]
        : userPrompt,
      config: {
        systemInstruction,
        maxOutputTokens: 1500,
        temperature: 0.85,
      },
      context: 'chat',
      userRegionPreference,
      language,
    };

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      const generator = aiProviderService.streamContent({
        model: 'gemini-2.5-flash',
        contents: geminiHistory.length > 0
          ? [...geminiHistory, { role: 'user', parts: [{ text: userPrompt }] }]
          : userPrompt,
        config: {
          systemInstruction,
          maxOutputTokens: 1500,
          temperature: 0.85,
        },
        context: 'chat',
        userRegionPreference,
        language,
      });

      let finalEvent = null;
      for await (const event of generator) {
        if (event.type === 'chunk') {
          res.write(`data: ${JSON.stringify({ chunk: event.text })}\n\n`);
        } else if (event.type === 'done') {
          finalEvent = event;
        }
      }

      const durationMs = Date.now() - startTime;
      await trackApiUsage({
        userId,
        endpoint: '/api/gemini/practice/send-message',
        model: finalEvent?.model || 'gemini-2.5-flash',
        botId: PRACTICE_BOT_ID,
        inputTokens: finalEvent?.usage?.inputTokens || 0,
        outputTokens: finalEvent?.usage?.outputTokens || 0,
        durationMs,
        success: true,
      });

      res.write(`data: ${JSON.stringify({ done: true, text: finalEvent?.fullText || '', provider: finalEvent?.provider ?? null })}\n\n`);
      res.end();
      return;
    }

    const result = await withTimeout(
      aiProviderService.generateContent(generateOpts),
      60000,
      'Practice coachee response timed out'
    );

    const durationMs = Date.now() - startTime;
    await trackApiUsage({
      userId,
      endpoint: '/api/gemini/practice/send-message',
      model: result.model || 'gemini-2.5-flash',
      botId: PRACTICE_BOT_ID,
      inputTokens: result.usage?.inputTokens || 0,
      outputTokens: result.usage?.outputTokens || 0,
      durationMs,
      success: true,
    });

    res.json({ text: result.text || '', provider: result.model || null });
  } catch (error) {
    console.error('[Practice] send-message error:', error);
    await trackApiUsage({
      userId,
      endpoint: '/api/gemini/practice/send-message',
      model: 'gemini-2.5-flash',
      botId: PRACTICE_BOT_ID,
      inputTokens: 0,
      outputTokens: 0,
      durationMs: Date.now() - startTime,
      success: false,
      errorMessage: error.message,
    });
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate coachee response.' });
    }
  }
});

// POST /api/gemini/practice/evaluate
router.post('/practice/evaluate', authMiddleware, async (req, res) => {
  const startTime = Date.now();
  const userId = req.userId;
  const {
    history,
    frameworkId,
    scenarioId,
    difficulty = 'moderate',
    focusNote = '',
    selfRating,
    language = 'de',
    liveMode = false,
    scopeBoundaryTheme = null,
  } = req.body;

  try {
    const access = await requirePracticeAccess(userId);
    if (!access.ok) {
      return res.status(access.status).json({ error: access.error, reason: access.reason });
    }

    if (!history || !frameworkId || !scenarioId) {
      return res.status(400).json({ error: 'history, frameworkId, and scenarioId are required.' });
    }

    const resolvedFrameworkId = resolveFrameworkId(frameworkId);
    const frameworkMeta = resolvedFrameworkId ? getFrameworkById(resolvedFrameworkId) : null;
    if (frameworkMeta && isClientOnlyPracticeFramework(frameworkMeta) && !access.canUseClientFrameworks) {
      return res.status(403).json({
        error: practiceAccessErrorMessage('client_framework'),
        reason: 'client_framework',
      });
    }

    const sessionParams = await validatePracticeSessionParams(userId, access.user, {
      difficulty,
      liveMode,
      scopeBoundaryTheme,
      frameworkId: resolvedFrameworkId,
      scenarioId,
    });
    if (!sessionParams.ok) {
      return res.status(sessionParams.status).json({ error: sessionParams.error });
    }

    const framework = getFrameworkForEvaluation(resolvedFrameworkId, language);
    const scenario = getScenarioById(scenarioId);
    if (!framework || !scenario) {
      return res.status(400).json({ error: 'Invalid frameworkId or scenarioId.' });
    }

    const lang = language === 'en' ? 'en' : 'de';
    const transcript = buildTranscriptFromHistory(history, lang);
    if (!transcript.trim()) {
      return res.status(400).json({ error: 'Practice transcript is empty. Send at least one message as coach before ending the session.' });
    }
    if (transcript.length > 50000) {
      return res.status(400).json({ error: 'Transcript exceeds maximum length.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { aiRegionPreference: true },
    });
    const userRegionPreference = user?.aiRegionPreference || 'optimal';

    const scenarioSummary = lang === 'de'
      ? `Coachee: ${scenario.coacheeName.de}\nAnliegen: ${scenario.concern.de}\nStimmung: ${scenario.emotionalTone.de}${focusNote ? `\nCoach-Fokus: ${focusNote}` : ''}`
      : `Coachee: ${scenario.coacheeName.en}\nConcern: ${scenario.concern.en}\nTone: ${scenario.emotionalTone.en}${focusNote ? `\nCoach focus: ${focusNote}` : ''}`;

    const currentDate = new Date().toISOString().split('T')[0];
    const matchTier = getMatchTier(scenarioId, resolvedFrameworkId);
    const discouragedReason = getDiscouragedReason(scenarioId, resolvedFrameworkId, lang);
    const promptFn = practiceEvaluationPrompts[lang]?.prompt || practiceEvaluationPrompts.en.prompt;
    const prompt = promptFn({
      framework,
      scenarioSummary,
      difficulty: sessionParams.difficulty,
      selfRating: selfRating || null,
      transcript,
      currentDate,
      liveMode: sessionParams.liveMode,
      scopeBoundaryTheme: sessionParams.scopeBoundaryTheme,
      scopeBoundaryThemeLabel: sessionParams.scopeBoundaryTheme
        ? getThemeLabel(sessionParams.scopeBoundaryTheme, lang)
        : null,
      matchTier,
      discouragedReason,
      sessionFlowRubric: framework.sessionFlowRubric || '',
    });

    const modelName = 'gemini-2.5-pro';
    const result = await withTimeout(
      aiProviderService.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: practiceEvaluationPrompts.schema,
          temperature: 0.2,
        },
        context: 'analysis',
        userRegionPreference,
        language: lang,
      }),
      120000,
      'Practice evaluation timed out'
    );

    let evaluationResult;
    try {
      evaluationResult = parseStructuredJsonResponse(result.text, 'practice evaluation');
    } catch (parseErr) {
      console.error('[Practice] evaluate JSON parse error:', parseErr.message);
      if (parseErr.rawPreview) {
        console.error('[Practice] raw preview:', parseErr.rawPreview);
      }
      return res.status(500).json({ error: 'Failed to parse evaluation response.' });
    }

    if (sessionParams.scopeBoundaryTheme) {
      evaluationResult.scopeBoundary = {
        active: true,
        theme: sessionParams.scopeBoundaryTheme,
        themeLabel: getThemeLabel(sessionParams.scopeBoundaryTheme, lang),
        ...(evaluationResult.scopeBoundary || {}),
      };
    } else {
      evaluationResult.scopeBoundary = evaluationResult.scopeBoundary || { active: false };
    }
    evaluationResult.liveMode = sessionParams.liveMode;

    const scenarioMethodFit = buildScenarioMethodFit(scenarioId, resolvedFrameworkId, lang);
    if (scenarioMethodFit) {
      evaluationResult.scenarioMethodFit = scenarioMethodFit;
    }
    evaluationResult.overallScore = computePracticeOverallScore(evaluationResult);
    if (evaluationResult.calibration) {
      evaluationResult.calibration.evidenceRating = evaluationResult.overallScore;
    }

    let saved;
    try {
      if (!prisma.practiceEvaluation?.create) {
        console.error('[Practice] evaluate error: Prisma client missing practiceEvaluation model (run npx prisma generate and restart backend)');
        const durationMs = Date.now() - startTime;
        return res.json({
          id: null,
          evaluation: evaluationResult,
          durationMs,
          saveWarning: 'Evaluation completed but could not be saved. Run `npx prisma generate` in meaningful-conversations-backend, then restart the backend.',
        });
      }
      saved = await prisma.practiceEvaluation.create({
        data: {
          userId,
          frameworkId: resolvedFrameworkId,
          scenarioId,
          difficulty: sessionParams.difficulty,
          focusNote: focusNote || null,
          evaluationData: JSON.stringify({
            ...evaluationResult,
            liveMode: sessionParams.liveMode,
          }),
          language: lang,
          selfRating: selfRating ?? null,
        },
      });
    } catch (dbErr) {
      console.error('[Practice] evaluate DB save error:', dbErr.message);
      const isMissingTable = dbErr.code === 'P2021'
        || /practice_evaluations|does not exist/i.test(dbErr.message || '');
      const durationMs = Date.now() - startTime;
      await trackApiUsage({
        userId,
        endpoint: '/api/gemini/practice/evaluate',
        model: result.model || modelName,
        botId: PRACTICE_BOT_ID,
        inputTokens: result.usage?.inputTokens || 0,
        outputTokens: result.usage?.outputTokens || 0,
        durationMs,
        success: true,
        errorMessage: `DB save failed: ${dbErr.message}`,
      });
      return res.json({
        id: null,
        evaluation: evaluationResult,
        durationMs,
        saveWarning: isMissingTable
          ? 'Evaluation completed but could not be saved. Database migration 20260724120000_add_practice_evaluations may be pending on the server.'
          : 'Evaluation completed but could not be saved to history.',
      });
    }

    const durationMs = Date.now() - startTime;
    await trackApiUsage({
      userId,
      endpoint: '/api/gemini/practice/evaluate',
      model: result.model || modelName,
      botId: PRACTICE_BOT_ID,
      inputTokens: result.usage?.inputTokens || 0,
      outputTokens: result.usage?.outputTokens || 0,
      durationMs,
      success: true,
    });

    res.json({
      id: saved.id,
      evaluation: evaluationResult,
      durationMs,
    });
  } catch (error) {
    console.error('[Practice] evaluate error:', error);
    await trackApiUsage({
      userId,
      endpoint: '/api/gemini/practice/evaluate',
      model: 'gemini-2.5-pro',
      botId: PRACTICE_BOT_ID,
      inputTokens: 0,
      outputTokens: 0,
      durationMs: Date.now() - startTime,
      success: false,
      errorMessage: error.message,
    });
    res.status(500).json({ error: error.message || 'Failed to evaluate practice session.' });
  }
});

module.exports = router;
