// PATH: frontend/src/components/scanner/BarcodeScanner.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Loader } from 'lucide-react';
import { productService } from '../../services/api';
import { toast } from 'react-hot-toast';

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string, category?: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

// Déclaration globale pour BarcodeDetector
declare global {
  interface Window {
    BarcodeDetector: any;
  }
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onClose, isOpen }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  
  useEffect(() => {
    // Vérifier le support de l'API BarcodeDetector
    setIsSupported('BarcodeDetector' in window);
  }, []);

  useEffect(() => {
    if (isOpen && isSupported) {
      startScanning();
    }
    return () => {
      stopScanning();
    };
  }, [isOpen, isSupported]);

  const startScanning = async () => {
    try {
      setError(null);
      setScanning(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        detectBarcode();
      }
    } catch (err) {
      setError('Impossible d\'accéder à la caméra. Veuillez autoriser l\'accès ou utiliser la saisie manuelle.');
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const detectBarcode = async () => {
    if (!videoRef.current || !scanning) return;

    try {
      const barcodeDetector = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39']
      });

      const detect = async () => {
        if (!videoRef.current || !scanning) return;

        try {
          const barcodes = await barcodeDetector.detect(videoRef.current);
          
          if (barcodes.length > 0) {
            const barcode = barcodes[0].rawValue;
            await handleBarcodeDetected(barcode);
            return;
          }
        } catch (err) {
          console.error('Erreur détection:', err);
        }

        // Continuer la détection
        if (scanning) {
          requestAnimationFrame(detect);
        }
      };

      detect();
    } catch (err) {
      setError('Erreur lors de la détection du code-barres');
    }
  };

  const handleBarcodeDetected = async (barcode: string) => {
    setLookingUp(true);
    stopScanning();

    try {
      // Essayer de récupérer le produit pour obtenir sa catégorie
      const product = await productService.getByBarcode(barcode);
      onScanSuccess(barcode, product.category);
    } catch (error) {
      // Si le produit n'est pas trouvé, on envoie quand même le code-barres
      onScanSuccess(barcode);
    } finally {
      setLookingUp(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualCode.trim()) {
      toast.error('Veuillez entrer un code-barres');
      return;
    }

    if (manualCode.trim().length < 8) {
      toast.error('Le code-barres semble trop court');
      return;
    }

    await handleBarcodeDetected(manualCode.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Scanner un produit</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {lookingUp ? (
            <div className="text-center py-8">
              <Loader className="h-12 w-12 animate-spin mx-auto text-green-500 mb-4" />
              <p className="text-gray-600">Recherche du produit...</p>
            </div>
          ) : (
            <>
              {/* Scanner vidéo */}
              {isSupported ? (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-64 object-cover"
                      playsInline
                      muted
                    />
                    {scanning && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-64 h-32 border-2 border-green-500 rounded-lg">
                          <div className="w-full h-0.5 bg-green-500 animate-pulse"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {!scanning && (
                    <button
                      onClick={startScanning}
                      className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Camera className="h-5 w-5" />
                      Démarrer le scan
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
                  <p className="font-medium mb-1">Scanner non disponible</p>
                  <p className="text-sm">
                    Votre navigateur ne supporte pas le scan de codes-barres. 
                    Utilisez Chrome ou Edge sur mobile, ou saisissez le code manuellement.
                  </p>
                </div>
              )}

              {/* Saisie manuelle */}
              <div className="pt-4 border-t">
                <h3 className="font-medium text-gray-700 mb-3">Saisie manuelle</h3>
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Ex: 3017620422003"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Valider
                  </button>
                </form>
              </div>

              {/* Instructions */}
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Placez le code-barres dans le cadre</p>
                <p>• Assurez-vous d'avoir un bon éclairage</p>
                <p>• Le code sera détecté automatiquement</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default BarcodeScanner;
