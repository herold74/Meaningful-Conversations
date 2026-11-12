import type { Message } from '../types';
import { decryptData, encryptData } from './encryption';

const KEY = 'mc_sam_offline_results_v1';

export type SamResultStatus = 'pending' | 'in_review' | 'decided';

interface StoredSamResult {
  id: string;
  userId: string;
  createdAt: string;
  language: 'de' | 'en';
  status: SamResultStatus;
  cipher: string;
}

export interface SamOfflineResult {
  id: string;
  userId: string;
  createdAt: string;
  language: 'de' | 'en';
  status: SamResultStatus;
  messages: Pick<Message, 'role' | 'text'>[];
}

function readAll(): StoredSamResult[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) as StoredSamResult[] : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(records: StoredSamResult[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(records));
}

export async function enqueueSamOfflineResult(
  userId: string,
  key: CryptoKey,
  language: 'de' | 'en',
  messages: Message[],
): Promise<SamOfflineResult> {
  const payload = messages
    .filter((message) => message.role === 'user' || message.role === 'bot')
    .map((message) => ({ role: message.role, text: message.text }));
  const record: StoredSamResult = {
    id: `sam-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    createdAt: new Date().toISOString(),
    language,
    status: 'pending',
    cipher: await encryptData(key, JSON.stringify(payload)),
  };
  writeAll([...readAll(), record]);
  return { ...record, messages: payload };
}

export async function listSamOfflineResults(userId: string, key: CryptoKey): Promise<SamOfflineResult[]> {
  const own = readAll()
    .filter((record) => record.userId === userId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const decoded: SamOfflineResult[] = [];
  for (const record of own) {
    const messages = JSON.parse(await decryptData(key, record.cipher)) as SamOfflineResult['messages'];
    decoded.push({
      id: record.id,
      userId: record.userId,
      createdAt: record.createdAt,
      language: record.language,
      status: record.status,
      messages,
    });
  }
  return decoded;
}

export function oldestActionableSamResult(results: SamOfflineResult[]): SamOfflineResult | null {
  return [...results]
    .filter((result) => result.status === 'pending' || result.status === 'in_review')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0] ?? null;
}

export function setSamOfflineResultStatus(id: string, status: SamResultStatus): void {
  writeAll(readAll().map((record) => (record.id === id ? { ...record, status } : record)));
}

export function pendingSamOfflineCount(userId: string): number {
  return readAll().filter((record) => record.userId === userId && record.status !== 'decided').length;
}
