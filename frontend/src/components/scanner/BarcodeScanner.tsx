// PATH: frontend/src/components/scanner/BarcodeScanner.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, X, Loader, Upload, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { productService } from '../../services/api';
import { analyzeImage } from '../../services/visionService';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import './BarcodeScanner.css';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (result: any) => void;
}

type ScanMode = 'camera' | 'guided-photos' | 'manual';
type PhotoStep = 'barcode' | 'front' | 'ingredients' | 'complete';

const PHOTO_GUIDES = {
  barcode: {
    title: "Photo du code-barres",
    instruction: "Prenez le code-barres en photo de près",
    icon: "📷"
  },
  front: {
    title: "Face avant du produit",
    instruction: "Photographiez la face avant avec le nom visible",
    icon: "📦"
  },
  ingredients: {
    title: "Liste des ingrédients",
    instruction: "Zoomez sur la liste des ingrédients",
    icon: "📋"
  }
};

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onScanSuccess }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ScanMode>('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  // État pour le mode guidé
  const [photoStep, setPhotoStep] = useState<PhotoStep>('barcode');
  const [capturedPhotos, setCapturedPhotos] = useState<{
    barcode?: string;
    front?: string;
    ingredients?: string;
  }>({});
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanIntervalRef = useRef<number | null>(null);

  // Nettoyage du stream
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

  // Traitement du code-barres détecté
  const handleBarcodeDetected = async (barcode: string) => {
    if (!barcode || isLoading) return;
    
    setIsLoading(true);
    stopStream();
    
    try {
      // Recherche du produit
      const product = await productService.getByBarcode(barcode);
      
      if (product && product._id) {
        // Produit trouvé - redirection directe
        toast.success('Produit trouvé !');
        navigate(`/product/${product._id}`);
        onClose();
      } else {
        // Produit non trouvé - proposer capture photos
        toast.info('Produit inconnu - Prenons des photos pour l\'analyser');
        setMode('guided-photos');
        setPhotoStep('barcode');
        setCapturedPhotos({ barcode });
      }
    } catch (error) {
      console.error('Erreur recherche produit:', error);
      // En cas d'erreur, passer en mode photos guidées
      setMode('guided-photos');
      toast.info('Analysons ce produit avec des photos');
    } finally {
      setIsLoading(false);
    }
  };

  // Scanner natif
  const startNativeScanner = useCallback(async () => {
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
      
      // Vérifier si BarcodeDetector est disponible
      if ('BarcodeDetector' in window && (window as any).BarcodeDetector) {
        const detector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128']
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
      } else {
        // Fallback si BarcodeDetector n'est pas disponible
        setError('Scanner non disponible - Utilisez la capture photo');
        setMode('guided-photos');
      }
    } catch (err: any) {
      console.error('Erreur caméra:', err);
      if (err.name === 'NotAllowedError') {
        setPermissionDenied(true);
        setError('Accès caméra refusé');
      } else {
        setError('Impossible d\'accéder à la caméra');
        setMode('guided-photos');
      }
    }
  }, []);

  // Capture de photo guidée
  const captureGuidedPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Convertir en base64 pour affichage
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        // Sauvegarder la photo
        setCapturedPhotos(prev => ({
          ...prev,
          [photoStep]: base64
        }));
        
        // Passer à l'étape suivante
        if (photoStep === 'barcode') {
          setPhotoStep('front');
        } else if (photoStep === 'front') {
          setPhotoStep('ingredients');
        } else if (photoStep === 'ingredients') {
          setPhotoStep('complete');
          // Analyser toutes les photos
          await analyzeAllPhotos();
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Erreur capture photo:', err);
      setError('Erreur lors de la capture');
    } finally {
      setIsLoading(false);
    }
  };

  // Analyser toutes les photos avec Vision API
  const analyzeAllPhotos = async () => {
    setIsLoading(true);
    
    try {
      const analysisResults = {
        barcode: null as string | null,
        productName: null as string | null,
        brand: null as string | null,
        ingredients: [] as string[],
        allText: [] as string[]
      };

      // Analyser chaque photo
      for (const [type, imageData] of Object.entries(capturedPhotos)) {
        if (imageData) {
          const blob = await fetch(imageData).then(r => r.blob());
          const result = await analyzeImage(blob);
          
          if (result.barcode) {
            analysisResults.barcode = result.barcode;
          }
          
          if (result.text) {
            analysisResults.allText.push(result.text);
            
            // Extraction intelligente selon le type de photo
            if (type === 'front') {
              // Essayer d'extraire le nom et la marque
              const lines = result.text.split('\n');
              if (lines.length > 0) analysisResults.productName = lines[0];
              if (lines.length > 1) analysisResults.brand = lines[1];
            } else if (type === 'ingredients') {
              // Parser les ingrédients
              analysisResults.ingredients = result.ingredients || [];
            }
          }
        }
      }

      // Envoyer à l'analyse
      const analysisPayload = {
        barcode: analysisResults.barcode || capturedPhotos.barcode,
        name: analysisResults.productName || 'Produit analysé',
        brand: analysisResults.brand,
        ingredients: analysisResults.ingredients.join(', ') || analysisResults.allText.join(' '),
        images: capturedPhotos
      };

      const response = await productService.analyze(analysisPayload);
      
      // Rediriger vers les résultats
      navigate('/results', {
        state: {
          analysisData: response,
          capturedImages: capturedPhotos,
          method: 'vision'
        }
      });
      
      toast.success('Analyse terminée !');
      onClose();
      
    } catch (error) {
      console.error('Erreur analyse:', error);
      toast.error('Erreur lors de l\'analyse');
      setError('Impossible d\'analyser les photos');
    } finally {
      setIsLoading(false);
    }
  };

  // Démarrage du scanner
  useEffect(() => {
    if (isOpen && mode === 'camera' && !permissionDenied) {
      startNativeScanner();
    }
    
    return () => {
      stopStream();
    };
  }, [isOpen, mode, startNativeScanner, stopStream]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="barcode-scanner-container w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="scanner-header">
          <h3>
            {mode === 'camera' && 'Scanner le code-barres'}
            {mode === 'guided-photos' && PHOTO_GUIDES[photoStep]?.title}
            {mode === 'manual' && 'Saisie manuelle'}
          </h3>
          <button onClick={onClose} className="close-btn">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="scanner-content">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="w-12 h-12 text-green-600 animate-spin mb-4" />
              <p className="text-gray-600">
                {mode === 'camera' ? 'Recherche du produit...' : 'Analyse en cours...'}
              </p>
            </div>
          )}

          {/* Mode Scanner */}
          {!isLoading && mode === 'camera' && (
            <>
              {permissionDenied ? (
                <div className="permission-denied">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Accès caméra refusé</h4>
                  <p className="text-gray-600 mb-4">
                    Autorisez la caméra ou utilisez le mode photo
                  </p>
                  <button
                    onClick={() => setMode('guided-photos')}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Utiliser le mode photo
                  </button>
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
              
              {/* Bouton alternatif */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => setMode('guided-photos')}
                  className="text-green-600 underline"
                >
                  Le scan ne fonctionne pas ? Prenez des photos
                </button>
              </div>
            </>
          )}

          {/* Mode Photos Guidées */}
          {!isLoading && mode === 'guided-photos' && photoStep !== 'complete' && (
            <div className="guided-photos">
              {/* Progress */}
              <div className="flex justify-between mb-6">
                {Object.keys(PHOTO_GUIDES).map((step, index) => (
                  <div
                    key={step}
                    className={`flex-1 text-center ${
                      step === photoStep ? 'text-green-600' : 
                      Object.keys(capturedPhotos).includes(step) ? 'text-green-500' : 'text-gray-400'
                    }`}
                  >
                    <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${
                      step === photoStep ? 'bg-green-600 text-white' :
                      Object.keys(capturedPhotos).includes(step) ? 'bg-green-500 text-white' : 'bg-gray-200'
                    }`}>
                      {Object.keys(capturedPhotos).includes(step) ? 
                        <CheckCircle className="w-5 h-5" /> : 
                        <span>{index + 1}</span>
                      }
                    </div>
                    <span className="text-xs">{PHOTO_GUIDES[step as keyof typeof PHOTO_GUIDES].title}</span>
                  </div>
                ))}
              </div>

              {/* Instructions */}
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">{PHOTO_GUIDES[photoStep]?.icon}</div>
                <h4 className="text-xl font-semibold mb-2">{PHOTO_GUIDES[photoStep]?.title}</h4>
                <p className="text-gray-600">{PHOTO_GUIDES[photoStep]?.instruction}</p>
              </div>

              {/* Photos capturées */}
              {Object.keys(capturedPhotos).length > 0 && (
                <div className="flex gap-2 mb-4 justify-center">
                  {Object.entries(capturedPhotos).map(([type, image]) => (
                    <img 
                      key={type}
                      src={image} 
                      alt={type}
                      className="w-20 h-20 object-cover rounded-lg border-2 border-green-500"
                    />
                  ))}
                </div>
              )}

              {/* Bouton capture */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={captureGuidedPhoto}
                accept="image/*"
                capture="environment"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
              >
                <Camera className="w-6 h-6" />
                Prendre la photo
              </button>

              {/* Skip button */}
              <button
                onClick={() => {
                  if (photoStep === 'barcode') setPhotoStep('front');
                  else if (photoStep === 'front') setPhotoStep('ingredients');
                  else if (photoStep === 'ingredients') {
                    setPhotoStep('complete');
                    analyzeAllPhotos();
                  }
                }}
                className="w-full mt-2 text-gray-500 underline"
              >
                Passer cette étape
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