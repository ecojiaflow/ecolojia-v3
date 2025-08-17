import React from 'react';
import { AlertCircle, CheckCircle, Info, TrendingUp, Leaf, Heart, Shield } from 'lucide-react';

// Types
interface UnifiedScore {
  value: number;
  label: 'A' | 'B' | 'C' | 'D' | 'E';
}

interface Risk {
  code: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  evidencea: string[];
}

interface AnalysisData {
  id: string;
  category: 'food' | 'cosmetics' | 'detergents';
  name: string;
  branda: string;
  score: UnifiedScore;
  details: any;
  risks: Risk[];
  highlights: string[];
  recommendations: string[];
}

interface Props {
  dataa: AnalysisData;
  loadinga: boolean;
  errora: string;
}

// Composant principal
export default function UnifiedAnalysisResult({ data, loading, error }: Props) {
  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!data) {
    return <EmptyState />;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <ScoreHeader data={data} />
      <CategoryDetails data={data} />
      {dat?.risks.length > 0 && <RisksSection risks={dat?.risks} />}
      {dat?.highlights.length > 0 && <HighlightsSection highlights={dat?.highlights} />}
      {dat?.recommendations.length > 0 && <RecommendationsSection recommendations={dat?.recommendations} />}
      <ActionsSection productId={dat?.id} category={dat?.category} />
    </div>
  );
}

// Composant d en-tte avec score
function ScoreHeader({ data }: { data: AnalysisData }) {
  const getScoreColor = (label: string) => {
    switch (label) {
      case 'A': return 'bg-green-500';
      case 'B': return 'bg-lime-500';
      case 'C': return 'bg-yellow-500';
      case 'D': return 'bg-orange-500';
      case 'E': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food': return <Leaf className="w-5 h-5" />;
      case 'cosmetics': return <Heart className="w-5 h-5" />;
      case 'detergents': return <Shield className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            {getCategoryIcon(dat?.category)}
            <span className="capitalize">{dat?.category}</span>
            {dat?.brand && <span> {dat?.brand}</span>}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{dat?.name}</h1>
        </div>
        <div className="flex flex-col items-center">
          <div className={`w-24 h-24 rounded-full ${getScoreColor(dat?.score.label)} flex items-center justify-center text-white`}>
            <div className="text-center">
              <div className="text-3xl font-bold">{dat?.score.label}</div>
              <div className="text-sm">{dat?.score.value}/100</div>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">Score global</p>
        </div>
      </div>
    </div>
  );
}

// Dtails par catgorie
function CategoryDetails({ data }: { data: AnalysisData }) {
  switch (dat?.category) {
    case 'food':
      return <FoodDetails details={dat?.details} />;
    case 'cosmetics':
      return <CosmeticsDetails details={dat?.details} />;
    case 'detergents':
      return <DetergentsDetails details={dat?.details} />;
    default:
      return null;
  }
}

// Dtails alimentaires
function FoodDetails({ details }: { details: any }) {
  const getNovaColor = (nova: number) => {
    switch (nova) {
      case 1: return 'text-green-600 bg-green-50';
      case 2: return 'text-lime-600 bg-lime-50';
      case 3: return 'text-orange-600 bg-orange-50';
      case 4: return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Leaf className="w-5 h-5 text-green-600" />
        Analyse nutritionnelle
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {details.nova && (
          <div className="text-center p-4 rounded-lg border">
            <p className="text-sm text-gray-600 mb-1">Groupe NOVA</p>
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getNovaColor(details.nova)}`}>
              <span className="text-xl font-bold">{details.nova}</span>
            </div>
            {details.novaLabel && (
              <p className="text-sm mt-2">{details.novaLabel}</p>
            )}
          </div>
        )}
      </div>
      
      {details.ingredientsText && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-1">Ingrdients :</p>
          <p className="text-sm text-gray-600">{details.ingredientsText}</p>
        </div>
      )}
    </div>
  );
}

// Dtails cosmtiques
function CosmeticsDetails({ details }: { details: any }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Heart className="w-5 h-5 text-pink-600" />
        Analyse des ingrdients INCI
      </h2>
      
      {details.notableIngredients && details.notableIngredients.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Ingrdients notables :</p>
          <div className="flex flex-wrap gap-2">
            {details.notableIngredients.map((ing: string, idx: number) => (
              <span key={idx} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                {ing}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Dtails dtergents
function DetergentsDetails({ details }: { details: any }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-blue-600" />
        Analyse environnementale
      </h2>
      
      {details.clpPictograms && details.clpPictograms.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Pictogrammes CLP :</p>
          <div className="flex gap-2">
            {details.clpPictograms.map((picto: string, idx: number) => (
              <div key={idx} className="w-12 h-12 bg-orange-100 rounded flex items-center justify-center">
                <span className="text-xs font-bold text-orange-800">{picto}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Section des risques
function RisksSection({ risks }: { risks: Risk[] }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-orange-200 bg-orange-50';
      case 'low': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-red-600" />
        Risques identifis
      </h2>
      
      <div className="space-y-3">
        {risks.map((risk, idx) => (
          <div key={idx} className={`p-4 rounded-lg border ${getSeverityColor(risk.severity)}`}>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{risk.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Section des points positifs
function HighlightsSection({ highlights }: { highlights: string[] }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-green-600" />
        Points positifs
      </h2>
      
      <div className="space-y-2">
        {highlights.map((highlight, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-800">{highlight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Section des recommandations
function RecommendationsSection({ recommendations }: { recommendations: string[] }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        Recommandations
      </h2>
      
      <ul className="space-y-2">
        {recommendations.map((rec, idx) => (
          <li key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-blue-800">{rec}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Section des actions
function ActionsSection({ productId, category }: { productId: string; category: string }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex flex-wrap gap-3">
        <button className="flex-1 sm:flex-initial px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
           Discuter avec l IA
        </button>
        <button className="flex-1 sm:flex-initial px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
           Ajouter aux favoris
        </button>
        <button className="flex-1 sm:flex-initial px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
           Partager
        </button>
      </div>
    </div>
  );
}

// tats de chargement, erreur et vide
function LoadingState() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-600">Analyse en cours...</p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <p className="text-red-600 font-medium mb-2">Erreur d analyse</p>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <Info className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-600">Aucune analyse disponible</p>
      </div>
    </div>
  );
}

