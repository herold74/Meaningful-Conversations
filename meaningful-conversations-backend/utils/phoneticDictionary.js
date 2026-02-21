// Phonetic Dictionary Loader
// Loads and caches phonetic replacements for TTS text cleaning
// Performance: Dictionary is loaded once at server startup and cached in memory

const fs = require('fs');
const path = require('path');

// Cache for the loaded dictionary
let dictionaryCache = null;
let lastLoadTime = null;

/**
 * Load the phonetic dictionary from JSON file
 * @returns {Object} Dictionary object with language-specific patterns
 */
function loadDictionary() {
    try {
        const dictionaryPath = path.join(__dirname, '../config/phonetic-dictionary.json');
        const dictionaryData = fs.readFileSync(dictionaryPath, 'utf8');
        const dictionary = JSON.parse(dictionaryData);
        
        lastLoadTime = new Date();
        console.log(`✓ Phonetic dictionary loaded (version ${dictionary.version})`);
        
        return dictionary;
    } catch (error) {
        console.warn('⚠️  Could not load phonetic dictionary:', error.message);
        console.warn('   Falling back to empty dictionary');
        return {
            version: '0.0.0',
            languages: {}
        };
    }
}

/**
 * Get phonetic replacements for a specific language
 * Uses cached dictionary for performance (no I/O on each request)
 * @param {string} language - Language code ('de', 'en', etc.)
 * @returns {Array} Array of pattern objects with term, phonetic, and caseSensitive
 */
function getPhoneticReplacements(language) {
    // Load dictionary on first access (lazy loading)
    if (!dictionaryCache) {
        dictionaryCache = loadDictionary();
    }
    
    const languagePatterns = dictionaryCache.languages[language];
    if (!languagePatterns || !languagePatterns.patterns) {
        return [];
    }
    
    // Return full pattern objects with metadata (term, phonetic, caseSensitive)
    // This allows the replacement logic to respect case sensitivity
    return languagePatterns.patterns.map(pattern => ({
        term: pattern.term,
        phonetic: pattern.phonetic,
        caseSensitive: pattern.caseSensitive !== false  // Default to true if not specified
    }));
}

/**
 * Get all phonetic patterns for a language (with metadata)
 * @param {string} language - Language code
 * @returns {Array} Array of pattern objects with metadata
 */
function getPhoneticPatterns(language) {
    if (!dictionaryCache) {
        dictionaryCache = loadDictionary();
    }
    
    const languagePatterns = dictionaryCache.languages[language];
    return languagePatterns?.patterns || [];
}

/**
 * Reload the dictionary from disk
 * Useful for hot-reloading without server restart
 * @returns {Object} Newly loaded dictionary
 */
function reloadDictionary() {
    console.log('🔄 Reloading phonetic dictionary...');
    dictionaryCache = loadDictionary();
    return dictionaryCache;
}

/**
 * Get dictionary statistics
 * @returns {Object} Stats about the loaded dictionary
 */
function getDictionaryStats() {
    if (!dictionaryCache) {
        dictionaryCache = loadDictionary();
    }
    
    const stats = {
        version: dictionaryCache.version,
        lastLoaded: lastLoadTime,
        languages: {}
    };
    
    for (const [languageCode, data] of Object.entries(dictionaryCache.languages)) {
        stats.languages[languageCode] = {
            description: data.description,
            patternCount: data.patterns?.length || 0
        };
    }
    
    return stats;
}

module.exports = {
    getPhoneticReplacements,
    getPhoneticPatterns,
    reloadDictionary,
    getDictionaryStats
};

