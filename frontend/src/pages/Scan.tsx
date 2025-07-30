//PATH: frontend/ecolojiaFrontV3/src/pages/Scan.tsx
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BarcodeScanner from '../components/scanner/BarcodeScanner';
import { CategoryAutoDetector, CategoryDetector, ProductCategory } from '../components/scanner/CategoryAutoDetector';

interface ScanState {
  step: 'scanning' | 'detecting' | 'analyzing';
  scannedBarcode: string | null;
  detectedCategory: ProductCategory | null;
  showScanner: boolean;
}

const Scan: React.FC = () => {
  const navigate = useNavigate();
  
  const [scanState, setScanState] = useState<ScanState>({
    step: 'scanning',
    scannedBarcode: null,
    detectedCategory: null,
    showScanner: false
  });

  // Gestion du scan réussi avec détection automatique de catégorie
  const handleScanSuccess = useCallback((barcode: string) => {
    console.log('📱 Code-barres scanné:', barcode);
    
    // Détection automatique de la catégorie
    const detectedCategory = CategoryDetector.detectCategory(barcode);
    console.log('🎯 Catégorie détectée:', detectedCategory);
    
    setScanState({
      step: 'detecting',
      scannedBarcode: barcode,
      detectedCategory,
      showScanner: false
    });
  }, []);

  const handleCloseScanner = useCallback(() => {
    setScanState(prev => ({
      ...prev,
      showScanner: false
    }));
  }, []);

  const openScanner = useCallback(() => {
    setScanState(prev => ({
      ...prev,
      showScanner: true,
      step: 'scanning'
    }));
  }, []);

  // Confirmation de la catégorie et redirection vers l'analyse
  const handleConfirmCategory = useCallback(() => {
    if (!scanState.scannedBarcode || !scanState.detectedCategory) return;

    setScanState(prev => ({ ...prev, step: 'analyzing' }));

    // Redirection vers les résultats avec les paramètres
    const params = new URLSearchParams({
      barcode: scanState.scannedBarcode,
      category: scanState.detectedCategory.type,
      method: 'scan'
    });

    // Délai pour montrer l'animation
    setTimeout(() => {
      navigate(`/results?${params.toString()}`);
    }, 1000);
  }, [scanState.scannedBarcode, scanState.detectedCategory, navigate]);

  // Retour au scan
  const handleBackToScan = useCallback(() => {
    setScanState({
      step: 'scanning',
      scannedBarcode: null,
      detectedCategory: null,
      showScanner: true
    });
  }, []);

  // Rendu conditionnel selon l'étape
  const renderContent = () => {
    switch (scanState.step) {
      case 'scanning':
        if (scanState.showScanner) {
          return (
            <BarcodeScanner
              onScanSuccess={handleScanSuccess}
              onClose={handleCloseScanner}
              isOpen={true}
            />
          );
        } else {
          return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-6xl mb-4">📱</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                Scanner de codes-barres
              </h2>
              <p className="text-gray-600 text-center mb-8 max-w-sm">
                Scannez le code-barres de votre produit pour une analyse instantanée
              </p>
              
              <button
                onClick={openScanner}
                className="bg-[#7DDE4A] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#6BC93A] transition-colors shadow-lg text-lg mb-6"
              >
                📷 Scanner codes-barres
              </button>
              
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-3">Détection automatique :</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="px-3 py-2 bg-[#E9F8DF] text-[#7DDE4A] rounded-lg">
                    🍎 Alimentaire
                  </div>
                  <div className="px-3 py-2 bg-[#E9F8DF] text-[#7DDE4A] rounded-lg">
                    💄 Cosmétique
                  </div>
                  <div className="px-3 py-2 bg-[#E9F8DF] text-[#7DDE4A] rounded-lg">
                    🧽 Ménager
                  </div>
                </div>
              </div>
            </div>
          );
        }

      case 'detecting':
        return (
          <div className="min-h-[70vh]">
            {/* Aperçu du scan */}
            <div className="bg-[#E9F8DF] p-4 rounded-t-2xl mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-[#7DDE4A] rounded-full animate-pulse"></div>
                  <span className="text-[#7DDE4A] font-semibold">✅ Scan réussi !</span>
                </div>
                <button
                  onClick={handleBackToScan}
                  className="text-gray-500 hover:text-gray-700 transition-colors text-sm"
                >
                  ↻ Rescanner
                </button>
              </div>
            </div>

            {/* Détecteur de catégorie */}
            {scanState.detectedCategory && (
              <CategoryAutoDetector
                category={scanState.detectedCategory}
                barcode={scanState.scannedBarcode!}
                onConfirm={handleConfirmCategory}
              />
            )}
          </div>
        );

      case 'analyzing':
        return (
          <div className="flex flex-col items-center justify-center min-h-[70vh] bg-[#E9F8DF] rounded-2xl p-6">
            <div className="animate-spin w-12 h-12 border-4 border-[#7DDE4A] border-t-transparent rounded-full mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              🔍 Analyse en cours...
            </h3>
            <p className="text-gray-600 text-center mb-4">
              Recherche du produit et classification intelligente
            </p>
            {scanState.detectedCategory && (
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg">
                <span className="text-2xl">{scanState.detectedCategory.icon}</span>
                <span className="text-gray-700 font-medium capitalize">
                  {scanState.detectedCategory.type}
                </span>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Masqué quand le scanner est ouvert */}
      {!scanState.showScanner && (
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Retour
              </button>
              <h1 className="text-lg font-semibold text-gray-800">
                🌱 Scanner ECOLOJIA
              </h1>
              <div className="w-8"></div>
            </div>
          </div>
        </header>
      )}

      {/* Contenu principal */}
      <main className={`max-w-lg mx-auto ${!scanState.showScanner ? 'p-6' : ''}`}>
        {renderContent()}
      </main>

      {/* Instructions en bas */}
      {scanState.step === 'scanning' && !scanState.showScanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-lg mx-auto text-center">
            <p className="text-sm text-gray-600 mb-2">
              <strong>💡 Astuce :</strong> Tenez le téléphone stable et éclairez bien le code-barres
            </p>
            <div className="flex justify-center space-x-2 text-xs text-gray-500">
              <span>🔍 Détection auto</span>
              <span>•</span>
              <span>📱 Natif + ZXing</span>
              <span>•</span>
              <span>🎯 Validation triple</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scan;