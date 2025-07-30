// PATH: frontend/src/pages/ManualAnalysisPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Heart, 
  Droplets, 
  AlertCircle, 
  Loader2,
  ChevronRight,
  Camera,
  Edit3
} from 'lucide-react';
import { aiAnalysisService } from '../services/aiAnalysisService';

interface ManualFormData {
  category: 'food' | 'cosmetics' | 'detergents';
  name: string;
  brand: string;
  ingredients: string;
  image?: File;
}

export const ManualAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ManualFormData>({
    category: 'food',
    name: '',
    brand: '',
    ingredients: ''
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const categories = [
    {
      id: 'food' as const,
      name: 'Alimentaire',
      icon: Package,
      color: 'bg-green-100 text-green-700',
      description: 'Analyse NOVA, additifs, ultra-transformation',
      placeholder: 'Ex: Eau, sucre, huile de palme, cacao maigre, lait écrémé en poudre...'
    },
    {
      id: 'cosmetics' as const,
      name: 'Cosmétiques',
      icon: Heart,
      color: 'bg-pink-100 text-pink-700',
      description: 'Perturbateurs endocriniens, allergènes, INCI',
      placeholder: 'Ex: Aqua, Glycerin, Cetearyl Alcohol, Parfum, Methylparaben...'
    },
    {
      id: 'detergents' as const,
      name: 'Détergents',
      icon: Droplets,
      color: 'bg-blue-100 text-blue-700',
      description: 'Impact environnemental, biodégradabilité',
      placeholder: 'Ex: Sodium Laureth Sulfate, Cocamidopropyl Betaine, Sodium Chloride...'
    }
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      
      // Créer preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.ingredients) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await aiAnalysisService.analyzeProduct({
        category: formData.category,
        name: formData.name,
        brand: formData.brand,
        ingredients: formData.ingredients,
        image: formData.image
      });

      // Naviguer vers la page de résultats
      navigate('/results', { state: { result } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'analyse');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectedCategory = categories.find(c => c.id === formData.category)!;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Analyse Manuelle de Produit
          </h1>
          <p className="text-gray-600">
            Entrez les informations du produit pour une analyse détaillée
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélection de catégorie */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Catégorie du produit
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: category.id })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.category === category.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center mx-auto mb-2`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-medium text-gray-900">{category.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{category.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Informations du produit */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nom du produit <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ex: Nutella, Nivea Crème, Ariel..."
              />
            </div>

            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                Marque
              </label>
              <input
                type="text"
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ex: Ferrero, Nivea, Procter & Gamble..."
              />
            </div>

            <div>
              <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700 mb-1">
                {formData.category === 'cosmetics' ? 'Liste INCI' : 'Liste des ingrédients'} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="ingredients"
                value={formData.ingredients}
                onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={selectedCategory.placeholder}
              />
              <p className="mt-1 text-xs text-gray-500">
                Copiez la liste complète depuis l'emballage du produit
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photo du produit (optionnel)
              </label>
              <div className="flex items-center space-x-4">
                <label htmlFor="image" className="cursor-pointer">
                  <div className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2">
                    <Camera className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-700">Choisir une photo</span>
                  </div>
                  <input
                    type="file"
                    id="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                {imagePreview && (
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isAnalyzing}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  Analyser le produit
                  <ChevronRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Conseils */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h3 className="font-medium text-blue-900 mb-2 flex items-center">
            <Edit3 className="w-5 h-5 mr-2" />
            Conseils pour une analyse précise
          </h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Copiez la liste complète des ingrédients dans l'ordre exact</li>
            <li>• Pour les cosmétiques, utilisez la liste INCI (noms internationaux)</li>
            <li>• Incluez les pourcentages si disponibles (ex: "Aqua 70%")</li>
            <li>• Séparez les ingrédients par des virgules</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ManualAnalysisPage;