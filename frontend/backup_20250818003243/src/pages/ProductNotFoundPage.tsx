import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';
import PhotoCapture from '../components/PhotoCapture';
import * as realApi from '../api/realApi';

const ProductNotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { barcode: paramBarcode } = useParams<{ barcode: string }>();
  const [searchParams] = useSearchParams();
  
  // Recuperer le code-barres depuis l'URL parameter OU query parameter
  const barcode = paramBarcode || searchParams.get('barcode') || '';
  
  const [photos, setPhotos] = useState<{
    front: string | null;
    ingredients: string | null;
    nutrition: string | null;
  }>({
    front: null,
    ingredients: null,
    nutrition: null
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug pour verifier le code-barres au chargement
  console.log('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚ÂÆ’Ã¢â‚¬Å¡â€šÃ‚Â ProductNotFoundPage Debug:');
  console.log('  - paramBarcode:', paramBarcode);
  console.log('  - searchParams barcode:', searchParams.get('barcode'));
  console.log('  - barcode final:', barcode);
  console.log('  - URL complete:', window.location.href);

  const handlePhotoCapture = (photoType: 'front' | 'ingredients' | 'nutrition') => {
    return (base64: string) => {
      setPhotos(prev => ({
        ...prev,
        [photoType]: base64
      }));
    };
  };

  const handleAnalyze = async () => {
    if (!photos.front || !photos.ingredients || !photos.nutrition) {
      setError('Veuillez capturer les 3 photos avant de continuer.');
      return;
    }

    // Validation stricte du code-barres
    const barcodeToSend = barcode.trim();
    console.log('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€¦Ã¢â‚¬Å“Æ’Ã¢â‚¬Å¡â€šÃ‚Â¦ Code-barres Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  envoyer:', `"${barcodeToSend}"`);
    console.log('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€¦Ã¢â‚¬Å“Æ’Ã¢â‚¬Å¡â€šÃ‚Â Longueur code-barres:', barcodeToSend.length);

    if (!barcodeToSend || barcodeToSend === '') {
      setError('Code-barres manquant. Veuillez scanner le produit Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  nouveau.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      console.log('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚ÂaaÃ¢â‚¬Å¡Ã‚Â¬â€¦Ã‚Â¾ Envoi photos pour analyse I?...');
      console.log('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€¦Ã¢â‚¬Å“Æ’Ã¢â‚¬Â¦â€šÃ‚Â  Donnees completes:', {
        barcode: barcodeToSend,
        barcodeLength: barcodeToSend.length,
        photosCount: 3,
        frontSize: photos.front.length,
        ingredientsSize: photos.ingredients.length,
        nutritionSize: photos.nutrition.length
      });
      
      const response = await realApi.analyzePhotos({
        barcode: barcodeToSend,
        photos: {
          front: photos.front,
          ingredients: photos.ingredients,
          nutrition: photos.nutrition
        }
      });

      console.log('aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ Analyse terminee:', response);
      
      if (response.success) {
        // Gestion des differents formats de reponse backend
        let redirectPath = '';
        
        if (response.product && response.product.slug) {
          // Format attendu : { product: { slug: "..." } }
          redirectPath = `/product/${response.product.slug}`;
        } else if (response.redirect_url) {
          // Format actuel backend : { redirect_url: "/product/..." }
          redirectPath = response.redirect_url;
        } else if (response.productSlug) {
          // Format alternatif : { productSlug: "..." }
          redirectPath = `/product/${response.productSlug}`;
        }
        
        if (redirectPath) {
          console.log('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Â¦â€šÃ‚Â½Æ’Ã¢â‚¬Å¡â€šÃ‚Â¯ Redirection vers:', redirectPath);
          navigate(redirectPath);
        } else {
          console.error('aÆ’Ã¢â‚¬Å¡â€šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢ Aucune URL de redirection trouvee dans:', response);
          setError('Produit cree mais impossible de le trouver. Rechargez la page.');
        }
      } else {
        const errorMsg = response.error || response.message || 'Erreur lors de l\'analyse. Reessayez.';
        console.error('aÆ’Ã¢â‚¬Å¡â€šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢ Erreur backend:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('aÆ’Ã¢â‚¬Å¡â€šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢ Erreur analyse (catch):', err);
      setError('Impossible d\'analyser les photos. Verifiez votre connexion.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const allPhotosReady = photos.front && photos.ingredients && photos.nutrition;
  const barcodeValid = barcode && barcode.trim().length > 0;

  return (
    <div className="min-h-screen bg-eco-bg">
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-eco-text">
                Produit non trouve
              </h1>
              <p className="text-sm text-gray-600">
                Code-barres: {barcode || 'Non defini'}
              </p>
              {barcodeValid && (
                <p className="text-xs text-green-600 mt-1">
                  aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ Code-barres detecte ({barcode.length} caracteres)
                </p>
              )}
              {!barcodeValid && (
                <p className="text-xs text-red-600 mt-1">
                  aÆ’Ã¢â‚¬Â¦â€šÃ‚Â¡Æ’Ã¢â‚¬Å¡â€šÃ‚Â Æ’Ã‚Â¯Æ’Ã¢â‚¬Å¡â€šÃ‚Â¸Æ’Ã¢â‚¬Å¡â€šÃ‚Â Code-barres manquant - Retournez scanner le produit
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="h-8 w-8 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-eco-text mb-2">
              Aidez-nous Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  enrichir notre base !
            </h2>
            <p className="text-gray-600">
              Prenez 3 photos du produit et notre IA l'analysera automatiquement
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-center">{error}</p>
            </div>
          )}

          {!barcodeValid && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="text-center">
                <p className="text-orange-700 font-medium mb-2">Code-barres requis</p>
                <p className="text-orange-600 text-sm mb-3">
                  Pour analyser un produit, nous avons besoin de son code-barres
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700"
                >
                  Retourner au scanner
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <PhotoCapture
              label="Face avant du produit"
              onCapture={handlePhotoCapture('front')}
              defaultImage={photos.front || undefined}
            />
            
            <PhotoCapture
              label="Liste des ingredients"
              onCapture={handlePhotoCapture('ingredients')}
              defaultImage={photos.ingredients || undefined}
            />
            
            <PhotoCapture
              label="Informations nutritionnelles"
              onCapture={handlePhotoCapture('nutrition')}
              defaultImage={photos.nutrition || undefined}
            />
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Progression</span>
              <span className="text-sm text-eco-secondary">
                {Object.values(photos).filter(Boolean).length}/3 photos
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-eco-secondary h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(Object.values(photos).filter(Boolean).length / 3) * 100}%` 
                }}
              />
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!allPhotosReady || isAnalyzing || !barcodeValid}
            className={`w-full py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 ${
              allPhotosReady && !isAnalyzing && barcodeValid
                ? 'bg-eco-leaf text-white hover:bg-eco-leaf/90'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Analyse en cours...</span>
              </>
            ) : !barcodeValid ? (
              <>
                <span>aÆ’Ã¢â‚¬Å¡â€šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢ Code-barres requis</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span>
                  {allPhotosReady 
                    ? 'Analyser avec l\'IA' 
                    : `Capturer ${3 - Object.values(photos).filter(Boolean).length} photo(s) restante(s)`
                  }
                </span>
              </>
            )}
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">
            Comment fonctionne notre IA ?
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>aaÃ¢â‚¬Å¡Ã‚Â¬Æ’Ã¢â‚¬Å¡â€šÃ‚Â¢ Extraction automatique du nom et de la marque</li>
            <li>aaÃ¢â‚¬Å¡Ã‚Â¬Æ’Ã¢â‚¬Å¡â€šÃ‚Â¢ Reconnaissance OCR des ingredients</li>
            <li>aaÃ¢â‚¬Å¡Ã‚Â¬Æ’Ã¢â‚¬Å¡â€šÃ‚Â¢ Calcul du score ecologique (0-100%)</li>
            <li>aaÃ¢â‚¬Å¡Ã‚Â¬Æ’Ã¢â‚¬Å¡â€šÃ‚Â¢ Creation automatique de la fiche produit</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProductNotFoundPage;


