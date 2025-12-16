// meaningful-conversations-backend/services/promptCache.js

/**
 * Prompt Caching Service for Gemini API
 * 
 * Implements 5-minute TTL caching for Life Context to improve performance
 * and reduce API costs while maintaining GDPR compliance.
 */

const CACHE_TTL_SECONDS = 300; // 5 minutes - GDPR-optimized
const CACHE_CLEANUP_INTERVAL = 60000; // Clean up expired caches every minute

// In-memory cache registry to track active caches
// Maps userId -> { cacheName, expireTime, systemInstruction }
const cacheRegistry = new Map();

/**
 * Get or create a cached content for a user's system instruction
 * @param {object} ai - The Google AI client
 * @param {string} userId - User ID for cache key
 * @param {string} systemInstruction - The full system instruction including Life Context
 * @param {string} modelName - The model name to use
 * @returns {Promise<string|null>} Cache name if successful, null otherwise
 */
async function getOrCreateCache(ai, userId, systemInstruction, modelName = 'gemini-2.5-flash') {
    if (!ai || !userId || !systemInstruction) {
        return null;
    }

    const now = new Date();
    const cacheKey = `user_${userId}`;
    
    // Check if we have a valid cache in our registry
    const existingCache = cacheRegistry.get(cacheKey);
    if (existingCache && existingCache.expireTime > now) {
        // Check if the system instruction hasn't changed
        if (existingCache.systemInstruction === systemInstruction) {
            return existingCache.cacheName;
        } else {
            // System instruction changed, delete old cache
            await deleteCache(ai, cacheKey);
        }
    }
    
    // Create new cache
    try {
        
        const cachedContent = await ai.caches.create({
            model: modelName,
            displayName: cacheKey,
            systemInstruction: systemInstruction,
            ttl: `${CACHE_TTL_SECONDS}s`,
        });
        
        // Store in registry
        const expireTime = new Date(cachedContent.expireTime);
        cacheRegistry.set(cacheKey, {
            cacheName: cachedContent.name,
            expireTime: expireTime,
            systemInstruction: systemInstruction,
            createdAt: now,
        });
        
        return cachedContent.name;
        
    } catch (error) {
        console.error(`[Cache ERROR] Failed to create cache for user ${userId}:`, error.message);
        return null;
    }
}

/**
 * Delete a specific cache
 * @param {object} ai - The Google AI client
 * @param {string} cacheKey - The cache key to delete
 */
async function deleteCache(ai, cacheKey) {
    const cache = cacheRegistry.get(cacheKey);
    if (cache) {
        try {
            await ai.caches.delete(cache.cacheName);
        } catch (error) {
            console.error(`[Cache DELETE ERROR] Failed to delete cache ${cache.cacheName}:`, error.message);
        }
        cacheRegistry.delete(cacheKey);
    }
}

/**
 * Clean up expired caches from the registry
 */
function cleanupExpiredCaches() {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [key, cache] of cacheRegistry.entries()) {
        if (cache.expireTime <= now) {
            cacheRegistry.delete(key);
            cleanedCount++;
        }
    }
    
    if (cleanedCount > 0) {
    }
}

/**
 * Get cache statistics
 * @returns {object} Cache stats
 */
function getCacheStats() {
    const now = new Date();
    const activeCaches = Array.from(cacheRegistry.values()).filter(c => c.expireTime > now);
    
    return {
        totalCaches: cacheRegistry.size,
        activeCaches: activeCaches.length,
        expiredCaches: cacheRegistry.size - activeCaches.length,
        ttlSeconds: CACHE_TTL_SECONDS,
    };
}

/**
 * Clear all caches (for testing or maintenance)
 * @param {object} ai - The Google AI client
 */
async function clearAllCaches(ai) {
    
    const promises = [];
    for (const [key, cache] of cacheRegistry.entries()) {
        promises.push(
            ai.caches.delete(cache.cacheName)
                .catch(err => console.error(`Failed to delete cache ${cache.cacheName}:`, err.message))
        );
    }
    
    await Promise.all(promises);
    cacheRegistry.clear();
}

// Start cleanup interval
setInterval(cleanupExpiredCaches, CACHE_CLEANUP_INTERVAL);

module.exports = {
    getOrCreateCache,
    deleteCache,
    getCacheStats,
    clearAllCaches,
    CACHE_TTL_SECONDS,
};

