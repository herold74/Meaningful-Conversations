const {
  detectConnectorCoachingPrepFromHistory,
  getConnectorCoachingPrepOverride,
  getGloriaConnectionPrepHandoffOverride,
} = require('../connectorCoachingPrep.js');

describe('connectorCoachingPrep', () => {
  it('detects handoff marker in history', () => {
    expect(
      detectConnectorCoachingPrepFromHistory([
        { role: 'user', text: 'brief connector coaching prep (connector coaching prep)' },
      ]),
    ).toBe(true);
  });

  it('returns DE and EN overrides', () => {
    expect(getConnectorCoachingPrepOverride('de')).toContain('Connector-Coaching-Vorbereitung');
    expect(getConnectorCoachingPrepOverride('en')).toContain("Let's focus on the real conversation");
    expect(getGloriaConnectionPrepHandoffOverride('en')).toContain('Connection prep');
    expect(getGloriaConnectionPrepHandoffOverride('de')).toContain('echtes Gespräch');
  });
});
