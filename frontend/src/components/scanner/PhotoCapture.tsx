// PATH: frontend/src/components/scanner/PhotoCapture.tsx
import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Upload, 
  X, 
  RotateCw, 
  Check,
  AlertCircle,
  Image as ImageIcon 
} from 'lucide-react';
import visionService from '../../services/visionService';

interface PhotoCaptureProps {
  onCapture: (file: File) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
  maxSize?: number;
  acceptedFormats?: string[];
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  onCapture,
  onError,
  onClose,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp']
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);

    // Validation du fichier
    if (!acceptedFormats.includes(file.type)) {
      const errorMsg = 'Format de fichier non supportÃ©. Utilisez JPG, PNG ou WebP.';
      setError(errorMsg);
      onError?.(new Error(errorMsg));
      return;
    }

    if (file.size > maxSize) {
      const errorMsg = `Le fichier est trop volumineux. Taille max: ${maxSize / 1024 / 1024}MB`;
      setError(errorMsg);
      onError?.(new Error(errorMsg));
      return;
    }

    setSelectedFile(file);

    // CrÃ©er la preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [acceptedFormats, maxSize, onError]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

    const analyzeImage = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Passer le fichier au parent qui gérera l'analyse
      onCapture(selectedFile);
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur lors du traitement';
      setError(errorMsg);
      onError?.(new Error(errorMsg));
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header */}
      <div className="bg-[#7DDE4A] text-white p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h2 className="text-xl font-semibold">Scanner avec une photo</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        {!preview ? (
          <>
            {/* Instructions */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">
                ðŸ“¸ Comment prendre une bonne photo ?
              </h3>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>â€¢ Prenez la photo dans un endroit bien Ã©clairÃ©</li>
                <li>â€¢ Cadrez le produit en entier avec ses Ã©tiquettes</li>
                <li>â€¢ Assurez-vous que le texte est net et lisible</li>
                <li>â€¢ Incluez le code-barres si possible</li>
              </ul>
            </div>

            {/* Drop Zone */}
            <div
              ref={dropZoneRef}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
                dragActive 
                  ? 'border-[#7DDE4A] bg-[#7DDE4A]/5' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFormats.join(',')}
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="text-center">
                <div className="mx-auto w-24 h-24 mb-4 text-gray-400">
                  {dragActive ? (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      <ImageIcon className="w-24 h-24 text-[#7DDE4A]" />
                    </motion.div>
                  ) : (
                    <Camera className="w-24 h-24" />
                  )}
                </div>

                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {dragActive ? 'DÃ©posez votre image ici' : 'Glissez une image ou cliquez pour sÃ©lectionner'}
                </h3>
                
                <p className="text-sm text-gray-500 mb-4">
                  JPG, PNG ou WebP â€¢ Max {maxSize / 1024 / 1024}MB
                </p>

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-[#7DDE4A] text-white rounded-lg font-medium hover:bg-[#6BC93B] transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    Choisir une image
                  </button>

                  <button
                    onClick={() => {
                      // Ouvrir la camÃ©ra si disponible
                      if (navigator.mediaDevices?.getUserMedia) {
                        fileInputRef.current?.setAttribute('capture', 'environment');
                        fileInputRef.current?.click();
                      }
                    }}
                    className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Prendre une photo
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Preview */}
            <div className="mb-6">
              <div className="relative rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full max-h-[500px] object-contain"
                />
                
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 text-center">
                      <div className="w-16 h-16 mx-auto mb-4">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <RotateCw className="w-16 h-16 text-[#7DDE4A]" />
                        </motion.div>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Analyse en cours...</h3>
                      <p className="text-sm text-gray-600">
                        Extraction des informations du produit
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={reset}
                disabled={isAnalyzing}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <RotateCw className="w-5 h-5" />
                Changer d'image
              </button>

              <button
                onClick={analyzeImage}
                disabled={isAnalyzing}
                className="px-6 py-3 bg-[#7DDE4A] text-white rounded-lg font-medium hover:bg-[#6BC93B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <RotateCw className="w-5 h-5 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Analyser le produit
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* Erreur */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-4 bg-red-50 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Erreur</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info lÃ©gale */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            ðŸ”’ Vos photos sont analysÃ©es de maniÃ¨re sÃ©curisÃ©e et ne sont pas conservÃ©es sur nos serveurs
          </p>
        </div>
      </div>
    </div>
  );
};

export default PhotoCapture;
