import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import brandPlugin from './vite-plugin-brand';
import path from 'path';
import fs from 'fs';

// Read version from package.json
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

// Read build number from BUILD_NUMBER file (or use 'dev' for local development)
const buildNumber = fs.existsSync('./BUILD_NUMBER') 
  ? fs.readFileSync('./BUILD_NUMBER', 'utf-8').trim() 
  : 'dev';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // loadEnv loads .env, .env.local, .env.[mode], .env.[mode].local
  // Needed so brand plugin gets VITE_BRAND_* from .env.local (e.g. cp brands/w4f.env .env.local)
  const env = loadEnv(mode, process.cwd(), '');

  return {
  plugins: [
    react(),
    brandPlugin(env),
  ],
  // Inject version info at build time (env vars override file-based values)
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.VITE_APP_VERSION || pkg.version),
    'import.meta.env.VITE_BUILD_NUMBER': JSON.stringify(process.env.VITE_BUILD_NUMBER || buildNumber),
  },
  publicDir: 'public', // Ensures public assets are copied to dist during build
  server: {
    watch: {
      // Explicitly ignore all .js files in the root directory.
      // This prevents the dev server from trying to process browser-specific
      // files like sw.js or other config files like server.js in a Node.js context during startup.
      ignored: ['*.js'],
    },
  },
  // Optimize @react-pdf/renderer for browser
  optimizeDeps: {
    include: ['@react-pdf/renderer'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  resolve: {
    alias: {
      // Fix for @react-pdf/renderer in Vite
      stream: 'stream-browserify',
    },
  },
  build: {
    // Increase chunk size warning limit to 1000 kB (optional, if you still get warnings after chunking)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        // FIX: `__dirname` is not available in ES modules. `path.resolve` without an absolute
        // base path defaults to the current working directory, which is the project root,
        // correctly locating `index.html`.
        main: path.resolve('index.html'),
      },
      output: {
        // Manual chunking to split large bundles
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return;

          // React core only — must NOT use id.includes('node_modules/react') because that
          // also matches react-markdown, react-is, etc. and creates vendor ↔ react-vendor cycles.
          if (
            /node_modules\/react-dom(\/|$)/.test(id) ||
            /node_modules\/react(\/|$)/.test(id) ||
            id.includes('node_modules/scheduler')
          ) {
            return 'react-vendor';
          }

          // @react-pdf/renderer and dependencies in separate chunk
          if (id.includes('node_modules/@react-pdf') ||
              id.includes('node_modules/pdfkit') ||
              id.includes('node_modules/fontkit')) {
            return 'pdf-vendor';
          }

          // UI/Design libraries
          if (id.includes('node_modules/@headlessui') ||
              id.includes('node_modules/framer-motion') ||
              id.includes('node_modules/lucide-react')) {
            return 'ui-vendor';
          }

          // Other large vendor libraries
          return 'vendor';
        },
      },
    },
  },
};
});
