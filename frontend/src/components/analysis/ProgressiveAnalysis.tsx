import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  Lock, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Download,
  MessageSquare,
  TrendingUp,
  Shield,
  Leaf
} from 'lucide-react';

interface ProgressiveAnalysisProps {
  analysis?: ProductAnalysis;
  level?: 'basic' | 'detailed' | 'expert';
  userTier?: 'free' | 'premium';
  onUpgrade?: () => void;
}

interface ProductAnalysis {
  productId: string;
  name: string;
  brand?: string;
  category: string;
  
  // Scores
  healthScore: number;
  environmentScore: number;
  ethicsScore: number;
  overallScore: number;
  
  // Analyse santé
  novaGroup?: number;
  nutriScore?: string;
  
  // Détails
  ingredients?: string[];
  additives?: Additive[];
  allergens?: string[];
  nutritionalInfo?: NutritionalInfo;
  
  // Alternatives
  alternatives?: Alternative[];
  
  // Metadata
  sources?: Source[];
  lastUpdated?: string;
}

interface Additive {
  code: string;
  name: string;
  risk: 'low' | 'medium' | 'high';
  description?: string;
}

interface NutritionalInfo {
  calories: number;
  proteins: number;
  carbs: number;
  sugars: number;
  fats: number;
  saturatedFats: number;
  fiber: number;
  salt: number;
}

interface Alternative {
  id: string;
  name: string;
  brand: string;
  score: number;
  improvement: string;
  priceRange?: string;
}

interface Source {
  name: string;
  url: string;
  type: string;
}

// Données de démonstration
const DEMO_ANALYSIS: ProductAnalysis = {
  productId: 'demo-001',
  name: 'Produit de démonstration',
  brand: 'Marque Example',
  category: 'food',
  healthScore: 6.5,
  environmentScore: 7.2,
  ethicsScore: 5.8,
  overallScore: 6.5,
  novaGroup: 3,
  nutriScore: 'C',
  additives: [
    { code: 'E330', name: 'Acide citrique', risk: 'low', description: 'Acidifiant naturel' },
    { code: 'E202', name: 'Sorbate de potassium', risk: 'medium', description: 'Conservateur' },
    { code: 'E621', name: 'Glutamate monosodique', risk: 'high', description: 'Exhausteur de goût controversé' }
  ],
  alternatives: [
    { id: '1', name: 'Alternative Bio', brand: 'NaturePlus', score: 8.2, improvement: '+25% meilleur score santé' },
    { id: '2', name: 'Option Locale', brand: 'TerraNova', score: 7.8, improvement: 'Produit localement' },
    { id: '3', name: 'Sans Additifs', brand: 'PureFood', score: 7.5, improvement: 'Sans conservateurs' }
  ],
  sources: [
    { name: 'Open Food Facts', url: 'https://openfoodfacts.org', type: 'Base de données' },
    { name: 'Étude INRAE 2024', url: '#', type: 'Publication scientifique' }
  ]
};

// Composant pour afficher un score avec jauge
const ScoreGauge = ({ score, label, color }: { score: number; label: string; color: string }) => {
  const percentage = Math.round(score * 10);
  const getScoreColor = () => {
    if (score >= 8) return 'text-green-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="text-center">
      <div className="relative w-24 h-24 mx-auto">
        <svg className="transform -rotate-90 w-24 h-24">
          <circle
            cx="48"
            cy="48"
            r="36"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx="48"
            cy="48"
            r="36"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 36}`}
            strokeDashoffset={`${2 * Math.PI * 36 * (1 - score / 10)}`}
            className={color}
            strokeLinecap="round"
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center text-2xl font-bold ${getScoreColor()}`}>
          {score.toFixed(1)}
        </div>
      </div>
      <p className="mt-2 text-sm font-medium text-gray-700">{label}</p>
    </div>
  );
};

export default function ProgressiveAnalysis({
  analysis = DEMO_ANALYSIS,
  level = 'basic',
  userTier = 'free',
  onUpgrade = () => alert('Fonction upgrade à implémenter')
}: ProgressiveAnalysisProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));

  // Vérification de sécurité
  if (!analysis) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Aucune analyse disponible</p>
        </div>
      </div>
    );
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getNovaAlert = () => {
    if (!analysis.novaGroup) return null;
    
    const novaInfo = {
      1: { color: 'bg-green-50 border-green-200', icon: CheckCircle, text: 'Aliments non transformés', iconColor: 'text-green-600' },
      2: { color: 'bg-blue-50 border-blue-200', icon: Info, text: 'Ingrédients culinaires', iconColor: 'text-blue-600' },
      3: { color: 'bg-yellow-50 border-yellow-200', icon: AlertTriangle, text: 'Aliments transformés', iconColor: 'text-yellow-600' },
      4: { color: 'bg-red-50 border-red-200', icon: XCircle, text: 'Aliments ultra-transformés', iconColor: 'text-red-600' }
    };

    const info = novaInfo[analysis.novaGroup as keyof typeof novaInfo];
    if (!info) return null;

    return (
      <div className={`p-4 rounded-lg border ${info.color}`}>
        <div className="flex items-start">
          <info.icon className={`h-5 w-5 mt-0.5 mr-3 ${info.iconColor}`} />
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">Groupe NOVA {analysis.novaGroup}</h4>
            <p className="text-sm text-gray-700 mt-1">{info.text}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderBasicLevel = () => (
    <>
      {/* Résumé principal */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('summary')}
          className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold">Résumé de l'analyse</h3>
          {expandedSections.has('summary') ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
        
        {expandedSections.has('summary') && (
          <div className="mt-4 bg-white rounded-lg p-6">
            {/* Scores principaux */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <ScoreGauge score={analysis.healthScore} label="Santé" color="text-green-500" />
              <ScoreGauge score={analysis.environmentScore} label="Environnement" color="text-blue-500" />
              <ScoreGauge score={analysis.ethicsScore} label="Éthique" color="text-purple-500" />
            </div>

            {/* Score global */}
            <div className="text-center mb-6">
              <div className={`text-4xl font-bold ${
                analysis.overallScore >= 7 ? 'text-green-600' :
                analysis.overallScore >= 5 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {analysis.overallScore.toFixed(1)}/10
              </div>
              <p className="text-gray-600">Score global</p>
            </div>

            {/* Alerte NOVA */}
            {getNovaAlert()}

            {/* Nutri-Score */}
            {analysis.nutriScore && (
              <div className="mt-4 flex items-center justify-center">
                <span className="text-sm text-gray-600 mr-2">Nutri-Score:</span>
                <span className={`px-3 py-1 rounded font-bold text-white ${
                  analysis.nutriScore === 'A' ? 'bg-green-600' :
                  analysis.nutriScore === 'B' ? 'bg-green-500' :
                  analysis.nutriScore === 'C' ? 'bg-yellow-500' :
                  analysis.nutriScore === 'D' ? 'bg-orange-500' : 'bg-red-600'
                }`}>
                  {analysis.nutriScore}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Teaser Premium */}
      {userTier === 'free' && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
          <div className="flex items-start">
            <Sparkles className="h-6 w-6 text-purple-600 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2">
                Débloquez l'analyse complète
              </h4>
              <ul className="text-sm text-gray-700 space-y-1 mb-4">
                <li>• Détail des additifs et leur impact santé</li>
                <li>• {analysis.alternatives?.length || 10}+ alternatives plus saines</li>
                <li>• Export PDF de l'analyse</li>
                <li>• Chat avec notre IA nutritionniste</li>
              </ul>
              <button
                onClick={onUpgrade}
                className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                Passer à Premium (2,49€/mois)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderDetailedLevel = () => (
    <>
      {renderBasicLevel()}
      
      {/* Additifs */}
      {analysis.additives && analysis.additives.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => toggleSection('additives')}
            className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold">
              Additifs ({analysis.additives.length})
            </h3>
            {expandedSections.has('additives') ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          {expandedSections.has('additives') && (
            <div className="mt-4 bg-white rounded-lg p-6">
              {userTier === 'free' ? (
                <div className="relative">
                  <div className="filter blur-sm">
                    {analysis.additives.slice(0, 3).map((additive, index) => (
                      <div key={index} className="mb-3 p-3 bg-gray-50 rounded">
                        <span className="font-medium">{additive.code}</span>
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
                    <div className="text-center">
                      <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Contenu Premium</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {analysis.additives.map((additive, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${
                      additive.risk === 'high' ? 'bg-red-50 border-red-200' :
                      additive.risk === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-medium">{additive.code}</span>
                          <span className="ml-2 text-sm text-gray-700">{additive.name}</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          additive.risk === 'high' ? 'bg-red-200 text-red-800' :
                          additive.risk === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-green-200 text-green-800'
                        }`}>
                          {additive.risk === 'high' ? 'Risque élevé' :
                           additive.risk === 'medium' ? 'Risque modéré' : 'Faible risque'}
                        </span>
                      </div>
                      {additive.description && (
                        <p className="text-sm text-gray-600 mt-1">{additive.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Alternatives (3 max pour free) */}
      {analysis.alternatives && analysis.alternatives.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => toggleSection('alternatives')}
            className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold">
              Alternatives recommandées
            </h3>
            {expandedSections.has('alternatives') ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          {expandedSections.has('alternatives') && (
            <div className="mt-4 bg-white rounded-lg p-6">
              <div className="grid gap-4">
                {analysis.alternatives.slice(0, userTier === 'free' ? 3 : undefined).map((alt, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{alt.name}</h4>
                        <p className="text-sm text-gray-600">{alt.brand}</p>
                        <p className="text-sm text-green-600 mt-1">{alt.improvement}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{alt.score}</div>
                        <div className="text-xs text-gray-500">/10</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {userTier === 'free' && analysis.alternatives.length > 3 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    + {analysis.alternatives.length - 3} autres alternatives
                  </p>
                  <button
                    onClick={onUpgrade}
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                  >
                    Voir toutes les alternatives →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );

  const renderExpertLevel = () => (
    <>
      {renderDetailedLevel()}
      
      {/* Actions Premium */}
      {userTier === 'premium' && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-2 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
            <Download className="h-5 w-5 text-gray-600" />
            <span className="font-medium">Exporter PDF</span>
          </button>
          <button className="flex items-center justify-center gap-2 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
            <MessageSquare className="h-5 w-5 text-gray-600" />
            <span className="font-medium">Chat IA</span>
          </button>
        </div>
      )}

      {/* Sources */}
      {analysis.sources && analysis.sources.length > 0 && userTier === 'premium' && (
        <div className="mt-6">
          <button
            onClick={() => toggleSection('sources')}
            className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold">Sources scientifiques</h3>
            {expandedSections.has('sources') ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          {expandedSections.has('sources') && (
            <div className="mt-4 bg-white rounded-lg p-6">
              <ul className="space-y-2">
                {analysis.sources.map((source, index) => (
                  <li key={index} className="text-sm">
                    <a 
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {source.name}
                    </a>
                    <span className="text-gray-500 ml-2">({source.type})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  );

  // Rendu selon le niveau
  const renderContent = () => {
    switch (level) {
      case 'expert':
        return renderExpertLevel();
      case 'detailed':
        return renderDetailedLevel();
      default:
        return renderBasicLevel();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{analysis.name}</h2>
        {analysis.brand && (
          <p className="text-gray-600">{analysis.brand}</p>
        )}
      </div>

      {renderContent()}
    </div>
  );
}