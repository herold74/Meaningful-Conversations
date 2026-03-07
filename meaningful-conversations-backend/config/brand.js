/**
 * Central branding configuration for the backend.
 * All values default to the original "Meaningful Conversations / manualmode.at" brand.
 * Override any value at runtime via BRAND_* environment variables in .env.
 */
const brand = {
  appName:          process.env.BRAND_APP_NAME           || 'Meaningful Conversations',
  appNameDe:        process.env.BRAND_APP_NAME_DE        || 'Sinnstiftende Gespräche',
  providerName:     process.env.BRAND_PROVIDER_NAME      || 'manualmode.at',
  providerUrl:      process.env.BRAND_PROVIDER_URL       || 'https://www.manualmode.at',
  contactEmail:     process.env.BRAND_CONTACT_EMAIL      || 'support@manualmode.at',
  ownerName:        process.env.BRAND_OWNER_NAME         || 'Günter Herold',
  primaryColor:     process.env.BRAND_PRIMARY_COLOR      || '#1B7272',
  primaryColorDark: process.env.BRAND_PRIMARY_COLOR_DARK || '#165a5a',
};

brand.senderName = process.env.BRAND_SENDER_NAME
  || `${brand.appName} | www.${brand.providerName}`;

module.exports = brand;
