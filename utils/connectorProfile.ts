import type { ConnectorEvaluationResult } from '../types';
import type { ExternalPerspectiveNote } from '../components/PersonalitySurvey';
import * as api from '../services/api';
import { decryptPersonalityProfile } from './personalityEncryption';

/** Connector results older than this are flagged before Fremdsicht enrichment. */
export const CONNECTOR_STALE_MS = 180 * 24 * 60 * 60 * 1000;

export function isConnectorStale(connector: ConnectorEvaluationResult | null | undefined): boolean {
  if (!connector?.completedAt) return false;
  const completed = new Date(connector.completedAt).getTime();
  if (Number.isNaN(completed)) return false;
  return Date.now() - completed > CONNECTOR_STALE_MS;
}

/** True when saved Fremdsicht was generated from a different Connector run than the current profile data. */
export function isExternalPerspectiveOutdated(
  note: ExternalPerspectiveNote | undefined,
  connector: ConnectorEvaluationResult | undefined,
): boolean {
  if (!note || !connector?.completedAt) return false;
  if (!note.connectorCompletedAt) return true;
  return note.connectorCompletedAt !== connector.completedAt;
}

/** True when user has a saved Connector signature in their E2EE profile. */
export async function userHasSavedConnector(encryptionKey: CryptoKey | null): Promise<boolean> {
  if (!encryptionKey) return false;
  try {
    const existing = await api.loadPersonalityProfile();
    if (!existing?.encryptedData) return false;
    const decrypted = await decryptPersonalityProfile(existing.encryptedData, encryptionKey);
    return !!(decrypted as { connector?: ConnectorEvaluationResult }).connector;
  } catch {
    return false;
  }
}
