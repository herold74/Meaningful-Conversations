import type { Message } from '../types';
import { decryptData, encryptData } from './encryption';

const KEY = 'mc_connector_offline_runs_v1';

export interface ConnectorOfflineRun {
  id: string;
  userId: string;
  createdAt: string;
  language: 'de' | 'en';
  liveMode: boolean;
  vignetteId: string;
  history: Pick<Message, 'role' | 'text'>[];
  evaluated: boolean;
}

interface StoredConnectorRun {
  id: string;
  userId: string;
  createdAt: string;
  language: 'de' | 'en';
  liveMode: boolean;
  vignetteId: string;
  evaluated: boolean;
  cipher: string;
}

function readAll(): StoredConnectorRun[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) as StoredConnectorRun[] : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(runs: StoredConnectorRun[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(runs));
}

export async function saveConnectorOfflineRun(
  run: Omit<ConnectorOfflineRun, 'id' | 'createdAt' | 'evaluated'>,
  key: CryptoKey,
): Promise<ConnectorOfflineRun> {
  const record: StoredConnectorRun = {
    id: `connector-${Date.now()}`,
    userId: run.userId,
    createdAt: new Date().toISOString(),
    language: run.language,
    liveMode: run.liveMode,
    vignetteId: run.vignetteId,
    evaluated: false,
    cipher: await encryptData(key, JSON.stringify(run.history)),
  };
  writeAll([...readAll(), record]);
  return { ...run, id: record.id, createdAt: record.createdAt, evaluated: false };
}

export async function listPendingConnectorRuns(userId: string, key: CryptoKey): Promise<ConnectorOfflineRun[]> {
  const own = readAll().filter((run) => run.userId === userId && !run.evaluated);
  const decoded: ConnectorOfflineRun[] = [];
  for (const run of own) {
    const history = JSON.parse(await decryptData(key, run.cipher)) as ConnectorOfflineRun['history'];
    decoded.push({
      id: run.id,
      userId: run.userId,
      createdAt: run.createdAt,
      language: run.language,
      liveMode: run.liveMode,
      vignetteId: run.vignetteId,
      history,
      evaluated: run.evaluated,
    });
  }
  return decoded;
}

export function markConnectorRunEvaluated(id: string): void {
  writeAll(readAll().map((run) => (run.id === id ? { ...run, evaluated: true } : run)));
}
