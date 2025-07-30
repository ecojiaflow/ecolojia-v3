// src/components/ui/LoadingStates.tsx
import React from 'react';

export const AnalysisLoadingStates = {
  scanning: {
    icon: "📱",
    title: "Scan en cours...",
    message: "Lecture du code-barres",
    duration: "~2 secondes"
  },
  searching: {
    icon: "🔍", 
    title: "Recherche du produit...",
    message: "Consultation de notre base de données",
    duration: "~3 secondes"
  },
  analyzing: {
    icon: "🧬",
    title: "Analyse IA en cours...",
    message: "Classification scientifique des ingrédients",
    duration: "~5 secondes"
  },
  finalizing: {
    icon: "✨",
    title: "Finalisation...",
    message: "Calcul du score santé et recommandations",
    duration: "~2 secondes"
  }
};

interface SmartLoadingProps {
  stage: keyof typeof AnalysisLoadingStates;
  progress: number; // 0-100
  category: 'food' | 'cosmetics' | 'detergents';
}

export const SmartLoading: React.FC<SmartLoadingProps> = ({ stage, progress, category }) => {
  const currentState = AnalysisLoadingStates[stage];
  
  const categoryMessages = {
    food: {
      analyzing: "Classification NOVA et détection ultra-transformation..."
    },
    cosmetics: {
      analyzing: "Détection perturbateurs endocriniens et allergènes..."
    },
    detergents: {
      analyzing: "Évaluation impact environnemental et toxicité..."
    }
  };

  return (
    <div className="smart-loading bg-white rounded-xl p-8 shadow-lg max-w-md mx-auto">
      {/* Animation icon */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-4 animate-bounce">
          {currentState.icon}
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {currentState.title}
        </h3>
        <p className="text-gray-600 text-sm">
          {categoryMessages[category]?.[stage] || currentState.message}
        </p>
      </div>

      {/* Barre de progression intelligente */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Progression</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Étapes process */}
      <div className="space-y-2">
        {Object.entries(AnalysisLoadingStates).map(([key, state], index) => {
          const isActive = key === stage;
          const isCompleted = Object.keys(AnalysisLoadingStates).indexOf(key) < Object.keys(AnalysisLoadingStates).indexOf(stage);
          
          return (
            <div key={key} className={`flex items-center space-x-3 p-2 rounded ${
              isActive ? 'bg-blue-50 border border-blue-200' :
              isCompleted ? 'bg-green-50' : 'bg-gray-50'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                isCompleted ? 'bg-green-500 text-white' :
                isActive ? 'bg-blue-500 text-white animate-pulse' :
                'bg-gray-300 text-gray-600'
              }`}>
                {isCompleted ? '✓' : index + 1}
              </div>
              <div className="flex-1">
                <div className={`text-sm font-medium ${
                  isActive ? 'text-blue-700' :
                  isCompleted ? 'text-green-700' :
                  'text-gray-500'
                }`}>
                  {state.title}
                </div>
                {isActive && (
                  <div className="text-xs text-gray-500">
                    {state.duration}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Message d'encouragement */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          ⚡ Analyse scientifique en temps réel
        </p>
      </div>
    </div>
  );
};

// Hook pour gérer la progression automatique
export const useAnalysisProgress = (category: 'food' | 'cosmetics' | 'detergents') => {
  const [stage, setStage] = React.useState<keyof typeof AnalysisLoadingStates>('scanning');
  const [progress, setProgress] = React.useState(0);

  const simulateAnalysis = React.useCallback(async () => {
    // Scanning
    setStage('scanning');
    for (let i = 0; i <= 25; i += 5) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Searching  
    setStage('searching');
    for (let i = 25; i <= 50; i += 5) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    // Analyzing (plus long)
    setStage('analyzing');
    for (let i = 50; i <= 85; i += 3) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Finalizing
    setStage('finalizing');
    for (let i = 85; i <= 100; i += 5) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }, []);

  return { stage, progress, simulateAnalysis };
};