import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    watch: {
      // Explicitly ignore all .js files in the root directory.
      // This prevents the dev server from trying to process browser-specific
      // files like sw.js or other config files like server.js in a Node.js context during startup.
      ignored: ['*.js'],
    },
  },
});