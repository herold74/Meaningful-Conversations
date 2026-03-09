// Fix for "Cannot find type definition file for 'vite/client'".
// This is a workaround for a likely project setup issue (e.g., in tsconfig.json).
// It provides types for custom VITE_ variables but omits Vite's built-in ones.
interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly VITE_BACKEND_URL_STAGING: string;
  readonly VITE_BACKEND_URL_PRODUCTION: string;
  readonly VITE_BACKEND_URL_LOCAL: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_BUILD_NUMBER?: string;
  readonly VITE_REVENUECAT_IOS_KEY?: string;
  readonly VITE_BRAND_APP_NAME?: string;
  readonly VITE_BRAND_APP_NAME_DE?: string;
  readonly VITE_BRAND_SHORT_NAME?: string;
  readonly VITE_BRAND_PROVIDER_NAME?: string;
  readonly VITE_BRAND_PROVIDER_URL?: string;
  readonly VITE_BRAND_CONTACT_EMAIL?: string;
  readonly VITE_BRAND_OWNER_NAME?: string;
  readonly VITE_BRAND_PRIMARY_COLOR?: string;
  readonly VITE_BRAND_PRIMARY_COLOR_DARK?: string;
  readonly VITE_BRAND_DOMAIN_STAGING?: string;
  readonly VITE_BRAND_DOMAIN_PRODUCTION?: string;
  readonly VITE_BRAND_APP_URL_PRODUCTION?: string;
  readonly VITE_BRAND_COLOR_1?: string;
  readonly VITE_BRAND_COLOR_2?: string;
  readonly VITE_BRAND_COLOR_3?: string;
  readonly VITE_BRAND_COLOR_4?: string;
  readonly VITE_BRAND_ACCENT?: string;
  readonly VITE_BRAND_LOADER?: string;
  readonly VITE_BRAND_SINGLE_THEME?: string;
  readonly VITE_BRAND_SERVER_IP?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
