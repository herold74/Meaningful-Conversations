import {
  buildGloriaConnectionPrepStarter,
  detectGloriaConnectionPrepFromHistory,
  isGloriaConnectionPrepMessage,
} from '../gloriaInterview';

describe('gloriaInterview', () => {
  it('detects connection prep markers', () => {
    expect(isGloriaConnectionPrepMessage('Ich möchte eine Gesprächsvorbereitung')).toBe(true);
    expect(isGloriaConnectionPrepMessage('prepare for a conversation')).toBe(true);
    expect(isGloriaConnectionPrepMessage('Ein normales Projekt-Interview')).toBe(false);
  });

  it('detects connection prep from user history', () => {
    expect(
      detectGloriaConnectionPrepFromHistory([
        { role: 'bot', text: 'Welcome' },
        { role: 'user', text: 'bewusst Verbindung herstellen' },
      ]),
    ).toBe(true);
  });

  it('builds German connection prep starter with focus topic', () => {
    const starter = buildGloriaConnectionPrepStarter('de', 'Feedback mit meinem Team');
    expect(starter).toContain('Gespräch vorbereiten');
    expect(starter).toContain('Feedback mit meinem Team');
  });

  it('builds English connection prep starter', () => {
    const starter = buildGloriaConnectionPrepStarter('en');
    expect(starter).toContain('prepare for a conversation');
    expect(starter).toContain('consciously build connection');
  });
});
