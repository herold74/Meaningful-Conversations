import type { User } from '../types';
import { deriveKey, hexToUint8Array } from './encryption';

const EMAIL_KEY = 'mc_offline_unlock_email';

export interface OfflineUnlockRecord {
  email: string;
  encryptionSalt: string;
  verifier: string;
  user: User;
}

async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function passwordVerifier(password: string, encryptionSalt: string): Promise<string> {
  const key = await deriveKey(password, hexToUint8Array(encryptionSalt));
  const raw = await crypto.subtle.exportKey('raw', key);
  return sha256Hex(raw);
}

export function unlockStorageKey(email: string): string {
  return `offline-unlock:${email.trim().toLowerCase()}`;
}

export async function buildOfflineUnlockRecord(user: User, password: string): Promise<OfflineUnlockRecord | null> {
  if (!user.encryptionSalt || !user.email) return null;
  return {
    email: user.email.trim().toLowerCase(),
    encryptionSalt: user.encryptionSalt,
    verifier: await passwordVerifier(password, user.encryptionSalt),
    user,
  };
}

export async function matchOfflineUnlock(
  record: OfflineUnlockRecord,
  email: string,
  password: string,
): Promise<{ user: User; key: CryptoKey } | null> {
  if (record.email !== email.trim().toLowerCase()) return null;
  const verifier = await passwordVerifier(password, record.encryptionSalt);
  if (verifier !== record.verifier) return null;
  const key = await deriveKey(password, hexToUint8Array(record.encryptionSalt));
  return { user: record.user, key };
}

export function rememberOfflineEmail(email: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(EMAIL_KEY, email.trim().toLowerCase());
}
