// PATH: frontend/src/pages/UnifiedResultsPage.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  AlertTriangle, 
  Leaf, 
  Download, 
  MessageCircle,
  Share2,
  BookOpen,
  TrendingUp,
  ShieldAlert,
  Droplets,
  Wind
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface AnalysisResult {
  product: {
    id?: string;
    name: string;
    brand?: string;
    category: 'food' | 'cosmetics' | 'detergents';
    image?: string;
    barcode?: string;
  };
  analysis: {
    healthScore: number;
    category: string;
    // Food specific
    novaScore?: number;
    additives?: Array<{ name: string; riskLevel: string }>;
    ultraTransformScore?: number;
    // Cosmetics specific
    inciScore?: number;
    endocrineDisruptors?: Array<{ name: string; level: string }>;
    allergens?: string[];
    // Detergents specific
    ecoScore?: number;
    biodegradability?: number;
    aquaticToxicity?: string;
    // Common
    recommendations: string[];
    alternatives?: Array<{
      name: string;
      brand: string;
      score: number;
      reason: string;
    }>;
  };
  timestamp?: Date;
}

export const UnifiedResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (location.state?.result) {
      setResult(location.state.result);
    } else {
      // Rediriger si pas de résultat
      navigate('/');
    }
  }, [location, navigate]);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food':
        return <BookOpen className="w-6 h-6" />;
      case 'cosmetics':
        return <Heart className="w-6 h-6" />;
      case 'detergents':
        return <Droplets className="w-6 h-6" />;
      default:
        return <Leaf className="w-6 h-6" />;
    }
  };

  const saveToHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://ecolojia-backend-working.onrender.com/api/user/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: result?.product.id,
          analysisResult: result?.analysis,
          category: result?.product.category
        })
      });

      if (response.ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  const exportToPDF = async () => {
    const element = document.getElementById('results-content');
    if (!element || !result) return;

    setIsLoading(true);
    try {
      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`ecolojia-${result.product.name}-analysis.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const shareResults = async () => {
    if (!result) return;

    const shareData = {
      title: `Analyse ECOLOJIA - ${result.product.name}`,
      text: `Score santé : ${result.analysis.healthScore}/100. Découvrez l'analyse complète sur ECOLOJIA.`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback - copier le lien
        await navigator.clipboard.writeText(window.location.href);
        alert('Lien copié dans le presse-papier !');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const startChatWithContext = () => {
    if (!result) return;
    navigate('/chat', { 
      state: { 
        context: {
          product: result.product,
          analysis: result.analysis
        }
      }
    });
  };

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Aucun résultat à afficher</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header avec actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-lg ${getScoreBgColor(result.analysis.healthScore)}`}>
                {getCategoryIcon(result.product.category)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{result.product.name}</h1>
                {result.product.brand && (
                  <p className="text-gray-600">{result.product.brand}</p>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={saveToHistory}
                className={`p-2 rounded-lg transition-colors ${
                  isSaved ? 'bg-green-100 text-green-600' : 'bg-gray-100 hover:bg-gray-200'
                }`}
                title="Sauvegarder"
              >
                <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={shareResults}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                title="Partager"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={exportToPDF}
                disabled={isLoading}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                title="Exporter PDF"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Score principal */}
          <div className="text-center mb-6">
            <div className={`text-6xl font-bold ${getScoreColor(result.analysis.healthScore)}`}>
              {result.analysis.healthScore}/100
            </div>
            <p className="text-gray-600 mt-2">Score Santé Global</p>
          </div>

          {/* Bouton Chat IA */}
          <button
            onClick={startChatWithContext}
            className="w-full bg-primary text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-primary-dark transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Poser des questions à l'IA sur ce produit</span>
          </button>
        </div>

        {/* Contenu principal */}
        <div id="results-content" className="space-y-6">
          {/* Analyse spécifique par catégorie */}
          {result.product.category === 'food' && (
            <FoodAnalysis analysis={result.analysis} />
          )}
          {result.product.category === 'cosmetics' && (
            <CosmeticsAnalysis analysis={result.analysis} />
          )}
          {result.product.category === 'detergents' && (
            <DetergentsAnalysis analysis={result.analysis} />
          )}

          {/* Recommandations */}
          {result.analysis.recommendations.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                Recommandations
              </h2>
              <ul className="space-y-2">
                {result.analysis.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Alternatives */}
          {result.analysis.alternatives && result.analysis.alternatives.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Leaf className="w-5 h-5 mr-2 text-green-600" />
                Alternatives plus saines
              </h2>
              <div className="grid gap-4">
                {result.analysis.alternatives.map((alt, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{alt.name}</h3>
                        <p className="text-sm text-gray-600">{alt.brand}</p>
                        <p className="text-sm text-gray-500 mt-1">{alt.reason}</p>
                      </div>
                      <div className={`text-2xl font-bold ${getScoreColor(alt.score)}`}>
                        {alt.score}/100
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Composant pour l'analyse alimentaire
const FoodAnalysis: React.FC<{ analysis: any }> = ({ analysis }) => (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <h2 className="text-xl font-semibold mb-4">Analyse Nutritionnelle</h2>
    
    {analysis.novaScore && (
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Score NOVA</span>
          <span className={`text-lg font-semibold ${
            analysis.novaScore <= 2 ? 'text-green-600' : 'text-red-600'
          }`}>
            {analysis.novaScore}/4
          </span>
        </div>
        <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              analysis.novaScore <= 2 ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{ width: `${(analysis.novaScore / 4) * 100}%` }}
          />
        </div>
      </div>
    )}

    {analysis.additives && analysis.additives.length > 0 && (
      <div className="mt-4">
        <h3 className="font-medium text-gray-900 mb-2 flex items-center">
          <AlertTriangle className="w-4 h-4 mr-1 text-orange-500" />
          Additifs détectés
        </h3>
        <div className="space-y-1">
          {analysis.additives.map((additive: any, index: number) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{additive.name}</span>
              <span className={`px-2 py-1 rounded text-xs ${
                additive.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                additive.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {additive.riskLevel}
              </span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

// Composant pour l'analyse cosmétique
const CosmeticsAnalysis: React.FC<{ analysis: any }> = ({ analysis }) => (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <h2 className="text-xl font-semibold mb-4">Analyse Cosmétique</h2>
    
    {analysis.endocrineDisruptors && analysis.endocrineDisruptors.length > 0 && (
      <div className="mb-4">
        <h3 className="font-medium text-gray-900 mb-2 flex items-center">
          <ShieldAlert className="w-4 h-4 mr-1 text-red-500" />
          Perturbateurs endocriniens
        </h3>
        <div className="space-y-1">
          {analysis.endocrineDisruptors.map((disruptor: any, index: number) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{disruptor.name}</span>
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                {disruptor.level}
              </span>
            </div>
          ))}
        </div>
      </div>
    )}

    {analysis.allergens && analysis.allergens.length > 0 && (
      <div className="mt-4">
        <h3 className="font-medium text-gray-900 mb-2">Allergènes</h3>
        <div className="flex flex-wrap gap-2">
          {analysis.allergens.map((allergen: string, index: number) => (
            <span key={index} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
              {allergen}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
);

// Composant pour l'analyse détergents
const DetergentsAnalysis: React.FC<{ analysis: any }> = ({ analysis }) => (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <h2 className="text-xl font-semibold mb-4">Impact Environnemental</h2>
    
    {analysis.biodegradability !== undefined && (
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Biodégradabilité</span>
          <span className={`text-lg font-semibold ${
            analysis.biodegradability >= 80 ? 'text-green-600' : 'text-orange-600'
          }`}>
            {analysis.biodegradability}%
          </span>
        </div>
        <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              analysis.biodegradability >= 80 ? 'bg-green-500' : 'bg-orange-500'
            }`}
            style={{ width: `${analysis.biodegradability}%` }}
          />
        </div>
      </div>
    )}

    {analysis.aquaticToxicity && (
      <div className="mt-4">
        <h3 className="font-medium text-gray-900 mb-2 flex items-center">
          <Wind className="w-4 h-4 mr-1 text-blue-500" />
          Toxicité aquatique
        </h3>
        <span className={`px-3 py-1 rounded text-sm ${
          analysis.aquaticToxicity === 'low' ? 'bg-green-100 text-green-700' :
          analysis.aquaticToxicity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {analysis.aquaticToxicity === 'low' ? 'Faible' :
           analysis.aquaticToxicity === 'medium' ? 'Moyenne' : 'Élevée'}
        </span>
      </div>
    )}
  </div>
);

export default UnifiedResultsPage;