import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'ECOLOJIA',
        short_name: 'ECOLOJIA',
        description: 'Analysez vos produits pour une consommation plus saine et responsable',
        theme_color: '#10b981',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Cache strategy
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:10000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks (librairies tierces)
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'framer-motion'],
          
          // Feature chunks (par fonctionnalité)
          'scanner': [
            './src/components/scanner/BarcodeScanner.tsx',
            './src/components/scanner/EnhancedBarcodeScanner.tsx',
            './src/hooks/useScanner.ts'
          ],
          'search': [
            './src/services/search/UniversalSearchService.ts',
            './src/components/search/SearchBar.tsx',
            './src/hooks/useUniversalSearch.ts'
          ],
          'analysis': [
            './src/components/analysis/AIChat.tsx',
            './src/components/analysis/ProgressiveAnalysis.tsx',
            './src/services/ai/DeepSeekClient.ts'
          ],
          'product': [
            './src/components/product/ScoreBreakdown.tsx',
            './src/components/product/AlternativesPanel.tsx'
          ]
        },
        // Chunks par taille (fallback)
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/[name]-[hash].js`;
        }
      }
    },
    chunkSizeWarningLimit: 600, // Warning à 600KB au lieu de 500KB
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})