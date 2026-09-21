const { randomBytes } = require('crypto');
const { CUSTOM_SCENARIO_TTL_MS } = require('./connectorLimits.js');

/** @type {Map<string, { userId: string, vignette: object, maxUserTurns: number, lengthPreset: string, relationshipBucket: string, expiresAt: number }>} */
const store = new Map();

function pruneExpired() {
  const now = Date.now();
  for (const [id, entry] of store.entries()) {
    if (entry.expiresAt <= now) store.delete(id);
  }
}

function createCustomScenarioId() {
  return `custom-${randomBytes(12).toString('hex')}`;
}

/**
 * @param {object} params
 * @param {string} params.userId
 * @param {object} params.vignette full internal vignette (includes trap — never sent to client)
 * @param {number} params.maxUserTurns
 * @param {string} params.lengthPreset
 * @param {string} params.relationshipBucket
 */
function putCustomScenario(params) {
  pruneExpired();
  const id = createCustomScenarioId();
  store.set(id, {
    userId: params.userId,
    vignette: { ...params.vignette, id },
    maxUserTurns: params.maxUserTurns,
    lengthPreset: params.lengthPreset,
    relationshipBucket: params.relationshipBucket,
    expiresAt: Date.now() + CUSTOM_SCENARIO_TTL_MS,
  });
  return id;
}

/**
 * @returns {{ vignette: object, maxUserTurns: number, lengthPreset: string, relationshipBucket: string } | null}
 */
function getCustomScenario(customScenarioId, userId) {
  pruneExpired();
  const entry = store.get(customScenarioId);
  if (!entry || entry.expiresAt <= Date.now()) {
    if (entry) store.delete(customScenarioId);
    return null;
  }
  if (entry.userId !== userId) return null;
  return {
    vignette: entry.vignette,
    maxUserTurns: entry.maxUserTurns,
    lengthPreset: entry.lengthPreset,
    relationshipBucket: entry.relationshipBucket,
  };
}

function __clearCustomScenarioStoreForTests() {
  store.clear();
}

module.exports = {
  putCustomScenario,
  getCustomScenario,
  __clearCustomScenarioStoreForTests,
};
