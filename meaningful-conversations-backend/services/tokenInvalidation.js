/**
 * Token invalidation service.
 *
 * Dual-layer revocation so that password changes/resets take effect on ALL
 * PM2 cluster workers, not just the worker that processed the request:
 *
 *   1. In-memory Map  — instant check on the same worker (zero DB round-trip).
 *   2. DB column      — `User.tokensInvalidatedAt` — checked when the in-memory
 *                       cache has no entry for a user. This covers workers that
 *                       did not handle the invalidation request, and survives
 *                       server restarts.
 *
 * For multi-server deployments, replace the in-memory layer with Redis.
 */

const prisma = require('../prismaClient.js');

/** userId → Unix timestamp (seconds) after which all tokens are invalid */
const invalidatedUsers = new Map();

/**
 * Marks all tokens for the user as invalid from this moment on.
 * Writes to the DB so other PM2 workers pick it up.
 * @param {string} userId
 */
async function invalidateTokensForUser(userId) {
    const now = new Date();
    invalidatedUsers.set(userId, Math.floor(now.getTime() / 1000));
    await prisma.user.update({
        where: { id: userId },
        data: { tokensInvalidatedAt: now },
    });
}

/**
 * Returns true if the token (identified by its issued-at timestamp) has been
 * invalidated for this user — checking both the in-memory cache and the DB.
 * @param {string} userId
 * @param {number} tokenIssuedAt  JWT `iat` claim (seconds since epoch)
 * @returns {Promise<boolean>}
 */
async function isTokenInvalidated(userId, tokenIssuedAt) {
    // Fast path: check the in-memory cache for this worker
    const cachedAt = invalidatedUsers.get(userId);
    if (cachedAt !== undefined) {
        return tokenIssuedAt < cachedAt;
    }

    // Slow path: check the DB (covers other workers and post-restart state)
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tokensInvalidatedAt: true },
    });

    if (!user?.tokensInvalidatedAt) return false;

    const invalidatedAtSec = Math.floor(user.tokensInvalidatedAt.getTime() / 1000);
    // Warm up the local cache so subsequent requests on this worker skip the DB
    invalidatedUsers.set(userId, invalidatedAtSec);
    return tokenIssuedAt < invalidatedAtSec;
}

/**
 * Synchronous in-memory-only check — safe for optional-auth middleware where
 * a DB round-trip is not warranted. Only catches invalidations that happened
 * on this PM2 worker in the current process lifetime. Use `isTokenInvalidated`
 * (async) on protected routes where cross-worker revocation must be enforced.
 * @param {string} userId
 * @param {number} tokenIssuedAt
 * @returns {boolean}
 */
function isTokenInvalidatedSync(userId, tokenIssuedAt) {
    const cachedAt = invalidatedUsers.get(userId);
    if (cachedAt === undefined) return false;
    return tokenIssuedAt < cachedAt;
}

module.exports = { invalidateTokensForUser, isTokenInvalidated, isTokenInvalidatedSync };
