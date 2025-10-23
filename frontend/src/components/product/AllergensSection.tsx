import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Allergen {
  name: string;
  riskLevel?: string;
}

interface AllergensSectionProps {
  allergens: Allergen[];
}

const ALLERGEN_LABELS: Record<string, string> = {
  'milk': 'Lait',
  'eggs': 'Œufs',
  'fish': 'Poisson',
  'crustaceans': 'Crustacés',
  'molluscs': 'Mollusques',
  'nuts': 'Fruits à coque',
  'peanuts': 'Arachides',
  'soybeans': 'Soja',
  'celery': 'Céleri',
  'mustard': 'Moutarde',
  'sesame': 'Sésame',
  'sulphites': 'Sulfites',
  'lupin': 'Lupin',
  'gluten': 'Gluten'
};

export const AllergensSection: React.FC<AllergensSectionProps> = ({ allergens }) => {
  if (!allergens || allergens.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <p className="text-sm text-green-800">
          ✅ Aucun allergène majeur déclaré
        </p>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-orange-600" />
        <h3 className="font-bold text-orange-900">Allergènes présents</h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {allergens.map((allergen, idx) => {
          const label = ALLERGEN_LABELS[allergen.name] || allergen.name;
          const isHigh = allergen.riskLevel === 'HIGH';
          
          return (
            <span 
              key={idx}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                isHigh 
                  ? 'bg-red-100 text-red-800 border border-red-300' 
                  : 'bg-orange-100 text-orange-800 border border-orange-300'
              }`}
            >
              {isHigh ? '🚨' : '⚠️'} {label}
            </span>
          );
        })}
      </div>
      
      <p className="text-xs text-gray-600 mt-3">
        Traces possibles non détectées. Vérifiez l'emballage en cas d'allergie sévère.
      </p>
    </div>
  );
};
