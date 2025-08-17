// frontend/ecolojiaFrontV3/src/pages/MultiCategoriesPage.tsx
// Page principale pour afficher et tester les categories multi-analyses - VERSION CORRIGÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°E

import React, { useState, useEffect } from 'react';
import CategoryCard from '../components/CategoryCard';
import { 
  Category, 
  CategoriesResponse, 
  AnalysisResponse, 
  multiCategoryApi 
} from '../services/multiCategoryApi';

const MultiCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResponse | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  // Charger les categories au montage du composant
  useEffect(() => {
    loadCategories();
    checkConnection();
  }, []);

  // Fonction pour verifier la connexion API
  const checkConnection = async () => {
    try {
      setConnectionStatus('checking');
      const isConnected = await multiCategoryApi.testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    } catch {
      setConnectionStatus('disconnected');
    }
  };

  // Fonction pour charger les categories - CORRIGÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°E
  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚ÂaaÃ¢â‚¬Å¡Ã‚Â¬â€¦Ã‚Â¾ Chargement des categories...');
      const response: CategoriesResponse = await multiCategoryApi.getCategories();
      
      // Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚ÂÆ’Ã¢â‚¬Å¡â€šÃ‚Â§ FIX: Inspection de la reponse et adaptation dynamique
      console.log('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€¦Ã¢â‚¬Å“Æ’Ã¢â‚¬Â¦â€šÃ‚Â  Reponse API recue:', response);
      
      if (response.success) {
        // Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚ÂÆ’Ã¢â‚¬Å¡â€šÃ‚Â§ FIX: Gestion flexible de la structure de reponse
        let categoriesData: Category[] = [];
        let totalCount = 0;
        
        if (response.categories && Array.isArray(response.categories)) {
          categoriesData = response.categories;
          totalCount = response.total_categories || response.categories.length;
        } else if ((response as any).data && Array.isArray((response as any).data)) {
          // Cas oÆ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â¹ les categories sont dans response.data
          categoriesData = (response as any).data;
          totalCount = (response as any).total || categoriesDat?.length;
        } else {
          throw new Error('Structure de reponse inattendue');
        }
        
        setCategories(categoriesData);
        console.log('aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ Categories chargees:', totalCount, 'categories trouvees');
      } else {
        throw new Error(response.error || 'Reponse API invalide');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('aÆ’Ã¢â‚¬Å¡â€šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢ Erreur chargement categories:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Callback appele quand une analyse est terminee
  const handleAnalysisComplete = (result: AnalysisResponse) => {
    setLastAnalysis(result);
    console.log('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€¦Ã¢â‚¬Å“Æ’Ã¢â‚¬Â¦â€šÃ‚Â  Nouvelle analyse terminee:', result.category, result.analysis?.overall_score);
  };

  // Fonction pour reessayer le chargement
  const handleRetry = () => {
    loadCategories();
    checkConnection();
  };

  // Rendu du statut de connexion
  const renderConnectionStatus = () => {
    const statusConfig = {
      checking: { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: 'Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚ÂaaÃ¢â‚¬Å¡Ã‚Â¬â€¦Ã‚Â¾', text: 'Verification...' },
      connected: { color: 'text-green-600', bg: 'bg-green-50', icon: 'aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦', text: 'API Connectee' },
      disconnected: { color: 'text-red-600', bg: 'bg-red-50', icon: 'aÆ’Ã¢â‚¬Å¡â€šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢', text: 'API Deconnectee' }
    };
    
    const config = statusConfig[connectionStatus];
    
    return (
      <div className={`${config.bg} ${config.color} rounded-2xl p-4 text-center`}>
        <span className="text-lg">{config.icon}</span>
        <span className="ml-2 font-medium">{config.text}</span>
      </div>
    );
  };

  // Rendu de l'etat de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â± ECOLOJIA Multi-Categories
            </h1>
            <p className="text-xl text-gray-600">
              Analyse IA scientifique pour tous vos produits
            </p>
          </div>

          {/* Loading state */}
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg text-gray-600">Chargement des categories...</p>
            <p className="text-sm text-gray-500 mt-2">Connexion Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  l'API ECOLOJIA</p>
          </div>
        </div>
      </div>
    );
  }

  // Rendu de l'etat d'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â± ECOLOJIA Multi-Categories
            </h1>
            <p className="text-xl text-gray-600">
              Analyse IA scientifique pour tous vos produits
            </p>
          </div>

          {/* Error state */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8 text-center">
              <div className="text-6xl mb-4">aÆ’Ã¢â‚¬Å¡â€šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢</div>
              <h2 className="text-2xl font-bold text-red-800 mb-4">
                Erreur de Connexion
              </h2>
              <p className="text-red-600 mb-6">{error}</p>
              
              {renderConnectionStatus()}
              
              <button
                onClick={handleRetry}
                className="mt-6 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-2xl transition-colors"
              >
                Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚ÂaaÃ¢â‚¬Å¡Ã‚Â¬â€¦Ã‚Â¾ Reessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚ÂÆ’Ã¢â‚¬Å¡â€šÃ‚Â§ FIX: Verification que les categories sont bien chargees
  if (!categories || categories.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â± ECOLOJIA Multi-Categories
            </h1>
            <div className="max-w-2xl mx-auto">
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-3xl p-8 text-center">
                <div className="text-6xl mb-4">Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€¦Ã¢â‚¬Å“Æ’Ã¢â‚¬Å¡â€šÃ‚Â­</div>
                <h2 className="text-2xl font-bold text-yellow-800 mb-4">
                  Aucune Categorie Disponible
                </h2>
                <p className="text-yellow-600 mb-6">
                  Aucune categorie n'a ete trouvee dans la reponse de l'API.
                </p>
                <button
                  onClick={handleRetry}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-8 rounded-2xl transition-colors"
                >
                  Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚ÂaaÃ¢â‚¬Å¡Ã‚Â¬â€¦Ã‚Â¾ Recharger
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rendu principal avec les categories
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â± ECOLOJIA Multi-Categories
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Analyse IA scientifique pour tous vos produits de consommation
          </p>
          
          {/* Statut de connexion */}
          <div className="max-w-sm mx-auto mb-8">
            {renderConnectionStatus()}
          </div>

          {/* Statistiques */}
          <div className="flex justify-center space-x-8 text-center">
            <div className="bg-white rounded-2xl p-4 shadow-lg">
              <div className="text-2xl font-bold text-green-600">{categories.length}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-lg">
              <div className="text-2xl font-bold text-blue-600">
                {categories.filter(c => c?.available).length}
              </div>
              <div className="text-sm text-gray-600">Disponibles</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-lg">
              <div className="text-2xl font-bold text-purple-600">IA</div>
              <div className="text-sm text-gray-600">Scientifique</div>
            </div>
          </div>
        </div>

        {/* Derniere analyse */}
        {lastAnalysis && (
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-3xl shadow-lg border-2 border-green-200 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€¦Ã¢â‚¬Å“Æ’Ã¢â‚¬Â¦â€šÃ‚Â  Derniere Analyse Terminee
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-2xl">
                  <div className="text-2xl font-bold text-green-600">
                    {lastAnalysis.analysis?.overall_score || 'N/A'}/100
                  </div>
                  <div className="text-sm text-gray-600">Score Global</div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-2xl">
                  <div className="text-lg font-bold text-blue-600 capitalize">
                    {lastAnalysis.category || 'Inconnue'}
                  </div>
                  <div className="text-sm text-gray-600">Categorie</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-2xl">
                  <div className="text-lg font-bold text-purple-600">
                    {Math.round((lastAnalysis.detection_confidence || 0) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Confiance IA</div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-2xl">
                  <div className="text-lg font-bold text-orange-600">
                    {lastAnalysis.metadata?.processing_time_ms || 'N/A'}ms
                  </div>
                  <div className="text-sm text-gray-600">Temps Traitement</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grille des categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {categories.map((category) => (
            <CategoryCard
              key={category?.id || Math.random()}
              category={category}
              onAnalysisComplete={handleAnalysisComplete}
            />
          ))}
        </div>

        {/* Instructions */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Å¡â€šÃ‚Â§Æ’Ã¢â‚¬Å¡â€šÃ‚Âª Comment tester les analyses ?
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-3">Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Å¡â€šÃ‚ÂÆ’Ã¢â‚¬Â¦â€šÃ‚Â½</div>
                <h4 className="font-bold text-green-600 mb-2">Alimentaire</h4>
                <p className="text-sm text-gray-600">
                  Test avec cereales bio + additifs pour detecter l'ultra-transformation
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl mb-3">Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬aÃ¢â‚¬Å¾Ã‚Â¢aaÃ¢â‚¬Å¡Ã‚Â¬â€¦Ã‚Â¾</div>
                <h4 className="font-bold text-pink-600 mb-2">Cosmetiques</h4>
                <p className="text-sm text-gray-600">
                  Test avec shampooing + sulfates pour analyser les ingredients controverses
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl mb-3">Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Å¡â€šÃ‚Â§Æ’Ã¢â‚¬Å¡â€šÃ‚Â½</div>
                <h4 className="font-bold text-blue-600 mb-2">Detergents</h4>
                <p className="text-sm text-gray-600">
                  Test avec lessive + tensioactifs pour evaluer l'impact environnemental
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 py-8">
          <p className="text-gray-500">
            Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚ÂÆ’Ã¢â‚¬Å¡â€šÃ‚Â¬ Powered by ECOLOJIA Scientific AI aaÃ¢â‚¬Å¡Ã‚Â¬Æ’Ã¢â‚¬Å¡â€šÃ‚Â¢ 
            Backend API: {connectionStatus === 'connected' ? 'aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ Operationnel' : 'aÆ’Ã¢â‚¬Å¡â€šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢ Indisponible'}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Sources: ANSES, EFSA, INSERM, OMS aaÃ¢â‚¬Å¡Ã‚Â¬Æ’Ã¢â‚¬Å¡â€šÃ‚Â¢ Classification NOVA aaÃ¢â‚¬Å¡Ã‚Â¬Æ’Ã¢â‚¬Å¡â€šÃ‚Â¢ Bases scientifiques officielles
          </p>
        </div>
      </div>
    </div>
  );
};

export default MultiCategoriesPage;


