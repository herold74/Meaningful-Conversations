import type { User } from '../types';
import { canAccessClientOnlyFeatures } from './clientAccess';
import { resolvePracticeAccess } from './practiceAccess';

export type TutorialHubItemId =
  | 'life_context'
  | 'voice_text'
  | 'session_review'
  | 'transcript'
  | 'connector'
  | 'coach_practice'
  | 'pep';

export interface TutorialHubVisibilityContext {
  isRegistered: boolean;
  canAccessPractice: boolean;
  /** PEP & andere Klienten-only Features — nicht über Premium/Premium+ freischaltbar. */
  canAccessClientOnlyFeatures: boolean;
}

export function resolveTutorialHubVisibilityContext(user: User | null): TutorialHubVisibilityContext {
  const practiceAccess = resolvePracticeAccess(user);
  return {
    isRegistered: !!user,
    canAccessPractice: practiceAccess.canAccessPractice,
    canAccessClientOnlyFeatures: canAccessClientOnlyFeatures(user),
  };
}

/** Visibility rules for Tutorial Hub cards (keep in sync with product tiers). */
export function isTutorialHubItemVisible(
  itemId: TutorialHubItemId,
  ctx: TutorialHubVisibilityContext,
): boolean {
  switch (itemId) {
    case 'life_context':
    case 'voice_text':
    case 'transcript':
      return true;
    case 'session_review':
    case 'connector':
      return ctx.isRegistered;
    case 'coach_practice':
      return ctx.canAccessPractice;
    case 'pep':
      return ctx.canAccessClientOnlyFeatures;
    default:
      return false;
  }
}
