import './utils/setupMocks';
// PATH: frontend/src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import './index.css';
import App from './App';

// Configuration de l'API URL
const API_URL = import.meta.env.VITE_API_URL || 'https://ecolojia-backendvf.onrender.com/api';

// Fixes simples sans casser fetch
const applyQuickFixes = () => {
  // Fix 1: Logger les erreurs pour debug
  window.addEventListener('error', (event) => {
    console.error('ðŸ”´ Erreur:', event.message, event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('ðŸ”´ Promise rejetÃ©e:', event.reason);
  });

  console.log('âœ… Debug activÃ©');
};

// Test backend fonctionnel
(window as any).testBackend = async () => {
  console.log('ðŸ§ª Test Backend ECOLOJIA...\n');
  console.log('ðŸ“ API URL:', API_URL);
  
  const tests = [];
  
  try {
    // Test 1: Health
    const healthRes = await fetch('https://ecolojia-backendvf.onrender.com/health');
    tests.push({
      endpoint: '/health',
      status: healthRes.status,
      ok: healthRes.ok ? 'âœ…' : 'âŒ'
    });
    
    // Test 2: Analysis Status
    const statusRes = await fetch(`${API_URL}/analysis/_service/status`);
    tests.push({
      endpoint: '/api/analysis/_service/status',
      status: statusRes.status,
      ok: statusRes.ok ? 'âœ…' : 'âŒ'
    });
    
    if (statusRes.ok) {
      const data = await statusRes.json();
      console.log('ðŸ“Š Service Analysis:', data);
    }
    
    // Test 3: Ping
    const pingRes = await fetch(`${API_URL}/analysis/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });
    tests.push({
      endpoint: '/api/analysis/ping',
      status: pingRes.status,
      ok: pingRes.ok ? 'âœ…' : 'âŒ'
    });
    
    console.table(tests);
    
  } catch (error) {
    console.error('âŒ Erreur:', error);
  }
};

// Test d'analyse complet
(window as any).testAnalysis = async (category = 'food') => {
  console.log(`ðŸ”¬ Test analyse ${category}...\n`);
  
  const testProducts = {
    food: {
      name: 'CÃ©rÃ©ales chocolat test',
      category: 'food',
      ingredients: 'CÃ©rÃ©ales (blÃ© 60%), sucre, chocolat 15% (sucre, cacao), sirop de glucose, sel, vitamines (B1, B2), Ã©mulsifiant E322'
    },
    cosmetic: {
      name: 'CrÃ¨me hydratante test',
      category: 'cosmetic',
      ingredients: 'Aqua, Glycerin, Dimethicone, Cetearyl Alcohol, Parfum, Limonene, Methylparaben, BHT'
    },
    detergent: {
      name: 'Lessive liquide test',
      category: 'detergent',
      ingredients: '5-15% tensioactifs anioniques, <5% tensioactifs non-ioniques, parfum (Limonene), enzymes'
    }
  };
  
  const product = testProducts[category] || testProducts.food;
  
  try {
    console.log('ðŸ“¤ Envoi:', product);
    
    const response = await fetch(`${API_URL}/analysis/manual`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') && { 
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        })
      },
      body: JSON.stringify(product)
    });
    
    console.log('ðŸ“¥ Status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('âœ… RÃ©sultat:');
      console.log('- CatÃ©gorie:', result.category);
      console.log('- Score global:', result.globalScore);
      console.log('- Scores:', result.scores);
      console.log('- DÃ©tails:', result.details);
      console.log('- Recommandations:', result.recommendations);
      return result;
    } else {
      const error = await response.text();
      console.error('âŒ Erreur:', error);
    }
  } catch (error) {
    console.error('âŒ Exception:', error);
  }
};

// Test complet de l'application
(window as any).testComplet = async () => {
  console.log('ðŸš€ TEST COMPLET ECOLOJIA\n');
  console.log('=' .repeat(50));
  
  // 1. Backend
  console.log('\n1ï¸âƒ£ TEST BACKEND');
  await (window as any).testBackend();
  
  // 2. Analyses
  console.log('\n2ï¸âƒ£ TEST ANALYSES');
  console.log('Testing Food...');
  await (window as any).testAnalysis('food');
  
  console.log('\nTesting Cosmetic...');
  await (window as any).testAnalysis('cosmetic');
  
  console.log('\nTesting Detergent...');
  await (window as any).testAnalysis('detergent');
  
  // 3. Auth
  console.log('\n3ï¸âƒ£ TEST AUTH');
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  console.log('Token:', token ? `âœ… PrÃ©sent (${token.length} car.)` : 'âŒ Absent');
  console.log('User:', user ? 'âœ… PrÃ©sent' : 'âŒ Absent');
  
  // 4. Routes Frontend
  console.log('\n4ï¸âƒ£ ROUTES FRONTEND');
  console.log('Route actuelle:', window.location.pathname);
  console.log('Routes disponibles:');
  console.log('- / (Home)');
  console.log('- /scan');
  console.log('- /results');
  console.log('- /search');
  console.log('- /dashboard');
  console.log('- /login');
  console.log('- /register');
  
  console.log('\nâœ… Test terminÃ© !');
};

// Commandes disponibles
(window as any).ecolojiaHelp = () => {
  console.log(`
ðŸŒ± ECOLOJIA - Commandes de test
================================

ðŸ“‹ Tests rapides:
  testBackend()          â†’ Tester la connexion backend
  testAnalysis('food')   â†’ Tester analyse food
  testAnalysis('cosmetic') â†’ Tester analyse cosmÃ©tique
  testAnalysis('detergent') â†’ Tester analyse dÃ©tergent
  testComplet()          â†’ Lancer TOUS les tests

ðŸ”§ Debug:
  localStorage.clear()   â†’ Effacer le cache
  location.reload()      â†’ Recharger la page

ðŸ“Š Info systÃ¨me:
  API: ${API_URL}
  Backend: https://ecolojia-backendvf.onrender.com
  Frontend: ${window.location.origin}
  `);
};

// Appliquer les fixes
try {
  applyQuickFixes();
} catch (error) {
  console.error('Erreur lors de l\'application des fixes:', error);
}

// Message de bienvenue
console.log('%cðŸŒ± ECOLOJIA', 'color: #22c55e; font-size: 24px; font-weight: bold;');
console.log('Tapez ecolojiaHelp() pour voir les commandes');
console.log('Tapez testComplet() pour lancer tous les tests');

// CrÃ©er l'application
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Element root non trouvÃ©');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
