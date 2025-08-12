// PATH: frontend/src/pages/CosmeticDemo.tsx
import React, { useState } from 'react';
import { useNovaApi } from '../hooks/useNovaApi';
import LoadingSpinner from '../components/LoadingSpinner';

interface CosmeticProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  ingredients: string[];
  description: string;
  price: string;
}

const cosmeticProducts: CosmeticProduct[] = [
  {
    id: 'rouge-levres-naturel',
    name: 'Rouge ÃƒÂ  Lèvres Naturel',
    brand: 'BioChic',
    category: 'Maquillage',
    image: 'Ã°Å¸â€™â€ž',
    ingredients: ['Cire de candelilla bio', 'Huile de jojoba bio', 'Pigments minéraux naturels'],
    description: 'Rouge ÃƒÂ  lèvres longue tenue formulé avec 98% d\'ingrédients naturels',
    price: '24,90 ââ€šÂ¬'
  },
  {
    id: 'creme-visage-hydratante',
    name: 'Crème Visage Hydratante',
    brand: 'GreenSkin',
    category: 'Soin du visage',
    image: 'Ã°Å¸Â§Â´',
    ingredients: ['Aqua', 'Glycérine végétale', 'Acide hyaluronique', 'Huile d\'argan bio'],
    description: 'Crème hydratante 24h pour tous types de peaux, certifiée bio',
    price: '32,50 ââ€šÂ¬'
  },
  {
    id: 'shampoing-doux-bio',
    name: 'Shampoing Doux Bio',
    brand: 'CosméBio',
    category: 'Soin des cheveux',
    image: 'Ã°Å¸Â§Â´',
    ingredients: ['Coco-glucoside', 'Aloe vera bio', 'Huile essentielle lavande', 'Protéines de blé'],
    description: 'Shampoing sans sulfates pour cheveux sensibles, formule douce',
    price: '18,90 ââ€šÂ¬'
  },
  {
    id: 'deodorant-solide',
    name: 'Déodorant Solide',
    brand: 'EcoFresh',
    category: 'Hygiène',
    image: 'Ã°Å¸Å’Â¿',
    ingredients: ['Bicarbonate de sodium', 'Beurre de karité bio', 'Huile essentielle palmarosa'],
    description: 'Déodorant solide efficace 24h, sans aluminium ni parabènes',
    price: '12,90 ââ€šÂ¬'
  },
  {
    id: 'lotion-corps',
    name: 'Lotion Corps',
    brand: 'PureSkin',
    category: 'Soin du corps',
    image: 'Ã°Å¸Â§Â´',
    ingredients: ['Aloe vera bio', 'Beurre de cacao', 'Huile de coco vierge'],
    description: 'Lotion corporelle nourrissante ÃƒÂ  absorption rapide',
    price: '28,90 ââ€šÂ¬'
  },
  {
    id: 'huile-cheveux',
    name: 'Huile Cheveux',
    brand: 'NatureHair',
    category: 'Soin des cheveux',
    image: 'âÅ“Â¨',
    ingredients: ['Huile d\'argan bio', 'Huile de ricin bio'],
    description: 'Huile capillaire réparatrice pour cheveux abîmés et secs',
    price: '22,90 ââ€šÂ¬'
  }
];

export default function CosmeticDemo() {
  const { loading, error, result, analyze } = useNovaApi();
  const [selectedProduct, setSelectedProduct] = useState<CosmeticProduct | null>(null);

  const runAnalysis = async (product: CosmeticProduct) => {
    setSelectedProduct(product);
    
    await analyze({
      title: product.name,
      brand: product.brand,
      description: product.description,
      ingredients: product.ingredients,
      detected_type: 'cosmetic'
    });
  };

  const getSafetyColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getSafetyIcon = (score: number) => {
    if (score >= 80) return 'âÅ“â€¦';
    if (score >= 60) return 'âÅ¡Â ïÂ¸Â';
    if (score >= 40) return 'Ã°Å¸â€Â¶';
    return 'âÂÅ’';
  };

  const getRiskLevelText = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'Faible risque';
      case 'medium': return 'Risque modéré';
      case 'high': return 'Risque élevé';
      default: return 'Non évalué';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <span className="text-4xl mr-3">Ã°Å¸â€™â€ž</span>
            <h1 className="text-4xl font-bold text-gray-800">
              Analyse Cosmétiques IA
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Découvrez la composition de vos produits cosmétiques grâce ÃƒÂ  notre IA spécialisée.
            Analyse des ingrédients INCI, détection des substances préoccupantes et recommandations personnalisées.
          </p>
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-pink-100 text-pink-800 rounded-full text-sm font-medium">
            <span className="mr-2">Ã°Å¸Â§Âª</span>
            Mode simulation - Données réalistes pour démonstration
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {cosmeticProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-pink-100"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">{product.image}</span>
                  <span className="px-3 py-1 bg-pink-100 text-pink-800 text-xs font-medium rounded-full">
                    {product.category}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {product.name}
                </h3>
                <p className="text-pink-600 font-medium mb-2">{product.brand}</p>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  {product.description}
                </p>
                
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">
                    Ingrédients principaux :
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {product.ingredients.slice(0, 3).map((ingredient, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                      >
                        {ingredient}
                      </span>
                    ))}
                    {product.ingredients.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                        +{product.ingredients.length - 3} autres
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-800">
                    {product.price}
                  </span>
                  <button
                    onClick={() => runAnalysis(product)}
                    disabled={loading}
                    className="bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                  >
                    {loading && selectedProduct?.id === product.id ? (
                      <span className="flex items-center">
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Analyse...</span>
                      </span>
                    ) : (
                      'Ã°Å¸â€Â¬ Analyser'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Analysis Results */}
        {result && selectedProduct && (
          <div className="bg-white rounded-xl shadow-lg p-8 border border-pink-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Résultats de l'analyse cosmétique
                </h2>
                <p className="text-gray-600">
                  {selectedProduct.name} â€Â¢ {selectedProduct.brand}
                </p>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center px-4 py-2 rounded-lg border-2 font-bold text-lg ${getSafetyColor(result.data.product.score)}`}>
                  <span className="mr-2">{getSafetyIcon(result.data.product.score)}</span>
                  Score: {result.data.product.score}/100
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Grade de sécurité: {result.data.product.safetyGrade}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Risk Level */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">âÅ¡Â ïÂ¸Â</span>
                    Niveau de risque
                  </h3>
                  <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${
                    result.data.product.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                    result.data.product.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {getRiskLevelText(result.data.product.riskLevel)}
                  </div>
                </div>

                {/* Composition */}
                {result.data.product.composition && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                      <span className="mr-2">Ã°Å¸Â§Âª</span>
                      Composition
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Ingrédients naturels</span>
                        <span className="font-medium text-green-600">
                          {result.data.product.composition.natural}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Ingrédients synthétiques</span>
                        <span className="font-medium text-orange-600">
                          {result.data.product.composition.synthetic}%
                        </span>
                      </div>
                      {result.data.product.composition.organic > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Ingrédients bio</span>
                          <span className="font-medium text-green-600">
                            {result.data.product.composition.organic}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Positive Ingredients */}
                {result.data.product.positiveIngredients && result.data.product.positiveIngredients.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                      <span className="mr-2">âÅ“â€¦</span>
                      Ingrédients bénéfiques
                    </h3>
                    <div className="space-y-3">
                      {result.data.product.positiveIngredients.map((ingredient, index) => (
                        <div key={index} className="border-l-4 border-green-400 pl-3">
                          <p className="font-medium text-green-800">{ingredient.name}</p>
                          <p className="text-sm text-green-600">{ingredient.benefit}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Problematic Ingredients */}
                {result.data.product.problematicIngredients && result.data.product.problematicIngredients.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                      <span className="mr-2">âÅ¡Â ïÂ¸Â</span>
                      Ingrédients préoccupants
                    </h3>
                    <div className="space-y-3">
                      {result.data.product.problematicIngredients.map((ingredient, index) => (
                        <div key={index} className="border-l-4 border-red-400 pl-3">
                          <p className="font-medium text-red-800">{ingredient.name}</p>
                          <p className="text-sm text-red-600 mb-1">{ingredient.risk}</p>
                          <p className="text-xs text-gray-600">
                            Alternative: {ingredient.alternative}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendation */}
                <div className={`rounded-lg p-4 ${
                  result.data.product.recommendation.type === 'enjoy' ? 'bg-green-50 border-l-4 border-green-400' :
                  result.data.product.recommendation.type === 'moderate' ? 'bg-yellow-50 border-l-4 border-yellow-400' :
                  'bg-red-50 border-l-4 border-red-400'
                }`}>
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">
                      {result.data.product.recommendation.type === 'enjoy' ? 'Ã°Å¸â€˜Â' :
                       result.data.product.recommendation.type === 'moderate' ? 'âÅ¡â€“ïÂ¸Â' : 'Ã°Å¸â€˜Å½'}
                    </span>
                    Recommandation
                  </h3>
                  <p className="text-gray-700 mb-3">
                    {result.data.product.recommendation.message}
                  </p>
                  
                  {result.data.product.recommendation.alternatives && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Alternatives recommandées :</h4>
                      <ul className="space-y-1">
                        {result.data.product.recommendation.alternatives.map((alt, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center">
                            <span className="mr-2">â€Â¢</span>
                            {alt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Scientific Sources */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">Ã°Å¸â€œÅ¡</span>
                    Sources scientifiques
                  </h3>
                  <ul className="space-y-2">
                    {result.data.product.scientificSources.map((source, index) => (
                      <li key={index} className="text-sm text-blue-800 flex items-start">
                        <span className="mr-2 mt-1">â€Â¢</span>
                        <span>{source}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Analysis Metadata */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  Analyse effectuée le {new Date(result.data.analysis.timestamp).toLocaleString('fr-FR')}
                </span>
                <span>
                  Confiance: {Math.round(result.data.analysis.confidence * 100)}%
                </span>
                <span>
                  Temps de traitement: {result.data.analysis.processingTime}ms
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <div className="flex">
              <span className="mr-2">âÂÅ’</span>
              <div>
                <h3 className="text-red-800 font-medium">Erreur d'analyse</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Information Section */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8 border border-pink-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Ã°Å¸Â§Âª Comprendre l'analyse cosmétique ECOLOJIA
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="text-3xl mb-3">Ã°Å¸ÂÂ·ïÂ¸Â</div>
              <h3 className="font-bold text-gray-800 mb-2">Analyse INCI</h3>
              <p className="text-gray-600 text-sm">
                Décryptage de la nomenclature internationale des ingrédients cosmétiques
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-3">âÅ¡â€“ïÂ¸Â</div>
              <h3 className="font-bold text-gray-800 mb-2">Ãƒâ€°valuation des risques</h3>
              <p className="text-gray-600 text-sm">
                Classification selon les données SCCS et les réglementations européennes
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-3">Ã°Å¸Å’Â¿</div>
              <h3 className="font-bold text-gray-800 mb-2">Alternatives naturelles</h3>
              <p className="text-gray-600 text-sm">
                Suggestions de produits plus sains et respectueux de l'environnement
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// EOF
