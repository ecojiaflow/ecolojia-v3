import { getScoreColor, getScoreBgColor } from '@/utils/scoreColors';
// frontend/src/pages/CosmeticAnalysisPage.tsx

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Droplet,
  Leaf,
  Shield,
  Star,
  Info,
  ChevronDown,
  ChevronUp,
  Search,
  Package,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { productService } from '../services/productService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { ScoreGauge } from '../components/analysis/ScoreGauge';
import IngredientsList from '../cosmetics/IngredientsList';
import CertificationBadges from '../cosmetics/CertificationBadges';


interface CosmeticAnalysis {
  scores: {
    safety: number;
    naturalness: number;
    effectiveness: number;
    overall: number;
  };
  details: {
    inci: INCIIngredient[];
    concerns: Concern[];
    allergens: Allergen[];
    certifications: string[];
    pao: number;
  };
  recommendations: {
    skinTypes: string[];
    warnings: Warning[];
    alternatives: Product[];
  };
  analysis: {
    totalIngredients: number;
    naturalIngredients: number;
    syntheticIngredients: number;
    concerningIngredients: number;
  };
}

interface INCIIngredient {
  name: string;
  inci: string;
  position: number;
  concentration: string;
  natural: boolean;
  function: string;
  safety: number;
  concerns: string[];
  descriptiona: string;
}

interface Concern {
  ingredient: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

interface Warning {
  level: 'info' | 'warning' | 'danger';
  message: string;
}

const CosmeticAnalysisPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['scores']));

  const { data: product, isLoading, error } = useQuery(
    ['cosmetic-product', productId],
    () => productService.getProductById(productId!),
    {
      enabled: !!productId
    }
  );

  const analysis = product?.cosmeticAnalysis as CosmeticAnalysis;

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return 'bg-green-50';
    if (score >= 50) return 'bg-yellow-50';
    if (score >= 30) return 'bg-orange-50';
    return 'bg-red-50';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSkinTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      all: 'Tous types de peau',
      sensitive: 'Peaux sensibles',
      dry: 'Peaux seches',
      oily: 'Peaux grasses',
      combination: 'Peaux mixtes',
      acneic: 'Peaux  tendance acneique'
    };
    return labels[type] || type;
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Erreur lors du chargement du produit" />;
  if (!product || !analysis) return <ErrorMessage message="Produit non trouve" />;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header produit */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start gap-4">
          {product.images?.front && (
            <img
              src={product.images.front}
              alt={product.name}
              className="w-24 h-24 object-contain rounded-lg"
            />
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-600">{product.brand}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-gray-500">Code-barres: {product.barcode}</span>
              <span className="text-sm text-gray-500">PAO: {analysis.details.pao} mois</span>
            </div>
          </div>
        </div>
      </div>

      {/* Avertissements prioritaires */}
      {analysis.recommendations.warnings.length > 0 && (
        <div className="space-y-2">
          {analysis.recommendations.warnings.map((warning, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg flex items-start gap-3 ${
                warning.level === 'danger' ? 'bg-red-50 border border-red-200' :
                warning.level === 'warning' ? 'bg-orange-50 border border-orange-200' :
                'bg-blue-50 border border-blue-200'
              }`}
            >
              {warning.level === 'danger' ? <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" /> :
               warning.level === 'warning' ? <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" /> :
               <Info className="w-5 h-5 text-blue-600 mt-0.5" />}
              <p className="text-sm font-medium">{warning.message}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Scores */}
      <div className="bg-white rounded-lg shadow-sm">
        <button
          onClick={() => toggleSection('scores')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Scores d'analyse
          </h2>
          {expandedSections.has('scores') ? <ChevronUp /> : <ChevronDown />}
        </button>
        
        <AnimatePresence>
          {expandedSections.has('scores') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <ScoreGauge
                    score={analysis.scores.overall}
                    label="Score Global"
                    size="small"
                    showAnimation
                  />
                </div>
                
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${getScoreBgColor(analysis.scores.safety)}`}>
                    <Shield className={`w-8 h-8 ${getScoreColor(analysis.scores.safety)}`} />
                  </div>
                  <p className="mt-2 text-sm font-medium">Securite</p>
                  <p className={`text-2xl font-bold ${getScoreColor(analysis.scores.safety)}`}>
                    {analysis.scores.safety}%
                  </p>
                </div>
                
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${getScoreBgColor(analysis.scores.naturalness)}`}>
                    <Leaf className={`w-8 h-8 ${getScoreColor(analysis.scores.naturalness)}`} />
                  </div>
                  <p className="mt-2 text-sm font-medium">Naturalite</p>
                  <p className={`text-2xl font-bold ${getScoreColor(analysis.scores.naturalness)}`}>
                    {analysis.scores.naturalness}%
                  </p>
                </div>
                
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${getScoreBgColor(analysis.scores.effectiveness)}`}>
                    <Droplet className={`w-8 h-8 ${getScoreColor(analysis.scores.effectiveness)}`} />
                  </div>
                  <p className="mt-2 text-sm font-medium">Efficacite</p>
                  <p className={`text-2xl font-bold ${getScoreColor(analysis.scores.effectiveness)}`}>
                    {analysis.scores.effectiveness}%
                  </p>
                </div>
              </div>
              
              {/* Resume de composition */}
              <div className="px-6 pb-6 border-t pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{analysis.analysis.totalIngredients}</p>
                    <p className="text-sm text-gray-600">Ingredients totaux</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{analysis.analysis.naturalIngredients}</p>
                    <p className="text-sm text-gray-600">Naturels</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{analysis.analysis.syntheticIngredients}</p>
                    <p className="text-sm text-gray-600">Synthetiques</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{analysis.analysis.concerningIngredients}</p>
                    <p className="text-sm text-gray-600">Preoccupants</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ingredients INCI */}
      <div className="bg-white rounded-lg shadow-sm">
        <button
          onClick={() => toggleSection('ingredients')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-500" />
            Composition INCI ({analysis.details.inci.length} ingredients)
          </h2>
          {expandedSections.has('ingredients') ? <ChevronUp /> : <ChevronDown />}
        </button>
        
        <AnimatePresence>
          {expandedSections.has('ingredients') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6">
                <IngredientsList ingredients={analysis.details.inci} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Substances preoccupantes */}
      {analysis.details.concerns.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm">
          <button
            onClick={() => toggleSection('concerns')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Substances preoccupantes ({analysis.details.concerns.length})
            </h2>
            {expandedSections.has('concerns') ? <ChevronUp /> : <ChevronDown />}
          </button>
          
          <AnimatePresence>
            {expandedSections.has('concerns') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 space-y-3">
                  {analysis.details.concerns.map((concern, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
                    >
                      {getSeverityIcon(concern.severity)}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{concern.ingredient}</p>
                        <p className="text-sm text-gray-600 mt-1">{concern.description}</p>
                        <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${
                          concern.severity === 'critical' ? 'bg-red-100 text-red-700' :
                          concern.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                          concern.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {concern.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Allergenes */}
      {analysis.details.allergens.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm">
          <button
            onClick={() => toggleSection('allergens')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Allergenes potentiels ({analysis.details.allergens.length})
            </h2>
            {expandedSections.has('allergens') ? <ChevronUp /> : <ChevronDown />}
          </button>
          
          <AnimatePresence>
            {expandedSections.has('allergens') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6">
                  <div className="grid gap-2">
                    {analysis.details.allergens.map((allergen, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded bg-red-50">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-900">{allergen.ingredient}</span>
                        <span className="text-sm text-red-700">({allergen.type})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Types de peau recommandes */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Convient aux types de peau
        </h2>
        <div className="flex flex-wrap gap-2">
          {analysis.recommendations.skinTypes.map((type) => (
            <span
              key={type}
              className="px-3 py-1 bg-green-100 text-primary rounded-full text-sm font-medium"
            >
              {getSkinTypeLabel(type)}
            </span>
          ))}
        </div>
      </div>

      {/* Certifications */}
      {analysis.details.certifications.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Certifications</h2>
          <CertificationBadges certifications={analysis.details.certifications} />
        </div>
      )}

      {/* Alternatives */}
      {analysis.recommendations.alternatives.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />
            Alternatives recommandees
          </h2>
          <div className="grid gap-3">
            {analysis.recommendations.alternatives.map((alt) => (
              <button
                key={alt.id}
                onClick={() => navigate(`/products/${alt.id}`)}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors text-left"
              >
                {alt.images?.front && (
                  <img
                    src={alt.images.front}
                    alt={alt.name}
                    className="w-16 h-16 object-contain"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium">{alt.name}</p>
                  <p className="text-sm text-gray-600">{alt.brand}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{alt.cosmeticAnalysis?.scores.overall}%</p>
                  <p className="text-xs text-gray-500">Score global</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CosmeticAnalysisPage;





