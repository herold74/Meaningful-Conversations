import { CONNECTOR_DIMENSIONS } from '../components/ConnectorRadarChart';
import { BOTS } from '../constants';
import type { BotAccessTier, ConnectorDimensionKey, ConnectorEvaluationResult, Language, User } from '../types';
import { buildGloriaConnectionPrepStarter } from './gloriaInterview';
import { CONNECTOR_LAB_VIGNETTES } from './connectorLabScripts';

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

/** Plain text for handoff prompts (strip markdown from Connector growth lines). */
export function plainTextForCoachHandoff(text: string | undefined): string {
  return (text ?? '').replace(/\*\*/g, '').trim();
}

const CONNECTOR_PREP_DIMENSION_FOCUS: Record<
  ConnectorDimensionKey,
  { en: string; de: string }
> = {
  empathy: {
    en: 'recognizing and naming feelings before moving to solutions',
    de: 'Gefühle wahrnehmen und benennen, bevor ich zu Lösungen gehe',
  },
  presence: {
    en: 'staying with the person instead of jumping ahead',
    de: 'bei der Person bleiben, statt vorwegzugehen',
  },
  curiosity: {
    en: 'asking genuine questions before giving advice',
    de: 'echte Fragen stellen, bevor ich Ratschläge gebe',
  },
  nonJudgment: {
    en: 'listening without judging or instantly reassuring',
    de: 'zuhören, ohne zu bewerten oder reflexhaft zu beruhigen',
  },
  steadiness: {
    en: 'staying calm when the conversation gets tense',
    de: 'ruhig bleiben, wenn das Gespräch hitzig wird',
  },
};

/** Persona name from saved Connector eval (catalog vignettes only). */
export function resolveConnectorHandoffPartnerName(
  evaluation: ConnectorEvaluationResult,
): string | undefined {
  const withCue = evaluation.perVignette.find((pv) => pv.missedCue?.trim());
  const vignetteId = withCue?.vignetteId ?? evaluation.perVignette[0]?.vignetteId ?? evaluation.vignetteIds[0];
  if (!vignetteId) return undefined;
  return CONNECTOR_LAB_VIGNETTES.find((v) => v.id === vignetteId)?.personaName;
}

/** Sharper Gloria opener after Connector — real talk + practice focus, not homework paste. */
export function buildConnectorGloriaHandoffStarter(
  language: Language,
  dimension: ConnectorDimensionKey,
  _evaluation: ConnectorEvaluationResult,
): string {
  const focus =
    language === 'de'
      ? CONNECTOR_PREP_DIMENSION_FOCUS[dimension].de
      : CONNECTOR_PREP_DIMENSION_FOCUS[dimension].en;

  if (language === 'de') {
    return (
      'Ich bereite ein echtes Gespräch in meinem Leben vor. ' +
      `Nach dem Connector-Üben möchte ich klarer werden, wie ich mich zeige — besonders: ${focus}. ` +
      `Bitte führe mich nur mit Fragen durch die Vorbereitung.`
    );
  }

  return (
    "I'm preparing for a real conversation in my life. " +
    `After Connector practice I want to be clearer on how I show up — especially: ${focus}. ` +
    `Please guide me through preparation with your questions only.`
  );
}

/** Lightweight Sam / Nobody opener — connector focus, not full coaching. */
export function buildConnectorCoachingHandoffStarter(
  language: Language,
  dimension: ConnectorDimensionKey,
  _evaluation: ConnectorEvaluationResult,
): string {
  const focus =
    language === 'de'
      ? CONNECTOR_PREP_DIMENSION_FOCUS[dimension].de
      : CONNECTOR_PREP_DIMENSION_FOCUS[dimension].en;

  if (language === 'de') {
    return (
      'Ich bereite ein echtes Gespräch in meinem Leben vor. ' +
      `Nach dem Connector-Üben brauche ich einen klaren Fokus: ${focus}. ` +
      `Bitte halte es kurz — hilf mir zu klären, wie ich mich im echten Gespräch zeigen möchte, höchstens mit einem kleinen nächsten Schritt.`
    );
  }

  return (
    "I'm preparing for a real conversation in my life. " +
    `After Connector practice I want one clear focus: ${focus}. ` +
    `Keep it brief — help me clarify how I want to show up in the real conversation, with at most one small next step.`
  );
}

export function buildCoachStarterPrompt(
  dimension: ConnectorDimensionKey,
  growthArea: string | undefined,
  language: Language,
  botId?: string,
  evaluation?: ConnectorEvaluationResult,
): string {
  if (botId === 'gloria-interview') {
    if (evaluation) {
      return buildConnectorGloriaHandoffStarter(language, dimension, evaluation);
    }
    return buildGloriaConnectionPrepStarter(language, plainTextForCoachHandoff(growthArea));
  }

  if (
    evaluation &&
    (botId === 'sam-forward-focused' || botId === 'nexus-goal-path-solution')
  ) {
    return buildConnectorCoachingHandoffStarter(language, dimension, evaluation);
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

/** High overall score (≥8) but a dimension or vignette cue still warrants a coach handoff. */
export function connectorHighScoreNeedsCoachBridge(evaluation: ConnectorEvaluationResult): boolean {
  const score = evaluation.overallScore;
  if (score === null || score < 8) return false;
  const weakest = getWeakestConnectorDimension(evaluation);
  const weakestScore = evaluation[weakest]?.score ?? 10;
  if (weakestScore <= 6) return true;
  return getPrimaryMissedCue(evaluation) != null;
}

/** Offer coach step when user has at least one unlocked Kommunikation coach for the evaluation. */
export function shouldOfferConnectorCoachBridge(
  evaluation: ConnectorEvaluationResult,
  user: User | null | undefined,
): boolean {
  if (getConnectorDimensionsWithAvailableCoach(evaluation, user).length === 0) return false;
  if (showConnectorPracticeLadder(evaluation.overallScore)) return true;
  return connectorHighScoreNeedsCoachBridge(evaluation);
}
