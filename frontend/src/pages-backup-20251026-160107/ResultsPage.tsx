import { getScoreColor, getScoreBgColor } from '@/utils/scoreColors';
// PATH: frontend/src/pages/ResultsPage.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, CheckCircle, Info, TrendingUp, 
  Leaf, Heart, Globe, ChevronRight, Camera,
  Package, FileText, Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { productSaveService } from '../services/productSaveService';

interface AnalysisResult {
  product?: {
    name: string;
    brand?: string;
    category?: string;
    barcode?: string;
  };
  scores?: {
    health: number;
    environment: number;
    social?: number;
  };
  analysis?: {
    positives: string[];
    negatives: string[];
    recommendations: string[];
  };
  alternatives?: Array<{
    id: string;
    name: string;
    brand: string;
    score: number;
  }>;
  insights?: {
    ingredients?: string[];
    additives?: string[];
    allergens?: string[];
    nova?: number;
    nutriscore?: string;
  };
  // Ajout des champs qui peuvent venir de l'analyse
  healthScore?: number;
  environmentScore?: number;
  productName?: string;
}

const ResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [capturedImages, setCapturedImages] = useState<any>({});
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // R?cup?rer les donn?es depuis la navigation
    if (location.state?.analysisData) {
      setAnalysisData(location.state.analysisData);
      setCapturedImages(location.state.capturedImages || {});
      setLoading(false);
    } else {
      // Rediriger si pas de donn?es
      navigate('/scan');
    }
  }, [location, navigate]);

  // Sauvegarder le produit apr?s analyse
  useEffect(() => {
    const saveProduct = async () => {
      if (location.state?.analysisData && location.state?.shouldSave && !isSaved) {
        try {
          console.log('Sauvegarde du produit...', location.state);
          
          await productSaveService.saveAnalyzedProduct(
            location.state.analysisData,
            {
              barcode: location.state.barcode || location.state.analysisData.product?.barcode,
              name: location.state.productName || location.state.analysisData.product?.name || location.state.analysisData.productName,
              brand: location.state.analysisData.product?.brand,
              category: location.state.analysisData.product?.category || 'food',
              images: location.state.capturedImages,
              ingredients: location.state.analysisData.insights?.ingredients?.join(', ') || ''
            }
          );
          
          setIsSaved(true);
          toast.success('? Produit ajout? ? la base de donn?es !');
        } catch (error) {
          console.error('Erreur sauvegarde:', error);
          toast.error('Impossible de sauvegarder le produit');
        }
      }
    };
    
    saveProduct();
  }, [location.state, isSaved]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Analyse en cours...</p>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return null;
  }

  // Gestion des scores avec fallback sur les champs directs
  const healthScore = analysisData.scores?.health || analysisData.healthScore || 50;
  const envScore = analysisData.scores?.environment || analysisData.environmentScore || 50;
  // PHASE 5 - Utilise score persist� backend
  const overallScore = analysis.scores?.overallScore || 0;

  

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-green-100';
    if (score >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  // Nom du produit avec fallback
  const productName = analysisData.product?.name || analysisData.productName || location.state?.productName || 'Produit analys?';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header avec score global */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm border-b"
      >
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {productName}
              </h1>
              {analysisData.product?.brand && (
                <p className="text-gray-600">{analysisData.product.brand}</p>
              )}
              {isSaved && (
                <p className="text-sm text-primary mt-1">
                  ? Enregistr? dans votre historique
                </p>
              )}
            </div>
            <div className={`text-center ${getScoreBg(overallScore)} px-6 py-3 rounded-lg`}>
              <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}
              </div>
              <p className="text-sm text-gray-600">Score global</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Images captur?es */}
      {Object.keys(capturedImages).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto px-4 mt-6"
        >
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Photos analys?es
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {capturedImages.barcode && (
                <div className="relative">
                  <img 
                    src={capturedImages.barcode} 
                    alt="Code-barres"
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <span className="absolute bottom-1 left-1 text-xs bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                    Code-barres
                  </span>
                </div>
              )}
              {capturedImages.front && (
                <div className="relative">
                  <img 
                    src={capturedImages.front} 
                    alt="Face avant"
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <span className="absolute bottom-1 left-1 text-xs bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                    Face avant
                  </span>
                </div>
              )}
              {capturedImages.ingredients && (
                <div className="relative">
                  <img 
                    src={capturedImages.ingredients} 
                    alt="Ingr?dients"
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <span className="absolute bottom-1 left-1 text-xs bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                    Ingr?dients
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {/* Scores d?taill?s */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-2 gap-4"
        >
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center">
                <Heart className="w-5 h-5 mr-2 text-red-500" />
                Impact Sant?
              </h3>
              <span className={`text-2xl font-bold ${getScoreColor(healthScore)}`}>
                {healthScore}/100
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${healthScore}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`h-3 rounded-full ${
                  healthscore >= 70 ? 'bg-green-500' :
                  healthscore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center">
                <Globe className="w-5 h-5 mr-2 text-green-500" />
                Impact Environnement
              </h3>
              <span className={`text-2xl font-bold ${getScoreColor(envScore)}`}>
                {envScore}/100
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${envScore}%` }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className={`h-3 rounded-full ${
                  envscore >= 70 ? 'bg-green-500' :
                  envscore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
              />
            </div>
          </div>
        </motion.div>

        {/* Informations nutritionnelles */}
        {analysisData.insights && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Informations d?tect?es
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              {analysisData.insights.nova && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Classification NOVA</span>
                  <span className={`font-bold px-3 py-1 rounded ${
                    analysisData.insights.nova <= 2 ? 'bg-green-100 text-primary' :
                    analysisData.insights.nova === 3 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    Groupe {analysisData.insights.nova}
                  </span>
                </div>
              )}
              
              {analysisData.insights.nutriscore && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Nutri-Score</span>
                  <span className={`font-bold px-3 py-1 rounded ${
                    ['A', 'B'].includes(analysisData.insights.nutriscore) ? 'bg-green-100 text-primary' :
                    analysisData.insights.nutriscore === 'C' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {analysisData.insights.nutriscore}
                  </span>
                </div>
              )}
            </div>

            {analysisData.insights.additives && analysisData.insights.additives.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Additifs d?tect?s</h4>
                <div className="flex flex-wrap gap-2">
                  {analysisData.insights.additives.map((additive, index) => (
                    <span key={index} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-sm">
                      {additive}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysisData.insights.allergens && analysisData.insights.allergens.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Allerg?nes</h4>
                <div className="flex flex-wrap gap-2">
                  {analysisData.insights.allergens.map((allergen, index) => (
                    <span key={index} className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
                      {allergen}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Analyse d?taill?e */}
        {analysisData.analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2" />
              Analyse IA d?taill?e
            </h3>

            {/* Points positifs */}
            {analysisData.analysis.positives && analysisData.analysis.positives.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-primary mb-3 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Points positifs
                </h4>
                <ul className="space-y-2">
                  {analysisData.analysis.positives.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2 mt-1">?</span>
                      <span className="text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Points n?gatifs */}
            {analysisData.analysis.negatives && analysisData.analysis.negatives.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-red-700 mb-3 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Points d'attention
                </h4>
                <ul className="space-y-2">
                  {analysisData.analysis.negatives.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">?</span>
                      <span className="text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommandations */}
            {analysisData.analysis.recommendations && analysisData.analysis.recommendations.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-700 mb-3 flex items-center">
                  <Info className="w-4 h-4 mr-2" />
                  Recommandations
                </h4>
                <ul className="space-y-2">
                  {analysisData.analysis.recommendations.map((rec, index) => (
                    <li key={index} className="text-gray-700">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        {/* Alternatives */}
        {analysisData.alternatives && analysisData.alternatives.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Alternatives recommand?es
            </h3>
            
            <div className="space-y-3">
              {analysisData.alternatives.map((alt, index) => (
                <motion.div
                  key={alt.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => navigate(`/product/${alt.id}`)}
                >
                  <div>
                    <p className="font-medium text-gray-800">{alt.name}</p>
                    <p className="text-sm text-gray-600">{alt.brand}</p>
                  </div>
                  <div className="flex items-center">
                    <span className={`font-bold mr-3 ${getScoreColor(alt.score)}`}>
                      {alt.score}/100
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button
            onClick={() => navigate('/scan')}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-forest rounded-lg hover:bg-green-700 transition-colors"
          >
            <Camera className="w-5 h-5" />
            Scanner un autre produit
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Package className="w-5 h-5" />
            Voir mon historique
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default ResultsPage;

