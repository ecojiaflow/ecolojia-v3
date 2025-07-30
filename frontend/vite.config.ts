// PATH: frontend/ecolojiaFrontV3/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // ✅ Configuration simplifiée sans references problématiques
    minify: 'terser',
    
    // ✅ Optimisation des chunks SANS références à DashboardPage
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries principales
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react'],
          
          // ✅ CORRIGÉ: Pas de références directes aux fichiers pages
          // Les pages sont incluses automatiquement via App.tsx
        }
      }
    },
    
    // Augmenter la limite pour éviter le warning
    chunkSizeWarningLimit: 1000
  },
  
  // ✅ Optimisations développement
  server: {
    port: 3000,
    open: true
  },
  
  // ✅ Optimisations dépendances (seulement les packages npm)
  optimizeDeps: {
    include: [
      'react',
      'react-dom', 
      'react-router-dom',
      'lucide-react'
    ]
  }
})