import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeviceContext } from '../hooks/useDeviceContext';
import PhotoCapture from '../components/PhotoCapture';
import { ScanService } from '../services/scanService';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

const ScanPhotoPage: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile } = useDeviceContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captureComplete, setCaptureComplete] = useState(false);
  const scanService = ScanService.getInstance();

  useEffect(() => {
    if (!isMobile) {
      navigate('/', { replace: true });
    }
  }, [isMobile, navigate]);

  const handlePhotoCapture = async (file: File) => {
    console.log('📸 [ScanPhoto] Photo reçue:', file.name, file.size, 'bytes');
    
    // Marquer capture terminée pour ne PAS revenir au bouton
    setCaptureComplete(true);
    setLoading(true);
    setError(null);

    try {
      const result = await scanService.analyzePhotoNew(file, 'auto');
      
      console.log('✅ [ScanPhoto] Résultat:', result);

      if (result.product?._id) {
        navigate(`/product/${result.product._id}`);
      } else if (result.product) {
        // Produit existe mais pas d'ID - navigation alternative
        console.warn('⚠️ Produit sans ID, navigation vers OCR wizard');
        navigate('/ocr-wizard');
      } else {
        throw new Error("Aucun produit trouvé dans la réponse");
      }
    } catch (err: any) {
      console.error('❌ [ScanPhoto] Erreur:', err);
      const errorMsg = err.response?.data?.error || err.message || "Erreur lors de l'analyse";
      setError(errorMsg);
      setLoading(false);
      // NE PAS réinitialiser captureComplete pour garder l'écran d'erreur
    }
  };

  const handleRetry = () => {
    setError(null);
    setLoading(false);
    setCaptureComplete(false);
  };

  if (!isMobile) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-700"
          disabled={loading}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Retour</span>
        </button>
        <h1 className="text-lg font-semibold">Analyser par photo</h1>
        <div className="w-16"></div>
      </div>

      {/* Instructions (uniquement si pas en cours d'analyse ET pas d'erreur) */}
      {!loading && !error && !captureComplete && (
        <div className="p-4 bg-blue-50 border-b border-blue-100">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 mt-0.5">💡</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Pour une meilleure analyse :
              </p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Cadrez l'étiquette des ingrédients</li>
                <li>• Assurez-vous que le texte est lisible</li>
                <li>• Évitez les reflets et le flou</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          // CHARGEMENT
          <div className="h-full flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-gray-600 font-medium">Analyse en cours...</p>
            <p className="text-sm text-gray-500 mt-2">Cela peut prendre 5-10 secondes</p>
          </div>
        ) : error ? (
          // ERREUR
          <div className="h-full flex flex-col items-center justify-center px-6">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-red-600 font-medium text-center mb-2">Erreur d'analyse</p>
            <p className="text-sm text-gray-600 text-center mb-6">{error}</p>
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-primary text-white rounded-xl font-medium active:scale-95 transition-transform"
            >
              Reprendre une photo
            </button>
          </div>
        ) : (
          // CAPTURE PHOTO (visible uniquement si pas loading/error)
          <PhotoCapture
            onCapture={handlePhotoCapture}
            onError={(err) => {
              console.error('❌ [PhotoCapture] Erreur:', err);
              setError(err.message);
            }}
            maxSize={10 * 1024 * 1024}
            acceptedFormats={['image/jpeg', 'image/png', 'image/webp']}
            allowCamera={true}
            allowUpload={true}
          />
        )}
      </div>
    </div>
  );
};

export default ScanPhotoPage;
