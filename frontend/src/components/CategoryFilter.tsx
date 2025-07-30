import React from 'react';
import { Category } from '../types';
import { 
  Apple, Shirt, Sparkles, Home, Smartphone, Flower
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | undefined;
  onSelectCategory: (categoryId: string | undefined) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  categories, 
  selectedCategory, 
  onSelectCategory 
}) => {
  const { t } = useTranslation();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'apple': return <Apple size={20} />;
      case 'shirt': return <Shirt size={20} />;
      case 'sparkles': return <Sparkles size={20} />;
      case 'home': return <Home size={20} />;
      case 'smartphone': return <Smartphone size={20} />;
      case 'flower': return <Flower size={20} />;
      default: return <Sparkles size={20} />;
    }
  };

  return (
    <div className="py-6">
      <h3 className="text-lg font-medium text-eco-text mb-4">{t('common.categories')}</h3>
      <div className="flex flex-wrap gap-3" role="tablist">
        <button
          onClick={() => onSelectCategory(undefined)}
          className={`px-5 py-2.5 rounded-full text-sm font-medium flex items-center transition-all ${
            !selectedCategory 
              ? 'bg-eco-leaf text-white shadow-md shadow-eco-leaf/20' 
              : 'bg-white/80 text-eco-text hover:bg-eco-glow/20'
          }`}
          role="tab"
          aria-selected={!selectedCategory}
          aria-label={t('accessibility.allCategories')}
        >
          {t('common.allCategories')}
        </button>
        
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium flex items-center transition-all ${
              selectedCategory === category.id 
                ? 'bg-eco-leaf text-white shadow-md shadow-eco-leaf/20' 
                : 'bg-white/80 text-eco-text hover:bg-eco-glow/20'
            }`}
            role="tab"
            aria-selected={selectedCategory === category.id}
            aria-label={t(`categories.${category.name.toLowerCase()}`)}
          >
            <span className="mr-2">{getIcon(category.icon)}</span>
            {t(`categories.${category.name.toLowerCase()}`)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;