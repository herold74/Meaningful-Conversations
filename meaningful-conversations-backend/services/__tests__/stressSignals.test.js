const { detectStressInMessage } = require('../stressSignals');
const { clearCache } = require('../sentimentAnalyzer');

describe('stressSignals', () => {
  beforeEach(() => {
    clearCache();
  });

  describe('regression: personality_behavior_tracking (local-mistral baseline)', () => {
    const turn1 = 'I value security and good planning. Structure is important to me.';
    const turn2 =
      'Ich bin hier, weil ich unsicher bin, ob DPFL die Schlüsselwörter aus Nachrichten richtig erkennt und sie zu den Riemann-Dimensionen zuordnet. Das macht mir Sorgen, weil es für mein Projekt entscheidend ist.';
    const turn3 =
      'Es zeigt mir, dass ich sehr auf Genauigkeit achte und mich unsicher fühle, wenn etwas nicht perfekt funktioniert. Ich habe Angst, dass Fehler in dieser Phase alles andere kaputt machen könnten.';

    test('turn 1 (neutral planning) is not stress', () => {
      expect(detectStressInMessage(turn1, 'en')).toBe(false);
    });

    test('turn 2 (unsicher + Sorgen) is stress', () => {
      expect(detectStressInMessage(turn2, 'de')).toBe(true);
    });

    test('turn 3 (unsicher + Angst) is stress', () => {
      expect(detectStressInMessage(turn3, 'de')).toBe(true);
    });

    test('any turn in scenario would flag regression harness', () => {
      const any = [turn1, turn2, turn3].some((m, i) =>
        detectStressInMessage(m, i === 0 ? 'en' : 'de'),
      );
      expect(any).toBe(true);
    });
  });

  describe('classic distress lexicon', () => {
    test.each([
      ["I'm overwhelmed and exhausted", 'en'],
      ['Ich bin völlig überfordert', 'de'],
      ["I'm scared my team will think I'm weak", 'en'],
      ['Es macht mir Sorgen, ob das klappt', 'de'],
    ])('detects stress in %s', (msg, lang) => {
      expect(detectStressInMessage(msg, lang)).toBe(true);
    });

    test.each([
      ['We agreed on the project timeline and next steps.', 'en'],
      ['Struktur und Planung helfen mir im Alltag.', 'de'],
      ['I love structure and careful planning at work.', 'en'],
      ['I tried it twice already and feel more rested.', 'en'],
    ])('does not flag neutral %s', (msg, lang) => {
      expect(detectStressInMessage(msg, lang)).toBe(false);
    });
  });
});