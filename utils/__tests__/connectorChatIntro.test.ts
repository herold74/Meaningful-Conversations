import { connectorChatHeaderIntroKey } from '../connectorChatIntro';

describe('connectorChatHeaderIntroKey', () => {
  it('uses masculine German template for male personas', () => {
    expect(connectorChatHeaderIntroKey('de', 'male')).toBe('connector_chat_header_intro_m');
  });

  it('uses feminine German template for female personas', () => {
    expect(connectorChatHeaderIntroKey('de', 'female')).toBe('connector_chat_header_intro_f');
  });

  it('uses neutral English template', () => {
    expect(connectorChatHeaderIntroKey('en', 'male')).toBe('connector_chat_header_intro');
    expect(connectorChatHeaderIntroKey('en', 'female')).toBe('connector_chat_header_intro');
  });
});
