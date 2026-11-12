import type { ConnectorEndType, ConnectorEvaluationResult, Message } from '../types';
import { evaluateConnectorRun, sendConnectorTurnStream } from '../services/geminiService';
import { TestRunResult } from './testScenarios';
import {
  CONNECTOR_LAB_VIGNETTES,
  ConnectorLabVignetteId,
  getConnectorLabOpening,
  getConnectorLabScriptedTurns,
} from './connectorLabScripts';

export type ConnectorLabScope = 'single' | 'all';

const CONNECTOR_DIMENSIONS = ['empathy', 'presence', 'curiosity', 'nonJudgment', 'steadiness'] as const;

export interface RunConnectorTestOptions {
  vignetteId: ConnectorLabVignetteId;
  scope: ConnectorLabScope;
  language: 'de' | 'en';
  onVignette?: (index: number, total: number, vignetteId: string) => void;
  onTurn?: (turnIndex: number, maxTurns: number) => void;
}

function validateConnectorEvaluation(ev: ConnectorEvaluationResult): { ok: boolean; details: string } {
  const dimScores = CONNECTOR_DIMENSIONS.map((d) => ev[d]?.score).filter((s) => typeof s === 'number');
  const valid = dimScores.length === CONNECTOR_DIMENSIONS.length
    && dimScores.every((s) => s >= 1 && s <= 10)
    && typeof ev.overallScore === 'number'
    && ev.overallScore >= 1
    && ev.overallScore <= 10;
  return {
    ok: valid,
    details: valid
      ? `Overall ${ev.overallScore}/10, dimensions ${dimScores.join(', ')}`
      : 'Invalid or missing dimension scores',
  };
}

async function runSingleVignette(
  vignetteId: ConnectorLabVignetteId,
  language: 'de' | 'en',
  onTurn?: (turnIndex: number, maxTurns: number) => void,
): Promise<{
  entry: { vignetteId: string; history: Message[]; endType: ConnectorEndType };
  responses: TestRunResult['responses'];
}> {
  const opening = getConnectorLabOpening(vignetteId, language);
  const scriptedTurns = getConnectorLabScriptedTurns(vignetteId, language);
  const history: Message[] = [
    {
      id: `connector-bot-open-${vignetteId}`,
      role: 'bot',
      text: opening,
      timestamp: new Date().toISOString(),
    },
  ];
  const responses: TestRunResult['responses'] = [];
  let endType: ConnectorEndType = 'timeout';

  for (let i = 0; i < scriptedTurns.length; i += 1) {
    onTurn?.(i, scriptedTurns.length);
    const userText = scriptedTurns[i];
    const historyWithUser: Message[] = [
      ...history,
      {
        id: `connector-user-${vignetteId}-${i}`,
        role: 'user',
        text: userText,
        timestamp: new Date().toISOString(),
      },
    ];

    const startTime = Date.now();
    const result = await sendConnectorTurnStream(
      vignetteId,
      historyWithUser,
      language,
      false,
      () => {},
    );
    const responseTime = Date.now() - startTime;

    history.push(historyWithUser[historyWithUser.length - 1]);
    history.push({
      id: `connector-bot-${vignetteId}-${i}`,
      role: 'bot',
      text: result.text,
      timestamp: new Date().toISOString(),
    });

    responses.push({
      userMessage: userText,
      botResponse: result.text,
      responseTime,
    });

    if (result.endType === 'heard') {
      endType = 'heard';
      break;
    }
    if (result.ended) {
      endType = result.endType ?? 'timeout';
      break;
    }
  }

  return {
    entry: { vignetteId, history, endType },
    responses,
  };
}

export async function runConnectorTestSession(
  options: RunConnectorTestOptions,
): Promise<TestRunResult> {
  const { vignetteId, scope, language, onVignette, onTurn } = options;
  const vignetteIds: ConnectorLabVignetteId[] = scope === 'all'
    ? CONNECTOR_LAB_VIGNETTES.map((v) => v.id)
    : [vignetteId];

  const allResponses: TestRunResult['responses'] = [];
  const entries: { vignetteId: string; history: Message[]; endType: ConnectorEndType }[] = [];
  const endTypes: ConnectorEndType[] = [];

  for (let v = 0; v < vignetteIds.length; v += 1) {
    const id = vignetteIds[v];
    onVignette?.(v, vignetteIds.length, id);
    const { entry, responses } = await runSingleVignette(id, language, onTurn);
    entries.push(entry);
    endTypes.push(entry.endType);
    allResponses.push(...responses);
  }

  const evalResult = await evaluateConnectorRun(entries, language, false);
  const ev = evalResult.evaluation;
  const validation = validateConnectorEvaluation(ev);
  const heardCount = endTypes.filter((e) => e === 'heard').length;
  const highScore = (ev.overallScore ?? 0) >= 8;

  const autoCheckResults: TestRunResult['autoCheckResults'] = [
    {
      checkId: 'connector_eval_valid',
      passed: validation.ok,
      details: validation.details,
    },
    {
      checkId: 'connector_high_score',
      passed: highScore,
      details: `Overall score ${ev.overallScore ?? '—'}/10 (target ≥8 for scripted baseline)`,
    },
    {
      checkId: 'connector_heard_end',
      passed: heardCount > 0,
      details: `${heardCount}/${endTypes.length} vignette(s) ended with "heard"`,
    },
  ];

  return {
    scenarioId: scope === 'all'
      ? `connector_lab_all_${language}`
      : `connector_lab_${vignetteId}_${language}`,
    botId: 'the-connector',
    profileId: 'n/a',
    timestamp: new Date().toISOString(),
    responses: allResponses,
    autoCheckResults,
    manualCheckResults: [],
    connectorEvaluation: {
      evaluation: ev,
      durationMs: evalResult.durationMs,
    },
    connectorLabMeta: {
      scope,
      vignetteIds,
      endTypes,
    },
  };
}
