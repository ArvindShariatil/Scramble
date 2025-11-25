import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@game': path.resolve(__dirname, './src/game'),
      '@api': path.resolve(__dirname, './src/api'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@data': path.resolve(__dirname, './src/data'),
      '@utils': path.resolve(__dirname, './src/utils')
    }
  },
  server: {
    port: 5173,
    open: false
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('dictionary.ts')) {
            return 'dictionary';
          }
          if (id.includes('analytics.ts')) {
            return 'analytics';
          }
        }
      }
    }
  },
  define: {
    __VERSION__: JSON.stringify(process.env.npm_package_version || '0.0.0')
  }
})