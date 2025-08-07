// frontend/src/components/scanner/PhotoCapture.tsx
// Composant simplifié pour capture photo

import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader } from 'lucide-react';

interface PhotoCaptureProps {
  onCapture: (file: File) => void;
  onError?: (error: Error) => void;
  maxSize?: number;
  acceptedFormats?: string[];
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  onCapture,
  onError,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp']
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation du type
    if (!file.type.startsWith('image/')) {
      onError?.(new Error('Veuillez sélectionner une image'));
      return;
    }

    // Validation de la taille
    if (file.size > maxSize) {
      onError?.(new Error(`Image trop volumineuse (max ${Math.round(maxSize / 1024 / 1024)}MB)`));
      return;
    }

    // Créer preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setCapturedFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = () => {
    if (capturedFile) {
      setIsLoading(true);
      onCapture(capturedFile);
    }
  };

  const reset = () => {
    setPreview(null);
    setCapturedFile(null);
    setIsLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (preview) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="relative">
          <img
            src={preview}
            alt="Aperçu du produit"
            className="w-full h-auto max-h-96 object-contain rounded-lg"
          />
          
          {!isLoading && (
            <button
              onClick={reset}
              className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <Loader className="w-12 h-12 animate-spin mx-auto mb-2" />
                <p>Analyse en cours...</p>
              </div>
            </div>
          )}
        </div>

        {!isLoading && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={reset}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Reprendre
            </button>
            <button
              onClick={handleAnalyze}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Analyser
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="text-center">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full aspect-square max-w-xs mx-auto bg-gray-50 hover:bg-gray-100 
                     border-2 border-dashed border-gray-300 hover:border-green-500 
                     rounded-2xl transition-all duration-200 group cursor-pointer
                     flex flex-col items-center justify-center"
        >
          <Camera className="w-16 h-16 text-gray-400 group-hover:text-green-600 transition-colors mb-4" />
          <p className="text-lg font-medium text-gray-700">Prendre une photo</p>
          <p className="text-sm text-gray-500 mt-2">ou cliquer pour choisir une image</p>
        </button>

        <div className="mt-4">
          <p className="text-sm text-gray-600">
            💡 Astuce : Photographiez la liste d'ingrédients ou le code-barres
          </p>
        </div>
      </div>
    </div>
  );
};

export default PhotoCapture;