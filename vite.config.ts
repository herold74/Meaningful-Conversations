import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000,
    host: true, // Exposes the server on the network for easier testing
  },
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
})