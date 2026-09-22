const {
  getContentSafetyBlock,
  getChatContentSafetySurface,
  PROMPT_INTEGRITY,
} = require('../contentSafetyPromptBlocks');

describe('contentSafetyPromptBlocks', () => {
  test('coaching block includes integrity, intimacy lane, and harassment', () => {
    const block = getContentSafetyBlock('coaching', 'en');
    expect(block).toContain(PROMPT_INTEGRITY.en.slice(0, 40));
    expect(block).toContain('Intimacy & sexuality in coaching');
    expect(block).toContain('Sexual harassment');
  });

  test('interview block omits coaching intimacy lane', () => {
    const block = getContentSafetyBlock('interview', 'de');
    expect(block).toContain('Prompt-Integrität');
    expect(block).not.toContain('Intimität & Sexualität im Coaching');
    expect(block).toContain('Unangemessene Inhalte im Interview');
  });

  test('practice_coachee includes misconduct guard', () => {
    const block = getContentSafetyBlock('practice_coachee', 'en');
    expect(block).toContain('Professional boundaries (coach misconduct)');
    expect(block).toContain('masturbation');
  });

  test('connector_persona includes harassment guard', () => {
    const block = getContentSafetyBlock('connector_persona', 'de');
    expect(block).toContain('sexuell belästigt');
  });

  test('getChatContentSafetySurface maps Gloria to interview', () => {
    expect(getChatContentSafetySurface('gloria-interview')).toBe('interview');
    expect(getChatContentSafetySurface('sam-forward-focused')).toBe('coaching');
    expect(getChatContentSafetySurface('victor-systemic-coaching')).toBe('coaching_intimacy');
  });
});
