import React, { useRef, useState, useCallback } from 'react';
import { Camera, Upload, X, Check, AlertCircle } from 'lucide-react';

interface PhotoCaptureProps {
  onCapture: (file: File) => void;
  onError?: (error: Error) => void;
  maxSize: number;
  acceptedFormats: string[];
  allowCamera: boolean;
  allowUpload?: boolean;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  onCapture,
  onError,
  maxSize,
  acceptedFormats,
  allowCamera,
  allowUpload = true
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Démarrer caméra
  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      
      setStream(mediaStream);
      setIsCameraActive(true);
    } catch (err: any) {
      const errorMsg = err.name === 'NotAllowedError' 
        ? 'Accès caméra refusé. Autorisez la caméra dans les paramètres.'
        : 'Impossible d\'accéder à la caméra';
      setError(errorMsg);
      onError?.(new Error(errorMsg));
    }
  }, [onError]);

  // Arrêter caméra
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
    setCapturedImage(null);
  }, [stream]);

  // Capturer photo depuis vidéo
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Erreur technique - Réessayez');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Validation readyState CRITIQUE
    if (video.readyState < video.HAVE_CURRENT_DATA) {
      setError('Vidéo non prête - Attendez 2 secondes');
      onError?.(new Error('Vidéo non prête'));
      return;
    }

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context non disponible');
      }

      ctx.drawImage(video, 0, 0);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
      
      // Arrêter caméra après capture
      stopCamera();
    } catch (err: any) {
      console.error('❌ [PhotoCapture] Erreur capture:', err);
      setError('Erreur lors de la capture');
      onError?.(err);
    }
  }, [stopCamera, onError]);

  // Valider et envoyer photo capturée
  const confirmPhoto = useCallback(async () => {
    if (!capturedImage) return;

    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      // Validation taille
      if (blob.size > maxSize) {
        throw new Error(`Fichier trop volumineux (max ${Math.round(maxSize / 1024 / 1024)}MB)`);
      }

      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      onCapture(file);
    } catch (err: any) {
      console.error('❌ [PhotoCapture] Erreur confirmation:', err);
      setError(err.message);
      onError?.(err);
    }
  }, [capturedImage, maxSize, onCapture, onError]);

  // Annuler photo capturée
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  // Upload fichier
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation format
    if (!acceptedFormats.includes(file.type)) {
      const errorMsg = 'Format non supporté. Utilisez JPEG, PNG ou WebP';
      setError(errorMsg);
      onError?.(new Error(errorMsg));
      return;
    }

    // Validation taille
    if (file.size > maxSize) {
      const errorMsg = `Fichier trop volumineux (max ${Math.round(maxSize / 1024 / 1024)}MB)`;
      setError(errorMsg);
      onError?.(new Error(errorMsg));
      return;
    }

    onCapture(file);
  }, [acceptedFormats, maxSize, onCapture, onError]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Erreur affichée */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Caméra active */}
      {isCameraActive && !capturedImage && (
        <div className="relative flex-1 bg-black rounded-2xl overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {/* Cadre guide */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[90%] h-[70%] border-4 border-white/50 rounded-2xl"></div>
          </div>

          {/* Boutons overlay */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
            <button
              onClick={stopCamera}
              className="p-4 bg-white/20 backdrop-blur-sm rounded-full text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <button
              onClick={capturePhoto}
              className="p-6 bg-white rounded-full shadow-xl active:scale-95 transition-transform"
            >
              <Camera className="w-8 h-8 text-gray-900" />
            </button>
          </div>
        </div>
      )}

      {/* Photo capturée - Aperçu */}
      {capturedImage && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative bg-black rounded-2xl overflow-hidden">
            <img src={capturedImage} alt="Aperçu" className="w-full h-full object-contain" />
          </div>
          
          <div className="mt-4 flex gap-3">
            <button
              onClick={retakePhoto}
              className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl font-medium text-gray-700 active:scale-95 transition-transform"
            >
              Reprendre
            </button>
            <button
              onClick={confirmPhoto}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl font-medium text-white shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Analyser
            </button>
          </div>
        </div>
      )}

      {/* Choix initial (caméra ou upload) */}
      {!isCameraActive && !capturedImage && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          {allowCamera && (
            <button
              onClick={startCamera}
              className="w-full max-w-sm px-8 py-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl text-white shadow-xl active:scale-95 transition-transform"
            >
              <div className="flex items-center justify-center gap-3">
                <Camera className="w-8 h-8" />
                <div className="text-left">
                  <div className="text-lg font-bold">Prendre une photo</div>
                  <div className="text-sm opacity-90">Ouvrir la caméra</div>
                </div>
              </div>
            </button>
          )}

          {allowUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFormats.join(',')}
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-sm px-8 py-6 bg-white border-2 border-gray-300 rounded-2xl text-gray-700 shadow-md active:scale-95 transition-transform"
              >
                <div className="flex items-center justify-center gap-3">
                  <Upload className="w-8 h-8" />
                  <div className="text-left">
                    <div className="text-lg font-bold">Choisir un fichier</div>
                    <div className="text-sm opacity-75">Depuis la galerie</div>
                  </div>
                </div>
              </button>
            </>
          )}
        </div>
      )}

      {/* Canvas caché pour capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default PhotoCapture;
