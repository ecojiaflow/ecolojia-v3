// PATH: src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import './index.css';
import App from './App';

// Mocks légers si existants
try { await import('./utils/setupMocks'); } catch {}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => console.error('Erreur JS:', e.message, e.error));
  window.addEventListener('unhandledrejection', (e) => console.error('Promesse non gérée:', e.reason));
}

// Charge des outils de dev UNIQUEMENT en dev (non bundlé en prod)
if (import.meta.env.DEV) {
  import('./dev/devTools').then((m) => m?.registerDevTools?.()).catch(() => {});
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Élément #root introuvable');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
);