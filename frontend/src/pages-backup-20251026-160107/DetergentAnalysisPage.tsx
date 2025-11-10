import { getScoreColor, getScoreBgColor } from '@/utils/scoreColors';
// frontend/src/pages/DetergentAnalysisPage.tsx

// PATH: frontend/src/pages/CosmeticAnalysisPage.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query'; // a�…a€œaa‚¬�¦ Correction ici
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
import { IngredientsList } from '../components/cosmetics/IngredientsList';
import { CertificationBadges } from '../components/cosmetics/CertificationBadges';

interface DetergentAnalysis {
  scores: {
    ecological: number;
    efficiency: number;
    safety: number;
    overall: number;
  };
  details: {
    biodegradability: {
      percentage: number;
      rating: string;
      timeframe: string;
      details: Array<{
        ingredient: string;
        biodegradability: number;
        percentage: number;
      }>;
    };
    cdv: {
      value: number;
      unit: string;
      rating: string;
      interpretation: string;
      breakdown: Array<{
        ingredient: string;
        contribution: number;
      }>;
    };
    irritants: Array<{
      ingredient: string;
      type: string;
      severity: string;
      percentage: number;
      hazards: string[];
    }>;
    voc: {
      percentage: number;
      rating: string;
      components: Array<{
        ingredient: string;
        percentage: number;
        category: string;
      }>;
      euLimit: number;
      compliant: boolean;
    };
    phosphates: {
      present: boolean;
      percentage: number;
      components: Array<{
        name: string;
        percentage: number;
        type: string;
      }>;
      euCompliant: boolean;
      environmental_impact: string;
    };
    composition: Array<{
      name: string;
      percentage: number;
      category: string;
      function: string;
      hazards: string[];
    }>;
  };
  certifications: {
    eco: Array<{ id: string; name: string; verified: boolean }>;
    safety: Array<{ id: string; name: string; verified: boolean }>;
    performance: Array<{ id: string; name: string; verified: boolean }>;
  };
  recommendations: {
    usage: Array<{ type: string; message: string }>;
    warnings: Array<{ level: string; message: string; details?: string[] }>;
    alternatives: Array<{ type: string; message: string }>;
    tips: Array<{ category: string; message: string }>;
  };
  analysis: {
    totalIngredients: number;
    problematicIngredients: number;
    ecoCertified: boolean;
  };
}

const DetergentAnalysisPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['scores']));

  const { data: product, isLoading, error } = useQuery(
    ['detergent-product', productId],
    () => productService.getProductById(productId!),
    {
      enabled: !!productId
    }
  );

  const analysis = product?.detergentAnalysis as DetergentAnalysis;

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

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-primary';
      case 'good': return 'text-green-500';
      case 'moderate': return 'text-green-500';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRatingBgColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'bg-green-100';
      case 'good': return 'bg-green-50';
      case 'moderate': return 'bg-yellow-50';
      case 'poor': return 'bg-red-50';
      default: return 'bg-gray-50';
    }
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
              <span className="text-sm text-gray-500">
                {analysis.analysis.totalIngredients} ingredients
              </span>
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
              <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                warning.level === 'danger' ? 'text-red-600' :
                warning.level === 'warning' ? 'text-orange-600' :
                'text-blue-600'
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium">{warning.message}</p>
                {warning.details && (
                  <ul className="mt-2 space-y-1">
                    {warning.details.map((detail, idx) => (
                      <li key={idx} className="text-sm text-gray-600">aa‚¬�‚�¢ {detail}</li>
                    ))}
                  </ul>
                )}
              </div>
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
            <Beaker className="w-5 h-5 text-blue-500" />
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
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${getScoreBgColor(analysis.scores.ecological)}`}>
                    <Leaf className={`w-8 h-8 ${getScoreColor(analysis.scores.ecological)}`} />
                  </div>
                  <p className="mt-2 text-sm font-medium">�ƒ�’aa‚¬�°cologique</p>
                  <p className={`text-2xl font-bold ${getScoreColor(analysis.scores.ecological)}`}>
                    {analysis.scores.ecological}%
                  </p>
                </div>
                
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${getScoreBgColor(analysis.scores.efficiency)}`}>
                    <Droplets className={`w-8 h-8 ${getScoreColor(analysis.scores.efficiency)}`} />
                  </div>
                  <p className="mt-2 text-sm font-medium">Efficacite</p>
                  <p className={`text-2xl font-bold ${getScoreColor(analysis.scores.efficiency)}`}>
                    {analysis.scores.efficiency}%
                  </p>
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Impact Environnemental */}
      <div className="bg-white rounded-lg shadow-sm">
        <button
          onClick={() => toggleSection('environmental')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Fish className="w-5 h-5 text-blue-500" />
            Impact Environnemental
          </h2>
          {expandedSections.has('environmental') ? <ChevronUp /> : <ChevronDown />}
        </button>
        
        <AnimatePresence>
          {expandedSections.has('environmental') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden px-6 pb-6"
            >
              {/* Biodegradabilite */}
              <div className="mt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Biodegradabilite</h3>
                <div className={`p-4 rounded-lg ${getRatingBgColor(analysis.details.biodegradability.rating)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold">{analysis.details.biodegradability.percentage}%</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(analysis.details.biodegradability.rating)}`}>
                      {analysis.details.biodegradability.rating === 'excellent' ? 'Excellent' :
                       analysis.details.biodegradability.rating === 'good' ? 'Bon' :
                       analysis.details.biodegradability.rating === 'moderate' ? 'Modere' : 'Faible'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    en {analysis.details.biodegradability.timeframe}
                  </p>
                </div>
              </div>

              {/* CDV (Critical Dilution Volume) */}
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Volume Critique de Dilution (CDV)
                </h3>
                <div className={`p-4 rounded-lg ${getRatingBgColor(analysis.details.cdv.rating)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold">
                      {analysis.details.cdv.value.toLocaleString()} {analysis.details.cdv.unit}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(analysis.details.cdv.rating)}`}>
                      {analysis.details.cdv.rating === 'excellent' ? 'Tres faible' :
                       analysis.details.cdv.rating === 'good' ? 'Faible' :
                       analysis.details.cdv.rating === 'moderate' ? 'Modere' : '�ƒ�’aa‚¬�°leve'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {analysis.details.cdv.interpretation}
                  </p>
                </div>
              </div>

              {/* Phosphates */}
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Phosphates</h3>
                <div className={`p-4 rounded-lg ${analysis.details.phosphates.present ? 'bg-orange-50' : 'bg-green-50'}`}>
                  <div className="flex items-center gap-2">
                    {analysis.details.phosphates.present ? (
                      <XCircle className="w-5 h-5 text-orange-600" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                    <span className={`font-medium ${analysis.details.phosphates.present ? 'text-orange-900' : 'text-green-900'}`}>
                      {analysis.details.phosphates.present 
                        ? `Presence de phosphates (${analysis.details.phosphates.percentage}%)`
                        : 'Sans phosphates'}
                    </span>
                  </div>
                  {analysis.details.phosphates.present && (
                    <p className="text-sm text-orange-700 mt-2">
                      Impact: {analysis.details.phosphates.environmental_impact}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    Conformite EU: {analysis.details.phosphates.euCompliant ? 'a�…a€œaa‚¬�“ Conforme' : 'a�…a€œaa‚¬a€ Non conforme'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* COV (Composes Organiques Volatils) */}
      {analysis.details.voc.percentage > 0 && (
        <div className="bg-white rounded-lg shadow-sm">
          <button
            onClick={() => toggleSection('voc')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Wind className="w-5 h-5 text-primary-1000" />
              Composes Organiques Volatils (COV)
            </h2>
            {expandedSections.has('voc') ? <ChevronUp /> : <ChevronDown />}
          </button>
          
          <AnimatePresence>
            {expandedSections.has('voc') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden px-6 pb-6"
              >
                <div className={`mt-4 p-4 rounded-lg ${getRatingBgColor(analysis.details.voc.rating)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold">{analysis.details.voc.percentage}% COV</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      analysis.details.voc.compliant ? 'bg-green-100 text-primary' : 'bg-red-100 text-red-700'
                    }`}>
                      {analysis.details.voc.compliant ? 'Conforme EU' : 'Non conforme EU'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Limite EU: {analysis.details.voc.euLimit}%
                  </p>
                  
                  {analysis.details.voc.components.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {analysis.details.voc.components.map((comp, idx) => (
                        <div key={idx} className="text-sm text-gray-600">
                          aa‚¬�‚�¢ {comp.ingredient} ({comp.percentage}%)
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Substances irritantes */}
      {analysis.details.irritants.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm">
          <button
            onClick={() => toggleSection('irritants')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Substances irritantes ({analysis.details.irritants.length})
            </h2>
            {expandedSections.has('irritants') ? <ChevronUp /> : <ChevronDown />}
          </button>
          
          <AnimatePresence>
            {expandedSections.has('irritants') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden px-6 pb-6"
              >
                <div className="mt-4 space-y-3">
                  {analysis.details.irritants.map((irritant, index) => (
                    <div key={index} className="p-3 rounded-lg bg-orange-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{irritant.ingredient}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Type: {irritant.type} aa‚¬�‚�¢ Severite: {
                              irritant.severity === 'high' ? '�ƒ�’aa‚¬�°levee' :
                              irritant.severity === 'moderate' ? 'Moderee' : 'Faible'
                            }
                          </p>
                          {irritant.hazards.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {irritant.hazards.map((hazard, idx) => (
                                <p key={idx} className="text-sm text-orange-700">aa‚¬�‚�¢ {hazard}</p>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{irritant.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Recommandations d'usage */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" />
          Recommandations d'usage
        </h2>
        
        <div className="space-y-4">
          {analysis.recommendations.usage.map((usage, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <p className="text-gray-700">{usage.message}</p>
            </div>
          ))}
          
          {analysis.recommendations.tips.map((tip, index) => (
            <div key={index} className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5" />
              <p className="text-gray-700">{tip.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Certifications */}
      {(analysis.certifications.eco.length > 0 || 
        analysis.certifications.safety.length > 0 || 
        analysis.certifications.performance.length > 0) && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Certifications</h2>
          
          <div className="space-y-4">
            {analysis.certifications.eco.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">�ƒ�’aa‚¬�°cologiques</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.certifications.eco.map(cert => (
                    <span key={cert.id} className="px-3 py-1 bg-green-100 text-primary rounded-full text-sm">
                      {cert.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {analysis.certifications.safety.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Securite</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.certifications.safety.map(cert => (
                    <span key={cert.id} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {cert.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {analysis.certifications.performance.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Performance</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.certifications.performance.map(cert => (
                    <span key={cert.id} className="px-3 py-1 bg-primary-100 text-forest-dark rounded-full text-sm">
                      {cert.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DetergentAnalysisPage;




