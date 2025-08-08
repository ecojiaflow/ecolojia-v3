// ===================================
// 5. ManualSearch.tsx - NOUVEAU COMPOSANT
// ===================================
// PATH: frontend/src/components/scanner/ManualSearch.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, AlertCircle, Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface ManualSearchProps {
  onSubmit: (data: ManualSearchData) => void;
  prefillData?: {
    name?: string;
    ingredients?: string;
    brand?: string;
    category?: string;
  };
}

interface ManualSearchData {
  name: string;
  ingredients: string;
  brand?: string;
  category: string;
  barcode?: string;
}

export const ManualSearch: React.FC<ManualSearchProps> = ({ onSubmit, prefillData }) => {
  const location = useLocation();
  const [formData, setFormData] = useState<ManualSearchData>({
    name: '',
    ingredients: '',
    brand: '',
    category: 'food',
    barcode: ''
  });
  const [errors, setErrors] = useState<Partial<ManualSearchData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pré-remplir avec les données de la photo si disponibles
  useEffect(() => {
    const stateData = location.state?.prefillData || prefillData;
    if (stateData) {
      setFormData(prev => ({
        ...prev,
        name: stateData.name || prev.name,
        ingredients: stateData.ingredients || prev.ingredients,
        brand: stateData.brand || prev.brand,
        category: stateData.category || prev.category
      }));
    }
  }, [location.state, prefillData]);

  const validateForm = (): boolean => {
    const newErrors: Partial<ManualSearchData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du produit est requis';
    }

    if (!formData.barcode && !formData.ingredients.trim()) {
      newErrors.ingredients = 'Les ingrédients sont requis si pas de code-barres';
    }

    if (formData.barcode && !/^\d{8,13}$/.test(formData.barcode)) {
      newErrors.barcode = 'Code-barres invalide (8 à 13 chiffres)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof ManualSearchData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6 max-w-lg mx-auto"
    >
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Recherche manuelle
        </h3>
        <p className="text-sm text-gray-600">
          Entrez les informations du produit pour l'analyser
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Code-barres (optionnel) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Code-barres (optionnel)
          </label>
          <input
            type="text"
            value={formData.barcode}
            onChange={(e) => handleChange('barcode', e.target.value.replace(/\D/g, ''))}
            placeholder="Ex: 3017620422003"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              errors.barcode ? 'border-red-500' : 'border-gray-300'
            }`}
            maxLength={13}
          />
          {errors.barcode && (
            <p className="mt-1 text-xs text-red-600 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.barcode}
            </p>
          )}
        </div>

        {/* Nom du produit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom du produit *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Ex: Yaourt nature bio"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Marque */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Marque (optionnel)
          </label>
          <input
            type="text"
            value={formData.brand}
            onChange={(e) => handleChange('brand', e.target.value)}
            placeholder="Ex: Danone"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Catégorie */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Catégorie *
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          >
            <option value="food">🍎 Alimentaire</option>
            <option value="cosmetic">💄 Cosmétique</option>
            <option value="detergent">🧽 Détergent</option>
          </select>
        </div>

        {/* Ingrédients */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ingrédients {!formData.barcode && '*'}
          </label>
          <textarea
            value={formData.ingredients}
            onChange={(e) => handleChange('ingredients', e.target.value)}
            placeholder="Copiez la liste d'ingrédients du produit..."
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              errors.ingredients ? 'border-red-500' : 'border-gray-300'
            }`}
            required={!formData.barcode}
          />
          {errors.ingredients && (
            <p className="mt-1 text-xs text-red-600 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.ingredients}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            💡 Astuce : Photographiez la liste avec le mode Photo pour un remplissage automatique
          </p>
        </div>

        {/* Bouton submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyse en cours...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Analyser le produit
            </>
          )}
        </button>
      </form>

      {/* Message si données pré-remplies */}
      {(location.state?.prefillData || prefillData) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <p className="text-sm text-blue-800">
            ✨ Données extraites de votre photo. Vérifiez et complétez si nécessaire.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ManualSearch;