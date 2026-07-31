const {
  resolvePracticeAccess,
  isClientOnlyPracticeFramework,
  CLIENT_ONLY_PRACTICE_SOURCE_BOTS,
} = require('../practiceAccess.js');

describe('practiceAccess', () => {
  test('client users get full practice including client frameworks', () => {
    const access = resolvePracticeAccess({ isClient: true, isPremium: false });
    expect(access.canAccessPractice).toBe(true);
    expect(access.canUseClientFrameworks).toBe(true);
  });

  test('premium trial user with practice entitlement can access non-client methods', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const access = resolvePracticeAccess({
      isPremium: true,
      premiumExpiresAt: future,
      hasPracticeAccess: true,
      practiceExpiresAt: future,
    });
    expect(access.canAccessPractice).toBe(true);
    expect(access.canUseClientFrameworks).toBe(false);
  });

  test('premium without practice add-on is blocked', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const access = resolvePracticeAccess({
      isPremium: true,
      premiumExpiresAt: future,
      hasPracticeAccess: false,
    });
    expect(access.canAccessPractice).toBe(false);
    expect(access.lockReason).toBe('practice_required');
  });

  test('registered user without premium is blocked', () => {
    const access = resolvePracticeAccess({ isPremium: false, hasPracticeAccess: false });
    expect(access.canAccessPractice).toBe(false);
    expect(access.lockReason).toBe('premium_required');
  });

  test('client-only practice source bots are identified', () => {
    expect(CLIENT_ONLY_PRACTICE_SOURCE_BOTS.has('rob')).toBe(true);
    expect(isClientOnlyPracticeFramework({ sourceBotId: 'max-ambitious' })).toBe(false);
    expect(isClientOnlyPracticeFramework({ sourceBotId: 'bekky-thought-audit' })).toBe(true);
  });
});
