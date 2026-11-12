import { decryptData, encryptData } from './encryption';

const KEY = 'mc_offline_life_context_v1';

export interface OfflineLifeContextRecord {
  userId: string;
  contextCipher: string;
  gamificationCipher: string;
  baseHash: string;
  dirty: boolean;
}

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function readAll(): OfflineLifeContextRecord[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) as OfflineLifeContextRecord[] : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(records: OfflineLifeContextRecord[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(records));
}

export async function hashLifeContext(context: string): Promise<string> {
  return sha256(context);
}

export async function saveOfflineLifeContext(
  userId: string,
  key: CryptoKey,
  context: string,
  gamificationState: string,
  options: { dirty: boolean; baseHash?: string },
): Promise<void> {
  const record: OfflineLifeContextRecord = {
    userId,
    contextCipher: await encryptData(key, context),
    gamificationCipher: await encryptData(key, gamificationState),
    baseHash: options.baseHash ?? (await sha256(context)),
    dirty: options.dirty,
  };
  const others = readAll().filter((item) => item.userId !== userId);
  writeAll([...others, record]);
}

export async function readOfflineLifeContext(
  userId: string,
  key: CryptoKey,
): Promise<{ context: string; gamificationState: string; baseHash: string; dirty: boolean } | null> {
  const record = readAll().find((item) => item.userId === userId);
  if (!record) return null;
  return {
    context: await decryptData(key, record.contextCipher),
    gamificationState: await decryptData(key, record.gamificationCipher),
    baseHash: record.baseHash,
    dirty: record.dirty,
  };
}

export async function markOfflineLifeContextClean(userId: string, key: CryptoKey, context: string): Promise<void> {
  const current = await readOfflineLifeContext(userId, key);
  if (!current) return;
  await saveOfflineLifeContext(userId, key, context, current.gamificationState, {
    dirty: false,
    baseHash: await sha256(context),
  });
}
