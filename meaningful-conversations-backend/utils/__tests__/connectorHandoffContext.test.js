const {
  buildConnectorHandoffContext,
  isFirstConnectorHandoffTurn,
} = require('../connectorHandoffContext.js');

describe('connectorHandoffContext', () => {
  it('detects first handoff turn before assistant reply', () => {
    expect(isFirstConnectorHandoffTurn([{ role: 'user', text: 'prep' }])).toBe(true);
    expect(
      isFirstConnectorHandoffTurn([
        { role: 'user', text: 'prep' },
        { role: 'bot', text: 'Hi' },
      ]),
    ).toBe(false);
  });

  it('builds compact nina-review context in EN', () => {
    const block = buildConnectorHandoffContext(
      {
        vignetteId: 'nina-review',
        focusDimension: 'curiosity',
        highlight: 'Stayed calm',
        missedCue: 'Asked before advising',
      },
      'en',
    );
    expect(block).toContain('annual review');
    expect(block).toContain('Nina');
    expect(block).toContain('Stayed calm');
    expect(block).toContain('what do you already know');
    expect(block.length).toBeLessThan(1200);
  });

  it('returns empty without vignette id', () => {
    expect(buildConnectorHandoffContext(null, 'en')).toBe('');
  });
});
