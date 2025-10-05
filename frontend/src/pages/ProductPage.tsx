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
import { useDeviceContext } from '../hooks/useDeviceContext';

const getJSON = async (endpoint: string): Promise<any> => {
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `https://ecolojia-backendvf.onrender.com${endpoint}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
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
}

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isMobile } = useDeviceContext();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<Product[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);

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
        const productData = await getJSON(`/api/products/${id}`);
        setProduct(productData);
        loadAlternatives(id);
      } catch (err: any) {
        console.error('Erreur chargement produit:', err);
        setError(err.message || 'Impossible de charger le produit');
        toast.error('Erreur lors du chargement du produit');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const loadAlternatives = async (productId: string) => {
    try {
      setLoadingAlternatives(true);
      const altData = await getJSON(`/api/products/${productId}/alternatives`);
      setAlternatives(altData.alternatives || altData || []);
    } catch (err) {
      console.error('Alternatives non disponibles:', err);
      setAlternatives([]);
    } finally {
      setLoadingAlternatives(false);
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
          <p className="text-gray-600 mb-6">{error || 'Ce produit n\'existe pas'}</p>
          <Link to="/search" className="bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 inline-block">Rechercher un produit</Link>
        </div>
      </div>
    );
  }

  const healthScore = product.scores?.healthScore || 50;
  const environmentScore = product.scores?.environmentScore || 50;
  const overallScore = Math.round((healthScore + environmentScore) / 2);

  const mockBreakdown = [
    { factor: 'Additifs préoccupants', impact: -10, reason: 'Colorant caramel E150c détecté' },
    { factor: 'Ultra-transformé', impact: -20, reason: 'Produit NOVA groupe 4' },
    { factor: 'Nutri-Score E', impact: -15, reason: 'Trop de sucres et graisses saturées' },
    { factor: 'Huile de palme', impact: -5, reason: 'Impact environnemental négatif' }
  ];

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
            {product.images?.front && <img src={product.images.front} alt={product.name} className="w-32 h-32 object-contain mx-auto mb-4" />}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{product.name}</h2>
              {product.brand && <p className="text-gray-600 mb-4">{product.brand}</p>}
              <div className="inline-flex items-center justify-center bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-2xl p-6">
                <div className="text-center">
                  <div className="text-5xl font-bold">{overallScore}</div>
                  <div className="text-sm opacity-90 mt-1">/ 100</div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 space-y-2">
            <button onClick={() => navigate(`/chat?product=${product.barcode}&q=${encodeURIComponent("Pourquoi ce produit a ce score ?")}`)} className="w-full bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-medium">
              <MessageCircle className="w-5 h-5" />Poser une question IA
            </button>
            <button onClick={() => navigate(`/chat?product=${product.barcode}&q=${encodeURIComponent("Quelles sont les alternatives plus saines ?")}`)} className="w-full border-2 border-green-600 text-green-600 py-3 rounded-lg flex items-center justify-center gap-2 font-medium">
              <Sparkles className="w-5 h-5" />Voir alternatives
            </button>
          </div>
          <details className="bg-white" open>
            <summary className="p-4 font-semibold cursor-pointer border-b">Composition</summary>
            <div className="p-4">{product.ingredients && product.ingredients.length > 0 ? <ProductIngredients ingredients={product.ingredients} /> : <p className="text-gray-500">Non disponible</p>}</div>
          </details>
          <details className="bg-white">
            <summary className="p-4 font-semibold cursor-pointer border-b">Détails du score</summary>
            <div className="p-4"><ScoreBreakdown score={overallScore} factors={mockBreakdown} /></div>
          </details>
          {product.nutrition?.per100g && product.category === 'food' && (
            <details className="bg-white">
              <summary className="p-4 font-semibold cursor-pointer border-b">Valeurs nutritionnelles</summary>
              <div className="p-4"><ProductNutrition nutrition={product.nutrition.per100g} /></div>
            </details>
          )}
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
        <ProductHeader name={product.name} brand={product.brand} barcode={product.barcode} category={product.category} imageFront={product.images?.front} overallScore={overallScore} nutriscore={product.scores?.nutriscore} nova={product.scores?.nova} ecoscore={product.scores?.ecoscore} />
        <ProductScoresCard healthScore={healthScore} environmentScore={environmentScore} />
        <ScoreBreakdown score={overallScore} factors={mockBreakdown} />
        {product.ingredients && product.ingredients.length > 0 && <ProductIngredients ingredients={product.ingredients} />}
        {product.nutrition?.per100g && product.category === 'food' && <ProductNutrition nutrition={product.nutrition.per100g} />}
        <ProductAlternatives alternatives={alternatives} loading={loadingAlternatives} />
      </div>
      {product && <ChatWidget productContext={{ productName: product.name, category: product.category, barcode: product.barcode, brand: product.brand }} />}
    </div>
  );
};

export default ProductPage;
