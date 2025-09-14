// PATH: frontend/src/components/scanner/BarcodeScanner.tsx
// UTF-8
import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Loader } from 'lucide-react';
import { productService } from '../../services/api';
import { toast } from 'react-hot-toast';

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string, category?: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

declare global {
  interface Window {
    BarcodeDetector: any;
  }
}

export default function BarcodeScanner({ onScanSuccess, onClose, isOpen }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);

  // Vérifier le support du BarcodeDetector
  useEffect(() => {
    const checkSupport = async () => {
      if ('BarcodeDetector' in window) {
        try {
          // Vérifier les formats supportés
          const formats = await (window as any).BarcodeDetector.getSupportedFormats();
          console.log('Formats supportés:', formats);
          setIsSupported(true);
        } catch {
          setIsSupported(false);
        }
      } else {
        setIsSupported(false);
      }
    };
    checkSupport();
  }, []);

  // Démarrer/arrêter le scan selon l'état
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
      scanningRef.current = true;

      // Demander l'accès à la caméra
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Attendre que la vidéo soit prête
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().then(resolve);
            };
          }
        });

        // Démarrer la détection
        detectBarcode();
      }
    } catch (err) {
      console.error('Erreur caméra:', err);
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Accès à la caméra refusé. Veuillez autoriser l\'accès dans les paramètres.');
      } else {
        setError('Impossible d\'activer la caméra. Vérifiez les permissions.');
      }
      setScanning(false);
      scanningRef.current = false;
    }
  };

  const stopScanning = () => {
    setScanning(false);
    scanningRef.current = false;

    // Arrêter tous les tracks de la caméra
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const detectBarcode = async () => {
    if (!videoRef.current || !scanningRef.current) return;

    try {
      const detector = new (window as any).BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code']
      });

      const detect = async () => {
        if (!scanningRef.current || !videoRef.current) return;

        try {
          const barcodes = await detector.detect(videoRef.current);
          
          if (barcodes && barcodes.length > 0) {
            const barcode = barcodes[0];
            const value = barcode.rawValue || barcode.value;
            
            if (value) {
              console.log('Code-barres détecté:', value);
              handleBarcodeDetected(String(value));
              return; // Arrêter la détection après le premier code
            }
          }
        } catch (err) {
          console.error('Erreur détection:', err);
        }

        // Continuer la détection si toujours en scan
        if (scanningRef.current) {
          requestAnimationFrame(detect);
        }
      };

      // Démarrer la boucle de détection
      detect();
    } catch (err) {
      console.error('Erreur BarcodeDetector:', err);
      setError('Le scanner n\'est pas supporté sur ce navigateur.');
    }
  };

  const handleBarcodeDetected = async (barcode: string) => {
    // Arrêter le scan immédiatement
    stopScanning();
    setLookingUp(true);

    try {
      // Rechercher le produit par code-barres
      const result = await productService.getByBarcode(barcode);
      
      if (result) {
        const category = result.category || 'food';
        toast.success(`Produit trouvé: ${result.name || 'Sans nom'}`);
        onScanSuccess(barcode, category);
      } else {
        // Produit non trouvé, proposer une analyse
        toast.info('Produit non trouvé. Redirection vers l\'analyse...');
        onScanSuccess(barcode);
      }
    } catch (error) {
      console.error('Erreur recherche produit:', error);
      toast.error('Erreur lors de la recherche du produit');
      onScanSuccess(barcode);
    } finally {
      setLookingUp(false);
    }
  };

  // Fallback pour navigateurs non supportés
  const handleManualInput = () => {
    const barcode = prompt('Entrez le code-barres manuellement:');
    if (barcode && barcode.trim()) {
      handleBarcodeDetected(barcode.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Scanner un code-barres</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {!isSupported ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">
                Le scanner n'est pas supporté sur ce navigateur.
              </p>
              <button
                onClick={handleManualInput}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Entrer manuellement
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Zone vidéo */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-[4/3]">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                
                {scanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* Zone de scan */}
                    <div className="relative">
                      <div className="w-64 h-32 border-2 border-green-500 rounded-lg">
                        <div className="absolute inset-0 border-t-2 border-green-500 animate-pulse" />
                      </div>
                      <p className="text-white text-center mt-4 text-sm">
                        Placez le code-barres dans le cadre
                      </p>
                    </div>
                  </div>
                )}

                {lookingUp && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-4 flex items-center gap-3">
                      <Loader className="w-5 h-5 animate-spin text-blue-600" />
                      <span>Recherche du produit...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-3">
                {!scanning ? (
                  <button
                    onClick={startScanning}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                    Démarrer le scan
                  </button>
                ) : (
                  <button
                    onClick={stopScanning}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Arrêter
                  </button>
                )}
                
                <button
                  onClick={handleManualInput}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Saisie manuelle
                </button>
              </div>

              {/* Instructions */}
              <div className="mt-4 text-sm text-gray-600">
                <p className="mb-1">💡 Conseils pour un scan réussi:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Placez le code-barres bien droit dans le cadre</li>
                  <li>Assurez-vous d'avoir un bon éclairage</li>
                  <li>Maintenez le téléphone stable</li>
                  <li>Formats supportés: EAN-13, EAN-8, UPC, Code 128, QR Code</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}