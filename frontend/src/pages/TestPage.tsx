
import React, { useState } from 'react';
import { Check, X, Loader } from 'lucide-react';

const API_BASE = 'https://ecolojia-backendvf.onrender.com';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  data?: any;
  error?: string;
}

export default function TestPage() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const updateTest = (name: string, update: Partial<TestResult>) => {
    setTests(prev => prev.map(t => t.name === name ? { ...t, ...update } : t));
  };

  const runAllTests = async () => {
    setRunning(true);
    
    // Liste des tests à effectuer
    const testList: TestResult[] = [
      { name: '1. Recherche Algolia', status: 'pending' },
      { name: '2. Détails produit', status: 'pending' },
      { name: '3. Analyse manuelle', status: 'pending' },
      { name: '4. Analyse par code-barres', status: 'pending' },
      { name: '5. Statut service analyse', status: 'pending' },
      { name: '6. Test des images produits', status: 'pending' },
    ];
    
    setTests(testList);

    // Test 1: Recherche
    try {
      const searchRes = await fetch(`${API_BASE}/api/algolia/search?q=nutella`);
      const searchData = await searchRes.json();
      updateTest('1. Recherche Algolia', { 
        status: 'success', 
        data: {
          success: searchData.success,
          count: searchData.data?.products?.length || 0,
          firstProduct: searchData.data?.products?.[0]
        }
      });

      // Test 2: Détails d'un produit
      if (searchData.data?.products?.[0]?._id) {
        try {
          const productId = searchData.data.products[0]._id;
          const productRes = await fetch(`${API_BASE}/api/products/${productId}`);
          const productData = await productRes.json();
          updateTest('2. Détails produit', { 
            status: productRes.ok ? 'success' : 'error',
            data: productData,
            error: !productRes.ok ? `Status: ${productRes.status}` : undefined
          });
        } catch (e) {
          updateTest('2. Détails produit', { 
            status: 'error', 
            error: e.message 
          });
        }
      }
    } catch (e) {
      updateTest('1. Recherche Algolia', { 
        status: 'error', 
        error: e.message 
      });
    }

    // Test 3: Analyse manuelle
    try {
      const analysisRes = await fetch(`${API_BASE}/api/analysis/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Nutella',
          category: 'food',
          ingredients: 'sucre, huile de palme, noisettes 13%, cacao maigre 7.4%, lait écrémé en poudre 6.6%, lactosérum en poudre, émulsifiants: lécithines [soja], vanilline'
        })
      });
      const analysisData = await analysisRes.json();
      updateTest('3. Analyse manuelle', { 
        status: analysisRes.ok ? 'success' : 'error',
        data: analysisData,
        error: !analysisRes.ok ? `Status: ${analysisRes.status}` : undefined
      });
    } catch (e) {
      updateTest('3. Analyse manuelle', { 
        status: 'error', 
        error: e.message 
      });
    }

    // Test 4: Analyse par code-barres
    try {
      const barcodeRes = await fetch(`${API_BASE}/api/analysis/barcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: '3017620425035' })
      });
      const barcodeData = await barcodeRes.json();
      updateTest('4. Analyse par code-barres', { 
        status: barcodeRes.ok ? 'success' : 'error',
        data: barcodeData,
        error: !barcodeRes.ok ? `Status: ${barcodeRes.status}` : undefined
      });
    } catch (e) {
      updateTest('4. Analyse par code-barres', { 
        status: 'error', 
        error: e.message 
      });
    }

    // Test 5: Statut du service
    try {
      const statusRes = await fetch(`${API_BASE}/api/analysis/_service/status`);
      const statusData = await statusRes.json();
      updateTest('5. Statut service analyse', { 
        status: statusRes.ok ? 'success' : 'error',
        data: statusData,
        error: !statusRes.ok ? `Status: ${statusRes.status}` : undefined
      });
    } catch (e) {
      updateTest('5. Statut service analyse', { 
        status: 'error', 
        error: e.message 
      });
    }

    // Test 6: Images
    try {
      // Test si les images Cloudinary sont accessibles
      const testImageUrl = 'https://res.cloudinary.com/dqz0n291c/image/upload/v1/products/test.jpg';
      const imgRes = await fetch(testImageUrl, { method: 'HEAD' });
      updateTest('6. Test des images produits', { 
        status: 'success',
        data: { 
          cloudinaryConfigured: imgRes.ok,
          defaultImage: '/images/default-product.jpg'
        }
      });
    } catch (e) {
      updateTest('6. Test des images produits', { 
        status: 'error', 
        error: 'Cloudinary non configuré' 
      });
    }

    setRunning(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">🧪 Page de Test ECOLOJIA</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Tests des endpoints</h2>
          <button
            onClick={runAllTests}
            disabled={running}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            {running ? 'Tests en cours...' : 'Lancer tous les tests'}
          </button>
        </div>

        <div className="space-y-4">
          {tests.map((test) => (
            <div key={test.name} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{test.name}</h3>
                <div className="flex items-center gap-2">
                  {test.status === 'pending' && <Loader className="w-5 h-5 animate-spin text-gray-400" />}
                  {test.status === 'success' && <Check className="w-5 h-5 text-green-500" />}
                  {test.status === 'error' && <X className="w-5 h-5 text-red-500" />}
                  <span className={`text-sm font-medium ${
                    test.status === 'success' ? 'text-green-600' : 
                    test.status === 'error' ? 'text-red-600' : 
                    'text-gray-500'
                  }`}>
                    {test.status === 'pending' ? 'En attente' :
                     test.status === 'success' ? 'Réussi' : 'Échec'}
                  </span>
                </div>
              </div>
              
              {test.error && (
                <div className="mt-2 p-2 bg-red-50 text-red-700 rounded text-sm">
                  Erreur: {test.error}
                </div>
              )}
              
              {test.data && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    Voir les données
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                    {JSON.stringify(test.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        {tests.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Cliquez sur "Lancer tous les tests" pour commencer
          </div>
        )}
      </div>

      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold mb-4">📝 Actions recommandées selon les résultats :</h3>
        <ul className="space-y-2 text-sm">
          <li>• Si la recherche fonctionne mais pas les détails produit → Vérifier la route `/api/products/:id`</li>
          <li>• Si l'analyse ne fonctionne pas → Vérifier que le service d'analyse est déployé</li>
          <li>• Si les images ne s'affichent pas → Configurer Cloudinary ou utiliser des URLs publiques</li>
          <li>• Si tout échoue → Vérifier que le backend est bien déployé et les CORS configurés</li>
        </ul>
      </div>
    </div>
  );
}