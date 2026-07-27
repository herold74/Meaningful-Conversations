import {
  PRACTICE_DRAFT_MAX_AGE_MS,
  PRACTICE_DRAFT_STORAGE_KEY,
  clearPracticeSessionDraft,
  loadPracticeSessionDraft,
  savePracticeSessionDraft,
} from '../practiceSessionDraft';
import type { CoachPracticeConfig, Message } from '../../types';

const sessionStore = new Map<string, string>();

beforeAll(() => {
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: {
      getItem: (key: string) => sessionStore.get(key) ?? null,
      setItem: (key: string, value: string) => { sessionStore.set(key, value); },
      removeItem: (key: string) => { sessionStore.delete(key); },
      clear: () => { sessionStore.clear(); },
    },
    configurable: true,
  });
});

const config: CoachPracticeConfig = {
  frameworkId: 'four-stage-coaching',
  frameworkName: 'Four-stage coaching',
  scenarioId: 'career-decision',
  scenarioName: 'Career decision',
  coacheeName: 'Alex',
  coacheeAvatar: '/avatars/alex.png',
  difficulty: 'moderate',
  difficultyLabel: 'Moderate',
  liveMode: false,
  scopeBoundaryTheme: null,
};

const history: Message[] = [
  { id: '1', role: 'user', text: 'Hello', timestamp: '2026-07-26T10:00:00.000Z' },
  { id: '2', role: 'bot', text: 'Hi', timestamp: '2026-07-26T10:00:05.000Z' },
];

describe('practiceSessionDraft', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('saves and loads a draft for the same user', () => {
    savePracticeSessionDraft({
      userId: 'user-1',
      practiceConfig: config,
      chatHistory: history,
      userMessageCount: 1,
      baselineMessageCount: 0,
    });

    const loaded = loadPracticeSessionDraft('user-1');
    expect(loaded).not.toBeNull();
    expect(loaded?.practiceConfig.frameworkId).toBe('four-stage-coaching');
    expect(loaded?.chatHistory).toHaveLength(2);
    expect(sessionStorage.getItem(PRACTICE_DRAFT_STORAGE_KEY)).toBeTruthy();
  });

  it('returns null for a different user', () => {
    savePracticeSessionDraft({
      userId: 'user-1',
      practiceConfig: config,
      chatHistory: history,
      userMessageCount: 1,
      baselineMessageCount: 0,
    });

    expect(loadPracticeSessionDraft('user-2')).toBeNull();
  });

  it('clears stale drafts', () => {
    savePracticeSessionDraft({
      userId: 'user-1',
      practiceConfig: config,
      chatHistory: history,
      userMessageCount: 1,
      baselineMessageCount: 0,
    });

    const raw = sessionStorage.getItem(PRACTICE_DRAFT_STORAGE_KEY)!;
    const parsed = JSON.parse(raw);
    parsed.savedAt = new Date(Date.now() - PRACTICE_DRAFT_MAX_AGE_MS - 1000).toISOString();
    sessionStorage.setItem(PRACTICE_DRAFT_STORAGE_KEY, JSON.stringify(parsed));

    expect(loadPracticeSessionDraft('user-1')).toBeNull();
    expect(sessionStorage.getItem(PRACTICE_DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('clears draft when history is empty', () => {
    savePracticeSessionDraft({
      userId: 'user-1',
      practiceConfig: config,
      chatHistory: history,
      userMessageCount: 1,
      baselineMessageCount: 0,
    });

    savePracticeSessionDraft({
      userId: 'user-1',
      practiceConfig: config,
      chatHistory: [],
      userMessageCount: 0,
      baselineMessageCount: 0,
    });

    expect(sessionStorage.getItem(PRACTICE_DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('clearPracticeSessionDraft removes storage', () => {
    savePracticeSessionDraft({
      userId: 'user-1',
      practiceConfig: config,
      chatHistory: history,
      userMessageCount: 1,
      baselineMessageCount: 0,
    });

    clearPracticeSessionDraft();
    expect(sessionStorage.getItem(PRACTICE_DRAFT_STORAGE_KEY)).toBeNull();
  });
});
