import React from 'react';
import { useNavigate } from 'react-router-dom';

interface UnknownProductModalProps {
  isOpen: boolean;
  barcode: string;
  onClose: () => void;
}

export const UnknownProductModal: React.FC<UnknownProductModalProps> = ({
  isOpen,
  barcode,
  onClose
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleOCRAnalysis = () => {
    navigate('/ocr', { state: { barcode } });
  };

  const handleManualSearch = () => {
    navigate('/search');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Produit non trouve
          </h2>
          <p className="text-gray-600 mb-2">
            Code-barre : <span className="font-mono font-semibold">{barcode}</span>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Ce produit n'est pas encore dans notre base de donnees
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleOCRAnalysis}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            <span className="text-2xl">📷</span>
            <span>Analyser avec IA</span>
          </button>

          <button
            onClick={handleManualSearch}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            <span className="text-2xl">🔍</span>
            <span>Rechercher manuellement</span>
          </button>

          <button
            onClick={onClose}
            className="w-full text-gray-500 hover:text-gray-700 font-medium py-2"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};
