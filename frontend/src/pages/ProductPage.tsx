import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Leaf, AlertTriangle, Package, Info, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { ChatWidget } from '../components/chat/ChatWidget';
import HealthScoreCircle from '../components/HealthScoreCircle';

const getJSON = async (endpoint: string): Promise<any> => {
  const url = endpoint.startsWith('http') ? endpoint : `https://ecolojia-backendvf.onrender.com${endpoint}`;
  const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include' });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  return response.json();
};

interface Product {
  _id: string; name: string; name_fr?: string; name_en?: string; brand: string; barcode?: string;
  category: 'food' | 'cosmetics' | 'detergents';
  images?: { front?: string; ingredients?: string; nutrition?: string; };
  scores?: { nova?: number; nutriscore?: string; ecoscore?: string; healthScore?: number; environmentScore?: number; };
  ingredients?: Array<{ name: string; percentage?: number; isAllergen: boolean; concerns: string[]; }>;
  allergens?: string[];
  nutrition?: { per100g: { energy: number; fat: number; saturatedFat: number; carbohydrates: number; sugars: number; protein: number; salt: number; fiber?: number; }; };
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
      if (!id || id === 'undefined') { setError('ID produit manquant'); setLoading(false); return; }
      try {
        setLoading(true); setError(null);
        const productData = await getJSON(`/api/products/${id}`);
        setProduct(productData);
        loadAlternatives(id, productData);
      } catch (err: any) {
        console.error('Erreur:', err);
        setError(err.message || 'Impossible de charger');
        toast.error('Erreur chargement');
      } finally { setLoading(false); }
    };
    fetchProduct();
  }, [id]);

  const loadAlternatives = async (productId: string, currentProduct: Product) => {
    try {
      setLoadingAlternatives(true);
      const altData = await getJSON(`/api/products/${productId}/alternatives`);
      setAlternatives(altData.alternatives || altData || []);
    } catch { setAlternatives([]); } finally { setLoadingAlternatives(false); }
  };

  const getScoreColor = (score: number) => score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : score >= 40 ? 'text-orange-600' : 'text-red-600';
  const getScoreBgColor = (score: number) => score >= 80 ? 'bg-green-50 border-green-200' : score >= 60 ? 'bg-yellow-50 border-yellow-200' : score >= 40 ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200';
  const getNutriScoreColor = (score?: string) => ({ 'A': 'bg-green-600', 'B': 'bg-lime-500', 'C': 'bg-yellow-500', 'D': 'bg-orange-500', 'E': 'bg-red-600' }[score || ''] || 'bg-gray-400');
  const getCategoryIcon = (category: string) => category === 'food' ? '🍎' : category === 'cosmetics' ? '💄' : '🧽';

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><LoadingSpinner size="large" /><p className="mt-4 text-gray-600">Chargement...</p></div></div>;
  if (error || !product) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center"><AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" /><h2 className="text-2xl font-bold mb-2">Produit introuvable</h2><p className="text-gray-600 mb-6">{error || 'Non trouvé'}</p><Link to="/search" className="bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 inline-block">Rechercher</Link></div></div>;

  const healthScore = product.scores?.healthScore || 50;
  const environmentScore = product.scores?.environmentScore || 50;
  const overallScore = Math.round((healthScore + environmentScore) / 2);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b"><div className="max-w-7xl mx-auto px-4 py-4"><button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900"><ArrowLeft className="w-5 h-5 mr-2" />Retour</button></div></div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              {product.images?.front ? <img src={product.images.front} alt={product.name} className="w-full h-64 object-contain rounded-lg bg-gray-50" /> : <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center"><Package className="w-24 h-24 text-gray-300" /></div>}
              {product.barcode && <div className="mt-4 text-center"><p className="text-sm text-gray-500">Code-barres</p><p className="font-mono text-lg">{product.barcode}</p></div>}
            </div>
            <div className="md:col-span-2">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">{product.name}</h1>
                  <p className="text-xl text-gray-600 mt-1">{product.brand}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-sm">{getCategoryIcon(product.category)} {product.category === 'food' ? 'Alimentaire' : product.category === 'cosmetics' ? 'Cosmétique' : 'Détergent'}</span>
                  </div>
                </div>
                <HealthScoreCircle score={overallScore} size="large" showLabel={true} animated={true} />
              </div>
              <div className="flex flex-wrap gap-3 mb-6">
                {product.scores?.nutriscore && <span className={`px-4 py-2 text-white rounded-lg font-bold ${getNutriScoreColor(product.scores.nutriscore)}`}>Nutri-Score {product.scores.nutriscore}</span>}
                {product.scores?.nova && <span className="px-4 py-2 bg-gray-600 text-white rounded-lg font-bold">NOVA {product.scores.nova}</span>}
                {product.scores?.ecoscore && <span className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold">Eco-Score {product.scores.ecoscore}</span>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg border ${getScoreBgColor(healthScore)}`}><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Heart className="w-5 h-5 text-red-500" /><span className="font-medium">Santé</span></div><span className={`text-2xl font-bold ${getScoreColor(healthScore)}`}>{healthScore}</span></div><p className="text-sm text-gray-600 mt-1">Impact santé</p></div>
                <div className={`p-4 rounded-lg border ${getScoreBgColor(environmentScore)}`}><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Leaf className="w-5 h-5 text-green-600" /><span className="font-medium">Environnement</span></div><span className={`text-2xl font-bold ${getScoreColor(environmentScore)}`}>{environmentScore}</span></div><p className="text-sm text-gray-600 mt-1">Empreinte écologique</p></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center"><Info className="w-5 h-5 mr-2" />Pourquoi ce score ?</h2>
          <div className="space-y-3">
            {[{ label: "Additifs", impact: -10, reason: "Colorants artificiels détectés" }, { label: "Ultra-transformé", impact: -20, reason: "Produit NOVA groupe 4" }, { label: "Nutri-Score faible", impact: -15, reason: "Qualité nutritionnelle médiocre" }].map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1"><p className="font-medium">{f.label}</p><p className="text-sm text-gray-600">{f.reason}</p></div>
                <span className="font-bold text-red-600">{f.impact}</span>
              </div>
            ))}
          </div>
        </div>

        {product.ingredients && product.ingredients.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center"><Info className="w-5 h-5 mr-2" />Ingrédients</h2>
            <div className="space-y-2">
              {product.ingredients.map((ingredient, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${ingredient.isAllergen ? 'bg-red-50 border border-red-200' : ingredient.concerns.length > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{ingredient.name}</span>
                    {ingredient.percentage && <span className="text-sm text-gray-500">({ingredient.percentage}%)</span>}
                    {ingredient.isAllergen && <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">Allergène</span>}
                  </div>
                  {ingredient.concerns.length > 0 && <span className="text-sm text-orange-600">⚠️ {ingredient.concerns.join(', ')}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {product.nutrition?.per100g && product.category === 'food' && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Valeurs nutritionnelles (pour 100g)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-2xl font-bold text-gray-800">{product.nutrition.per100g.energy}</p><p className="text-sm text-gray-600">kcal</p></div>
              <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-2xl font-bold text-gray-800">{product.nutrition.per100g.protein}g</p><p className="text-sm text-gray-600">Protéines</p></div>
              <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-2xl font-bold text-gray-800">{product.nutrition.per100g.carbohydrates}g</p><p className="text-sm text-gray-600">Glucides</p></div>
              <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-2xl font-bold text-gray-800">{product.nutrition.per100g.fat}g</p><p className="text-sm text-gray-600">Lipides</p></div>
            </div>
            <div className="mt-6 space-y-4">
              {[
                { label: 'Sucres', value: product.nutrition.per100g.sugars, max: 25, level: product.nutrition.per100g.sugars > 25 ? 'high' : 'moderate' },
                { label: 'Sel', value: product.nutrition.per100g.salt, max: 1, level: product.nutrition.per100g.salt > 1 ? 'high' : 'moderate' },
                { label: 'Graisses saturées', value: product.nutrition.per100g.saturatedFat, max: 5, level: product.nutrition.per100g.saturatedFat > 5 ? 'high' : 'moderate' }
              ].map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm"><span className="font-medium">{item.label}</span><span className="font-bold">{item.value} g/100g</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${item.level === 'high' ? 'bg-red-500' : 'bg-orange-500'} transition-all duration-500`} style={{ width: `${Math.min((item.value / item.max) * 100, 100)}%` }} /></div>
                  <p className="text-xs text-gray-500">{item.level === 'high' ? 'Élevé' : 'Modéré'} • Recommandé: &lt;{item.max}g/100g</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {alternatives.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Alternatives recommandées</h2>
            {loadingAlternatives ? <div className="text-center py-8"><LoadingSpinner /><p className="mt-2 text-gray-600">Recherche...</p></div> : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {alternatives.slice(0, 6).map((alt) => {
                  const altHealthScore = alt.scores?.healthScore || 50;
                  const altEnvironmentScore = alt.scores?.environmentScore || 50;
                  const altOverallScore = Math.round((altHealthScore + altEnvironmentScore) / 2);
                  return (
                    <Link key={alt._id} to={`/product/${alt._id}`} className="block p-4 border border-gray-200 rounded-lg hover:border-green-500 transition-colors">
                      <div className="flex justify-between items-start mb-2"><h3 className="font-medium text-gray-800">{alt.name}</h3><span className={`font-bold ${getScoreColor(altOverallScore)}`}>{altOverallScore}</span></div>
                      <p className="text-sm text-gray-600">{alt.brand}</p>
                      <div className="flex gap-2 mt-2">
                        {alt.scores?.nutriscore && <span className={`px-2 py-1 text-white rounded text-xs ${getNutriScoreColor(alt.scores.nutriscore)}`}>{alt.scores.nutriscore}</span>}
                        {alt.scores?.nova && <span className="px-2 py-1 bg-gray-600 text-white rounded text-xs">N{alt.scores.nova}</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      {product && <ChatWidget productContext={{ productName: product.name || product.name_fr || 'Produit', category: product.category || 'food', barcode: product.barcode, brand: product.brand }} />}
    </div>
  );
};

export default ProductPage;
