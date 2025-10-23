import React, { useState, useEffect } from 'react';
import { ArrowLeft, Camera, Check, AlertCircle, Loader2, Info, Edit3 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../services/apiClient';
import toast from 'react-hot-toast';

interface PhotoData {
  file: File | null;
  preview: string | null;
  captured: boolean;
}

interface OCRResult {
  frontData: {
    productName: string;
    brand: string;
    quantity: string;
    barcode: string;
  };
  ingredientsData: {
    ingredients: string[];
    nutritionalValues: Record<string, number>;
    allergens: string[];
  };
  rawTexts: {
    front: string;
    ingredients: string;
  };
  confidence: number;
  aiAnalysis: string;
  coherenceCheck?: {
    isCoherent: boolean;
    canProceed: boolean;
    incoherenceScore: number;
    detectedCategory: string;
    probableCategory: string;
    reason: string;
  };
}

type WizardStep = 'front' | 'ingredients' | 'validation';

export default function OCRWizardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const barcode = searchParams.get('barcode') || '';

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('front');
  const [frontPhoto, setFrontPhoto] = useState<PhotoData>({ file: null, preview: null, captured: false });
  const [ingredientsPhoto, setIngredientsPhoto] = useState<PhotoData>({ file: null, preview: null, captured: false });
  
  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Editable fields for validation step
  const [editableData, setEditableData] = useState<OCRResult['frontData'] & { ingredients: string }>({
    productName: '',
    brand: '',
    quantity: '',
    barcode: barcode,
    ingredients: ''
  });

  useEffect(() => {
    if (!barcode) {
      toast.error('Code-barre manquant');
      navigate('/scan');
    }
  }, [barcode, navigate]);

  // Photo capture handlers
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'ingredients') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image trop volumineuse (max 10MB)');
      return;
    }

    const preview = URL.createObjectURL(file);
    const photoData: PhotoData = { file, preview, captured: true };

    if (type === 'front') {
      setFrontPhoto(photoData);
    } else {
      setIngredientsPhoto(photoData);
    }

    toast.success('Photo capturée !');
  };

  const handleRetakePhoto = (type: 'front' | 'ingredients') => {
    if (type === 'front') {
      if (frontPhoto.preview) URL.revokeObjectURL(frontPhoto.preview);
      setFrontPhoto({ file: null, preview: null, captured: false });
    } else {
      if (ingredientsPhoto.preview) URL.revokeObjectURL(ingredientsPhoto.preview);
      setIngredientsPhoto({ file: null, preview: null, captured: false });
    }
  };

  // Step navigation
  const handleNextStep = () => {
    if (currentStep === 'front' && frontPhoto.captured) {
      setCurrentStep('ingredients');
    } else if (currentStep === 'ingredients' && ingredientsPhoto.captured) {
      handleAnalyzePhotos();
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'ingredients') {
      setCurrentStep('front');
    } else if (currentStep === 'validation') {
      setCurrentStep('ingredients');
    }
  };

  // OCR Analysis
  const handleAnalyzePhotos = async () => {
    if (!frontPhoto.file || !ingredientsPhoto.file) {
      toast.error('Les deux photos sont requises');
      return;
    }

    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('barcode', barcode);
      formData.append('frontPhoto', frontPhoto.file);
      formData.append('ingredientsPhoto', ingredientsPhoto.file);

      const response = await apiClient.post('/products/create-from-ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data && response.data.success && response.data.ocrResult) {
        console.log('[Wizard] Résultat OCR reçu:', response.data);
        setOcrResult(response.data.ocrResult);
        setEditableData({
          productName: response.data.ocrResult.frontData.productName,
          brand: response.data.ocrResult.frontData.brand,
          quantity: response.data.ocrResult.frontData.quantity,
          barcode: barcode,
          ingredients: response.data.ocrResult.ingredientsData.ingredients.join(', ')
        });
        setCurrentStep('validation');
        toast.success('Analyse terminée !');
      } else {
        throw new Error('Échec de l\'analyse OCR');
      }
    } catch (error: any) {
      console.error('Erreur analyse OCR:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'analyse');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save product
  const handleSaveProduct = async () => {
    if (!ocrResult) return;

    setIsSaving(true);

    try {
      const productData = {
        barcode: editableData.barcode,
        product_name: editableData.productName,
        brands: editableData.brand,
        quantity: editableData.quantity,
        ingredients_text: editableData.ingredients,
        source: 'ocr',
        confidence: ocrResult.confidence,
        ocrMetadata: {
          analyzedAt: new Date().toISOString(),
          rawTexts: ocrResult.rawTexts,
          aiAnalysis: ocrResult.aiAnalysis
        }
      };

      const response = await apiClient.post('/products/save-ocr-product', productData);

      if (response.success && response.product) {
        toast.success('Produit créé avec succès !');
        navigate(`/product/${response.product.code}`);
      } else {
        throw new Error('Échec de la sauvegarde');
      }
    } catch (error: any) {
      console.error('Erreur sauvegarde produit:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  // Cleanup previews
  useEffect(() => {
    return () => {
      if (frontPhoto.preview) URL.revokeObjectURL(frontPhoto.preview);
      if (ingredientsPhoto.preview) URL.revokeObjectURL(ingredientsPhoto.preview);
    };
  }, [frontPhoto.preview, ingredientsPhoto.preview]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Retour</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Wizard Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Camera className="text-blue-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Création produit par OCR</h1>
          <p className="text-gray-600">Code-barre : {barcode}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${currentStep === 'front' ? 'text-blue-600' : 'text-gray-500'}`}>
              Face avant
            </span>
            <span className={`text-sm font-medium ${currentStep === 'ingredients' ? 'text-blue-600' : 'text-gray-500'}`}>
              Ingrédients
            </span>
            <span className={`text-sm font-medium ${currentStep === 'validation' ? 'text-blue-600' : 'text-gray-500'}`}>
              Validation
            </span>
          </div>
          <div className="flex gap-2">
            <div className={`flex-1 h-2 rounded-full ${currentStep === 'front' || currentStep === 'ingredients' || currentStep === 'validation' ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-2 rounded-full ${currentStep === 'ingredients' || currentStep === 'validation' ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-2 rounded-full ${currentStep === 'validation' ? 'bg-blue-600' : 'bg-gray-200'}`} />
          </div>
        </div>

        {/* Step 1: Front Photo */}
        {currentStep === 'front' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-medium text-blue-900 mb-2">Étape 1/3 : Photo de face</h3>
                  <p className="text-blue-800 text-sm">
                    Prenez une photo claire de la <strong>face avant du produit</strong> (nom, marque, quantité visibles).
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              {!frontPhoto.captured ? (
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handlePhotoCapture(e, 'front')}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors">
                    <Camera className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600 font-medium mb-2">Capturer la face avant</p>
                    <p className="text-sm text-gray-500">Cliquez pour prendre une photo</p>
                  </div>
                </label>
              ) : (
                <div className="space-y-4">
                  <img
                    src={frontPhoto.preview!}
                    alt="Face avant"
                    className="w-full rounded-lg"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleRetakePhoto('front')}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      Reprendre
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
                    >
                      Suivant
                      <Check size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Ingredients Photo */}
        {currentStep === 'ingredients' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-medium text-blue-900 mb-2">Étape 2/3 : Photo des ingrédients</h3>
                  <p className="text-blue-800 text-sm">
                    Prenez une photo claire de la <strong>liste des ingrédients et du tableau nutritionnel</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              {!ingredientsPhoto.captured ? (
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handlePhotoCapture(e, 'ingredients')}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors">
                    <Camera className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600 font-medium mb-2">Capturer les ingrédients</p>
                    <p className="text-sm text-gray-500">Cliquez pour prendre une photo</p>
                  </div>
                </label>
              ) : (
                <div className="space-y-4">
                  <img
                    src={ingredientsPhoto.preview!}
                    alt="Ingrédients"
                    className="w-full rounded-lg"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handlePreviousStep}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => handleRetakePhoto('ingredients')}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      Reprendre
                    </button>
                    <button
                      onClick={handleNextStep}
                      disabled={isAnalyzing}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Analyse...
                        </>
                      ) : (
                        <>
                          Analyser
                          <Check size={20} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Validation */}
        {currentStep === 'validation' && ocrResult && (
          <div className="space-y-6">
            
            {/* Alerte incohérence */}
            {ocrResult?.coherenceCheck?.canProceed === false && (
              <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-900 mb-2">
                      ALERTE Incohérence détectée : {ocrResult.coherenceCheck.incoherenceScore}%
                    </h3>
                    <p className="text-red-800 mb-3">
                      Les photos ne correspondent pas au même produit.
                    </p>
                    <div className="bg-red-100 rounded p-3 text-sm text-red-900">
                      <p className="font-semibold mb-1">Détails :</p>
                      <p>Face avant : {ocrResult.coherenceCheck.detectedCategory}</p>
                      <p>Ingrédients : {ocrResult.coherenceCheck.probableCategory}</p>
                    </div>
                    <p className="mt-3 text-red-800 font-medium">
                      ERREUR Veuillez reprendre vos photos avec le bon produit.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className={`border rounded-lg p-4 ${ocrResult.confidence >= 0.75 ? 'bg-green-50 border-green-200' : ocrResult.confidence >= 0.6 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start gap-3">
                <AlertCircle className={`flex-shrink-0 mt-0.5 ${ocrResult.confidence >= 0.75 ? 'text-green-600' : ocrResult.confidence >= 0.6 ? 'text-yellow-600' : 'text-red-600'}`} size={20} />
                <div>
                  <h3 className={`font-medium mb-2 ${ocrResult.confidence >= 0.75 ? 'text-green-900' : ocrResult.confidence >= 0.6 ? 'text-yellow-900' : 'text-red-900'}`}>
                    Étape 3/3 : Validation des données - Fiabilité IA : {Math.round(ocrResult.confidence * 100)}%
                  </h3>
                  <p className={`text-sm ${ocrResult.confidence >= 0.75 ? 'text-green-800' : ocrResult.confidence >= 0.6 ? 'text-yellow-800' : 'text-red-800'}`}>
                    {ocrResult.confidence >= 0.75 
                      ? 'Données extraites avec haute confiance. Vérifiez et corrigez si nécessaire.'
                      : ocrResult.confidence >= 0.6
                      ? 'Confiance moyenne. Vérifiez attentivement les données avant de sauvegarder.'
                      : 'Confiance faible. Veuillez vérifier et corriger manuellement les données.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Edit3 size={20} className="text-blue-600" />
                Données extraites (modifiables)
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du produit *
                  </label>
                  <input
                    type="text"
                    value={editableData.productName}
                    onChange={(e) => setEditableData({ ...editableData, productName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Nutella"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marque
                    </label>
                    <input
                      type="text"
                      value={editableData.brand}
                      onChange={(e) => setEditableData({ ...editableData, brand: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Ferrero"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantité
                    </label>
                    <input
                      type="text"
                      value={editableData.quantity}
                      onChange={(e) => setEditableData({ ...editableData, quantity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 400g"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ingrédients *
                  </label>
                  <textarea
                    value={editableData.ingredients}
                    onChange={(e) => setEditableData({ ...editableData, ingredients: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Liste complète des ingrédients..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={handlePreviousStep}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Retour
                </button>
                <button
                  onClick={handleSaveProduct}
                  disabled={isSaving || !editableData.productName || !editableData.ingredients || ocrResult?.coherenceCheck?.canProceed === false}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      Créer le produit
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}