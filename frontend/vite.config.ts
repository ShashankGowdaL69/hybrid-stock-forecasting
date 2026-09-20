import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss(), nodePolyfills()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Ensure client-side routing works by serving index.html for all routes
        manualChunks: undefined
      }
    }
  }
});