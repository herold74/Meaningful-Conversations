const {
  computePremiumPlusUpgradePrice,
  buildPremiumPlusUpgradeUpdate,
  isPremiumPlusUpgrade,
} = require('../premiumPlusUpgradePricing.js');

const PLUS_PRODUCT = {
  category: 'premium_plus',
  price: 14.90,
  days: 30,
};

function daysFromNow(days) {
  return new Date(Date.now() + days * 86400000);
}

describe('premiumPlusUpgradePricing', () => {
  test('no active premium — no upgrade pricing', () => {
    const user = { isPremium: false, hasPracticeAccess: false };
    expect(computePremiumPlusUpgradePrice(user, PLUS_PRODUCT)).toBeNull();
  });

  test('23 days remaining — credits unused Premium proportionally', () => {
    const now = new Date('2026-08-02T12:00:00.000Z');
    const user = {
      isPremium: true,
      premiumExpiresAt: new Date('2026-08-25T12:00:00.000Z'),
      hasPracticeAccess: false,
    };
    const result = computePremiumPlusUpgradePrice(user, PLUS_PRODUCT, now);
    expect(result.price).toBe(7.31);
    expect(result.discountReasons).toContain('premium_upgrade');
  });

  test('7 days remaining — higher price near month end', () => {
    const now = new Date('2026-08-02T12:00:00.000Z');
    const user = {
      isPremium: true,
      premiumExpiresAt: new Date('2026-08-09T12:00:00.000Z'),
      hasPracticeAccess: false,
    };
    const result = computePremiumPlusUpgradePrice(user, PLUS_PRODUCT, now);
    expect(result.price).toBe(12.59);
  });

  test('lifetime premium — flat delta only', () => {
    const user = {
      isPremium: true,
      premiumExpiresAt: null,
      hasPracticeAccess: false,
    };
    const result = computePremiumPlusUpgradePrice(user, PLUS_PRODUCT);
    expect(result.price).toBe(5.0);
  });

  test('upgrade update starts new 30-day Premium+ period from upgrade', () => {
    const now = new Date('2026-08-02T12:00:00.000Z');
    const user = {
      isPremium: true,
      premiumExpiresAt: new Date('2026-08-03T12:00:00.000Z'),
      accessExpiresAt: new Date('2026-08-03T12:00:00.000Z'),
      hasPracticeAccess: false,
    };
    const update = buildPremiumPlusUpgradeUpdate(user, PLUS_PRODUCT, now);
    expect(update.premiumExpiresAt).toEqual(new Date('2026-09-01T12:00:00.000Z'));
    expect(update.practiceExpiresAt).toEqual(new Date('2026-09-01T12:00:00.000Z'));
    expect(update.hasPracticeAccess).toBe(true);
  });

  test('already has practice — not an upgrade', () => {
    const user = {
      isPremium: true,
      premiumExpiresAt: daysFromNow(10),
      hasPracticeAccess: true,
      practiceExpiresAt: daysFromNow(10),
    };
    expect(isPremiumPlusUpgrade(user)).toBe(false);
  });
});
