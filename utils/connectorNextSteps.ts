import { CONNECTOR_DIMENSIONS } from '../components/ConnectorRadarChart';
import { BOTS } from '../constants';
import type { BotAccessTier, ConnectorDimensionKey, ConnectorEvaluationResult, Language, User } from '../types';
import { buildGloriaConnectionPrepStarter } from './gloriaInterview';

const ACCESS_HIERARCHY: Record<BotAccessTier, number> = {
  guest: 0,
  registered: 1,
  premium: 2,
  client: 3,
};

function userAccessLevel(user: User | null | undefined): BotAccessTier {
  if (!user) return 'guest';
  if (user.isAdmin || user.isDeveloper || user.isClient) return 'client';
  if (user.isPremium) return 'premium';
  return 'registered';
}

/** Whether the user can start a session with this Kommunikation coach (tier + unlocks). */
export function isConnectorCoachBotAvailable(botId: string, user: User | null | undefined): boolean {
  const bot = BOTS.find((b) => b.id === botId);
  if (!bot) return false;
  const unlocked = user?.unlockedCoaches ?? [];
  if (unlocked.includes(botId)) return true;
  const required = ACCESS_HIERARCHY[bot.accessTier] ?? 0;
  const userLevel = ACCESS_HIERARCHY[userAccessLevel(user)] ?? 0;
  return userLevel >= required;
}

export function getConnectorDimensionsWithAvailableCoach(
  evaluation: ConnectorEvaluationResult,
  user: User | null | undefined,
): ConnectorDimensionKey[] {
  return rankConnectorDimensions(evaluation).filter((dim) =>
    isConnectorCoachBotAvailable(CONNECTOR_KOMMUNIKATION_COACHES[dim].botId, user),
  );
}

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
  language: Language,
  botId?: string,
): string {
  if (botId === 'gloria-interview') {
    return buildGloriaConnectionPrepStarter(language, growthArea);
  }

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
