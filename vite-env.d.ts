// Fix for "Cannot find type definition file for 'vite/client'".
// This is a workaround for a likely project setup issue (e.g., in tsconfig.json).
// It provides types for custom VITE_ variables but omits Vite's built-in ones.
interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string;
  readonly VITE_BACKEND_URL_STAGING: string;
  readonly VITE_BACKEND_URL_PRODUCTION: string;
  readonly VITE_BACKEND_URL_LOCAL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}