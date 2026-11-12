import { buildSamLocalInstructions, condenseLifeContext } from '../samLocalPrompt';
import { crisisReply, isCrisisMessage } from '../offlineCrisis';
import { getLocalModelMode, setLocalModelMode } from '../localModelMode';
import { enqueueSamOfflineResult, listSamOfflineResults, oldestActionableSamResult, type SamOfflineResult } from '../samOfflineResults';
import { extractConnectorEnd } from '../connectorLocalPrompt';
import { bundledConnectorCatalog, getBundledVignette } from '../connectorLocalBundle';
import { deriveKey } from '../encryption';
import { buildOfflineUnlockRecord, matchOfflineUnlock } from '../offlineUnlock';
import { hashLifeContext, readOfflineLifeContext, saveOfflineLifeContext } from '../offlineLifeContext';
import type { User } from '../../types';

const user: User = {
  id: 'user-1',
  email: 'ada@example.com',
  isPremium: false,
  isAdmin: false,
  unlockedCoaches: [],
  encryptionSalt: '00112233445566778899aabbccddeeff',
};

class MemoryStorage {
  private data = new Map<string, string>();
  get length(): number { return this.data.size; }
  clear(): void { this.data.clear(); }
  getItem(key: string): string | null { return this.data.has(key) ? this.data.get(key)! : null; }
  key(index: number): string | null { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string): void { this.data.delete(key); }
  setItem(key: string, value: string): void { this.data.set(key, value); }
}

describe('offline local model', () => {
  beforeAll(() => {
    const root = globalThis as typeof globalThis & {
      window?: Window & typeof globalThis;
      localStorage?: MemoryStorage;
    };
    const storage = new MemoryStorage();
    root.localStorage = storage;
    if (!root.window) root.window = root as unknown as Window & typeof globalThis;
    root.window.localStorage = storage as unknown as Storage;
    if (!root.window.crypto) root.window.crypto = crypto;
  });

  beforeEach(() => {
    localStorage.clear();
  });

  test('sam instructions stay short and skip personality', () => {
    const instructions = buildSamLocalInstructions('de', 2);
    expect(instructions).toContain('Eine Frage');
    expect(instructions).not.toContain('Riemann');
    expect(instructions).toContain('2');
  });

  test('life context is shortened', () => {
    expect(condenseLifeContext('a'.repeat(20), 10).endsWith('…')).toBe(true);
  });

  test('crisis phrases are caught before the model', () => {
    expect(isCrisisMessage('Ich will nicht mehr leben')).toBe(true);
    expect(isCrisisMessage('Wie plane ich meinen Montag?')).toBe(false);
    expect(crisisReply('de')).toContain('142');
  });

  test('local mode defaults to online and can be stored per feature', () => {
    expect(getLocalModelMode('sam')).toBe('online');
    setLocalModelMode('sam', 'local');
    setLocalModelMode('connector', 'online');
    expect(getLocalModelMode('sam')).toBe('local');
    expect(getLocalModelMode('connector')).toBe('online');
  });

  test('older sam results block newer ones', () => {
    const results: SamOfflineResult[] = [
      { id: 'newer', userId: 'u', createdAt: '2026-02-01', language: 'de', status: 'pending', messages: [] },
      { id: 'older', userId: 'u', createdAt: '2026-01-01', language: 'de', status: 'pending', messages: [] },
      { id: 'done', userId: 'u', createdAt: '2025-12-01', language: 'de', status: 'decided', messages: [] },
    ];
    expect(oldestActionableSamResult(results)?.id).toBe('older');
  });

  test('connector end marker is removed', () => {
    const result = extractConnectorEnd('Danke. [CONNECTOR_END]', 2);
    expect(result.ended).toBe(true);
    expect(result.text).toBe('Danke.');
    expect(result.endType).toBe('heard');
  });

  test('bundled connector catalog includes the meeting vignette', () => {
    expect(bundledConnectorCatalog('de').some((entry) => entry.id === 'jonas-meeting')).toBe(true);
    expect(getBundledVignette('jonas-meeting')?.personaName).toBe('Jonas');
  });

  test('a second sam run stays behind the first', async () => {
    const key = await deriveKey('secret', new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]));
    const first = await enqueueSamOfflineResult('user-1', key, 'de', [{ id: '1', role: 'user', text: 'first', timestamp: '2026-01-01' }]);
    const second = await enqueueSamOfflineResult('user-1', key, 'de', [{ id: '2', role: 'user', text: 'second', timestamp: '2026-01-02' }]);
    const listed = await listSamOfflineResults('user-1', key);
    expect(listed.map((result) => result.id)).toEqual([first.id, second.id]);
    expect(oldestActionableSamResult(listed)?.messages[0].text).toBe('first');
  });

  test('offline unlock rejects a different password', async () => {
    const record = await buildOfflineUnlockRecord(user, 'correct-password');
    expect(record).not.toBeNull();
    const unlocked = await matchOfflineUnlock(record!, 'ada@example.com', 'wrong-password');
    expect(unlocked).toBeNull();
    const accepted = await matchOfflineUnlock(record!, 'ada@example.com', 'correct-password');
    expect(accepted?.user.id).toBe('user-1');
  });

  test('a dirty life context keeps its previous base hash', async () => {
    const key = await deriveKey('secret', new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]));
    const base = await hashLifeContext('original');
    await saveOfflineLifeContext('user-1', key, 'original', '{}', { dirty: false, baseHash: base });
    await saveOfflineLifeContext('user-1', key, 'edited', '{}', { dirty: true, baseHash: base });
    const stored = await readOfflineLifeContext('user-1', key);
    expect(stored?.context).toBe('edited');
    expect(stored?.dirty).toBe(true);
    expect(stored?.baseHash).toBe(base);
  });
});
