// PATH: frontend/src/pages/Results.tsx
import React, { useState } from 'react';
import { useQuickNovaTest } from '../hooks/useNovaApi';
import NovaResults from '../components/NovaResults';
import { useNavigate } from 'react-router-dom';
import HomePage from './HomePage';

const Results: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [productName, setProductName] = useState('');
  const navigate = useNavigate();
  const { 
    data, 
    loading, 
    error, 
    analyzeProduct, 
    testCocaCola, 
    testNutella, 
    testPizzaSurgelee,
    reset 
  } = useQuickNovaTest();

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      alert('Veuillez entrer des ingrédients à analyser');
      return;
    }
    
    const name = productName.trim() || 'Produit analysé';
    await analyzeProduct(name, inputText);
  };

  const handleTestProduct = async (testFunction: () => Promise<any>, productInfo: string) => {
    console.log(`🧪 Test rapide: ${productInfo}`);
    setProductName(productInfo);
    setInputText('Test en cours...');
    await testFunction();
  };

  const handleReset = () => {
    setInputText('');
    setProductName('');
    reset();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              🔬 Analyse NOVA - Intelligence Artificielle
            </h1>
            {data && (
              <div className="flex space-x-3">
                <button
                  onClick={handleReset}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Nouvelle analyse
                </button>
                
                <button
                  onClick={() => navigate('/demo')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Voir la démo
                </button>
              </div>
            )}
          </div>
          
          {/* Zone de saisie */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du produit (optionnel)
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ex: Coca-Cola Original, Nutella, Pizza 4 Fromages..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ingrédients du produit (copiez depuis l'étiquette)
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={4}
                placeholder="Ex: Eau gazéifiée, sucre, sirop de glucose-fructose, arôme naturel, colorant E150d, édulcorant E952, conservateur E211..."
              />
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyse en cours...
                </>
              ) : (
                'Analyser le produit'
              )}
            </button>
            
            <div className="border-l border-gray-300 pl-3 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 self-center mr-2">Tests rapides:</span>
              
              <button
                onClick={() => handleTestProduct(testCocaCola, 'Coca-Cola Original')}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
              >
                🥤 Coca-Cola
              </button>
              
              <button
                onClick={() => handleTestProduct(testNutella, 'Nutella Pâte à tartiner')}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
              >
                🍫 Nutella
              </button>
              
              <button
                onClick={() => handleTestProduct(testPizzaSurgelee, 'Pizza 4 Fromages Surgelée')}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
              >
                🍕 Pizza surgelée
              </button>
            </div>
          </div>

          {/* Informations sur l'API */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="text-blue-600 text-xl mr-3">ℹ️</div>
              <div>
                <h3 className="text-blue-800 font-medium mb-1">Intelligence Artificielle ECOLOJIA</h3>
                <p className="text-blue-700 text-sm">
                  Analyse automatique avec détection du type de produit (alimentaire/cosmétique/ménager), 
                  classification NOVA scientifique, détection d'additifs et recommandations personnalisées.
                </p>
                <p className="text-blue-600 text-xs mt-2">
                  API Backend: <code className="bg-blue-100 px-1 rounded">ecolojia-backend-working.onrender.com</code>
                </p>
              </div>
            </div>
          </div>

          {/* Gestion des erreurs */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="text-red-600 text-xl mr-3">❌</div>
                <div className="flex-1">
                  <h3 className="text-red-800 font-medium">Erreur d'analyse</h3>
                  <p className="text-red-700">{error}</p>
                  
                  {error.includes('quota') && (
                    <div className="mt-3 p-3 bg-red-100 rounded border border-red-200">
                      <p className="text-red-800 text-sm font-medium">💡 Solutions:</p>
                      <ul className="text-red-700 text-sm mt-1 list-disc list-inside">
                        <li>Attendez le renouvellement quotidien du quota</li>
                        <li>Utilisez les tests rapides prédéfinis</li>
                        <li>Réessayez avec un produit plus simple</li>
                      </ul>
                    </div>
                  )}
                  
                  {error.includes('confidence') && (
                    <div className="mt-3 p-3 bg-red-100 rounded border border-red-200">
                      <p className="text-red-800 text-sm font-medium">💡 Améliorez la reconnaissance:</p>
                      <ul className="text-red-700 text-sm mt-1 list-disc list-inside">
                        <li>Ajoutez le nom exact du produit</li>
                        <li>Copiez la liste d'ingrédients complète</li>
                        <li>Vérifiez l'orthographe des ingrédients</li>
                      </ul>
                    </div>
                  )}
                  
                  <button
                    onClick={handleReset}
                    className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Résultats */}
        {(data || loading) && (
          <div className="transition-all duration-500 ease-in-out">
            <NovaResults result={data!} loading={loading} />
          </div>
        )}

        {/* États vides */}
        {!data && !loading && !error && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">🔬</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Prêt pour l'analyse NOVA
            </h2>
            <p className="text-gray-600 mb-6">
              Saisissez les ingrédients d'un produit ou utilisez un test rapide pour découvrir 
              son profil nutritionnel et ses alternatives naturelles.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-green-600 text-2xl mb-2">🥬</div>
                <h3 className="font-medium text-green-800">Groupe NOVA 1-2</h3>
                <p className="text-green-700">Aliments peu ou pas transformés</p>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="text-orange-600 text-2xl mb-2">🍞</div>
                <h3 className="font-medium text-orange-800">Groupe NOVA 3</h3>
                <p className="text-orange-700">Aliments transformés</p>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-600 text-2xl mb-2">🍟</div>
                <h3 className="font-medium text-red-800">Groupe NOVA 4</h3>
                <p className="text-red-700">Aliments ultra-transformés</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;