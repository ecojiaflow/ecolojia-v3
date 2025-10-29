// PATH: frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './Contexts/AuthContext';
import './index.css';
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


if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  // Désactive tout SW résiduel en dev pour éviter l'erreur 'sw.js:10'
  navigator.serviceWorker.getRegistrations().then(regs => {
    for (const r of regs) { r.unregister().catch(()=>{}); }
  }).catch(()=>{});
}

// Build: 20251018151254

