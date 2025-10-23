// frontend/ecolojiaFrontV3/src/pages/MultiCategoriesPage.tsx
// Page principale pour afficher et tester les catÃ©gories multi-analyses - VERSION CORRIGÃƒÆ’Ã†â€™Ã¢Ã¢â€šÂ¬Ã‚Â°E

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

  // Charger les catÃ©gories au montage du composant
  useEffect(() => {
    loadCategories();
    checkConnection();
  }, []);

  // Fonction pour vÃ©rifier la connexion API
  const checkConnection = async () => {
    try {
      setConnectionStatus('checking');
      const isConnected = await multiCategoryApi.testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    } catch {
      setConnectionStatus('disconnected');
    }
  };

  // Fonction pour charger les catÃ©gories - CORRIGÃƒÆ’Ã†â€™Ã¢Ã¢â€šÂ¬Ã‚Â°E
  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã‚ÂÃ¢Ã¢â€šÂ¬Ã…Â¾ Chargement des catÃ©gories...');
      const response: CategoriesResponse = await multiCategoryApi.getCategories();
      
      // ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚Â§ FIX: Inspection de la rÃ©ponse et adaptation dynamique
      console.log('ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã…â€œÃƒâ€¦Ã‚Â  RÃ©ponse API reÃ§ue:', response);
      
      if (response.success) {
        // ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚Â§ FIX: Gestion flexible de la structure de rÃ©ponse
        let categoriesData: Category[] = [];
        let totalCount = 0;
        
        if (response.categories && Array.isArray(response.categories)) {
          categoriesData = response.categories;
          totalCount = response.total_categories || response.categories.length;
        } else if ((response as any).data && Array.isArray((response as any).data)) {
          // Cas oÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ les catÃ©gories sont dans response.data
          categoriesData = (response as any).data;
          totalCount = (response as any).total || categoriesData.length;
        } else {
          throw new Error('Structure de rÃ©ponse inattendue');
        }
        
        setCategories(categoriesData);
        console.log('Ã¢Ãƒâ€¦Ã¢â‚¬Å“Ã¢Ã¢â€šÂ¬Ã‚Â¦ CatÃ©gories chargÃ©es:', totalCount, 'catÃ©gories trouvÃ©es');
      } else {
        throw new Error(response.error || 'RÃ©ponse API invalide');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Ã¢Ãƒâ€šÃ‚ÂÃƒâ€¦Ã¢â‚¬â„¢ Erreur chargement catÃ©gories:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Callback appelÃ© quand une analyse est terminÃ©e
  const handleAnalysisComplete = (result: AnalysisResponse) => {
    setLastAnalysis(result);
    console.log('ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã…â€œÃƒâ€¦Ã‚Â  Nouvelle analyse terminÃ©e:', result.category, result.analysis?.overall_score);
  };

  // Fonction pour rÃ©essayer le chargement
  const handleRetry = () => {
    loadCategories();
    checkConnection();
  };

  // Rendu du statut de connexion
  const renderConnectionStatus = () => {
    const statusConfig = {
      checking: { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã‚ÂÃ¢Ã¢â€šÂ¬Ã…Â¾', text: 'VÃ©rification...' },
      connected: { color: 'text-green-600', bg: 'bg-green-50', icon: 'Ã¢Ãƒâ€¦Ã¢â‚¬Å“Ã¢Ã¢â€šÂ¬Ã‚Â¦', text: 'API ConnectÃ©e' },
      disconnected: { color: 'text-red-600', bg: 'bg-red-50', icon: 'Ã¢Ãƒâ€šÃ‚ÂÃƒâ€¦Ã¢â‚¬â„¢', text: 'API DÃ©connectÃ©e' }
    };
    
    const config = statusConfig[connectionStatus];
    
    return (
      <div className={`${config.bg} ${config.color} rounded-2xl p-4 text-center`}>
        <span className="text-lg">{config.icon}</span>
        <span className="ml-2 font-medium">{config.text}</span>
      </div>
    );
  };

  // Rendu de l'Ã©tat de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â± ECOLOJIA Multi-CatÃ©gories
            </h1>
            <p className="text-xl text-gray-600">
              Analyse IA scientifique pour tous vos produits
            </p>
          </div>

          {/* Loading state */}
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg text-gray-600">Chargement des catÃ©gories...</p>
            <p className="text-sm text-gray-500 mt-2">Connexion ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  l'API ECOLOJIA</p>
          </div>
        </div>
      </div>
    );
  }

  // Rendu de l'Ã©tat d'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â± ECOLOJIA Multi-CatÃ©gories
            </h1>
            <p className="text-xl text-gray-600">
              Analyse IA scientifique pour tous vos produits
            </p>
          </div>

          {/* Error state */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8 text-center">
              <div className="text-6xl mb-4">Ã¢Ãƒâ€šÃ‚ÂÃƒâ€¦Ã¢â‚¬â„¢</div>
              <h2 className="text-2xl font-bold text-red-800 mb-4">
                Erreur de Connexion
              </h2>
              <p className="text-red-600 mb-6">{error}</p>
              
              {renderConnectionStatus()}
              
              <button
                onClick={handleRetry}
                className="mt-6 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-2xl transition-colors"
              >
                ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã‚ÂÃ¢Ã¢â€šÂ¬Ã…Â¾ RÃ©essayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚Â§ FIX: VÃ©rification que les catÃ©gories sont bien chargÃ©es
  if (!categories || categories.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â± ECOLOJIA Multi-CatÃ©gories
            </h1>
            <div className="max-w-2xl mx-auto">
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-3xl p-8 text-center">
                <div className="text-6xl mb-4">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã…â€œÃƒâ€šÃ‚Â­</div>
                <h2 className="text-2xl font-bold text-yellow-800 mb-4">
                  Aucune CatÃ©gorie Disponible
                </h2>
                <p className="text-yellow-600 mb-6">
                  Aucune catÃ©gorie n'a Ã©tÃ© trouvÃ©e dans la rÃ©ponse de l'API.
                </p>
                <button
                  onClick={handleRetry}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-8 rounded-2xl transition-colors"
                >
                  ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã‚ÂÃ¢Ã¢â€šÂ¬Ã…Â¾ Recharger
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rendu principal avec les catÃ©gories
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â± ECOLOJIA Multi-CatÃ©gories
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
              <div className="text-sm text-gray-600">CatÃ©gories</div>
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

        {/* DerniÃ¨re analyse */}
        {lastAnalysis && (
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-3xl shadow-lg border-2 border-green-200 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã…â€œÃƒâ€¦Ã‚Â  DerniÃ¨re Analyse TerminÃ©e
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
                  <div className="text-sm text-gray-600">CatÃ©gorie</div>
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

        {/* Grille des catÃ©gories */}
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
              ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â§Ãƒâ€šÃ‚Âª Comment tester les analyses ?
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-3">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚ÂÃƒâ€¦Ã‚Â½</div>
                <h4 className="font-bold text-green-600 mb-2">Alimentaire</h4>
                <p className="text-sm text-gray-600">
                  Test avec cÃ©rÃ©ales bio + additifs pour dÃ©tecter l'ultra-transformation
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl mb-3">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ã¢Ã¢â€šÂ¬Ã…Â¾</div>
                <h4 className="font-bold text-pink-600 mb-2">CosmÃ©tiques</h4>
                <p className="text-sm text-gray-600">
                  Test avec shampooing + sulfates pour analyser les ingrÃ©dients controversÃ©s
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl mb-3">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â§Ãƒâ€šÃ‚Â½</div>
                <h4 className="font-bold text-blue-600 mb-2">DÃ©tergents</h4>
                <p className="text-sm text-gray-600">
                  Test avec lessive + tensioactifs pour Ã©valuer l'impact environnemental
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 py-8">
          <p className="text-gray-500">
            ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚Â¬ Powered by ECOLOJIA Scientific AI Ã¢Ã¢â€šÂ¬Ãƒâ€šÃ‚Â¢ 
            Backend API: {connectionStatus === 'connected' ? 'Ã¢Ãƒâ€¦Ã¢â‚¬Å“Ã¢Ã¢â€šÂ¬Ã‚Â¦ OpÃ©rationnel' : 'Ã¢Ãƒâ€šÃ‚ÂÃƒâ€¦Ã¢â‚¬â„¢ Indisponible'}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Sources: ANSES, EFSA, INSERM, OMS Ã¢Ã¢â€šÂ¬Ãƒâ€šÃ‚Â¢ Classification NOVA Ã¢Ã¢â€šÂ¬Ãƒâ€šÃ‚Â¢ Bases scientifiques officielles
          </p>
        </div>
      </div>
    </div>
  );
};

export default MultiCategoriesPage;

