import {
  PracticeDifficulty,
  PracticeEvaluationSummary,
  PracticePhase2Context,
} from '../types';

const DIFFICULTY_RANK: Record<PracticeDifficulty, number> = {
  easy: 0,
  moderate: 1,
  challenging: 2,
  hard: 3,
};

export interface ContractingScenarioProgress {
  scenarioId: string;
  highestDifficulty: PracticeDifficulty | null;
  highestDifficultyLabel: string | null;
  /** Latest contracting evaluation suitable for Phase 2 follow-up. */
  followUpSource: PracticeEvaluationSummary | null;
  followUpCompleted: boolean;
}

const isContractingEval = (ev: PracticeEvaluationSummary) =>
  ev.frameworkId === 'contracting' || ev.evaluationData.practiceMode === 'contracting';

const hasFollowUpArtifacts = (ev: PracticeEvaluationSummary) => {
  const data = ev.evaluationData;
  const hasConcern = !!(data.clarifiedConcern?.trim() || data.sessionContract?.trim());
  const hasTranscript = !!data.transcript?.trim();
  return hasConcern && hasTranscript;
};

export const buildContractingProgressMap = (
  evaluations: PracticeEvaluationSummary[],
  difficultyLabels: Record<string, string>,
): Map<string, ContractingScenarioProgress> => {
  const map = new Map<string, ContractingScenarioProgress>();
  const contractingEvals = evaluations.filter(isContractingEval);

  const followUpDoneIds = new Set<string>();
  for (const ev of evaluations) {
    const link = ev.evaluationData.followsContractingEvaluationId;
    if (link) followUpDoneIds.add(link);
  }

  for (const ev of contractingEvals) {
    const existing = map.get(ev.scenarioId) ?? {
      scenarioId: ev.scenarioId,
      highestDifficulty: null,
      highestDifficultyLabel: null,
      followUpSource: null,
      followUpCompleted: false,
    };

    const diff = ev.difficulty as PracticeDifficulty;
    if (
      DIFFICULTY_RANK[diff] !== undefined
      && (existing.highestDifficulty === null
        || DIFFICULTY_RANK[diff] > DIFFICULTY_RANK[existing.highestDifficulty])
    ) {
      existing.highestDifficulty = diff;
      existing.highestDifficultyLabel = difficultyLabels[diff] || diff;
    }

    if (hasFollowUpArtifacts(ev)) {
      const prev = existing.followUpSource;
      if (!prev || new Date(ev.createdAt) > new Date(prev.createdAt)) {
        existing.followUpSource = ev;
      }
    }

    map.set(ev.scenarioId, existing);
  }

  for (const entry of map.values()) {
    if (entry.followUpSource) {
      entry.followUpCompleted = followUpDoneIds.has(entry.followUpSource.id);
    }
  }

  return map;
};

export const buildMethodScenarioProgressMap = (
  evaluations: PracticeEvaluationSummary[],
  difficultyLabels: Record<string, string>,
): Map<string, { highestDifficulty: PracticeDifficulty | null; highestDifficultyLabel: string | null }> => {
  const map = new Map<string, { highestDifficulty: PracticeDifficulty | null; highestDifficultyLabel: string | null }>();

  for (const ev of evaluations) {
    if (isContractingEval(ev) || ev.frameworkId === 'free-play') continue;

    const existing = map.get(ev.scenarioId) ?? {
      highestDifficulty: null,
      highestDifficultyLabel: null,
    };

    const diff = ev.difficulty as PracticeDifficulty;
    if (
      DIFFICULTY_RANK[diff] !== undefined
      && (existing.highestDifficulty === null
        || DIFFICULTY_RANK[diff] > DIFFICULTY_RANK[existing.highestDifficulty])
    ) {
      existing.highestDifficulty = diff;
      existing.highestDifficultyLabel = difficultyLabels[diff] || diff;
    }

    map.set(ev.scenarioId, existing);
  }

  return map;
};

export const buildPhase2ContextFromEvaluation = (
  evaluation: PracticeEvaluationSummary,
  coachee: { coacheeName: string; avatar: string; coacheeGender?: 'male' | 'female' },
  difficultyLabels: Record<string, string>,
): PracticePhase2Context => {
  const data = evaluation.evaluationData;
  const difficulty = evaluation.difficulty as PracticeDifficulty;
  return {
    scenarioId: evaluation.scenarioId,
    coacheeName: coachee.coacheeName,
    coacheeAvatar: coachee.avatar,
    coacheeGender: coachee.coacheeGender,
    difficulty,
    difficultyLabel: difficultyLabels[difficulty] || evaluation.difficulty,
    liveMode: data.liveMode === true,
    priorTranscript: data.transcript?.trim() || '',
    clarifiedConcern: data.clarifiedConcern?.trim()
      || data.sessionContract?.trim()
      || '',
    sessionContract: data.sessionContract,
    contractingEvaluationId: evaluation.id,
  };
};
