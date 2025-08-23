// TestConnection.tsx - Composant pour tester la connexion
import React, { useState, useEffect } from 'react';
import { API_CONFIG } from '../config/api.config';

const TestConnection: React.FC = () => {
  const [status, setStatus] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testAllEndpoints();
  }, []);

  const testAllEndpoints = async () => {
    setLoading(true);
    const results: Record<string, any> = {};

    // Test API Info
    try {
      const response = await fetch(API_CONFIG.BASE_URL + '/');
      const data = await response.json();
      results.apiInfo = { ok: true, data };
    } catch (error) {
      results.apiInfo = { ok: false, error: error.message };
    }

    // Test Dashboard Stats
    try {
      const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.DASHBOARD.STATS);
      const data = await response.json();
      results.dashboard = { ok: true, data };
    } catch (error) {
      results.dashboard = { ok: false, error: error.message };
    }

    // Test Products Stats
    try {
      const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.PRODUCTS.STATS);
      const data = await response.json();
      results.products = { ok: true, data };
    } catch (error) {
      results.products = { ok: false, error: error.message };
    }

    setStatus(results);
    setLoading(false);
  };

  const testAnalysis = async () => {
    try {
      const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.ANALYSIS.MANUAL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Produit Test',
          category: 'food',
          ingredients: { text: 'Eau, sucre, arômes' }
        })
      });
      const data = await response.json();
      alert('Analyse réussie! Score: ' + (data.scores?.healthScore || 'N/A'));
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  if (loading) {
    return <div className="p-8">Chargement des tests...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">ðŸ§ª Test de Connexion Backend</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Backend URL</h2>
          <code className="text-sm">{API_CONFIG.BASE_URL}</code>
        </div>

        {Object.entries(status).map(([key, value]) => (
          <div key={key} className={`p-4 rounded ${value.ok ? 'bg-green-100' : 'bg-red-100'}`}>
            <h3 className="font-semibold flex items-center gap-2">
              {value.ok ? 'âœ…' : 'âŒ'} {key}
            </h3>
            {value.data && (
              <pre className="text-xs mt-2 overflow-auto">
                {JSON.stringify(value.data, null, 2).slice(0, 200)}...
              </pre>
            )}
            {value.error && (
              <p className="text-red-600 text-sm mt-2">{value.error}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 space-x-4">
        <button
          onClick={testAllEndpoints}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          ðŸ”„ Retester
        </button>
        <button
          onClick={testAnalysis}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          ðŸ§ª Tester une Analyse
        </button>
      </div>
    </div>
  );
};

export default TestConnection;

