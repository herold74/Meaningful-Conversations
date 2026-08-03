/**
 * Merge Apple/RevenueCat subscription expiries — use max(active) per tier
 * so Premium Yearly + Premium+ Monthly does not shorten premiumExpiresAt.
 */

const { mapAppleProduct } = require('../services/appleIAPService');

function maxDate(a, b) {
  if (!a) return b || null;
  if (!b) return a;
  return a > b ? a : b;
}

function mergeSubscriptionIntoUser(user, productMapping, expiresAt) {
  const updateData = { updatedAt: new Date() };
  const exp = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);

  if (productMapping.tier === 'registered') {
    const current = user.accessExpiresAt ? new Date(user.accessExpiresAt) : null;
    updateData.accessExpiresAt = maxDate(current, exp);
  } else if (productMapping.tier === 'premium') {
    updateData.isPremium = true;
    updateData.premiumExpiresAt = maxDate(
      user.premiumExpiresAt ? new Date(user.premiumExpiresAt) : null,
      exp,
    );
    const currentAccess = user.accessExpiresAt ? new Date(user.accessExpiresAt) : null;
    updateData.accessExpiresAt = maxDate(currentAccess, updateData.premiumExpiresAt);
  } else if (productMapping.tier === 'premium_plus') {
    updateData.isPremium = true;
    updateData.premiumExpiresAt = maxDate(
      user.premiumExpiresAt ? new Date(user.premiumExpiresAt) : null,
      exp,
    );
    updateData.hasPracticeAccess = true;
    updateData.practiceExpiresAt = maxDate(
      user.practiceExpiresAt ? new Date(user.practiceExpiresAt) : null,
      exp,
    );
    const currentAccess = user.accessExpiresAt ? new Date(user.accessExpiresAt) : null;
    updateData.accessExpiresAt = maxDate(currentAccess, updateData.premiumExpiresAt);
  } else if (productMapping.tier === 'practice') {
    updateData.hasPracticeAccess = true;
    updateData.practiceExpiresAt = maxDate(
      user.practiceExpiresAt ? new Date(user.practiceExpiresAt) : null,
      exp,
    );
  }

  return updateData;
}

function buildUpdateFromActiveSubscriptions(user, subscriptions, now = new Date()) {
  let premiumExpiresAt = null;
  let practiceExpiresAt = null;
  let accessExpiresAt = null;
  let isPremium = false;
  let hasPracticeAccess = false;
  let hasActiveSub = false;

  for (const [productId, sub] of Object.entries(subscriptions || {})) {
    const mapping = mapAppleProduct(productId);
    if (!mapping || mapping.type !== 'subscription') continue;
    const exp = sub.expires_date ? new Date(sub.expires_date) : null;
    if (!exp || exp <= now) continue;
    hasActiveSub = true;

    if (mapping.tier === 'registered') {
      accessExpiresAt = maxDate(accessExpiresAt, exp);
    } else if (mapping.tier === 'premium') {
      isPremium = true;
      premiumExpiresAt = maxDate(premiumExpiresAt, exp);
      accessExpiresAt = maxDate(accessExpiresAt, exp);
    } else if (mapping.tier === 'premium_plus') {
      isPremium = true;
      hasPracticeAccess = true;
      premiumExpiresAt = maxDate(premiumExpiresAt, exp);
      practiceExpiresAt = maxDate(practiceExpiresAt, exp);
      accessExpiresAt = maxDate(accessExpiresAt, exp);
    } else if (mapping.tier === 'practice') {
      hasPracticeAccess = true;
      practiceExpiresAt = maxDate(practiceExpiresAt, exp);
    }
  }

  if (!hasActiveSub) return null;

  const updateData = { updatedAt: new Date() };
  if (isPremium) {
    updateData.isPremium = true;
    updateData.premiumExpiresAt = premiumExpiresAt;
  }
  if (hasPracticeAccess) {
    updateData.hasPracticeAccess = true;
    updateData.practiceExpiresAt = practiceExpiresAt;
  }
  if (accessExpiresAt) {
    const existing = user.accessExpiresAt ? new Date(user.accessExpiresAt) : null;
    updateData.accessExpiresAt = maxDate(existing, accessExpiresAt);
  }
  return updateData;
}

module.exports = {
  maxDate,
  mergeSubscriptionIntoUser,
  buildUpdateFromActiveSubscriptions,
};
