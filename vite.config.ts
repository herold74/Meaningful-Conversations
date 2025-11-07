import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  publicDir: 'public', // Ensures public assets are copied to dist during build
  server: {
    watch: {
      // Explicitly ignore all .js files in the root directory.
      // This prevents the dev server from trying to process browser-specific
      // files like sw.js or other config files like server.js in a Node.js context during startup.
      ignored: ['*.js'],
    },
  },
  build: {
    rollupOptions: {
      input: {
        // FIX: `__dirname` is not available in ES modules. `path.resolve` without an absolute
        // base path defaults to the current working directory, which is the project root,
        // correctly locating `index.html`.
        main: path.resolve('index.html'),
      },
    },
  },
});
