import { CONNECTOR_DIMENSIONS } from '../components/ConnectorRadarChart';
import type { ConnectorDimensionKey, ConnectorEvaluationResult } from '../types';

/** Kommunikation-section coaches only (registered tier). */
export const CONNECTOR_KOMMUNIKATION_COACHES: Record<
  ConnectorDimensionKey,
  { botId: string; rationaleKey: string }
> = {
  empathy: { botId: 'sam-forward-focused', rationaleKey: 'connector_coach_sam_empathy' },
  presence: { botId: 'sam-forward-focused', rationaleKey: 'connector_coach_sam_presence' },
  curiosity: { botId: 'gloria-interview', rationaleKey: 'connector_coach_gloria_curiosity' },
  nonJudgment: { botId: 'nexus-goal-path-solution', rationaleKey: 'connector_coach_nobody_nonjudgment' },
  steadiness: { botId: 'sam-forward-focused', rationaleKey: 'connector_coach_sam_steadiness' },
};

export function rankConnectorDimensions(evaluation: ConnectorEvaluationResult): ConnectorDimensionKey[] {
  return [...CONNECTOR_DIMENSIONS].sort(
    (a, b) => (evaluation[a]?.score ?? 10) - (evaluation[b]?.score ?? 10),
  );
}

export function getWeakestConnectorDimension(
  evaluation: ConnectorEvaluationResult,
): ConnectorDimensionKey {
  return rankConnectorDimensions(evaluation)[0];
}

export function getPrimaryMissedCue(evaluation: ConnectorEvaluationResult): string | null {
  for (const pv of evaluation.perVignette) {
    const cue = pv.missedCue?.trim();
    if (cue) return cue;
  }
  return null;
}

export function microExerciseKey(dimension: ConnectorDimensionKey): string {
  return `connector_micro_exercise_${dimension}`;
}

export function buildCoachStarterPrompt(
  dimension: ConnectorDimensionKey,
  growthArea: string | undefined,
  language: 'de' | 'en',
): string {
  const topic = growthArea?.trim() || '';
  if (language === 'de') {
    const focus = topic
      ? `Konkret möchte ich an folgendem Punkt arbeiten: „${topic}". `
      : '';
    return `Ich möchte meine Gesprächsführung im Alltag üben und an meiner Verbindungsfähigkeit feilen. ${focus}Kannst du mir helfen, das für ein echtes Gespräch vorzubereiten?`;
  }
  const focus = topic
    ? `Specifically, I'd like to work on: "${topic}". `
    : '';
  return `I'd like to practice everyday conversation skills and connection. ${focus}Can you help me prepare for a real conversation?`;
}

export function getCoachForDimension(dimension: ConnectorDimensionKey) {
  return CONNECTOR_KOMMUNIKATION_COACHES[dimension];
}

export function showConnectorPracticeLadder(overallScore: number | null): boolean {
  return overallScore === null || overallScore < 8;
}
