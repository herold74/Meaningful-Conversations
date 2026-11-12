/** User-authored open-situation field limits (server-enforced). */
const MAX_RELATIONSHIP_CHARS = 120;
const MAX_SITUATION_CHARS = 800;
const MAX_PERSONA_NAME_CHARS = 40;

/** User-turn caps by length preset (open situation). */
const OPEN_LENGTH_PRESETS = {
  short: { key: 'short', maxUserTurns: 5 },
  standard: { key: 'standard', maxUserTurns: 8 },
  long: { key: 'long', maxUserTurns: 12 },
};

const VALID_LENGTH_PRESET_KEYS = Object.keys(OPEN_LENGTH_PRESETS);

/** TTL for compiled custom scenarios (ms). */
const CUSTOM_SCENARIO_TTL_MS = 2 * 60 * 60 * 1000;

const RELATIONSHIP_BUCKETS = ['colleague', 'friend', 'family', 'partner', 'other'];

module.exports = {
  MAX_RELATIONSHIP_CHARS,
  MAX_SITUATION_CHARS,
  MAX_PERSONA_NAME_CHARS,
  OPEN_LENGTH_PRESETS,
  VALID_LENGTH_PRESET_KEYS,
  CUSTOM_SCENARIO_TTL_MS,
  RELATIONSHIP_BUCKETS,
};
