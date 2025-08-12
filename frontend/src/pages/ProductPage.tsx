// PATH: frontend/src/pages/ProductPage.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import analysisService from '../services/analysisService';
import { useAuth } from '../auth/context/AuthContext';
import { 
  ArrowLeft, 
  Download, 
  Sparkles, 
  Heart, 
  Leaf, 
  Shield,
  AlertTriangle,
  Info,
  Star
} from 'lucide-react';

interface ProductAnalysis {
  productId: string;
  name: string;
  brand?: string;
  category: string;
  barcode?: string;
  healthScore: number;
  environmentScore: number;
  ethicsScore: number;
  overallScore: number;
  novaGroup?: number;
  nutriScore?: string;
  ecoScore?: string;
  ingredients: string[];
  additives: { 
    code: string; 
    name: string; 
    risk: 'low' | 'medium' | 'high'; 
    description?: string 
  }[];
  allergens: string[];
  nutritionalInfo?: any;
  alternatives?: any[];
  sources?: any[];
  lastUpdated: string;
  confidence: number;
}

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [productInfo, setProductInfo] = useState({ 
    name: '', 
    brand: '', 
    category: 'food', 
    ingredients: '', 
    barcode: '' 
  });
  const [scanMethod, setScanMethod] = useState<'barcode' | 'photo' | 'manual' | 'direct'>('direct');
  const [ocrData, setOcrData] = useState<any>(null);

  useEffect(() => {
    const state = location.state as any;
    if (state?.analysis) {
      setAnalysis(state.analysis);
      setScanMethod(state.scanMethod || 'direct');
      setOcrData(state.ocrData || null);
      return;
    }

    const barcode = searchParams.get('barcode');
    const name = searchParams.get('name');
    const ingredients = searchParams.get('ingredients');

    if (barcode || name) {
      setProductInfo({
        name: name || '',
        brand: searchParams.get('brand') || '',
        category: searchParams.get('category') || 'food',
        ingredients: ingredients || '',
        barcode: barcode || '',
      });
      setScanMethod(barcode ? 'barcode' : 'manual');
    }

    if (id && !state?.analysis) {
      loadAnalysis(id);
    }
  }, [id, location.state, searchParams]);

  const loadAnalysis = async (productId: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await analysisService.getAnalysis(productId);
      if (result.success && result.data) {
        setAnalysis(result.data);
      } else {
        throw new Error(result.message || 'Analyse non trouvée');
      }
    } catch (e: any) {
      setError(e.message || "Impossible de charger l'analyse");
    } finally {
      setLoading(false);
    }
  };

  const analyzeProduct = async () => {
    if (!productInfo.name && !productInfo.barcode) {
      setError('Veuillez fournir au moins le nom du produit ou un code-barres');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      let result;
      if (productInfo.barcode) {
        result = await analysisService.analyzeByBarcode(productInfo.barcode);
      } else {
        result = await analysisService.analyzeManual({
          name: productInfo.name,
          brand: productInfo.brand,
          category: productInfo.category,
          ingredients: productInfo.ingredients,
        });
      }
      if (result.success && result.data) {
        setAnalysis(result.data);
        navigate(`/product/${result.data.productId}`, { replace: true });
      } else {
        throw new Error(result.message || 'Analyse échouée');
      }
    } catch (e: any) {
      setError(e.message || "Impossible d'analyser ce produit");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!analysis) return;
    try {
      const response = await analysisService.exportAnalysis(analysis.productId, 'pdf');
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analyse-${analysis.name.replace(/\s+/g, '-')}.pdf`;
      a.click();
    } catch (e) {
      console.error('Export error:', e);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    if (score >= 40) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getNutriScoreColor = (score?: string) => {
    const colors: Record<string, string> = {
      'A': 'bg-green-600',
      'B': 'bg-lime-500',
      'C': 'bg-yellow-500',
      'D': 'bg-orange-500',
      'E': 'bg-red-600'
    };
    return colors[score || ''] || 'bg-gray-400';
  };

  return (
    <div className="min-h-screen bg-[#F7F9F4]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-[#DDE9DA]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center gap-2 text-gray-600 hover:text-[#7DDE4A] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Retour</span>
            </button>
            
            <div className="flex gap-3">
              <button 
                onClick={() => navigate('/scan')} 
                className="px-4 py-2 bg-[#7DDE4A] text-white rounded-lg hover:bg-[#6BC93B] transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Nouvelle analyse
              </button>
              
              {analysis && (
                <button 
                  onClick={handleExportPDF} 
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  disabled={!user || user.tier === 'free'}
                  title={!user || user.tier === 'free' ? 'Premium requis' : 'Exporter en PDF'}
                >
                  <Download className="w-4 h-4" />
                  PDF
                  {(!user || user.tier === 'free') && (
                    <span className="bg-[#FFD700] text-xs px-1.5 py-0.5 rounded-full">PRO</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4">
              <div className="w-full h-full animate-spin rounded-full border-4 border-[#7DDE4A] border-t-transparent"></div>
            </div>
            <div className="text-xl font-semibold text-[#3B3B3B]">Analyse en cours...</div>
            <div className="text-gray-600 mt-2">
              {scanMethod === 'photo' ? "Extraction des données de l'image..." : 'Classification et évaluation scientifique...'}
            </div>
          </div>
        )}

        {/* Error */}
        {error && !analysis && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <div className="text-xl font-bold text-[#3B3B3B]">Erreur d'analyse</div>
            <div className="text-gray-600 mt-2 mb-6">{error}</div>
            <button 
              onClick={() => navigate('/scan')} 
              className="bg-[#7DDE4A] text-white px-6 py-3 rounded-lg hover:bg-[#6BC93B] transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Result */}
        {analysis && !loading && (
          <>
            {/* Scan method indicator */}
            {scanMethod !== 'direct' && (
              <div className="mb-4 flex items-center justify-center">
                <span className="bg-gray-100 px-4 py-2 rounded-full text-sm text-gray-600 flex items-center gap-2">
                  {scanMethod === 'barcode' && 'Ã°Å¸â€œÅ  Scanné par code-barres'}
                  {scanMethod === 'photo' && 'Ã°Å¸â€œÂ¸ Analysé par photo avec IA'}
                  {scanMethod === 'manual' && 'âÅ“ÂïÂ¸Â Saisi manuellement'}
                </span>
              </div>
            )}

            {/* Main Product Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-[#3B3B3B]">{analysis.name}</h1>
                  {analysis.brand && (
                    <div className="text-xl text-gray-600 mt-1">{analysis.brand}</div>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                      {analysis.category === 'food' ? 'Ã°Å¸ÂÅ½ Alimentaire' : 
                       analysis.category === 'cosmetic' ? 'Ã°Å¸â€™â€ž Cosmétique' : 
                       'Ã°Å¸Â§Â¼ Ménager'}
                    </span>
                    {analysis.barcode && (
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-mono">
                        {analysis.barcode}
                      </span>
                    )}
                  </div>
                </div>

                {/* Overall Score */}
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                    {Math.round(analysis.overallScore)}
                  </div>
                  <div className="text-gray-500 text-sm mt-1">Score global</div>
                  <div className="mt-3 flex gap-2">
                    {analysis.nutriScore && (
                      <span className={`px-3 py-1 text-white rounded-lg font-bold text-sm ${getNutriScoreColor(analysis.nutriScore)}`}>
                        Nutri-Score {analysis.nutriScore}
                      </span>
                    )}
                    {analysis.novaGroup && (
                      <span className="px-3 py-1 bg-gray-600 text-white rounded-lg font-bold text-sm">
                        NOVA {analysis.novaGroup}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Score Details */}
              <div className="grid md:grid-cols-3 gap-4 mt-8">
                <div className={`p-4 rounded-lg border ${getScoreBgColor(analysis.healthScore)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      <span className="font-medium text-gray-700">Santé</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(analysis.healthScore)}`}>
                      {analysis.healthScore}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Impact sur votre santé
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${getScoreBgColor(analysis.environmentScore)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Leaf className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-gray-700">Environnement</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(analysis.environmentScore)}`}>
                      {analysis.environmentScore}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Empreinte écologique
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${getScoreBgColor(analysis.ethicsScore)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-700">Ãƒâ€°thique</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(analysis.ethicsScore)}`}>
                      {analysis.ethicsScore}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Responsabilité sociale
                  </div>
                </div>
              </div>
            </div>

            {/* Ingredients */}
            {analysis.ingredients && analysis.ingredients.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold text-[#3B3B3B] mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Composition
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Ingrédients</h3>
                    <p className="text-gray-600">
                      {analysis.ingredients.join(', ')}
                    </p>
                  </div>

                  {/* Additives */}
                  {analysis.additives && analysis.additives.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">Additifs détectés</h3>
                      <div className="space-y-2">
                        {analysis.additives.map((additive, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              additive.risk === 'high' ? 'bg-red-100 text-red-700' :
                              additive.risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {additive.code}
                            </span>
                            <span className="text-gray-600">{additive.name}</span>
                            {additive.risk === 'high' && (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Allergens */}
                  {analysis.allergens && analysis.allergens.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">Allergènes</h3>
                      <div className="flex flex-wrap gap-2">
                        {analysis.allergens.map((allergen, index) => (
                          <span key={index} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                            {allergen}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Alternatives */}
            {analysis.alternatives && analysis.alternatives.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold text-[#3B3B3B] mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Alternatives recommandées
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {analysis.alternatives.slice(0, 4).map((alt: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg hover:border-[#7DDE4A] transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{alt.name}</h3>
                        <span className={`font-bold ${getScoreColor(alt.score)}`}>
                          {alt.score}/100
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{alt.brand}</p>
                      <p className="text-xs text-green-600 mt-2">{alt.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* OCR Debug (dev only) */}
            {ocrData && import.meta.env.DEV && (
              <div className="mt-6 bg-gray-100 p-4 rounded-lg">
                <div className="font-medium mb-2">Données OCR extraites (debug)</div>
                <pre className="text-xs overflow-auto bg-white p-2 rounded">
                  {JSON.stringify(ocrData, null, 2)}
                </pre>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductPage;
