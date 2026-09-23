import type { User } from '../types';

/** End-user client tier (Zugangscode / manuelle Freischaltung — nicht per Premium-Abo). */
export function isClientUser(user: User | null | undefined): boolean {
  return !!user?.isClient;
}

/**
 * Client-only product areas (PEP, Audio-Transkription, Klienten-Coaches, …).
 * Admin/Developer sehen dieselben Flächen zu Testzwecken.
 */
export function canAccessClientOnlyFeatures(user: User | null | undefined): boolean {
  return !!(user?.isClient || user?.isAdmin || user?.isDeveloper);
}
