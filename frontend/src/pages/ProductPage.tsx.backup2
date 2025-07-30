// PATH: frontend/ecolojiaFrontV3/src/pages/ProductPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { analyzeProduct, reset } from '../services/ai/novaClassifier';
import NovaResults from '../components/NovaResults';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBoundary from '../components/ErrorBoundary';
// IMPORTS ULTRA-TRANSFORMATION
import UltraTransformResults from '../components/UltraTransformResults';
import { ultraTransformService } from '../services/ai/ultraTransformService';
// ✅ NOUVEAU: Import Analytics
//import { useUserAnalytics } from '../hooks/useUserAnalytics';

/**
 * ProductPage (Version avec Ultra-Transformation + Analytics)
 * - Affiche l'analyse NOVA d'un produit
 * - Analyse Ultra-Transformation complémentaire
 * - Backend activé avec fallback local
 * - ✅ NOUVEAU: Tracking analytics automatique
 * - Gestion d'erreur améliorée
 */

const predefinedProducts: Record<string, { name: string; ingredients: string }> = {
  'pizza-surgelee-e621-glucose': {
    name: 'Pizza 4 Fromages Surgelée',
    ingredients:
      'Pâte (farine de BLÉ, eau, huile de tournesol, levure, sel, sucre), fromages 25% (MOZZARELLA, EMMENTAL, GORGONZOLA, PARMESAN), sauce tomate, conservateur E202, exhausteur de goût E621, stabilisant E412, colorant E150d'
  },
  'coca-cola-original': {
    name: 'Coca-Cola Original',
    ingredients:
      'Eau gazéifiée, sucre, sirop de glucose-fructose, arôme naturel de cola, colorant E150d (caramel IV), acidifiant E338 (acide phosphorique), édulcorant E952 (cyclamate de sodium), conservateur E211 (benzoate de sodium)'
  },
  'nutella-pate-tartiner': {
    name: 'Nutella Pâte à tartiner',
    ingredients:
      'Sucre, huile de palme, NOISETTES 13%, cacao maigre 7.4%, LAIT écrémé en poudre 6.6%, LACTOSÉRUM en poudre, émulsifiants E322 (lécithines) E471 (mono- et diglycérides d\'acides gras), arôme vanilline'
  },
  'galette-riz-bio': {
    name: 'Galette de riz bio',
    ingredients: 'Riz complet biologique, sucre de canne, huile de tournesol, sel marin, arôme naturel'
  },
  'yaourt-nature-bio': {
    name: 'Yaourt Nature Bio',
    ingredients:
      'LAIT entier pasteurisé issu de l\'agriculture biologique, ferments lactiques (Streptococcus thermophilus, Lactobacillus bulgaricus)'
  },
  'pain-mie-complet': {
    name: 'Pain de Mie Complet',
    ingredients:
      'Farine complète de BLÉ, eau, levure, huile de tournesol, sucre, sel, gluten de BLÉ, conservateur E282, émulsifiant E471, agent de traitement de la farine E300'
  },
  'biscuits-petit-dejeuner': {
    name: 'Biscuits Petit-Déjeuner',
    ingredients:
      'Céréales 58% (farine de BLÉ, flocons d\'AVOINE 14%), sucre, huile de palme, sirop de glucose-fructose, poudre à lever E500, sel, arômes, vitamines (B1, B6, B9, B12, C, E), colorant E160a, émulsifiant E322'
  }
};

const ProductPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const runIdRef = useRef(0);

  // ✅ NOUVEAU: Hook Analytics
  //const { trackScan } = useUserAnalytics();

  const [productName, setProductName] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisSource, setAnalysisSource] = useState<'slug' | 'url' | 'manual'>('slug');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [hasAttemptedAnalysis, setHasAttemptedAnalysis] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // STATES POUR ULTRA-TRANSFORMATION
  const [ultraTransformData, setUltraTransformData] = useState<any>(null);
  const [ultraTransformLoading, setUltraTransformLoading] = useState(false);
  const [ultraTransformError, setUltraTransformError] = useState<string | null>(null);
  const [showUltraTransform, setShowUltraTransform] = useState(false);

  // Reset le flag quand on change de page
  useEffect(() => {
    setIsInitialized(false);
    // Reset Ultra-Transform aussi
    setShowUltraTransform(false);
    setUltraTransformData(null);
    setUltraTransformError(null);
  }, [location.pathname, slug]);

  useEffect(() => {
    // Éviter les doubles appels
    if (isInitialized) return;
    
    // Reset states when navigating
    setError(null);
    setData(null);
    setHasAttemptedAnalysis(false);

    const productNameParam = searchParams.get('productName');
    const ingredientsParam = searchParams.get('ingredients');

    // 1. Paramètres URL
    if (productNameParam && ingredientsParam) {
      const decodedName = decodeURIComponent(productNameParam);
      const decodedIngredients = decodeURIComponent(ingredientsParam);
      setProductName(decodedName);
      setIngredients(decodedIngredients);
      setAnalysisSource('url');
      setDebugInfo({ source: 'url_params' });
      setIsInitialized(true);
      performAnalysis(decodedName, decodedIngredients, 'url_params');
      return;
    }

    // 2. Slug prédéfini
    if (slug) {
      const product = predefinedProducts[slug];
      if (product) {
        setProductName(product.name);
        setIngredients(product.ingredients);
        setAnalysisSource('slug');
        setDebugInfo({ source: 'predefined_slug', slug });
        setIsInitialized(true);
        performAnalysis(product.name, product.ingredients, 'predefined_slug');
      } else {
        setError(`Slug "${slug}" non reconnu`);
        setDebugInfo({ source: 'unknown_slug', slug });
        setHasAttemptedAnalysis(true);
        setIsInitialized(true);
      }
      return;
    }

    // 3. Mode manuel
    if (!productNameParam && !ingredientsParam && !slug) {
      setAnalysisSource('manual');
      setDebugInfo({ source: 'manual_input' });
      setIsInitialized(true);
    }
  }, [slug, searchParams, location.pathname]);

  const performAnalysis = async (name: string, ingr: string, source: string) => {
    if (!name.trim() || !ingr.trim()) {
      setError('Le nom du produit et les ingrédients sont requis');
      setHasAttemptedAnalysis(true);
      return;
    }
    
    const runId = ++runIdRef.current;
    
    try {
      setLoading(true);
      setError(null);
      setHasAttemptedAnalysis(true);

      console.log('🎯 ProductPage: Démarrage analyse', { name, source });
      
      const result = await analyzeProduct(name.trim(), ingr.trim());
      
      if (runId !== runIdRef.current) return; // réponse obsolète ignorée

      console.log('📊 ProductPage: Résultat reçu', result);

      // Validation basique du résultat
      if (result && typeof result === 'object' && result.novaGroup && result.healthScore !== undefined) {
        // Les données sont valides, on les utilise
        setData(result);
        setError(null);

        // ✅ NOUVEAU: TRACKING ANALYTICS AUTOMATIQUE
        //try {
        //  trackScan({
          //  productName: name,
            //novaGroup: result.novaGroup,
            //healthScore: result.healthScore,
            //ultraTransformLevel: result.novaGroup >= 4 ? 4 : result.novaGroup,
            //additives: result.additives?.detected?.map((a: any) => a.code) || [],
            //ingredients: ingr,
            //analysisSource: 'nova',
            //userRating: undefined,
            //isBookmarked: false
          //});
          
          //console.log('📊 ProductPage: Analyse trackée dans analytics');
        //} catch (trackError) {
        //  console.warn('⚠️ Erreur tracking analytics:', trackError);
          // Ne pas faire échouer l'analyse si tracking échoue
       // }
        
        setDebugInfo((p: any) => ({
          ...p,
          analysisSuccess: true,
          sourceRun: source,
          novaGroup: result.novaGroup,
          healthScore: result.healthScore,
          additivesCount: result.additives?.total || 0,
          backend: result.source || 'unknown',
          tracked: true, // ✅ NOUVEAU: Indiquer tracking réussi
          ts: Date.now()
        }));
        
        console.log('✅ ProductPage: Analyse réussie et données sauvegardées');
      } else {
        console.error('❌ ProductPage: Format de résultat invalide', result);
        throw new Error("Format de résultat invalide");
      }
      
    } catch (e: any) {
      if (runId !== runIdRef.current) return;
      
      console.error('❌ ProductPage: Erreur analyse', e);
      const msg = e?.message || "Impossible d'analyser ce produit";
      
      // Ne pas afficher l'erreur si on a déjà des données
      if (!data) {
        setError(msg);
      }

      setDebugInfo((p: any) => ({
        ...p,
        analysisError: true,
        errorMessage: msg,
        ts: Date.now()
      }));
    } finally {
      if (runId === runIdRef.current) setLoading(false);
    }
  };

  // FONCTION POUR ULTRA-TRANSFORMATION
  const performUltraTransformAnalysis = async () => {
    if (!productName || !ingredients) {
      setUltraTransformError('Données produit manquantes');
      return;
    }

    try {
      setUltraTransformLoading(true);
      setUltraTransformError(null);
      
      console.log('🔬 Lancement analyse Ultra-Transformation');
      
      const result = await ultraTransformService.analyzeUltraTransformation(
        productName,
        ingredients
      );
      
      console.log('✅ Résultat Ultra-Transformation:', result);
      setUltraTransformData(result);
      setShowUltraTransform(true);

      // ✅ NOUVEAU: TRACKING ULTRA-TRANSFORMATION
      try {
        trackScan({
          productName: productName,
          novaGroup: result.novaClass || 4,
          healthScore: 100 - (result.transformationScore || 80),
          ultraTransformLevel: result.transformationLevel || 4,
          additives: result.industrialMarkers?.map((m: string) => m.split(':')[1] || m) || [],
          ingredients: ingredients,
          analysisSource: 'ultra-transform',
          userRating: undefined,
          isBookmarked: false
        });
        
        console.log('📊 Ultra-Transform trackée dans analytics');
      } catch (trackError) {
        console.warn('⚠️ Erreur tracking ultra-transform:', trackError);
      }
      
    } catch (error: any) {
      console.error('❌ Erreur Ultra-Transformation:', error);
      setUltraTransformError(error.message || 'Erreur lors de l\'analyse');
    } finally {
      setUltraTransformLoading(false);
    }
  };

  // Handlers
  const handleRetry = () => performAnalysis(productName, ingredients, 'retry');
  const handleBackToSearch = () => navigate('/search');
  const handleBackToHome = () => navigate('/');
  const handleNewAnalysis = () => {
    reset();
    navigate('/analyze');
  };
  const handleManualAnalysis = () => performAnalysis(productName, ingredients, 'manual');
  const handleGoToChat = () => {
    if (data)
      navigate('/chat', {
        state: { context: data, initialMessage: `Parle-moi de "${data.productName}"` }
      });
    else navigate('/chat');
  };

  // ✅ NOUVEAU: Handler vers Dashboard
  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  // Mode manuel initial vide
  if (analysisSource === 'manual' && !productName && !ingredients && !hasAttemptedAnalysis) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handleBackToHome}
                className="flex items-center text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                <span className="mr-2 text-lg">←</span>Retour à l'accueil
              </button>
              <h1 className="text-2xl font-bold text-gray-800 text-center flex-1">
                Analyse NOVA Manuelle
              </h1>
              <div className="flex space-x-2">
                <button
                  onClick={handleGoToDashboard}
                  className="text-purple-600 hover:text-purple-800 font-medium transition-colors text-sm"
                >
                  📊 Dashboard
                </button>
                <button
                  onClick={handleBackToSearch}
                  className="text-green-600 hover:text-green-800 font-medium transition-colors text-sm"
                >
                  🔍 Recherche
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">🔬</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Analyse personnalisée</h2>
                <p className="text-gray-600">
                  Analysez n'importe quel produit avec notre IA NOVA avancée
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du produit *
                  </label>
                  <input
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Ex: Yaourt nature bio, Coca-Cola..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Liste des ingrédients *
                  </label>
                  <textarea
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    placeholder="Ex: Lait, ferments lactiques..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Copiez la liste complète des ingrédients depuis l'étiquette.
                  </p>
                </div>

                <button
                  onClick={handleManualAnalysis}
                  disabled={!productName.trim() || !ingredients.trim() || loading}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  {loading ? 'Analyse en cours...' : '🔬 Analyser avec NOVA'}
                </button>
              </div>

              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </div>

            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                💡 Conseils pour une analyse précise
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Nom complet : marque + type de produit</li>
                <li>• Copiez exactement la liste d'ingrédients</li>
                <li>• Incluez tous les additifs (E150d, E322, ...)</li>
                <li>• Conservez les pourcentages si indiqués</li>
              </ul>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={analysisSource === 'url' ? handleBackToSearch : handleBackToHome}
              className="flex items-center text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              <span className="mr-2 text-lg">←</span>
              {analysisSource === 'url' ? 'Retour à la recherche' : "Retour à l'accueil"}
            </button>
            <h1 className="text-2xl font-bold text-gray-800 text-center flex-1">Analyse NOVA</h1>
            <div className="flex space-x-2">
              {/* ✅ NOUVEAU: Bouton Dashboard */}
              <button
                onClick={handleGoToDashboard}
                className="text-purple-600 hover:text-purple-800 font-medium transition-colors text-sm"
              >
                📊 Dashboard
              </button>
              <button
                onClick={handleGoToChat}
                className="text-purple-600 hover:text-purple-800 font-medium transition-colors text-sm"
              >
                💬 Chat IA
              </button>
              <button
                onClick={handleNewAnalysis}
                className="text-green-600 hover:text-green-800 font-medium transition-colors text-sm"
              >
                🔬 Nouvelle analyse
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800 mb-2">{productName}</h2>
                <div className="space-y-3">
                  {slug && (
                    <div>
                      <span className="inline-block w-24 font-medium text-gray-700">Slug:</span>
                      <span className="text-gray-600 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {slug}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="inline-block w-24 font-medium text-gray-700">Source:</span>
                    <span className="text-gray-600 text-sm">
                      {analysisSource === 'url'
                        ? '🔗 Recherche Algolia'
                        : analysisSource === 'slug'
                        ? '📦 Exemple prédéfini'
                        : '📝 Saisie manuelle'}
                    </span>
                  </div>
                  <div>
                    <span className="inline-block w-24 font-medium text-gray-700 align-top">
                      Ingrédients:
                    </span>
                    <span className="text-gray-600 text-sm leading-relaxed inline-block max-w-2xl">
                      {ingredients}
                    </span>
                  </div>
                </div>
              </div>
              <div className="ml-6 text-right">
                {loading && (
                  <div className="flex items-center text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
                    <span className="text-sm font-medium">Analyse...</span>
                  </div>
                )}
                {data && !loading && (
                  <div className="flex items-center text-green-600">
                    <span className="mr-2">✅</span>
                    <span className="text-sm font-medium">Analysé</span>
                  </div>
                )}
                {error && !data && hasAttemptedAnalysis && !loading && (
                  <div className="flex items-center text-red-600">
                    <span className="mr-2">❌</span>
                    <span className="text-sm font-medium">Erreur</span>
                  </div>
                )}
              </div>
            </div>

            {error && !data && hasAttemptedAnalysis && !loading && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-red-800 font-medium mb-1">Erreur d'analyse</h3>
                    <p className="text-red-700 text-sm mb-3">{error}</p>
                    <div className="text-sm">
                      <p className="text-red-800 font-medium mb-2">💡 Solutions suggérées:</p>
                      <ul className="text-red-700 list-disc list-inside space-y-1">
                        {error.includes('requis') && (
                          <li>Vérifiez le nom et les ingrédients</li>
                        )}
                        <li>Réessayez dans quelques secondes</li>
                        <li>Testez un autre produit (Nutella, Yaourt bio)</li>
                        <li>Utilisez un exemple prédéfini</li>
                      </ul>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={handleRetry}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                      >
                        🔄 Réessayer
                      </button>
                      <button
                        onClick={() => navigate('/product/nutella-pate-tartiner')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                      >
                        🧪 Tester Nutella
                      </button>
                      <button
                        onClick={() => navigate('/product/yaourt-nature-bio')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                      >
                        🥛 Tester Yaourt Bio
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {loading && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex flex-col items-center justify-center">
                <LoadingSpinner />
                <h3 className="text-lg font-medium text-gray-800 mb-2 mt-4">
                  Analyse IA en cours...
                </h3>
                <p className="text-gray-600 text-center">
                  Classification NOVA, détection d'additifs, recommandations...
                </p>
              </div>
            </div>
          )}

          {data && (
            <div className="transition-all duration-500 ease-in-out">
              <NovaResults result={data} loading={false} />
              
              {/* BOUTON ULTRA-TRANSFORMATION */}
              {!ultraTransformLoading && !showUltraTransform && (
                <div className="mt-6 text-center">
                  <button
                    onClick={performUltraTransformAnalysis}
                    disabled={ultraTransformLoading}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center"
                  >
                    <span className="text-xl mr-2">🔬</span>
                    {ultraTransformLoading ? 'Analyse en cours...' : 'Analyser l\'Ultra-Transformation'}
                  </button>
                  <p className="text-sm text-gray-600 mt-2">
                    Complément de NOVA : évaluation des procédés industriels
                  </p>
                </div>
              )}

              {/* AFFICHAGE RÉSULTATS ULTRA-TRANSFORMATION */}
              {showUltraTransform && (
                <div className="mt-6 transition-all duration-500 ease-in-out">
                  <UltraTransformResults 
                    result={ultraTransformData}
                    loading={ultraTransformLoading}
                    error={ultraTransformError}
                  />
                </div>
              )}

              {/* QUE FAIRE MAINTENANT - VERSION AVEC DASHBOARD */}
              <div className="mt-6 bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">🚀 Que faire maintenant ?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* ✅ NOUVEAU: Bouton Dashboard */}
                  <button
                    onClick={handleGoToDashboard}
                    className="flex items-center justify-center bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    📊 Mon Dashboard
                  </button>
                  <button
                    onClick={handleGoToChat}
                    className="flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    💬 Discuter IA
                  </button>
                  <button
                    onClick={() => navigate('/search')}
                    className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    🔍 Alternatives
                  </button>
                  <button
                    onClick={performUltraTransformAnalysis}
                    disabled={ultraTransformLoading || showUltraTransform}
                    className="flex items-center justify-center bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    🔬 {showUltraTransform ? 'Ultra OK ✅' : 'Ultra-Transform'}
                  </button>
                  <button
                    onClick={handleNewAnalysis}
                    className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    🔬 Nouveau
                  </button>
                </div>
                
                {/* ✅ NOUVEAU: Message Analytics */}
                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-purple-700 text-sm text-center">
                    <strong>📊 Cette analyse a été ajoutée à votre dashboard personnel</strong> pour suivre vos progrès santé !
                  </p>
                </div>
              </div>
            </div>
          )}

          {!loading && !data && !error && productName && ingredients && !hasAttemptedAnalysis && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-4xl mb-4">🔬</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Prêt pour l'analyse NOVA</h3>
              <p className="text-gray-600 mb-6">
                L'analyse va démarrer automatiquement pour ce produit.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleManualAnalysis}
                  disabled={!productName || !ingredients}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  🚀 Lancer l'analyse maintenant
                </button>
                <button
                  onClick={handleNewAnalysis}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  📝 Nouvelle analyse
                </button>
              </div>
            </div>
          )}

          {debugInfo && process.env.NODE_ENV === 'development' && (
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🛠️ Debug Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Navigation</h4>
                  <ul className="text-gray-600 text-sm space-y-1">
                    <li>• <strong>Source:</strong> {debugInfo.source}</li>
                    <li>• <strong>URL:</strong> {location.pathname + location.search}</li>
                    <li>• <strong>Slug:</strong> {slug || 'N/A'}</li>
                    <li>• <strong>Params:</strong> {Object.entries(Object.fromEntries(searchParams.entries())).length > 0 ? 'Présents' : 'Aucun'}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">État de l'analyse</h4>
                  <ul className="text-gray-600 space-y-1">
                    <li>• <strong>Produit:</strong> {productName ? '✅' : '❌'}</li>
                    <li>• <strong>Ingrédients:</strong> {ingredients ? '✅' : '❌'}</li>
                    <li>• <strong>Statut:</strong> {loading ? '⏳ En cours' : data ? '✅ Succès' : error ? '❌ Erreur' : '⏸️ En attente'}</li>
                    <li>• <strong>Mode:</strong> Backend + Fallback local</li>
                    <li>• <strong>Backend:</strong> {debugInfo.backend || 'N/A'}</li>
                    <li>• <strong>Analytics:</strong> {debugInfo.tracked ? '✅ Tracké' : '⏸️ Non tracké'}</li>
                    <li>• <strong>Ultra-Transform:</strong> {showUltraTransform ? '✅ Analysé' : '⏸️ Non lancé'}</li>
                  </ul>
                </div>
              </div>
              
              {debugInfo.analysisSuccess && data && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm">
                    <strong>✅ Analyse réussie:</strong> NOVA {data.novaGroup}, Score {data.healthScore}/100, {data.additives?.total || 0} additif(s), Confiance {data.confidence}%
                    {debugInfo.tracked && <span className="ml-2">📊 Analytics OK</span>}
                  </p>
                </div>
              )}
              
              {debugInfo.analysisError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">
                    <strong>❌ Erreur:</strong> {debugInfo.errorMessage}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Informations techniques - VERSION MISE À JOUR */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🛠️ Informations techniques</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Analyses disponibles</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• <strong>NOVA :</strong> <span className="text-green-600">Classification 1-4 (INSERM)</span></li>
                  <li>• <strong>Ultra-Transform :</strong> <span className="text-blue-600">Niveaux 1-5 (SIGA)</span></li>
                  <li>• <strong>Backend :</strong> <span className="text-green-600">API Render activée</span></li>
                  <li>• <strong>Fallback :</strong> Intelligence artificielle locale</li>
                  <li>• <strong>Base additifs :</strong> 25+ additifs avec évaluation risques</li>
                  <li>• <strong>Confiance :</strong> 70-95% selon les données</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Technologies IA + Analytics</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Classification NOVA backend + local</li>
                  <li>• <span className="text-blue-600 font-medium">Analyse Ultra-Transformation</span></li>
                  <li>• <span className="text-purple-600 font-medium">📊 Tracking Analytics Auto</span></li>
                  <li>• <span className="text-purple-600 font-medium">📈 Dashboard Personnel</span></li>
                  <li>• Détection méthodes de transformation</li>
                  <li>• Évaluation impact nutritionnel</li>
                  <li>• Matrice de naturalité</li>
                  <li>• Score holistique combiné</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-purple-700 text-sm">
                <strong>🎯 Nouveauté :</strong> Chaque analyse est maintenant automatiquement sauvegardée dans votre Dashboard personnel pour suivre l'évolution de votre score santé !
              </p>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ProductPage;