/**
 * Neutral method & bot identifiers — single source of truth.
 * Legacy IDs resolve via aliases until DB migration completes (remove aliases in 2.5.0).
 */

/** @type {Record<string, string>} legacy frameworkId → canonical */
const LEGACY_FRAMEWORK_ALIASES = {
  gps: 'goal-path-solution',
  grow: 'four-stage-coaching',
  'forward-focused-coaching': 'forward-focused-coaching',
  'ambivalence-coaching': 'ambivalence-coaching',
  'client-exact-language': 'client-exact-language',
  stoic: 'resilience-coaching',
  ambitious: 'ambitious-coaching',
  strategic: 'strategic-coaching',
  'structured-reflection': 'structured-reflection',
  'mental-fitness': 'mental-fitness-coaching',
  systemic: 'systemic-coaching',
  'thought-audit': 'thought-audit',
};

/** @type {Record<string, string>} legacy botId → canonical */
const LEGACY_BOT_ALIASES = {
  'nexus-goal-path-solution': 'nexus-goal-path-solution',
  'sam-forward-focused': 'sam-forward-focused',
  'gabrielle-four-stage': 'gabrielle-four-stage',
  'kenji-resilience': 'kenji-resilience',
  'chloe-structured-reflection': 'chloe-structured-reflection',
  'mike-ambivalence-coaching': 'mike-ambivalence-coaching',
  'dan-client-language': 'dan-client-language',
  'victor-systemic-coaching': 'victor-systemic-coaching',
};

const ALL_FRAMEWORK_IDS = [
  'goal-path-solution',
  'ambitious-coaching',
  'strategic-coaching',
  'resilience-coaching',
  'structured-reflection',
  'mental-fitness-coaching',
  'systemic-coaching',
  'thought-audit',
  'client-exact-language',
  'four-stage-coaching',
  'forward-focused-coaching',
  'ambivalence-coaching',
];

const DEFAULT_PRACTICE_PAIR = {
  frameworkId: 'four-stage-coaching',
  scenarioId: 'career-decision',
};

function resolveFrameworkId(id) {
  if (!id || typeof id !== 'string') return id;
  return LEGACY_FRAMEWORK_ALIASES[id] || id;
}

function resolveBotId(id) {
  if (!id || typeof id !== 'string') return id;
  return LEGACY_BOT_ALIASES[id] || id;
}

function normalizeUnlockedCoaches(ids) {
  if (!Array.isArray(ids)) return ids;
  return [...new Set(ids.map((b) => resolveBotId(b)))];
}

module.exports = {
  LEGACY_FRAMEWORK_ALIASES,
  LEGACY_BOT_ALIASES,
  ALL_FRAMEWORK_IDS,
  DEFAULT_PRACTICE_PAIR,
  resolveFrameworkId,
  resolveBotId,
  normalizeUnlockedCoaches,
};
