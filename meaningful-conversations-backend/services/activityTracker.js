/**
 * Anonymous in-memory activity tracker.
 *
 * Records only timestamps — no user IDs, no request details, no persistent storage.
 * Data is lost on server restart. GDPR-safe: no personal data is processed.
 *
 * Purpose: allow admins to check whether API traffic is active before deploying.
 */

const timestamps = [];

const WINDOWS = {
    min5:  5  * 60 * 1000,
    min15: 15 * 60 * 1000,
    hour1: 60 * 60 * 1000,
};

/**
 * Record an anonymous API activity timestamp.
 */
function recordActivity() {
    timestamps.push(Date.now());
}

/**
 * Purge entries older than the longest window to keep memory bounded.
 */
function purgeOld() {
    const cutoff = Date.now() - WINDOWS.hour1;
    while (timestamps.length > 0 && timestamps[0] < cutoff) {
        timestamps.shift();
    }
}

/**
 * Returns aggregated request counts for the standard time windows.
 * @returns {{ requestsLast5Min: number, requestsLast15Min: number, requestsLastHour: number }}
 */
function getActivityStats() {
    purgeOld();
    const now = Date.now();
    return {
        requestsLast5Min:  timestamps.filter(t => now - t <= WINDOWS.min5).length,
        requestsLast15Min: timestamps.filter(t => now - t <= WINDOWS.min15).length,
        requestsLastHour:  timestamps.filter(t => now - t <= WINDOWS.hour1).length,
    };
}

module.exports = { recordActivity, getActivityStats };
