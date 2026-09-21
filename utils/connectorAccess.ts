import type { User } from '../types';
import { isPremiumActive } from './practiceAccess';

export type ConnectorPremiumLockReason = 'login_required' | 'premium_required';

export interface ConnectorPremiumAccess {
  canAccessConnectorPractice: boolean;
  lockReason?: ConnectorPremiumLockReason;
}

function isStaff(user: User | null | undefined): boolean {
  return !!(user?.isAdmin || user?.isDeveloper || user?.isClient);
}

/** Premium gate for Connector practice catalog + open situation (assessment stays registered-only). */
export function resolveConnectorPremiumAccess(user: User | null | undefined): ConnectorPremiumAccess {
  if (!user) {
    return { canAccessConnectorPractice: false, lockReason: 'login_required' };
  }
  if (isStaff(user) || isPremiumActive(user)) {
    return { canAccessConnectorPractice: true };
  }
  return { canAccessConnectorPractice: false, lockReason: 'premium_required' };
}
