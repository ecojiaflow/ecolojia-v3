// PATH: frontend/ecolojiaFrontV3/src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// ✅ Imports CSS dans l'ordre correct
import './i18n';
import './index.css';

// ❌ SUPPRIMÉ TEMPORAIREMENT : Import des animations CSS
// import './styles/animations.css';

// Import explicite pour éviter la dépendance circulaire
import * as AppModule from './App';
const App = AppModule.default || AppModule;

// Fallback si l'import échoue encore
if (!App) {
  throw new Error('App component not found - check for circular dependencies');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);