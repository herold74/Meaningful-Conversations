/**
 * Coach Practice access: Premium active + (trial / practice subscription / Client tier).
 * Four client-coach methods require isClient (or admin/developer) in addition.
 */

const CLIENT_ONLY_PRACTICE_SOURCE_BOTS = new Set([
  'rob',
  'victor-systemic-coaching',
  'bekky-thought-audit',
  'dan-client-language',
]);

function isStaffOrClient(user) {
  return !!(user?.isAdmin || user?.isDeveloper || user?.isClient);
}

function isPremiumActive(user, now = new Date()) {
  if (!user?.isPremium) return false;
  if (!user.premiumExpiresAt) return true;
  return new Date(user.premiumExpiresAt) > now;
}

function isPracticeEntitlementActive(user, now = new Date()) {
  if (isStaffOrClient(user)) return true;
  if (!user?.hasPracticeAccess) return false;
  if (!user.practiceExpiresAt) return true;
  return new Date(user.practiceExpiresAt) > now;
}

function canUseClientPracticeFrameworks(user) {
  return isStaffOrClient(user);
}

function isClientOnlyPracticeFramework(framework) {
  const sourceBotId = framework?.sourceBotId;
  return sourceBotId != null && CLIENT_ONLY_PRACTICE_SOURCE_BOTS.has(sourceBotId);
}

/**
 * @param {object} user  Prisma User (subset with practice/premium flags)
 * @returns {{ canAccessPractice: boolean, canUseClientFrameworks: boolean, lockReason?: string }}
 */
function resolvePracticeAccess(user) {
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

const PRACTICE_USER_SELECT = {
  isClient: true,
  isAdmin: true,
  isDeveloper: true,
  isPremium: true,
  premiumExpiresAt: true,
  hasPracticeAccess: true,
  practiceExpiresAt: true,
};

function practiceAccessErrorMessage(reason) {
  if (reason === 'premium_required') {
    return 'Coach Practice requires an active Premium subscription.';
  }
  if (reason === 'practice_required') {
    return 'Coach Practice requires the Practice add-on or an active trial.';
  }
  if (reason === 'client_framework') {
    return 'This practice method is available for Client access only.';
  }
  return 'Coach Practice access denied.';
}

module.exports = {
  CLIENT_ONLY_PRACTICE_SOURCE_BOTS,
  PRACTICE_USER_SELECT,
  isStaffOrClient,
  isPremiumActive,
  isPracticeEntitlementActive,
  canUseClientPracticeFrameworks,
  isClientOnlyPracticeFramework,
  resolvePracticeAccess,
  practiceAccessErrorMessage,
};
