import { getScoreColor, getScoreBgColor } from '@/utils/scoreColors';
import { ScoreProgressBar } from '../components/ScoreProgressBar';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, MessageCircle, Sparkles, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { ChatWidget } from '../components/chat/ChatWidget';
import { ProductHeader } from '../components/product/ProductHeader';
import { ProductScoresCard } from '../components/product/ProductScoresCard';
import { ScoreBreakdown } from '../components/product/ScoreBreakdown';
import { ProductIngredients } from '../components/product/ProductIngredients';
import { ProductNutrition } from '../components/product/ProductNutrition';
import { ProductAlternatives } from '../components/product/ProductAlternatives';
import { CosmeticAnalysisDisplay } from '../components/analysis/CosmeticAnalysisDisplay';
import { ProductIngredientsSection } from '../components/product/ProductIngredientsSection';
import { AllergensSection } from '../components/product/AllergensSection';
import { LabelsSection } from '../components/product/LabelsSection';
import { ProductChatActions } from '../components/product/ProductChatActions';
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

  // CORRECTION 2 : useEffect g?re maintenant les erreurs 400/404
  useEffect(() => {
    const fetchProduct = async () => {
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
          setError(`?? ${result.data.error || 'Type de produit non support?'}`);
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
        loadAlternatives(id);
        
      } catch (err: any) {
        console.error('Erreur chargement produit:', err);
        setError('? Erreur r?seau - V?rifiez votre connexion');
        toast.error('Erreur r?seau');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);

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
    if (isAnalyzing) return; // Guard anti-spam
    if (!product?.barcode || isAnalyzing) return;
    const cleanBarcode = product.barcode.replace(/_\d+$/, '');
    setIsAnalyzing(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:10000'}/api/ocr-analyze/${cleanBarcode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const result = await response.json();
        setProduct(result.product || result);
      }
    } catch (error) {
      console.error('Erreur analyse:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Produit introuvable</h2>
          <p className="text-gray-600 mb-6 whitespace-pre-wrap">{error || 'Ce produit n\'existe pas'}</p>
          <div className="space-y-3">
            <Link to="/search" className="bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary inline-block">
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
  const healthScore = product.scores?.healthScore || 0;
  const environmentScore = product.scores?.environmentScore || 0;
  // D?tection si le score a ?t? calcul? (ne pas afficher 0 par d?faut)
  const hasCalculatedScore = product.scores?.overallScore !== null && product.scores?.overallScore !== undefined;
  const overallScore = hasCalculatedScore ? product.scores.overallScore : null;

  // Breakdown r?el depuis l'API
  const breakdown = product.scores?.breakdown || {};
  const realBreakdown = [
    breakdown.nova && { 
      factor: 'Transformation (NOVA)', 
      impact: breakdown.nova.score - 50, 
      reason: `Score NOVA: ${breakdown.nova.score}/100` 
    },
    breakdown.nutriscore && { 
      factor: 'Nutri-Score', 
      impact: breakdown.nutriscore.score - 50, 
      reason: `Score nutritionnel: ${breakdown.nutriscore.score}/100` 
    },
    breakdown.additives && { 
      factor: 'Additifs', 
      impact: breakdown.additives.score - 50, 
      reason: `Score additifs: ${breakdown.additives.score}/100` 
    },
    breakdown.ecoscore && { 
      factor: '?co-Score', 
      impact: breakdown.ecoscore.score - 50, 
      reason: `Impact environnemental: ${breakdown.ecoscore.score}/100` 
    },
    breakdown.packaging && { 
      factor: 'Emballage', 
      impact: breakdown.packaging.score - 50, 
      reason: `Score emballage: ${breakdown.packaging.score}/100` 
    },
    breakdown.origin && { 
      factor: 'Origine', 
      impact: breakdown.origin.score - 50, 
      reason: `Score origine: ${breakdown.origin.score}/100` 
    },
    breakdown.ethics && { 
      factor: '?thique', 
      impact: breakdown.ethics.score - 50, 
      reason: `Score ?thique: ${breakdown.ethics.score}/100` 
    }
  ].filter(Boolean);

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold truncate">{product.name}</h1>
        </div>
        <div className="space-y-2">
          <div className="bg-white p-6">
            {getProductImage(product) && <img src={getProductImage(product)} alt={product.name} className="w-32 h-32 object-contain mx-auto mb-4" />}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{product.name}</h2>
              {product.brand && <p className="text-gray-600 mb-4">{product.brand}</p>}
              <div className="inline-flex items-center justify-center bg-white text-white rounded-2xl p-6">
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}</div>
                  <div className="text-sm opacity-90 mt-1">/ 100</div>
                </div>
              </div>
              <ScoreProgressBar score={overallScore} onRequestScore={handleRequestScore} isAnalyzing={isAnalyzing} />
              {product.category === 'food' && product.foodData?.novaGroup && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">?? Classification NOVA</h2>
                  <NovaBadge 
                    novaGroup={product.foodData.novaGroup} 
                    typeTransformation={product.typeTransformation}
                    showDetails={true}
                  />
                </div>
              )}
              {product.category === 'food' && product.foodData?.allergens && product.foodData.allergens.length > 0 && (
                <div className="bg-white p-4">
                  <AllergensSection allergens={product.foodData.allergens} />
                </div>
              )}
              {product.category === 'food' && product.foodData?.labels && product.foodData.labels.length > 0 && (
                <div className="bg-white p-4">
                  <LabelsSection labels={product.foodData.labels} />
                </div>
              )}
            </div>
          </div>
          <div className="bg-white p-4 space-y-2">
            <button onClick={() => navigate(`/chat?product=${product.barcode}&q=${encodeURIComponent("Pourquoi ce produit a ce score ?")}`)} className="w-full bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-medium">
              <MessageCircle className="w-5 h-5" />Poser une question IA
            </button>
            <button onClick={() => { const el = document.getElementById("alternatives-section"); if (el) el.scrollIntoView({ behavior: "smooth" }); }} className="w-full border-2 border-primary text-primary py-3 rounded-lg flex items-center justify-center gap-2 font-medium">
              <Sparkles className="w-5 h-5" />Voir alternatives
            </button>
          </div>
          <details className="bg-white" open>
            <summary className="p-4 font-semibold cursor-pointer border-b">Composition</summary>
            <div className="p-4">{product.foodData?.ingredients ? <div className="text-sm text-gray-700 whitespace-pre-wrap">{product.foodData.ingredients}</div> : <p className="text-gray-500">Non disponible</p>}</div>
          </details>
          <details className="bg-white" open>
            <summary className="p-4 font-semibold cursor-pointer border-b">Détails du score</summary>
            <div className="p-4"><ScoreBreakdown score={overallScore} factors={realBreakdown} productScores={product.scores} product={product} /></div>
          </details>
          {product.foodData?.nutrition?.per100g && product.category === 'food' && (
            <details className="bg-white" open>
              <summary className="p-4 font-semibold cursor-pointer border-b">Valeurs nutritionnelles</summary>
              <div className="p-4"><ProductNutrition nutrition={product.foodData.nutrition.per100g} /></div>
            </details>
          )}
          {product.category === 'cosmetics' && (
            <details className="bg-white" open>
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
            <details className="bg-white" open>
              <summary className="p-4 font-semibold cursor-pointer border-b">Analyse D?tergent</summary>
              <div className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Score environnemental</span>
                    <span className="text-2xl font-bold text-primary">
                      {product.scores?.environmentScore || 'N/A'}/100
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Impact aquatique, biod?gradabilit? et composition ?valu?s
                  </p>
                </div>
              </div>
            </details>
          )}
          <div id="alternatives-section" className="bg-white p-4">
            <h3 className="font-semibold text-lg mb-3">Alternatives recommandées</h3>
            {loadingAlternatives ? (
              <p className="text-gray-500">Chargement...</p>
            ) : alternatives.length > 0 ? (
              <div className="space-y-3">
                {alternatives.slice(0, 5).map(alt => (
                  <div key={alt._id} onClick={() => navigate(`/product/${alt.barcode}`)} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    {getProductImage(alt) && <img src={getProductImage(alt)} alt={alt.name} className="w-12 h-12 object-contain" />}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{alt.name}</p>
                      <p className="text-xs text-gray-500">{alt.brand}</p>
                    </div>
                    <div className={`text-lg font-bold ${getScoreColor(alt.scores?.overallScore || 0)}`}>{alt.scores?.overallScore || 0}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Aucune alternative disponible</p>
            )}
          </div>
        </div>
        {product && <ChatWidget productContext={{ productName: product.name, category: product.category, barcode: product.barcode, brand: product.brand }} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-2" />Retour
          </button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ProductHeader name={product.name} brand={product.brand} barcode={product.barcode} category={product.category} imageFront={getProductImage(product)} overallScore={overallScore} nutriscore={product.scores?.nutriscore} nova={product.scores?.nova} ecoscore={product.scores?.ecoscore} />
        <ScoreProgressBar score={overallScore} onRequestScore={handleRequestScore} isAnalyzing={isAnalyzing} />
        {product.category === 'food' && product.foodData?.novaGroup && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">?? Classification NOVA</h2>
            <NovaBadge 
              novaGroup={product.foodData.novaGroup} 
              typeTransformation={product.typeTransformation}
              showDetails={true}
            />
          </div>
        )}
        {product.category === 'food' && product.foodData?.allergens && product.foodData.allergens.length > 0 && (
          <div className="bg-white p-4">
            <AllergensSection allergens={product.foodData.allergens} />
          </div>
        )}
        {product.category === 'food' && product.foodData?.labels && product.foodData.labels.length > 0 && (
          <div className="bg-white p-4">
            <LabelsSection labels={product.foodData.labels} />
          </div>
        )}
        <ProductScoresCard healthScore={healthScore} environmentScore={environmentScore} />
        <ScoreBreakdown score={overallScore} factors={realBreakdown} productScores={product.scores} product={product} />
        {product.foodData?.ingredients && (<div className="bg-white rounded-xl shadow-sm p-6 mb-6"><h2 className="text-xl font-semibold text-gray-800 mb-4">Composition</h2><div className="text-gray-700 whitespace-pre-wrap">{product.foodData.ingredients}</div></div>)}
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
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Analyse D?tergent</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <span className="text-gray-700 font-medium">Score environnemental</span>
                <span className="text-3xl font-bold text-primary">
                  {product.scores?.environmentScore || 'N/A'}/100
                </span>
              </div>
              <p className="text-gray-600">
                ?valuation bas?e sur l'impact aquatique, la biod?gradabilit? et la composition
              </p>
            </div>
          </div>
        )}
        <ProductChatActions product={product} />
        <ProductAlternatives alternatives={alternatives} loading={loadingAlternatives} />
      </div>
      {product && <ChatWidget productContext={{ productName: product.name, category: product.category, barcode: product.barcode, brand: product.brand }} />}
    </div>
  );
};

export default ProductPage;
