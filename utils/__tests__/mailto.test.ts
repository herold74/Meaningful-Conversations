import { buildGmailComposeUrl, buildMailtoHref } from '../mailto';

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

  it('builds Gmail compose URL with su and body params', () => {
    const url = buildGmailComposeUrl({
      to: 'connect@manualmode.at',
      subject: 'Hello',
      body: 'Test body',
    });
    expect(url.startsWith('https://mail.google.com/mail/?')).toBe(true);
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('to')).toBe('connect@manualmode.at');
    expect(params.get('su')).toBe('Hello');
    expect(params.get('body')).toBe('Test body');
  });

  it('encodes spaces as %20, not literal + (mailto is not form-urlencoded)', () => {
    const href = buildMailtoHref({ to: 'a@b.c', subject: 'Hello World', body: 'Line one two' });
    expect(href).not.toContain('+');
    expect(href).toContain('Hello%20World');
    expect(href).toContain('Line%20one%20two');
  });
});
