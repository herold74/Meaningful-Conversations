/**
 * Automatable classic Test Runner scenarios (excludes refinement_mock, practice_eval, comfort_check manual-only).
 * Message text resolved from locale JSON via messageKeys.
 */

export const REGRESSION_SUITES = {
  /** Quick sanity (~5 min) */
  smoke: [
    'core_response_quality',
    'session_update',
    'personality_behavior_tracking',
    'dpc_strategy_diversity',
  ],
  /**
   * Default baseline/compare suite (~20–35 min).
   * One representative scenario per subsystem / auto-check type — avoids redundant 7-turn deep dives.
   */
  regression: [
    'core_response_quality',       // core chat
    'session_full_analysis',       // session: updates + next steps + findings
    'session_dpfl_post_coaching',  // session + DPC + cumulative keywords
    'personality_loading',         // DPC injection present
    'personality_behavior_tracking', // DPFL keyword detection
    'dpc_strategy_diversity',      // ≥2 DPC strategies (tri-lens profile)
    'dpfl_adaptive_weighting',     // adaptive weighting telemetry
    'safety_crisis_response',      // crisis / stress handling
    'bot_interview',               // alternate bot (Gloria interview)
  ],
  /** Exhaustive catalog — use for deep audits, not routine baselines */
  full: [
    'core_response_quality',
    'core_context_usage',
    'session_update',
    'session_next_steps',
    'session_full_analysis',
    'session_coaching_arc',
    'session_dpfl_post_coaching',
    'personality_loading',
    'personality_response_style',
    'personality_behavior_tracking',
    'personality_blindspot',
    'dpfl_keyword_deep_dive',
    'dpfl_deep_dive_career',
    'dpfl_deep_dive_values',
    'dpfl_deep_dive_burnout',
    'dpc_strategy_diversity',
    'dpc_tri_lens',
    'dpfl_cumulative_quality',
    'dpfl_adaptive_weighting',
    'safety_crisis_response',
    'bot_interview',
  ],
};

/** @type {import('./types').ClassicScenarioDef[]} */
export const SCENARIO_DEFS = [
  {
    id: 'core_response_quality',
    category: 'core',
    botId: 'kenji-resilience',
    profilePreset: 'none',
    messageKeys: ['test_core_msg_1'],
    minConversationTurns: 3,
    enableDynamicContinuation: true,
    autoChecks: { dpcRequired: false },
  },
  {
    id: 'core_context_usage',
    category: 'core',
    botId: 'kenji-resilience',
    profilePreset: 'none',
    messageKeys: ['test_context_msg_1'],
    minConversationTurns: 3,
    enableDynamicContinuation: true,
    autoChecks: { dpcRequired: false },
  },
  {
    id: 'session_update',
    category: 'session',
    botId: 'kenji-resilience',
    profilePreset: 'tri_lens',
    messageKeys: ['test_session_msg_1', 'test_session_msg_2'],
    closingMessageKeys: ['test_session_msg_close'],
    minConversationTurns: 3,
    enableDynamicContinuation: false,
    autoChecks: { dpcRequired: false, expectSessionUpdates: true },
  },
  {
    id: 'session_next_steps',
    category: 'session',
    botId: 'kenji-resilience',
    profilePreset: 'tri_lens',
    messageKeys: ['test_nextsteps_msg_1', 'test_nextsteps_msg_2'],
    closingMessageKeys: ['test_nextsteps_msg_close'],
    minConversationTurns: 3,
    enableDynamicContinuation: false,
    autoChecks: { dpcRequired: false, expectSessionUpdates: true, expectSessionNextSteps: true },
  },
  {
    id: 'session_full_analysis',
    category: 'session',
    botId: 'kenji-resilience',
    profilePreset: 'tri_lens',
    messageKeys: ['test_session_full_msg_1', 'test_session_full_msg_2', 'test_session_full_msg_3'],
    closingMessageKeys: ['test_session_full_msg_close'],
    minConversationTurns: 4,
    enableDynamicContinuation: false,
    autoChecks: {
      dpcRequired: false,
      expectSessionUpdates: true,
      expectSessionNextSteps: true,
      expectSessionNewFindings: true,
    },
  },
  {
    id: 'session_coaching_arc',
    category: 'session',
    botId: 'kenji-resilience',
    profilePreset: 'tri_lens',
    messageKeys: ['test_session_arc_msg_1', 'test_session_arc_msg_2'],
    closingMessageKeys: ['test_session_arc_msg_close'],
    minConversationTurns: 3,
    enableDynamicContinuation: false,
    autoChecks: {
      dpcRequired: false,
      expectSessionUpdates: true,
      expectSessionNextSteps: true,
      expectSessionNewFindings: true,
    },
  },
  {
    id: 'session_dpfl_post_coaching',
    category: 'session',
    botId: 'kenji-resilience',
    profilePreset: 'dauer_ocean',
    messageKeys: ['test_session_dpfl_msg_1', 'test_session_dpfl_msg_2'],
    closingMessageKeys: ['test_session_dpfl_msg_close'],
    minConversationTurns: 3,
    enableDynamicContinuation: false,
    autoChecks: {
      dpcRequired: true,
      minDpcLength: 100,
      expectMinCumulativeKeywords: 4,
      expectSessionUpdates: true,
      expectSessionNextSteps: true,
      expectSessionNewFindings: true,
    },
  },
  {
    id: 'personality_loading',
    category: 'personality',
    botId: 'kenji-resilience',
    profilePreset: 'naehe_balanced',
    messageKeys: ['test_personality_msg_1'],
    minConversationTurns: 3,
    enableDynamicContinuation: true,
    autoChecks: { dpcRequired: true, minDpcLength: 100 },
  },
  {
    id: 'personality_response_style',
    category: 'personality',
    botId: 'kenji-resilience',
    profilePreset: 'naehe_balanced',
    messageKeys: ['test_style_msg_1'],
    minConversationTurns: 3,
    enableDynamicContinuation: true,
    autoChecks: { dpcRequired: true, minDpcLength: 200 },
  },
  {
    id: 'personality_behavior_tracking',
    category: 'personality',
    botId: 'kenji-resilience',
    profilePreset: 'dauer_ocean',
    messageKeys: ['test_dpfl_msg_1'],
    minConversationTurns: 3,
    enableDynamicContinuation: true,
    autoChecks: {
      dpcRequired: true,
      expectedKeywords: ['sicherheit', 'planung', 'struktur', 'security', 'planning', 'structure'],
    },
  },
  {
    id: 'personality_blindspot',
    category: 'personality',
    botId: 'kenji-resilience',
    profilePreset: 'high_openness',
    messageKeys: ['test_blindspot_msg_1'],
    minConversationTurns: 3,
    enableDynamicContinuation: true,
    autoChecks: { dpcRequired: true },
  },
  {
    id: 'dpfl_keyword_deep_dive',
    descriptionKey: 'test_dpfl_deep_dive_desc',
    category: 'personality',
    botId: 'kenji-resilience',
    profilePreset: 'naehe_balanced',
    messageKeys: ['test_dpfl_deep_msg_1'],
    minConversationTurns: 7,
    enableDynamicContinuation: true,
    autoChecks: { dpcRequired: true, minDpcLength: 100 },
  },
  {
    id: 'dpfl_deep_dive_career',
    category: 'personality',
    botId: 'kenji-resilience',
    profilePreset: 'distanz_orange',
    messageKeys: ['test_dpfl_deep_career_msg_1'],
    minConversationTurns: 7,
    enableDynamicContinuation: true,
    autoChecks: { dpcRequired: true, minDpcLength: 100 },
  },
  {
    id: 'dpfl_deep_dive_values',
    category: 'personality',
    botId: 'kenji-resilience',
    profilePreset: 'wechsel_balanced',
    messageKeys: ['test_dpfl_deep_values_msg_1'],
    minConversationTurns: 7,
    enableDynamicContinuation: true,
    autoChecks: { dpcRequired: true, minDpcLength: 100 },
  },
  {
    id: 'dpfl_deep_dive_burnout',
    category: 'personality',
    botId: 'kenji-resilience',
    profilePreset: 'naehe_green',
    messageKeys: ['test_dpfl_deep_burnout_msg_1'],
    minConversationTurns: 7,
    enableDynamicContinuation: true,
    autoChecks: { dpcRequired: true, minDpcLength: 100 },
  },
  {
    id: 'dpc_strategy_diversity',
    category: 'personality',
    botId: 'kenji-resilience',
    profilePreset: 'tri_lens',
    messageKeys: ['test_dpc_strategy_msg_1'],
    minConversationTurns: 4,
    enableDynamicContinuation: true,
    autoChecks: { dpcRequired: true, minDpcLength: 150, expectMinDpcStrategies: 2 },
  },
  {
    id: 'dpc_tri_lens',
    category: 'personality',
    botId: 'kenji-resilience',
    profilePreset: 'tri_lens',
    messageKeys: ['test_dpc_tri_lens_msg_1'],
    minConversationTurns: 4,
    enableDynamicContinuation: true,
    autoChecks: { dpcRequired: true, minDpcLength: 200, expectMinDpcStrategies: 2 },
  },
  {
    id: 'dpfl_cumulative_quality',
    category: 'personality',
    botId: 'kenji-resilience',
    profilePreset: 'naehe_balanced',
    messageKeys: ['test_dpfl_cumulative_msg_1'],
    minConversationTurns: 5,
    enableDynamicContinuation: true,
    autoChecks: {
      dpcRequired: true,
      minDpcLength: 100,
      expectMinCumulativeKeywords: 8,
      expectedKeywords: ['angst', 'planung', 'freiheit', 'anxiety', 'planning', 'freedom'],
    },
  },
  {
    id: 'dpfl_adaptive_weighting',
    category: 'personality',
    botId: 'kenji-resilience',
    profilePreset: 'naehe_balanced',
    messageKeys: ['test_dpfl_adaptive_msg_1'],
    minConversationTurns: 4,
    enableDynamicContinuation: true,
    autoChecks: {
      dpcRequired: true,
      minDpcLength: 100,
      expectAdaptiveWeighting: true,
      expectMinCumulativeKeywords: 3,
    },
  },
  {
    id: 'safety_crisis_response',
    category: 'safety',
    botId: 'kenji-resilience',
    profilePreset: 'tri_lens',
    messageKeys: ['test_crisis_msg_1', 'test_crisis_msg_2'],
    minConversationTurns: 2,
    enableDynamicContinuation: false,
    autoChecks: { dpcRequired: false, expectStressKeywords: true },
  },
  {
    id: 'bot_interview',
    category: 'bot',
    botId: 'gloria-interview',
    profilePreset: 'none',
    messageKeys: ['test_interview_msg_1'],
    minConversationTurns: 3,
    enableDynamicContinuation: true,
    autoChecks: { dpcRequired: false },
  },
];

export function getScenarioDef(id) {
  return SCENARIO_DEFS.find((s) => s.id === id);
}

export function resolveScenarioMessages(def, t) {
  const keys = [...def.messageKeys, ...(def.closingMessageKeys || [])];
  return keys.map((key) => ({ text: t(key) }));
}
