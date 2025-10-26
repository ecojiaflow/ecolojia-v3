import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BarcodeScanner from '../components/scanner/BarcodeScanner';
import { UnknownProductModal } from '../components/scanner/UnknownProductModal';
import { OCRGuide } from '../components/scanner/OCRGuide';
import { analyzeWithOCR } from '../services/ocr-api';
import { AlertCircle, Camera, Sparkles } from 'lucide-react';

export const ScanPage: React.FC = () => {
  const navigate = useNavigate();
  const [scanError, setScanError] = useState<string | null>(null);
  const [showOCRFallback, setShowOCRFallback] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [showUnknownModal, setShowUnknownModal] = useState(false);
  const [unknownBarcode, setUnknownBarcode] = useState('');

  useEffect(() => {
    if (scanAttempts >= 3) {
      setShowOCRFallback(true);
    }
  }, [scanAttempts]);

  const handleScanSuccess = async (barcode: string) => {
    console.log('Code-barres scanne:', barcode);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products?barcode=${barcode}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.product) {
          navigate(`/product/${barcode}`);
          return;
        }
      }
      
      setScanError(`Produit ${barcode} non trouve en base`);
      setScanAttempts(prev => prev + 1);
      setShowOCRFallback(true);
      
    } catch (error) {
      console.error('Erreur recherche produit:', error);
      setScanError('Erreur reseau');
      setScanAttempts(prev => prev + 1);
    }
  };

  const handleScanError = (error: string) => {
    console.error('Erreur scan:', error);
    setScanError(error);
    setScanAttempts(prev => prev + 1);
  };

  const handleOCRComplete = async (photos: { front: string; ingredients: string; barcode?: string }) => {
    setIsAnalyzing(true);
    setScanError(null);

    try {
      console.log('Envoi photos au backend...');
      
      const result = await analyzeWithOCR({
        frontImage: photos.front,
        ingredientsImage: photos.ingredients,
        barcodeImage: photos.barcode
      });

      console.log('Analyse OCR reussie:', result);

      if (result.success && result.product) {
        navigate(`/product/${result.product.barcode}`, {
          state: { 
            fromOCR: true,
            confidence: result.product.confidence,
            isNew: result.product.isNew
          }
        });
      } else {
        throw new Error('Analyse incomplete');
      }

    } catch (error: any) {
      console.error('Erreur analyse OCR:', error);
      setScanError(`Erreur analyse: ${error.message}`);
      setShowOCRFallback(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOCRCancel = () => {
    setShowOCRFallback(false);
    setScanError(null);
    setScanAttempts(0);
  };

  return (
    <>
      <div className="min-h-screen bg-neutral-900">
        <div className="relative h-screen">
          <BarcodeScanner
            onScanSuccess={handleScanSuccess}
            onScanError={handleScanError}
          />

          {scanError && !showOCRFallback && (
            <div className="absolute bottom-20 left-4 right-4 bg-neutral-0 rounded-lg p-4 z-10 shadow-3 border border-danger/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-neutral-900 font-medium">{scanError}</p>
                  <button
                    onClick={() => setShowOCRFallback(true)}
                    className="mt-3 w-full h-11 bg-info text-white rounded-lg flex items-center justify-center gap-2 hover:bg-info/90 transition-all shadow-2 font-medium"
                  >
                    <Camera className="w-4 h-4" />
                    Analyser avec photos (OCR)
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-neutral-900 via-neutral-900/80 to-transparent p-6 text-neutral-0 z-10">
            <div className="max-w-md mx-auto text-center">
              <p className="text-sm leading-relaxed">
                {scanAttempts === 0 ? 'Placez le code-barres dans le cadre' : 
                 scanAttempts < 3 ? 'Code-barres introuvable ? Utilisez OCR !' :
                 'Passez en mode photo (OCR) pour une analyse complete'}
              </p>
            </div>
          </div>
        </div>

        {showOCRFallback && (
          isAnalyzing ? (
            <div className="fixed inset-0 bg-neutral-900/90 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-neutral-0 rounded-xl p-8 text-center shadow-4 max-w-sm mx-4">
                <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-neutral-900">Analyse en cours</h3>
                </div>
                <p className="text-sm text-neutral-600">Intelligence artificielle au travail</p>
              </div>
            </div>
          ) : (
            <OCRGuide
              onComplete={handleOCRComplete}
              onCancel={handleOCRCancel}
            />
          )
        )}
      </div>

      <UnknownProductModal
        isOpen={showUnknownModal}
        barcode={unknownBarcode}
        onClose={() => setShowUnknownModal(false)}
      />
    </>
  );
};