// PATH: frontend/src/components/scanner/BarcodeScanner.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, X, Loader, Upload, AlertCircle } from 'lucide-react';
import { productService } from '../../services/api';
import { analyzeImage, barcodeLiveSupported, cameraSupported } from '../../services/visionService';
import { toast } from 'react-hot-toast';
import './BarcodeScanner.css';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (result: { barcode?: string; name?: string; brand?: string; category?: string; data?: any }) => void;
}

type ScanMode = 'camera' | 'manual' | 'photo';

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onScanSuccess }) => {
  const [mode, setMode] = useState<ScanMode>('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const quaggaInitialized = useRef(false);

  // Nettoyage du stream vidéo
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Analyse du code-barres trouvé
  const handleBarcodeDetected = async (barcode: string) => {
    if (!barcode || isLoading) return;
    
    setIsLoading(true);
    stopStream();
    
    try {
      // Recherche du produit par code-barres
      const product = await productService.getByBarcode(barcode);
      
      if (product) {
        onScanSuccess({
          barcode,
          name: product.name,
          brand: product.brand,
          category: product.category,
          data: product
        });
        toast.success('Produit trouvé !');
      } else {
        // Si produit non trouvé, on peut quand même analyser
        const analysisResult = await productService.analyze({ barcode });
        onScanSuccess({
          barcode,
          data: analysisResult
        });
        toast.info('Nouveau produit - Analyse en cours');
      }
      
      onClose();
    } catch (error) {
      console.error('Erreur analyse:', error);
      toast.error('Erreur lors de l\'analyse du produit');
      setError('Erreur lors de l\'analyse. Réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  // Scanner natif avec BarcodeDetector API
  const startNativeScanner = useCallback(async () => {
    if (!barcodeLiveSupported()) {
      // Fallback vers Quagga
      startQuaggaScanner();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setIsScanning(true);
      setError(null);
      
      // @ts-ignore
      const detector = new BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39']
      });
      
      scanIntervalRef.current = window.setInterval(async () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const code = barcodes[0].rawValue;
              if (code) {
                handleBarcodeDetected(code);
              }
            }
          } catch (err) {
            console.error('Erreur détection:', err);
          }
        }
      }, 100);
      
    } catch (err: any) {
      console.error('Erreur caméra:', err);
      if (err.name === 'NotAllowedError') {
        setPermissionDenied(true);
        setError('Accès à la caméra refusé');
      } else {
        setError('Impossible d\'accéder à la caméra');
        // Essayer Quagga en fallback
        startQuaggaScanner();
      }
    }
  }, []);

  // Scanner avec Quagga (fallback)
  const startQuaggaScanner = useCallback(async () => {
    try {
      // Vérifier si Quagga est disponible
      const Quagga = (window as any).Quagga;
      if (!Quagga) {
        // Charger Quagga dynamiquement
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@ericblade/quagga2@1.8.2/dist/quagga.min.js';
        script.onload = () => initQuagga();
        document.head.appendChild(script);
        return;
      }
      
      initQuagga();
    } catch (err) {
      console.error('Erreur Quagga:', err);
      setError('Scanner non disponible sur ce navigateur');
    }
  }, []);

  const initQuagga = useCallback(() => {
    const Quagga = (window as any).Quagga;
    if (!Quagga || quaggaInitialized.current) return;
    
    quaggaInitialized.current = true;
    
    Quagga.init({
      inputStream: {
        name: 'Live',
        type: 'LiveStream',
        target: videoRef.current,
        constraints: {
          facingMode: 'environment'
        }
      },
      decoder: {
        readers: ['ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader', 'code_128_reader']
      },
      locate: true
    }, (err: any) => {
      if (err) {
        console.error('Erreur init Quagga:', err);
        setError('Impossible d\'initialiser le scanner');
        return;
      }
      
      Quagga.start();
      setIsScanning(true);
      
      Quagga.onDetected((result: any) => {
        const code = result.codeResult.code;
        if (code) {
          Quagga.stop();
          handleBarcodeDetected(code);
        }
      });
    });
  }, []);

  // Gestion de l'upload de photo
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Analyse de l'image avec Vision API
      const result = await analyzeImage(file);
      
      if (result.barcode) {
        // Code-barres détecté dans l'image
        handleBarcodeDetected(result.barcode);
      } else if (result.text) {
        // Texte extrait, on peut essayer d'analyser
        const analysisResult = await productService.analyze({
          name: result.text.substring(0, 100), // Prendre les 100 premiers caractères
          ingredients: result.text
        });
        
        onScanSuccess({
          data: analysisResult
        });
        
        toast.info('Produit analysé à partir du texte');
        onClose();
      } else {
        setError('Aucun code-barres ou texte détecté dans l\'image');
      }
    } catch (err) {
      console.error('Erreur analyse image:', err);
      setError('Erreur lors de l\'analyse de l\'image');
    } finally {
      setIsLoading(false);
    }
  };

  // Soumission manuelle
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleBarcodeDetected(manualCode.trim());
    }
  };

  // Démarrage du scanner selon le mode
  useEffect(() => {
    if (isOpen && mode === 'camera' && !permissionDenied) {
      startNativeScanner();
    }
    
    return () => {
      stopStream();
      if ((window as any).Quagga) {
        (window as any).Quagga.stop();
      }
    };
  }, [isOpen, mode, startNativeScanner, stopStream]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="barcode-scanner-container w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="scanner-header">
          <h3>Scanner un produit</h3>
          <div className="mode-switcher">
            <button
              onClick={() => setMode('camera')}
              className={`mode-btn ${mode === 'camera' ? 'active' : ''}`}
              disabled={!cameraSupported() || permissionDenied}
            >
              <Camera className="w-4 h-4 mr-2" />
              Caméra
            </button>
            <button
              onClick={() => setMode('photo')}
              className={`mode-btn ${mode === 'photo' ? 'active' : ''}`}
            >
              <Upload className="w-4 h-4 mr-2" />
              Photo
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`mode-btn ${mode === 'manual' ? 'active' : ''}`}
            >
              Code manuel
            </button>
          </div>
          <button onClick={onClose} className="close-btn">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="scanner-content">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="w-12 h-12 text-green-600 animate-spin mb-4" />
              <p className="text-gray-600">Analyse en cours...</p>
            </div>
          )}

          {!isLoading && mode === 'camera' && (
            <>
              {permissionDenied ? (
                <div className="permission-denied">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Accès à la caméra refusé</h4>
                  <p className="text-gray-600 mb-4">
                    Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur
                    ou utilisez l'upload de photo.
                  </p>
                </div>
              ) : (
                <div className="video-container">
                  <video ref={videoRef} className="scanner-video" playsInline muted />
                  {isScanning && (
                    <div className="scanner-overlay">
                      <div className="scanner-guide">
                        <div className="scanner-corner top-left"></div>
                        <div className="scanner-corner top-right"></div>
                        <div className="scanner-corner bottom-left"></div>
                        <div className="scanner-corner bottom-right"></div>
                        <div className="scanner-line"></div>
                      </div>
                      <p className="scanner-instructions">
                        Placez le code-barres dans le cadre
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {!isLoading && mode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="manual-form">
              <p className="text-gray-600 mb-4 text-center">
                Entrez le code-barres manuellement
              </p>
              <div className="input-group">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Ex: 3017620422003"
                  className="barcode-input"
                  pattern="[0-9]*"
                  autoFocus
                />
                <button type="submit" className="submit-btn" disabled={!manualCode.trim()}>
                  Valider
                </button>
              </div>
            </form>
          )}

          {!isLoading && mode === 'photo' && (
            <div className="photo-section">
              <p className="text-gray-600 mb-4 text-center">
                Prenez une photo du produit ou du code-barres
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                capture="environment"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Camera className="w-5 h-5" />
                Prendre une photo
              </button>
            </div>
          )}

          {error && (
            <div className="error-message">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;