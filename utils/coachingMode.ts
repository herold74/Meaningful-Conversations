import type { CoachingMode } from '../types';

/** Coaches that use DPC only — no DPFL session learning or comfort check, even when the account is on DPFL. */
export const DPC_ONLY_BOT_IDS = new Set([
  'nexus-goal-path-solution',
  'sam-forward-focused',
]);

export function isDpcOnlyCoachBot(botId: string): boolean {
  return DPC_ONLY_BOT_IDS.has(botId);
}

/** Account coaching mode as applied to a specific coach (DPFL → DPC for DPC-only bots). */
export function getEffectiveCoachingMode(
  botId: string,
  userCoachingMode: CoachingMode | undefined,
): CoachingMode {
  const mode = userCoachingMode ?? 'off';
  if (mode === 'dpfl' && isDpcOnlyCoachBot(botId)) {
    return 'dpc';
  }
  return mode;
}

export function botSupportsDpflSessionFlow(botId: string, userCoachingMode: CoachingMode | undefined): boolean {
  return getEffectiveCoachingMode(botId, userCoachingMode) === 'dpfl';
}
