const { resolveFrameworkId } = require('./methodTaxonomy.js');

function practicePairKey(frameworkId, scenarioId) {
  return `${resolveFrameworkId(frameworkId)}::${scenarioId}`;
}

function isHardUnlockedForPair(hardUnlockedPairs, frameworkId, scenarioId, privileged) {
  if (privileged) return true;
  const key = practicePairKey(frameworkId, scenarioId);
  return hardUnlockedPairs.some(
    (p) => practicePairKey(p.frameworkId, p.scenarioId) === key,
  );
}

async function getChallengingCompletedPairs(prisma, userId) {
  const rows = await prisma.practiceEvaluation.findMany({
    where: { userId, difficulty: 'challenging' },
    select: { frameworkId: true, scenarioId: true },
    distinct: ['frameworkId', 'scenarioId'],
  });
  return rows.map((r) => ({
    frameworkId: resolveFrameworkId(r.frameworkId),
    scenarioId: r.scenarioId,
  }));
}

async function getPracticeUnlocks(prisma, userId, user) {
  const privileged = !!(user.isAdmin || user.isDeveloper);
  if (privileged) {
    return { hardUnlockedPairs: [], privileged: true };
  }
  const hardUnlockedPairs = await getChallengingCompletedPairs(prisma, userId);
  return { hardUnlockedPairs, privileged: false };
}

module.exports = {
  practicePairKey,
  isHardUnlockedForPair,
  getChallengingCompletedPairs,
  getPracticeUnlocks,
};
