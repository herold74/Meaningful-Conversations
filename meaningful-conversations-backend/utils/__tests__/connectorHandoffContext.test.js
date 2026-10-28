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

  it('builds generic behavior context without catalog scene or persona (EN)', () => {
    const block = buildConnectorHandoffContext(
      {
        vignetteId: 'nina-review',
        focusDimension: 'curiosity',
        highlight: 'Stayed calm',
        missedCue: 'Asked before advising',
      },
      'en',
    );
    expect(block).toContain('Stayed calm');
    expect(block).toContain('real conversation');
    expect(block).not.toContain('annual review');
    expect(block).not.toContain('Nina');
    expect(block.length).toBeLessThan(900);
  });

  it('returns empty without vignette id', () => {
    expect(buildConnectorHandoffContext(null, 'en')).toBe('');
  });
});
