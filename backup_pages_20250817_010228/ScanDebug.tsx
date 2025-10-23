// PATH: frontend/src/pages/ScanDebug.tsx
// Page temporaire pour debugger les problÃ¨mes de scanner

import { useState } from 'react';
import { api } from '../services/apiClient';

export function ScanDebug() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test: string, success: boolean, data: any) => {
    setResults(prev => [...prev, { test, success, data, timestamp: new Date().toISOString() }]);
  };

  const runTests = async () => {
    setLoading(true);
    setResults([]);

    // Test 1: Connexion API de base
    try {
      const response = await api.get('/');
      addResult('API Root', true, response);
    } catch (error) {
      addResult('API Root', false, error);
    }

    // Test 2: Route auth/status
    try {
      const response = await api.get('/api/auth/status');
      addResult('Auth Status', true, response);
    } catch (error) {
      addResult('Auth Status', false, error);
    }

    // Test 3: Route analyse avec barcode
    try {
      const response = await api.post('/api/analysis', {
        type: 'barcode',
        barcode: '3017620422003' // Nutella pour test
      });
      addResult('Analyse Barcode', true, response);
    } catch (error) {
      addResult('Analyse Barcode', false, error);
    }

    // Test 4: Route analyse manuelle
    try {
      const response = await api.post('/api/analysis', {
        type: 'manual',
        productName: 'Test Product',
        category: 'food'
      });
      addResult('Analyse Manuelle', true, response);
    } catch (error) {
      addResult('Analyse Manuelle', false, error);
    }

    // Test 5: VÃ©rifier les variables d'environnement
    addResult('Environment Variables', true, {
      VITE_API_URL: import.meta.env.VITE_API_URL,
      MODE: import.meta.env.MODE,
      PROD: import.meta.env.PROD,
      DEV: import.meta.env.DEV
    });

    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚Â§ Debug Scanner API</h1>
      
      <button
        onClick={runTests}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 mb-6"
      >
        {loading ? 'Tests en cours...' : 'Lancer les tests'}
      </button>

      <div className="space-y-4">
        {results.map((result, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${
              result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">
                {result.success ? 'Ã¢Ãƒâ€¦Ã¢â‚¬Å“Ã¢Ã¢â€šÂ¬Ã‚Â¦' : 'Ã¢Ãƒâ€šÃ‚ÂÃƒâ€¦Ã¢â‚¬â„¢'} {result.test}
              </h3>
              <span className="text-sm text-gray-500">
                {new Date(result.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <pre className="text-xs overflow-auto bg-white p-2 rounded">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        ))}
      </div>

      {results.length === 0 && !loading && (
        <p className="text-gray-500 italic">
          Cliquez sur "Lancer les tests" pour dÃ©bugger les routes API
        </p>
      )}
    </div>
  );
}

