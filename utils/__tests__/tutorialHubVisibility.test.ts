import type { User } from '../../types';
import {
  isTutorialHubItemVisible,
  resolveTutorialHubVisibilityContext,
} from '../tutorialHubVisibility';

const premiumOnly: Partial<User> = {
  isPremium: true,
  premiumExpiresAt: '2099-01-01T00:00:00.000Z',
  hasPracticeAccess: false,
};

const premiumPlusPractice: Partial<User> = {
  ...premiumOnly,
  hasPracticeAccess: true,
  practiceExpiresAt: '2099-01-01T00:00:00.000Z',
};

const clientUser: Partial<User> = {
  isClient: true,
  isPremium: false,
};

describe('tutorialHubVisibility', () => {
  it('hides PEP for premium users without client tier', () => {
    const ctx = resolveTutorialHubVisibilityContext(premiumOnly as User);
    expect(isTutorialHubItemVisible('pep', ctx)).toBe(false);
    expect(isTutorialHubItemVisible('coach_practice', ctx)).toBe(false);
  });

  it('shows PEP only with client tier (not subscription alone)', () => {
    const ctxPremiumPlus = resolveTutorialHubVisibilityContext(premiumPlusPractice as User);
    expect(isTutorialHubItemVisible('pep', ctxPremiumPlus)).toBe(false);
    expect(isTutorialHubItemVisible('coach_practice', ctxPremiumPlus)).toBe(true);

    const ctxClient = resolveTutorialHubVisibilityContext(clientUser as User);
    expect(isTutorialHubItemVisible('pep', ctxClient)).toBe(true);
    expect(isTutorialHubItemVisible('coach_practice', ctxClient)).toBe(true);
  });

  it('hides registered-only tutorials for guests', () => {
    const ctx = resolveTutorialHubVisibilityContext(null);
    expect(isTutorialHubItemVisible('connector', ctx)).toBe(false);
    expect(isTutorialHubItemVisible('session_review', ctx)).toBe(false);
    expect(isTutorialHubItemVisible('transcript', ctx)).toBe(true);
  });
});
