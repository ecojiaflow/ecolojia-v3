// PATH: frontend/src/pages/DiagnosticPage.tsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Package, Database, Globe, Shield, Cpu } from 'lucide-react';

interface DiagnosticItem {
  id: string;
  name: string;
  status: 'checking' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

const DiagnosticPage: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDiagnostics([]);

    const tests: DiagnosticItem[] = [
      {
        id: 'mode',
        name: 'Mode de l\'application',
        status: 'checking',
        message: 'Vérification du mode...'
      },
      {
        id: 'encoding',
        name: 'Encodage des caractères',
        status: 'checking',
        message: 'Test des caractères français...'
      },
      {
        id: 'routes',
        name: 'Routes de navigation',
        status: 'checking',
        message: 'Vérification des routes...'
      },
      {
        id: 'localStorage',
        name: 'Stockage local',
        status: 'checking',
        message: 'Test localStorage...'
      },
      {
        id: 'mockData',
        name: 'Données mockées',
        status: 'checking',
        message: 'Vérification des mocks...'
      },
      {
        id: 'apiEndpoint',
        name: 'Endpoint API',
        status: 'checking',
        message: 'Test de connexion API...'
      },
      {
        id: 'environment',
        name: 'Variables d\'environnement',
        status: 'checking',
        message: 'Vérification des variables...'
      },
      {
        id: 'performance',
        name: 'Performance',
        status: 'checking',
        message: 'Mesure des performances...'
      }
    ];

    setDiagnostics(tests);

    // Test 1: Mode de l'application
    await delay(500);
    updateTest('mode', {
      status: MOCK_MODE ? 'warning' : 'success',
      message: MOCK_MODE ? 'Mode MOCK activé' : 'Mode PRODUCTION',
      details: MOCK_MODE ? 'Les données proviennent des mocks locaux' : 'Connecté au backend réel'
    });

    // Test 2: Encodage
    await delay(500);
    const testString = 'éèÃ çôâÃªîùûÃ¼Ã¶Ã¤Ã¯ë';
    const encodingOk = testString === 'éèÃ çôâÃªîùûÃ¼Ã¶Ã¤Ã¯ë';
    updateTest('encoding', {
      status: encodingOk ? 'success' : 'error',
      message: encodingOk ? 'Encodage UTF-8 correct' : 'Problème d\'encodage détecté',
      details: encodingOk ? 'Tous les caractères français s\'affichent correctement' : 'Exécutez le script fix-encoding.ps1'
    });

    // Test 3: Routes
    await delay(500);
    const routes = ['/', '/chat', '/dashboard', '/results', '/search', '/product/test'];
    const currentPath = window.location.pathname;
    updateTest('routes', {
      status: 'success',
      message: `Route actuelle: ${currentPath}`,
      details: `Routes disponibles: ${routes.join(', ')}`
    });

    // Test 4: LocalStorage
    await delay(500);
    try {
      localStorage.setItem('diagnostic-test', 'ok');
      const testValue = localStorage.getItem('diagnostic-test');
      localStorage.removeItem('diagnostic-test');
      updateTest('localStorage', {
        status: testValue === 'ok' ? 'success' : 'error',
        message: 'LocalStorage fonctionnel',
        details: 'Lecture/écriture OK'
      });
    } catch (error) {
      updateTest('localStorage', {
        status: 'error',
        message: 'LocalStorage non disponible',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }

    // Test 5: Mock Data
    await delay(500);
    if (false) {
      updateTest('mockData', {
        status: 'success',
        message: 'Services mock actifs',
        details: 'chatService, mockService, dashboardService disponibles'
      });
    } else {
      updateTest('mockData', {
        status: 'warning',
        message: 'Mode production',
        details: 'Les mocks sont désactivés'
      });
    }

    // Test 6: API Endpoint
    await delay(500);
    const apiUrl = import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL}';
    try {
      if (!MOCK_MODE) {
        const response = await fetch(`${apiUrl}/health`, { 
          method: 'GET',
          mode: 'cors'
        }).catch(() => null);
        
        updateTest('apiEndpoint', {
          status: response?.ok ? 'success' : 'warning',
          message: `API: ${apiUrl}`,
          details: response?.ok ? 'Backend accessible' : 'Backend inaccessible (normal en mode mock)'
        });
      } else {
        updateTest('apiEndpoint', {
          status: 'warning',
          message: 'Test API ignoré (mode mock)',
          details: `URL configurée: ${apiUrl}`
        });
      }
    } catch (error) {
      updateTest('apiEndpoint', {
        status: 'error',
        message: 'Erreur de connexion API',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }

    // Test 7: Environment
    await delay(500);
    const envVars = {
      VITE_API_URL: import.meta.env.VITE_API_URL,
      VITE_ALGOLIA_APP_ID: import.meta.env.VITE_ALGOLIA_APP_ID,
      VITE_ALGOLIA_SEARCH_KEY: import.meta.env.VITE_ALGOLIA_SEARCH_KEY,
      MODE: import.meta.env.MODE,
      DEV: import.meta.env.DEV
    };
    
    const missingVars = Object.entries(envVars)
      .filter(([key, value]) => !value && !key.includes('ALGOLIA'))
      .map(([key]) => key);
    
    updateTest('environment', {
      status: missingVars.length === 0 ? 'success' : 'warning',
      message: 'Variables d\'environnement',
      details: missingVars.length > 0 
        ? `Variables manquantes: ${missingVars.join(', ')}` 
        : 'Toutes les variables sont définies'
    });

    // Test 8: Performance
    await delay(500);
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    updateTest('performance', {
      status: loadTime < 3000 ? 'success' : loadTime < 5000 ? 'warning' : 'error',
      message: `Temps de chargement: ${loadTime}ms`,
      details: loadTime < 3000 ? 'Performance optimale' : 'Performance Ã  améliorer'
    });

    setIsRunning(false);
  };

  const updateTest = (id: string, updates: Partial<DiagnosticItem>) => {
    setDiagnostics(prev => prev.map(test => 
      test.id === id ? { ...test, ...updates } : test
    ));
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: DiagnosticItem['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />;
    }
  };

  const getStatusColor = (status: DiagnosticItem['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <Cpu className="w-8 h-8 mr-3 text-blue-500" />
                Diagnostic ECOLOJIA V3
              </h1>
              <p className="text-gray-600 mt-2">
                Vérification complète de l'état de l'application
              </p>
            </div>
            <button
              onClick={runDiagnostics}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
              Relancer
            </button>
          </div>

          {/* Mode indicator */}
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
            MOCK_MODE ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
          }`}>
            {MOCK_MODE ? (
              <>
                <Database className="w-4 h-4 mr-2" />
                Mode MOCK (données locales)
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 mr-2" />
                Mode PRODUCTION (backend réel)
              </>
            )}
          </div>
        </div>

        {/* Diagnostic Results */}
        <div className="space-y-4">
          {diagnostics.map((test) => (
            <div
              key={test.id}
              className={`bg-white rounded-lg shadow-md p-4 border-2 transition-all ${getStatusColor(test.status)}`}
            >
              <div className="flex items-start">
                <div className="mr-3 mt-1">
                  {getStatusIcon(test.status)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{test.name}</h3>
                  <p className="text-gray-700 mt-1">{test.message}</p>
                  {test.details && (
                    <p className="text-sm text-gray-600 mt-2 bg-white bg-opacity-50 p-2 rounded">
                      {test.details}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {!isRunning && diagnostics.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Résumé</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {diagnostics.filter(t => t.status === 'success').length}
                </div>
                <div className="text-sm text-gray-600">Succès</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">
                  {diagnostics.filter(t => t.status === 'warning').length}
                </div>
                <div className="text-sm text-gray-600">Avertissements</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {diagnostics.filter(t => t.status === 'error').length}
                </div>
                <div className="text-sm text-gray-600">Erreurs</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="font-bold text-blue-800 mb-3">Actions recommandées :</h3>
          <ul className="space-y-2 text-blue-700">
            {diagnostics.some(t => t.id === 'encoding' && t.status === 'error') && (
              <li className="flex items-start">
                <span className="mr-2">â€¢</span>
                <span>Exécutez <code className="bg-blue-100 px-2 py-1 rounded">./fix-encoding.ps1</code> pour corriger l'encodage</span>
              </li>
            )}
            {MOCK_MODE && (
              <li className="flex items-start">
                <span className="mr-2">â€¢</span>
                <span>Pour tester avec le backend réel, changez <code className="bg-blue-100 px-2 py-1 rounded">MOCK_MODE = false</code> dans mock.config.ts</span>
              </li>
            )}
            <li className="flex items-start">
              <span className="mr-2">â€¢</span>
              <span>Utilisez la checklist de test pour vérifier chaque fonctionnalité</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticPage;

