// PATH: frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './Contexts/AuthContext';
import './index.css';

// ✅ AJOUT : Import registerSW pour PWA production
import { registerSW } from 'virtual:pwa-register';

// Créer le root element
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);

// Rendre l'application
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// =====================================================
// SERVICE WORKER REGISTRATION (DEV vs PROD)
// =====================================================

if (import.meta.env.DEV) {
  // ❌ DÉVELOPPEMENT : Désactiver tout SW résiduel pour éviter conflits cache
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      for (const r of regs) { 
        r.unregister().catch(() => {}); 
      }
    }).catch(() => {});
  }
} else {
  // ✅ PRODUCTION : Enregistrer le service worker PWA
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('[PWA] Nouvelle version disponible, rechargement...');
      // Auto-update immédiat (pas de prompt utilisateur)
      updateSW(true);
    },
    onOfflineReady() {
      console.log('[PWA] Application prête pour mode hors-ligne');
    },
    onRegistered(registration) {
      console.log('[PWA] Service Worker enregistré avec succès');
      // Vérifier les mises à jour toutes les heures
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // 1 heure
      }
    },
    onRegisterError(error) {
      console.error('[PWA] Erreur enregistrement Service Worker:', error);
    }
  });
}

// Build: 20251203233928
