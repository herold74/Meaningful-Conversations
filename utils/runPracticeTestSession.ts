import { CoachPracticeConfig, Message, PracticeDifficulty } from '../types';
import {
  sendPracticeMessageStream,
  evaluatePracticeSession,
  generatePracticeCoachTurn,
} from '../services/geminiService';
import { TestRunResult } from './testScenarios';
import {
  getSamStageGoals,
  getScriptedCoachText,
  getStageGoalText,
  PracticeLabMode,
  SAM_PRACTICE_FRAMEWORK_ID,
  SAM_STAGE_COMPLETE_TURNS,
} from './practiceLabScripts';
import {
  compareToBaseline,
  PracticeRegressionSnapshot,
  validateScoreBands,
} from './practiceRegression';

export interface RunPracticeTestOptions {
  scenarioId: string;
  labMode: PracticeLabMode;
  difficulty: PracticeDifficulty;
  language: 'de' | 'en';
  selfRating?: number;
  baseline?: PracticeRegressionSnapshot | null;
  onTurn?: (index: number, total: number) => void;
}

export async function runPracticeTestSession(
  options: RunPracticeTestOptions,
): Promise<TestRunResult> {
  const {
    scenarioId,
    labMode,
    difficulty,
    language,
    selfRating = 8,
    baseline = null,
    onTurn,
  } = options;

  const stageGoals = getSamStageGoals(scenarioId);
  const totalTurns = SAM_STAGE_COMPLETE_TURNS;

  const practiceConfig: CoachPracticeConfig = {
    frameworkId: SAM_PRACTICE_FRAMEWORK_ID,
    frameworkName: 'Sam · Forward-focused',
    scenarioId,
    scenarioName: scenarioId,
    coacheeName: 'Practice Coachee',
    coacheeAvatar: '🧑‍💼',
    difficulty,
    difficultyLabel: difficulty,
    liveMode: false,
    scopeBoundaryTheme: null,
  };

  const responses: TestRunResult['responses'] = [];
  const chatHistory: Message[] = [];
  const stagesUsed: string[] = [];

  for (let i = 0; i < totalTurns; i++) {
    onTurn?.(i, totalTurns);
    const stage = stageGoals[i]?.stage ?? `turn-${i + 1}`;
    stagesUsed.push(stage);

    let coachText: string;
    if (labMode === 'scripted') {
      coachText = getScriptedCoachText(scenarioId, i, language);
    } else {
      try {
        const result = await generatePracticeCoachTurn({
          frameworkId: SAM_PRACTICE_FRAMEWORK_ID,
          scenarioId,
          history: chatHistory,
          stage,
          stageGoal: getStageGoalText(scenarioId, i, language),
          language,
          turnIndex: i,
          totalTurns,
        });
        coachText = result.text;
      } catch {
        coachText = getScriptedCoachText(scenarioId, i, language);
      }
    }

    chatHistory.push({
      id: `practice-coach-${i}`,
      role: 'user',
      text: coachText,
      timestamp: new Date().toISOString(),
    });

    const startTime = Date.now();
    const result = await sendPracticeMessageStream(
      practiceConfig,
      chatHistory,
      language,
      () => {},
    );
    const responseTime = Date.now() - startTime;

    chatHistory.push({
      id: `practice-coachee-${i}`,
      role: 'bot',
      text: result.text,
      timestamp: new Date().toISOString(),
    });

    responses.push({
      userMessage: coachText,
      botResponse: result.text,
      responseTime,
    });
  }

  const evalResult = await evaluatePracticeSession(
    practiceConfig,
    chatHistory,
    language,
    selfRating,
  );

  const ev = evalResult.evaluation;
  const scoresValid = typeof ev.overallScore === 'number'
    && ev.overallScore >= 1 && ev.overallScore <= 10
    && ev.methodCompliance?.score >= 1 && ev.methodCompliance?.score <= 10
    && ev.effectiveness?.score >= 1 && ev.effectiveness?.score <= 10
    && ev.clarity?.score >= 1 && ev.clarity?.score <= 10
    && ev.coacheeAutonomy?.score != null && ev.coacheeAutonomy.score >= 1 && ev.coacheeAutonomy.score <= 10
    && ev.coacheeSatisfaction?.score >= 1 && ev.coacheeSatisfaction?.score <= 10;

  const scoreBands = validateScoreBands({
    overallScore: ev.overallScore,
    methodCompliance: ev.methodCompliance?.score ?? 0,
    effectiveness: ev.effectiveness?.score ?? 0,
    clarity: ev.clarity?.score ?? 0,
    coacheeAutonomy: ev.coacheeAutonomy?.score ?? null,
    coacheeSatisfaction: ev.coacheeSatisfaction?.score ?? 0,
    sessionFlowCoherent: ev.sessionFlow?.coherent === true,
  });

  const autoCheckResults: TestRunResult['autoCheckResults'] = [
    {
      checkId: 'practice_eval',
      passed: scoresValid,
      details: 'Practice evaluation returned valid scores',
    },
    {
      checkId: 'practice_score_bands',
      passed: scoreBands.ok,
      details: scoreBands.details,
    },
    {
      checkId: 'practice_persist',
      passed: !!evalResult.id && !evalResult.saveWarning,
      details: evalResult.saveWarning
        ? `Save warning: ${evalResult.saveWarning}`
        : 'Evaluation persisted',
    },
  ];

  if (baseline) {
    const regression = compareToBaseline(baseline, {
      scenarioId: `practice_lab_sam_${scenarioId}_${labMode}`,
      botId: 'sam-forward-focused',
      profileId: 'n/a',
      timestamp: new Date().toISOString(),
      responses,
      autoCheckResults,
      manualCheckResults: [],
      practiceEvaluation: evalResult,
    });
    autoCheckResults.push({
      checkId: 'practice_regression',
      passed: regression.ok,
      details: regression.summary,
    });
  }

  return {
    scenarioId: `practice_lab_sam_${scenarioId}_${labMode}`,
    botId: 'sam-forward-focused',
    profileId: 'n/a',
    timestamp: new Date().toISOString(),
    responses,
    autoCheckResults,
    manualCheckResults: [],
    practiceEvaluation: evalResult,
    practiceLabMeta: { labMode, stagesUsed, scenarioId },
  };
}
