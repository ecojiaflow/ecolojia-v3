// =============================
// PATH: frontend/src/pages/ProductPage.tsx
// =============================

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { analysisService } from '../services/analysisService';
import { visionService } from '../services/visionService';
import ProgressiveAnalysis from '../components/analysis/ProgressiveAnalysis';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBoundary from '../components/ErrorBoundary';
import { useAuth } from '../hooks/useAuth';

/**
 * ProductPage - Version intégrée avec backend ECOLOJIA
 * - Intégration complète avec l'API backend
 * - Support des 3 modes de scan (barcode, photo, manuel)
 * - Affichage progressif selon le niveau utilisateur (free/premium)
 * - Utilise le nouveau composant ProgressiveAnalysis
 */

interface ProductAnalysis {
  productId: string;
  name: string;
  brand?: string;
  category: string;
  barcode?: string;
  
  // Scores
  healthScore: number;
  environmentScore: number;
  ethicsScore: number;
  overallScore: number;
  
  // Analyse santé
  novaGroup: number;
  nutriScore: string;
  
  // Détails
  ingredients: string[];
  additives: {
    code: string;
    name: string;
    risk: 'low' | 'medium' | 'high';
    description?: string;
  }[];
  allergens: string[];
  nutritionalInfo?: any;
  
  // Alternatives
  alternatives?: any[];
  
  // Metadata
  sources?: any[];
  lastUpdated: string;
  confidence: number;
}

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // États principaux
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Informations du produit
  const [productInfo, setProductInfo] = useState({
    name: '',
    brand: '',
    category: 'food',
    ingredients: '',
    barcode: ''
  });

  // Mode d'arrivée sur la page
  const [scanMethod, setScanMethod] = useState<'barcode' | 'photo' | 'manual' | 'direct'>('direct');
  const [ocrData, setOcrData] = useState<any>(null);

  // Récupération des données depuis la navigation
  useEffect(() => {
    // Données passées par la navigation (depuis ScanPage)
    const state = location.state as any;
    if (state?.analysis) {
      setAnalysis(state.analysis);
      setScanMethod(state.scanMethod || 'direct');
      setOcrData(state.ocrData || null);
      return;
    }

    // Paramètres URL
    const barcode = searchParams.get('barcode');
    const name = searchParams.get('name');
    const ingredients = searchParams.get('ingredients');

    if (barcode || name) {
      setProductInfo({
        name: name || '',
        brand: searchParams.get('brand') || '',
        category: searchParams.get('category') || 'food',
        ingredients: ingredients || '',
        barcode: barcode || ''
      });
      setScanMethod(barcode ? 'barcode' : 'manual');
    }

    // Si on a un ID, charger l'analyse
    if (id && !state?.analysis) {
      loadAnalysis(id);
    }
  }, [id, location.state, searchParams]);

  // Charger une analyse existante
  const loadAnalysis = async (productId: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await analysisService.getAnalysis(productId);
      
      if (result.success && result.data) {
        setAnalysis(result.data);
      } else {
        throw new Error(result.message || 'Analyse non trouvée');
      }
    } catch (err: any) {
      console.error('Erreur chargement analyse:', err);
      setError(err.message || 'Impossible de charger l\'analyse');
    } finally {
      setLoading(false);
    }
  };

  // Analyser un nouveau produit
  const analyzeProduct = async () => {
    if (!productInfo.name && !productInfo.barcode) {
      setError('Veuillez fournir au moins le nom du produit ou un code-barres');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let result;

      // Analyse par code-barres
      if (productInfo.barcode) {
        result = await analysisService.analyzeByBarcode(productInfo.barcode);
      } 
      // Analyse manuelle
      else {
        result = await analysisService.analyzeManual({
          name: productInfo.name,
          brand: productInfo.brand,
          category: productInfo.category,
          ingredients: productInfo.ingredients
        });
      }

      if (result.success && result.data) {
        setAnalysis(result.data);
        // Mettre à jour l'URL avec l'ID du produit
        navigate(`/product/${result.data.productId}`, { replace: true });
      } else {
        throw new Error(result.message || 'Analyse échouée');
      }

    } catch (err: any) {
      console.error('Erreur analyse:', err);
      setError(err.message || 'Impossible d\'analyser ce produit');
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleNewAnalysis = () => {
    navigate('/scan');
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  const handleExportPDF = async () => {
    if (!analysis) return;
    
    try {
      const response = await analysisService.exportAnalysis(analysis.productId, 'pdf');
      // Télécharger le PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analyse-${analysis.name.replace(/\s+/g, '-')}.pdf`;
      a.click();
    } catch (err) {
      console.error('Erreur export PDF:', err);
    }
  };

  const handleChatAI = () => {
    if (analysis) {
      navigate('/chat', {
        state: { 
          context: analysis, 
          initialMessage: `Parle-moi de "${analysis.name}"` 
        }
      });
    }
  };

  // Déterminer le niveau d'affichage selon l'abonnement
  const getDisplayLevel = (): 'basic' | 'detailed' | 'expert' => {
    if (user?.subscription?.plan === 'premium') {
      return 'expert';
    }
    // Pour les utilisateurs gratuits, on peut afficher un peu plus après X scans
    if (user?.stats?.totalScans > 5) {
      return 'detailed';
    }
    return 'basic';
  };

  // Formulaire de saisie manuelle
  if (!analysis && !loading && scanMethod === 'manual' && !id) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                <span className="mr-2 text-lg">←</span>
                Retour
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Analyse manuelle</h1>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du produit *
                  </label>
                  <input
                    value={productInfo.name}
                    onChange={(e) => setProductInfo({ ...productInfo, name: e.target.value })}
                    placeholder="Ex: Nutella 400g"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marque
                  </label>
                  <input
                    value={productInfo.brand}
                    onChange={(e) => setProductInfo({ ...productInfo, brand: e.target.value })}
                    placeholder="Ex: Ferrero"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie
                  </label>
                  <select
                    value={productInfo.category}
                    onChange={(e) => setProductInfo({ ...productInfo, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  >
                    <option value="food">Alimentaire</option>
                    <option value="cosmetic">Cosmétique</option>
                    <option value="detergent">Produit ménager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ingrédients
                  </label>
                  <textarea
                    value={productInfo.ingredients}
                    onChange={(e) => setProductInfo({ ...productInfo, ingredients: e.target.value })}
                    placeholder="Copiez la liste complète des ingrédients..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <button
                  onClick={analyzeProduct}
                  disabled={!productInfo.name || loading}
                  className="w-full bg-green-600 text-white py-3 rounded-md font-medium hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? 'Analyse en cours...' : 'Analyser le produit'}
                </button>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              <span className="mr-2 text-lg">←</span>
              Retour
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={handleNewAnalysis}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Nouvelle analyse
              </button>
              {user?.subscription?.plan !== 'premium' && (
                <button
                  onClick={handleUpgrade}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  Passer Premium
                </button>
              )}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-lg shadow-md p-12">
              <div className="text-center">
                <LoadingSpinner />
                <h3 className="mt-4 text-lg font-medium text-gray-800">
                  Analyse en cours...
                </h3>
                <p className="text-gray-600 mt-2">
                  {scanMethod === 'photo' ? 'Extraction des données de l\'image...' : 'Classification et évaluation...'}
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && !analysis && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-center">
                <div className="text-6xl mb-4">❌</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Erreur d'analyse
                </h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={handleNewAnalysis}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {/* Résultats */}
          {analysis && !loading && (
            <>
              {/* Info scan method */}
              {scanMethod !== 'direct' && (
                <div className="mb-4 flex items-center justify-center">
                  <span className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600">
                    {scanMethod === 'barcode' && '📊 Scanné par code-barres'}
                    {scanMethod === 'photo' && '📸 Analysé par photo'}
                    {scanMethod === 'manual' && '✍️ Saisi manuellement'}
                  </span>
                </div>
              )}

              {/* Composant d'analyse progressive */}
              <ProgressiveAnalysis
                analysis={analysis}
                level={getDisplayLevel()}
                userTier={user?.subscription?.plan || 'free'}
                onUpgrade={handleUpgrade}
              />

              {/* Actions */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={handleChatAI}
                  className="flex items-center justify-center gap-2 p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  💬 Discuter avec l'IA
                </button>
                
                {user?.subscription?.plan === 'premium' && (
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center justify-center gap-2 p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                  >
                    📄 Exporter en PDF
                  </button>
                )}
                
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center justify-center gap-2 p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  📊 Voir mon dashboard
                </button>
              </div>

              {/* OCR Data Debug (dev only) */}
              {ocrData && process.env.NODE_ENV === 'development' && (
                <div className="mt-8 bg-gray-100 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2">Données OCR extraites:</h4>
                  <pre className="text-xs text-gray-600 overflow-auto">
                    {JSON.stringify(ocrData, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ProductPage;