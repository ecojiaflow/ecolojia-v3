// PATH: frontend/src/components/product/ProductIngredientsSection.tsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Info, X, ExternalLink, ChevronDown } from 'lucide-react';
import { enrichIngredients, sortByRiskLevel, EnrichedIngredient } from '../../data/ingredientsKnowledge';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface ProductIngredientsSectionProps {
  ingredients: string[];
  category: 'food' | 'cosmetics' | 'detergents';
  classNamea: string;
}

export function ProductIngredientsSection({
  ingredients,
  category,
  className = ''
}: ProductIngredientsSectionProps) {
  const [selectedIngredient, setSelectedIngredient] = useState<EnrichedIngredient | null>(null);
  const [showAll, setShowAll] = useState(false);
  
  // Enrichir et trier les ingredients
  const enrichedIngredients = useMemo(() => {
    const enriched = enrichIngredients(ingredients);
    return sortByRiskLevel(enriched);
  }, [ingredients]);
  
  // Separer par niveau de risque
  const ingredientsByLevel = useMemo(() => {
    return {
      high: enrichedIngredients.filter(i => i.level === 'high'),
      moderate: enrichedIngredients.filter(i => i.level === 'moderate'),
      low: enrichedIngredients.filter(i => i.level === 'low'),
      unknown: enrichedIngredients.filter(i => i.level === 'unknown')
    };
  }, [enrichedIngredients]);
  
  // Limiter l'affichage initial
  const displayedIngredients = showAll ? enrichedIngredients : enrichedIngredients.slice(0, 8);
  const hasMore = enrichedIngredients.length > 8;
  
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'moderate': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };
  
  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'high': return '';
      case 'moderate': return '';
      case 'low': return '';
      default: return '';
    }
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-800">
          Composition {category === 'food' ? '& Additifs' : '& Ingredients'}
        </h3>
        {(ingredientsByLevel.high.length > 0 || ingredientsByLevel.moderate.length > 0) && (
          <Badge variant="warning" className="text-xs">
            {ingredientsByLevel.high.length + ingredientsByLevel.moderate.length}  surveiller
          </Badge>
        )}
      </div>
      
      {/* Liste des ingredients */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {displayedIngredients.map((ingredient, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => ingredient.hazard && setSelectedIngredient(ingredient)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium border
                transition-all duration-200 
                ${getLevelColor(ingredient.level)}
                ${ingredient.hazard ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}
              `}
            >
              <span className="mr-1.5">{getLevelIcon(ingredient.level)}</span>
              {ingredient.raw}
              {ingredient.hazard && (
                <Info className="inline-block w-3 h-3 ml-1.5 opacity-60" />
              )}
            </motion.button>
          ))}
        </div>
        
        {/* Bouton voir plus/moins */}
        {hasMore && (
          <Button
            variant="ghost"
            size="small"
            onClick={() => setShowAll(!showAll)}
            className="mt-2"
          >
            <ChevronDown
              className={`w-4 h-4 mr-1 transition-transform ${
                showAll ? 'rotate-180' : ''
              }`}
            />
            {showAll ? 'Voir moins' : `Voir ${enrichedIngredients.length - 8} de plus`}
          </Button>
        )}
      </div>
      
      {/* Resume par niveau */}
      {enrichedIngredients.length > 0 && (
        <div className="mt-4 p-3 bg-nature-100 rounded-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="text-center">
              <div className="text-2xl mb-1"></div>
              <div className="font-semibold text-red-700">
                {ingredientsByLevel.high.length}
              </div>
              <div className="text-xs text-gray-600">leve</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1"></div>
              <div className="font-semibold text-orange-700">
                {ingredientsByLevel.moderate.length}
              </div>
              <div className="text-xs text-gray-600">Modere</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1"></div>
              <div className="font-semibold text-green-700">
                {ingredientsByLevel.low.length}
              </div>
              <div className="text-xs text-gray-600">Faible</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1"></div>
              <div className="font-semibold text-gray-600">
                {ingredientsByLevel.unknown.length}
              </div>
              <div className="text-xs text-gray-600">Inconnu</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal detail ingredient */}
      <AnimatePresence>
        {selectedIngredient && selectedIngredient.hazard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedIngredient(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-800">
                      {selectedIngredient.hazard.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant={
                          selectedIngredient.level === 'high'
                            ? 'error'
                            : selectedIngredient.level === 'moderate'
                            ? 'warning'
                            : 'success'
                        }
                      >
                        Niveau {selectedIngredient.level === 'high' ? 'eleve' : 
                                selectedIngredient.level === 'moderate' ? 'modere' : 'faible'}
                      </Badge>
                      {selectedIngredient.hazard.categories.map((cat) => (
                        <Badge key={cat} variant="default" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedIngredient(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-neutral-700" />
                  </button>
                </div>
                
                {/* Contenu */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-neutral-800 mb-2">Resume</h4>
                    <p className="text-gray-600">{selectedIngredient.hazard.summary}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-neutral-800 mb-2">Details</h4>
                    <p className="text-gray-600 text-sm">
                      {selectedIngredient.hazard.details}
                    </p>
                  </div>
                  
                  {selectedIngredient.hazard.synonyms.length > 0 && (
                    <div>
                      <h4 className="font-medium text-neutral-800 mb-2">
                        Autres noms
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedIngredient.hazard.synonyms.map((syn) => (
                          <span
                            key={syn}
                            className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm"
                          >
                            {syn}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedIngredient.hazard.references.length > 0 && (
                    <div>
                      <h4 className="font-medium text-neutral-800 mb-2">
                        Sources
                      </h4>
                      <div className="space-y-2">
                        {selectedIngredient.hazard.references.map((ref, index) => (
                          <a 
                            key={index}
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <ExternalLink className="w-4 h-4" />
                            {ref.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
