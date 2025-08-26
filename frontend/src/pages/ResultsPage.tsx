// PATH: frontend/src/pages/ResultsPage.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  AlertCircle, TrendingUp, Leaf, Shield, Package, 
  Heart, Droplet, AlertTriangle, CheckCircle, Info
} from 'lucide-react';
import { productService, analysisService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useQuota } from '../hooks/useQuota';
import { toast } from 'react-hot-toast';

interface AnalysisResult {
  product: {
    _id: string;
    name: string;
    brand?: string;
    barcode?: string;
    category: 'food' | 'cosmetics' | 'detergents';
    imageUrl?: string;
  };
  scores: {
    health?: number;
    environment?: number;
    social?: number;
  };
  // Alimentaire
  nutriScore?: string;
  novaGroup?: number;
  ecoScore?: string;
  additives?: Array<{
    code: string;
    name: string;
    risk: 'low' | 'medium' | 'high';
  }>;
  allergens?: string[];
  // Cosmétique
  inci?: Array<{
    name: string;
    function?: string;
    concerns?: string[];
    ewgScore?: number;
  }>;
  endocrineDisruptors?: string[];
  // Détergent
  biodegradability?: number;
  cdv?: number;
  ecoLabels?: string[];
  phosphateContent?: number;
  // Commun
  recommendations?: string[];
  alternatives?: Array<{
    _id: string;
    name: string;
    brand?: string;
    reason: string;
    improvement: number;
  }>;
}

const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { checkScanQuota, consumeScan } = useQuota();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const barcode = searchParams.get('barcode');
  const productId = searchParams.get('id');
  const category = searchParams.get('category') as 'food' | 'cosmetics' | 'detergents' | null;

  useEffect(() => {
    if (!barcode && !productId) {
      setError('Aucun produit spécifié');
      setLoading(false);
      return;
    }

    analyzeProduct();
  }, [barcode, productId]);

  const analyzeProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      // Vérifier les quotas si l'utilisateur est connecté
      if (isAuthenticated && !checkScanQuota()) {
        navigate('/premium');
        return;
      }

      // Obtenir le produit d'abord si nécessaire
      let product;
      if (barcode) {
        product = await productService.getByBarcode(barcode);
      } else if (productId) {
        product = await productService.getById(productId);
      }

      if (!product) {
        throw new Error('Produit introuvable');
      }

      // Analyser le produit
      const analysisParams = {
        barcode: product.barcode,
        productId: product._id,
        category: category || product.category || 'food',
      };

      const analysis = await analysisService.analyzeProduct(analysisParams);

      // Consommer le quota si connecté
      if (isAuthenticated) {
        await consumeScan();
      }

      setResult({
        product: {
          ...product,
          category: analysisParams.category as any,
        },
        ...analysis,
      });
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || 'Erreur lors de l\'analyse');
      toast.error('Erreur lors de l\'analyse du produit');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour obtenir la couleur selon le score
  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  // Fonction pour obtenir la couleur du Nutri-Score
  const getNutriScoreColor = (score?: string) => {
    const colors = {
      'A': 'bg-green-600',
      'B': 'bg-green-500',
      'C': 'bg-yellow-500',
      'D': 'bg-orange-500',
      'E': 'bg-red-600',
    };
    return colors[score as keyof typeof colors] || 'bg-gray-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Analyse en cours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-center text-gray-800 mb-2">Erreur d'analyse</h2>
          <p className="text-center text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/search')}
            className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
          >
            Retour à la recherche
          </button>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header produit */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {result.product.imageUrl && (
              <img
                src={result.product.imageUrl}
                alt={result.product.name}
                className="w-full md:w-48 h-48 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{result.product.name}</h1>
              {result.product.brand && (
                <p className="text-lg text-gray-600 mb-4">{result.product.brand}</p>
              )}
              
              {/* Scores principaux */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {result.scores.health !== undefined && (
                  <div className="text-center">
                    <Heart className="h-8 w-8 mx-auto mb-1 text-red-500" />
                    <div className={`text-2xl font-bold ${getScoreColor(result.scores.health)}`}>
                      {result.scores.health}/100
                    </div>
                    <p className="text-sm text-gray-600">Score santé</p>
                  </div>
                )}
                {result.scores.environment !== undefined && (
                  <div className="text-center">
                    <Leaf className="h-8 w-8 mx-auto mb-1 text-green-500" />
                    <div className={`text-2xl font-bold ${getScoreColor(result.scores.environment)}`}>
                      {result.scores.environment}/100
                    </div>
                    <p className="text-sm text-gray-600">Score environnement</p>
                  </div>
                )}
                {result.scores.social !== undefined && (
                  <div className="text-center">
                    <Shield className="h-8 w-8 mx-auto mb-1 text-blue-500" />
                    <div className={`text-2xl font-bold ${getScoreColor(result.scores.social)}`}>
                      {result.scores.social}/100
                    </div>
                    <p className="text-sm text-gray-600">Score social</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Analyse spécifique selon la catégorie */}
        {result.product.category === 'food' && (
          <div className="space-y-6">
            {/* Scores nutritionnels */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Analyse nutritionnelle</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {result.nutriScore && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Nutri-Score</p>
                    <div className={`inline-block px-4 py-2 rounded-lg text-white text-2xl font-bold ${getNutriScoreColor(result.nutriScore)}`}>
                      {result.nutriScore}
                    </div>
                  </div>
                )}
                {result.novaGroup && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Groupe NOVA</p>
                    <div className="text-2xl font-bold">
                      {result.novaGroup}
                      <span className="text-sm font-normal text-gray-600 ml-2">
                        {result.novaGroup === 1 && '(Non transformé)'}
                        {result.novaGroup === 2 && '(Peu transformé)'}
                        {result.novaGroup === 3 && '(Transformé)'}
                        {result.novaGroup === 4 && '(Ultra-transformé)'}
                      </span>
                    </div>
                  </div>
                )}
                {result.ecoScore && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Éco-Score</p>
                    <div className={`inline-block px-4 py-2 rounded-lg text-white text-2xl font-bold ${getNutriScoreColor(result.ecoScore)}`}>
                      {result.ecoScore}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Additifs */}
            {result.additives && result.additives.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Additifs alimentaires</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.additives.map((additive, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      {additive.risk === 'high' && <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />}
                      {additive.risk === 'medium' && <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />}
                      {additive.risk === 'low' && <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />}
                      <div>
                        <p className="font-medium">{additive.code}</p>
                        <p className="text-sm text-gray-600">{additive.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Allergènes */}
            {result.allergens && result.allergens.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Allergènes</h2>
                <div className="flex flex-wrap gap-2">
                  {result.allergens.map((allergen, index) => (
                    <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                      {allergen}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {result.product.category === 'cosmetics' && (
          <div className="space-y-6">
            {/* Analyse INCI */}
            {result.inci && result.inci.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Analyse des ingrédients (INCI)</h2>
                <div className="space-y-3">
                  {result.inci.slice(0, 10).map((ingredient, index) => (
                    <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{ingredient.name}</p>
                        {ingredient.function && (
                          <p className="text-sm text-gray-600">{ingredient.function}</p>
                        )}
                        {ingredient.concerns && ingredient.concerns.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {ingredient.concerns.map((concern, i) => (
                              <span key={i} className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                                {concern}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {ingredient.ewgScore && (
                        <div className="ml-4">
                          <span className={`text-lg font-bold ${ingredient.ewgScore <= 2 ? 'text-green-600' : ingredient.ewgScore <= 6 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {ingredient.ewgScore}/10
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  {result.inci.length > 10 && (
                    <p className="text-center text-gray-600 text-sm mt-4">
                      Et {result.inci.length - 10} autres ingrédients...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Perturbateurs endocriniens */}
            {result.endocrineDisruptors && result.endocrineDisruptors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-red-800 mb-4">
                  ⚠️ Perturbateurs endocriniens suspectés
                </h2>
                <div className="flex flex-wrap gap-2">
                  {result.endocrineDisruptors.map((disruptor, index) => (
                    <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                      {disruptor}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {result.product.category === 'detergents' && (
          <div className="space-y-6">
            {/* Impact environnemental */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Impact environnemental</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {result.biodegradability !== undefined && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Biodégradabilité</p>
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-4 mr-4">
                        <div
                          className="bg-green-500 h-4 rounded-full"
                          style={{ width: `${result.biodegradability}%` }}
                        ></div>
                      </div>
                      <span className="font-bold">{result.biodegradability}%</span>
                    </div>
                  </div>
                )}
                {result.cdv !== undefined && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">CDV (Critical Dilution Volume)</p>
                    <div className="text-2xl font-bold">
                      {result.cdv.toLocaleString()} L/kg
                    </div>
                  </div>
                )}
                {result.phosphateContent !== undefined && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Teneur en phosphates</p>
                    <div className="text-2xl font-bold">
                      {result.phosphateContent}%
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Éco-labels */}
            {result.ecoLabels && result.ecoLabels.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-green-800 mb-4">
                  ✓ Certifications écologiques
                </h2>
                <div className="flex flex-wrap gap-2">
                  {result.ecoLabels.map((label, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recommandations */}
        {result.recommendations && result.recommendations.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
              <Info className="h-5 w-5 mr-2" />
              Recommandations
            </h2>
            <ul className="space-y-2">
              {result.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span className="text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Alternatives */}
        {result.alternatives && result.alternatives.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Alternatives recommandées
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.alternatives.map((alt) => (
                <div
                  key={alt._id}
                  onClick={() => navigate(`/result?id=${alt._id}`)}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md cursor-pointer transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{alt.name}</h3>
                      {alt.brand && <p className="text-sm text-gray-600">{alt.brand}</p>}
                    </div>
                    <div className="text-green-600 font-bold">
                      +{alt.improvement}%
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{alt.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => navigate('/search')}
            className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Nouvelle recherche
          </button>
          {isAuthenticated && (
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition-colors"
            >
              Voir mon tableau de bord
            </button>
          )}
        </div>
      </div>
    </div>
  );
};