/**
 * Resolve relative static asset paths to absolute URLs for native clients
 * (Capacitor cannot load /avatars/... against capacitor://localhost).
 * Uses FRONTEND_URL from the server environment (staging vs production).
 */

function getFrontendBaseUrl() {
  return (process.env.FRONTEND_URL || '').replace(/\/$/, '');
}

function resolvePublicAssetUrl(assetUrl) {
  if (!assetUrl || typeof assetUrl !== 'string') return assetUrl;
  if (/^https?:\/\//i.test(assetUrl)) return assetUrl;
  if (assetUrl.startsWith('/')) {
    const base = getFrontendBaseUrl();
    if (base) return `${base}${assetUrl}`;
  }
  return assetUrl;
}

module.exports = {
  getFrontendBaseUrl,
  resolvePublicAssetUrl,
};
