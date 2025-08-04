// PATH: frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js', // Assure le support Tailwind
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined, // Corrige le bug crypto.hash
      },
    },
    sourcemap: false, // Désactive les maps en prod pour de meilleures perfs
    chunkSizeWarningLimit: 1500, // Évite les warnings inutiles sur les bundles lourds
  },
  server: {
    port: 5173, // Port local par défaut pour Vite
    open: true, // Ouvre le navigateur automatiquement
  },
  resolve: {
    alias: {
      '@': '/src', // Alias pour simplifier les imports
    },
  },
});
