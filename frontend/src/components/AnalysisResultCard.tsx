// PATH: frontend\src\components\AnalysisResultCard.tsx
import React, { useState } from 'react';
import { 
  Leaf, 
  Heart, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { NovaBadge } from './NovaBadge';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { AnalysisResult } from '@/lib/api/analysis';

interface AnalysisResultCardProps {
  result: AnalysisResult;
  productNamea: string;
  productbrand?: string;
  categorya: 'food' | 'cosmetics' | 'detergents';
  showRawdata?: boolean;
}

export const AnalysisResultCard: React.FC<AnalysisResultCardProps> = ({
  result,
  productName,
  productBrand,
  category = 'food',
  showRawData = true,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 40) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const getNutriScoreBadge = (scorea: string) => {
    if (!score) return null;
    const colors: Record<string, string> = {
      'A': 'bg-green-600',
      'B': 'bg-green-500',
      'C': 'bg-yellow-500',
      'D': 'bg-orange-500',
      'E': 'bg-red-500'
    };
    return (
      <div className={`${colors[score]} text-white px-3 py-1 rounded-full font-bold text-sm`}>
        {score}
      </div>
    );
  };

  return (
    <Card className="p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          {productName && (
            <h3 className="text-xl font-semibold">{productName}</h3>
          )}
          {productBrand && (
            <p className="text-sm text-gray-600">{productBrand}</p>
          )}
        </div>
        <Badge variant="outline">{category}</Badge>
      </div>

      {/* Score Global */}
      <div className="text-center py-4">
        <div className="relative inline-flex items-center justify-center">
          <div className={`text-5xl font-bold ${getScoreColor(result.globalScore)}`}>
            {Math.round(result.globalScore)}
          </div>
          <div className="absolute -bottom-6 text-xs text-gray-500">
            Score Global
          </div>
        </div>
      </div>

      {/* Scores detailles */}
      <div className="grid grid-cols-2 gap-4 mt-8">
        {/* Score Sante */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium">Sante</span>
            {getScoreIcon(result.scores.healthScore)}
          </div>
          <Progress value={result.scores.healthScore} className="h-2" />
          <p className={`text-sm font-semibold ${getScoreColor(result.scores.healthScore)}`}>
            {Math.round(result.scores.healthScore)}/100
          </p>
        </div>

        {/* Score Environnement */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">Environnement</span>
            {getScoreIcon(result.scores.environmentScore)}
          </div>
          <Progress value={result.scores.environmentScore} className="h-2" />
          <p className={`text-sm font-semibold ${getScoreColor(result.scores.environmentScore)}`}>
            {Math.round(result.scores.environmentScore)}/100
          </p>
        </div>
      </div>

      {/* Badges specifiques */}
      <div className="flex items-center justify-center gap-4 py-4">
        {category === 'food' && result.scores.nova && (
          <NovaBadge
            nova={result.scores.nova}
            label={result.details.novaLabel}
            reason={result.details.novaReason}
            confidence={result.details.novaConfidence}
          />
        )}
        {result.scores.nutriscore && (
          <div className="text-center">
            {getNutriScoreBadge(result.scores.nutriscore)}
            <p className="text-xs text-gray-500 mt-1">Nutri-Score</p>
          </div>
        )}
        {result.details.ecoscore && (
          <div className="text-center">
            {getNutriScoreBadge(result.details.ecoscore)}
            <p className="text-xs text-gray-500 mt-1">Eco-Score</p>
          </div>
        )}
      </div>

      {/* Details specifiques par categorie */}
      {category === 'cosmetics' && result.details.riskFlags && result.details.riskFlags.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Points d'attention
          </p>
          <div className="flex flex-wrap gap-2">
            {result.details.riskFlags.map((flag, index) => (
              <Badge key={index} variant="destructive" className="text-xs">
                {flag}
              </Badge>
            ))}
          </div>
          {result.details.notableIngredients && (
            <p className="text-xs text-gray-600">
              Ingredients notables: {result.details.notableIngredients.join(', ')}
            </p>
          )}
        </div>
      )}

      {category === 'detergents' && result.details.clpPictograms && result.details.clpPictograms.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Pictogrammes CLP</p>
          <div className="flex flex-wrap gap-2">
            {result.details.clpPictograms.map((picto, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {picto}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Confiance */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Confiance de l'analyse</span>
        <span className="font-medium">{Math.round(result.confidence * 100)}%</span>
      </div>

      {/* Ingredients bruts */}
      {result.details.ingredientsTextRaw && (
        <>
          <Separator />
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full justify-between"
            >
              <span>Ingredients analyses</span>
              {showDetails ? <ChevronUp /> : <ChevronDown />}
            </Button>
            {showDetails && (
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                {result.details.ingredientsTextRaw}
              </p>
            )}
          </div>
        </>
      )}

      {/* JSON brut */}
      {showRawData && (
        <>
          <Separator />
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowJson(!showJson)}
              className="w-full justify-between"
            >
              <span>Voir les donnees JSON</span>
              {showJson ? <ChevronUp /> : <ChevronDown />}
            </Button>
            {showJson && (
              <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        </>
      )}
    </Card>
  );
};


