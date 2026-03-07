/**
 * Central branding configuration.
 * Defaults to the original "Meaningful Conversations / manualmode.at" teal palette.
 * Override any value at build time via VITE_BRAND_* environment variables in .env.
 */
export const brand = {
  appName:          import.meta.env.VITE_BRAND_APP_NAME           || 'Meaningful Conversations',
  appNameDe:        import.meta.env.VITE_BRAND_APP_NAME_DE        || 'Sinnstiftende Gespräche',
  shortName:        import.meta.env.VITE_BRAND_SHORT_NAME         || 'Meaningful',
  providerName:     import.meta.env.VITE_BRAND_PROVIDER_NAME      || 'manualmode.at',
  providerUrl:      import.meta.env.VITE_BRAND_PROVIDER_URL       || 'https://www.manualmode.at',
  contactEmail:     import.meta.env.VITE_BRAND_CONTACT_EMAIL      || 'support@manualmode.at',
  ownerName:        import.meta.env.VITE_BRAND_OWNER_NAME         || 'Günter Herold',
  primaryColor:     import.meta.env.VITE_BRAND_PRIMARY_COLOR      || '#1B7272',
  primaryColorDark: import.meta.env.VITE_BRAND_PRIMARY_COLOR_DARK || '#165a5a',
  domainStaging:    import.meta.env.VITE_BRAND_DOMAIN_STAGING     || 'mc-beta.manualmode.at',
  domainProduction: import.meta.env.VITE_BRAND_DOMAIN_PRODUCTION  || 'mc-app.manualmode.at',
  appUrlProduction: import.meta.env.VITE_BRAND_APP_URL_PRODUCTION || 'https://mc-app.manualmode.at',
  serverIp:         import.meta.env.VITE_BRAND_SERVER_IP           || '',

  /** 4-shade brand palette (lightest to darkest) */
  color1: import.meta.env.VITE_BRAND_COLOR_1 || '#5BBFBF',
  color2: import.meta.env.VITE_BRAND_COLOR_2 || '#3D9E9E',
  color3: import.meta.env.VITE_BRAND_COLOR_3 || '#1B7272',
  color4: import.meta.env.VITE_BRAND_COLOR_4 || '#165a5a',
  /** Accent color (call-to-action, highlights) */
  accent: import.meta.env.VITE_BRAND_ACCENT  || '#F59E0B',
  /** Loading indicator style */
  loader: (import.meta.env.VITE_BRAND_LOADER || 'steering-wheel') as 'tetris' | 'steering-wheel' | 'dots' | 'pulse',
} as const;

export type Brand = typeof brand;
export type BrandLoaderType = Brand['loader'];
