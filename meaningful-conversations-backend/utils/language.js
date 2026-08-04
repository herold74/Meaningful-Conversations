/**
 * Normalize UI/API language to supported coaching locale.
 * Defaults to German (primary product locale) when missing or invalid.
 * @param {string|undefined|null} language
 * @returns {'de'|'en'}
 */
function normalizeLanguage(language) {
  return language === 'en' ? 'en' : 'de';
}

module.exports = { normalizeLanguage };
