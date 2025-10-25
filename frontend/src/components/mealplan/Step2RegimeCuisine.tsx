import React from 'react';
import { Leaf, Fish, Apple, Zap, Clock, ChefHat } from 'lucide-react';

interface Step2Props {
  dietType: string;
  cookingTime: string;
  onDietChange: (value: string) => void;
  onCookingTimeChange: (value: string) => void;
}

const dietOptions = [
  {
    value: 'balanced',
    label: 'Equilibre',
    description: 'Viandes, poissons, legumes',
    icon: Fish,
    color: 'blue'
  },
  {
    value: 'vegetarian',
    label: 'Vegetarien',
    description: 'Sans viande ni poisson',
    icon: Leaf,
    color: 'green'
  },
  {
    value: 'vegan',
    label: 'Vegetalien',
    description: 'Aucun produit animal',
    icon: Apple,
    color: 'emerald'
  },
  {
    value: 'low-carb',
    label: 'Low-Carb',
    description: 'Faible en glucides',
    icon: Zap,
    color: 'orange'
  }
];

const cookingOptions = [
  {
    value: 'quick',
    label: 'Rapide',
    description: '< 30 min',
    icon: Zap,
    gradient: 'from-red-400 to-orange-400'
  },
  {
    value: 'medium',
    label: 'Modere',
    description: '30-60 min',
    icon: Clock,
    gradient: 'from-blue-400 to-cyan-400'
  },
  {
    value: 'elaborate',
    label: 'Elabore',
    description: '> 60 min',
    icon: ChefHat,
    gradient: 'from-purple-400 to-pink-400'
  }
];

export const Step2RegimeCuisine: React.FC<Step2Props> = ({
  dietType,
  cookingTime,
  onDietChange,
  onCookingTimeChange
}) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Preferences alimentaires
        </h2>
        <p className="text-gray-600">
          Choisissez votre regime et temps de preparation
        </p>
      </div>

      {/* Diet Type Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Type de regime</h3>
        
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {dietOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = dietType === option.value;
            
            return (
              <button
                key={option.value}
                onClick={() => onDietChange(option.value)}
                className={`
                  relative p-4 md:p-5 rounded-xl border-2 transition-all transform active:scale-95
                  ${isSelected 
                    ? `border-${option.color}-500 bg-${option.color}-50 shadow-lg scale-105` 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }
                `}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className={`
                    p-3 rounded-full transition-colors
                    ${isSelected 
                      ? `bg-${option.color}-500 text-white` 
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{option.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                  </div>
                </div>
                
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className={`w-6 h-6 rounded-full bg-${option.color}-500 flex items-center justify-center`}>
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cooking Time Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Temps de preparation</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {cookingOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = cookingTime === option.value;
            
            return (
              <button
                key={option.value}
                onClick={() => onCookingTimeChange(option.value)}
                className={`
                  relative p-4 rounded-xl border-2 transition-all transform active:scale-95
                  ${isSelected 
                    ? 'border-transparent shadow-lg scale-105' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }
                `}
                style={isSelected ? {
                  background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                  '--tw-gradient-from': option.gradient.split(' ')[0].replace('from-', ''),
                  '--tw-gradient-to': option.gradient.split(' ')[1].replace('to-', '')
                } as any : {}}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    p-2 rounded-lg
                    ${isSelected ? 'bg-white/20' : 'bg-gray-100'}
                  `}>
                    <Icon size={20} className={isSelected ? 'text-white' : 'text-gray-600'} />
                  </div>
                  <div className="text-left">
                    <div className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                      {option.label}
                    </div>
                    <div className={`text-sm ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                      {option.description}
                    </div>
                  </div>
                </div>
                
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                      <svg className="w-3 h-3 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};