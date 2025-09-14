// PATH: frontend/src/pages/ResultsPage.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, AlertCircle, Loader, ChevronLeft, Heart, Share2, 
  TrendingUp, Leaf, Shield, AlertTriangle, CheckCircle, 
  XCircle, Info, ShoppingCart, MessageCircle, BarChart3 
} from 'lucide-react';
import { productService, analysisService } from '../services/api';
import quotaService from '../services/quotaService';
import chatService from '../services/chatService';
import { useAuthContext } from '../Contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface AnalysisResult {
  productId: string;
  product: {
    _id: string;
    name: string;
    brand: string;
    category: 'food' | 'cosmetic' | 'detergent';
    images?: {
      front?: string;
    };
    barcode?: string;
  };
  scores: {
    healthScore: number;
    environmentScore: number;
    socialScore: number;
    nova?: number;
    nutriscore?: string;
    ecoscore?: string;
  };
  analysis: {
    summary: string;
    healthImpact: {
      score: number;
      analysis: string;
      concerns: string[];
      benefits: string[];
    };
    environmentImpact: {
      score: number;
      analysis: string;
      carbonFootprint?: number;
      packaging?: string;
    };
    ingredients?: {
      total: number;
      recognized: number;
      problematic: string[];
      allergens: string[];
    };
    additives?: {
      total: number;
      problematic: Array<{
        code: string;
        name: string;
        riskLevel: string;
        description?: string;
      }>;
    };
  };
  recommendations: string[];
  alternatives?: Array<{
    productId: string;
    name: string;
    brand: string;
    score: number;
    reason: string;
  }>;
}

// Données mockées pour le mode demo
const MOCK_ANALYSIS: AnalysisResult = {
  productId: 'mock-product-1',
  product: {
    _id: 'mock-product-1',
    name: 'Nutella',
    brand: 'Ferrero',
    category: 'food',
    barcode: '3017620422003',
    images: {
      front: 'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_fr.415.400.jpg'
    }
  },
  scores: {
    healthScore: 32,
    environmentScore: 45,
    socialScore: 60,
    nova: 4,
    nutriscore: 'E',
    ecoscore: 'D'
  },
  analysis: {
    summary: 'Ce produit est ultra-transformé avec un profil nutritionnel déséquilibré. Il contient beaucoup de sucre et de graisses saturées.',
    healthImpact: {
      score: 32,
      analysis: 'Impact négatif sur la santé en raison de sa haute teneur en sucre (56%) et graisses saturées. À consommer occasionnellement.',
      concerns: [
        'Très haute teneur en sucre (56%)',
        'Riche en graisses saturées',
        'Produit ultra-transformé (NOVA 4)',
        'Contient de l\'huile de palme'
      ],
      benefits: [
        'Source de noisettes (13%)',
        'Apport en énergie'
      ]
    },
    environmentImpact: {
      score: 45,
      analysis: 'Impact environnemental élevé principalement dû à l\'huile de palme et au cacao.',
      carbonFootprint: 3.2,
      packaging: 'Pot en verre recyclable, couvercle en plastique'
    },
    ingredients: {
      total: 7,
      recognized: 7,
      problematic: ['Huile de palme', 'Sucre'],
      allergens: ['Noisettes', 'Lait']
    },
    additives: {
      total: 2,
      problematic: [
        {
          code: 'E322',
          name: 'Lécithine de soja',
          riskLevel: 'low',
          description: 'Émulsifiant généralement sans danger'
        }
      ]
    }
  },
  recommendations: [
    'Limitez la consommation à 1-2 portions par semaine',
    'Privilégiez des pâtes à tartiner avec moins de sucre',
    'Essayez des alternatives maison ou bio',
    'Accompagnez de fruits pour équilibrer'
  ],
  alternatives: [
    {
      productId: 'alt-1',
      name: 'Pâte à tartiner bio sans huile de palme',
      brand: 'Nocciolata',
      score: 65,
      reason: 'Sans huile de palme, moins de sucre, bio'
    },
    {
      productId: 'alt-2',
      name: 'Purée de noisettes 100%',
      brand: 'Jean Hervé',
      score: 88,
      reason: '100% noisettes, sans sucre ajouté, NOVA 1'
    }
  ]
};

const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthContext();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [quotas, setQuotas] = useState(quotaService.getQuotas());

  const barcode = searchParams.get('barcode');
  const productId = searchParams.get('productId');
  const method = searchParams.get('method') || 'search';

  useEffect(() => {
    if (barcode || productId) {
      fetchAnalysis();
    } else {
      setError('Aucun produit spécifié');
      setLoading(false);
    }
  }, [barcode, productId]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      // Vérifier le quota si pas en mode mock
      if (!MOCK_MODE && !quotaService.canScan()) {
        toast.error('Quota de scans épuisé pour ce mois');
        navigate('/premium');
        return;
      }

      let result: AnalysisResult;

      if (false) {
        // Mode mock : utiliser les données mockées
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simuler délai
        result = MOCK_ANALYSIS;
      } else {
        // Mode production : appeler l'API
        if (barcode) {
          result = await analysisService.analyzeByBarcode(barcode);
        } else if (productId) {
          result = await analysisService.analyzeByProduct({ _id: productId, category: "food" });
        } else {
          throw new Error('Aucun identifiant produit fourni');
        }

        // Consommer le quota après analyse réussie
        await quotaService.consumeScan();
        setQuotas(quotaService.getQuotas());
      }

      setAnalysis(result);

      // Initialiser le contexte du chat avec les données du produit
      chatService.updateContext({
        productId: result.product._id,
        productName: result.product.name,
        productType: result.product.category,
        scores: result.scores,
        additives: result.analysis.additives?.problematic || []
      });

      // Sauvegarder dans l'historique local
      saveToHistory(result);

    } catch (error: any) {
      console.error('Erreur analyse:', error);
      setError(error.message || 'Erreur lors de l\'analyse du produit');
      toast.error('Erreur lors de l\'analyse du produit');
    } finally {
      setLoading(false);
    }
  };

  const saveToHistory = (result: AnalysisResult) => {
    try {
      const historyKey = 'ecolojia_scan_history';
      const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
      
      const newEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        product: result.product,
        scores: result.scores,
        method: method
      };

      // Limiter l'historique à 50 entrées
      const updatedHistory = [newEntry, ...existingHistory].slice(0, 50);
      localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Erreur sauvegarde historique:', error);
    }
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris');
  };

  const handleShare = async () => {
    if (navigator.share && analysis) {
      try {
        await navigator.share({
          title: `Analyse ECOLOJIA - ${analysis.product.name}`,
          text: `Score santé: ${analysis.scores.healthScore}/100. ${analysis.analysis.summary}`,
          url: window.location.href
        });
      } catch (error) {
        setShowShareModal(true);
      }
    } else {
      setShowShareModal(true);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
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

  const getNovaColor = (nova?: number) => {
    if (!nova) return 'bg-gray-400';
    if (nova === 1) return 'bg-green-600';
    if (nova === 2) return 'bg-yellow-500';
    if (nova === 3) return 'bg-orange-500';
    return 'bg-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Analyse en cours...</p>
          <p className="text-sm text-gray-500 mt-2">Notre IA analyse le produit pour vous</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur d'analyse</h2>
          <p className="text-gray-600 mb-6">{error || 'Produit non trouvé'}</p>
          <button
            onClick={() => navigate('/search')}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
          >
            Nouvelle recherche
          </button>
        </div>
      </div>
    );
  }

  const { product, scores, analysis: productAnalysis, recommendations, alternatives } = analysis;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec navigation */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ChevronLeft className="h-5 w-5" />
              Retour
            </button>
            
            <div className="flex items-center gap-4">
              {!MOCK_MODE && (
                <span className="text-sm text-gray-500">
                  Scans : <strong>{quotaService.getQuotaDisplay('scans')}</strong>
                </span>
              )}
              <button
                onClick={handleToggleFavorite}
                className={`p-2 rounded-lg transition-colors ${
                  isFavorite ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Info produit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-md p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              {product.images?.front ? (
                <img
                  src={product.images.front}
                  alt={product.name}
                  className="w-full rounded-lg"
                />
              ) : (
                <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package className="h-24 w-24 text-gray-300" />
                </div>
              )}
            </div>
            
            <div className="md:w-2/3">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
              <p className="text-xl text-gray-600 mb-4">{product.brand}</p>
              
              {/* Badges scores */}
              <div className="flex flex-wrap gap-4 mb-6">
                {scores.nova && (
                  <div className="text-center">
                    <div className={`inline-block px-4 py-2 rounded-lg text-white font-bold ${getNovaColor(scores.nova)}`}>
                      NOVA {scores.nova}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Transformation</p>
                  </div>
                )}
                
                {scores.nutriscore && (
                  <div className="text-center">
                    <div className={`inline-block px-4 py-2 rounded-lg text-white font-bold ${getNutriScoreColor(scores.nutriscore)}`}>
                      {scores.nutriscore}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Nutri-Score</p>
                  </div>
                )}
                
                {scores.ecoscore && (
                  <div className="text-center">
                    <div className={`inline-block px-4 py-2 rounded-lg text-white font-bold ${getNutriScoreColor(scores.ecoscore)}`}>
                      {scores.ecoscore}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Éco-Score</p>
                  </div>
                )}
              </div>
              
              {/* Résumé */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">{productAnalysis.summary}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Scores détaillés */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Score santé */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Score Santé</h3>
              <Shield className="h-6 w-6 text-blue-500" />
            </div>
            <div className={`text-4xl font-bold mb-2 ${scores.healthScore >= 60 ? 'text-green-600' : 'text-red-600'}`}>
              {scores.healthScore}/100
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className={`h-2 rounded-full ${scores.healthScore >= 60 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${scores.healthScore}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">{productAnalysis.healthImpact.analysis}</p>
          </motion.div>

          {/* Score environnement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Impact Environnement</h3>
              <Leaf className="h-6 w-6 text-green-500" />
            </div>
            <div className={`text-4xl font-bold mb-2 ${scores.environmentScore >= 60 ? 'text-green-600' : 'text-orange-600'}`}>
              {scores.environmentScore}/100
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className={`h-2 rounded-full ${scores.environmentScore >= 60 ? 'bg-green-500' : 'bg-orange-500'}`}
                style={{ width: `${scores.environmentScore}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">{productAnalysis.environmentImpact.analysis}</p>
          </motion.div>

          {/* Score social */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Impact Social</h3>
              <TrendingUp className="h-6 w-6 text-purple-500" />
            </div>
            <div className={`text-4xl font-bold mb-2 ${scores.socialScore >= 60 ? 'text-green-600' : 'text-yellow-600'}`}>
              {scores.socialScore}/100
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className={`h-2 rounded-full ${scores.socialScore >= 60 ? 'bg-green-500' : 'bg-yellow-500'}`}
                style={{ width: `${scores.socialScore}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">Conditions de production et commerce équitable</p>
          </motion.div>
        </div>

        {/* Points clés */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Points négatifs */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Points d'attention
            </h3>
            <ul className="space-y-2">
              {productAnalysis.healthImpact.concerns.map((concern, index) => (
                <li key={index} className="flex items-start gap-2">
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{concern}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Points positifs */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Points positifs
            </h3>
            <ul className="space-y-2">
              {productAnalysis.healthImpact.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Additifs */}
        {productAnalysis.additives && productAnalysis.additives.total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-md p-6 mb-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              Additifs détectés ({productAnalysis.additives.total})
            </h3>
            <div className="space-y-3">
              {productAnalysis.additives.problematic.map((additive, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    additive.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                    additive.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {additive.code}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{additive.name}</p>
                    {additive.description && (
                      <p className="text-sm text-gray-600 mt-1">{additive.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recommandations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            💡 Recommandations personnalisées
          </h3>
          <ul className="space-y-2">
            {recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span className="text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Alternatives */}
        {alternatives && alternatives.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-xl shadow-md p-6 mb-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-purple-500" />
              Alternatives recommandées
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {alternatives.map((alt, index) => (
                <Link
                  key={index}
                  to={`/product/${alt.productId}`}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{alt.name}</h4>
                    <p className="text-sm text-gray-600">{alt.brand}</p>
                    <p className="text-xs text-green-600 mt-1">{alt.reason}</p>
                  </div>
                  <div className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(alt.score)}`}>
                    {alt.score}
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/search"
            className="flex-1 bg-green-500 text-white text-center px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
          >
            Analyser un autre produit
          </Link>
          <Link
            to={`/chat?context=product&productId=${product._id}`}
            className="flex-1 bg-purple-500 text-white text-center px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle className="h-5 w-5" />
            Poser une question sur ce produit
          </Link>
          <Link
            to="/dashboard"
            className="flex-1 bg-blue-500 text-white text-center px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <BarChart3 className="h-5 w-5" />
            Voir mon dashboard
          </Link>
        </div>
      </div>

      {/* Modal de partage */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Partager l'analyse</h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Lien copié !');
                  setShowShareModal(false);
                }}
                className="w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-left"
              >
                📋 Copier le lien
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Découvrez l'analyse ECOLOJIA de ${product.name}: ${window.location.href}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full p-3 bg-green-100 hover:bg-green-200 rounded-lg text-left"
                onClick={() => setShowShareModal(false)}
              >
                💬 WhatsApp
              </a>
              <a
                href={`mailto:?subject=Analyse ECOLOJIA - ${product.name}&body=${encodeURIComponent(`Je viens d'analyser ${product.name} sur ECOLOJIA. Score santé: ${scores.healthScore}/100. Voir l'analyse complète: ${window.location.href}`)}`}
                className="block w-full p-3 bg-blue-100 hover:bg-blue-200 rounded-lg text-left"
                onClick={() => setShowShareModal(false)}
              >
                ✉️ Email
              </a>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="mt-4 w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Fermer
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ResultsPage;
