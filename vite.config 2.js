import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Generate a unique build ID for cache busting
const buildId = Date.now()

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    // No proxy configuration for standalone frontend
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          utils: ['axios', 'moment', 'moment-timezone']
        },
        // Add build ID and hash to filenames for cache busting
        entryFileNames: `assets/[name]-${buildId}-[hash].js`,
        chunkFileNames: `assets/[name]-${buildId}-[hash].js`,
        assetFileNames: `assets/[name]-${buildId}-[hash].[ext]`
      }
    }
  },
  define: {
    global: 'globalThis',
  }
})