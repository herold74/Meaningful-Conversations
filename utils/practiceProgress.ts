import {
  CoachPracticeConfig,
  PracticeCatalog,
  PracticeEvaluationSummary,
  PracticeDifficulty,
} from '../types';

export type PracticeLevelId = 'beginner' | 'developing' | 'advanced' | 'expert';

export interface PracticeDimensionAverages {
  methodCompliance: number;
  effectiveness: number;
  clarity: number;
  coacheeAutonomy: number | null;
  coacheeSatisfaction: number;
}

export interface PracticeFrameworkStat {
  frameworkId: string;
  count: number;
  averageScore: number;
  lastScore: number;
  scores: number[];
  dimensionAverages: PracticeDimensionAverages;
}

export interface PracticeMilestone {
  id: string;
  achieved: boolean;
}

export interface PracticeProgressStats {
  totalSessions: number;
  averageScore: number;
  bestScore: number;
  trendDelta: number | null;
  practiceLevel: PracticeLevelId;
  dimensionAverages: PracticeDimensionAverages;
  recentDimensionAverages: PracticeDimensionAverages | null;
  scoreTimeline: Array<{ id: string; date: string; score: number; frameworkId: string }>;
  frameworkStats: PracticeFrameworkStat[];
  difficultyCounts: Record<string, number>;
  recurringDevelopmentAreas: Array<{ text: string; count: number }>;
  nextDrill: { action: string; rationale: string } | null;
  milestones: PracticeMilestone[];
  activityDates: string[];
  calibration: { avgSelf: number; avgEvidence: number; count: number } | null;
  latestEvaluation: PracticeEvaluationSummary | null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

const avg = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

const PRACTICE_SENTINEL_FRAMEWORKS = new Set(['contracting', 'free-play']);

const dimensionsFromEval = (ev: PracticeEvaluationSummary): PracticeDimensionAverages => ({
  methodCompliance: ev.evaluationData.methodCompliance?.score ?? 0,
  effectiveness: ev.evaluationData.effectiveness.score,
  clarity: ev.evaluationData.clarity.score,
  coacheeAutonomy: ev.evaluationData.coacheeAutonomy?.score ?? null,
  coacheeSatisfaction: ev.evaluationData.coacheeSatisfaction.score,
});

const avgDimensions = (items: PracticeEvaluationSummary[]): PracticeDimensionAverages => {
  if (!items.length) {
    return { methodCompliance: 0, effectiveness: 0, clarity: 0, coacheeAutonomy: null, coacheeSatisfaction: 0 };
  }
  const dims = items.map(dimensionsFromEval);
  const autonomyValues = dims.map((d) => d.coacheeAutonomy).filter((v): v is number => v !== null);
  return {
    methodCompliance: round1(avg(dims.map((d) => d.methodCompliance))),
    effectiveness: round1(avg(dims.map((d) => d.effectiveness))),
    clarity: round1(avg(dims.map((d) => d.clarity))),
    coacheeAutonomy: autonomyValues.length ? round1(avg(autonomyValues)) : null,
    coacheeSatisfaction: round1(avg(dims.map((d) => d.coacheeSatisfaction))),
  };
};

export const practiceLevelFromSessions = (count: number): PracticeLevelId => {
  if (count >= 20) return 'expert';
  if (count >= 12) return 'advanced';
  if (count >= 5) return 'developing';
  return 'beginner';
};

export const computePracticeProgress = (
  evaluations: PracticeEvaluationSummary[],
): PracticeProgressStats => {
  const sorted = [...evaluations].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const scores = sorted.map((e) => e.overallScore);
  const totalSessions = sorted.length;
  const averageScore = round1(avg(scores));
  const bestScore = scores.length ? Math.max(...scores) : 0;

  const recent = sorted.slice(-5);
  const previous = sorted.slice(-10, -5);
  const trendDelta =
    recent.length >= 3 && previous.length >= 1
      ? round1(avg(recent.map((e) => e.overallScore)) - avg(previous.map((e) => e.overallScore)))
      : null;

  const dimensionAverages = avgDimensions(sorted);
  const recentDimensionAverages = recent.length ? avgDimensions(recent) : null;

  const frameworkMap = new Map<string, PracticeEvaluationSummary[]>();
  for (const ev of sorted) {
    if (PRACTICE_SENTINEL_FRAMEWORKS.has(ev.frameworkId)) continue;
    const list = frameworkMap.get(ev.frameworkId) || [];
    list.push(ev);
    frameworkMap.set(ev.frameworkId, list);
  }

  const frameworkStats: PracticeFrameworkStat[] = [...frameworkMap.entries()]
    .map(([frameworkId, items]) => {
      const fwScores = items.map((e) => e.overallScore);
      return {
        frameworkId,
        count: items.length,
        averageScore: round1(avg(fwScores)),
        lastScore: items[items.length - 1].overallScore,
        scores: fwScores,
        dimensionAverages: avgDimensions(items),
      };
    })
    .sort((a, b) => b.count - a.count);

  const difficultyCounts: Record<string, number> = {};
  for (const ev of sorted) {
    difficultyCounts[ev.difficulty] = (difficultyCounts[ev.difficulty] || 0) + 1;
  }

  const devAreaCounts = new Map<string, { text: string; count: number }>();
  for (const ev of sorted) {
    for (const area of ev.evaluationData.developmentAreas || []) {
      const trimmed = area.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      const existing = devAreaCounts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        devAreaCounts.set(key, { text: trimmed, count: 1 });
      }
    }
  }
  const recurringDevelopmentAreas = [...devAreaCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const latest = sorted[sorted.length - 1] || null;
  const nextDrill = latest?.evaluationData.nextDrills?.[0] ?? null;

  const uniqueFrameworks = frameworkMap.size;
  const hasChallenging = sorted.some((e) => e.difficulty === 'challenging');
  const hasHard = sorted.some((e) => e.difficulty === 'hard');
  const hasLiveOverlay = sorted.some((e) => e.evaluationData.liveMode === true);
  const hasHighScore = sorted.some((e) => e.overallScore >= 8);

  const milestones: PracticeMilestone[] = [
    { id: 'first_session', achieved: totalSessions >= 1 },
    { id: 'five_sessions', achieved: totalSessions >= 5 },
    { id: 'three_frameworks', achieved: uniqueFrameworks >= 3 },
    { id: 'score_eight', achieved: hasHighScore },
    { id: 'challenging_done', achieved: hasChallenging },
    { id: 'hard_done', achieved: hasHard },
    { id: 'live_overlay_done', achieved: hasLiveOverlay },
  ];

  const activityDates = [...new Set(sorted.map((e) => e.createdAt.slice(0, 10)))];

  const calibrationSessions = sorted.filter(
    (e) => e.evaluationData.calibration?.selfRating > 0,
  );
  const calibration =
    calibrationSessions.length > 0
      ? {
          avgSelf: round1(
            avg(calibrationSessions.map((e) => e.evaluationData.calibration.selfRating)),
          ),
          avgEvidence: round1(
            avg(calibrationSessions.map((e) => e.evaluationData.calibration.evidenceRating)),
          ),
          count: calibrationSessions.length,
        }
      : null;

  return {
    totalSessions,
    averageScore,
    bestScore,
    trendDelta,
    practiceLevel: practiceLevelFromSessions(totalSessions),
    dimensionAverages,
    recentDimensionAverages,
    scoreTimeline: sorted.map((e) => ({
      id: e.id,
      date: e.createdAt,
      score: e.overallScore,
      frameworkId: e.frameworkId,
    })),
    frameworkStats,
    difficultyCounts,
    recurringDevelopmentAreas,
    nextDrill,
    milestones,
    activityDates,
    calibration,
    latestEvaluation: latest,
  };
};

export const buildRecommendedPracticeConfig = (
  stats: PracticeProgressStats,
  catalog: PracticeCatalog,
): CoachPracticeConfig | null => {
  const latest = stats.latestEvaluation;

  const defaultPair = catalog.defaultPair;
  const frameworkId = latest?.frameworkId ?? defaultPair?.frameworkId;
  const scenarioId = latest?.scenarioId ?? defaultPair?.scenarioId;

  if (frameworkId && PRACTICE_SENTINEL_FRAMEWORKS.has(frameworkId)) {
    const scenario = catalog.scenarios.find((s) => s.id === scenarioId) || catalog.scenarios[0];
    const framework = catalog.frameworks.find((f) => !f.locked) || catalog.frameworks[0];
    if (!framework || !scenario) return null;
    const difficulty = (latest?.difficulty as PracticeDifficulty) || 'moderate';
    const difficultyLabel =
      catalog.difficulties.find((d) => d.id === difficulty)?.label || difficulty;
    return {
      frameworkId: framework.id,
      frameworkName: framework.name,
      scenarioId: scenario.id,
      scenarioName: scenario.concern,
      coacheeName: scenario.coacheeName,
      coacheeAvatar: scenario.avatar,
      coacheeGender: scenario.coacheeGender,
      difficulty,
      difficultyLabel,
      focusNote: stats.nextDrill?.action?.trim() || undefined,
      liveMode: false,
      scopeBoundaryTheme: null,
      practiceMode: 'method',
    };
  }

  const framework = catalog.frameworks.find((f) => f.id === frameworkId) || catalog.frameworks[0];
  const scenario = catalog.scenarios.find((s) => s.id === scenarioId) || catalog.scenarios[0];
  if (!framework || !scenario) return null;

  const difficulty = (latest?.difficulty as PracticeDifficulty) || 'moderate';
  const difficultyLabel =
    catalog.difficulties.find((d) => d.id === difficulty)?.label || difficulty;

  const focusNote = stats.nextDrill?.action?.trim() || undefined;

  return {
    frameworkId: framework.id,
    frameworkName: framework.name,
    scenarioId: scenario.id,
    scenarioName: scenario.concern,
    coacheeName: scenario.coacheeName,
    coacheeAvatar: scenario.avatar,
    coacheeGender: scenario.coacheeGender,
    difficulty,
    difficultyLabel,
    focusNote,
      liveMode: false,
      scopeBoundaryTheme: null,
      practiceMode: 'method',
    };
  };

export const scoreColorClass = (score: number, max = 10): string => {
  const ratio = score / max;
  if (ratio >= 0.7) return 'bg-status-success-background text-status-success-foreground';
  if (ratio >= 0.4) return 'bg-status-warning-background text-status-warning-foreground';
  return 'bg-status-danger-background text-status-danger-foreground';
};
