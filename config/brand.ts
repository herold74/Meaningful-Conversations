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
  /** Coaching / client access inquiries (not general app support). */
  connectEmail:     import.meta.env.VITE_BRAND_CONNECT_EMAIL      || 'connect@manualmode.at',
  ownerName:        import.meta.env.VITE_BRAND_OWNER_NAME         || 'Günter Herold',
  ownerLegalName:   import.meta.env.VITE_BRAND_OWNER_LEGAL_NAME   || 'Günter Herold, MSc',
  ownerProfessionDe: import.meta.env.VITE_BRAND_OWNER_PROFESSION_DE || 'Lebens- und Sozialberatung',
  ownerProfessionEn: import.meta.env.VITE_BRAND_OWNER_PROFESSION_EN || 'Life and Social Counseling',
  invoiceStreet:    import.meta.env.VITE_BRAND_INVOICE_STREET       || 'Am Gigalberg 7a',
  invoicePostalCode: import.meta.env.VITE_BRAND_INVOICE_POSTAL_CODE || '2000',
  invoiceCity:      import.meta.env.VITE_BRAND_INVOICE_CITY         || 'Zissersdorf',
  invoiceCountryDe: import.meta.env.VITE_BRAND_INVOICE_COUNTRY_DE   || 'Österreich',
  invoiceCountryEn: import.meta.env.VITE_BRAND_INVOICE_COUNTRY_EN   || 'Austria',
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

/** Markdown link to contact the provider by e-mail (handbook, about, terms). */
export function brandProviderMailtoMarkdown(linkLabel?: string): string {
  const label = linkLabel ?? brand.providerName;
  return `[${label}](mailto:${brand.contactEmail})`;
}

export type BrandMailPurpose = 'coaching' | 'support';

export function brandEmailForPurpose(purpose: BrandMailPurpose): string {
  return purpose === 'coaching' ? brand.connectEmail : brand.contactEmail;
}
