/**
 * Web/PayPal: Premium → Premium+ upgrade pricing (Option 2).
 * Price = Premium+ list price minus unused Premium monthly credit (pro-rated).
 * Upgrade grants a new full Premium+ period (30 days) from purchase — credit is on price only.
 */

const { isPremiumActive } = require('./practiceAccess.js');

const PREMIUM_MONTHLY_PRICE = 9.90;
const MIN_PRICE = 0.10;

function hasActivePracticeAccess(user, now = new Date()) {
  if (!user?.hasPracticeAccess) return false;
  if (!user.practiceExpiresAt) return true;
  return new Date(user.practiceExpiresAt) > now;
}

function isPremiumPlusUpgrade(user, now = new Date()) {
  if (!isPremiumActive(user, now)) return false;
  if (hasActivePracticeAccess(user, now)) return false;
  if (!user.premiumExpiresAt) return true;
  return new Date(user.premiumExpiresAt) > now;
}

function computePremiumPlusUpgradePrice(user, product, now = new Date()) {
  if (product.category !== 'premium_plus') return null;
  if (!isPremiumPlusUpgrade(user, now)) return null;

  const fullPrice = product.price;
  const periodDays = product.days || 30;

  if (!user.premiumExpiresAt) {
    const price = Math.max(MIN_PRICE, roundMoney(fullPrice - PREMIUM_MONTHLY_PRICE));
    return buildResult(fullPrice, price);
  }

  const expires = new Date(user.premiumExpiresAt);
  if (expires <= now) return null;

  const daysRemaining = (expires.getTime() - now.getTime()) / 86400000;
  const fraction = Math.min(1, daysRemaining / periodDays);
  const credit = PREMIUM_MONTHLY_PRICE * fraction;
  const price = Math.max(MIN_PRICE, roundMoney(fullPrice - credit));

  return buildResult(fullPrice, price);
}

function buildResult(originalPrice, price) {
  return {
    price,
    originalPrice,
    discountReasons: price < originalPrice ? ['premium_upgrade'] : [],
    isUpgrade: true,
  };
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function computePremiumPlusUpgradePeriodEnd(product, now = new Date()) {
  const end = new Date(now);
  end.setDate(end.getDate() + (product.days || 30));
  return end;
}

function buildPremiumPlusUpgradeUpdate(user, product, now = new Date()) {
  if (!isPremiumPlusUpgrade(user, now)) return null;

  const periodEnd = computePremiumPlusUpgradePeriodEnd(product, now);

  if (!user.premiumExpiresAt) {
    return {
      isPremium: true,
      hasPracticeAccess: true,
      practiceExpiresAt: periodEnd,
    };
  }

  const updateData = {
    isPremium: true,
    premiumExpiresAt: periodEnd,
    hasPracticeAccess: true,
    practiceExpiresAt: periodEnd,
  };
  const currentAccess = user.accessExpiresAt ? new Date(user.accessExpiresAt) : null;
  if (!currentAccess || currentAccess < periodEnd) {
    updateData.accessExpiresAt = periodEnd;
  }
  return updateData;
}

module.exports = {
  PREMIUM_MONTHLY_PRICE,
  MIN_PRICE,
  hasActivePracticeAccess,
  isPremiumPlusUpgrade,
  computePremiumPlusUpgradePrice,
  computePremiumPlusUpgradePeriodEnd,
  buildPremiumPlusUpgradeUpdate,
};
