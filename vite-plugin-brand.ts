import type { Plugin } from 'vite';

/**
 * Vite plugin that injects branding values into index.html and generates
 * a branded manifest.json at build time. Values are read from VITE_BRAND_*
 * env vars with sensible defaults (the original "Meaningful Conversations" brand).
 */
export default function brandPlugin(): Plugin {
  const getBrand = () => ({
    appName:   process.env.VITE_BRAND_APP_NAME   || 'Meaningful Conversations',
    shortName: process.env.VITE_BRAND_SHORT_NAME  || 'Meaningful',
  });

  return {
    name: 'vite-plugin-brand',

    transformIndexHtml(html) {
      const { appName } = getBrand();
      return html
        .replace(/<title>[^<]*<\/title>/, `<title>${appName}</title>`)
        .replace(
          /name="apple-mobile-web-app-title"\s+content="[^"]*"/,
          `name="apple-mobile-web-app-title" content="${appName}"`
        );
    },

    generateBundle() {
      const { appName, shortName } = getBrand();
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.json',
        source: JSON.stringify({
          short_name: shortName,
          name: appName,
          icons: [
            { src: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' },
            { src: '/icon-main.png', type: 'image/png', sizes: '512x512' },
          ],
          start_url: '/',
          display: 'standalone',
          theme_color: '#f8fafc',
          background_color: '#f8fafc',
        }, null, 2),
      });
    },
  };
}
