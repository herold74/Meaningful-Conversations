const express = require('express');
const authMiddleware = require('../middleware/auth.js');
const prisma = require('../prismaClient.js');
const { getPublicCatalog } = require('../practice/frameworks.js');
const { getPublicScenarios, getPublicContractingScenarios } = require('../practice/scenarios.js');
const { enrichCatalog } = require('../practice/methodScenarioMap.js');
const { resolvePublicAssetUrl } = require('../utils/publicAssetUrl.js');
const { rollScopeBoundaryTheme, isValidTheme } = require('../practice/scopeBoundary.js');
const {
  PRACTICE_USER_SELECT,
  resolvePracticeAccess,
  practiceAccessErrorMessage,
  isClientOnlyPracticeFramework,
  canUseClientPracticeFrameworks,
} = require('../utils/practiceAccess.js');

const router = express.Router();

const VALID_DIFFICULTIES = ['easy', 'moderate', 'challenging', 'hard'];

async function requirePracticeAccess(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: PRACTICE_USER_SELECT,
  });
  if (!user) return { ok: false, status: 404, error: 'User not found.' };

  const access = resolvePracticeAccess(user);
  if (!access.canAccessPractice) {
    return {
      ok: false,
      status: 403,
      error: practiceAccessErrorMessage(access.lockReason),
      reason: access.lockReason,
    };
  }

  return { ok: true, user, canUseClientFrameworks: access.canUseClientFrameworks };
}

/** @deprecated Use requirePracticeAccess — kept for tests referencing legacy name */
async function requireClientPlus(userId) {
  return requirePracticeAccess(userId);
}

const { isHardUnlockedForPair, getPracticeUnlocks: buildPracticeUnlocks } = require('../practice/practiceUnlocks.js');

async function getPracticeUnlocks(userId, user) {
  return buildPracticeUnlocks(prisma, userId, user);
}

function resolveScopeBoundaryTheme(difficulty, scenarioId, clientTheme) {
  if (difficulty !== 'hard') return null;
  // Client rolled at session start and sends null or a theme — do not re-roll on null.
  if (clientTheme === undefined) return rollScopeBoundaryTheme(scenarioId);
  if (!clientTheme || !isValidTheme(clientTheme)) return null;
  return clientTheme;
}

function annotateFrameworkAccess(frameworks, canUseClientFrameworks) {
  return frameworks.map((framework) => {
    const clientOnly = isClientOnlyPracticeFramework(framework);
    const locked = clientOnly && !canUseClientFrameworks;
    return {
      ...framework,
      clientOnly,
      locked,
      lockReason: locked ? 'client_required' : null,
    };
  });
}

// GET /api/practice/catalog?language=de
router.get('/catalog', authMiddleware, async (req, res) => {
  try {
    const access = await requirePracticeAccess(req.userId);
    if (!access.ok) {
      return res.status(access.status).json({ error: access.error, reason: access.reason });
    }

    const language = req.query.language === 'en' ? 'en' : 'de';
    const unlocks = await getPracticeUnlocks(req.userId, access.user);

    const frameworks = getPublicCatalog(language);
    const scenarios = getPublicScenarios(language).map((scenario) => ({
      ...scenario,
      avatar: resolvePublicAssetUrl(scenario.avatar),
    }));
    const contractingScenarios = getPublicContractingScenarios(language).map((scenario) => ({
      ...scenario,
      avatar: resolvePublicAssetUrl(scenario.avatar),
    }));
    const enriched = enrichCatalog(frameworks, scenarios, language);
    const frameworksWithAccess = annotateFrameworkAccess(
      enriched.frameworks,
      access.canUseClientFrameworks,
    );

    res.json({
      frameworks: frameworksWithAccess,
      scenarios: enriched.scenarios,
      contractingScenarios,
      defaultPair: enriched.defaultPair,
      difficulties: [
        { id: 'easy', label: language === 'en' ? 'Easy' : 'Leicht' },
        { id: 'moderate', label: language === 'en' ? 'Moderate' : 'Mittel' },
        { id: 'challenging', label: language === 'en' ? 'Challenging' : 'Herausfordernd' },
        { id: 'hard', label: language === 'en' ? 'Hard' : 'Schwer' },
      ],
      unlocks,
      practiceAccess: {
        canUseClientFrameworks: access.canUseClientFrameworks,
      },
    });
  } catch (error) {
    console.error('[Practice] catalog error:', error);
    res.status(500).json({ error: 'Failed to load practice catalog.' });
  }
});

// GET /api/practice/evaluations — history
router.get('/evaluations', authMiddleware, async (req, res) => {
  try {
    const access = await requirePracticeAccess(req.userId);
    if (!access.ok) {
      return res.status(access.status).json({ error: access.error, reason: access.reason });
    }

    const evaluations = await prisma.practiceEvaluation.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(evaluations.map((e) => ({
      id: e.id,
      createdAt: e.createdAt,
      language: e.language,
      frameworkId: e.frameworkId,
      scenarioId: e.scenarioId,
      difficulty: e.difficulty,
      focusNote: e.focusNote,
      summary: JSON.parse(e.evaluationData).summary,
      overallScore: JSON.parse(e.evaluationData).overallScore,
      evaluationData: JSON.parse(e.evaluationData),
    })));
  } catch (error) {
    console.error('[Practice] list evaluations error:', error);
    res.status(500).json({ error: 'Failed to load practice history.' });
  }
});

// DELETE /api/practice/evaluations/:id/transcript — remove stored transcript only (scores kept)
router.delete('/evaluations/:id/transcript', authMiddleware, async (req, res) => {
  try {
    const access = await requirePracticeAccess(req.userId);
    if (!access.ok) {
      return res.status(access.status).json({ error: access.error, reason: access.reason });
    }

    const evaluation = await prisma.practiceEvaluation.findUnique({
      where: { id: req.params.id },
    });

    if (!evaluation || evaluation.userId !== req.userId) {
      return res.status(404).json({ error: 'Evaluation not found.' });
    }

    let data;
    try {
      data = JSON.parse(evaluation.evaluationData);
    } catch {
      return res.status(500).json({ error: 'Invalid evaluation data.' });
    }

    if (!data.transcript?.trim()) {
      return res.status(404).json({ error: 'No transcript stored for this evaluation.' });
    }

    delete data.transcript;

    await prisma.practiceEvaluation.update({
      where: { id: req.params.id },
      data: { evaluationData: JSON.stringify(data) },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[Practice] delete transcript error:', error);
    res.status(500).json({ error: 'Failed to delete practice transcript.' });
  }
});

// DELETE /api/practice/evaluations/:id
router.delete('/evaluations/:id', authMiddleware, async (req, res) => {
  try {
    const access = await requirePracticeAccess(req.userId);
    if (!access.ok) {
      return res.status(access.status).json({ error: access.error, reason: access.reason });
    }

    const evaluation = await prisma.practiceEvaluation.findUnique({
      where: { id: req.params.id },
    });

    if (!evaluation || evaluation.userId !== req.userId) {
      return res.status(404).json({ error: 'Evaluation not found.' });
    }

    await prisma.practiceEvaluation.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('[Practice] delete evaluation error:', error);
    res.status(500).json({ error: 'Failed to delete evaluation.' });
  }
});

module.exports = router;
module.exports.requirePracticeAccess = requirePracticeAccess;
module.exports.requireClientPlus = requireClientPlus;
module.exports.getPracticeUnlocks = getPracticeUnlocks;
module.exports.resolveScopeBoundaryTheme = resolveScopeBoundaryTheme;
module.exports.VALID_DIFFICULTIES = VALID_DIFFICULTIES;
