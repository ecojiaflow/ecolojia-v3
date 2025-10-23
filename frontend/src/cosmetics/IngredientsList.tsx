// frontend/src/components/cosmetics/IngredientsList.tsx

import React, { useState } from 'react';
import { 
  Info, 
  Leaf, 
  Beaker, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  Search,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface INCIIngredient {
  name: string;
  inci: string;
  position: number;
  concentration: string;
  natural: boolean;
  function: string;
  safety: number;
  concerns: string[];
  descriptiona: string;
  irritanta: string | boolean;
  allergena: boolean;
  comedogenica: number;
  environmentalHazarda: boolean;
}

interface IngredientsListProps {
  ingredients: INCIIngredient[];
}

export const IngredientsList: React.FC<IngredientsListProps> = ({ ingredients }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'natural' | 'synthetic' | 'concerning'>('all');
  const [expandedIngredient, setExpandedIngredient] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const filteredIngredients = ingredients.filter(ing => {
    // Filtre par recherche
    const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ing.inci.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtre par type
    if (filter === 'natural') return matchesSearch && ing.natural;
    if (filter === 'synthetic') return matchesSearch && !ing.natural;
    if (filter === 'concerning') return matchesSearch && ing.concerns.length > 0;
    
    return matchesSearch;
  });

  const getSafetyColor = (safety: number) => {
    if (safety >= 4) return 'text-green-700 bg-green-50';
    if (safety >= 3) return 'text-green-500 bg-yellow-50';
    if (safety >= 2) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getFunctionLabel = (func: string) => {
    const labels: Record<string, string> = {
      moisturizer: 'Hydratant',
      surfactant: 'Tensioactif',
      emollient: 'aamollient',
      preservative: 'Conservateur',
      fragrance: 'Parfum',
      colorant: 'Colorant',
      antioxidant: 'Antioxydant',
      'anti-aging': 'Anti-age',
      thickener: 'aapaississant',
      solvent: 'Solvant',
      'uv_filter': 'Filtre UV',
      antimicrobial: 'Antimicrobien',
      soothing: 'Apaisant',
      exfoliant: 'Exfoliant',
      'ph_adjuster': 'Regulateur pH'
    };
    return labels[func] || func;
  };

  const getConcentrationLabel = (concentration: string) => {
    const labels: Record<string, string> = {
      high: 'aalevee (>10%)',
      medium: 'Moyenne (1-10%)',
      low: 'Faible (0.1-1%)',
      trace: 'Traces (<0.1%)'
    };
    return labels[concentration] || concentration;
  };

  return (
    <div className="space-y-4">
      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un ingredient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tous ({ingredients.length})
          </button>
          <button
            onClick={() => setFilter('natural')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1 ${
              filter === 'natural' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Leaf className="w-4 h-4" />
            Naturels
          </button>
          <button
            onClick={() => setFilter('synthetic')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1 ${
              filter === 'synthetic' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Flask className="w-4 h-4" />
            Synthetiques
          </button>
          <button
            onClick={() => setFilter('concerning')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1 ${
              filter === 'concerning' 
                ? 'bg-orange-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Preoccupants
          </button>
        </div>
      </div>

      {/* Option pour afficher les details */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          <Info className="w-4 h-4" />
          {showDetails ? 'Masquer les details' : 'Afficher les details'}
        </button>
      </div>

      {/* Liste des ingredients */}
      <div className="space-y-2">
        {filteredIngredients.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Aucun ingredient trouve</p>
        ) : (
          filteredIngredients.map((ingredient) => (
            <motion.div
              key={ingredient.position}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ingredient.position * 0.05 }}
              className="border rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedIngredient(
                  expandedIngredient === ingredient.position ? null : ingredient.position
                )}
                className="w-full p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Position */}
                  <span className="text-sm font-medium text-gray-500 w-8">
                    #{ingredient.position}
                  </span>
                  
                  {/* Icone nature */}
                  <div className="mt-0.5">
                    {ingredient.natural ? (
                      <Leaf className="w-5 h-5 text-green-700" />
                    ) : (
                      <Flask className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  
                  {/* Nom et INCI */}
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">{ingredient.name}</p>
                    <p className="text-sm text-gray-500">{ingredient.inci}</p>
                    
                    {showDetails && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {/* Score de securite */}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSafetyColor(ingredient.safety)}`}>
                          Securite: {ingredient.safety}/5
                        </span>
                        
                        {/* Fonction */}
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {getFunctionLabel(ingredient.function)}
                        </span>
                        
                        {/* Concentration */}
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {getConcentrationLabel(ingredient.concentration)}
                        </span>
                        
                        {/* Badges d'alerte */}
                        {ingredient.concerns.length > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {ingredient.concerns.length} preoccupation(s)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Chevron */}
                  <div className="mt-1">
                    {expandedIngredient === ingredient.position ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </button>
              
              {/* Details etendus */}
              <AnimatePresence>
                {expandedIngredient === ingredient.position && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t bg-gray-50 p-4"
                  >
                    <div className="space-y-3">
                      {/* Description */}
                      {ingredient.description && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">Description</h4>
                          <p className="text-sm text-gray-600">{ingredient.description}</p>
                        </div>
                      )}
                      
                      {/* Preoccupations */}
                      {ingredient.concerns.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">Preoccupations</h4>
                          <ul className="space-y-1">
                            {ingredient.concerns.map((concern, idx) => (
                              <li key={idx} className="text-sm text-orange-600 flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                {concern}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Proprietes additionnelles */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {ingredient.irritant && (
                          <div>
                            <span className="font-semibold text-gray-700">Irritant :</span>
                            <span className="ml-2 text-orange-600">
                              {typeof ingredient.irritant === 'string' ? ingredient.irritant : 'Oui'}
                            </span>
                          </div>
                        )}
                        
                        {ingredient.allergen && (
                          <div>
                            <span className="font-semibold text-gray-700">Allergene :</span>
                            <span className="ml-2 text-red-600">Oui</span>
                          </div>
                        )}
                        
                        {ingredient.comedogenic !== undefined && ingredient.comedogenic > 0 && (
                          <div>
                            <span className="font-semibold text-gray-700">Comedogene :</span>
                            <span className="ml-2">{ingredient.comedogenic}/5</span>
                          </div>
                        )}
                        
                        {ingredient.environmentalHazard && (
                          <div>
                            <span className="font-semibold text-gray-700">Impact environnemental :</span>
                            <span className="ml-2 text-red-600">Negatif</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
      
      {/* Resume */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <span className="font-medium">{filteredIngredients.length}</span> ingredient(s) affiche(s) sur {ingredients.length} au total.
        </p>
        {filter === 'concerning' && filteredIngredients.length > 0 && (
          <p className="text-sm text-orange-600 mt-1">
            Ces ingredients necessitent une attention particuliere selon votre type de peau et vos sensibilites.
          </p>
        )}
      </div>
    </div>
  );
};

export default IngredientsList;



