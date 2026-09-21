/**
 * Read localized vignette fields for curated (de/en objects) or custom (plain strings).
 */
function localizedField(vignette, field, language) {
  const lang = language === 'en' ? 'en' : 'de';
  const value = vignette[field];
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && (value.de || value.en)) {
    return value[lang] || value.de || value.en || '';
  }
  return String(value);
}

function toPublicVignetteFromInternal(vignette, language = 'de') {
  const lang = language === 'en' ? 'en' : 'de';
  return {
    id: vignette.id,
    personaName: vignette.personaName,
    gender: vignette.gender,
    relationship: localizedField(vignette, 'relationship', lang),
    opening: localizedField(vignette, 'opening', lang),
    pickerTeaser: localizedField(vignette, 'pickerTeaser', lang) || localizedField(vignette, 'scenarioBrief', lang),
    scenarioBrief: localizedField(vignette, 'scenarioBrief', lang),
  };
}

module.exports = {
  localizedField,
  toPublicVignetteFromInternal,
};
