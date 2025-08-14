// PATH: vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': '/src' } },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://ecolojia-backendvf.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: { target: 'es2020', sourcemap: false },
});
