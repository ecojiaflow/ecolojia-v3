// 📁 src/components/analysis/ScientificScore.tsx - VERSION ENRICHIE
import React, { useState } from 'react';
import { CircleGauge, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface ScoreBreakdown {
  transformation?: {
    score: number;
    details: {
      nova: {
        group: number;
        confidence: number;
        reasoning: string[];
      };
      additives: {
        total: number;
        microbiomeDisruptors: number;
        controversial: number;
        detected_additives: Array<{
          e_number: string;
          name: string;
          risk_level: string;
        }>;
      };
    };
  };
  nutrition?: {
    score: number;
    details: {
      nutriScore: {
        grade: string;
        score: number;
        confidence: number;
      };
    };
  };
  glycemic?: {
    score: number;
    details: {
      glycemic: {
        index: number;
        category: string;
        load: number;
      };
    };
  };
  environmental?: {
    score: number;
    details: {
      certifications: string[];
      packaging: any;
    };
  };
}

interface Props {
  score: number;
  breakdown: ScoreBreakdown;
  confidence?: number;
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
};

const getScoreGradient = (score: number): string => {
  if (score >= 80) return 'from-green-500 to-green-600';
  if (score >= 60) return 'from-yellow-500 to-yellow-600';
  if (score >= 40) return 'from-orange-500 to-orange-600';
  return 'from-red-500 to-red-600';
};

export const ScientificScore: React.FC<Props> = ({ score, breakdown, confidence = 0.8 }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const renderNovaDetails = () => {
    const nova = breakdown.transformation?.details?.nova;
    if (!nova) return null;

    const novaColors = {
      1: 'bg-green-100 text-green-800 border-green-300',
      2: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      3: 'bg-orange-100 text-orange-800 border-orange-300',
      4: 'bg-red-100 text-red-800 border-red-300'
    };

    return (
      <div className="mt-3 p-3 border rounded-lg bg-gray-50">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-sm">Classification NOVA</span>
        </div>
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${novaColors[nova.group as keyof typeof novaColors]}`}>
          Groupe {nova.group} - {nova.group === 1 ? 'Non transformé' : nova.group === 2 ? 'Peu transformé' : nova.group === 3 ? 'Transformé' : 'Ultra-transformé'}
        </div>
        {nova.reasoning && nova.reasoning.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-600 mb-1">Détection :</p>
            <ul className="text-xs text-gray-700 space-y-1">
              {nova.reasoning.slice(0, 3).map((reason, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="text-gray-400">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-2 text-xs text-gray-500">
          Confiance : {Math.round(nova.confidence * 100)}% • Source : INSERM 2024
        </div>
      </div>
    );
  };

  const renderAdditivesDetails = () => {
    const additives = breakdown.transformation?.details?.additives;
    if (!additives || additives.total === 0) return null;

    return (
      <div className="mt-3 p-3 border rounded-lg bg-gray-50">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown className="w-4 h-4 text-red-500" />
          <span className="font-medium text-sm">Additifs Détectés</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-800">{additives.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">{additives.microbiomeDisruptors}</div>
            <div className="text-xs text-gray-600">Microbiote</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">{additives.controversial}</div>
            <div className="text-xs text-gray-600">Controversés</div>
          </div>
        </div>
        {additives.detected_additives && additives.detected_additives.length > 0 && (
          <div>
            <p className="text-xs text-gray-600 mb-2">Additifs identifiés :</p>
            <div className="space-y-1">
              {additives.detected_additives.slice(0, 3).map((additive, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="font-mono text-gray-700">{additive.e_number}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    additive.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                    additive.risk_level === 'medium' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {additive.risk_level === 'high' ? 'Élevé' : additive.risk_level === 'medium' ? 'Modéré' : 'Faible'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-2 text-xs text-gray-500">
          Source : Base EFSA 2024
        </div>
      </div>
    );
  };

  const renderNutritionDetails = () => {
    const nutrition = breakdown.nutrition?.details?.nutriScore;
    if (!nutrition) return null;

    const gradeColors = {
      A: 'bg-green-500 text-white',
      B: 'bg-lime-500 text-white', 
      C: 'bg-yellow-500 text-white',
      D: 'bg-orange-500 text-white',
      E: 'bg-red-500 text-white'
    };

    return (
      <div className="mt-3 p-3 border rounded-lg bg-gray-50">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-sm">Nutri-Score</span>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${gradeColors[nutrition.grade as keyof typeof gradeColors]}`}>
            {nutrition.grade}
          </div>
          <div>
            <div className="text-sm font-medium">{nutrition.score} points</div>
            <div className="text-xs text-gray-600">Confiance : {Math.round(nutrition.confidence * 100)}%</div>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Algorithme officiel ANSES 2024
        </div>
      </div>
    );
  };

  const renderGlycemicDetails = () => {
    const glycemic = breakdown.glycemic?.details?.glycemic;
    if (!glycemic) return null;

    const categoryLabels = {
      low: { label: 'Faible', color: 'text-green-600', bg: 'bg-green-50' },
      medium: { label: 'Modéré', color: 'text-yellow-600', bg: 'bg-yellow-50' },
      high: { label: 'Élevé', color: 'text-red-600', bg: 'bg-red-50' }
    };

    const categoryStyle = categoryLabels[glycemic.category as keyof typeof categoryLabels] || categoryLabels.medium;

    return (
      <div className="mt-3 p-3 border rounded-lg bg-gray-50">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-purple-500" />
          <span className="font-medium text-sm">Index Glycémique</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-lg font-bold text-gray-800">{glycemic.index}</div>
            <div className="text-xs text-gray-600">Index</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-800">{glycemic.load?.toFixed(1) || '0'}</div>
            <div className="text-xs text-gray-600">Charge</div>
          </div>
        </div>
        <div className={`mt-2 inline-flex px-2 py-1 rounded-full text-xs font-medium ${categoryStyle.bg} ${categoryStyle.color}`}>
          Impact {categoryStyle.label}
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Table Internationale + INSERM 2024
        </div>
      </div>
    );
  };

  const sections = [
    {
      key: 'transformation',
      title: '🏭 Transformation',
      score: breakdown.transformation?.score || 0,
      hasDetails: !!(breakdown.transformation?.details?.nova || breakdown.transformation?.details?.additives)
    },
    {
      key: 'nutrition', 
      title: '🧬 Nutrition',
      score: breakdown.nutrition?.score || 0,
      hasDetails: !!breakdown.nutrition?.details?.nutriScore
    },
    {
      key: 'glycemic',
      title: '📊 Glycémique', 
      score: breakdown.glycemic?.score || 0,
      hasDetails: !!breakdown.glycemic?.details?.glycemic
    },
    {
      key: 'environmental',
      title: '🌱 Environnemental',
      score: breakdown.environmental?.score || 0,
      hasDetails: !!(breakdown.environmental?.details?.certifications?.length)
    }
  ];

  return (
    <div className="bg-white border rounded-xl shadow-lg p-6 mb-6">
      {/* Header avec score principal */}
      <div className="text-center mb-6">
        <div className="relative inline-flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-3">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getScoreGradient(score)} flex items-center justify-center`}>
              <span className="text-2xl font-bold text-white">{score}</span>
            </div>
          </div>
          <div className="absolute -top-1 -right-1">
            <CircleGauge className={`w-6 h-6 ${getScoreColor(score)}`} />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">
          Score Scientifique Global
        </h2>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <span>Confiance : {Math.round(confidence * 100)}%</span>
          <span>•</span>
          <span>Analyse IA Complète</span>
        </div>
      </div>

      {/* Breakdown détaillé */}
      <div className="space-y-3">
        {sections.map((section) => (
          <div key={section.key} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => section.hasDetails ? toggleSection(section.key) : null}
              className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${!section.hasDetails ? 'cursor-default' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{section.title}</span>
                <div className={`text-sm font-bold ${getScoreColor(section.score)}`}>
                  {section.score}/100
                </div>
              </div>
              {section.hasDetails && (
                expandedSection === section.key ? 
                <ChevronUp className="w-4 h-4 text-gray-400" /> : 
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            
            {expandedSection === section.key && section.hasDetails && (
              <div className="border-t bg-gray-50 p-4">
                {section.key === 'transformation' && (
                  <>
                    {renderNovaDetails()}
                    {renderAdditivesDetails()}
                  </>
                )}
                {section.key === 'nutrition' && renderNutritionDetails()}
                {section.key === 'glycemic' && renderGlycemicDetails()}
                {section.key === 'environmental' && (
                  <div className="text-sm text-gray-600">
                    Certifications : {breakdown.environmental?.details?.certifications?.join(', ') || 'Aucune'}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer sources */}
      <div className="mt-6 pt-4 border-t text-xs text-gray-500 text-center">
        Sources : INSERM • ANSES • EFSA • ECHA • Base Internationale IG 2024
      </div>
    </div>
  );
};