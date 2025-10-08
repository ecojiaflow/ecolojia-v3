import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, AlertTriangle, Leaf, Zap } from 'lucide-react';

interface VisionResult {
  success: boolean;
  source: 'google' | 'stub';
  ingredients: string[];
  warnings: string[];
  rawText: string;
  confidence?: number;
}

interface OCRPanelProps {
  result: VisionResult;
  className?: string;
}

export function OCRPanel({ result, className = '' }: OCRPanelProps) {
  const [showRawText, setShowRawText] = useState(false);

  if (!result.success) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle size={20} />
          <span className="font-medium">Erreur d'analyse</span>
        </div>
        <p className="text-red-600 text-sm mt-2">
          Impossible d'analyser l'image. Veuillez réessayer avec une image plus claire.
        </p>
      </div>
    );
  }

  const sourceLabel = {
    google: 'Google Vision API',
    stub: 'Analyse locale'
  }[result.source];

  const confidenceColor = result.confidence && result.confidence > 0.8 
    ? 'text-green-700' 
    : result.confidence && result.confidence > 0.6 
    ? 'text-orange-600' 
    : 'text-red-600';

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 rounded-t-lg border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="text-blue-600" size={20} />
            <h3 className="font-semibold text-gray-900">Texte extrait de l'image</h3>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
              {sourceLabel}
            </span>
            {result.confidence && (
              <span className={`font-medium ${confidenceColor}`}>
                {Math.round(result.confidence * 100)}%
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Ingrédients */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Leaf className="text-green-700" size={18} />
            <h4 className="font-medium text-gray-900">
              Ingrédients détectés ({result.ingredients.length})
            </h4>
          </div>
          
          {result.ingredients.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {result.ingredients.map((ingredient, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm border border-green-200"
                >
                  {ingredient}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">
              Aucun ingrédient détecté automatiquement
            </p>
          )}
        </div>

        {/* Avertissements/Allergènes */}
        {result.warnings.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="text-orange-600" size={18} />
              <h4 className="font-medium text-gray-900">
                Allergènes et avertissements ({result.warnings.length})
              </h4>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {result.warnings.map((warning, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm border border-orange-200 flex items-center gap-1"
                >
                  <Zap size={12} />
                  {warning}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Texte brut (accordéon) */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => setShowRawText(!showRawText)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 rounded-lg transition-colors"
          >
            <span className="font-medium text-gray-900">Texte complet extrait</span>
            {showRawText ? (
              <ChevronUp className="text-gray-500" size={20} />
            ) : (
              <ChevronDown className="text-gray-500" size={20} />
            )}
          </button>
          
          {showRawText && (
            <div className="px-4 pb-4 border-t border-gray-200">
              <div className="bg-gray-50 rounded-lg p-3 mt-3">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                  {result.rawText || 'Aucun texte brut disponible'}
                </pre>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Ce texte peut contenir des erreurs de reconnaissance. 
                Vérifiez les informations importantes sur l'emballage original.
              </div>
            </div>
          )}
        </div>

        {/* Footer informatif */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-700 text-sm">
            💡 <strong>Conseil :</strong> Pour une meilleure précision, utilisez des images nettes 
            avec un bon éclairage et assurez-vous que la liste d'ingrédients est bien visible.
          </p>
        </div>
      </div>
    </div>
  );
}
