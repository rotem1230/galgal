import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true
  },
  build: {
    outDir: 'dist',
    // מאפשר סימבולים ישראליים בבנייה
    assetsInlineLimit: 0,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // קובעים אליאס לפרויקט פורטל הלקוחות
      '@client': path.resolve(__dirname, './galbrother-client-portal/src'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
    // כולל תלויות מפרויקט הלקוחות
    include: ['./galbrother-client-portal/src/**/*'],
  },
}) 