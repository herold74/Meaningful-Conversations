import type { CoachPracticeConfig, Message } from '../types';

/** sessionStorage key — tab-scoped, cleared when the browser tab closes. */
export const PRACTICE_DRAFT_STORAGE_KEY = 'mc_practice_draft_v1';

/** Safety expiry for mobile browsers that may keep sessionStorage longer than expected. */
export const PRACTICE_DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface PracticeSessionDraft {
  version: 1;
  userId: string;
  savedAt: string;
  practiceConfig: CoachPracticeConfig;
  chatHistory: Message[];
  userMessageCount: number;
  baselineMessageCount: number;
}

export function savePracticeSessionDraft(
  draft: Omit<PracticeSessionDraft, 'version' | 'savedAt'>,
): void {
  if (typeof sessionStorage === 'undefined') return;
  if (!draft.userId || !draft.practiceConfig || draft.chatHistory.length === 0) {
    clearPracticeSessionDraft();
    return;
  }
  const payload: PracticeSessionDraft = {
    version: 1,
    savedAt: new Date().toISOString(),
    ...draft,
  };
  try {
    sessionStorage.setItem(PRACTICE_DRAFT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Private mode or quota — fail silently; server never receives draft data.
  }
}

export function loadPracticeSessionDraft(userId: string | undefined): PracticeSessionDraft | null {
  if (!userId || typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PRACTICE_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PracticeSessionDraft;
    if (parsed.version !== 1 || parsed.userId !== userId) return null;
    if (
      !parsed.practiceConfig ||
      !Array.isArray(parsed.chatHistory) ||
      parsed.chatHistory.length === 0
    ) {
      clearPracticeSessionDraft();
      return null;
    }
    const age = Date.now() - new Date(parsed.savedAt).getTime();
    if (!Number.isFinite(age) || age > PRACTICE_DRAFT_MAX_AGE_MS) {
      clearPracticeSessionDraft();
      return null;
    }
    return parsed;
  } catch {
    clearPracticeSessionDraft();
    return null;
  }
}

export function clearPracticeSessionDraft(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(PRACTICE_DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function botFromPracticeConfig(config: CoachPracticeConfig) {
  return {
    id: 'practice-coachee' as const,
    name: config.coacheeName,
    description: config.scenarioName,
    description_de: config.scenarioName,
    avatar: config.coacheeAvatar,
    style: config.frameworkName,
    style_de: config.frameworkName,
    accessTier: 'client' as const,
  };
}
