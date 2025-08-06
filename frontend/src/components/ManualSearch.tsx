import React, { useState, useEffect } from 'react';
import { Search, AlertCircle, ChevronDown } from 'lucide-react';

interface ManualSearchProps {
  onSubmit: (data: ManualSearchData) => void;
  categories?: CategoryOption[];
  suggestions?: boolean;
  autoSave?: boolean;
}

interface ManualSearchData {
  name: string;
  brand?: string;
  category: string;
  ingredients?: string;
  barcode?: string;
}

interface CategoryOption {
  value: string;
  label: string;
}

// Catégories par défaut
const DEFAULT_CATEGORIES: CategoryOption[] = [
  { value: 'food', label: 'Alimentaire' },
  { value: 'cosmetic', label: 'Cosmétique' },
  { value: 'detergent', label: 'Produit ménager' },
  { value: 'other', label: 'Autre' }
];

export default function ManualSearch({
  onSubmit,
  categories = DEFAULT_CATEGORIES,
  suggestions = true,
  autoSave = true
}: ManualSearchProps) {
  const [formData, setFormData] = useState<ManualSearchData>({
    name: '',
    brand: '',
    category: categories[0]?.value || 'food',
    ingredients: '',
    barcode: ''
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof ManualSearchData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Auto-save to localStorage
  useEffect(() => {
    if (autoSave && typeof window !== 'undefined') {
      const saved = localStorage.getItem('ecolojia_manual_search_draft');
      if (saved) {
        try {
          const parsedData = JSON.parse(saved);
          setFormData({
            ...formData,
            ...parsedData
          });
        } catch (e) {
          console.error('Error loading draft:', e);
        }
      }
    }
  }, [autoSave]);

  useEffect(() => {
    if (autoSave && typeof window !== 'undefined' && (formData.name || formData.ingredients)) {
      localStorage.setItem('ecolojia_manual_search_draft', JSON.stringify(formData));
    }
  }, [formData, autoSave]);

  // Simulated search suggestions
  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    // Simulate API call with mock data
    const mockProducts = [
      'Nutella 400g',
      'Nutella 750g',
      'Nutella & Go',
      'Pâte à tartiner noisettes',
      'Nocciolata Bio',
      'Coca-Cola 33cl',
      'Coca-Cola Zero 1L',
      'Pepsi Max 50cl',
      'Eau Evian 1.5L',
      'Lait Lactel 1L'
    ];

    const filtered = mockProducts
      .filter(s => s.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);

    setSearchSuggestions(filtered);
  };

  const handleInputChange = (field: keyof ManualSearchData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));

    if (field === 'name' && suggestions) {
      fetchSuggestions(value);
      setShowSuggestions(true);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setFormData(prev => ({ ...prev, name: suggestion }));
    setShowSuggestions(false);
    setSearchSuggestions([]);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ManualSearchData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du produit est requis';
    }

    if (!formData.category) {
      newErrors.category = 'La catégorie est requise';
    }

    if (formData.barcode && !/^\d{8,13}$/.test(formData.barcode)) {
      newErrors.barcode = 'Code-barres invalide (8-13 chiffres)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    
    // Simuler l'appel API
    setTimeout(() => {
      onSubmit(formData);
      
      // Clear draft after successful submission
      if (autoSave && typeof window !== 'undefined') {
        localStorage.removeItem('ecolojia_manual_search_draft');
      }
      
      setIsSubmitting(false);
    }, 1000);
  };

  const clearDraft = () => {
    setFormData({
      name: '',
      brand: '',
      category: categories[0]?.value || 'food',
      ingredients: '',
      barcode: ''
    });
    if (autoSave && typeof window !== 'undefined') {
      localStorage.removeItem('ecolojia_manual_search_draft');
    }
  };

  return (
    <div className="space-y-6">
      {/* Nom du produit */}
      <div className="relative">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Nom du produit *
        </label>
        <div className="relative">
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className={`w-full px-4 py-2 pr-10 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Ex: Nutella 400g"
          />
          <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        
        {/* Suggestions dropdown */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
            {searchSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b last:border-b-0"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        
        {errors.name && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.name}
          </p>
        )}
      </div>

      {/* Marque */}
      <div>
        <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
          Marque (optionnel)
        </label>
        <input
          type="text"
          id="brand"
          value={formData.brand || ''}
          onChange={(e) => handleInputChange('brand', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Ex: Ferrero"
        />
      </div>

      {/* Catégorie */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Catégorie *
        </label>
        <div className="relative">
          <select
            id="category"
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className={`w-full px-4 py-2 pr-10 border rounded-md appearance-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              errors.category ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
        </div>
        {errors.category && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.category}
          </p>
        )}
      </div>

      {/* Code-barres */}
      <div>
        <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-1">
          Code-barres (optionnel)
        </label>
        <input
          type="text"
          id="barcode"
          value={formData.barcode || ''}
          onChange={(e) => handleInputChange('barcode', e.target.value)}
          className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent ${
            errors.barcode ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Ex: 8000500037466"
        />
        {errors.barcode && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.barcode}
          </p>
        )}
      </div>

      {/* Ingrédients */}
      <div>
        <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700 mb-1">
          Ingrédients (optionnel mais recommandé)
        </label>
        <textarea
          id="ingredients"
          value={formData.ingredients || ''}
          onChange={(e) => handleInputChange('ingredients', e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          placeholder="Copiez la liste des ingrédients telle qu'elle apparaît sur le produit..."
        />
        <p className="mt-1 text-xs text-gray-500">
          Une analyse plus précise sera effectuée si vous fournissez les ingrédients
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Analyse en cours...' : 'Analyser le produit'}
        </button>
        
        {autoSave && (formData.name || formData.ingredients) && (
          <button
            type="button"
            onClick={clearDraft}
            className="px-4 py-3 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Effacer
          </button>
        )}
      </div>

      {autoSave && (formData.name || formData.ingredients) && (
        <p className="text-xs text-gray-500 text-center">
          Brouillon sauvegardé automatiquement
        </p>
      )}
    </div>
  );
}