import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const { viteStaticCopy } = await import('vite-plugin-static-copy');
  return {
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          {
            src: 'locales',
            dest: '.'
          }
        ]
      })
    ],
  };
});