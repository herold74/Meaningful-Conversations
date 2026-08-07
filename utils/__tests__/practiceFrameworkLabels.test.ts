import {
  getFrameworkDisplayName,
  getPracticeDifficultyLabel,
  resolvePracticeFrameworkId,
} from '../practiceFrameworkLabels';

describe('resolvePracticeFrameworkId', () => {
  it('maps legacy grow to four-stage-coaching', () => {
    expect(resolvePracticeFrameworkId('grow')).toBe('four-stage-coaching');
  });
});

describe('getFrameworkDisplayName', () => {
  const catalog = {
    frameworks: [
      { id: 'four-stage-coaching', name: 'Four-stage coaching' },
      { id: 'forward-focused-coaching', name: 'Forward-focused coaching' },
    ],
  } as Parameters<typeof getFrameworkDisplayName>[1]['catalog'];

  it('prefers catalog name when available', () => {
    expect(getFrameworkDisplayName('four-stage-coaching', { catalog, language: 'en' })).toBe(
      'Four-stage coaching',
    );
  });

  it('uses i18n for contracting sentinel', () => {
    const t = (key: string) => (key === 'practice_framework_contracting' ? 'Concern clarification' : key);
    expect(getFrameworkDisplayName('contracting', { t, language: 'en' })).toBe('Concern clarification');
  });

  it('uses i18n for free-play sentinel', () => {
    const t = (key: string) => (key === 'practice_free_play_title' ? 'Free play' : key);
    expect(getFrameworkDisplayName('free-play', { t, language: 'en' })).toBe('Free play');
  });

  it('falls back to static labels without catalog or t', () => {
    expect(getFrameworkDisplayName('forward-focused-coaching', { language: 'en' })).toBe(
      'Forward-focused coaching',
    );
    expect(getFrameworkDisplayName('contracting', { language: 'de' })).toBe('Anliegensklärung');
    expect(getFrameworkDisplayName('ambivalence-coaching', { language: 'de' })).toBe(
      'Ambivalenz-Coaching',
    );
    expect(getFrameworkDisplayName('structured-reflection', { language: 'de' })).toBe(
      'Strukturierte Reflexion',
    );
  });

  it('resolves legacy alias before lookup', () => {
    expect(getFrameworkDisplayName('grow', { catalog, language: 'en' })).toBe('Four-stage coaching');
  });

  it('does not return raw slug for known ids', () => {
    expect(getFrameworkDisplayName('free-play', { language: 'en' })).not.toBe('free-play');
    expect(getFrameworkDisplayName('contracting', { language: 'en' })).not.toBe('contracting');
  });
});

describe('getPracticeDifficultyLabel', () => {
  it('returns localized label via t()', () => {
    const t = (key: string) =>
      ({
        practice_difficulty_moderate: 'Mittel',
        practice_difficulty_hard: 'Schwer',
        practice_live_badge: 'Live',
      })[key] ?? key;
    expect(getPracticeDifficultyLabel('moderate', t)).toBe('Mittel');
    expect(getPracticeDifficultyLabel('hard', t, { liveMode: true })).toBe('Schwer · Live');
  });

  it('falls back to static labels without t()', () => {
    expect(getPracticeDifficultyLabel('moderate', undefined, { language: 'de' })).toBe('Mittel');
    expect(getPracticeDifficultyLabel('moderate', undefined, { language: 'en' })).toBe('Moderate');
  });

  it('normalizes unknown difficulty to moderate', () => {
    expect(getPracticeDifficultyLabel('unknown', undefined, { language: 'de' })).toBe('Mittel');
  });
});
