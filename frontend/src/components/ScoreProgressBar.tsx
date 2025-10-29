import React from 'react';

interface ScoreProgressBarProps {
  score: number | null;
  onRequestScore?: () => void;
  isAnalyzing?: boolean;
}

export const ScoreProgressBar: React.FC<ScoreProgressBarProps> = ({ 
  score, 
  onRequestScore,
  isAnalyzing 
}) => {
  const getScoreLabel = (score: number): string => {
    if (score >= 76) return 'Excellent';
    if (score >= 56) return 'Bon';
    if (score >= 36) return 'Passable';
    return 'Mauvais';
  };

  const getScoreColor = (score: number): string => {
    if (score >= 76) return 'bg-green-600';
    if (score >= 56) return 'bg-green-500';
    if (score >= 36) return 'bg-orange-500';
    return 'bg-red-600';
  };

  // Cas : Score non calcul
  if (score === null || score === undefined) {
    return (
      <div className="mt-4 w-full">
        <div className="relative w-full h-8 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gray-400 w-0" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-semibold text-gray-600 text-sm">
              Produit non valu
            </span>
          </div>
        </div>
        
        {onRequestScore && (
          <div className="mt-3 text-center">
            <button
              onClick={onRequestScore}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed inline-flex items-center gap-2"
              aria-label="Lancer l'analyse IA pour calculer le score de ce produit"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyse en cours...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Obtenir un score IA
                </>
              )}
            </button>
            <p className="text-xs text-neutral-700 mt-2">
              Utilisez l'IA pour analyser ce produit et obtenir un score
            </p>
          </div>
        )}
        
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span className="text-red-600 font-medium">0 Mauvais</span>
          <span className="text-orange-500 font-medium">36 Passable</span>
          <span className="text-green-500 font-medium">56 Bon</span>
          <span className="text-green-700 font-medium">76 Excellent</span>
        </div>
      </div>
    );
  }

  // Cas : Score calcul (affichage normal)
  return (
    <div className="mt-4 w-full">
      <div className="relative w-full h-8 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={'h-full transition-all duration-500 ease-out ' + getScoreColor(score)}
          style={{ width: score + '%' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-bold text-white text-sm drop-shadow-md">
            {score}/100 - {getScoreLabel(score)}
          </span>
        </div>
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-600">
        <span className="text-red-600 font-medium">0 Mauvais</span>
        <span className="text-orange-500 font-medium">36 Passable</span>
        <span className="text-green-500 font-medium">56 Bon</span>
        <span className="text-green-700 font-medium">76 Excellent</span>
      </div>

      {/* ? Bouton enrichissement IA mme si score existe */}
      {onRequestScore && (
        <div className="mt-3 text-center">
          <button
            onClick={onRequestScore}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed inline-flex items-center gap-2 text-sm"
            aria-label="Amliorer le score avec l'IA"
          >
            {isAnalyzing ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enrichissement en cours...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Amliorer avec IA
              </>
            )}
          </button>
          <p className="text-xs text-gray-600 mt-2">
            Enrichir les donnes manquantes avec l'IA
          </p>
        </div>
      )}
    </div>
  );
};