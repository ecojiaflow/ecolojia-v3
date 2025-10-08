import React, { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OCRGuideProps {
  onComplete: (photos: { front: string; ingredients: string; barcode?: string }) => void;
  onCancel: () => void;
}

export const OCRGuide: React.FC<OCRGuideProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [photos, setPhotos] = useState<{
    front?: string;
    ingredients?: string;
    barcode?: string;
  }>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    { num: 1, title: 'Face avant', desc: 'Photo du produit avec nom et marque visible', key: 'front' },
    { num: 2, title: 'Liste ingrédients', desc: 'Photo nette de la composition', key: 'ingredients' },
    { num: 3, title: 'Code-barres (optionnel)', desc: 'Si visible, pour identification', key: 'barcode' }
  ];

  const handlePhotoCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const currentKey = steps[step - 1].key as keyof typeof photos;
        
        setPhotos(prev => ({ ...prev, [currentKey]: base64 }));
        setIsProcessing(false);

        // Passer à l'étape suivante ou terminer
        if (step < 3) {
          setStep((step + 1) as 1 | 2 | 3);
        } else {
          onComplete({
            front: photos.front || base64,
            ingredients: photos.ingredients || '',
            barcode: photos.barcode
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsProcessing(false);
      console.error('Erreur capture photo:', error);
    }
  };

  const triggerCamera = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6">
        {/* Progression */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step > s.num ? 'bg-green-500 text-white' :
                step === s.num ? 'bg-blue-500 text-white' :
                'bg-gray-200 text-gray-500'
              }`}>
                {step > s.num ? <CheckCircle className="w-6 h-6" /> : s.num}
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-12 h-1 mx-2 ${step > s.num ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Étape actuelle */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold mb-2">{steps[step - 1].title}</h3>
          <p className="text-gray-600">{steps[step - 1].desc}</p>
        </div>

        {/* Preview photo */}
        {photos[steps[step - 1].key as keyof typeof photos] && (
          <div className="mb-4 border rounded-lg overflow-hidden">
            <img
              src={photos[steps[step - 1].key as keyof typeof photos]}
              alt="Preview"
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* Boutons */}
        <div className="space-y-3">
          <button
            onClick={triggerCamera}
            disabled={isProcessing}
            className="w-full bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 disabled:bg-gray-400"
          >
            <Camera className="w-5 h-5" />
            {isProcessing ? 'Traitement...' : `Prendre photo ${step}/3`}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoCapture}
            className="hidden"
          />

          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
              >
                Retour
              </button>
            )}
            <button
              onClick={onCancel}
              className="flex-1 border border-red-300 text-red-600 py-2 rounded-lg hover:bg-red-50"
            >
              Annuler
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
          💡 <strong>Astuce :</strong> Prenez des photos nettes en bon éclairage pour une meilleure analyse.
        </div>
      </div>
    </div>
  );
};
