/**
 * Neutral method & bot identifiers — single source of truth.
 *
 * TEMPORARY: LEGACY_*_ALIASES are a runtime compatibility shim for clients/DB still
 * using pre-2.4.0 IDs. Remove when no longer needed — see
 * DOCUMENTATION/LEGACY-ALIASES-REMOVAL.md (criteria + checklist).
 */

/** @type {Record<string, string>} legacy frameworkId → canonical */
const LEGACY_FRAMEWORK_ALIASES = {
  gps: 'goal-path-solution',
  grow: 'four-stage-coaching',
  stoic: 'resilience-coaching',
  cbt: 'structured-reflection',
  bowen: 'systemic-coaching',
  'solution-focused': 'forward-focused-coaching',
  sfb: 'forward-focused-coaching',
  'motivational-interviewing': 'ambivalence-coaching',
  mi: 'ambivalence-coaching',
  'clean-language': 'client-exact-language',
  'mental-fitness': 'mental-fitness-coaching',
};

/** @type {Record<string, string>} legacy botId → canonical */
const LEGACY_BOT_ALIASES = {
  'nexus-gps': 'nexus-goal-path-solution',
  'steve-solution-focused': 'sam-forward-focused',
  'gabrielle-grow': 'gabrielle-four-stage',
  'mike-motivational-interviewing': 'mike-ambivalence-coaching',
  'dan-clean-language': 'dan-client-language',
  'chloe-cbt': 'chloe-structured-reflection',
  'kenji-stoic': 'kenji-resilience',
  'victor-bowen': 'victor-systemic-coaching',
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
  'contracting',
  'free-play',
];

/** Practice-only sentinel IDs — excluded from public catalog and progress milestones. */
const PRACTICE_SENTINEL_FRAMEWORKS = ['contracting', 'free-play'];

function isPracticeSentinelFramework(id) {
  if (!id || typeof id !== 'string') return false;
  const canonical = resolveFrameworkId(id);
  return PRACTICE_SENTINEL_FRAMEWORKS.includes(canonical);
}

function isRealPracticeFramework(id) {
  if (!id || typeof id !== 'string') return false;
  return !isPracticeSentinelFramework(id);
}

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
  PRACTICE_SENTINEL_FRAMEWORKS,
  DEFAULT_PRACTICE_PAIR,
  resolveFrameworkId,
  resolveBotId,
  normalizeUnlockedCoaches,
  isPracticeSentinelFramework,
  isRealPracticeFramework,
};
