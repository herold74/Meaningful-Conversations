import { resolvePracticeAccess } from '../practiceAccess';

describe('resolvePracticeAccess', () => {
  it('locks practice for guests with login_required', () => {
    expect(resolvePracticeAccess(null)).toEqual({
      canAccessPractice: false,
      canUseClientFrameworks: false,
      lockReason: 'login_required',
    });
  });

  it('allows staff without premium', () => {
    expect(resolvePracticeAccess({ isAdmin: true } as any).canAccessPractice).toBe(true);
  });

  it('requires premium for registered users without entitlement', () => {
    expect(resolvePracticeAccess({ isPremium: false } as any)).toMatchObject({
      canAccessPractice: false,
      lockReason: 'premium_required',
    });
  });
});
