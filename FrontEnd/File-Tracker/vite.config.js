import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // Charts library
          'charts': ['chart.js', 'react-chartjs-2'],
          
          // UI components
          'ui': ['lucide-react', 'react-modal']
        }
      }
    }
  }
})