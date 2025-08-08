// PATH: frontend/src/pages/Scan.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarcodeScanner } from '../components/scanner/BarcodeScanner';
import { ManualSearch } from '../components/scanner/ManualSearch';
import { analysisService } from '../services/analysisService';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnalysisState {
  isAnalyzing: boolean;
  error: string | null;
  progress: number;
  currentStep: string;
}

export default function Scan() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [prefillData, setPrefillData] = useState<any>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isAnalyzing: false,
    error: null,
    progress: 0,
    currentStep: ''
  });

  // Écouter les événements de pré-remplissage
  useEffect(() => {
    const handlePrefill = (event: CustomEvent) => {
      console.log('📝 Données reçues pour pré-remplissage:', event.detail);
      setPrefillData(event.detail);
      setShowManualSearch(true);
    };

    window.addEventListener('prefillManualForm', handlePrefill as any);
    
    return () => {
      window.removeEventListener('prefillManualForm', handlePrefill as any);
    };
  }, []);

  // Gérer la navigation depuis d'autres pages
  useEffect(() => {
    if (location.state?.mode === 'manual' && location.state?.prefillData) {
      setPrefillData(location.state.prefillData);
      setShowManualSearch(true);
    }
  }, [location]);

  const handleScanSuccess = async (barcode: string) => {
    console.log('📷 Code-barres scanné:', barcode);
    
    setAnalysisState({
      isAnalyzing: true,
      error: null,
      progress: 20,
      currentStep: 'Vérification des quotas...'
    });

    try {
      const quotas = await analysisService.checkQuota();
      
      if (quotas.remaining <= 0) {
        throw new Error('Quota dépassé. Passez au plan Premium pour continuer.');
      }

      setAnalysisState(prev => ({
        ...prev,
        progress: 40,
        currentStep: 'Recherche du produit dans notre base de données...'
      }));

      const result = await analysisService.analyzeByBarcode(barcode);
      
      console.log('✅ Résultat analyse:', result);

      setAnalysisState(prev => ({
        ...prev,
        progress: 80,
        currentStep: 'Génération du rapport d\'analyse...'
      }));

      await new Promise(resolve => setTimeout(resolve, 500));

      if (result.product && result.product._id) {
        navigate(`/product/${result.product._id}`, {
          state: { 
            analysis: result,
            fromScan: true,
            scanMethod: 'barcode'
          }
        });
      } else {
        throw new Error('Produit non trouvé dans notre base de données');
      }

    } catch (error: any) {
      console.error('❌ Erreur analyse:', error);
      
      let errorMessage = error.message || 'Impossible d\'analyser ce produit';
      
      if (error.message?.includes('non trouvé')) {
        errorMessage = 'Ce produit n\'est pas encore dans notre base de données. Essayez la saisie manuelle ou prenez une photo du produit.';
      } else if (error.message?.includes('Quota')) {
        errorMessage = 'Vous avez atteint votre limite mensuelle de scans gratuits. Passez au plan Premium pour des scans illimités !';
      } else if (error.message?.includes('connexion')) {
        errorMessage = 'Problème de connexion. Vérifiez votre connexion Internet et réessayez.';
      }
      
      setAnalysisState({
        isAnalyzing: false,
        error: errorMessage,
        progress: 0,
        currentStep: ''
      });

      if (error.message?.includes('non trouvé')) {
        setTimeout(() => {
          setShowManualSearch(true);
          setPrefillData({ barcode });
        }, 2000);
      }
    }
  };

  const handleManualSubmit = async (data: any) => {
    console.log('📝 Analyse manuelle:', data);
    
    setAnalysisState({
      isAnalyzing: true,
      error: null,
      progress: 30,
      currentStep: 'Analyse du produit...'
    });

    try {
      const result = await analysisService.analyzeManual(data);
      
      console.log('✅ Résultat analyse manuelle:', result);

      setAnalysisState(prev => ({
        ...prev,
        progress: 90,
        currentStep: 'Finalisation...'
      }));

      await new Promise(resolve => setTimeout(resolve, 500));

      if (result.product && result.product._id) {
        navigate(`/product/${result.product._id}`, {
          state: { 
            analysis: result,
            fromScan: true,
            scanMethod: 'manual'
          }
        });
      }
    } catch (error: any) {
      console.error('❌ Erreur analyse manuelle:', error);
      setAnalysisState({
        isAnalyzing: false,
        error: error.message || 'Impossible d\'analyser ce produit',
        progress: 0,
        currentStep: ''
      });
    }
  };

  const handleError = (error: Error) => {
    console.error('❌ Erreur scanner:', error);
    setAnalysisState({
      isAnalyzing: false,
      error: error.message || 'Erreur lors du scan. Vérifiez que la caméra est autorisée.',
      progress: 0,
      currentStep: ''
    });
  };

  const handleClose = () => {
    navigate('/dashboard');
  };

  const resetError = () => {
    setAnalysisState(prev => ({ ...prev, error: null }));
  };

  const handleManualData = (data: any) => {
    console.log('📝 Données manuelles reçues:', data);
    setPrefillData(data);
    setShowManualSearch(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Scanner un produit
          </h1>
          <p className="text-lg text-gray-600">
            Découvrez instantanément l'impact de vos produits sur votre santé
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!analysisState.isAnalyzing && !showManualSearch ? (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <BarcodeScanner
                onScanSuccess={handleScanSuccess}
                onError={handleError}
                onClose={handleClose}
                onManualData={handleManualData}
              />
            </motion.div>
          ) : showManualSearch ? (
            <motion.div
              key="manual"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <ManualSearch
                onSubmit={handleManualSubmit}
                prefillData={prefillData}
              />
              <button
                onClick={() => {
                  setShowManualSearch(false);
                  setPrefillData(null);
                }}
                className="mt-4 text-sm text-gray-600 hover:text-gray-800 underline block text-center"
              >
                Retour au scanner
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl p-8"
            >
              <div className="text-center">
                <div className="relative inline-block mb-6">
                  <Loader2 className="w-20 h-20 text-green-600 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-green-600">
                      {analysisState.progress}%
                    </span>
                  </div>
                </div>
                
                <h3 className="text-2xl font-semibold mb-3 text-gray-800">
                  Analyse en cours...
                </h3>
                
                <p className="text-gray-600 mb-6 text-lg">
                  {analysisState.currentStep}
                </p>

                <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${analysisState.progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>

                <div className="flex justify-between text-sm text-gray-500 mt-6">
                  <div className={`flex items-center ${analysisState.progress >= 20 ? 'text-green-600' : ''}`}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Quotas
                  </div>
                  <div className={`flex items-center ${analysisState.progress >= 40 ? 'text-green-600' : ''}`}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Recherche
                  </div>
                  <div className={`flex items-center ${analysisState.progress >= 80 ? 'text-green-600' : ''}`}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Analyse
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {analysisState.error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-md"
            >
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-red-800 font-semibold mb-1 text-lg">
                    Oops ! Une erreur est survenue
                  </h4>
                  <p className="text-red-700">
                    {analysisState.error}
                  </p>
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={resetError}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Réessayer
                    </button>
                    <button
                      onClick={() => setShowManualSearch(true)}
                      className="bg-white text-red-600 border border-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors font-medium"
                    >
                      Saisie manuelle
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!analysisState.isAnalyzing && !analysisState.error && !showManualSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-md"
          >
            <h3 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">💡</span>
              Conseils pour un scan réussi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <span className="text-blue-600 font-bold mr-2">•</span>
                <span className="text-blue-800">Assurez-vous que le code-barres est bien éclairé et net</span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 font-bold mr-2">•</span>
                <span className="text-blue-800">Tenez votre appareil stable pendant le scan</span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 font-bold mr-2">•</span>
                <span className="text-blue-800">Le code-barres se trouve généralement au dos du produit</span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 font-bold mr-2">•</span>
                <span className="text-blue-800">En cas d'échec, utilisez le mode manuel ou photo</span>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 text-center text-gray-600"
        >
          <p className="text-sm">
            Plus de <span className="font-semibold text-green-600">50 000 produits</span> analysés dans notre base de données
          </p>
        </motion.div>
      </div>
    </div>
  );
}