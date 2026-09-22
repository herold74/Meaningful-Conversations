const { cleanTextForSpeech } = require('../ttsService');

describe('cleanTextForSpeech — ellipsis pause', () => {
  test('German: ... becomes comma pause, not spoken dots', () => {
    const out = cleanTextForSpeech('Also… ich weiß nicht.', 'de');
    expect(out).not.toContain('...');
    expect(out).not.toContain('…');
    expect(out).toMatch(/Also,\s+ich weiß nicht\./);
  });

  test('German: three ASCII dots become pause', () => {
    const out = cleanTextForSpeech('Nicht dass er ... vor allen gesagt hat.', 'de');
    expect(out).not.toMatch(/\.{3}/);
    expect(out).toContain(',');
  });

  test('English: ellipsis pause from dictionary', () => {
    const out = cleanTextForSpeech('Well… maybe.', 'en');
    expect(out).not.toContain('…');
    expect(out).toMatch(/Well,\s+maybe\./);
  });
});
