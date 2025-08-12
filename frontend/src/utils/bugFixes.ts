// PATH: frontend/src/utils/bugFixes.ts
/**
 * Solutions aux bugs courants d'ECOLOJIA
 */

// 1. Fix pour l'erreur 401 sur Vision API
export function fixVisionAuth() {
  // Intercepter les appels Vision pour s'assurer de l'auth
  const originalFetch = window.fetch;
  window.fetch = async (url, options = {}) => {
    if (typeof url === 'string' && url.includes('/vision/analyze-image')) {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️ Vision API appelée sans token - Redirection vers login');
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
      
      // Ajouter le token aux headers
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
    }
    return originalFetch(url, options);
  };
}

// 2. Fix pour les problèmes d'encodage UTF-8
export function fixEncoding() {
  // Forcer l'encodage UTF-8 sur toutes les requêtes
  const originalFetch = window.fetch;
  window.fetch = async (url, options = {}) => {
    if (options.headers && options.headers['Content-Type']?.includes('application/json')) {
      options.headers = {
        ...options.headers,
        'Content-Type': 'application/json; charset=utf-8'
      };
    }
    
    const response = await originalFetch(url, options);
    
    // Décoder correctement les réponses
    const originalJson = response.json.bind(response);
    response.json = async () => {
      const data = await originalJson();
      return fixEncodingInObject(data);
    };
    
    return response;
  };
}

// Helper pour corriger l'encodage dans les objets
function fixEncodingInObject(obj: any): any {
  if (typeof obj === 'string') {
    // Corriger les caractères mal encodés courants
    return obj
      .replace(/Ã©/g, 'é')
      .replace(/Ã¨/g, 'è')
      .replace(/Ã /g, 'à')
      .replace(/Ã§/g, 'ç')
      .replace(/Ã´/g, 'ô')
      .replace(/Ã»/g, 'û')
      .replace(/Ã®/g, 'î')
      .replace(/Ãª/g, 'ê')
      .replace(/Ã¢/g, 'â');
  }
  
  if (Array.isArray(obj)) {
    return obj.map(fixEncodingInObject);
  }
  
  if (obj && typeof obj === 'object') {
    const fixed: any = {};
    for (const key in obj) {
      fixed[key] = fixEncodingInObject(obj[key]);
    }
    return fixed;
  }
  
  return obj;
}

// 3. Fix pour le refresh token automatique
export function setupAutoRefreshToken() {
  // Intercepter les erreurs 401 pour refresh automatique
  const originalFetch = window.fetch;
  window.fetch = async (url, options = {}) => {
    const makeRequest = () => originalFetch(url, options);
    
    try {
      const response = await makeRequest();
      
      if (response.status === 401 && !url.includes('/auth/')) {
        console.log('🔄 Token expiré, tentative de refresh...');
        
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const refreshResponse = await originalFetch('/api/auth/refresh', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${refreshToken}`
              }
            });
            
            if (refreshResponse.ok) {
              const { token } = await refreshResponse.json();
              localStorage.setItem('token', token);
              
              // Réessayer la requête originale avec le nouveau token
              if (options.headers) {
                options.headers = {
                  ...options.headers,
                  'Authorization': `Bearer ${token}`
                };
              }
              
              return makeRequest();
            }
          } catch (error) {
            console.error('❌ Échec du refresh token:', error);
          }
        }
        
        // Si refresh échoue, rediriger vers login
        localStorage.clear();
        window.location.href = '/login';
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };
}

// 4. Fix pour les imports de services
export function fixServiceImports() {
  // Créer des alias globaux pour les services
  import('../services/analysisService').then(module => {
    window.analysisService = module.default || module.analysisService;
  });
  
  import('../services/visionService').then(module => {
    window.visionService = module.default || module.visionService;
  });
  
  import('../services/authService').then(module => {
    window.authService = module.default || module.authService;
  });
}

// 5. Mode démo pour tester sans backend
export function enableDemoMode() {
  console.log('🎭 Mode démo activé - Réponses simulées');
  
  const demoResponses = {
    '/api/analysis/manual': {
      category: 'food',
      scores: {
        nova: 3,
        healthScore: 65,
        environmentScore: 70,
        nutriscore: 'B'
      },
      details: {
        novaLabel: 'Aliment transformé',
        novaReason: 'Contient des additifs',
        ecoscore: 'B'
      },
      globalScore: 67,
      confidence: 0.85,
      recommendations: ['✅ Bon choix global', '💡 Privilégier les versions sans additifs']
    },
    '/api/auth/login': {
      token: 'demo-token-12345',
      user: {
        id: 'demo-user',
        email: 'demo@ecolojia.com',
        name: 'Utilisateur Démo',
        plan: 'premium'
      }
    },
    '/api/vision/analyze-image': {
      jobId: 'demo-job-123',
      status: 'completed',
      result: {
        text: 'Texte extrait de l\'image',
        extractedData: {
          name: 'Produit détecté',
          ingredients: 'Eau, sucre, sel',
          category: 'food'
        },
        confidence: 0.9
      }
    }
  };
  
  // Intercepter fetch pour retourner des réponses démo
  const originalFetch = window.fetch;
  window.fetch = async (url, options = {}) => {
    const urlStr = typeof url === 'string' ? url : url.toString();
    
    // Chercher une réponse démo
    for (const [endpoint, response] of Object.entries(demoResponses)) {
      if (urlStr.includes(endpoint)) {
        console.log(`🎭 Réponse démo pour ${endpoint}`);
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Sinon, faire la vraie requête
    return originalFetch(url, options);
  };
}

// 6. Logger amélioré pour debug
export function setupDebugLogger() {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Parser les erreurs pour les rendre plus lisibles
    const formattedArgs = args.map(arg => {
      if (arg instanceof Error) {
        return {
          message: arg.message,
          stack: arg.stack,
          type: arg.name
        };
      }
      return arg;
    });
    
    // Sauvegarder dans sessionStorage pour analyse
    const errors = JSON.parse(sessionStorage.getItem('ecolojia_errors') || '[]');
    errors.push({
      timestamp: new Date().toISOString(),
      error: formattedArgs,
      url: window.location.href
    });
    sessionStorage.setItem('ecolojia_errors', JSON.stringify(errors.slice(-50))); // Garder les 50 dernières
    
    originalConsoleError(...args);
  };
}

// 7. Fonction pour nettoyer et réinitialiser
export function cleanupAndReset() {
  console.log('🧹 Nettoyage et réinitialisation...');
  
  // Vider le cache
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  sessionStorage.clear();
  
  // Recharger la page
  window.location.href = '/';
}

// Auto-appliquer les fixes essentiels
export function applyEssentialFixes() {
  fixEncoding();
  setupAutoRefreshToken();
  setupDebugLogger();
  
  console.log('✅ Fixes essentiels appliqués');
}

// Commandes disponibles dans la console
declare global {
  interface Window {
    ecolojiaFixes: {
      fixVisionAuth: typeof fixVisionAuth;
      fixEncoding: typeof fixEncoding;
      setupAutoRefreshToken: typeof setupAutoRefreshToken;
      fixServiceImports: typeof fixServiceImports;
      enableDemoMode: typeof enableDemoMode;
      cleanupAndReset: typeof cleanupAndReset;
      showErrors: () => void;
    };
    analysisService: any;
    visionService: any;
    authService: any;
  }
}

// Exposer les fonctions dans la console
window.ecolojiaFixes = {
  fixVisionAuth,
  fixEncoding,
  setupAutoRefreshToken,
  fixServiceImports,
  enableDemoMode,
  cleanupAndReset,
  showErrors: () => {
    const errors = JSON.parse(sessionStorage.getItem('ecolojia_errors') || '[]');
    console.table(errors);
  }
};

console.log('🔧 Fixes disponibles : window.ecolojiaFixes');
console.log('Pour activer le mode démo : ecolojiaFixes.enableDemoMode()');
console.log('Pour voir les erreurs : ecolojiaFixes.showErrors()');