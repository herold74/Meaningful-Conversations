const express = require('express');
const authMiddleware = require('../middleware/auth.js');
const prisma = require('../prismaClient.js');
const { getPublicCatalog } = require('../practice/frameworks.js');
const { getPublicScenarios } = require('../practice/scenarios.js');
const { resolvePublicAssetUrl } = require('../utils/publicAssetUrl.js');
const { rollScopeBoundaryTheme, isValidTheme } = require('../practice/scopeBoundary.js');

const router = express.Router();

const VALID_DIFFICULTIES = ['easy', 'moderate', 'challenging', 'hard'];

async function requireClientPlus(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isClient: true, isAdmin: true, isDeveloper: true },
  });
  if (!user) return { ok: false, status: 404, error: 'User not found.' };
  if (!user.isClient && !user.isAdmin && !user.isDeveloper) {
    return { ok: false, status: 403, error: 'Coach Practice requires Client access or higher.' };
  }
  return { ok: true, user };
}

async function getPracticeUnlocks(userId, user) {
  const isPrivileged = user.isAdmin || user.isDeveloper;
  if (isPrivileged) {
    return { hard: true, liveMode: true };
  }
  const challengingCount = await prisma.practiceEvaluation.count({
    where: { userId, difficulty: 'challenging' },
  });
  const unlocked = challengingCount >= 1;
  return { hard: unlocked, liveMode: unlocked };
}

function resolveScopeBoundaryTheme(difficulty, scenarioId, clientTheme) {
  if (difficulty !== 'hard') return null;
  // Client rolled at session start and sends null or a theme — do not re-roll on null.
  if (clientTheme === undefined) return rollScopeBoundaryTheme(scenarioId);
  if (!clientTheme || !isValidTheme(clientTheme)) return null;
  return clientTheme;
}

// GET /api/practice/catalog?language=de
router.get('/catalog', authMiddleware, async (req, res) => {
  try {
    const access = await requireClientPlus(req.userId);
    if (!access.ok) {
      return res.status(access.status).json({ error: access.error });
    }

    const language = req.query.language === 'en' ? 'en' : 'de';
    const unlocks = await getPracticeUnlocks(req.userId, access.user);

    res.json({
      frameworks: getPublicCatalog(language),
      scenarios: getPublicScenarios(language).map((scenario) => ({
        ...scenario,
        avatar: resolvePublicAssetUrl(scenario.avatar),
      })),
      difficulties: [
        { id: 'easy', label: language === 'en' ? 'Easy' : 'Leicht' },
        { id: 'moderate', label: language === 'en' ? 'Moderate' : 'Mittel' },
        { id: 'challenging', label: language === 'en' ? 'Challenging' : 'Herausfordernd' },
        { id: 'hard', label: language === 'en' ? 'Hard' : 'Schwer', locked: !unlocks.hard },
      ],
      unlocks,
    });
  } catch (error) {
    console.error('[Practice] catalog error:', error);
    res.status(500).json({ error: 'Failed to load practice catalog.' });
  }
});

// GET /api/practice/evaluations — history
router.get('/evaluations', authMiddleware, async (req, res) => {
  try {
    const access = await requireClientPlus(req.userId);
    if (!access.ok) {
      return res.status(access.status).json({ error: access.error });
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

// DELETE /api/practice/evaluations/:id
router.delete('/evaluations/:id', authMiddleware, async (req, res) => {
  try {
    const access = await requireClientPlus(req.userId);
    if (!access.ok) {
      return res.status(access.status).json({ error: access.error });
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
module.exports.requireClientPlus = requireClientPlus;
module.exports.getPracticeUnlocks = getPracticeUnlocks;
module.exports.resolveScopeBoundaryTheme = resolveScopeBoundaryTheme;
module.exports.VALID_DIFFICULTIES = VALID_DIFFICULTIES;
