// PATH: frontend/src/pages/ScanPage.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Search,
  Barcode,
  ArrowLeft,
  Sparkles,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BarcodeScanner from '../components/scanner/BarcodeScanner';
import PhotoCapture from '../components/scanner/PhotoCapture';
import ManualSearch from '../components/scanner/ManualSearch';
import analysisService from '../services/analysisService';
import visionService from '../services/visionService';

type ScanMode = 'barcode' | 'photo' | 'manual' | null;

interface AnalysisState {
  isAnalyzing: boolean;
  progress: number;
  currentStep: string;
  error: string | null;
}

interface RecentScan {
  id: string;
  name: string;
  brand?: string;
  category: string;
  scanType: 'barcode' | 'photo' | 'manual';
  timestamp: number;
  scores?: {
    healthScore?: number;
    environmentScore?: number;
    nova?: number;
  };
}

const ScanPage: React.FC = () => {
  const navigate = useNavigate();
  const [scanMode, setScanMode] = useState<ScanMode>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isAnalyzing: false,
    progress: 0,
    currentStep: '',
    error: null
  });

  // État pour les scans récents
  const [recentScans, setRecentScans] = useState<RecentScan[]>(() => {
    const stored = localStorage.getItem('recentScans');
    return stored ? JSON.parse(stored) : [];
  });

  // Auto-dismiss des erreurs après 5 secondes
  useEffect(() => {
    if (analysisState.error) {
      const timer = setTimeout(() => {
        setAnalysisState((prev) => ({ ...prev, error: null }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [analysisState.error]);

  // Sauvegarder un scan récent
  const addRecentScan = (scan: RecentScan) => {
    const updated = [scan, ...recentScans.filter((s) => s.id !== scan.id)].slice(0, 5);
    setRecentScans(updated);
    localStorage.setItem('recentScans', JSON.stringify(updated));
  };

  // Gestionnaire — scan code-barres
  const handleBarcodeScanned = async (barcode: string) => {
    try {
      setAnalysisState({
        isAnalyzing: true,
        progress: 50,
        currentStep: 'Recherche du produit...',
        error: null
      });

      const result = await analysisService.analyzeByBarcode(barcode);

      if (result.success && result.data) {
        addRecentScan({
          id: `barcode-${barcode}-${Date.now()}`,
          name: result.data.name || 'Produit',
          brand: result.data.brand,
          category: result.data.category || 'food',
          scanType: 'barcode',
          timestamp: Date.now(),
          scores: result.data.scores
        });

        navigate('/results', {
          state: {
            analysis: result.data,
            scanType: 'barcode',
            barcode
          }
        });
      } else {
        throw new Error(result.error || 'Produit non trouvé');
      }
    } catch (error: any) {
      setAnalysisState({
        isAnalyzing: false,
        progress: 0,
        currentStep: '',
        error: error.message || 'Erreur lors du scan'
      });
    }
  };

  // Gestionnaire — capture photo (Vision → Analysis)
  const handlePhotoCapture = async (file: File) => {
    try {
      // 1) Upload & OCR
      setAnalysisState({
        isAnalyzing: true,
        progress: 20,
        currentStep: "Upload de l'image...",
        error: null
      });

      const visionResult = await visionService.analyzeImage(file);

      if (!visionResult.success) {
        throw new Error(visionResult.error || "Erreur lors de l'analyse de l'image");
      }

      // 2) Extraction des données
      setAnalysisState((prev) => ({
        ...prev,
        progress: 50,
        currentStep: 'Extraction des informations du produit...'
      }));

      const extractedData = visionResult.data?.extractedData;

      // 3) Si ingrédients présents, lancer l’analyse automatique
      if (extractedData?.ingredients) {
        setAnalysisState((prev) => ({
          ...prev,
          progress: 80,
          currentStep: 'Analyse nutritionnelle et environnementale...'
        }));

        const analysisResult = await analysisService.analyzeManual({
          name: extractedData.name || 'Produit analysé',
          brand: extractedData.brand,
          ingredients: extractedData.ingredients,
          category: extractedData.category || 'food',
          barcode: extractedData.barcode
        });

        if (analysisResult.success && analysisResult.data) {
          addRecentScan({
            id: `photo-${Date.now()}`,
            name: extractedData.name || 'Produit analysé',
            brand: extractedData.brand,
            category: extractedData.category || 'food',
            scanType: 'photo',
            timestamp: Date.now(),
            scores: analysisResult.data.scores
          });

          navigate('/results', {
            state: {
              analysis: analysisResult.data,
              visionData: visionResult.data,
              extractedData,
              scanType: 'photo'
            }
          });
        } else {
          throw new Error(analysisResult.error || "Erreur lors de l'analyse");
        }
      } else {
        // Pas assez d’infos → repasser en manuel, pré-remplissage géré par le formulaire
        setAnalysisState({
          isAnalyzing: false,
          progress: 0,
          currentStep: '',
          error: null
        });
        setScanMode('manual');
      }
    } catch (error: any) {
      setAnalysisState({
        isAnalyzing: false,
        progress: 0,
        currentStep: '',
        error: error.message || "Erreur lors de l'analyse de l'image"
      });
    }
  };

  // Gestionnaire — saisie manuelle
  const handleManualSubmit = async (data: any) => {
    try {
      setAnalysisState({
        isAnalyzing: true,
        progress: 50,
        currentStep: 'Analyse en cours...',
        error: null
      });

      const result = await analysisService.analyzeManual(data);

      if (result.success && result.data) {
        addRecentScan({
          id: `manual-${Date.now()}`,
          name: data.name,
          brand: data.brand,
          category: data.category || 'food',
          scanType: 'manual',
          timestamp: Date.now(),
          scores: result.data.scores
        });

        navigate('/results', {
          state: {
            analysis: result.data,
            scanType: 'manual',
            inputData: data
          }
        });
      } else {
        throw new Error(result.error || "Erreur lors de l'analyse");
      }
    } catch (error: any) {
      setAnalysisState({
        isAnalyzing: false,
        progress: 0,
        currentStep: '',
        error: error.message || "Erreur lors de l'analyse"
      });
    }
  };

  // Ouvrir un scan récent (placeholder)
  const handleRecentScanClick = (scan: RecentScan) => {
    // TODO: Implémenter la récupération des données complètes d’un scan historique si stockées côté backend
    console.log('Ouvrir scan récent:', scan);
  };

  const scanOptions = [
    {
      id: 'barcode' as ScanMode,
      icon: Barcode,
      title: 'Scanner le code-barres',
      description: 'Scannez directement le code-barres du produit',
      color: 'bg-blue-500'
    },
    {
      id: 'photo' as ScanMode,
      icon: Camera,
      title: 'Prendre une photo',
      description: 'Photographiez le produit et ses étiquettes',
      color: 'bg-purple-500'
    },
    {
      id: 'manual' as ScanMode,
      icon: Search,
      title: 'Recherche manuelle',
      description: 'Entrez les informations du produit manuellement',
      color: 'bg-green-500'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F9F4]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-[#DDE9DA]">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#3B3B3B]">
                Scanner un produit
              </h1>
              <p className="text-gray-600 mt-1">
                Choisissez comment analyser votre produit
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {!scanMode && !analysisState.isAnalyzing ? (
          <motion.div
            key="options"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto px-4 py-8"
          >
            {/* Hero */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#7DDE4A]/10 rounded-full mb-4">
                <Sparkles className="w-10 h-10 text-[#7DDE4A]" />
              </div>
              <h2 className="text-xl font-semibold text-[#3B3B3B] mb-2">
                Analysez vos produits en quelques secondes
              </h2>
              <p className="text-gray-600">
                Découvrez leur impact sur votre santé et l'environnement
              </p>
            </div>

            {/* Options */}
            <div className="grid gap-4 md:grid-cols-3">
              {scanOptions.map((option) => (
                <motion.button
                  key={option.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setScanMode(option.id)}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all text-left group"
                >
                  <div
                    className={`w-14 h-14 ${option.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <option.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-[#3B3B3B] mb-2">
                    {option.title}
                  </h3>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </motion.button>
              ))}
            </div>

            {/* Recent scans */}
            <div className="mt-12">
              <h3 className="text-lg font-semibold text-[#3B3B3B] mb-4">
                Produits récemment scannés
              </h3>
              <div className="bg-white rounded-xl shadow-sm">
                {recentScans.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {recentScans.map((scan) => (
                      <button
                        key={scan.id}
                        onClick={() => handleRecentScanClick(scan)}
                        className="w-full p-4 hover:bg-gray-50 transition-colors text-left flex items-center gap-4"
                      >
                        <div className="flex-shrink-0">
                          {scan.scanType === 'barcode' && (
                            <Barcode className="w-5 h-5 text-blue-500" />
                          )}
                          {scan.scanType === 'photo' && (
                            <Camera className="w-5 h-5 text-purple-500" />
                          )}
                          {scan.scanType === 'manual' && (
                            <Search className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-[#3B3B3B]">{scan.name}</p>
                          {scan.brand && (
                            <p className="text-sm text-gray-600">{scan.brand}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(scan.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-500">Aucun produit scanné récemment</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Vos derniers scans apparaîtront ici
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : analysisState.isAnalyzing ? (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-md mx-auto px-4 py-16"
          >
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-full h-full"
                >
                  <Sparkles className="w-full h-full text-[#7DDE4A]" />
                </motion.div>
              </div>

              <h3 className="text-xl font-semibold text-[#3B3B3B] mb-2">
                Analyse en cours...
              </h3>
              <p className="text-gray-600 mb-6">{analysisState.currentStep}</p>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-[#7DDE4A]"
                  initial={{ width: 0 }}
                  animate={{ width: `${analysisState.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <p className="text-sm text-gray-500 mt-4">
                {analysisState.progress}% complété
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Scanners */}
      <AnimatePresence>
        {scanMode === 'barcode' && (
          <BarcodeScanner
            onScanSuccess={handleBarcodeScanned}
            onError={(error) => {
              setAnalysisState({
                isAnalyzing: false,
                progress: 0,
                currentStep: '',
                error: error.message
              });
              setScanMode(null);
            }}
            onClose={() => setScanMode(null)}
          />
        )}

        {scanMode === 'photo' && (
          <PhotoCapture
            onCapture={handlePhotoCapture}
            onError={(error) => {
              setAnalysisState({
                isAnalyzing: false,
                progress: 0,
                currentStep: '',
                error: error.message
              });
              setScanMode(null);
            }}
            onClose={() => setScanMode(null)}
          />
        )}

        {scanMode === 'manual' && (
          <ManualSearch onSubmit={handleManualSubmit} onClose={() => setScanMode(null)} />
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {analysisState.error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-50"
          >
            <div className="bg-red-500 text-white p-4 rounded-lg shadow-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Erreur</p>
                <p className="text-sm mt-1 opacity-90">{analysisState.error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScanPage;
