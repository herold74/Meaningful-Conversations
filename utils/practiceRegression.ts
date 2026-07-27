import { PracticeDifficulty } from '../types';
import { PracticeLabMode } from './practiceLabScripts';
import { TestRunResult } from './testScenarios';

export const PRACTICE_REGRESSION_VERSION = 1;
export const REGRESSION_METHOD_DELTA_THRESHOLD = 2;

export interface PracticeRegressionScores {
  overallScore: number;
  methodCompliance: number;
  effectiveness: number;
  clarity: number;
  coacheeAutonomy: number | null;
  coacheeSatisfaction: number;
  sessionFlowCoherent: boolean;
}

export interface PracticeRegressionSnapshot {
  version: typeof PRACTICE_REGRESSION_VERSION;
  exportedAt: string;
  scenarioId: string;
  labMode: PracticeLabMode;
  language: 'de' | 'en';
  difficulty: PracticeDifficulty;
  transcript: { coach: string; coachee: string; stage?: string }[];
  scores: PracticeRegressionScores;
}

export interface RegressionDelta {
  field: keyof PracticeRegressionScores;
  baseline: number | boolean | null;
  current: number | boolean | null;
  delta: number | null;
  flagged: boolean;
}

export interface RegressionCompareResult {
  ok: boolean;
  deltas: RegressionDelta[];
  flaggedFields: string[];
  summary: string;
}

function extractScores(result: TestRunResult): PracticeRegressionScores | null {
  const ev = result.practiceEvaluation?.evaluation;
  if (!ev) return null;
  return {
    overallScore: ev.overallScore,
    methodCompliance: ev.methodCompliance?.score ?? 0,
    effectiveness: ev.effectiveness?.score ?? 0,
    clarity: ev.clarity?.score ?? 0,
    coacheeAutonomy: ev.coacheeAutonomy?.score ?? null,
    coacheeSatisfaction: ev.coacheeSatisfaction?.score ?? 0,
    sessionFlowCoherent: ev.sessionFlow?.coherent === true,
  };
}

export function buildRegressionSnapshot(
  scenarioId: string,
  labMode: PracticeLabMode,
  language: 'de' | 'en',
  difficulty: PracticeDifficulty,
  result: TestRunResult,
  stages?: string[],
): PracticeRegressionSnapshot | null {
  const scores = extractScores(result);
  if (!scores) return null;

  return {
    version: PRACTICE_REGRESSION_VERSION,
    exportedAt: new Date().toISOString(),
    scenarioId,
    labMode,
    language,
    difficulty,
    transcript: result.responses.map((r, i) => ({
      coach: r.userMessage,
      coachee: r.botResponse,
      stage: stages?.[i],
    })),
    scores,
  };
}

export function parseRegressionSnapshot(json: string): PracticeRegressionSnapshot {
  const data = JSON.parse(json) as PracticeRegressionSnapshot;
  if (data.version !== PRACTICE_REGRESSION_VERSION) {
    throw new Error(`Unsupported regression snapshot version: ${data.version}`);
  }
  if (!data.scores || !data.scenarioId) {
    throw new Error('Invalid regression snapshot: missing scores or scenarioId');
  }
  return data;
}

export function compareToBaseline(
  baseline: PracticeRegressionSnapshot,
  result: TestRunResult,
): RegressionCompareResult {
  const current = extractScores(result);
  if (!current) {
    return {
      ok: false,
      deltas: [],
      flaggedFields: ['evaluation'],
      summary: 'Current run has no evaluation scores',
    };
  }

  const numericFields: (keyof PracticeRegressionScores)[] = [
    'overallScore',
    'methodCompliance',
    'effectiveness',
    'clarity',
    'coacheeAutonomy',
    'coacheeSatisfaction',
  ];

  const deltas: RegressionDelta[] = [];
  const flaggedFields: string[] = [];

  for (const field of numericFields) {
    const baseVal = baseline.scores[field] as number | null;
    const curVal = current[field] as number | null;
    if (baseVal == null || curVal == null) continue;

    const delta = curVal - baseVal;
    const flagged = Math.abs(delta) > REGRESSION_METHOD_DELTA_THRESHOLD
      && (field === 'methodCompliance' || field === 'overallScore');
    if (flagged) flaggedFields.push(field);

    deltas.push({ field, baseline: baseVal, current: curVal, delta, flagged });
  }

  const flowDelta: RegressionDelta = {
    field: 'sessionFlowCoherent',
    baseline: baseline.scores.sessionFlowCoherent,
    current: current.sessionFlowCoherent,
    delta: null,
    flagged: baseline.scores.sessionFlowCoherent === true && current.sessionFlowCoherent === false,
  };
  deltas.push(flowDelta);
  if (flowDelta.flagged) flaggedFields.push('sessionFlowCoherent');

  const ok = flaggedFields.length === 0;
  const summary = ok
    ? 'No significant regression vs baseline'
    : `Regression flagged: ${flaggedFields.join(', ')}`;

  return { ok, deltas, flaggedFields, summary };
}

export function validateScoreBands(scores: PracticeRegressionScores): { ok: boolean; details: string } {
  const inRange = (n: number | null) => n == null || (n >= 1 && n <= 10);
  const ok = inRange(scores.overallScore)
    && inRange(scores.methodCompliance)
    && inRange(scores.effectiveness)
    && inRange(scores.clarity)
    && inRange(scores.coacheeAutonomy)
    && inRange(scores.coacheeSatisfaction);

  return {
    ok,
    details: ok ? 'All scores in valid 1–10 range' : 'One or more scores outside 1–10 range',
  };
}
