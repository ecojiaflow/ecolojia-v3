import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { ChatWidget } from '../components/chat/ChatWidget';
import { ProductHeader } from '../components/product/ProductHeader';
import { ProductScoresCard } from '../components/product/ProductScoresCard';
import { ScoreBreakdown } from '../components/product/ScoreBreakdown';
import { ProductIngredients } from '../components/product/ProductIngredients';
import { ProductNutrition } from '../components/product/ProductNutrition';
import { ProductAlternatives } from '../components/product/ProductAlternatives';

// Helper pour API calls
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
  name_fr?: string;
  name_en?: string;
  brand: string;
  barcode?: string;
  category: 'food' | 'cosmetics' | 'detergents';
  images?: {
    front?: string;
    ingredients?: string;
    nutrition?: string;
  };
  scores?: {
    nova?: number;
    nutriscore?: string;
    ecoscore?: string;
    healthScore?: number;
    environmentScore?: number;
  };
  ingredients?: Array<{
    name: string;
    percentage?: number;
    isAllergen: boolean;
    concerns: string[];
  }>;
  nutrition?: {
    per100g: {
      energy: number;
      fat: number;
      saturatedFat: number;
      carbohydrates: number;
      sugars: number;
      protein: number;
      salt: number;
      fiber?: number;
    };
  };
}

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  // Loading state
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

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Produit introuvable</h2>
          <p className="text-gray-600 mb-6">{error || 'Ce produit n\'existe pas'}</p>
          <Link
            to="/search"
            className="bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 inline-block"
          >
            Rechercher un produit
          </Link>
        </div>
      </div>
    );
  }

  // Calcul scores avec valeurs par défaut
  const healthScore = product.scores?.healthScore || 50;
  const environmentScore = product.scores?.environmentScore || 50;
  const overallScore = Math.round((healthScore + environmentScore) / 2);

  // Mock breakdown (en attendant backend amélioré)
  const mockBreakdown = [
    { factor: 'Additifs préoccupants', impact: -10, reason: 'Colorant caramel E150c détecté' },
    { factor: 'Ultra-transformé', impact: -20, reason: 'Produit NOVA groupe 4' },
    { factor: 'Nutri-Score E', impact: -15, reason: 'Trop de sucres et graisses saturées' },
    { factor: 'Huile de palme', impact: -5, reason: 'Impact environnemental négatif' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header with image, name, badges */}
        <ProductHeader
          name={product.name}
          brand={product.brand}
          barcode={product.barcode}
          category={product.category}
          imageFront={product.images?.front}
          overallScore={overallScore}
          nutriscore={product.scores?.nutriscore}
          nova={product.scores?.nova}
          ecoscore={product.scores?.ecoscore}
        />

        {/* Score cards (Health + Environment) */}
        <ProductScoresCard
          healthScore={healthScore}
          environmentScore={environmentScore}
        />

        {/* Score Breakdown - Explications détaillées */}
        <ScoreBreakdown
          score={overallScore}
          factors={mockBreakdown}
        />

        {/* Ingredients section */}
        {product.ingredients && product.ingredients.length > 0 && (
          <ProductIngredients ingredients={product.ingredients} />
        )}

        {/* Nutrition section (food only) */}
        {product.nutrition?.per100g && product.category === 'food' && (
          <ProductNutrition nutrition={product.nutrition.per100g} />
        )}

        {/* Alternatives */}
        <ProductAlternatives
          alternatives={alternatives}
          loading={loadingAlternatives}
        />
      </div>

      {/* Chat Assistant IA */}
      {product && (
        <ChatWidget
          productContext={{
            productName: product.name || product.name_fr || 'Produit',
            category: product.category || 'food',
            barcode: product.barcode,
            brand: product.brand
          }}
        />
      )}
    </div>
  );
};

export default ProductPage;