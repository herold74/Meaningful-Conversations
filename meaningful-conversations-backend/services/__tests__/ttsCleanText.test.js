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

describe('cleanTextForSpeech — German Team compounds', () => {
  test('standalone Team', () => {
    expect(cleanTextForSpeech('Dein Team ist stark.', 'de')).toBe('Dein Tiem ist stark.');
  });

  test('plural Teams', () => {
    expect(cleanTextForSpeech('Harmonie in kleinen Teams.', 'de')).toBe(
      'Harmonie in kleinen Tiems.',
    );
  });

  test('compounds Teamleistung and Teammotivation', () => {
    const out = cleanTextForSpeech('Teamleistung und Teammotivation zählen.', 'de');
    expect(out).toBe('Tiemleistung und Tiemmotivation zählen.');
  });

  test('other common compounds', () => {
    expect(cleanTextForSpeech('Teamgeist beim Teammeeting.', 'de')).toBe(
      'Tiemgeist beim Tiemmeeting.',
    );
  });
});
