// PATH: frontend/src/components/scanner/ManualSearch.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Search, 
  ChevronDown, 
  Info,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import searchService from '../../services/searchService';
import { useDebounce } from '../../hooks/useDebounce';

interface ManualSearchProps {
  onSubmit: (data: ManualSearchData) => void;
  onClosea: () => void;
  categoriesa: CategoryOption[];
  suggestionsa: boolean;
  autoSavea: boolean;
}

interface ManualSearchData {
  name: string;
  brand: string;
  category: string;
  ingredientsa: string;
  barcodea: string;
}

interface CategoryOption {
  value: string;
  label: string;
  icona: string;
}

interface SearchSuggestion {
  id: string;
  name: string;
  brand: string;
  category: string;
  imagea: string;
}

const defaultCategories: CategoryOption[] = [
  { value: 'food', label: 'Alimentation', icon: '' },
  { value: 'cosmetic', label: 'Cosmetiques', icon: 'aaaaa' },
  { value: 'detergent', label: 'Produits menagers', icon: '' }
];

export const ManualSearch: React.FC<ManualSearchProps> = ({
  onSubmit,
  onClose,
  categories = defaultCategories,
  suggestions = true,
  autoSave = true
}) => {
  const [formData, setFormData] = useState<ManualSearchData>({
    name: '',
    brand: '',
    category: 'food',
    ingredients: '',
    barcode: ''
  });

  const [errors, setErrors] = useState<Partial<ManualSearchData>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const debouncedSearchTerm = useDebounce(`${formdata?.name} ${formdata?.brand}`.trim(), 300);

  // Auto-save dans localStorage
  useEffect(() => {
    if (autoSave && formdata?.name) {
      localStorage.setItem('ecolojia_manual_search_draft', JSON.stringify(formData));
    }
  }, [formData, autoSave]);

  // Restaurer le brouillon
  useEffect(() => {
    if (autoSave) {
      const draft = localStorage.getItem('ecolojia_manual_search_draft');
      if (draft) {
        try {
          const parsedDraft = JSON.parse(draft);
          setFormData(parsedDraft);
        } catch (error) {
          console.error('Error parsing draft:', error);
        }
      }
    }
  }, [autoSave]);

  // Recherche de suggestions
  useEffect(() => {
    if (suggestions && debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
      searchProducts();
    } else {
      setSearchSuggestions([]);
    }
  }, [debouncedSearchTerm, suggestions]);

  const searchProducts = async () => {
    setIsSearching(true);
    try {
      const results = await searchService.searchProducts(debouncedSearchTerm, {
        hitsPerPage: 5,
        facetFilters: formdata?.category ? [`category:${formdata?.category}`] : []
      });
      
      if (results.success && results.hits) {
        setSearchSuggestions(results.hits.map((hit: any) => ({
          id: hit.objectID,
          name: hit.name,
          brand: hit.brand,
          category: hit.category,
          image: hit.image
        })));
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ManualSearchData> = {};
    
    if (!formdata?.name.trim()) {
      newErrors.name = 'Le nom du produit est requis';
    }
    
    if (!formdata?.brand.trim()) {
      newErrors.brand = 'La marque est requise';
    }
    
    if (!formdata?.category) {
      newErrors.category = 'La categorie est requise';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Nettoyer le brouillon
    if (autoSave) {
      localStorage.removeItem('ecolojia_manual_search_draft');
    }
    
    onSubmit({
      ...formData,
      ingredients: formdata?.ingredients.trim(),
      barcode: formdata?.barcode.trim()
    });
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setFormData({
      ...formData,
      name: suggestion.name,
      brand: suggestion.brand,
      category: suggestion.category
    });
    setShowSuggestions(false);
  };

  const handleChange = (field: keyof ManualSearchData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-[#7DDE4A] text-white p-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recherche manuelle</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Conseils pour une meilleure analyse</p>
              <ul className="space-y-1">
                <li>aa Saisissez le nom exact tel qu'il apparait sur l'emballage</li>
                <li>aa Incluez les ingredients si possible pour une analyse plus precise</li>
                <li>aa Le code-barres permet d'identifier le produit plus rapidement</li>
              </ul>
            </div>
          </div>

          {/* Nom du produit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du produit *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formdata?.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Yaourt Nature Bio"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Search className="w-5 h-5 text-gray-400" />
                  </motion.div>
                </div>
              )}
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Marque */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marque *
            </label>
            <input
              type="text"
              value={formdata?.brand}
              onChange={(e) => handleChange('brand', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent ${
                errors.brand ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: Danone"
            />
            {errors.brand && (
              <p className="mt-1 text-sm text-red-600">{errors.brand}</p>
            )}
          </div>

          {/* Suggestions */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 rounded-lg p-4"
            >
              <p className="text-sm font-medium text-gray-700 mb-3">
                Produits similaires trouves :
              </p>
              <div className="space-y-2">
                {searchSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left p-3 bg-white rounded-lg hover:shadow-md transition-shadow flex items-center gap-3"
                  >
                    {suggestion.image && (
                      <img
                        src={suggestion.image}
                        alt={suggestion.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{suggestion.name}</p>
                      <p className="text-sm text-gray-600">{suggestion.brand}</p>
                    </div>
                    <ChevronDown className="w-5 h-5 text-gray-400 rotate-[-90deg]" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Categorie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categorie *
            </label>
            <select
              value={formdata?.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent ${
                errors.category ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category}</p>
            )}
          </div>

          {/* Code-barres */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code-barres (optionnel)
            </label>
            <input
              type="text"
              value={formdata?.barcode}
              onChange={(e) => handleChange('barcode', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent"
              placeholder="Ex: 3033710065967"
              pattern="[0-9]*"
            />
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Liste des ingredients (optionnel)
            </label>
            <textarea
              value={formdata?.ingredients}
              onChange={(e) => handleChange('ingredients', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent resize-none"
              placeholder="Copiez la liste des ingredients telle qu'elle apparait sur l'emballage..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Plus la liste est complete, plus l'analyse sera precise
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-[#7DDE4A] text-white rounded-lg font-medium hover:bg-[#6BC93B] transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Analyser
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualSearch;




