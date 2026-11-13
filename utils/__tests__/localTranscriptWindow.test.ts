import { fitLocalTranscriptWindow, ON_DEVICE_CHARS_PER_TOKEN, ON_DEVICE_CONTEXT_TOKENS, ON_DEVICE_RESPONSE_TOKENS } from '../localTranscriptWindow';
import { parseLocalTranscriptReview } from '../transcriptLocalEval';

describe('local transcript window', () => {
  test('keeps a short transcript whole', () => {
    const window = fitLocalTranscriptWindow({
      instructions: 'instructions',
      preamble: 'preamble',
      transcript: 'Hallo.',
    });
    expect(window.omittedChars).toBe(0);
    expect(window.kept).toBe('Hallo.');
  });

  test('cuts the tail once the token window is full', () => {
    const instructions = 'i';
    const preamble = 'p';
    const room = (ON_DEVICE_CONTEXT_TOKENS - ON_DEVICE_RESPONSE_TOKENS) * ON_DEVICE_CHARS_PER_TOKEN - instructions.length - preamble.length;
    const transcript = `${'A'.repeat(room)}ENDE`;
    const window = fitLocalTranscriptWindow({ instructions, preamble, transcript });
    expect(window.keptChars).toBe(room);
    expect(window.omittedChars).toBe(4);
    expect(window.omittedPreview).toBe('ENDE');
    expect(window.kept.endsWith('A')).toBe(true);
  });

  test('parses the compact local review', () => {
    const review = parseLocalTranscriptReview(`SUMMARY: Kurz und klar.
SCORE: 8
STRENGTH: Du hast nachgefragt.
DEVELOPMENT: Das Ziel kam spät.
NEXT: Formuliere das Ziel am Anfang.`);
    expect(review.score).toBe(8);
    expect(review.strengths).toEqual(['Du hast nachgefragt.']);
    expect(review.developmentAreas).toEqual(['Das Ziel kam spät.']);
    expect(review.nextSteps).toEqual(['Formuliere das Ziel am Anfang.']);
  });
});
