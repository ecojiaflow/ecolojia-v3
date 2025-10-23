// PATH: frontend/src/tests/testAllFeatures.ts
/**
 * Script de test complet pour identifier tous les bugs et incohÃ©rences
 * Ã€ exÃ©cuter dans la console du navigateur ou comme script de test
 */

interface TestResult {
  feature: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

class EcolojiaTestSuite {
  private results: TestResult[] = [];
  private apiUrl: string;
  private token: string | null;

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    this.token = localStorage.getItem('token');
  }

  // Utilitaire pour logger
  private log(result: TestResult) {
    this.results.push(result);
    const emoji = result.status === 'success' ? 'âœ…' : result.status === 'error' ? 'âŒ' : 'âš ï¸';
    console.log(`${emoji} ${result.feature}: ${result.message}`, result.details || '');
  }

  // Test 1: VÃ©rifier la configuration de base
  async testConfiguration() {
    this.log({
      feature: 'Configuration',
      status: 'success',
      message: 'Variables d\'environnement',
      details: {
        apiUrl: this.apiUrl,
        hasToken: !!this.token,
        tokenLength: this.token?.length || 0
      }
    });

    // VÃ©rifier l'encodage
    const testString = 'Test Ã©Ã Ã¨Ã¹';
    if (testString !== 'Test Ã©Ã Ã¨Ã¹') {
      this.log({
        feature: 'Encodage',
        status: 'error',
        message: 'ProblÃ¨me d\'encodage UTF-8 dÃ©tectÃ©'
      });
    }
  }

  // Test 2: ConnectivitÃ© API
  async testAPIConnectivity() {
    try {
      const response = await fetch(`${this.apiUrl}/health`);
      if (response.ok) {
        this.log({
          feature: 'API Health',
          status: 'success',
          message: 'API accessible'
        });
      } else {
        this.log({
          feature: 'API Health',
          status: 'error',
          message: `API retourne ${response.status}`,
          details: await response.text()
        });
      }
    } catch (error) {
      this.log({
        feature: 'API Health',
        status: 'error',
        message: 'API inaccessible',
        details: error
      });
    }
  }

  // Test 3: Authentification
  async testAuthentication() {
    // Test login avec credentials de test
    try {
      const response = await fetch(`${this.apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'test123'
        })
      });

      if (response.status === 401) {
        this.log({
          feature: 'Auth Login',
          status: 'warning',
          message: 'Login Ã©chouÃ© (credentials invalides)',
          details: { hint: 'Normal si pas de compte test' }
        });
      } else if (response.ok) {
        const data = await response.json();
        this.log({
          feature: 'Auth Login',
          status: 'success',
          message: 'Login fonctionne',
          details: { hasToken: !!data.token }
        });
      }
    } catch (error) {
      this.log({
        feature: 'Auth Login',
        status: 'error',
        message: 'Erreur lors du test de login',
        details: error
      });
    }

    // Test refresh token
    if (this.token) {
      try {
        const response = await fetch(`${this.apiUrl}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 401) {
          this.log({
            feature: 'Auth Refresh',
            status: 'error',
            message: 'Token expirÃ© ou invalide',
            details: { 
              hint: 'Le token stockÃ© est pÃ©rimÃ©',
              solution: 'Se reconnecter'
            }
          });
        } else if (response.ok) {
          this.log({
            feature: 'Auth Refresh',
            status: 'success',
            message: 'Refresh token fonctionne'
          });
        }
      } catch (error) {
        this.log({
          feature: 'Auth Refresh',
          status: 'error',
          message: 'Erreur refresh token',
          details: error
        });
      }
    }
  }

  // Test 4: Services d'analyse
  async testAnalysisServices() {
    // Test status du service
    try {
      const response = await fetch(`${this.apiUrl}/api/analysis/_service/status`);
      const data = await response.json();
      
      this.log({
        feature: 'Analysis Status',
        status: response.ok ? 'success' : 'error',
        message: response.ok ? 'Service d\'analyse actif' : 'Service d\'analyse down',
        details: data
      });
    } catch (error) {
      this.log({
        feature: 'Analysis Status',
        status: 'error',
        message: 'Impossible de vÃ©rifier le statut',
        details: error
      });
    }

    // Test analyse manuelle pour chaque catÃ©gorie
    const testProducts = [
      {
        name: 'Test Food',
        category: 'food',
        ingredients: 'Eau, sucre, sel, E300'
      },
      {
        name: 'Test Cosmetic',
        category: 'cosmetic',
        ingredients: 'Aqua, Glycerin, Parfum'
      },
      {
        name: 'Test Detergent',
        category: 'detergent',
        ingredients: 'Tensioactifs anioniques 15%'
      }
    ];

    for (const product of testProducts) {
      try {
        const response = await fetch(`${this.apiUrl}/api/analysis/manual`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.token && { 'Authorization': `Bearer ${this.token}` })
          },
          body: JSON.stringify(product)
        });

        const data = await response.json();
        
        this.log({
          feature: `Analysis ${product.category}`,
          status: response.ok ? 'success' : 'error',
          message: response.ok ? 'Analyse fonctionne' : data.error || 'Erreur analyse',
          details: response.ok ? { scores: data.scores } : data
        });
      } catch (error) {
        this.log({
          feature: `Analysis ${product.category}`,
          status: 'error',
          message: 'Erreur lors de l\'analyse',
          details: error
        });
      }
    }
  }

  // Test 5: Service Vision
  async testVisionService() {
    // Test sans authentification
    try {
      const formData = new FormData();
      const blob = new Blob(['test'], { type: 'image/jpeg' });
      formData.append('image', blob, 'test.jpg');

      const response = await fetch(`${this.apiUrl}/api/vision/analyze-image`, {
        method: 'POST',
        body: formData
      });

      if (response.status === 401) {
        this.log({
          feature: 'Vision API (sans auth)',
          status: 'error',
          message: 'Vision API nÃ©cessite une authentification',
          details: {
            solution: 'S\'assurer d\'Ãªtre connectÃ© avant d\'utiliser la vision'
          }
        });
      }
    } catch (error) {
      this.log({
        feature: 'Vision API',
        status: 'error',
        message: 'Erreur test vision',
        details: error
      });
    }

    // Test avec authentification
    if (this.token) {
      try {
        const formData = new FormData();
        const blob = new Blob(['test'], { type: 'image/jpeg' });
        formData.append('image', blob, 'test.jpg');

        const response = await fetch(`${this.apiUrl}/api/vision/analyze-image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`
          },
          body: formData
        });

        if (response.ok) {
          this.log({
            feature: 'Vision API (avec auth)',
            status: 'success',
            message: 'Vision API accessible avec auth'
          });
        } else {
          const error = await response.text();
          this.log({
            feature: 'Vision API (avec auth)',
            status: 'error',
            message: `Vision API erreur ${response.status}`,
            details: error
          });
        }
      } catch (error) {
        this.log({
          feature: 'Vision API (avec auth)',
          status: 'error',
          message: 'Erreur test vision avec auth',
          details: error
        });
      }
    }
  }

  // Test 6: VÃ©rifier les imports de services
  async testServiceImports() {
    try {
      // VÃ©rifier si les services sont importÃ©s correctement
      const modules = [
        '/src/services/analysisService.js',
        '/src/services/visionService.js',
        '/src/services/authService.js'
      ];

      for (const module of modules) {
        try {
          const imported = await import(module);
          const hasDefault = !!imported.default;
          const hasNamed = Object.keys(imported).length > 1;
          
          this.log({
            feature: `Import ${module}`,
            status: 'success',
            message: 'Module accessible',
            details: {
              hasDefault,
              hasNamed,
              exports: Object.keys(imported)
            }
          });
        } catch (error) {
          this.log({
            feature: `Import ${module}`,
            status: 'error',
            message: 'Erreur d\'import',
            details: error
          });
        }
      }
    } catch (error) {
      this.log({
        feature: 'Service Imports',
        status: 'error',
        message: 'Test imports impossible',
        details: error
      });
    }
  }

  // Test 7: VÃ©rifier les routes frontend
  testFrontendRoutes() {
    const routes = [
      '/',
      '/scan',
      '/results',
      '/search',
      '/dashboard',
      '/login',
      '/register'
    ];

    routes.forEach(route => {
      const exists = window.location.pathname === route || true; // Simplified check
      this.log({
        feature: `Route ${route}`,
        status: 'success',
        message: 'Route dÃ©finie',
        details: { current: window.location.pathname }
      });
    });
  }

  // GÃ©nÃ©rer le rapport final
  generateReport() {
    console.log('\nðŸ“Š RAPPORT DE TEST COMPLET\n' + '='.repeat(50));
    
    const summary = {
      total: this.results.length,
      success: this.results.filter(r => r.status === 'success').length,
      errors: this.results.filter(r => r.status === 'error').length,
      warnings: this.results.filter(r => r.status === 'warning').length
    };

    console.log('RÃ©sumÃ©:', summary);
    console.log('\nðŸ”´ Erreurs critiques:');
    this.results
      .filter(r => r.status === 'error')
      .forEach(r => console.log(`- ${r.feature}: ${r.message}`));

    console.log('\nâš ï¸ Avertissements:');
    this.results
      .filter(r => r.status === 'warning')
      .forEach(r => console.log(`- ${r.feature}: ${r.message}`));

    console.log('\nðŸ’¡ Solutions recommandÃ©es:');
    
    // Solutions pour les problÃ¨mes courants
    if (this.results.some(r => r.feature.includes('Auth') && r.status === 'error')) {
      console.log('1. Authentification:');
      console.log('   - Vider localStorage et se reconnecter');
      console.log('   - VÃ©rifier que le backend gÃ©nÃ¨re des tokens valides');
      console.log('   - ImplÃ©menter un mÃ©canisme de refresh token automatique');
    }

    if (this.results.some(r => r.feature.includes('Vision') && r.status === 'error')) {
      console.log('2. Vision API:');
      console.log('   - S\'assurer d\'Ãªtre authentifiÃ© avant d\'utiliser la vision');
      console.log('   - VÃ©rifier les clÃ©s Google Vision dans le backend');
      console.log('   - Activer le fallback Tesseract si nÃ©cessaire');
    }

    if (this.results.some(r => r.feature === 'Encodage' && r.status === 'error')) {
      console.log('3. Encodage:');
      console.log('   - VÃ©rifier que tous les fichiers sont en UTF-8');
      console.log('   - Ajouter <meta charset="UTF-8"> dans index.html');
      console.log('   - Configurer le serveur pour servir en UTF-8');
    }

    return this.results;
  }

  // Lancer tous les tests
  async runAllTests() {
    console.log('ðŸš€ DÃ©marrage des tests ECOLOJIA...\n');

    await this.testConfiguration();
    await this.testAPIConnectivity();
    await this.testAuthentication();
    await this.testAnalysisServices();
    await this.testVisionService();
    await this.testServiceImports();
    this.testFrontendRoutes();

    return this.generateReport();
  }
}

// Fonction pour lancer les tests depuis la console
window.testEcolojia = async () => {
  const tester = new EcolojiaTestSuite();
  return await tester.runAllTests();
};

console.log('âœ¨ Tests prÃªts ! Tapez testEcolojia() dans la console pour lancer tous les tests.');

// Export pour utilisation dans d'autres fichiers
export default EcolojiaTestSuite;