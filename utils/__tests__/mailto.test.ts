import { buildMailtoHref } from '../mailto';

describe('buildMailtoHref', () => {
  it('returns bare mailto when only address is set', () => {
    expect(buildMailtoHref({ to: 'connect@manualmode.at' })).toBe('mailto:connect@manualmode.at');
  });

  it('encodes subject and body', () => {
    const href = buildMailtoHref({
      to: 'connect@manualmode.at',
      subject: 'Anfrage Klienten-Zugang – App',
      body: 'Hallo,\n\nMein Konto: user@example.com',
    });
    expect(href.startsWith('mailto:connect@manualmode.at?')).toBe(true);
    const query = href.split('?')[1] ?? '';
    const params = new URLSearchParams(query);
    expect(params.get('subject')).toBe('Anfrage Klienten-Zugang – App');
    expect(params.get('body')).toContain('user@example.com');
  });

  it('ignores empty subject and body', () => {
    expect(buildMailtoHref({ to: 'a@b.c', subject: '  ', body: '' })).toBe('mailto:a@b.c');
  });
});
