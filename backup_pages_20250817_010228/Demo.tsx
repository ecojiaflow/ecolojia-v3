// PATH: frontend/src/pages/Demo.tsx
import React, { useState } from 'react';
import { useQuickNovaTest } from '../hooks/useNovaApi';
import NovaResults from '../components/NovaResults';

interface DemoProduct {
  name: string;
  description: string;
  ingredients: string;
  expectedNova: number;
  icon: string;
  category: string;
}

const demoProducts: DemoProduct[] = [
  {
    name: 'Coca-Cola Original',
    description: 'Boisson gazeuse sucrÃ©e populaire',
    ingredients: 'Eau gazÃ©ifiÃ©e, sucre, sirop de glucose-fructose, arÃ´me naturel de cola, colorant E150d (caramel IV), acidifiant E338 (acide phosphorique), Ã©dulcorant E952 (cyclamate de sodium), conservateur E211 (benzoate de sodium)',
    expectedNova: 4,
    icon: 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â¥Ãƒâ€šÃ‚Â¤',
    category: 'Boisson'
  },
  {
    name: 'Nutella PÃ¢te ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  tartiner',
    description: 'PÃ¢te ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  tartiner aux noisettes et cacao',
    ingredients: 'Sucre, huile de palme, NOISETTES 13%, cacao maigre 7.4%, LAIT Ã©crÃ©mÃ© en poudre 6.6%, LACTOSÃƒÆ’Ã†â€™Ã¢Ã¢â€šÂ¬Ã‚Â°RUM en poudre, Ã©mulsifiants E322 (lÃ©cithines) E471 (mono- et diglycÃ©rides d\'acides gras), arÃ´me vanilline',
    expectedNova: 4,
    icon: 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚ÂÃƒâ€šÃ‚Â«',
    category: 'PÃ¢te ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  tartiner'
  },
  {
    name: 'Pizza 4 Fromages SurgelÃ©e',
    description: 'Pizza surgelÃ©e industrielle',
    ingredients: 'PÃ¢te (farine de BLÃƒÆ’Ã†â€™Ã¢Ã¢â€šÂ¬Ã‚Â°, eau, huile de tournesol, levure, sel, sucre), fromages 25% (MOZZARELLA, EMMENTAL, GORGONZOLA, PARMESAN), sauce tomate, conservateur E202, exhausteur de goÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â»t E621, stabilisant E412, colorant E150d',
    expectedNova: 4,
    icon: 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚ÂÃ¢Ã¢â€šÂ¬Ã‚Â¢',
    category: 'Plat prÃ©parÃ©'
  },
  {
    name: 'Yaourt Nature Bio',
    description: 'Yaourt nature issu de l\'agriculture biologique',
    ingredients: 'LAIT entier pasteurisÃ© issu de l\'agriculture biologique, ferments lactiques (Streptococcus thermophilus, Lactobacillus bulgaricus)',
    expectedNova: 1,
    icon: 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â¥Ã¢Ã¢â€šÂ¬Ã‚Âº',
    category: 'Produit laitier'
  },
  {
    name: 'Pain de Mie Complet',
    description: 'Pain de mie aux cÃ©rÃ©ales complÃ¨tes',
    ingredients: 'Farine complÃ¨te de BLÃƒÆ’Ã†â€™Ã¢Ã¢â€šÂ¬Ã‚Â°, eau, levure, huile de tournesol, sucre, sel, gluten de BLÃƒÆ’Ã†â€™Ã¢Ã¢â€šÂ¬Ã‚Â°, conservateur E282, Ã©mulsifiant E471, agent de traitement de la farine E300',
    expectedNova: 3,
    icon: 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚ÂÃƒâ€¦Ã‚Â¾',
    category: 'Boulangerie'
  },
  {
    name: 'Biscuits Petit-DÃ©jeuner',
    description: 'Biscuits enrichis en vitamines',
    ingredients: 'CÃ©rÃ©ales 58% (farine de BLÃƒÆ’Ã†â€™Ã¢Ã¢â€šÂ¬Ã‚Â°, flocons d\'AVOINE 14%), sucre, huile de palme, sirop de glucose-fructose, poudre ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  lever E500, sel, arÃ´mes, vitamines (B1, B6, B9, B12, C, E), colorant E160a, Ã©mulsifiant E322',
    expectedNova: 4,
    icon: 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚ÂÃƒâ€šÃ‚Âª',
    category: 'Biscuiterie'
  }
];

const Demo: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<DemoProduct | null>(null);
  const { data, loading, error, analyzeProduct, reset } = useQuickNovaTest();

  const handleProductTest = async (product: DemoProduct) => {
    setSelectedProduct(product);
    await analyzeProduct(product.name, product.ingredients);
  };

  const handleReset = () => {
    setSelectedProduct(null);
    reset();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚Â¬ DÃ©monstration ECOLOJIA
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Intelligence Artificielle de Classification NOVA
          </p>
          
          {/* Info quota simulÃ©e */}
          <div className="inline-flex items-center bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm">
            <span className="text-blue-600 mr-2">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã…â€œÃƒâ€¦Ã‚Â </span>
            <span className="text-blue-800">
              Mode dÃ©monstration - <strong>Analyses illimitÃ©es</strong>
            </span>
          </div>
        </div>

        {/* Produits de dÃ©monstration */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            SÃ©lectionnez un produit ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  analyser
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demoProducts.map((product, index) => (
              <div
                key={index}
                className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all duration-200 border-2 ${
                  selectedProduct?.name === product.name 
                    ? 'border-green-500 ring-2 ring-green-200' 
                    : 'border-transparent hover:border-green-300 hover:shadow-lg'
                }`}
                onClick={() => handleProductTest(product)}
              >
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">{product.icon}</div>
                  <h3 className="text-lg font-bold text-gray-800">{product.name}</h3>
                  <p className="text-sm text-gray-600">{product.category}</p>
                </div>
                
                <p className="text-gray-700 text-sm mb-4">{product.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    product.expectedNova === 1 ? 'bg-green-100 text-green-800' :
                    product.expectedNova === 2 ? 'bg-yellow-100 text-yellow-800' :
                    product.expectedNova === 3 ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    NOVA {product.expectedNova}
                  </div>
                  
                  <button 
                    disabled={loading}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    {loading && selectedProduct?.name === product.name ? 'Analyse...' : 'Analyser'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zone de rÃ©sultats */}
        {(data || loading || error) && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                RÃ©sultats de l'analyse
              </h2>
              {data && (
                <button
                  onClick={handleReset}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Nouvelle analyse
                </button>
              )}
            </div>
            
            <NovaResults result={data!} loading={loading} />
          </div>
        )}

        {/* Informations techniques */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã‚ÂºÃƒâ€šÃ‚Â ÃƒÂ¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â Informations Techniques
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">Classification NOVA</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                  <span><strong>Groupe 1:</strong> Aliments non transformÃ©s</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
                  <span><strong>Groupe 2:</strong> IngrÃ©dients culinaires</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-orange-500 rounded-full mr-3"></div>
                  <span><strong>Groupe 3:</strong> Aliments transformÃ©s</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                  <span><strong>Groupe 4:</strong> Ultra-transformÃ©s</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">Technologies utilisÃ©es</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â¤Ã¢Ã¢â€šÂ¬Ã¢â‚¬Å“ <strong>IA propriÃ©taire</strong> de classification automatique</li>
                <li>ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã…â€œÃƒâ€¦Ã‚Â  <strong>Analyse multi-critÃ¨res</strong> (santÃ©, environnement, social)</li>
                <li>ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚Â¬ <strong>DÃ©tection d'additifs</strong> avec Ã©valuation des risques</li>
                <li>ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã‚Â½Ãƒâ€šÃ‚Â¯ <strong>Recommandations</strong> personnalisÃ©es basÃ©es sur la science</li>
                <li>ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã…â€œÃƒâ€¦Ã‚Â¡ <strong>Sources scientifiques</strong> INSERM, EFSA, ANSES</li>
                <li>Ã¢Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â¡ <strong>Temps de rÃ©ponse</strong> optimisÃ© &lt; 2 secondes</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">
              <strong>ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â± Mission ECOLOJIA:</strong> DÃ©mocratiser l'accÃ¨s ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  l'information nutritionnelle 
              scientifique pour encourager une consommation plus responsable et Ã©clairÃ©e.
            </p>
          </div>
        </div>

        {/* Footer avec statistiques */}
        <div className="mt-8 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-green-600">98%</div>
              <div className="text-sm text-gray-600">PrÃ©cision IA</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-blue-600">&lt;2s</div>
              <div className="text-sm text-gray-600">Temps analyse</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-purple-600">500+</div>
              <div className="text-sm text-gray-600">Additifs rÃ©fÃ©rencÃ©s</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-orange-600">24/7</div>
              <div className="text-sm text-gray-600">DisponibilitÃ©</div>
            </div>
          </div>
          
          <p className="text-gray-600">
            ECOLOJIA Ã¢Ã¢â€šÂ¬Ãƒâ€šÃ‚Â¢ Intelligence Artificielle de Classification Nutritionnelle Ã¢Ã¢â€šÂ¬Ãƒâ€šÃ‚Â¢ 
            <span className="text-green-600 ml-1">Mode DÃ©monstration</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Demo;

