import type { Bot, Message } from '../types';
import { CONNECTOR_PERSONA_BOT_ID } from './connectorRun';

/** sessionStorage key — tab-scoped, cleared when the browser tab closes. */
export const COACHING_DRAFT_STORAGE_KEY = 'mc_coaching_draft_v1';

/** Safety expiry for mobile browsers that may keep sessionStorage longer than expected. */
export const COACHING_DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const NON_STANDARD_COACHING_BOT_IDS = new Set([
  'gloria-life-context',
  'gloria-interview',
  'practice-coachee',
  CONNECTOR_PERSONA_BOT_ID,
]);

export function isStandardCoachingChatBotId(botId: string): boolean {
  return !NON_STANDARD_COACHING_BOT_IDS.has(botId);
}

export function getCoachingDraftOwnerId(
  currentUserId: string | null | undefined,
  guestName: string | null | undefined,
): string | null {
  if (currentUserId?.trim()) return currentUserId.trim();
  const name = guestName?.trim();
  if (name) return `guest:${name}`;
  return 'guest:anonymous';
}

export interface CoachingSessionDraft {
  version: 1;
  ownerId: string;
  savedAt: string;
  bot: Bot;
  chatHistory: Message[];
  userMessageCount: number;
  baselineMessageCount: number;
}

export function saveCoachingSessionDraft(
  draft: Omit<CoachingSessionDraft, 'version' | 'savedAt'>,
): void {
  if (typeof sessionStorage === 'undefined') return;
  const hasUserMessage = draft.chatHistory.some((m) => m.role === 'user');
  if (!draft.ownerId || !draft.bot?.id || !hasUserMessage) {
    clearCoachingSessionDraft();
    return;
  }
  if (!isStandardCoachingChatBotId(draft.bot.id)) {
    clearCoachingSessionDraft();
    return;
  }
  const payload: CoachingSessionDraft = {
    version: 1,
    savedAt: new Date().toISOString(),
    ...draft,
  };
  const serialized = JSON.stringify(payload);
  try {
    sessionStorage.setItem(COACHING_DRAFT_STORAGE_KEY, serialized);
  } catch {
    // Private mode or quota — fail silently; server never receives draft data.
  }
  try {
    localStorage.setItem(COACHING_DRAFT_STORAGE_KEY, serialized);
  } catch {
    // Ignore quota failures. sessionStorage still holds the draft for this tab.
  }
}

function readDraftRaw(): string | null {
  try {
    const sessionRaw = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(COACHING_DRAFT_STORAGE_KEY) : null;
    if (sessionRaw) return sessionRaw;
  } catch {
    // Fall through to the durable copy.
  }
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(COACHING_DRAFT_STORAGE_KEY) : null;
  } catch {
    return null;
  }
}

export function loadCoachingSessionDraft(ownerId: string | undefined): CoachingSessionDraft | null {
  if (!ownerId) return null;
  try {
    const raw = readDraftRaw();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CoachingSessionDraft;
    if (parsed.version !== 1 || parsed.ownerId !== ownerId) return null;
    if (
      !parsed.bot?.id ||
      !Array.isArray(parsed.chatHistory) ||
      !parsed.chatHistory.some((m) => m.role === 'user')
    ) {
      clearCoachingSessionDraft();
      return null;
    }
    if (!isStandardCoachingChatBotId(parsed.bot.id)) {
      clearCoachingSessionDraft();
      return null;
    }
    const age = Date.now() - new Date(parsed.savedAt).getTime();
    if (!Number.isFinite(age) || age > COACHING_DRAFT_MAX_AGE_MS) {
      clearCoachingSessionDraft();
      return null;
    }
    return parsed;
  } catch {
    clearCoachingSessionDraft();
    return null;
  }
}

export function clearCoachingSessionDraft(): void {
  try {
    sessionStorage.removeItem(COACHING_DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem(COACHING_DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}
