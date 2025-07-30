// PATH: frontend/ecolojiaFrontV3/src/components/scanner/BarcodeScanner.tsx
import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, RotateCw, Zap } from 'lucide-react';

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onClose, isOpen }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const consecutiveScansRef = useRef<{ [code: string]: number }>({});

  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [torch, setTorch] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [scanMethod, setScanMethod] = useState<'native' | 'zxing' | 'none'>('none');
  const [scanCount, setScanCount] = useState(0);
  const [detectedCode, setDetectedCode] = useState<string>('');

  const checkBarcodeDetectorSupport = (): boolean => {
    return 'BarcodeDetector' in window;
  };

  const loadZXing = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).ZXing) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@zxing/library@latest/umd/index.min.js';
      script.onload = () => {
        console.log('✅ ZXing chargé');
        resolve(true);
      };
      script.onerror = () => {
        console.error('❌ Échec chargement ZXing');
        resolve(false);
      };
      document.head.appendChild(script);
    });
  };

  const startCamera = async () => {
    setError(null);
    setIsScanning(true);
    setScanCount(0);
    setDetectedCode('');
    consecutiveScansRef.current = {};

    try {
      console.log('🎥 Démarrage caméra...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { min: 640, ideal: 1280 },
          height: { min: 480, ideal: 720 }
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = async () => {
          await videoRef.current?.play();
          console.log('▶️ Vidéo démarrée');
          setCameraReady(true);
          await initializeDetection();
        };
      }
    } catch (err) {
      console.error('❌ Erreur caméra:', err);
      setError('Caméra non accessible. Autorisez l\'accès dans votre navigateur.');
      setIsScanning(false);
    }
  };

  const initializeDetection = async () => {
    if (checkBarcodeDetectorSupport()) {
      console.log('🎯 Utilisation BarcodeDetector natif');
      setScanMethod('native');
      startNativeDetection();
      return;
    }

    const zxingLoaded = await loadZXing();
    if (zxingLoaded) {
      console.log('🎯 Utilisation ZXing fallback');
      setScanMethod('zxing');
      startZXingDetection();
      return;
    }

    setError('Détection de codes-barres non supportée sur cet appareil');
    setScanMethod('none');
  };

  const isValidBarcode = (code: string): boolean => {
    // Validation stricte : code-barres valides
    if (!code || code.length < 8) return false;
    
    // EAN-13: 13 chiffres
    if (/^\d{13}$/.test(code)) return true;
    
    // EAN-8: 8 chiffres
    if (/^\d{8}$/.test(code)) return true;
    
    // UPC-A: 12 chiffres
    if (/^\d{12}$/.test(code)) return true;
    
    // CODE-128: au moins 8 caractères alphanumériques
    if (/^[A-Za-z0-9]{8,}$/.test(code)) return true;
    
    return false;
  };

  const startNativeDetection = () => {
    const barcodeDetector = new (window as any).BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39']
    });

    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    scanIntervalRef.current = setInterval(async () => {
      await performNativeScan(barcodeDetector);
    }, 300);
  };

  const performNativeScan = async (detector: any) => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState < 2) return;

    try {
      setScanCount(prev => prev + 1);

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const barcodes = await detector.detect(canvas);
      
      if (barcodes.length > 0) {
        const code = barcodes[0].rawValue;
        
        if (isValidBarcode(code)) {
          console.log('🎯 Code valide détecté (natif):', code);
          setDetectedCode(code);
          handlePotentialSuccess(code);
        } else {
          console.log('⚠️ Code invalide ignoré:', code);
        }
      }
    } catch (error) {
      // Ignorer les erreurs normales de scan
    }
  };

  const startZXingDetection = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    scanIntervalRef.current = setInterval(async () => {
      await performZXingScan();
    }, 400);
  };

  const performZXingScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState < 2) return;

    try {
      setScanCount(prev => prev + 1);

      const ZXing = (window as any).ZXing;
      if (!ZXing) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const hints = new Map();
      hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
        ZXing.BarcodeFormat.EAN_13,
        ZXing.BarcodeFormat.EAN_8,
        ZXing.BarcodeFormat.UPC_A,
        ZXing.BarcodeFormat.CODE_128
      ]);
      hints.set(ZXing.DecodeHintType.TRY_HARDER, true);

      const reader = new ZXing.BrowserMultiFormatReader(hints);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      const result = await reader.decodeFromImageData(imageData);
      
      if (result && result.text) {
        const code = result.text;
        
        if (isValidBarcode(code)) {
          console.log('🎯 Code valide détecté (ZXing):', code);
          setDetectedCode(code);
          handlePotentialSuccess(code);
        } else {
          console.log('⚠️ Code invalide ignoré:', code);
        }
      }
    } catch (error) {
      // Ignorer les erreurs normales de scan
    }
  };

  const handlePotentialSuccess = (code: string) => {
    if (!consecutiveScansRef.current[code]) {
      consecutiveScansRef.current[code] = 1;
    } else {
      consecutiveScansRef.current[code]++;
    }

    Object.keys(consecutiveScansRef.current).forEach(oldCode => {
      if (oldCode !== code) {
        delete consecutiveScansRef.current[oldCode];
      }
    });

    console.log(`🔄 Code "${code}" détecté ${consecutiveScansRef.current[code]}/3 fois`);

    if (consecutiveScansRef.current[code] >= 3) {
      handleSuccess(code);
    }
  };

  const handleSuccess = (code: string) => {
    const now = Date.now();
    if (now - lastScanTimeRef.current < 3000) return;

    lastScanTimeRef.current = now;
    console.log('✅ CODE FINAL CONFIRMÉ:', code);
    
    stopDetection();
    onScanSuccess(code);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;

    try {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities();

      if ('torch' in capabilities) {
        await track.applyConstraints({
          advanced: [{ torch: !torch }]
        });
        setTorch(!torch);
        console.log(`💡 Torche ${torch ? 'OFF' : 'ON'}`);
      }
    } catch (error) {
      console.log('💡 Torche non supportée');
    }
  };

  const stopDetection = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    consecutiveScansRef.current = {};
    setIsScanning(false);
    setCameraReady(false);
    setScanCount(0);
    setScanMethod('none');
    setDetectedCode('');
  };

  const restart = () => {
    stopDetection();
    setError(null);
    setTimeout(() => {
      startCamera();
    }, 500);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopDetection();
    }

    return () => stopDetection();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      <div className="flex items-center justify-between p-4 bg-black/90">
        <div className="flex items-center space-x-3">
          <Camera className="h-6 w-6 text-white" />
          <div>
            <h2 className="text-white font-semibold">Scanner ECOLOJIA</h2>
            <p className="text-white/60 text-xs">
              {detectedCode ? `Code: ${detectedCode}` :
               cameraReady ? `${scanMethod === 'native' ? 'Natif' : scanMethod === 'zxing' ? 'ZXing' : 'Aucun'} • Scans: ${scanCount}` :
               isScanning ? 'Démarrage...' : 'Arrêté'}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            stopDetection();
            onClose();
          }}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 relative bg-black">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
          autoPlay
        />

        <canvas ref={canvasRef} className="hidden" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-black/30" />
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-black/30" />
            <div className="absolute top-1/3 bottom-1/3 left-0 w-12 bg-black/30" />
            <div className="absolute top-1/3 bottom-1/3 right-0 w-12 bg-black/30" />
          </div>

          <div className="relative">
            <div className="w-80 h-20 border-2 border-white/80 rounded-xl" />
            
            <div className="absolute -top-3 -left-3 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-xl" />
            <div className="absolute -top-3 -right-3 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-xl" />
            <div className="absolute -bottom-3 -left-3 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-xl" />
            <div className="absolute -bottom-3 -right-3 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-xl" />

            <div className="absolute inset-0 overflow-hidden rounded-xl">
              <div 
                className="absolute left-0 right-0 h-1 bg-red-500"
                style={{
                  top: '50%',
                  animation: cameraReady ? 'scan 2s ease-in-out infinite' : 'none'
                }}
              />
            </div>
          </div>
        </div>

        <div className="absolute bottom-32 left-4 right-4">
          <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-white font-medium mb-1">
              Placez un code-barres dans le cadre
            </p>
            <p className="text-white/60 text-sm">
              {detectedCode ? `Code détecté: ${detectedCode}` :
               'Attendez 3 détections consécutives pour confirmer'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-black/90">
        <div className="flex justify-center space-x-4">
          <button
            onClick={toggleTorch}
            className={`p-3 rounded-full transition-colors ${
              torch ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Zap className="h-5 w-5" />
          </button>

          <button
            onClick={restart}
            className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700"
          >
            <RotateCw className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-white/40 text-xs">
            Détection sécurisée • EAN-13, UPC-A, CODE-128
          </p>
        </div>
      </div>

      {error && (
        <div className="absolute top-20 left-4 right-4 bg-red-500/90 rounded-xl p-4">
          <p className="text-white font-medium text-center mb-3">{error}</p>
          <button
            onClick={restart}
            className="w-full py-2 bg-white/20 rounded-lg text-white font-medium"
          >
            Réessayer
          </button>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { top: 20%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 80%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
// EOF