const MIN_PHASE2_COACH_MESSAGES = 2;

function countCoachMessages(history) {
  return (history || []).filter((msg) => msg.role === 'user').length;
}

function buildFreePlayPriorContext({ clarifiedConcern = '', sessionContract = '' }) {
  return [clarifiedConcern, sessionContract].filter(Boolean).join('\n');
}

function validatePhase2EvaluationGate(followsContractingEvaluationId, history) {
  if (!followsContractingEvaluationId?.trim()) {
    return { ok: true };
  }
  const coachMessageCount = countCoachMessages(history);
  if (coachMessageCount < MIN_PHASE2_COACH_MESSAGES) {
    return {
      ok: false,
      errorCode: 'PRACTICE_PHASE2_TOO_SHORT',
      coachMessageCount,
    };
  }
  return { ok: true };
}

module.exports = {
  MIN_PHASE2_COACH_MESSAGES,
  countCoachMessages,
  buildFreePlayPriorContext,
  validatePhase2EvaluationGate,
};
