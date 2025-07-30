// src/components/CategoryCard.tsx
// Composant carte pour afficher une catégorie et permettre l'analyse - VERSION SÉCURISÉE COMPLÈTE

import React, { useState } from 'react';
import { Category, AnalysisResponse, multiCategoryApi } from '../services/multiCategoryApi';

interface CategoryCardProps {
  category: Category | null | undefined;
  onAnalysisComplete?: (result: AnalysisResponse) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onAnalysisComplete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 🔧 FIX: Vérification de sécurité pour category
  if (!category) {
    return (
      <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-200 p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-bold text-gray-500 mb-2">Catégorie indisponible</h3>
          <p className="text-sm text-gray-400">
            Les données de cette catégorie n'ont pas pu être chargées.
          </p>
        </div>
      </div>
    );
  }

  // Couleurs par catégorie avec fallbacks
  const getThemeColors = (categoryId: string) => {
    const themes = {
      food: {
        primary: '#7DDE4A',
        secondary: '#E8F5E8',
        border: '#7DDE4A',
        text: '#2D5016'
      },
      cosmetics: {
        primary: '#FF69B4',
        secondary: '#FFE4E6',
        border: '#FF69B4',
        text: '#8B1A5C'
      },
      detergents: {
        primary: '#4FC3F7',
        secondary: '#E1F5FE',
        border: '#4FC3F7',
        text: '#1565C0'
      },
      default: {
        primary: '#6B7280',
        secondary: '#F3F4F6',
        border: '#6B7280',
        text: '#374151'
      }
    };
    return themes[categoryId as keyof typeof themes] || themes.default;
  };

  const theme = getThemeColors(category.id || 'default');

  // Lancer une analyse test
  const handleTestAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);
      setAnalysisResult(null);

      // Récupérer les données de test pour cette catégorie
      const testData = multiCategoryApi.getTestData()[category.id];
      
      if (!testData) {
        throw new Error(`Pas de données de test pour ${category.id}`);
      }

      console.log(`🧪 Test analyse ${category.id}:`, testData.product.title);
      
      // Lancer l'analyse
      const result = await multiCategoryApi.analyzeProduct(testData);
      
      setAnalysisResult(result);
      onAnalysisComplete?.(result);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error(`❌ Erreur analyse ${category.id}:`, errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Réinitialiser les résultats
  const handleReset = () => {
    setAnalysisResult(null);
    setError(null);
  };

  // 🔧 FIX: Sécurisation des données avec fallbacks
  const categoryName = category.name || 'Catégorie inconnue';
  const categoryDescription = category.description || 'Description non disponible';
  const categoryIcon = category.icon || '❓';
  const categoryFeatures = category.features || [];
  const categoryAvailable = category.available ?? false;

  return (
    <div 
      className="bg-white rounded-3xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl hover:scale-105"
      style={{ borderColor: theme.border }}
    >
      {/* Header de la carte */}
      <div 
        className="p-6 rounded-t-3xl"
        style={{ backgroundColor: theme.secondary }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl text-white font-bold"
              style={{ backgroundColor: theme.primary }}
            >
              {categoryIcon}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{categoryName}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: categoryAvailable ? theme.primary : '#9CA3AF' }}
                />
                <span className="text-sm text-gray-600">
                  {categoryAvailable ? 'Disponible' : 'Bientôt disponible'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-gray-700 leading-relaxed mb-4">
          {categoryDescription}
        </p>

        {/* Fonctionnalités - 🔧 FIX: Sécurisation avec slice() */}
        <div className="grid grid-cols-2 gap-2">
          {categoryFeatures.slice(0, 4).map((feature, index) => (
            <div key={index} className="bg-white rounded-lg p-2 text-center">
              <span className="text-xs text-gray-600">{feature}</span>
            </div>
          ))}
          {categoryFeatures.length === 0 && (
            <div className="col-span-2 bg-white rounded-lg p-2 text-center">
              <span className="text-xs text-gray-400">Fonctionnalités à venir</span>
            </div>
          )}
        </div>
      </div>

      {/* Zone d'action */}
      <div className="p-6">
        {!analysisResult && !error && (
          <button
            onClick={handleTestAnalysis}
            disabled={isAnalyzing || !categoryAvailable}
            className={`w-full py-4 rounded-2xl font-bold text-white text-lg transition-all ${
              isAnalyzing 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:shadow-lg transform hover:scale-105'
            }`}
            style={{ 
              backgroundColor: categoryAvailable ? theme.primary : '#9CA3AF',
              opacity: isAnalyzing ? 0.5 : 1
            }}
          >
            {isAnalyzing ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analyse en cours...</span>
              </div>
            ) : categoryAvailable ? (
              `🧪 Tester l'analyse ${categoryName.toLowerCase()}`
            ) : (
              `⏳ ${categoryName} bientôt disponible`
            )}
          </button>
        )}

        {/* Résultat de l'analyse */}
        {analysisResult && (
          <div className="space-y-4">
            <div 
              className="rounded-2xl p-4 border-2"
              style={{ 
                backgroundColor: theme.secondary,
                borderColor: theme.border
              }}
            >
              <h4 className="font-bold text-lg mb-3" style={{ color: theme.text }}>
                ✅ Analyse Terminée
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Score global */}
                <div className="bg-white rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold" style={{ color: theme.primary }}>
                    {analysisResult.analysis?.overall_score || 'N/A'}/100
                  </div>
                  <div className="text-sm text-gray-600">Score Global</div>
                </div>

                {/* Catégorie détectée */}
                <div className="bg-white rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-gray-800 capitalize">
                    {analysisResult.category || 'Inconnue'}
                  </div>
                  <div className="text-sm text-gray-600">Catégorie</div>
                </div>

                {/* Confiance */}
                <div className="bg-white rounded-xl p-3 text-center">
                  <div className="text-lg font-bold" style={{ color: theme.primary }}>
                    {Math.round((analysisResult.detection_confidence || 0) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Confiance IA</div>
                </div>
              </div>

              {/* Métadonnées */}
              <div className="mt-3 text-xs text-gray-500 text-center">
                Temps de traitement: {analysisResult.metadata?.processing_time_ms || 'N/A'}ms • 
                API: {analysisResult.metadata?.api_version || 'N/A'}
              </div>
            </div>

            {/* Bouton réinitialiser */}
            <button
              onClick={handleReset}
              className="w-full py-3 rounded-2xl border-2 font-medium transition-all hover:shadow-md"
              style={{ 
                borderColor: theme.border,
                color: theme.text,
                backgroundColor: 'white'
              }}
            >
              🔄 Nouveau Test
            </button>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="space-y-4">
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
              <h4 className="font-bold text-red-800 mb-2">❌ Erreur d'Analyse</h4>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            
            <button
              onClick={handleReset}
              className="w-full py-3 rounded-2xl border-2 border-red-300 text-red-700 font-medium hover:bg-red-50 transition-all"
            >
              🔄 Réessayer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryCard;