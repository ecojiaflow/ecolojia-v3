// frontend/src/components/scanner/BarcodeScanner.tsx
// Scanner de codes-barres avec caméra réelle + fallback manuel

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Camera, X, Keyboard, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScanSuccess,
  onError,
  onClose
}) => {
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialiser le lecteur de codes-barres
  useEffect(() => {
    codeReaderRef.current = new BrowserMultiFormatReader();
    
    // Nettoyer à la destruction
    return () => {
      stopScanning();
    };
  }, []);

  // Demander la permission et lister les caméras
  useEffect(() => {
    const checkPermissionsAndDevices = async () => {
      try {
        // Demander la permission
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        setHasPermission(true);
        
        // Arrêter immédiatement ce stream temporaire
        stream.getTracks().forEach(track => track.stop());
        
        // Lister les périphériques vidéo
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        setVideoDevices(videoInputs);
        
        // Préférer la caméra arrière
        const backCamera = videoInputs.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('arrière')
        );
        
        if (backCamera) {
          setSelectedDeviceId(backCamera.deviceId);
        } else if (videoInputs.length > 0) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
        
      } catch (err) {
        console.error('Permission refusée:', err);
        setHasPermission(false);
        setError('Accès à la caméra refusé. Utilisez le mode manuel.');
        setMode('manual');
      }
    };

    if (mode === 'camera') {
      checkPermissionsAndDevices();
    }
  }, [mode]);

  // Démarrer le scan quand le mode caméra est activé
  useEffect(() => {
    if (mode === 'camera' && hasPermission && selectedDeviceId && !isScanning) {
      startScanning();
    }
  }, [mode, hasPermission, selectedDeviceId]);

  const startScanning = async () => {
    if (!codeReaderRef.current || !videoRef.current) return;
    
    setError(null);
    setIsScanning(true);

    try {
      // Contraintes vidéo optimisées pour le scan
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          facingMode: selectedDeviceId ? undefined : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 16/9 }
        }
      };

      // Obtenir le stream vidéo
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Assigner le stream à la vidéo
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // Démarrer la détection
        scanBarcode();
      }
      
    } catch (err) {
      console.error('Erreur démarrage scan:', err);
      setError('Impossible de démarrer la caméra');
      setIsScanning(false);
      onError?.(err as Error);
    }
  };

  const scanBarcode = () => {
    if (!codeReaderRef.current || !videoRef.current || !isScanning) return;

    const scan = async () => {
      try {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          const result = await codeReaderRef.current.decodeFromVideoElement(videoRef.current);
          
          if (result) {
            // Vibrer si disponible
            if ('vibrate' in navigator) {
              navigator.vibrate(200);
            }
            
            // Son de succès
            const audio = new Audio('/sounds/beep.mp3');
            audio.play().catch(() => {});
            
            // Arrêter le scan et retourner le résultat
            stopScanning();
            onScanSuccess(result.getText());
            return;
          }
        }
      } catch (err) {
        if (!(err instanceof NotFoundException)) {
          console.error('Erreur scan:', err);
        }
      }

      // Continuer le scan
      if (isScanning) {
        animationFrameRef.current = requestAnimationFrame(scan);
      }
    };

    scan();
  };

  const stopScanning = useCallback(() => {
    setIsScanning(false);

    // Arrêter l'animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Arrêter le stream vidéo
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Réinitialiser la vidéo
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valider le code-barres
    const cleanCode = manualCode.trim();
    
    if (!cleanCode) {
      setError('Veuillez entrer un code-barres');
      return;
    }
    
    if (!/^\d{8,13}$/.test(cleanCode)) {
      setError('Code-barres invalide (8 à 13 chiffres)');
      return;
    }
    
    onScanSuccess(cleanCode);
  };

  const switchMode = (newMode: 'camera' | 'manual') => {
    if (newMode === mode) return;
    
    stopScanning();
    setError(null);
    setMode(newMode);
  };

  return (
    <div className="barcode-scanner-container">
      {/* Header avec switch de mode */}
      <div className="scanner-header">
        <h3 className="text-lg font-semibold">Scanner un code-barres</h3>
        
        <div className="mode-switcher">
          <button
            onClick={() => switchMode('camera')}
            className={`mode-btn ${mode === 'camera' ? 'active' : ''}`}
            disabled={hasPermission === false}
          >
            <Camera className="w-4 h-4 mr-2" />
            Caméra
          </button>
          
          <button
            onClick={() => switchMode('manual')}
            className={`mode-btn ${mode === 'manual' ? 'active' : ''}`}
          >
            <Keyboard className="w-4 h-4 mr-2" />
            Manuel
          </button>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="close-btn"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Zone de scan ou formulaire */}
      <AnimatePresence mode="wait">
        {mode === 'camera' ? (
          <motion.div
            key="camera"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="scanner-content"
          >
            {hasPermission === false ? (
              <div className="permission-denied">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-center mb-4">
                  L'accès à la caméra a été refusé.
                  Veuillez utiliser le mode manuel ou autoriser l'accès dans les paramètres.
                </p>
                <button
                  onClick={() => setMode('manual')}
                  className="btn-primary"
                >
                  Utiliser le mode manuel
                </button>
              </div>
            ) : (
              <>
                {/* Sélecteur de caméra si plusieurs disponibles */}
                {videoDevices.length > 1 && (
                  <div className="camera-selector">
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => {
                        setSelectedDeviceId(e.target.value);
                        stopScanning();
                      }}
                      className="camera-select"
                    >
                      {videoDevices.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Caméra ${device.deviceId.slice(0, 5)}...`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Zone vidéo */}
                <div className="video-container">
                  <video
                    ref={videoRef}
                    className="scanner-video"
                    playsInline
                    muted
                  />
                  
                  {/* Overlay de scan */}
                  <div className="scanner-overlay">
                    <div className="scanner-guide">
                      <div className="scanner-corner top-left" />
                      <div className="scanner-corner top-right" />
                      <div className="scanner-corner bottom-left" />
                      <div className="scanner-corner bottom-right" />
                    </div>
                    
                    {isScanning && (
                      <div className="scanner-line" />
                    )}
                  </div>

                  {/* Instructions */}
                  <div className="scanner-instructions">
                    <p>Placez le code-barres dans le cadre</p>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="manual-input-container"
          >
            <form onSubmit={handleManualSubmit} className="manual-form">
              <p className="text-sm text-gray-600 mb-4">
                Entrez manuellement le code-barres situé sous le produit
              </p>
              
              <div className="input-group">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => {
                    setManualCode(e.target.value.replace(/\D/g, ''));
                    setError(null);
                  }}
                  placeholder="Ex: 3017620422003"
                  className="barcode-input"
                  maxLength={13}
                  autoFocus
                  pattern="\d{8,13}"
                  inputMode="numeric"
                />
                
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={!manualCode.trim()}
                >
                  Valider
                </button>
              </div>

              {/* Exemple visuel */}
              <div className="barcode-example">
                <img 
                  src="/images/barcode-example.png" 
                  alt="Exemple de code-barres"
                  className="example-image"
                />
                <p className="text-xs text-gray-500">
                  Le code-barres se trouve généralement au dos du produit
                </p>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Affichage des erreurs */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="error-message"
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </motion.div>
      )}
    </div>
  );
};

// Styles CSS nécessaires (à ajouter dans votre fichier CSS/SCSS)
const styles = `
.barcode-scanner-container {
  @apply bg-white rounded-lg shadow-lg p-4 max-w-md mx-auto;
}

.scanner-header {
  @apply flex items-center justify-between mb-4;
}

.mode-switcher {
  @apply flex bg-gray-100 rounded-lg p-1;
}

.mode-btn {
  @apply flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all;
  @apply text-gray-600 hover:text-gray-900;
}

.mode-btn.active {
  @apply bg-white text-green-600 shadow-sm;
}

.mode-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.scanner-content {
  @apply relative;
}

.video-container {
  @apply relative bg-black rounded-lg overflow-hidden aspect-video;
}

.scanner-video {
  @apply w-full h-full object-cover;
}

.scanner-overlay {
  @apply absolute inset-0 pointer-events-none;
}

.scanner-guide {
  @apply absolute inset-[10%] border-2 border-white/50 rounded-lg;
}

.scanner-corner {
  @apply absolute w-5 h-5 border-3 border-green-500;
}

.scanner-corner.top-left {
  @apply top-0 left-0 border-r-0 border-b-0;
}

.scanner-corner.top-right {
  @apply top-0 right-0 border-l-0 border-b-0;
}

.scanner-corner.bottom-left {
  @apply bottom-0 left-0 border-r-0 border-t-0;
}

.scanner-corner.bottom-right {
  @apply bottom-0 right-0 border-l-0 border-t-0;
}

.scanner-line {
  @apply absolute left-[10%] right-[10%] h-0.5 bg-green-500;
  animation: scan 2s linear infinite;
  top: 10%;
}

@keyframes scan {
  0% { top: 10%; }
  100% { top: 90%; }
}

.scanner-instructions {
  @apply absolute bottom-4 left-0 right-0 text-center;
}

.scanner-instructions p {
  @apply text-white text-sm bg-black/50 inline-block px-3 py-1 rounded-full;
}

.manual-form {
  @apply space-y-4;
}

.input-group {
  @apply flex gap-2;
}

.barcode-input {
  @apply flex-1 px-4 py-2 border border-gray-300 rounded-lg;
  @apply focus:ring-2 focus:ring-green-500 focus:border-transparent;
  @apply text-lg font-mono text-center;
}

.submit-btn {
  @apply px-6 py-2 bg-green-600 text-white rounded-lg;
  @apply hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed;
  @apply transition-colors;
}

.barcode-example {
  @apply mt-6 p-4 bg-gray-50 rounded-lg text-center;
}

.example-image {
  @apply w-48 h-auto mx-auto mb-2;
}

.error-message {
  @apply mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center text-sm;
}

.permission-denied {
  @apply text-center py-8;
}

.camera-selector {
  @apply mb-4;
}

.camera-select {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg;
  @apply focus:ring-2 focus:ring-green-500 focus:border-transparent;
}

.close-btn {
  @apply p-1 hover:bg-gray-100 rounded-lg transition-colors;
}
`;

export default BarcodeScanner;