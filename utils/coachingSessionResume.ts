import type { NavView } from '../types';

/** Views before the user has logged in or chosen guest access — no coaching resume UI. */
export const COACHING_RESUME_BLOCKED_VIEWS: readonly NavView[] = [
  'welcome',
  'auth',
  'login',
  'register',
  'forgotPassword',
  'registrationPending',
  'verifyEmail',
  'resetPassword',
  'paywall',
];

export function canOfferCoachingSessionResume(view: NavView): boolean {
  return !COACHING_RESUME_BLOCKED_VIEWS.includes(view);
}
