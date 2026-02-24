import type { Plugin } from 'vite';

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/**
 * Vite plugin that injects branding values into index.html and generates
 * a branded manifest.json at build time. Values are read from VITE_BRAND_*
 * env vars with sensible defaults (the Work4Flow / manualmode.at brand).
 *
 * Brand colors are injected as CSS custom properties on :root so that
 * the theme system, Tailwind tokens, and components can reference them.
 */
export default function brandPlugin(): Plugin {
  const getBrand = () => ({
    appName:   process.env.VITE_BRAND_APP_NAME   || 'Meaningful Conversations',
    shortName: process.env.VITE_BRAND_SHORT_NAME  || 'Meaningful',
    color1:    process.env.VITE_BRAND_COLOR_1     || '#89C4E1',
    color2:    process.env.VITE_BRAND_COLOR_2     || '#6A9DBF',
    color3:    process.env.VITE_BRAND_COLOR_3     || '#4A7A9B',
    color4:    process.env.VITE_BRAND_COLOR_4     || '#1B3A5C',
    accent:    process.env.VITE_BRAND_ACCENT      || '#F59E0B',
  });

  return {
    name: 'vite-plugin-brand',

    transformIndexHtml(html) {
      const b = getBrand();

      const cssVars = [
        `--brand-color-1: ${hexToRgb(b.color1)};`,
        `--brand-color-2: ${hexToRgb(b.color2)};`,
        `--brand-color-3: ${hexToRgb(b.color3)};`,
        `--brand-color-4: ${hexToRgb(b.color4)};`,
        `--brand-accent:  ${hexToRgb(b.accent)};`,
      ].join('\n    ');

      const styleTag = `<style>:root {\n    ${cssVars}\n  }</style>`;

      return html
        .replace(/<title>[^<]*<\/title>/, `<title>${b.appName}</title>`)
        .replace(
          /name="apple-mobile-web-app-title"\s+content="[^"]*"/,
          `name="apple-mobile-web-app-title" content="${b.appName}"`
        )
        .replace('</head>', `  ${styleTag}\n  </head>`);
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
