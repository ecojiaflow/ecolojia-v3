import React from 'react';
import { Users, Euro } from 'lucide-react';

interface Step1Props {
  budget: number;
  people: number;
  onBudgetChange: (value: number) => void;
  onPeopleChange: (value: number) => void;
}

export const Step1BudgetPersonnes: React.FC<Step1Props> = ({
  budget,
  people,
  onBudgetChange,
  onPeopleChange
}) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Configurons votre budget
        </h2>
        <p className="text-gray-600">
          Definissez votre budget hebdomadaire et le nombre de personnes
        </p>
      </div>

      {/* Budget Slider */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-lg font-medium text-gray-700">
            <Euro className="text-green-600" size={24} />
            Budget hebdomadaire
          </label>
          <div className="text-right">
            <span className="text-3xl font-bold text-green-600">{budget}</span>
            <span className="text-xl text-gray-500 ml-1">EUR</span>
          </div>
        </div>

        <input
          type="range"
          min="20"
          max="200"
          step="5"
          value={budget}
          onChange={(e) => onBudgetChange(Number(e.target.value))}
          className="w-full h-3 bg-gradient-to-r from-green-200 to-green-400 rounded-lg appearance-none cursor-pointer slider-thumb"
        />

        <div className="flex justify-between text-sm text-gray-500">
          <span>20 EUR</span>
          <span>200 EUR</span>
        </div>

        {/* Budget guidance */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          {budget < 50 && "Budget economique - Favorisera les produits de base"}
          {budget >= 50 && budget < 100 && "Budget equilibre - Large choix de produits"}
          {budget >= 100 && "Budget confortable - Ingredients premium possibles"}
        </div>
      </div>

      {/* People Selector */}
      <div className="space-y-4">
        <label className="flex items-center gap-2 text-lg font-medium text-gray-700">
          <Users className="text-blue-600" size={24} />
          Nombre de personnes
        </label>

        <div className="grid grid-cols-4 gap-2 md:gap-3">
          {[1, 2, 3, 4].map((num) => (
            <button
              key={num}
              onClick={() => onPeopleChange(num)}
              className={`
                py-4 md:py-6 rounded-xl font-bold text-lg md:text-xl transition-all transform active:scale-95
                ${people === num 
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg scale-105' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              {num}
            </button>
          ))}
        </div>

        {people > 1 && (
          <p className="text-center text-sm text-gray-600">
            Budget par personne: <strong>{Math.round(budget / people)} EUR</strong>
          </p>
        )}
      </div>

      <style>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #10b981, #3b82f6);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: transform 0.2s;
        }
        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        .slider-thumb::-webkit-slider-thumb:active {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};