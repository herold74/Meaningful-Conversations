const { BOTS } = require('../../bots.js');
const { getChatContentSafetySurface } = require('../contentSafetyPromptBlocks');
const {
  VICTOR_INTIMACY_TRACK_EN,
  VICTOR_INTIMACY_TRACK_DE,
} = require('../victorIntimacyTrack');

describe('victor intimacy track', () => {
  const victor = BOTS.find((b) => b.id === 'victor-systemic-coaching');

  test('track module exports core one-chair and gridlock language', () => {
    expect(VICTOR_INTIMACY_TRACK_EN).toContain('One chair');
    expect(VICTOR_INTIMACY_TRACK_DE).toContain('Ein Stuhl');
    expect(VICTOR_INTIMACY_TRACK_EN).toContain('Gridlock');
  });

  test('Victor bot embeds intimacy track in EN and DE prompts', () => {
    expect(victor).toBeDefined();
    expect(victor.systemPrompt).toContain('Mode 3: Intimacy & partnership');
    expect(victor.systemPrompt_de).toContain('Modus 3: Intimität & Partnerschaft');
    expect(victor.systemPrompt).toContain('One chair');
    expect(victor.systemPrompt_de).toContain('Ein Stuhl');
  });

  test('Victor uses coaching_intimacy safety surface', () => {
    expect(getChatContentSafetySurface('victor-systemic-coaching')).toBe('coaching_intimacy');
  });

  test('Elena bot is not registered', () => {
    expect(BOTS.find((b) => b.id === 'elena-intimacy-coaching')).toBeUndefined();
  });
});
