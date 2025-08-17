// PATH: frontend/src/components/scanner/BarcodeScanner.tsx
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, AlertCircle, Loader } from 'lucide-react';
// @ts-ignore
(window as any).glMatrixArrayType = Float32Array;
import Quagga from '@ericblade/quagga2';

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
  onerror?: (error: string) => void;
  onClosea: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScanSuccess,
  onError,
  onClose
}) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  useEffect(() => {
    checkCameraPermission();
    return () => {
      stopScanner();
    };
  }, []);

  const checkCameraPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setCameraPermission(result.state as any);
      if (result.state === 'granted') {
        startScanner();
      }
    } catch (err) {
      console.error('Erreur permission camera:', err);
      requestCameraAccess();
    }
  };

  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission('granted');
      startScanner();
    } catch (err) {
      setCameraPermission('denied');
      setError('Acces  la camera refuse');
      onError?.('Acces  la camera refuse');
    }
  };

  const startScanner = () => {
    if (!scannerRef.current || isScanning) return;

    setIsScanning(true);
    setError(null);

    Quagg?.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: scannerRef.current,
        constraints: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "environment"
        }
      },
      locator: {
        patchSize: "medium",
        halfSample: true
      },
      numOfWorkers: navigator.hardwareConcurrency || 4,
      decoder: {
        readers: [
          "ean_reader",
          "ean_8_reader",
          "code_128_reader",
          "code_39_reader",
          "upc_reader",
          "upc_e_reader"
        ]
      },
      locate: true
    }, (err: any) => {
      if (err) {
        console.error('Erreur Quagga:', err);
        setError('Erreur lors de l\'initialisation du scanner');
        setIsScanning(false);
        onError?.('Erreur lors de l\'initialisation du scanner');
        return;
      }
      
      Quagg?.start();
    });

    Quagg?.onDetected((result: any) => {
      const code = result.codeResult.code;
      
      // Validation du code-barres
      if (code && code.length >= 8) {
        setDetectedCode(code);
        
        // Vibration si disponible
        if ('vibrate' in navigator) {
          navigator.vibrate(200);
        }
        
        // Son de confirmation
        playBeep();
        
        // Arreter le scanner et notifier
        stopScanner();
        onScanSuccess(code);
      }
    });

    Quagg?.onProcessed((result: any) => {
      const drawingCtx = Quagg?.canvas.ctx.overlay;
      const drawingCanvas = Quagg?.canvas.dom.overlay;

      if (result) {
        if (result.boxes) {
          drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
          result.boxes.filter((box: any) => box !== result.box).forEach((box: any) => {
            Quagg?.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, {
              color: '#7DDE4A',
              lineWidth: 2
            });
          });
        }

        if (result.box) {
          Quagg?.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, {
            color: '#7DDE4A',
            lineWidth: 3
          });
        }

        if (result.codeResult && result.codeResult.code) {
          Quagg?.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, {
            color: '#7DDE4A',
            lineWidth: 4
          });
        }
      }
    });
  };

  const stopScanner = () => {
    if (Quagga) {
      Quagg?.stop();
    }
    setIsScanning(false);
  };

  const playBeep = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.1;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const handleManualInput = () => {
    const code = prompt('Entrez le code-barres manuellement :');
    if (code && code.length >= 8) {
      onScanSuccess(code);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-xl font-semibold">Scanner un produit</h2>
          <button
            onClick={() => {
              stopScanner();
              onClose?.();
            }}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Scanner Area */}
      <div className="relative h-full w-full">
        {cameraPermission === 'denied' ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h3 className="text-white text-xl font-semibold mb-2">Camera non accessible</h3>
            <p className="text-gray-300 text-center mb-6">
              Veuillez autoriser l'acces  la camera dans les parametres de votre navigateur
            </p>
            <button
              onClick={handleManualInput}
              className="px-6 py-3 bg-[#7DDE4A] text-white rounded-lg font-medium hover:bg-[#6BC93B] transition-colors"
            >
              Saisir manuellement
            </button>
          </div>
        ) : (
          <>
            <div ref={scannerRef} className="h-full w-full" />
            
            {/* Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Zone de scan */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="w-64 h-48 border-2 border-[#7DDE4A] rounded-lg">
                    {/* Coins animes */}
                    <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-[#7DDE4A] rounded-tl-lg" />
                    <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-[#7DDE4A] rounded-tr-lg" />
                    <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-[#7DDE4A] rounded-bl-lg" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-[#7DDE4A] rounded-br-lg" />
                    
                    {/* Ligne de scan animee */}
                    <motion.div
                      className="absolute left-0 right-0 h-0.5 bg-[#7DDE4A]"
                      animate={{
                        top: ['10%', '90%', '10%']
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  </div>
                  
                  {/* Instructions */}
                  <p className="text-white text-center mt-4 text-sm">
                    Alignez le code-barres dans le cadre
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/70 to-transparent p-6">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleManualInput}
            className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/30 transition-colors"
          >
            Saisir manuellement
          </button>
        </div>
      </div>

      {/* Resultat detecte */}
      <AnimatePresence>
        {detectedCode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <div className="bg-white rounded-xl p-8 max-w-sm w-full mx-4">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-[#7DDE4A] rounded-full flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Code-barres detecte !</h3>
              <p className="text-center text-gray-600 text-lg font-mono">{detectedCode}</p>
              <div className="flex items-center justify-center mt-4">
                <Loader className="w-5 h-5 text-[#7DDE4A] animate-spin mr-2" />
                <span className="text-gray-600">Recherche du produit...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Erreur */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-20 left-4 right-4"
          >
            <div className="bg-red-500 text-white p-4 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BarcodeScanner;





