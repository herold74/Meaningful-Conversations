const {
  getPrepFocusIllustration,
  getNoConcreteConversationPhaseBlock,
} = require('../connectorPrepExamples.js');

describe('connectorPrepExamples', () => {
  it('returns generic EN illustration per dimension without catalog names', () => {
    const presence = getPrepFocusIllustration('en', 'presence');
    expect(presence).toContain('Someone close to you');
    expect(presence).not.toMatch(/\bNina\b/i);
  });

  it('includes Phase 2 guidance and illustration in handoff block', () => {
    const block = getNoConcreteConversationPhaseBlock('en', 'empathy', { questionsOnly: true });
    expect(block).toContain('Phase 2');
    expect(block).toContain('neutral example');
    expect(block).toContain('colleague');
  });
});
