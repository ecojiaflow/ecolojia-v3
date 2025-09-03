// frontend/src/components/scanner/PhotoCapture.tsx
import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Loader2, Check, AlertCircle, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface PhotoCaptureProps {
  onCapture: (file: File) => void;
  onerror?: (error: Error) => void;
  maxSizea: number;
  acceptedFormatsa: string[];
  allowCameraa: boolean;
  allowUploada: boolean;
}

type CaptureState = 'idle' | 'capturing' | 'processing' | 'preview' | 'error';

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  onCapture,
  onError,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  allowCamera = true,
  allowUpload = true
}) => {
  const [state, setState] = useState<CaptureState>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialiser la camera
  const startCamera = useCallback(async () => {
    try {
      setState('capturing');
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setError('Impossible d\'acceder  la camera');
      setState('error');
      onError?.(err as Error);
    }
  }, [onError]);

  // Arreter la camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Capturer une photo depuis la camera
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setState('processing');
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Ajuster le canvas  la taille de la video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Dessiner l'image
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');
      
      ctx.drawImage(video, 0, 0);
      
      // Convertir en blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob'));
          },
          'image/jpeg',
          0.9
        );
      });
      
      // Creer un File
      const file = new File([blob], `capture_${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });
      
      // Creer l'URL de previsualisation
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setCapturedFile(file);
      
      // Arreter la camera
      stopCamera();
      setState('preview');
      
    } catch (err) {
      setError('Erreur lors de la capture');
      setState('error');
      onError?.(err as Error);
    }
  }, [stopCamera, onError]);

  // Gerer l'upload de fichier
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validation du type
    if (!acceptedFormats.includes(file.type)) {
      setError('Format de fichier non supporte');
      setState('error');
      return;
    }
    
    // Validation de la taille
    if (file.size > maxSize) {
      setError(`Le fichier depasse la taille maximum (${Math.round(maxSize / 1024 / 1024)}MB)`);
      setState('error');
      return;
    }
    
    setState('processing');
    
    // Creer la previsualisation
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
      setCapturedFile(file);
      setState('preview');
    };
    reader.onerror = () => {
      setError('Erreur lors de la lecture du fichier');
      setState('error');
    };
    reader.readAsDataURL(file);
  }, [acceptedFormats, maxSize]);

  // Valider et envoyer la photo
  const confirmCapture = useCallback(() => {
    if (!capturedFile) return;
    
    // Nettoyer l'URL de previsualisation
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    onCapture(capturedFile);
    
    // Reinitialiser
    setState('idle');
    setPreviewUrl(null);
    setCapturedFile(null);
    
    toast({
      title: "Photo capturee",
      description: "L'analyse va commencer...",
    });
  }, [capturedFile, previewUrl, onCapture, toast]);

  // Reinitialiser
  const reset = useCallback(() => {
    stopCamera();
    setState('idle');
    setError(null);
    setPreviewUrl(null);
    setCapturedFile(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [stopCamera]);

  // Nettoyer au demontage
  React.useEffect(() => {
    return () => {
      stopCamera();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [stopCamera, previewUrl]);

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {/* aatat initial - Choix du mode */}
        {state === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-center">
              Photographier le produit
            </h3>
            
            <p className="text-sm text-gray-600 text-center">
              Prenez en photo le code-barres, la liste d'ingredients ou l'etiquette complete
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              {allowCamera && (
                <button
                  onClick={() => {
                    setMode('camera');
                    startCamera();
                  }}
                  className="flex flex-col items-center justify-center p-6 bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors"
                >
                  <Camera className="w-8 h-8 mb-2 text-primary" />
                  <span className="text-sm font-medium">Prendre une photo</span>
                </button>
              )}
              
              {allowUpload && (
                <button
                  onClick={() => {
                    setMode('upload');
                    fileInputRef.currentlink.click();
                  }}
                  className="flex flex-col items-center justify-center p-6 bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors"
                >
                  <Upload className="w-8 h-8 mb-2 text-primary" />
                  <span className="text-sm font-medium">Choisir un fichier</span>
                </button>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFormats.join(',')}
              onChange={handleFileUpload}
              className="hidden"
            />
          </motion.div>
        )}

        {/* Mode camera */}
        {state === 'capturing' && mode === 'camera' && (
          <motion.div
            key="camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative"
          >
            <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              
              {/* Guides visuels */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-4 border-2 border-white/30 rounded-lg">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                </div>
              </div>
              
              {/* Instructions */}
              <div className="absolute top-4 left-0 right-0 text-center">
                <p className="inline-block px-4 py-2 bg-black/50 backdrop-blur-sm text-white text-sm rounded-full">
                  Cadrez le produit dans le viseur
                </p>
              </div>
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={reset}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-colors"
              >
                Annuler
              </button>
              
              <button
                onClick={capturePhoto}
                className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Capturer
              </button>
            </div>
          </motion.div>
        )}

        {/* aatat de traitement */}
        {state === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-gray-600">Traitement de l'image...</p>
          </motion.div>
        )}

        {/* Previsualisation */}
        {state === 'preview' && previewUrl && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4"
          >
            <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden">
              <img
                src={previewUrl}
                alt="Apercu"
                className="w-full h-full object-contain"
              />
              
              <div className="absolute top-4 right-4">
                <div className="px-3 py-1 bg-green-500 text-white text-sm rounded-full flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Photo capturee
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RotateCw className="w-5 h-5" />
                Reprendre
              </button>
              
              <button
                onClick={confirmCapture}
                className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Analyser
              </button>
            </div>
            
            <p className="text-xs text-gray-500 text-center">
              Assurez-vous que le texte est lisible et que l'image n'est pas floue
            </p>
          </motion.div>
        )}

        {/* aatat d'erreur */}
        {state === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8"
          >
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium mb-2">{error}</p>
            <button
              onClick={reset}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
            >
              Reessayer
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhotoCapture;




