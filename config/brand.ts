/**
 * Central branding configuration.
 * All values default to the original "Meaningful Conversations / manualmode.at" brand
 * with the Work4Flow color palette.
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
  primaryColor:     import.meta.env.VITE_BRAND_PRIMARY_COLOR      || '#4A7A9B',
  primaryColorDark: import.meta.env.VITE_BRAND_PRIMARY_COLOR_DARK || '#1B3A5C',
  domainStaging:    import.meta.env.VITE_BRAND_DOMAIN_STAGING     || 'mc-beta.manualmode.at',
  domainProduction: import.meta.env.VITE_BRAND_DOMAIN_PRODUCTION  || 'mc-app.manualmode.at',
  appUrlProduction: import.meta.env.VITE_BRAND_APP_URL_PRODUCTION || 'https://mc-app.manualmode.at',

  /** 4-shade brand palette (lightest to darkest) */
  color1: import.meta.env.VITE_BRAND_COLOR_1 || '#89C4E1',
  color2: import.meta.env.VITE_BRAND_COLOR_2 || '#6A9DBF',
  color3: import.meta.env.VITE_BRAND_COLOR_3 || '#4A7A9B',
  color4: import.meta.env.VITE_BRAND_COLOR_4 || '#1B3A5C',
  /** Accent color (call-to-action, highlights) */
  accent: import.meta.env.VITE_BRAND_ACCENT  || '#F59E0B',
  /** Loading indicator style */
  loader: (import.meta.env.VITE_BRAND_LOADER || 'tetris') as 'tetris' | 'steering-wheel' | 'dots' | 'pulse',
} as const;

export type Brand = typeof brand;
export type BrandLoaderType = Brand['loader'];
