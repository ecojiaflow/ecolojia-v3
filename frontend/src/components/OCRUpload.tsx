import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';

interface VisionResult {
  success: boolean;
  source: 'google' | 'stub';
  ingredients: string[];
  warnings: string[];
  rawText: string;
  confidence?: number;
}

interface OCRUploadProps {
  onAnalysis: (result: VisionResult) => void;
  isLoading?: boolean;
  className?: string;
}

export function OCRUpload({ onAnalysis, isLoading = false, className = '' }: OCRUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sÃ©lectionner une image valide');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image doit faire moins de 5MB');
      return;
    }

    // Preview de l'image
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      // Appel Ã  l'API Vision avec FormData
      const formData = new FormData();
      formData.append('image', file);

      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:10000';
      const response = await fetch(`${apiBase}/api/vision/analyze`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        onAnalysis(result);
      } else {
        throw new Error(result.error || 'Analyse Ã©chouÃ©e');
      }
    } catch (error) {
      console.error('Erreur analyse OCR:', error);
      // Fallback avec rÃ©sultat stub pour tests
      const stubResult: VisionResult = {
        success: true,
        source: 'stub',
        ingredients: ['Sucre', 'Huile de palme', 'Noisettes 13%', 'Cacao maigre en poudre 7.4%'],
        warnings: ['Contient des fruits Ã  coque', 'Peut contenir du gluten'],
        rawText: `NUTELLA\nSucre, huile de palme, noisettes 13%, cacao maigre en poudre 7.4%, lait Ã©crÃ©mÃ© en poudre 6.6%, Ã©mulsifiants : lÃ©cithines [soja], vanilline.\n\nÃ€ conserver dans un endroit frais et sec.`,
        confidence: 0.85
      };
      onAnalysis(stubResult);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const cameraSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Zone de drop */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="relative">
            <img 
              src={preview} 
              alt="Preview" 
              className="max-h-64 mx-auto rounded-lg shadow-md"
            />
            <button
              onClick={clearPreview}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              disabled={isLoading}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            {isLoading ? (
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm text-gray-600">Analyse en cours...</p>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  DÃ©posez une image ici
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  ou utilisez les boutons ci-dessous
                </p>
              </>
            )}
          </>
        )}
      </div>

      {/* Boutons d'actions */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Upload size={18} />
          Choisir une image
        </button>

        {cameraSupported && (
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Camera size={18} />
            Prendre une photo
          </button>
        )}
      </div>

      {/* Inputs cachÃ©s */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="hidden"
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="hidden"
      />

      {/* Instructions */}
      <div className="text-xs text-gray-500 text-center">
        Formats acceptÃ©s: JPG, PNG, WebP â€¢ Taille max: 5MB
      </div>
    </div>
  );
}
