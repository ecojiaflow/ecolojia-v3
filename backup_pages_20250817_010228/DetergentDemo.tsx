// PATH: frontend/src/pages/DetergentDemo.tsx
import React, { useState } from 'react';
import { useNovaApi } from '../hooks/useNovaApi';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface DetergentProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  ingredients: string[];
  description: string;
  price: string;
}

const detergentProducts: DetergentProduct[] = [
  {
    id: 'lessive-ecologique',
    name: 'Lessive ÃƒÆ’ââ‚¬Â°cologique Bio',
    brand: 'EcoClean',
    category: 'Lessive',
    image: 'ÃƒÂ°Ã…Â¸Ã‚Â§Ã‚Â½',
    ingredients: ['Savon de Marseille', 'Bicarbonate de sodium', 'Cristaux de soude', 'Huiles essentielles bio'],
    description: 'Lessive concentrée biodégradable, efficace dès 30Ãƒâ€šÃ‚Â°C, sans phosphates',
    price: '16,90 âââ‚¬Å¡Ã‚Â¬'
  },
  {
    id: 'liquide-vaisselle-concentre',
    name: 'Liquide Vaisselle Concentré',
    brand: 'GreenWash',
    category: 'Vaisselle',
    image: 'ÃƒÂ°Ã…Â¸Ã‚ÂÃ‚Â½Ã¯Ã‚Â¸Ã‚Â',
    ingredients: ['Tensioactifs végétaux', 'Aloe vera bio', 'Glycérine végétale', 'Huile essentielle citron'],
    description: 'Dégraissant puissant d\'origine végétale, peaux sensibles',
    price: '8,90 âââ‚¬Å¡Ã‚Â¬'
  },
  {
    id: 'nettoyant-multi-usage',
    name: 'Nettoyant Multi-Usage',
    brand: 'CleanNature',
    category: 'Nettoyage',
    image: 'âÃ…â€œÃ‚Â¨',
    ingredients: ['Vinaigre blanc bio', 'Bicarbonate de sodium', 'Huiles essentielles eucalyptus', 'Eau purifiée'],
    description: 'Solution naturelle pour toutes surfaces, anti-bactérien',
    price: '12,50 âââ‚¬Å¡Ã‚Â¬'
  },
  {
    id: 'lessive-industrielle',
    name: 'Lessive Industrielle',
    brand: 'SuperClean',
    category: 'Lessive',
    image: 'âÃ…Â¡Ã‚Â Ã¯Ã‚Â¸Ã‚Â',
    ingredients: ['Sodium Lauryl Sulfate', 'Phosphates', 'EDTA', 'Parfum synthétique', 'Colorants'],
    description: 'Lessive industrielle haute performance, usage intensif',
    price: '9,90 âââ‚¬Å¡Ã‚Â¬'
  }
];

export default function DetergentDemo() {
  const { loading, error, result, analyze } = useNovaApi();
  const [selectedProduct, setSelectedProduct] = useState<DetergentProduct | null>(null);

  const runAnalysis = async (product: DetergentProduct) => {
    setSelectedProduct(product);
    
    await analyze({
      title: product.name,
      brand: product.brand,
      description: product.description,
      ingredients: product.ingredients,
      detected_type: 'detergent'
    });
  };

  const getEcoColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getEcoIcon = (score: number) => {
    if (score >= 80) return 'ÃƒÂ°Ã…Â¸Ã…â€™Ã‚Â¿';
    if (score >= 60) return 'âââ€žÂ¢Ã‚Â»Ã¯Ã‚Â¸Ã‚Â';
    if (score >= 40) return 'âÃ…Â¡Ã‚Â Ã¯Ã‚Â¸Ã‚Â';
    return 'ÃƒÂ°Ã…Â¸Ã…Â¡Ã‚Â¨';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <span className="text-4xl mr-3">ÃƒÂ°Ã…Â¸Ã‚Â§Ã‚Â½</span>
            <h1 className="text-4xl font-bold text-gray-800">
              Analyse Produits Ménagers IA
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            ÃƒÆ’ââ‚¬Â°valuez l'impact environnemental de vos produits ménagers grâce ÃƒÆ’Ã‚Â  notre IA spécialisée.
            Analyse de la composition chimique, biodégradabilité et recommandations écologiques.
          </p>
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            <span className="mr-2">ÃƒÂ°Ã…Â¸Ã…â€™Ã…Â </span>
            Mode simulation - Impact environnemental réaliste
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {detergentProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-blue-100"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">{product.image}</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {product.category}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {product.name}
                </h3>
                <p className="text-blue-600 font-medium mb-2">{product.brand}</p>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  {product.description}
                </p>
                
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">
                    Composition principale :
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {product.ingredients.slice(0, 2).map((ingredient, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                      >
                        {ingredient}
                      </span>
                    ))}
                    {product.ingredients.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                        +{product.ingredients.length - 2} autres
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
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                  >
                    {loading && selectedProduct?.id === product.id ? (
                      <span className="flex items-center">
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Analyse...</span>
                      </span>
                    ) : (
                      'ÃƒÂ°Ã…Â¸Ã…â€™Ã…Â  Analyser'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Analysis Results */}
        {result && selectedProduct && (
          <div className="bg-white rounded-xl shadow-lg p-8 border border-blue-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Résultats de l'analyse environnementale
                </h2>
                <p className="text-gray-600">
                  {selectedProduct.name} ââ‚¬Ã‚Â¢ {selectedProduct.brand}
                </p>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center px-4 py-2 rounded-lg border-2 font-bold text-lg ${getEcoColor(result.data.product.score)}`}>
                  <span className="mr-2">{getEcoIcon(result.data.product.score)}</span>
                  ÃƒÆ’ââ‚¬Â°co-Score: {result.data.product.score}/100
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Grade environnemental: {result.data.product.safetyGrade}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Environmental Impact */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">ÃƒÂ°Ã…Â¸Ã…â€™Ã‚Â</span>
                    Impact environnemental
                  </h3>
                  <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${
                    result.data.product.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                    result.data.product.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {result.data.product.riskLevel === 'low' ? 'Impact faible' :
                     result.data.product.riskLevel === 'medium' ? 'Impact modéré' : 'Impact élevé'}
                  </div>
                </div>

                {/* Recommendation */}
                <div className={`rounded-lg p-4 ${
                  result.data.product.recommendation.type === 'enjoy' ? 'bg-green-50 border-l-4 border-green-400' :
                  result.data.product.recommendation.type === 'moderate' ? 'bg-yellow-50 border-l-4 border-yellow-400' :
                  'bg-red-50 border-l-4 border-red-400'
                }`}>
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">
                      {result.data.product.recommendation.type === 'enjoy' ? 'ÃƒÂ°Ã…Â¸Ã…â€™Ã…Â¸' :
                       result.data.product.recommendation.type === 'moderate' ? 'âÃ…Â¡ââ‚¬â€œÃ¯Ã‚Â¸Ã‚Â' : 'ÃƒÂ°Ã…Â¸Ã…Â¡Ã‚Â«'}
                    </span>
                    Recommandation écologique
                  </h3>
                  <p className="text-gray-700 mb-3">
                    {result.data.product.recommendation.message}
                  </p>
                  
                  {result.data.product.recommendation.alternatives && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Alternatives vertes :</h4>
                      <ul className="space-y-1">
                        {result.data.product.recommendation.alternatives.map((alt, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center">
                            <span className="mr-2">ÃƒÂ°Ã…Â¸Ã…â€™Ã‚Â¿</span>
                            {alt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Scientific Sources */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">ÃƒÂ°Ã…Â¸ââ‚¬Å“ââ‚¬â€œ</span>
                    Références réglementaires
                  </h3>
                  <ul className="space-y-2">
                    {result.data.product.scientificSources && result.data.product.scientificSources.map((source, index) => (
                      <li key={index} className="text-sm text-blue-800 flex items-start">
                        <span className="mr-2 mt-1">ââ‚¬Ã‚Â¢</span>
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
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <div className="flex">
              <span className="mr-2">âÃ‚ÂÃ…â€™</span>
              <div>
                <h3 className="text-red-800 font-medium">Erreur d'analyse</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
// EOF


