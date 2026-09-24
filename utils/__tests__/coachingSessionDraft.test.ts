import {
  COACHING_DRAFT_MAX_AGE_MS,
  COACHING_DRAFT_STORAGE_KEY,
  clearCoachingSessionDraft,
  isStandardCoachingChatBotId,
  loadCoachingSessionDraft,
  saveCoachingSessionDraft,
} from '../coachingSessionDraft';
import type { Bot, Message } from '../../types';

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

const bot: Bot = {
  id: 'nexus-goal-path-solution',
  name: 'Nobody',
  description: 'desc',
  description_de: 'desc',
  avatar: '/avatars/nobody.png',
  style: 'style',
  style_de: 'style',
  accessTier: 'guest',
};

const history: Message[] = [
  { id: '1', role: 'user', text: 'Hello', timestamp: '2026-07-26T10:00:00.000Z' },
  { id: '2', role: 'bot', text: 'Hi', timestamp: '2026-07-26T10:00:05.000Z' },
];

describe('coachingSessionDraft', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('isStandardCoachingChatBotId excludes special bots', () => {
    expect(isStandardCoachingChatBotId('nexus-goal-path-solution')).toBe(true);
    expect(isStandardCoachingChatBotId('gloria-interview')).toBe(false);
    expect(isStandardCoachingChatBotId('connector-persona')).toBe(false);
  });

  it('saves and loads a draft for the same owner', () => {
    saveCoachingSessionDraft({
      ownerId: 'user-1',
      bot,
      chatHistory: history,
      userMessageCount: 1,
      baselineMessageCount: 0,
    });

    const loaded = loadCoachingSessionDraft('user-1');
    expect(loaded).not.toBeNull();
    expect(loaded?.bot.id).toBe('nexus-goal-path-solution');
    expect(loaded?.chatHistory).toHaveLength(2);
    expect(sessionStorage.getItem(COACHING_DRAFT_STORAGE_KEY)).toBeTruthy();
  });

  it('returns null for a different owner', () => {
    saveCoachingSessionDraft({
      ownerId: 'user-1',
      bot,
      chatHistory: history,
      userMessageCount: 1,
      baselineMessageCount: 0,
    });

    expect(loadCoachingSessionDraft('user-2')).toBeNull();
    expect(loadCoachingSessionDraft('guest:Anna')).toBeNull();
  });

  it('clears stale drafts', () => {
    saveCoachingSessionDraft({
      ownerId: 'user-1',
      bot,
      chatHistory: history,
      userMessageCount: 1,
      baselineMessageCount: 0,
    });

    const raw = sessionStorage.getItem(COACHING_DRAFT_STORAGE_KEY)!;
    const parsed = JSON.parse(raw);
    parsed.savedAt = new Date(Date.now() - COACHING_DRAFT_MAX_AGE_MS - 1000).toISOString();
    sessionStorage.setItem(COACHING_DRAFT_STORAGE_KEY, JSON.stringify(parsed));

    expect(loadCoachingSessionDraft('user-1')).toBeNull();
    expect(sessionStorage.getItem(COACHING_DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('clearCoachingSessionDraft removes storage', () => {
    saveCoachingSessionDraft({
      ownerId: 'user-1',
      bot,
      chatHistory: history,
      userMessageCount: 1,
      baselineMessageCount: 0,
    });

    clearCoachingSessionDraft();
    expect(sessionStorage.getItem(COACHING_DRAFT_STORAGE_KEY)).toBeNull();
  });
});
