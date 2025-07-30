// PATH: frontend/ecolojiaFrontV3/src/components/CategorySelector.tsx
import React, { useState } from 'react';
import { Apple, Droplets, Sparkles } from 'lucide-react';

interface CategorySelectorProps {
  selectedCategory: 'food' | 'cosmetics' | 'detergents';
  onCategoryChange: (category: 'food' | 'cosmetics' | 'detergents') => void;
  className?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onCategoryChange,
  className = ''
}) => {
  const categories = [
    {
      id: 'food' as const,
      name: 'Alimentaire',
      icon: Apple,
      description: 'Analyse NOVA & ultra-transformation',
      examples: 'Plats préparés, boissons, snacks...',
      color: 'green',
      stats: '2M+ produits analysés'
    },
    {
      id: 'cosmetics' as const,
      name: 'Cosmétiques',
      icon: Sparkles,
      description: 'Perturbateurs endocriniens & allergènes',
      examples: 'Crèmes, shampooings, maquillage...',
      color: 'pink',
      stats: '500K+ produits INCI'
    },
    {
      id: 'detergents' as const,
      name: 'Détergents',
      icon: Droplets,
      description: 'Impact environnemental & toxicité',
      examples: 'Lessives, produits ménagers...',
      color: 'blue',
      stats: '200K+ formules analysées'
    }
  ];

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colorMap = {
      green: {
        border: isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300',
        icon: 'text-green-600',
        badge: 'bg-green-100 text-green-800'
      },
      pink: {
        border: isSelected ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-300',
        icon: 'text-pink-600',
        badge: 'bg-pink-100 text-pink-800'
      },
      blue: {
        border: isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300',
        icon: 'text-blue-600',
        badge: 'bg-blue-100 text-blue-800'
      }
    };
    return colorMap[color];
  };

  return (
    <div className={`category-selector ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Quelle catégorie souhaitez-vous analyser ?
        </h2>
        <p className="text-gray-600">
          Notre IA adapte son analyse scientifique selon le type de produit
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((category) => {
          const colors = getColorClasses(category.color, selectedCategory === category.id);
          const IconComponent = category.icon;
          
          return (
            <div
              key={category.id}
              className={`category-card cursor-pointer p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${colors.border}`}
              onClick={() => onCategoryChange(category.id)}
            >
              <div className="text-center">
                {/* Icon */}
                <div className={`mx-auto w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center mb-4 ${colors.icon}`}>
                  <IconComponent size={32} />
                </div>
                
                {/* Title */}
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {category.name}
                </h3>
                
                {/* Description */}
                <p className="text-sm text-gray-600 mb-3">
                  {category.description}
                </p>
                
                {/* Examples */}
                <p className="text-xs text-gray-500 mb-4 italic">
                  {category.examples}
                </p>
                
                {/* Stats badge */}
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
                  {category.stats}
                </div>
                
                {/* Selection indicator */}
                {selectedCategory === category.id && (
                  <div className="mt-4">
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-${category.color}-500 to-${category.color}-600 text-white`}>
                      ✓ Sélectionné
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Benefits section */}
      <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">
              🧠 IA Scientifique Adaptative
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Notre intelligence artificielle adapte automatiquement ses critères d'analyse selon la catégorie :
              <span className="font-medium"> Classification NOVA</span> pour l'alimentaire,
              <span className="font-medium"> analyse INCI</span> pour les cosmétiques,
              <span className="font-medium"> impact environnemental</span> pour les détergents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategorySelector;