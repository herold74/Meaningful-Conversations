import {
  extractGuestNameFromLifeContext,
  hasGuestNameProvided,
  resolveGuestName,
} from '../guestSession';

describe('guestSession', () => {
  it('falls back to name-only life context template for resolveGuestName', () => {
    const template = '# Lebenskontext\n\n**Name**: Anna\n\n**Ziel**: \n';
    expect(extractGuestNameFromLifeContext(template)).toBe('Anna');
    expect(resolveGuestName(template, null)).toBe('Anna');
  });

  it('requires explicit session name for hasGuestNameProvided', () => {
    const template = '# Lebenskontext\n\n**Name**: Anna\n\n**Ziel**: \n';
    expect(hasGuestNameProvided(template, null)).toBe(false);
    expect(hasGuestNameProvided('', 'Anna')).toBe(true);
  });

  it('uses profile_name from questionnaire answers', () => {
    expect(hasGuestNameProvided('', 'Anna')).toBe(true);
    expect(resolveGuestName('', 'Anna')).toBe('Anna');
  });

  it('returns false when no name anywhere', () => {
    expect(hasGuestNameProvided('', null)).toBe(false);
  });
});
