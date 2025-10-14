import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BarcodeScanner from '../components/scanner/BarcodeScanner';
import { OCRGuide } from '../components/scanner/OCRGuide';
import { analyzeWithOCR } from '../services/ocr-api';
import { AlertCircle, Camera } from 'lucide-react';

export const ScanPage: React.FC = () => {
  const navigate = useNavigate();
  const [scanError, setScanError] = useState<string | null>(null);
  const [showOCRFallback, setShowOCRFallback] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);

  useEffect(() => {
    if (scanAttempts >= 3) {
      setShowOCRFallback(true);
    }
  }, [scanAttempts]);

  const handleScanSuccess = async (barcode: string) => {
    console.log('Code-barres scanné:', barcode);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products?barcode=${barcode}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.product) {
          navigate(`/product/${barcode}`);
          return;
        }
      }
      
      setScanError(`Produit ${barcode} non trouvé en base`);
      setScanAttempts(prev => prev + 1);
      setShowOCRFallback(true);
      
    } catch (error) {
      console.error('Erreur recherche produit:', error);
      setScanError('Erreur réseau');
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

      console.log('Analyse OCR réussie:', result);

      if (result.success && result.product) {
        navigate(`/product/${result.product.barcode}`, {
          state: { 
            fromOCR: true,
            confidence: result.product.confidence,
            isNew: result.product.isNew
          }
        });
      } else {
        throw new Error('Analyse incomplète');
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
    <div className="min-h-screen bg-gray-50">
      <div className="relative h-screen">
        <BarcodeScanner
          onScanSuccess={handleScanSuccess}
          onScanError={handleScanError}
        />

        {scanError && !showOCRFallback && (
          <div className="absolute bottom-20 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 z-10">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">{scanError}</p>
                <button
                  onClick={() => setShowOCRFallback(true)}
                  className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700"
                >
                  <Camera className="w-4 h-4" />
                  Analyser avec photos (OCR)
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6 text-white z-10">
          <p className="text-center text-sm">
            {scanAttempts === 0 ? '?? Placez le code-barres dans le cadre' : 
             scanAttempts < 3 ? '?? Code-barres introuvable ? Utilisez l\'OCR !' :
             '?? Passez en mode photo (OCR) pour une analyse complète'}
          </p>
        </div>
      </div>

      {showOCRFallback && (
        isAnalyzing ? (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-8 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-lg font-semibold">Analyse en cours...</p>
              <p className="text-sm text-gray-600 mt-2">Intelligence artificielle au travail ??</p>
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
  );
};
