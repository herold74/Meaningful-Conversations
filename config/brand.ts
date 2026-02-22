/**
 * Central branding configuration.
 * All values default to the original "Meaningful Conversations / manualmode.at" brand.
 * Override any value at build time via VITE_BRAND_* environment variables in .env.
 */
export const brand = {
  appName:          import.meta.env.VITE_BRAND_APP_NAME           || 'Meaningful Conversations',
  appNameDe:        import.meta.env.VITE_BRAND_APP_NAME_DE        || 'Sinnstiftende Gespräche',
  shortName:        import.meta.env.VITE_BRAND_SHORT_NAME         || 'Meaningful',
  providerName:     import.meta.env.VITE_BRAND_PROVIDER_NAME      || 'manualmode.at',
  providerUrl:      import.meta.env.VITE_BRAND_PROVIDER_URL       || 'https://www.manualmode.at',
  contactEmail:     import.meta.env.VITE_BRAND_CONTACT_EMAIL      || 'gherold@manualmode.at',
  ownerName:        import.meta.env.VITE_BRAND_OWNER_NAME         || 'Günter Herold',
  primaryColor:     import.meta.env.VITE_BRAND_PRIMARY_COLOR      || '#1B7272',
  primaryColorDark: import.meta.env.VITE_BRAND_PRIMARY_COLOR_DARK || '#165a5a',
  domainStaging:    import.meta.env.VITE_BRAND_DOMAIN_STAGING     || 'mc-beta.manualmode.at',
  domainProduction: import.meta.env.VITE_BRAND_DOMAIN_PRODUCTION  || 'mc-app.manualmode.at',
  appUrlProduction: import.meta.env.VITE_BRAND_APP_URL_PRODUCTION || 'https://mc-app.manualmode.at',
} as const;

export type Brand = typeof brand;
