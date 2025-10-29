// PATH: frontend/src/components/scanner/BarcodeScanner.tsx
// SCANNER COMPLET AVEC TOUTES LES FONCTIONNALITES

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, X, Loader, Upload, AlertCircle, Keyboard, Image, Package, List } from 'lucide-react';
import { productService } from '../../services/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import './BarcodeScanner.css';

// Si Quagga est installe, l'importer
let Quagga: any = null;
try {
  Quagga = require('@ericblade/quagga2').default;
} catch (e) {
  console.log('Quagga non installe, utilisation du scanner natif uniquement');
}

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (result: any) => void;
  autoStartCamera?: boolean;
}

type ScanMode = 'menu' | 'camera' | 'photo' | 'manual';
type PhotoStep = 'front' | 'ingredients' | 'barcode' | 'complete';

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onScanSuccess, autoStartCamera = false }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ScanMode>(autoStartCamera ? 'camera' : 'menu');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [productName, setProductName] = useState('');

  // Etat pour les photos guidees
  const [photoStep, setPhotoStep] = useState<PhotoStep>('front');
  const [capturedPhotos, setCapturedPhotos] = useState<{
    front?: string;
    ingredients?: string;
    barcode?: string;
  }>({});

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<any>(null);

  // Fonction principale de recherche/analyse
  const handleProductSearch = async (barcode?: string, name?: string, images?: any) => {
    setIsLoading(true);
    try {
      // Si on a un code-barres, chercher d'abord dans la base
      if (barcode) {
        try {
          console.log("?🔍 [DEBUG] Recherche barcode:", barcode);
          const product = await productService.getByBarcode(barcode);
          console.log("🔍 [DEBUG] Rponse:", product);
          if (product && product._id) {
            console.log("🔍 [DEBUG] Navigation vers:", `/product/${product._id}`);
            toast.success('Produit trouve !');
            navigate(`/product/${product._id}`);
            onClose();
            return;
          }
        } catch (e) {
          // Produit non trouve, continuer avec l'analyse
        }
      }

      // Si pas trouve ou pas de code-barres, faire une analyse
      const payload: any = {
        barcode: barcode || manualCode || '',
        name: name || productName || 'Produit a analyser',
        category: 'food'
      };

      // Ajouter les images si disponibles
      if (images || Object.keys(capturedPhotos).length > 0) {
        payload.images = images || capturedPhotos;
      }

      // Appeler l'API d'analyse
      const result = await productService.analyze(payload);

      if (result) {
        // Naviguer vers la page de resultats avec toutes les donnees
        navigate('/results', {
          state: {
            analysisData: result,
            capturedImages: images || capturedPhotos,
            method: mode,
            barcode: barcode || manualCode,
            productName: name || productName
          }
        });
        toast.success('Analyse terminee !');
        onClose();
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors de l\'analyse');
      setError('Erreur lors de l\'analyse du produit');
    } finally {
      setIsLoading(false);
    }
  };

  // Arreter le stream video
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  // Scanner avec Quagga (fallback)
  const startQuaggaScanner = useCallback(() => {
    if (!Quagga || !videoRef.current) {
      setError('Scanner non disponible');
      return;
    }

    Quagga.init({
      inputStream: {
        type: 'LiveStream',
        target: videoRef.current,
        constraints: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      },
      decoder: {
        readers: ['ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader', 'code_128_reader']
      },
      locate: true
    }, (err: any) => {
      if (err) {
        console.error('Erreur Quagga:', err);
        setError('Impossible d\'initialiser le scanner');
        return;
      }

      Quagga.start();
      setIsScanning(true);

      Quagga.onDetected((result: any) => {
        if (result?.codeResult?.code) {
          const code = result.codeResult.code;
          console.log("?🔍 [DEBUG] CODE DTECT:", code);
          alert("Code dtect: " + code);
          Quagga.stop();
          stopStream();
          handleProductSearch(code);
        }
      });
    });

    scannerRef.current = Quagga;
  }, [stopStream]);

  // Scanner natif (Chrome Android)
  const startNativeScanner = useCallback(async () => {
    try {
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
        await videoRef.current.play();
      }

      setIsScanning(true);
      setError(null);

      // Verifier si BarcodeDetector existe (Chrome Android)
      if ('BarcodeDetector' in window && (window as any).BarcodeDetector) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_39', 'code_128']
        });

        const detectLoop = async () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && isScanning) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const code = barcodes[0].rawValue;
                console.log("?🔍 [DEBUG] CODE NATIF DTECT:", code);
          alert("Code natif dtect: " + code);
                stopStream();
                handleProductSearch(code);
                return;
              }
            } catch (err) {
              console.error('Erreur detection:', err);
            }

            if (isScanning) {
              setTimeout(detectLoop, 100);
            }
          } else if (isScanning) {
            setTimeout(detectLoop, 100);
          }
        };

        setTimeout(detectLoop, 1000); // Attendre que la video soit prete
      } else {
        // Fallback vers Quagga si BarcodeDetector n'est pas disponible
        console.log('BarcodeDetector non disponible, utilisation de Quagga');
        stopStream();
        startQuaggaScanner();
      }
    } catch (err: any) {
      console.error('Erreur camera:', err);
      if (err.name === 'NotAllowedError') {
        setError('Acces camera refuse. Autorisez la camera et reessayez.');
      } else {
        setError('Impossible d\'acceder a la camera');
      }
      // Proposer le mode photo comme alternative
      setTimeout(() => {
        if (window.confirm('Le scanner ne fonctionne pas. Voulez-vous prendre des photos du produit ?')) {
          setMode('photo');
        }
      }, 1000);
    }
  }, [isScanning, stopStream, startQuaggaScanner]);

  // Arreter le scanner complet
  const stopScanner = useCallback(() => {
    stopStream();

    if (scannerRef.current && Quagga) {
      Quagga.stop();
      scannerRef.current = null;
    }
  }, [stopStream]);

  // Capture de photo guidee
  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageData = reader.result as string;

      // Sauvegarder la photo
      setCapturedPhotos(prev => ({
        ...prev,
        [photoStep]: imageData
      }));

      // Passer a l'etape suivante
      if (photoStep === 'front') {
        setPhotoStep('ingredients');
        toast.success('Face avant capturee ! Maintenant les ingredients.');
      } else if (photoStep === 'ingredients') {
        setPhotoStep('barcode');
        toast.success('Ingredients captures ! Maintenant le code-barres.');
      } else if (photoStep === 'barcode') {
        setPhotoStep('complete');
        toast.success('Toutes les photos capturees !');
        // Lancer l'analyse automatiquement
        setTimeout(() => {
          handleProductSearch(undefined, undefined, capturedPhotos);
        }, 500);
      }
    };
    reader.readAsDataURL(file);

    // Reinitialiser l'input pour permettre de reprendre la meme photo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Reinitialiser les photos
  const resetPhotos = () => {
    setCapturedPhotos({});
    setPhotoStep('front');
  };

  // Gestion de la saisie manuelle
  const handleManualSubmit = () => {
    if (!manualCode && !productName) {
      toast.error('Entrez un code-barres ou un nom de produit');
      return;
    }
    handleProductSearch(manualCode, productName);
  };

  // Demarrer le scanner au montage
  useEffect(() => {
    if (isOpen && mode === 'camera') {
      // Petit delai pour laisser l'UI se charger
      setTimeout(() => {
        startNativeScanner();
      }, 300);
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, mode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75">
      <div className="h-full w-full max-w-2xl mx-auto bg-white">
        {/* Header */}
        <div className="bg-green-600 text-white p-4 flex justify-between items-center">
          <h3 className="text-xl font-bold">
            {mode === 'menu' && 'Scanner un produit'}
            {mode === 'camera' && 'Scanner le code-barres'}
            {mode === 'photo' && 'Photographier le produit'}
            {mode === 'manual' && 'Saisie manuelle'}
          </h3>
          <button
            onClick={() => { stopScanner(); onClose(); }}
            className="p-2 hover:bg-green-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenu principal */}
        <div className="h-[calc(100%-4rem)] overflow-auto">
          {/* Menu principal */}
          {mode === 'menu' && !isLoading && (
            <div className="p-6 space-y-4">
              <p className="text-gray-600 text-center mb-6">
                Choisissez comment identifier votre produit
              </p>

              <button
                onClick={() => setMode('camera')}
                className="w-full p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all flex items-center space-x-4"
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Camera className="w-8 h-8 text-green-700" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-semibold text-gray-800">Scanner le code-barres</h4>
                  <p className="text-sm text-gray-600">Utilisez la camera pour scanner rapidement</p>
                </div>
              </button>

              <button
                onClick={() => { setMode('photo'); setPhotoStep('front'); }}
                className="w-full p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center space-x-4"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Image className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-semibold text-gray-800">Prendre des photos</h4>
                  <p className="text-sm text-gray-600">Photographiez les differentes faces du produit</p>
                </div>
              </button>

              <button
                onClick={() => setMode('manual')}
                className="w-full p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all flex items-center space-x-4"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Keyboard className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-semibold text-gray-800">Saisie manuelle</h4>
                  <p className="text-sm text-gray-600">Entrez le code-barres ou le nom du produit</p>
                </div>
              </button>
            </div>
          )}

          {/* Mode Scanner Camera */}
          {mode === 'camera' && !isLoading && (
            <div className="relative h-full bg-black">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />

              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="scanner-overlay">
                    <div className="scanner-frame border-2 border-green-500 w-64 h-48 relative">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500"></div>
                    </div>
                    <p className="text-white mt-4 text-center">
                      Placez le code-barres dans le cadre
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="absolute bottom-20 left-4 right-4 bg-red-500 text-white p-4 rounded-lg flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                onClick={() => { stopScanner(); setMode('menu'); }}
                className="absolute bottom-4 left-4 right-4 bg-white text-gray-800 py-3 px-6 rounded-lg font-medium"
              >
                Retour au menu
              </button>
            </div>
          )}

          {/* Mode Photo Guidee */}
          {mode === 'photo' && !isLoading && photoStep !== 'complete' && (
            <div className="p-6">
              {/* Indicateur d'etapes */}
              <div className="flex justify-between mb-8">
                <div className={`flex-1 text-center ${photoStep === 'front' ? 'text-green-700' : capturedPhotos.front ? 'text-green-500' : 'text-neutral-600'}`}>
                  <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${
                    photoStep === 'front' ? 'bg-green-600 text-white' :
                    capturedPhotos.front ? 'bg-green-500 text-white' : 'bg-gray-200'
                  }`}>
                    {capturedPhotos.front ? '?' : '1'}
                  </div>
                  <span className="text-xs">Face avant</span>
                </div>

                <div className={`flex-1 text-center ${photoStep === 'ingredients' ? 'text-green-700' : capturedPhotos.ingredients ? 'text-green-500' : 'text-neutral-600'}`}>
                  <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${
                    photoStep === 'ingredients' ? 'bg-green-600 text-white' :
                    capturedPhotos.ingredients ? 'bg-green-500 text-white' : 'bg-gray-200'
                  }`}>
                    {capturedPhotos.ingredients ? '?' : '2'}
                  </div>
                  <span className="text-xs">Ingredients</span>
                </div>

                <div className={`flex-1 text-center ${photoStep === 'barcode' ? 'text-green-700' : capturedPhotos.barcode ? 'text-green-500' : 'text-neutral-600'}`}>
                  <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${
                    photoStep === 'barcode' ? 'bg-green-600 text-white' :
                    capturedPhotos.barcode ? 'bg-green-500 text-white' : 'bg-gray-200'
                  }`}>
                    {capturedPhotos.barcode ? '?' : '3'}
                  </div>
                  <span className="text-xs">Code-barres</span>
                </div>
              </div>

              {/* Instructions pour chaque etape */}
              <div className="text-center mb-8">
                {photoStep === 'front' && (
                  <>
                    <Package className="w-20 h-20 text-green-700 mx-auto mb-4" />
                    <h4 className="text-xl font-semibold mb-2">Face avant du produit</h4>
                    <p className="text-gray-600">
                      Prenez une photo de la face avant avec le nom du produit bien visible
                    </p>
                  </>
                )}

                {photoStep === 'ingredients' && (
                  <>
                    <List className="w-20 h-20 text-blue-600 mx-auto mb-4" />
                    <h4 className="text-xl font-semibold mb-2">Liste des ingredients</h4>
                    <p className="text-gray-600">
                      Photographiez la liste des ingredients (generalement au dos)
                    </p>
                  </>
                )}

                {photoStep === 'barcode' && (
                  <>
                    <Camera className="w-20 h-20 text-purple-600 mx-auto mb-4" />
                    <h4 className="text-xl font-semibold mb-2">Code-barres</h4>
                    <p className="text-gray-600">
                      Prenez le code-barres en photo (pour une meilleure identification)
                    </p>
                  </>
                )}
              </div>

              {/* Photos deja prises */}
              {Object.keys(capturedPhotos).length > 0 && (
                <div className="mb-6">
                  <h5 className="text-sm font-semibold text-gray-700 mb-3">Photos capturees :</h5>
                  <div className="flex gap-3 justify-center">
                    {capturedPhotos.front && (
                      <img
                        src={capturedPhotos.front}
                        alt="Face avant"
                        className="w-20 h-20 object-cover rounded-lg border-2 border-green-500"
                      />
                    )}
                    {capturedPhotos.ingredients && (
                      <img
                        src={capturedPhotos.ingredients}
                        alt="Ingredients"
                        className="w-20 h-20 object-cover rounded-lg border-2 border-blue-500"
                      />
                    )}
                    {capturedPhotos.barcode && (
                      <img
                        src={capturedPhotos.barcode}
                        alt="Code-barres"
                        className="w-20 h-20 object-cover rounded-lg border-2 border-purple-500"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Boutons d'action */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center mb-3"
              >
                <Camera className="w-6 h-6 mr-2" />
                Prendre la photo
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (photoStep === 'ingredients') setPhotoStep('barcode');
                    else if (photoStep === 'barcode') {
                      setPhotoStep('complete');
                      handleProductSearch(undefined, undefined, capturedPhotos);
                    }
                  }}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Passer
                </button>

                <button
                  onClick={() => { setMode('menu'); resetPhotos(); }}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Retour
                </button>
              </div>
            </div>
          )}

          {/* Mode Saisie Manuelle */}
          {mode === 'manual' && !isLoading && (
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code-barres (optionnel)
                  </label>
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 3017620422003"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    maxLength={13}
                  />
                  <p className="text-xs text-neutral-700 mt-1">
                    Le code-barres se trouve generalement au dos du produit
                  </p>
                </div>

                <div className="text-center text-neutral-700">
                  <span className="bg-white px-4">OU</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du produit
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Ex: Nutella, Coca Cola, Ariel..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  />
                </div>

                <button
                  onClick={handleManualSubmit}
                  disabled={!manualCode && !productName}
                  className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Rechercher le produit
                </button>

                <button
                  onClick={() => setMode('menu')}
                  className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Retour au menu
                </button>
              </div>
            </div>
          )}

          {/* Etat de chargement */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full p-6">
              <Loader className="w-12 h-12 text-green-700 animate-spin mb-4" />
              <p className="text-gray-600 text-center">
                Analyse en cours...
              </p>
              <p className="text-sm text-neutral-700 mt-2">
                Cela peut prendre quelques secondes
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
