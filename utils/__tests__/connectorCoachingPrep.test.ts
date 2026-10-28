import {
  detectConnectorCoachingPrepFromHistory,
  isConnectorCoachingPrepMessage,
} from '../connectorCoachingPrep';

describe('connectorCoachingPrep', () => {
  it('detects coaching prep markers', () => {
    expect(isConnectorCoachingPrepMessage('brief connector coaching prep (connector coaching prep)')).toBe(true);
    expect(isConnectorCoachingPrepMessage('kurze Connector-Coaching-Vorbereitung')).toBe(true);
    expect(isConnectorCoachingPrepMessage('full coaching session please')).toBe(false);
  });

  it('detects from user history', () => {
    expect(
      detectConnectorCoachingPrepFromHistory([
        { role: 'bot', text: 'Hi' },
        { role: 'user', text: 'connector coaching prep with Nina' },
      ]),
    ).toBe(true);
  });
});
