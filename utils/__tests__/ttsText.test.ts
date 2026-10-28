jest.mock('../../services/api', () => ({
  apiFetch: jest.fn(),
  getApiBaseUrl: jest.fn(() => ''),
  getAuthHeaders: jest.fn(() => ({})),
}));

import {
  splitIntoSentences,
  normalizeTextForTts,
  enqueueNewStreamingSentences,
} from '../../services/ttsService';

const NINA_COACHING_PARAGRAPH = `Good. Then let's make it concrete for your conversation with Nina.

Your clear intention: When she shares something charged, you'll pause and name the feeling you hear—just that—before asking anything else.

Your one small next step: Before the conversation, write down one phrase you'll use to name a feeling (e.g., "That sounds frustrating" or "I hear how much this is weighing on you"). Keep it visible during the talk.

Ready to go with that?`;

const GLORIA_PERFECT_BLOCK = `Perfect.

Your focus is set: Name the feeling, then pause. That's your anchor for the conversation.

Go into it with that clarity—no need to overcomplicate. When you're done, you'll know whether it worked for you.`;

describe('tts text splitting', () => {
  it('merges coaching paragraph without isolated "Good." or dangling Keep-it-visible line', () => {
    const normalized = normalizeTextForTts(NINA_COACHING_PARAGRAPH);
    const sentences = splitIntoSentences(normalized);

    expect(sentences.some((s) => s.trim() === 'Good.')).toBe(false);
    expect(sentences.some((s) => /^Keep it visible/i.test(s.trim()))).toBe(false);
    expect(sentences.length).toBeLessThanOrEqual(5);
    expect(sentences[0]).toMatch(/^Good\.\s+Then let's make it concrete/i);
  });

  it('enqueueNewStreamingSentences matches final splitIntoSentences for full buffer', () => {
    const normalized = normalizeTextForTts(NINA_COACHING_PARAGRAPH);
    const enqueued: string[] = [];
    enqueueNewStreamingSentences(normalized, true, 0, (s) => enqueued.push(s));
    expect(enqueued).toEqual(splitIntoSentences(normalized));
  });

  it('does not enqueue lone "Perfect." before the rest of the stream arrives', () => {
    const early: string[] = [];
    enqueueNewStreamingSentences('Perfect.', false, 0, (s) => early.push(s));
    expect(early).toEqual([]);

    const normalized = normalizeTextForTts(GLORIA_PERFECT_BLOCK);
    const enqueued: string[] = [];
    enqueueNewStreamingSentences(normalized, true, 0, (s) => enqueued.push(s));
    expect(enqueued.some((s) => s.trim() === 'Perfect.')).toBe(false);
    expect(enqueued[0]).toMatch(/^Perfect\.(?:,\s*)?Your focus is set/i);
    expect(enqueued.length).toBeGreaterThanOrEqual(2);
  });
});
