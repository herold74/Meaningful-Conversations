const {
  countCoachMessages,
  buildFreePlayPriorContext,
  validatePhase2EvaluationGate,
  MIN_PHASE2_COACH_MESSAGES,
} = require('../phase2Evaluation.js');

describe('phase2Evaluation', () => {
  describe('countCoachMessages', () => {
    test('counts user-role messages only', () => {
      const history = [
        { role: 'user', text: 'Coach turn 1' },
        { role: 'bot', text: 'Coachee reply' },
        { role: 'user', text: 'Coach turn 2' },
      ];
      expect(countCoachMessages(history)).toBe(2);
    });

    test('returns 0 for empty history', () => {
      expect(countCoachMessages([])).toBe(0);
    });
  });

  describe('buildFreePlayPriorContext', () => {
    test('includes clarified concern and session contract only', () => {
      expect(
        buildFreePlayPriorContext({
          clarifiedConcern: 'Career pivot',
          sessionContract: 'Define next steps',
        }),
      ).toBe('Career pivot\nDefine next steps');
    });

    test('omits prior transcript from eval context', () => {
      const context = buildFreePlayPriorContext({
        clarifiedConcern: 'Career pivot',
        sessionContract: 'Define next steps',
      });
      expect(context).not.toContain('Coach: Hello from contracting');
      expect(context).not.toMatch(/prior/i);
    });
  });

  describe('validatePhase2EvaluationGate', () => {
    test('passes when no Phase 2 link', () => {
      expect(validatePhase2EvaluationGate('', [{ role: 'user', text: 'Hi' }])).toEqual({ ok: true });
    });

    test('rejects when fewer than minimum coach messages', () => {
      const result = validatePhase2EvaluationGate('eval-123', [
        { role: 'user', text: 'Only one coach turn' },
        { role: 'bot', text: 'Reply' },
      ]);
      expect(result.ok).toBe(false);
      expect(result.errorCode).toBe('PRACTICE_PHASE2_TOO_SHORT');
      expect(result.coachMessageCount).toBe(1);
    });

    test('passes with enough coach messages', () => {
      const history = Array.from({ length: MIN_PHASE2_COACH_MESSAGES }, (_, i) => ({
        role: 'user',
        text: `Coach turn ${i + 1}`,
      }));
      expect(validatePhase2EvaluationGate('eval-123', history)).toEqual({ ok: true });
    });
  });
});
