import React, { useState, useRef } from 'react';
import { Camera } from 'lucide-react';

interface PhotoCaptureProps {
  label: string;
  onCapture: (base64: string) => void;
  defaultImage?: string;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ 
  label, 
  onCapture, 
  defaultImage 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(defaultImage || null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📁 Fichier sélectionné:', file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Compression de l'image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Réduire la taille si trop grande
        const maxWidth = 800;
        const maxHeight = 600;
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.5); // Compression forte
        console.log('✅ Image compressée:', Math.round(base64.length / 1024), 'KB');
        setPreview(base64);
        onCapture(base64);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleButtonClick = () => {
    console.log('🎯 Clic bouton caméra - ouverture input file');
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    console.log('🔄 Reset photo');
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3 text-center border rounded-xl p-4 shadow-sm bg-white">
      <h3 className="font-semibold text-eco-text text-sm">{label}</h3>

      {preview ? (
        // Mode prévisualisation
        <div className="space-y-3">
          <img
            src={preview}
            alt="Photo"
            className="rounded-lg max-h-40 mx-auto object-cover border"
          />
          <button
            onClick={handleReset}
            className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
          >
            🔄 Reprendre la photo
          </button>
        </div>
      ) : (
        // Mode initial
        <div className="space-y-3">
          <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
            <Camera className="h-8 w-8 text-gray-400" />
          </div>
          
          {/* Input file caché */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Bouton qui déclenche l'input */}
          <button
            onClick={handleButtonClick}
            type="button"
            className="w-full py-2 px-4 border border-eco-leaf text-eco-leaf rounded-lg font-medium hover:bg-eco-leaf hover:text-white transition-colors flex items-center justify-center space-x-2"
          >
            <Camera className="h-4 w-4" />
            <span>📷 Prendre une photo</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PhotoCapture;