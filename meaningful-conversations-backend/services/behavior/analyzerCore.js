/**
 * Create a Unicode-aware keyword regex for German text.
 * JavaScript's \b word boundary does NOT treat umlauts (ü,ö,ä,ß) as word characters,
 * so keywords starting with umlauts (e.g. "überfordert", "ängstlich", "ökonomisch")
 * would silently fail to match. This function uses Unicode property escapes instead.
 *
 * Pattern: Match the keyword (optionally followed by more letters) only when
 * it's not preceded or followed by a Unicode letter.
 *
 * @param {string} word - The keyword to search for
 * @returns {RegExp} A Unicode-aware regex with global+case-insensitive flags
 */
function createKeywordRegex(word) {
  // Escape special regex characters in the keyword
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Use Unicode property \p{L} for letter boundaries instead of \b
  return new RegExp(`(?<!\\p{L})${escaped}\\p{L}*(?!\\p{L})`, 'giu');
}

module.exports = { createKeywordRegex };
