/**
 * GDPR-safe aggregate stats for The Connector (admin dashboard).
 * Returns counts and averages only — no userId, no transcript, no evaluation text.
 * k-anonymity: metrics that could identify individuals are suppressed when n < K.
 */

const { CONNECTOR_VIGNETTES } = require('../connector/vignettes.js');
const { CONNECTOR_DIMENSIONS } = require('../connector/evaluationPrompts.js');

const K_ANONYMITY = 5;
const END_TYPES = ['heard', 'timeout', 'aborted'];

const round1 = (n) => Math.round(n * 10) / 10;
const avg = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);

function suppressCount(count) {
  return count > 0 && count < K_ANONYMITY;
}

function bucketRow(id, count, scores, options = {}) {
  const suppressCountMetric = options.suppressCount !== false;
  const suppressed = suppressCountMetric && suppressCount(count);
  const hideAvg = count > 0 && count < K_ANONYMITY;
  return {
    id,
    count: suppressed ? null : count,
    suppressed,
    displayCount: suppressed ? `<${K_ANONYMITY}` : String(count),
    avgScore: !hideAvg && scores.length ? round1(avg(scores)) : null,
  };
}

/**
 * @param {Array<{ overallScore: number; empathy: number; presence: number; curiosity: number; nonJudgment: number; steadiness: number; vignetteIds: unknown; endTypes: unknown; language: string; liveMode: boolean; createdAt: Date }>} rows
 * @param {number} activeUserCount distinct users who completed evaluate (from ApiUsage metadata)
 * @param {{ days?: number; language?: string }} options
 */
function computeConnectorAdminStats(rows, activeUserCount, options = {}) {
  const days = Math.min(Math.max(Number(options.days) || 90, 7), 365);
  const language = options.language === 'en' ? 'en' : 'de';
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

  const vignetteNames = Object.fromEntries(
    CONNECTOR_VIGNETTES.map((v) => [v.id, v.personaName]),
  );

  const inRange = rows.filter((r) => {
    const d = r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt);
    return d >= start && d <= end;
  });

  const overallScores = [];
  const dimSums = Object.fromEntries(CONNECTOR_DIMENSIONS.map((d) => [d, []]));
  const histogram = Object.fromEntries([...Array(10)].map((_, i) => [String(i + 1), 0]));

  const byVignette = new Map();
  const byEndType = new Map(END_TYPES.map((t) => [t, { count: 0, scores: [] }]));
  const byLiveMode = { text: { count: 0, scores: [] }, voice: { count: 0, scores: [] } };
  const daily = new Map();

  for (const row of inRange) {
    if (typeof row.overallScore !== 'number') continue;

    overallScores.push(row.overallScore);
    histogram[String(Math.min(10, Math.max(1, Math.round(row.overallScore))))] =
      (histogram[String(Math.min(10, Math.max(1, Math.round(row.overallScore))))] || 0) + 1;

    for (const dim of CONNECTOR_DIMENSIONS) {
      if (typeof row[dim] === 'number') dimSums[dim].push(row[dim]);
    }

    const vignetteIds = Array.isArray(row.vignetteIds) ? row.vignetteIds : [];
    for (const vid of vignetteIds) {
      if (typeof vid !== 'string') continue;
      if (!byVignette.has(vid)) byVignette.set(vid, { count: 0, scores: [] });
      const vRow = byVignette.get(vid);
      vRow.count += 1;
      vRow.scores.push(row.overallScore);
    }

    const endTypes = Array.isArray(row.endTypes) ? row.endTypes : [];
    for (const et of endTypes) {
      if (!byEndType.has(et)) continue;
      const eRow = byEndType.get(et);
      eRow.count += 1;
      eRow.scores.push(row.overallScore);
    }

    const modeKey = row.liveMode ? 'voice' : 'text';
    byLiveMode[modeKey].count += 1;
    byLiveMode[modeKey].scores.push(row.overallScore);

    const dateKey = (row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt))
      .toISOString()
      .slice(0, 10);
    daily.set(dateKey, (daily.get(dateKey) || 0) + 1);
  }

  const usersSuppressed = activeUserCount > 0 && activeUserCount < K_ANONYMITY;

  const vignetteStats = CONNECTOR_VIGNETTES.map((v) => {
    const entry = byVignette.get(v.id) || { count: 0, scores: [] };
    return {
      ...bucketRow(v.id, entry.count, entry.scores),
      name: v.personaName,
    };
  }).sort((a, b) => (b.count || 0) - (a.count || 0));

  const endTypeStats = {};
  for (const [type, entry] of byEndType.entries()) {
    endTypeStats[type] = bucketRow(type, entry.count, entry.scores, { suppressCount: false });
  }

  const totalEndTypeEvents = END_TYPES.reduce((sum, t) => sum + (byEndType.get(t)?.count || 0), 0);
  const heardCount = byEndType.get('heard')?.count || 0;
  const heardRate = inRange.length >= K_ANONYMITY && totalEndTypeEvents > 0
    ? round1((heardCount / totalEndTypeEvents) * 100)
    : null;

  const liveModeStats = {
    text: bucketRow('text', byLiveMode.text.count, byLiveMode.text.scores, { suppressCount: false }),
    voice: bucketRow('voice', byLiveMode.voice.count, byLiveMode.voice.scores, { suppressCount: false }),
  };

  const dailyArray = [...daily.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const dimensionAverages = {};
  for (const dim of CONNECTOR_DIMENSIONS) {
    dimensionAverages[dim] = dimSums[dim].length ? round1(avg(dimSums[dim])) : null;
  }

  return {
    period: {
      start: start.toISOString(),
      end: end.toISOString(),
      days,
    },
    kAnonymityThreshold: K_ANONYMITY,
    gdprNote: language === 'de'
      ? 'Nur aggregierte Daten. Keine Personen-, Transkript- oder Bewertungstexte.'
      : 'Aggregated data only. No personal, transcript, or evaluation text.',
    totals: {
      completedRuns: inRange.length,
      activeUsers: usersSuppressed ? null : activeUserCount,
      activeUsersSuppressed: usersSuppressed,
      avgOverallScore: overallScores.length ? round1(avg(overallScores)) : null,
      heardRatePercent: heardRate,
    },
    byVignette: vignetteStats,
    byEndType: endTypeStats,
    byLiveMode: liveModeStats,
    dimensionAverages,
    scoreHistogram: histogram,
    daily: dailyArray,
    catalogSize: {
      vignettes: CONNECTOR_VIGNETTES.length,
    },
    vignetteNames,
  };
}

module.exports = {
  K_ANONYMITY,
  computeConnectorAdminStats,
};
