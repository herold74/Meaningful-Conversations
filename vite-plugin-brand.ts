import type { Plugin } from 'vite';

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

function getEnv(env: Record<string, string> | undefined, key: string, fallback: string): string {
  const v = env?.[key] ?? process.env[key];
  return (typeof v === 'string' && v.trim() ? v : fallback).trim();
}

/**
 * Vite plugin that injects branding values into index.html and generates
 * a branded manifest.json at build time. Values are read from VITE_BRAND_*
 * env vars (via loadEnv from .env.local etc.) with sensible defaults.
 *
 * Brand colors are injected as CSS custom properties on :root so that
 * the theme system, Tailwind tokens, and components can reference them.
 */
export default function brandPlugin(env?: Record<string, string>): Plugin {
  const getBrand = () => ({
    appName:   getEnv(env, 'VITE_BRAND_APP_NAME',   'Meaningful Conversations'),
    shortName: getEnv(env, 'VITE_BRAND_SHORT_NAME', 'Meaningful'),
    color1:    getEnv(env, 'VITE_BRAND_COLOR_1',    '#5BBFBF'),
    color2:    getEnv(env, 'VITE_BRAND_COLOR_2',    '#3D9E9E'),
    color3:    getEnv(env, 'VITE_BRAND_COLOR_3',    '#1B7272'),
    color4:    getEnv(env, 'VITE_BRAND_COLOR_4',    '#165a5a'),
    accent:    getEnv(env, 'VITE_BRAND_ACCENT',     '#F59E0B'),
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
