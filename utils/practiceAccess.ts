import type { User } from '../types';

const CLIENT_ONLY_PRACTICE_SOURCE_BOTS = new Set([
  'rob',
  'victor-systemic-coaching',
  'bekky-thought-audit',
  'dan-client-language',
]);

export type PracticeAccessReason = 'premium_required' | 'practice_required' | 'client_framework';

export interface PracticeAccessState {
  canAccessPractice: boolean;
  canUseClientFrameworks: boolean;
  lockReason?: PracticeAccessReason;
}

function isStaffOrClient(user: User | null | undefined): boolean {
  return !!(user?.isAdmin || user?.isDeveloper || user?.isClient);
}

export function isPremiumActive(user: User | null | undefined, now = new Date()): boolean {
  if (!user?.isPremium) return false;
  if (!user.premiumExpiresAt) return true;
  return new Date(user.premiumExpiresAt) > now;
}

export function isPracticeEntitlementActive(user: User | null | undefined, now = new Date()): boolean {
  if (isStaffOrClient(user)) return true;
  if (!user?.hasPracticeAccess) return false;
  if (!user.practiceExpiresAt) return true;
  return new Date(user.practiceExpiresAt) > now;
}

export function resolvePracticeAccess(user: User | null | undefined): PracticeAccessState {
  if (isStaffOrClient(user)) {
    return { canAccessPractice: true, canUseClientFrameworks: true };
  }

  if (!isPremiumActive(user)) {
    return { canAccessPractice: false, canUseClientFrameworks: false, lockReason: 'premium_required' };
  }

  if (!isPracticeEntitlementActive(user)) {
    return { canAccessPractice: false, canUseClientFrameworks: false, lockReason: 'practice_required' };
  }

  return { canAccessPractice: true, canUseClientFrameworks: false };
}

export function isClientOnlyPracticeSourceBot(sourceBotId: string | null | undefined): boolean {
  return sourceBotId != null && CLIENT_ONLY_PRACTICE_SOURCE_BOTS.has(sourceBotId);
}
