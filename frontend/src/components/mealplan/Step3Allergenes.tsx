import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface Step3Props {
  allergens: string[];
  onAllergensChange: (allergens: string[]) => void;
}

const commonAllergens = [
  { value: 'gluten', label: 'Gluten' },
  { value: 'lait', label: 'Lait' },
  { value: 'oeufs', label: 'Oeufs' },
  { value: 'arachides', label: 'Arachides' },
  { value: 'noix', label: 'Fruits a coque' },
  { value: 'soja', label: 'Soja' },
  { value: 'poisson', label: 'Poisson' },
  { value: 'crustaces', label: 'Crustaces' },
  { value: 'celeri', label: 'Celeri' },
  { value: 'moutarde', label: 'Moutarde' },
  { value: 'sesame', label: 'Sesame' },
  { value: 'sulfites', label: 'Sulfites' }
];

export const Step3Allergenes: React.FC<Step3Props> = ({
  allergens,
  onAllergensChange
}) => {
  const [customAllergen, setCustomAllergen] = React.useState('');

  const toggleAllergen = (allergen: string) => {
    if (allergens.includes(allergen)) {
      onAllergensChange(allergens.filter(a => a !== allergen));
    } else {
      onAllergensChange([...allergens, allergen]);
    }
  };

  const addCustomAllergen = () => {
    if (customAllergen.trim() && !allergens.includes(customAllergen.trim().toLowerCase())) {
      onAllergensChange([...allergens, customAllergen.trim().toLowerCase()]);
      setCustomAllergen('');
    }
  };

  const removeAllergen = (allergen: string) => {
    onAllergensChange(allergens.filter(a => a !== allergen));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Allergenes et intolerances
        </h2>
        <p className="text-gray-600">
          Selectionnez vos allergenes pour les exclure automatiquement
        </p>
      </div>

      {/* Alert Box */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
        <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
        <div className="text-sm text-red-800">
          <strong>Important:</strong> Verifiez toujours les etiquettes des produits achetes. 
          Les contaminations croisees peuvent survenir. En cas d'allergie severe, consultez un professionnel.
        </div>
      </div>

      {/* Common Allergens */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Allergenes courants</h3>
        
        <div className="flex flex-wrap gap-2">
          {commonAllergens.map((allergen) => {
            const isSelected = allergens.includes(allergen.value);
            
            return (
              <button
                key={allergen.value}
                onClick={() => toggleAllergen(allergen.value)}
                className={`
                  px-4 py-2.5 rounded-full font-medium transition-all transform active:scale-95
                  min-h-[44px]
                  ${isSelected 
                    ? 'bg-red-500 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {allergen.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Allergen Input */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Ajouter un allergene personnalise</h3>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={customAllergen}
            onChange={(e) => setCustomAllergen(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCustomAllergen()}
            placeholder="Ex: lactose, kiwi..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <button
            onClick={addCustomAllergen}
            disabled={!customAllergen.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
          >
            Ajouter
          </button>
        </div>
      </div>

      {/* Selected Allergens Summary */}
      {allergens.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700">
              Vos allergenes ({allergens.length})
            </h3>
            <button
              onClick={() => onAllergensChange([])}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Tout effacer
            </button>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border border-red-100">
            <div className="flex flex-wrap gap-2">
              {allergens.map((allergen) => (
                <div
                  key={allergen}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-full shadow-sm border border-red-200"
                >
                  <span className="text-sm font-medium text-gray-800 capitalize">
                    {allergen}
                  </span>
                  <button
                    onClick={() => removeAllergen(allergen)}
                    className="p-0.5 hover:bg-red-100 rounded-full transition-colors"
                  >
                    <X size={14} className="text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {allergens.length === 0 && (
        <div className="text-center py-8 text-neutral-700">
          <p>Aucun allergene selectionne</p>
          <p className="text-sm mt-1">Le plan contiendra tous types d'ingredients</p>
        </div>
      )}
    </div>
  );
};