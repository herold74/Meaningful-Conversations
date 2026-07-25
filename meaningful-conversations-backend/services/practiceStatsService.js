/**
 * GDPR-safe aggregate stats for Coach Practice (admin dashboard).
 * Returns counts and averages only — no userId, no transcript quotes, no focusNote text.
 * k-anonymity: metrics that could identify individuals are suppressed when n < K.
 */

const { getPublicCatalog } = require('../practice/frameworks.js');
const { getPublicScenarios, SCENARIOS } = require('../practice/scenarios.js');

const K_ANONYMITY = 5;

const round1 = (n) => Math.round(n * 10) / 10;
const avg = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);

function parseScores(evaluationDataStr) {
  try {
    const data = JSON.parse(evaluationDataStr);
    return {
      overallScore: typeof data.overallScore === 'number' ? data.overallScore : null,
      methodCompliance: data.methodCompliance?.score,
      effectiveness: data.effectiveness?.score,
      clarity: data.clarity?.score,
      coacheeAutonomy: data.coacheeAutonomy?.score,
      coacheeSatisfaction: data.coacheeSatisfaction?.score,
      calibration: data.calibration,
    };
  } catch {
    return null;
  }
}

function suppressCount(count) {
  return count > 0 && count < K_ANONYMITY;
}

function bucketRow(id, count, scores) {
  const suppressed = suppressCount(count);
  return {
    id,
    count: suppressed ? null : count,
    suppressed,
    displayCount: suppressed ? `<${K_ANONYMITY}` : String(count),
    avgScore: !suppressed && scores.length ? round1(avg(scores)) : null,
  };
}

/**
 * @param {Array<{ frameworkId: string; scenarioId: string; difficulty: string; userId: string; createdAt: Date; evaluationData: string }>} rows
 * @param {{ days?: number; language?: string }} options
 */
function computePracticeAdminStats(rows, options = {}) {
  const days = Math.min(Math.max(Number(options.days) || 90, 7), 365);
  const language = options.language === 'en' ? 'en' : 'de';
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

  const catalog = getPublicCatalog(language);
  const scenarios = getPublicScenarios(language);
  const frameworkNames = Object.fromEntries(catalog.map((f) => [f.id, f.name]));
  const scenarioNames = Object.fromEntries(scenarios.map((s) => [s.id, s.coacheeName ? `${s.coacheeName}` : s.id]));

  const inRange = rows.filter((r) => {
    const d = r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt);
    return d >= start && d <= end;
  });

  const overallScores = [];
  const dimSums = {
    methodCompliance: [],
    effectiveness: [],
    clarity: [],
    coacheeAutonomy: [],
    coacheeSatisfaction: [],
  };
  const histogram = Object.fromEntries([...Array(10)].map((_, i) => [String(i + 1), 0]));

  const byFramework = new Map();
  const byScenario = new Map();
  const matrix = new Map();
  const byDifficulty = new Map();
  const daily = new Map();
  const byUser = new Map();

  let calibrationSessions = 0;
  let selfSum = 0;
  let evidenceSum = 0;

  for (const row of inRange) {
    const scores = parseScores(row.evaluationData);
    if (!scores || scores.overallScore == null) continue;

    overallScores.push(scores.overallScore);
    histogram[String(Math.min(10, Math.max(1, Math.round(scores.overallScore))))] =
      (histogram[String(Math.min(10, Math.max(1, Math.round(scores.overallScore))))] || 0) + 1;

    for (const key of Object.keys(dimSums)) {
      if (typeof scores[key] === 'number') dimSums[key].push(scores[key]);
    }

    const fw = row.frameworkId;
    const sc = row.scenarioId;
    const diff = row.difficulty || 'moderate';

    if (!byFramework.has(fw)) byFramework.set(fw, { count: 0, scores: [] });
    const fRow = byFramework.get(fw);
    fRow.count += 1;
    fRow.scores.push(scores.overallScore);

    if (!byScenario.has(sc)) byScenario.set(sc, { count: 0, scores: [] });
    const sRow = byScenario.get(sc);
    sRow.count += 1;
    sRow.scores.push(scores.overallScore);

    const mKey = `${fw}::${sc}`;
    if (!matrix.has(mKey)) matrix.set(mKey, { frameworkId: fw, scenarioId: sc, count: 0, scores: [] });
    const mRow = matrix.get(mKey);
    mRow.count += 1;
    mRow.scores.push(scores.overallScore);

    if (!byDifficulty.has(diff)) byDifficulty.set(diff, { count: 0, scores: [] });
    const dRow = byDifficulty.get(diff);
    dRow.count += 1;
    dRow.scores.push(scores.overallScore);

    const dateKey = (row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt))
      .toISOString()
      .slice(0, 10);
    daily.set(dateKey, (daily.get(dateKey) || 0) + 1);

    if (!byUser.has(row.userId)) byUser.set(row.userId, []);
    byUser.get(row.userId).push({
      createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
      overallScore: scores.overallScore,
    });

    if (scores.calibration?.selfRating > 0) {
      calibrationSessions += 1;
      selfSum += scores.calibration.selfRating;
      evidenceSum += scores.calibration.evidenceRating || scores.overallScore;
    }
  }

  const distinctCoaches = byUser.size;
  const coachesSuppressed = distinctCoaches > 0 && distinctCoaches < K_ANONYMITY;

  const frameworkStats = catalog.map((f) => {
    const entry = byFramework.get(f.id) || { count: 0, scores: [] };
    return {
      ...bucketRow(f.id, entry.count, entry.scores),
      name: f.name,
    };
  }).sort((a, b) => (b.count || 0) - (a.count || 0));

  const scenarioStats = scenarios.map((s) => {
    const entry = byScenario.get(s.id) || { count: 0, scores: [] };
    return {
      ...bucketRow(s.id, entry.count, entry.scores),
      name: s.coacheeName,
      concern: s.concern?.slice(0, 80) || '',
    };
  }).sort((a, b) => (b.count || 0) - (a.count || 0));

  const matrixStats = [];
  for (const f of catalog) {
    for (const s of scenarios) {
      const entry = matrix.get(`${f.id}::${s.id}`) || { count: 0, scores: [] };
      matrixStats.push({
        frameworkId: f.id,
        frameworkName: f.name,
        scenarioId: s.id,
        scenarioName: s.coacheeName,
        ...bucketRow(`${f.id}::${s.id}`, entry.count, entry.scores),
      });
    }
  }

  const underusedScenarios = scenarios
    .filter((s) => !(byScenario.get(s.id)?.count))
    .map((s) => ({ id: s.id, name: s.coacheeName }));

  const difficultyStats = {};
  for (const [diff, entry] of byDifficulty.entries()) {
    difficultyStats[diff] = bucketRow(diff, entry.count, entry.scores);
  }

  const dailyArray = [...daily.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Learning impact: first vs last session per coach (cohort suppressed if < K)
  const userDeltas = [];
  const userFirstLast = [];
  for (const sessions of byUser.values()) {
    if (sessions.length === 0) continue;
    sessions.sort((a, b) => a.createdAt - b.createdAt);
    const first = sessions[0].overallScore;
    const last = sessions[sessions.length - 1].overallScore;
    userFirstLast.push({ first, last });
    if (sessions.length >= 2) {
      userDeltas.push(last - first);
    }
  }

  const cohortSuppressed = distinctCoaches < K_ANONYMITY;
  const learningImpact = cohortSuppressed
    ? {
        suppressed: true,
        cohortSize: null,
        avgFirstScore: null,
        avgLastScore: null,
        avgDelta: null,
        multiSessionCoaches: null,
      }
    : {
        suppressed: false,
        cohortSize: distinctCoaches,
        avgFirstScore: round1(avg(userFirstLast.map((u) => u.first))),
        avgLastScore: round1(avg(userFirstLast.map((u) => u.last))),
        avgDelta: userDeltas.length ? round1(avg(userDeltas)) : null,
        multiSessionCoaches: userDeltas.length,
      };

  const calibrationSuppressed = calibrationSessions > 0 && calibrationSessions < K_ANONYMITY;

  return {
    period: {
      start: start.toISOString(),
      end: end.toISOString(),
      days,
    },
    kAnonymityThreshold: K_ANONYMITY,
    gdprNote: language === 'de'
      ? 'Nur aggregierte Daten. Keine Personen-, Transkript- oder Kontoinhalte.'
      : 'Aggregated data only. No personal, transcript, or account content.',
    totals: {
      completedSessions: inRange.length,
      activeCoaches: coachesSuppressed ? null : distinctCoaches,
      activeCoachesSuppressed: coachesSuppressed,
      avgOverallScore: overallScores.length ? round1(avg(overallScores)) : null,
    },
    byFramework: frameworkStats,
    byScenario: scenarioStats,
    matrix: matrixStats,
    byDifficulty: difficultyStats,
    dimensionAverages: {
      methodCompliance: dimSums.methodCompliance.length ? round1(avg(dimSums.methodCompliance)) : null,
      effectiveness: dimSums.effectiveness.length ? round1(avg(dimSums.effectiveness)) : null,
      clarity: dimSums.clarity.length ? round1(avg(dimSums.clarity)) : null,
      coacheeAutonomy: dimSums.coacheeAutonomy.length ? round1(avg(dimSums.coacheeAutonomy)) : null,
      coacheeSatisfaction: dimSums.coacheeSatisfaction.length ? round1(avg(dimSums.coacheeSatisfaction)) : null,
    },
    scoreHistogram: histogram,
    underusedScenarios,
    learningImpact,
    calibration: {
      sessionCount: calibrationSuppressed ? null : calibrationSessions,
      suppressed: calibrationSuppressed,
      avgSelfRating: !calibrationSuppressed && calibrationSessions
        ? round1(selfSum / calibrationSessions)
        : null,
      avgEvidenceRating: !calibrationSuppressed && calibrationSessions
        ? round1(evidenceSum / calibrationSessions)
        : null,
    },
    daily: dailyArray,
    catalogSize: {
      frameworks: catalog.length,
      scenarios: SCENARIOS.length,
    },
    frameworkNames,
    scenarioNames,
  };
}

module.exports = {
  K_ANONYMITY,
  computePracticeAdminStats,
  parseScores,
};
