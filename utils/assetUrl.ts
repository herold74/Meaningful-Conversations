import { getApiBaseUrl } from '../services/api';
import { isNativeApp } from './platformDetection';

/**
 * Resolve a static asset path for the current runtime.
 * On Capacitor native, relative paths (e.g. /avatars/gloria.png) are loaded from
 * the configured API host so they work without relying on the bundled public folder
 * or service-worker fetch handling.
 */
export function resolveAssetUrl(url: string | undefined | null): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/') && isNativeApp()) {
    const base = getApiBaseUrl();
    if (base) return `${base.replace(/\/$/, '')}${url}`;
  }
  return url;
}
