import { getScoreColor, getScoreBgColor } from '@/utils/scoreColors';
import { ScoreProgressBar } from '../components/ScoreProgressBar';
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, MessageCircle, Sparkles, CheckCircle, Package } from 'lucide-react';
import { AIEngagementWidget } from '../components/ai/AIEngagementWidget';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { ChatWidget } from '../components/chat/ChatWidget';
import { ProductHeader } from '../components/product/ProductHeader';
import { ProductScoresCard } from '../components/product/ProductScoresCard';
import { ScoreBreakdown } from '../components/product/ScoreBreakdown';
import { useScoreBreakdown } from '../hooks/useScoreBreakdown';
import { ProductIngredients } from '../components/product/ProductIngredients';
import { ProductNutrition } from '../components/product/ProductNutrition';
// import AlternativesPanel supprim? (doublon avec section alternatives unifi?e)
import { CosmeticAnalysisDisplay } from '../components/analysis/CosmeticAnalysisDisplay';
import { ProductIngredientsSection } from '../components/product/ProductIngredientsSection';
import { AllergensSection } from '../components/product/AllergensSection';
import { LabelsSection } from '../components/product/LabelsSection';
import { RecipesList } from '../components/product/RecipesList';
import { ProductChatActions } from '../components/product/ProductChatActions';
import { ProductMainActions } from '../components/product/ProductMainActions';
import { useDeviceContext } from '../hooks/useDeviceContext';
import NovaBadge from '../components/NovaBadge';

// CORRECTION 1 : getJSON retourne maintenant {ok, status, data} au lieu de throw
const getJSON = async (endpoint: string): Promise<any> => {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${import.meta.env.VITE_API_URL || 'http://localhost:10000'}${endpoint}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });

  // Retourner status + data au lieu de throw error
  let data = {};
  try {
    data = await response.json();
  } catch (e) {
    // Si pas de JSON, retourner objet vide
  }

  return {
    ok: response.ok,
    status: response.status,
    data
  };
};

interface Recipe {
  _id: string;
  name: string;
  description: string;
  image?: string;
  prepTime: number;
  servings: number;
  scores: {
    overallScore: number;
    healthScore: number;
    environmentScore: number;
  };
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Product {
  _id: string;
  name: string;
  brand: string;
  barcode?: string;
  category: 'food' | 'cosmetics' | 'detergents';
  images?: { front?: string; ingredients?: string; nutrition?: string };
  scores?: { nova?: number; nutriscore?: string; ecoscore?: string; healthScore?: number; environmentScore?: number };
  ingredients?: Array<{ name: string; percentage?: number; isAllergen: boolean; concerns: string[] }>;
  nutrition?: { per100g: { energy: number; fat: number; saturatedFat: number; carbohydrates: number; sugars: number; protein: number; salt: number; fiber?: number } };
  foodData?: { ingredients?: string; novaGroup?: number; nutriScore?: string; ecoScore?: string };
}

// Helper pour compatibilit? images
const getProductImage = (product: any) => {
  return product.imageUrl || product.images?.front || null;
};

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isMobile } = useDeviceContext();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<Product[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  // CORRECTION 2 : useEffect g?re maintenant les erreurs 400/404
  // CORRECTION : fetchProduct extrait pour ?tre r?utilisable
  const fetchProduct = useCallback(async () => {
      if (!id || id === 'undefined') {
        setError('ID produit manquant ou invalide');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result = await getJSON(`/api/products/${id}`);

        // Gestion erreur 400 (m?dicament, livre, etc.)
        if (result.status === 400) {
          setError(`${result.data.error || 'Type de produit non support?'}`);
          toast.error(result.data.error || 'Type de produit non support?', { duration: 5000 });
          setLoading(false);
          return;
        }

        // Gestion erreur 404 (produit inconnu)
        if (result.status === 404) {
          setError(`Produit introuvable. ${result.data.suggestion || 'Utilisez la fonction OCR pour analyser ce produit.'}`);
          toast.error('Produit non trouv? - Utilisez l\'OCR', { duration: 5000 });
          setLoading(false);
          return;
        }

        // Autre erreur serveur
        if (!result.ok) {
          setError(`Erreur serveur (${result.status}). Veuillez r?essayer.`);
          toast.error('Erreur serveur');
          setLoading(false);
          return;
        }

        // Succ?s
        setProduct(result.data.product || result.data);

        // Extraire recettes si disponibles
        if (result.data.recipes && Array.isArray(result.data.recipes)) {
          setRecipes(result.data.recipes);
        } else {
          setRecipes([]);
        }

        loadAlternatives(id);

      } catch (err: any) {
        console.error('Erreur chargement produit:', err);
        setError('Erreur r?seau - V?rifiez votre connexion');
        toast.error('Erreur r?seau');
      } finally {
        setLoading(false);
      }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const loadAlternatives = async (productId: string) => {
    try {
      setLoadingAlternatives(true);
      const result = await getJSON(`/api/products/${productId}/alternatives`);
      if (result.ok) {
        setAlternatives(result.data.alternatives || result.data || []);
      } else {
        setAlternatives([]);
      }
    } catch (err) {
      console.error('Alternatives non disponibles:', err);
      setAlternatives([]);
    } finally {
      setLoadingAlternatives(false);
    }
  };



  const handleRequestScore = async () => {
    // Guard anti-spam
    if (isAnalyzing) return;
    if (!product?.barcode) {
      toast.error('Code-barres manquant');
      return;
    }

    const cleanBarcode = product.barcode.replace(/_\d+$/, '');
    setIsAnalyzing(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:10000'}/api/ai/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: {
            barcode: cleanBarcode,
            name: product.name || product.product_name,
            brand: product.brand || product.brands
          },
          category: product.category || 'food',
          force: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur serveur' }));
        throw new Error(errorData.error || `Erreur ${response.status}`);
      }

      await response.json();

      // ? SOLUTION SIMPLE : Recharger la page
      toast.success('? Enrichissement termin?, rechargement...', { duration: 1500 });
      setTimeout(() => window.location.reload(), 1500);

    } catch (error: any) {
      console.error('Erreur enrichissement IA:', error);
      toast.error(error.message || 'Erreur lors de l\'enrichissement', { duration: 4000 });
      setIsAnalyzing(false);
    }
  };

  
  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-900">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="bg-primary-50 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Produit introuvable</h2>
          <p className="text-gray-900 mb-6 whitespace-pre-wrap">{error || 'Ce produit n\'existe pas'}</p>
          <div className="space-y-3">
            <Link to="/search" className="bg-neutral-1000 text-forest px-6 py-3 rounded-lg font-medium hover:bg-primary inline-block">
              Rechercher un produit
            </Link>
            {error?.includes('OCR') && (
              <Link to="/ocr" className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 inline-block ml-3">
                Analyser avec OCR
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Scores r?els depuis l'API
  const healthScore = product.scores?.healthScore ?? null;
  const environmentScore = product.scores?.environmentScore ?? null;
  // D?tection si le score a ?t? calcul? (ne pas afficher 0 par d?faut)
  
  // ✅ FIX V3.6 : Utiliser directement le score global calculé par le backend (scoring scientifique 8 composantes)
  const overallScore = (product.scores?.overallScore ?? null);

  // Breakdown r?el depuis l'API
    // G?n?rer le breakdown automatiquement si absent
  const generatedBreakdown = useScoreBreakdown(product);
  const breakdown = product.scores?.breakdown || generatedBreakdown || {};
  const realBreakdown = generatedBreakdown || {};

  if (isMobile) {
    return (
      <div className="min-h-screen bg-primary-50 pb-20">
        <div className="bg-primary-50 border-b border-gray-200 p-4 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-primary-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold truncate">{product.name}</h1>
        </div>
        <div className="space-y-2">
          <div className="bg-primary-50 p-6">
            {getProductImage(product) && <img src={getProductImage(product)} alt={product.name} className="w-32 h-32 object-contain mx-auto mb-4" />}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{product.name}</h2>
              {product.brand && <p className="text-gray-900 mb-4">{product.brand}</p>}
              <div className="inline-flex items-center justify-center bg-primary-50 text-forest rounded-2xl p-6">
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}</div>
                  <div className="text-sm opacity-90 mt-1">/ 100</div>
                </div>
              </div>
                <ScoreProgressBar score={overallScore} onRequestScore={handleRequestScore} isAnalyzing={isAnalyzing} dataCompleteness={product.scores?.dataCompleteness} confidence={product.scores?.confidence} />
              {product.category === 'food' && product.foodData?.novaGroup && (
                <div className="bg-primary-50 rounded-none sm:rounded-xl shadow-sm p-4 sm:p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Classification NOVA</h2>
                  <NovaBadge
                    novaGroup={product.foodData.novaGroup}
                    typeTransformation={product.typeTransformation}
                    showDetails={true}
                  />
                </div>
              )}
              {product.category === 'food' && product.foodData?.allergens && product.foodData.allergens.length > 0 && (
                <div className="bg-primary-50 p-4">
                  <AllergensSection allergens={product.foodData.allergens} />
                </div>
              )}
              {product.category === 'food' && product.foodData?.labels && product.foodData.labels.length > 0 && (
                <div className="bg-primary-50 p-4">
                  <LabelsSection labels={product.foodData.labels} />
                </div>
              )}
            </div>
          </div>
          <div className="bg-primary-50 p-4 space-y-2">
            <button onClick={() => navigate(`/chat?product=${product.barcode}&q=${encodeURIComponent("Pourquoi ce produit a ce score ?")}`)} className="w-full bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-medium">
              <MessageCircle className="w-5 h-5" />Poser une question IA
            </button>
            <button onClick={() => { const el = document.getElementById("alternatives-section"); if (el) el.scrollIntoView({ behavior: "smooth" }); }} className="w-full border-2 border-primary text-primary py-3 rounded-lg flex items-center justify-center gap-2 font-medium">
              <Sparkles className="w-5 h-5" />Voir alternatives
            </button>
          </div>
          <details className="bg-primary-50" open>
            <summary className="p-4 font-semibold cursor-pointer border-b">Analyse d?taill?e (mode expert)</summary>
            <summary className="p-4 font-semibold cursor-pointer border-b">Composition</summary>
            <div className="p-4">{product.foodData?.ingredients ? <div className="text-sm text-gray-700 whitespace-pre-wrap">{product.foodData.ingredients}</div> : <p className="text-neutral-700">Non disponible</p>}</div>
          </details>
          <details className="bg-primary-50" open>
            <summary className="p-4 font-semibold cursor-pointer border-b">Analyse d?taill?e (mode expert)</summary>
            <summary className="p-4 font-semibold cursor-pointer border-b">Analyse d?taill?e (mode expert)</summary>
            <div className="p-4"><ScoreBreakdown product={product} generatedBreakdown={generatedBreakdown} /></div>
          </details>
          
          {product.foodData?.nutrition?.per100g && product.category === 'food' && (
            <details className="bg-primary-50" open>
            <summary className="p-4 font-semibold cursor-pointer border-b">Analyse d?taill?e (mode expert)</summary>
              <summary className="p-4 font-semibold cursor-pointer border-b">Valeurs nutritionnelles</summary>
              <div className="p-4"><ProductNutrition nutrition={product.foodData.nutrition.per100g} /></div>
            </details>
          )}
          {product.category === 'cosmetics' && (
            <details className="bg-primary-50" open>
            <summary className="p-4 font-semibold cursor-pointer border-b">Analyse d?taill?e (mode expert)</summary>
              <summary className="p-4 font-semibold cursor-pointer border-b">Analyse Cosm?tique</summary>
              <div className="p-4">
                <CosmeticAnalysisDisplay
                  analysis={{
                    healthScore: product.scores?.healthScore || 0,
                    endocrineRisk: { level: 'NONE' },
                    category: 'cosmetics'
                  }}
                  productName={product.name}
                />
              </div>
            </details>
          )}
          {product.category === 'detergents' && (
            <details className="bg-primary-50" open>
            <summary className="p-4 font-semibold cursor-pointer border-b">Analyse d?taill?e (mode expert)</summary>
              <summary className="p-4 font-semibold cursor-pointer border-b">Analyse D?tergent</summary>
              <div className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Score environnemental</span>
                    <span className="text-2xl font-bold text-primary">
                      {product.scores?.environmentScore || 'N/A'}/100
                    </span>
                  </div>
                  <p className="text-sm text-gray-900">
                    Impact aquatique, biod?gradabilit? et composition ?valu?s
                  </p>
                </div>
              </div>
            </details>
          )}
          {/* Section alternatives unifi?e - design Ecolojia v3.1 */}
          <div id="alternatives-section" className="bg-white rounded-none sm:rounded-xl shadow-sm p-4 sm:p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-semibold text-neutral-800">Alternatives plus saines</h3>
            </div>

            {loadingAlternatives ? (
              <div className="flex items-center justify-center py-8">
                <Sparkles className="w-6 h-6 animate-spin text-primary" />
                <p className="ml-3 text-neutral-700">Recherche d'alternatives...</p>
              </div>
            ) : alternatives.length > 0 ? (
              <div className="space-y-3">
                {alternatives.slice(0, 5).map((alt) => {
                  const scoreImprovement = (alt.scores?.overallScore || 0) - (overallScore || 0);
                  return (
                    <div
                      key={alt._id}
                      onClick={() => navigate(`/product/${alt.barcode}`)}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary hover:shadow-md transition-all"
                    >
                      {getProductImage(alt) ? (
                        <img src={getProductImage(alt)} alt={alt.name} className="w-16 h-16 object-contain rounded" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}

                      <div className="flex-1">
                        <p className="font-semibold text-neutral-800">{alt.name}</p>
                        <p className="text-sm text-neutral-600">{alt.brand}</p>
                        {scoreImprovement > 0 && (
                          <p className="text-xs text-primary mt-1 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            +{scoreImprovement} points
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(alt.scores?.overallScore || 0)}`}>
                          {alt.scores?.overallScore || 0}
                        </div>
                        <p className="text-xs text-neutral-500">/ 100</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                <h4 className="font-semibold text-yellow-900 mb-2">Aucune alternative trouv?e</h4>
                <p className="text-sm text-yellow-800 mb-4">
                  Notre base de donn?es ne contient pas encore d'alternative pour ce produit.
                </p>
                <p className="text-xs text-yellow-700">
                  Recherchez des produits similaires avec labels bio ou ?quitables
                </p>
              </div>
            )}
          </div>
        </div>
        {product && <ChatWidget productContext={{ productName: product.name, category: product.category, barcode: product.barcode, brand: product.brand }} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50">
      <div className="bg-primary-50 border-b border-gray-200">
        <div className="max-w-none sm:max-w-7xl mx-auto px-0 sm:px-4 py-4">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-900 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-2" />Retour
          </button>
        </div>
      </div>
      <div className="max-w-none sm:max-w-7xl mx-auto px-0 sm:px-4 py-8">
        <ProductHeader name={product.name} brand={product.brand} barcode={product.barcode} category={product.category} imageFront={getProductImage(product)} overallScore={overallScore} nutriscore={product.scores?.nutriscore} nova={product.scores?.nova} ecoscore={product.scores?.ecoscore} />

        {/* Actions standardis?es Ecolojia v3.1 */}
        <ProductMainActions
          product={product}
          onShowAlternatives={() => {
            setTimeout(() => {
              const section = document.getElementById('alternatives-section');
              if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 300);
          }}
        />

        {/* Disclaimer OCR si produit cr?? via OCR */}
        {product.source === 'ocr' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-medium text-yellow-900 mb-1">
                  Produit cr?? par reconnaissance OCR
                </h3>
                <p className="text-yellow-800 text-sm mb-2">
                  Ce produit a ?t? cr?? automatiquement ? partir de photos.
                  Fiabilit? estim?e : {product.confidence ? Math.round(product.confidence * 100) : 70}%
                </p>
                <p className="text-yellow-700 text-xs">
                  Les donn?es peuvent contenir des erreurs. V?rifiez les informations avant utilisation.
                  {product.needsVerification && ' Ce produit n?cessite une v?rification manuelle.'}
                </p>
              </div>
            </div>
          </div>
        )}
          <ScoreProgressBar score={overallScore} onRequestScore={handleRequestScore} isAnalyzing={isAnalyzing} dataCompleteness={product.scores?.dataCompleteness} confidence={product.scores?.confidence} />
        {product.category === 'food' && product.foodData?.novaGroup && (
          <div className="bg-primary-50 rounded-none sm:rounded-xl shadow-sm p-4 sm:p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Classification NOVA</h2>
            <NovaBadge
              novaGroup={product.foodData.novaGroup}
              typeTransformation={product.typeTransformation}
              showDetails={true}
            />
          </div>
        )}
        {product.category === 'food' && product.foodData?.allergens && product.foodData.allergens.length > 0 && (
          <div className="bg-primary-50 p-4">
            <AllergensSection allergens={product.foodData.allergens} />
          </div>
        )}
        {product.category === 'food' && product.foodData?.labels && product.foodData.labels.length > 0 && (
          <div className="bg-primary-50 p-4">
            <LabelsSection labels={product.foodData.labels} />
          </div>
        )}
        <ProductScoresCard healthScore={healthScore} environmentScore={environmentScore} />
        {/* TODO FUTURE : Section Système Hybride Knowledge Base + IA
           Composant KnowledgeAnalysisSection à créer
           Props nécessaires :
             - knowledgeAnalysis={product.knowledgeAnalysis}
             - aiEnriched={product.aiEnriched}
             - knowledgeBaseUsed={product.knowledgeBaseUsed}
             - confidence={product.confidence}
             - deepseekUsed={product.deepseekUsed}
        */}

        <details className="bg-primary-50 rounded-none sm:rounded-xl shadow-sm p-4 sm:p-6 mb-6">
          <summary className="font-semibold cursor-pointer">Analyse d?taill?e (mode expert)</summary>
          <div className="mt-4">
            <ScoreBreakdown product={product} generatedBreakdown={generatedBreakdown} />
          </div>
        </details>


          {/* Section recettes - design Ecolojia v3.1 */}
          {recipes.length > 0 && (
            <RecipesList recipes={recipes} />
          )}
{/* AI Engagement Widget */}
        <AIEngagementWidget product={product} />
        {product.foodData?.ingredients && (<div className="bg-primary-50 rounded-none sm:rounded-xl shadow-sm p-4 sm:p-6 mb-6"><h2 className="text-xl font-semibold text-gray-800 mb-4">Composition</h2><div className="text-gray-700 whitespace-pre-wrap">{product.foodData.ingredients}</div></div>)}
        {product.foodData?.nutrition?.per100g && product.category === 'food' && <ProductNutrition nutrition={product.foodData.nutrition.per100g} />}
        {product.category === 'cosmetics' && (
          <CosmeticAnalysisDisplay
            analysis={{
              healthScore: product.scores?.healthScore || 0,
              endocrineRisk: { level: 'NONE' },
              category: 'cosmetics'
            }}
            productName={product.name}
          />
        )}
        {product.category === 'detergents' && (
          <div className="bg-primary-50 rounded-none sm:rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Analyse D?tergent</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-neutral-100 rounded-lg">
                <span className="text-gray-700 font-medium">Score environnemental</span>
                <span className="text-3xl font-bold text-primary">
                  {product.scores?.environmentScore || 'N/A'}/100
                </span>
              </div>
              <p className="text-gray-900">
                ?valuation bas?e sur l'impact aquatique, la biod?gradabilit? et la composition
              </p>
            </div>
          </div>
        )}
        {/* Section alternatives unifi?e - design Ecolojia v3.1 */}
        <div id="alternatives-section" className="bg-white rounded-none sm:rounded-xl shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-semibold text-neutral-800">Alternatives plus saines</h3>
          </div>

          {loadingAlternatives ? (
            <div className="flex items-center justify-center py-8">
              <Sparkles className="w-6 h-6 animate-spin text-primary" />
              <p className="ml-3 text-neutral-700">Recherche d'alternatives...</p>
            </div>
          ) : alternatives.length > 0 ? (
            <div className="space-y-3">
              {alternatives.slice(0, 5).map((alt) => {
                const scoreImprovement = (alt.scores?.overallScore || 0) - (overallScore || 0);
                return (
                  <div
                    key={alt._id}
                    onClick={() => navigate(`/product/${alt.barcode}`)}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary hover:shadow-md transition-all"
                  >
                    {getProductImage(alt) ? (
                      <img src={getProductImage(alt)} alt={alt.name} className="w-16 h-16 object-contain rounded" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-gray-400 text-xs">Pas d'image</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{alt.name}</h4>
                      {alt.brand && <p className="text-sm text-gray-600">{alt.brand}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-sm font-semibold ${getScoreColor(alt.scores?.overallScore)}`}>
                          {alt.scores?.overallScore}/100
                        </span>
                        {scoreImprovement > 0 && (
                          <span className="text-xs text-green-600 font-medium">
                            +{scoreImprovement} points
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
              <h4 className="font-semibold text-yellow-900 mb-2">Aucune alternative trouv?e</h4>
              <p className="text-sm text-yellow-800 mb-4">
                Notre base de donn?es ne contient pas encore d'alternative pour ce produit.
              </p>
              <p className="text-xs text-yellow-700">
                Recherchez des produits similaires avec labels bio ou ?quitables
              </p>
            </div>
          )}
        </div>
        <ProductChatActions product={product} />

      </div>
      {product && <ChatWidget productContext={{ productName: product.name, category: product.category, barcode: product.barcode, brand: product.brand }} />}
    </div>
  );
};

export default ProductPage;


























