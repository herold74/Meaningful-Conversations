/**
 * In-memory token invalidation tracker.
 * Stores the timestamp after which tokens for a user are invalid.
 * Cleared on server restart (acceptable: restart = re-deploy = re-login expected).
 * For multi-server setups, replace with Redis.
 */
const invalidatedUsers = new Map();

function invalidateTokensForUser(userId) {
    invalidatedUsers.set(userId, Math.floor(Date.now() / 1000));
}

function isTokenInvalidated(userId, tokenIssuedAt) {
    const invalidatedAt = invalidatedUsers.get(userId);
    if (!invalidatedAt) return false;
    return tokenIssuedAt < invalidatedAt;
}

module.exports = { invalidateTokensForUser, isTokenInvalidated };
