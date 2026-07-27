/**
 * Avatar ring colors on Bot Selection encode session rhythm — not gender.
 * - clarify: structured coaching methods (phases, frameworks, client-led clarity)
 * - develop: draw out, interview, reflect, depth, ambivalence
 * - forward: future focus, ambition, clear session flow toward action
 * - tool: transcript utilities (not a coach)
 */
export type CoachSessionRing = 'clarify' | 'develop' | 'forward' | 'tool';

const FORWARD_FLOW_BOT_IDS = new Set([
  'sam-forward-focused',
  'max-ambitious',
]);

const CLARIFY_BOT_IDS = new Set([
  'gloria-life-context',
  'gabrielle-four-stage',
  'chloe-structured-reflection',
  'ava-strategic',
  'dan-client-language',
  'bekky-thought-audit',
]);

export function getCoachSessionRing(botId: string): CoachSessionRing {
  if (FORWARD_FLOW_BOT_IDS.has(botId)) return 'forward';
  if (CLARIFY_BOT_IDS.has(botId)) return 'clarify';
  return 'develop';
}

export function getCoachSessionRingClass(variant: CoachSessionRing, isLocked: boolean): string {
  if (isLocked) return 'bg-border-primary/40';
  switch (variant) {
    case 'forward':
      return 'bg-session-ring-forward';
    case 'develop':
      return 'bg-session-ring-develop';
    case 'tool':
      return 'bg-gradient-to-br from-session-ring-clarify via-session-ring-forward to-session-ring-develop';
    case 'clarify':
    default:
      return 'bg-session-ring-clarify';
  }
}

export const COACH_SESSION_RING_I18N: Record<CoachSessionRing, string> = {
  clarify: 'coach_ring_clarify_hint',
  develop: 'coach_ring_develop_hint',
  forward: 'coach_ring_forward_hint',
  tool: 'coach_ring_tool_hint',
};
