// PATH: frontend/src/pages/ScanSimple.tsx
import React, { useState } from 'react';

const ScanSimple: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const testSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    setResult(null);
    
    console.log('Ã°Å¸â€Â Recherche pour:', query);
    
    try {
      // Test direct avec l'URL complète
      const response = await fetch(`https://ecolojia-backendvf.onrender.com/api/v1/products/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Ã°Å¸â€œÂ¥ Response status:', response.status);
      
      const data = await response.json();
      console.log('Ã°Å¸â€œÂ¦ Data:', data);
      
      setResult(data);
    } catch (err: any) {
      console.error('âÂÅ’ Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Simple Scanner</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl mb-4">Test de recherche directe</h2>
          
          <div className="space-y-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Entrez un produit (ex: nutella)"
              className="w-full p-3 border rounded"
              onKeyPress={(e) => e.key === 'Enter' && testSearch()}
            />
            
            <button
              onClick={testSearch}
              disabled={loading || !query.trim()}
              className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Recherche...' : 'Tester la recherche'}
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
              Erreur: {error}
            </div>
          )}
          
          {result && (
            <div className="mt-4">
              <h3 className="font-bold mb-2">Résultat :</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        <div className="mt-8 bg-yellow-100 p-4 rounded">
          <p className="text-sm">
            ââ€žÂ¹ïÂ¸Â Cette page teste directement l'API sans proxy.
            Ouvrez la console (F12) pour voir les logs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScanSimple;
