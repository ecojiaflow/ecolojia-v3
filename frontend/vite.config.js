import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: "./postcss.config.cjs",
  },
  build: {
    rollupOptions: {
      output: { manualChunks: undefined },
    },
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 5173,
    open: true,
    hmr: {
      overlay: false  // D?sactive les overlays d'erreur
    }
  },
  resolve: {
    alias: { "@": "/src" },
  },
});
