// PATH: frontend/src/pages/ResultsPage.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  Share2,
  AlertCircle,
  Info,
  Leaf,
  Heart,
  ShieldCheck,
  Camera,
  Barcode,
  Search,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  Package,
  Clock
} from 'lucide-react';
import analysisService from '../services/analysisService';
import { useAuth } from '../auth/context/AuthContext';

interface ResultsPageProps {}

interface AnalysisResult {
  id?: string;
  name: string;
  brand?: string;
  category: 'food' | 'cosmetics' | 'detergents';
  barcode?: string;
  scores: {
    healthScore?: number;
    environmentScore?: number;
    nova?: number;
    nutriscore?: string;
    ecoscore?: string;
  };
  details: {
    ingredientsTextRaw?: string;
    novaLabel?: string;
    novaReason?: string;
    novaConfidence?: number;
    riskFlags?: string[];
    notableIngredients?: string[];
    riskLevel?: 'low' | 'medium' | 'high';
    clpPictograms?: string[];
    surfactants?: string[];
    allergens?: string[];
    biodegradability?: string;
  };
  globalScore?: number;
  confidence?: number;
  timestamp?: number;
}

interface VisionData {
  text?: string;
  extractedData?: {
    name?: string;
    brand?: string;
    ingredients?: string;
    barcode?: string;
    category?: string;
  };
  confidence?: number;
}

const ResultsPage: React.FC<ResultsPageProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [showDetails, setShowDetails] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);
  const [showVisionData, setShowVisionData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  // Recuperation des donnees depuis la navigation
  const { analysis, visionData, scanType, barcode, inputData } = location.state || {};

  // Rediriger si pas de donnees
  useEffect(() => {
    if (!analysis) {
      navigate('/scan');
    }
  }, [analysis, navigate]);

  // Sauvegarder dans l'historique
  useEffect(() => {
    if (analysis && user) {
      saveToHistory();
    }
  }, [analysis, user]);

  const saveToHistory = async () => {
    try {
      setIsSaving(true);
      // TODO: Implementer la sauvegarde dans l'historique
      console.log('Saving to history:', { analysis, scanType });
    } catch (error) {
      console.error('Error saving to history:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${analysis.name} - Analyse ECOLOJIA`,
          text: `Decouvrez l'analyse complete de ${analysis.name} sur ECOLOJIA`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Copier le lien
      navigator.clipboard.writeText(window.location.href);
      setShareUrl(window.location.href);
      setTimeout(() => setShareUrl(null), 3000);
    }
  };

  const handleExport = () => {
    const data = {
      product: {
        name: analysis.name,
        brand: analysis.brand,
        category: analysis.category,
        barcode: analysis.barcode || barcode
      },
      analysis: analysis,
      scanType: scanType,
      date: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ecolojia-${analysis.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getScanTypeIcon = () => {
    switch (scanType) {
      case 'barcode':
        return <Barcode className="w-5 h-5" />;
      case 'photo':
        return <Camera className="w-5 h-5" />;
      case 'manual':
        return <Search className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'Moyen';
    return 'A eviter';
  };

  const getNovaColor = (nova: number) => {
    switch (nova) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-orange-100 text-orange-800';
      case 4: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!analysis) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F7F9F4]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-[#DDE9DA]">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-[#3B3B3B]">
                  Resultats de l'analyse
                </h1>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                  {getScanTypeIcon()}
                  <span>
                    Scanne via {scanType === 'barcode' ? 'code-barres' : scanType === 'photo' ? 'photo' : 'recherche manuelle'}
                  </span>
                  <span className="text-gray-400">•</span>
                  <Clock className="w-4 h-4" />
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Partager"
              >
                <Share2 className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={handleExport}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Exporter"
              >
                <Download className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Product Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6 mb-6"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#3B3B3B]">
                {analysis.name}
              </h2>
              {analysis.brand && (
                <p className="text-gray-600 mt-1">{analysis.brand}</p>
              )}
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm px-3 py-1 bg-gray-100 rounded-full">
                  {analysis.category === 'food' ? '🍽️ Alimentation' : 
                   analysis.category === 'cosmetics' ? '💄 Cosmetiques' : 
                   '🧼 Produits menagers'}
                </span>
                {analysis.barcode && (
                  <span className="text-sm text-gray-500 font-mono">
                    {analysis.barcode}
                  </span>
                )}
              </div>
            </div>
            {analysis.confidence && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Confiance</p>
                <p className="text-lg font-semibold text-gray-700">
                  {Math.round(analysis.confidence * 100)}%
                </p>
              </div>
            )}
          </div>

          {/* Scores principaux */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Score sante */}
            {analysis.scores.healthScore !== undefined && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span className="font-medium">Sante</span>
                  </div>
                  <span className={`text-2xl font-bold ${getScoreColor(analysis.scores.healthScore)}`}>
                    {analysis.scores.healthScore}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-full rounded-full transition-all ${
                      analysis.scores.healthScore >= 80 ? 'bg-green-500' :
                      analysis.scores.healthScore >= 60 ? 'bg-yellow-500' :
                      analysis.scores.healthScore >= 40 ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${analysis.scores.healthScore}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {getScoreLabel(analysis.scores.healthScore)}
                </p>
              </div>
            )}

            {/* Score environnement */}
            {analysis.scores.environmentScore !== undefined && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Environnement</span>
                  </div>
                  <span className={`text-2xl font-bold ${getScoreColor(analysis.scores.environmentScore)}`}>
                    {analysis.scores.environmentScore}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-full rounded-full transition-all ${
                      analysis.scores.environmentScore >= 80 ? 'bg-green-500' :
                      analysis.scores.environmentScore >= 60 ? 'bg-yellow-500' :
                      analysis.scores.environmentScore >= 40 ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${analysis.scores.environmentScore}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {getScoreLabel(analysis.scores.environmentScore)}
                </p>
              </div>
            )}

            {/* Score global */}
            {analysis.globalScore !== undefined && (
              <div className="bg-[#7DDE4A]/10 rounded-lg p-4 border-2 border-[#7DDE4A]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#7DDE4A]" />
                    <span className="font-medium">Score global</span>
                  </div>
                  <span className={`text-2xl font-bold ${getScoreColor(analysis.globalScore)}`}>
                    {analysis.globalScore}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-full bg-[#7DDE4A] rounded-full transition-all"
                    style={{ width: `${analysis.globalScore}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {getScoreLabel(analysis.globalScore)}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Badges specifiques */}
        {analysis.category === 'food' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 mb-6"
          >
            <h3 className="text-lg font-semibold text-[#3B3B3B] mb-4">
              Classifications nutritionnelles
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* NOVA */}
              {analysis.scores.nova && (
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full font-bold text-xl mb-2 ${getNovaColor(analysis.scores.nova)}`}>
                    {analysis.scores.nova}
                  </div>
                  <p className="font-medium">NOVA</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {analysis.details.novaLabel}
                  </p>
                </div>
              )}

              {/* Nutri-Score */}
              {analysis.scores.nutriscore && (
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full font-bold text-xl mb-2 ${
                    analysis.scores.nutriscore === 'A' ? 'bg-green-500 text-white' :
                    analysis.scores.nutriscore === 'B' ? 'bg-green-400 text-white' :
                    analysis.scores.nutriscore === 'C' ? 'bg-yellow-400 text-white' :
                    analysis.scores.nutriscore === 'D' ? 'bg-orange-500 text-white' :
                    'bg-red-500 text-white'
                  }`}>
                    {analysis.scores.nutriscore}
                  </div>
                  <p className="font-medium">Nutri-Score</p>
                </div>
              )}

              {/* Eco-Score */}
              {analysis.scores.ecoscore && (
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full font-bold text-xl mb-2 ${
                    analysis.scores.ecoscore === 'A' ? 'bg-green-500 text-white' :
                    analysis.scores.ecoscore === 'B' ? 'bg-green-400 text-white' :
                    analysis.scores.ecoscore === 'C' ? 'bg-yellow-400 text-white' :
                    analysis.scores.ecoscore === 'D' ? 'bg-orange-500 text-white' :
                    'bg-red-500 text-white'
                  }`}>
                    {analysis.scores.ecoscore}
                  </div>
                  <p className="font-medium">Eco-Score</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Details de l'analyse */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6 mb-6"
        >
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-left"
          >
            <h3 className="text-lg font-semibold text-[#3B3B3B]">
              Details de l'analyse
            </h3>
            {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-4">
                  {/* Raison NOVA */}
                  {analysis.details.novaReason && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium mb-1">Classification NOVA</p>
                      <p className="text-sm text-gray-600">{analysis.details.novaReason}</p>
                    </div>
                  )}

                  {/* Risques cosmetiques */}
                  {analysis.details.riskFlags && analysis.details.riskFlags.length > 0 && (
                    <div className="p-4 bg-red-50 rounded-lg">
                      <p className="font-medium mb-2 text-red-800">Points d'attention</p>
                      <ul className="space-y-1">
                        {analysis.details.riskFlags.map((flag, index) => (
                          <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>{flag}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Ingredients notables */}
                  {analysis.details.notableIngredients && analysis.details.notableIngredients.length > 0 && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="font-medium mb-2 text-blue-800">Ingredients notables</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.details.notableIngredients.map((ingredient, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            {ingredient}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Allergenes */}
                  {analysis.details.allergens && analysis.details.allergens.length > 0 && (
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <p className="font-medium mb-2 text-orange-800">Allergenes detectes</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.details.allergens.map((allergen, index) => (
                          <span key={index} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                            {allergen}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Ingredients */}
        {analysis.details.ingredientsTextRaw && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6 mb-6"
          >
            <button
              onClick={() => setShowIngredients(!showIngredients)}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="text-lg font-semibold text-[#3B3B3B]">
                Liste des ingredients
              </h3>
              {showIngredients ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            <AnimatePresence>
              {showIngredients && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {analysis.details.ingredientsTextRaw}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Donnees Vision (si photo) */}
        {visionData && scanType === 'photo' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-6 mb-6"
          >
            <button
              onClick={() => setShowVisionData(!showVisionData)}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="text-lg font-semibold text-[#3B3B3B]">
                Donnees extraites de l'image
              </h3>
              {showVisionData ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            <AnimatePresence>
              {showVisionData && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 space-y-3">
                    {visionData?.confidence && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium">Confiance OCR</span>
                        <span className="text-sm">{Math.round(visionData.confidence * 100)}%</span>
                      </div>
                    )}
                    {visionData?.text && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-medium mb-2 text-sm">Texte brut extrait</p>
                        <p className="text-xs text-gray-600 font-mono whitespace-pre-wrap">
                          {visionData.text}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link
            to="/scan"
            className="flex-1 px-6 py-3 bg-[#7DDE4A] text-white rounded-lg font-medium hover:bg-[#6BC93B] transition-colors text-center flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Scanner un autre produit
          </Link>
          
          <Link
            to="/dashboard"
            className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center"
          >
            Voir mon tableau de bord
          </Link>
        </motion.div>

        {/* Toast de partage */}
        <AnimatePresence>
          {shareUrl && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-50"
            >
              <div className="bg-green-500 text-white p-4 rounded-lg shadow-lg flex items-center gap-3">
                <ShieldCheck className="w-5 h-5" />
                <p>Lien copie dans le presse-papiers !</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ResultsPage;
