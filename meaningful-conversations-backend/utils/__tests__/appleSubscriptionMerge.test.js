const {
  mergeSubscriptionIntoUser,
  buildUpdateFromActiveSubscriptions,
} = require('../appleSubscriptionMerge');

describe('appleSubscriptionMerge', () => {
  test('premium_plus monthly merges with existing premium yearly — max premium expiry', () => {
    const user = {
      isPremium: true,
      premiumExpiresAt: new Date('2027-04-21T00:00:00.000Z'),
      accessExpiresAt: new Date('2027-04-21T00:00:00.000Z'),
      hasPracticeAccess: false,
      practiceExpiresAt: null,
    };
    const plusExpiry = new Date('2026-09-01T00:00:00.000Z');
    const update = mergeSubscriptionIntoUser(
      user,
      { tier: 'premium_plus', type: 'subscription', days: 30 },
      plusExpiry,
    );
    expect(update.premiumExpiresAt).toEqual(new Date('2027-04-21T00:00:00.000Z'));
    expect(update.practiceExpiresAt).toEqual(plusExpiry);
    expect(update.hasPracticeAccess).toBe(true);
  });

  test('buildUpdateFromActiveSubscriptions uses max across all active subs', () => {
    const user = { accessExpiresAt: null, premiumExpiresAt: null, practiceExpiresAt: null };
    const now = new Date('2026-08-01T12:00:00.000Z');
    const update = buildUpdateFromActiveSubscriptions(
      user,
      {
        'mc.premium.yearly': { expires_date: '2027-04-21T00:00:00.000Z' },
        'mc.premium_plus.monthly': { expires_date: '2026-09-01T00:00:00.000Z' },
      },
      now,
    );
    expect(update.isPremium).toBe(true);
    expect(update.premiumExpiresAt).toEqual(new Date('2027-04-21T00:00:00.000Z'));
    expect(update.hasPracticeAccess).toBe(true);
    expect(update.practiceExpiresAt).toEqual(new Date('2026-09-01T00:00:00.000Z'));
  });
});
