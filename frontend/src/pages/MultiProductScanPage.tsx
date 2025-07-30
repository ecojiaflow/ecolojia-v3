// PATH: frontend/ecolojiaFrontV3/src/pages/MultiProductScanPage.tsx
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Search, ArrowLeft, Sparkles, Apple, Droplets } from 'lucide-react';

// ✅ IMPORTS CORRIGÉS avec les bons chemins
import { CosmeticsAnalyzer, DetergentsAnalyzer } from '../components/analysis/CosmeticsAnalyzer';
import { CosmeticAnalysisDisplay, DetergentAnalysisDisplay } from '../components/analysis/CosmeticAnalysisDisplay';

// Composant CategorySelector intégré pour éviter les problèmes d'import
interface CategorySelectorProps {
  selectedCategory: 'food' | 'cosmetics' | 'detergents';
  onCategoryChange: (category: 'food' | 'cosmetics' | 'detergents') => void;
  className?: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
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
                    <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-green-500 to-blue-500 text-white">
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

// Interface principale
interface MultiProductScanPageProps {}

type ProductCategory = 'food' | 'cosmetics' | 'detergents';

export const MultiProductScanPage: React.FC<MultiProductScanPageProps> = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('food');
  const [scanMode, setScanMode] = useState<'category' | 'scan' | 'results'>('category');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [productName, setProductName] = useState('');

  // Mock données selon catégorie pour demo
  const getMockData = (category: ProductCategory) => {
    switch (category) {
      case 'cosmetics':
        return {
          productName: 'Crème Hydratante Visage',
          composition: 'aqua, glycerin, cetyl alcohol, dimethicone, butylparaben, methylparaben, parfum, limonene, linalool, benzyl benzoate',
          barcode: '3401234567890'
        };
      case 'detergents':
        return {
          productName: 'Lessive Liquide Concentrée',
          composition: 'sodium lauryl sulfate, sodium laureth sulfate, phosphates, enzymes, parfum, colorants, conservateurs',
          barcode: '3501234567891'
        };
      default:
        return {
          productName: 'Produit Alimentaire',
          composition: 'Ingrédients alimentaires...',
          barcode: '3301234567892'
        };
    }
  };

  const handleCategoryChange = useCallback((category: ProductCategory) => {
    setSelectedCategory(category);
  }, []);

  const handleStartScan = useCallback(() => {
    setScanMode('scan');
  }, []);

  const handleScanProduct = useCallback(async () => {
    setIsAnalyzing(true);
    
    try {
      // Simulation scan avec données mock
      const mockData = getMockData(selectedCategory);
      setProductName(mockData.productName);
      
      // Analyse selon catégorie
      let result;
      if (selectedCategory === 'cosmetics') {
        const analyzer = new CosmeticsAnalyzer();
        result = await analyzer.analyzeCosmetic(mockData.composition, mockData.productName);
      } else if (selectedCategory === 'detergents') {
        const analyzer = new DetergentsAnalyzer();
        result = await analyzer.analyzeDetergent(mockData.composition, mockData.productName);
      } else {
        // Redirection vers analyse alimentaire existante
        navigate('/scan');
        return;
      }
      
      setAnalysisResult(result);
      setScanMode('results');
      
    } catch (error) {
      console.error('Erreur analyse:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedCategory, navigate]);

  const handleBackToCategories = useCallback(() => {
    setScanMode('category');
    setAnalysisResult(null);
    setProductName('');
  }, []);

  const handleNewScan = useCallback(() => {
    setScanMode('scan');
    setAnalysisResult(null);
    setProductName('');
  }, []);

  const renderCategorySelection = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <span className="text-purple-600 font-medium">IA Multi-Produits</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Analyse Multi-Catégories
          </h1>
          <p className="text-xl text-gray-600">
            L'IA qui s'adapte à chaque type de produit
          </p>
        </div>

        {/* Category Selector */}
        <CategorySelector
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          className="mb-8"
        />

        {/* Action Button */}
        <div className="text-center">
          <button
            onClick={handleStartScan}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <Camera className="w-6 h-6 mr-2 inline" />
            Commencer l'Analyse {selectedCategory === 'food' ? 'Alimentaire' : 
                                selectedCategory === 'cosmetics' ? 'Cosmétique' : 'Détergent'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderScanInterface = () => (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBackToCategories}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Changer catégorie</span>
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Analyse {selectedCategory === 'cosmetics' ? 'Cosmétique' : 'Détergent'}
            </h2>
          </div>
        </div>

        {/* Scan Simulation */}
        <div className="bg-white rounded-xl p-8 shadow-lg text-center">
          <div className="mb-6">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
              <Camera className="w-16 h-16 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Scanner votre produit
            </h3>
            <p className="text-gray-600">
              {selectedCategory === 'cosmetics' 
                ? 'Analysez la composition INCI et détectez les perturbateurs endocriniens'
                : 'Évaluez l\'impact environnemental et la toxicité aquatique'
              }
            </p>
          </div>

          {/* Demo Analysis Button */}
          <button
            onClick={handleScanProduct}
            disabled={isAnalyzing}
            className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
              isAnalyzing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg transform hover:scale-105'
            }`}
          >
            {isAnalyzing ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Analyse en cours...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5" />
                <span>Analyser Produit Demo</span>
              </div>
            )}
          </button>

          <p className="text-xs text-gray-500 mt-4">
            Version demo - Utilise des données d'exemple pour illustration
          </p>
        </div>

        {/* Category specific info */}
        <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">
            {selectedCategory === 'cosmetics' ? '🧴 Analyse Cosmétique' : '🧽 Analyse Détergent'}
          </h4>
          <p className="text-sm text-blue-700">
            {selectedCategory === 'cosmetics' 
              ? 'Notre IA analyse la liste INCI pour détecter les perturbateurs endocriniens, allergènes et évaluer la naturalité selon les standards européens.'
              : 'Notre IA évalue l\'impact environnemental, la biodégradabilité et la toxicité aquatique selon les critères Ecolabel Européen.'
            }
          </p>
        </div>
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{productName}</h1>
            <p className="text-gray-600">
              Analyse {selectedCategory === 'cosmetics' ? 'cosmétique' : 'détergent'} complète
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleNewScan}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Camera className="w-4 h-4 mr-2 inline" />
              Nouveau scan
            </button>
            <button
              onClick={handleBackToCategories}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Changer catégorie
            </button>
          </div>
        </div>

        {/* Analysis Results */}
        {selectedCategory === 'cosmetics' && analysisResult && (
          <CosmeticAnalysisDisplay 
            analysis={analysisResult} 
            productName={productName}
          />
        )}
        
        {selectedCategory === 'detergents' && analysisResult && (
          <DetergentAnalysisDisplay 
            analysis={analysisResult} 
            productName={productName}
          />
        )}

        {/* Actions */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={() => navigate('/search')}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
          >
            <Search className="w-5 h-5 mr-2" />
            Rechercher alternatives
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Voir mon dashboard
          </button>
        </div>
      </div>
    </div>
  );

  // Render selon mode
  switch (scanMode) {
    case 'category':
      return renderCategorySelection();
    case 'scan':
      return renderScanInterface();
    case 'results':
      return renderResults();
    default:
      return renderCategorySelection();
  }
};

export default MultiProductScanPage;