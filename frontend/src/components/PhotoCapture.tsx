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

  const startCamera = useCallback(async () => {
    console.log('🎬 [PhotoCapture] startCamera appelé');
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      console.log('✅ [PhotoCapture] Stream obtenu');
      setStream(mediaStream);
      setIsCameraActive(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          console.log('📹 [PhotoCapture] Attaching stream to video');
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(err => {
            console.error('❌ [PhotoCapture] Erreur play:', err);
            setError('Impossible de démarrer la vidéo');
          });
        } else {
          console.error('❌ [PhotoCapture] videoRef.current est null');
        }
      }, 100);
      
    } catch (err: any) {
      console.error('❌ [PhotoCapture] Erreur getUserMedia:', err);
      const errorMsg = err.name === 'NotAllowedError' 
        ? 'Accès caméra refusé'
        : 'Impossible d\'accéder à la caméra';
      setError(errorMsg);
      onError?.(new Error(errorMsg));
    }
  }, [onError]);

  const stopCamera = useCallback(() => {
    console.log('🛑 [PhotoCapture] stopCamera appelé');
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCapturedImage(null);
  }, [stream]);

  const capturePhoto = useCallback(async () => {
    console.log('📸 [PhotoCapture] capturePhoto APPELÉ !');
    
    if (!videoRef.current) {
      console.error('❌ [PhotoCapture] videoRef.current est NULL');
      setError('Vidéo non disponible');
      return;
    }
    
    if (!canvasRef.current) {
      console.error('❌ [PhotoCapture] canvasRef.current est NULL');
      setError('Canvas non disponible');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    console.log('📹 [PhotoCapture] Video readyState:', video.readyState);
    console.log('📹 [PhotoCapture] Video dimensions:', video.videoWidth, 'x', video.videoHeight);

    if (video.readyState < video.HAVE_CURRENT_DATA) {
      console.warn('⚠️ [PhotoCapture] Vidéo pas prête, readyState:', video.readyState);
      setError('Vidéo non prête - Attendez 2-3 secondes');
      onError?.(new Error('Vidéo non prête'));
      return;
    }

    try {
      console.log('🎨 [PhotoCapture] Début capture sur canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context non disponible');
      }

      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      console.log('✅ [PhotoCapture] Image capturée, taille:', dataUrl.length, 'chars');
      
      setCapturedImage(dataUrl);
      stopCamera();
      console.log('✅ [PhotoCapture] Capture terminée avec succès');
    } catch (err: any) {
      console.error('❌ [PhotoCapture] Erreur capture:', err);
      setError('Erreur capture photo');
      onError?.(err);
    }
  }, [stopCamera, onError]);

  const confirmPhoto = useCallback(async () => {
    console.log('✅ [PhotoCapture] confirmPhoto appelé');
    if (!capturedImage) {
      console.error('❌ [PhotoCapture] Pas d\'image capturée');
      return;
    }

    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      console.log('📦 [PhotoCapture] Blob créé, taille:', blob.size, 'bytes');
      
      if (blob.size > maxSize) {
        throw new Error(`Fichier trop volumineux (max ${Math.round(maxSize / 1024 / 1024)}MB)`);
      }

      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      console.log('✅ [PhotoCapture] Fichier créé:', file.name);
      onCapture(file);
    } catch (err: any) {
      console.error('❌ [PhotoCapture] Erreur confirmation:', err);
      setError(err.message);
      onError?.(err);
    }
  }, [capturedImage, maxSize, onCapture, onError]);

  const retakePhoto = useCallback(() => {
    console.log('🔄 [PhotoCapture] retakePhoto appelé');
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 [PhotoCapture] handleFileChange appelé');
    setError(null);
    const file = e.target.files?.[0];
    if (!file) {
      console.log('⚠️ [PhotoCapture] Aucun fichier sélectionné');
      return;
    }

    console.log('📁 [PhotoCapture] Fichier:', file.name, file.type, file.size);

    if (!acceptedFormats.includes(file.type)) {
      const errorMsg = 'Format non supporté';
      console.error('❌ [PhotoCapture]', errorMsg);
      setError(errorMsg);
      onError?.(new Error(errorMsg));
      return;
    }

    if (file.size > maxSize) {
      const errorMsg = `Fichier trop volumineux (max ${Math.round(maxSize / 1024 / 1024)}MB)`;
      console.error('❌ [PhotoCapture]', errorMsg);
      setError(errorMsg);
      onError?.(new Error(errorMsg));
      return;
    }

    console.log('✅ [PhotoCapture] Fichier valide, envoi à onCapture');
    onCapture(file);
  }, [acceptedFormats, maxSize, onCapture, onError]);

  console.log('🔄 [PhotoCapture] Render - isCameraActive:', isCameraActive, 'capturedImage:', !!capturedImage);

  return (
    <div className="w-full h-full flex flex-col">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {isCameraActive && !capturedImage && (
        <div className="flex-1 relative bg-black rounded-2xl overflow-hidden min-h-[400px]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ display: 'block' }}
          />
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[85%] h-[60%] border-4 border-white/60 rounded-2xl shadow-2xl"></div>
          </div>

          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 z-20">
            <button
              onClick={() => {
                console.log('🔴 [PhotoCapture] Bouton STOP cliqué');
                stopCamera();
              }}
              className="p-4 bg-white/20 backdrop-blur-sm rounded-full text-white"
              type="button"
            >
              <X className="w-6 h-6" />
            </button>
            <button
              onClick={() => {
                console.log('🔴 [PhotoCapture] Bouton CAPTURE cliqué');
                capturePhoto();
              }}
              className="p-6 bg-white rounded-full shadow-2xl active:scale-95 transition-transform"
              type="button"
            >
              <Camera className="w-8 h-8 text-gray-900" />
            </button>
          </div>
        </div>
      )}

      {capturedImage && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative bg-gray-900 rounded-2xl overflow-hidden min-h-[400px]">
            <img src={capturedImage} alt="Aperçu" className="w-full h-full object-contain" />
          </div>
          
          <div className="mt-4 flex gap-3">
            <button
              onClick={retakePhoto}
              className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl font-medium text-gray-700"
              type="button"
            >
              Reprendre
            </button>
            <button
              onClick={confirmPhoto}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl font-medium text-white shadow-lg flex items-center justify-center gap-2"
              type="button"
            >
              <Check className="w-5 h-5" />
              Analyser
            </button>
          </div>
        </div>
      )}

      {!isCameraActive && !capturedImage && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[400px]">
          {allowCamera && (
            <button
              onClick={startCamera}
              className="w-full max-w-sm px-8 py-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl text-white shadow-xl"
              type="button"
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
                className="w-full max-w-sm px-8 py-6 bg-white border-2 border-gray-300 rounded-2xl text-gray-700 shadow-md"
                type="button"
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

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default PhotoCapture;
