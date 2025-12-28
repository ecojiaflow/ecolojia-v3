import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BarcodeScanner from "../components/scanner/BarcodeScannerEnhanced";
import PhotoCapture from "../components/PhotoCapture";
import CategorySelector from "../components/CategorySelector";
import { productService } from "../services/api";
import { ScanService } from "../services/scanService";
import { Loader2, Camera, Barcode, AlertCircle } from "lucide-react";
import { useDeviceContext } from "../hooks/useDeviceContext";

type ScanMode = "barcode" | "photo";

// Interface erreur photo détaillée
interface PhotoAnalysisError {
  code: string;
  message: string;
  issues?: string[];
  instructions?: string[];
  disclaimer?: {
    type: string;
    severity: string;
    title: string;
    message: string;
  };
}

const ScanPage: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile } = useDeviceContext();
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<PhotoAnalysisError | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<"food" | "cosmetics" | "detergents" | "auto">("auto");
  const [scanMode, setScanMode] = useState<ScanMode>("barcode");
  const [showConstitution, setShowConstitution] = useState(false);
  const [constitutionData, setConstitutionData] = useState<any>(null);

  const scanService = ScanService.getInstance();

  const handleBarcodeDetected = async (code: string) => {
    console.log("🟢 [ScanPage] handleBarcodeDetected appelé avec code:", code);
    setLoading(true);
    setError(null);

    try {
      const result = await productService.analyze({
        barcode: code,
        category: selectedCategory === "auto" ? undefined : selectedCategory
      });

      const normalizedResult = (result && result.data && result.data.product)
        ? result.data
        : result;

      if (normalizedResult?.product?._id) {
        const detectedCategory = normalizedResult.product?.domain || selectedCategory;
        let targetUrl = "";

        if (detectedCategory === 'cosmetics' && normalizedResult.product?.barcode) {
          targetUrl = `/cosmetics/${normalizedResult.product.barcode}`;
        } else if (detectedCategory === 'detergents' && normalizedResult.product?.barcode) {
          targetUrl = `/detergents/${normalizedResult.product.barcode}`;
        } else {
          targetUrl = `/product/${normalizedResult.product._id}`;
        }

        console.log("🚀 [ScanPage] Navigation vers:", targetUrl);
        navigate(targetUrl);
      } else {
        setError("Produit trouvé mais ID manquant");
        setLoading(false);
      }

    } catch (err: any) {
      console.error("❌ [ScanPage] Erreur scan:", err);

      const errorMsg = err?.response?.data?.error || err?.message || "";
      const isNotFound = errorMsg.toLowerCase().includes("non trouvé") ||
                         errorMsg.toLowerCase().includes("not found") ||
                         err?.response?.status === 404;

      if (isNotFound) {
        const targetUrl = `/ocr-wizard?barcode=${code}`;
        navigate(targetUrl);
      } else {
        setError(errorMsg || "Erreur lors de l'analyse");
        setLoading(false);
      }
    }
  };

  // NOUVEAU : Gestion capture photo
  const handlePhotoCapture = async (file: File) => {
    console.log("📸 [ScanPage] Photo capturée:", file.name);
    setLoading(true);
    setError(null);
    setPhotoError(null); // Reset erreur détaillée

    try {
      const result = await scanService.analyzePhotoNew(file, selectedCategory);

      console.log("✅ [ScanPage] Résultat photo:", result);

      // Afficher Constitution si disponible
      if (result.constitution) {
        setConstitutionData({
          product: result.product,
          constitution: result.constitution,
          categoryDetection: result.categoryDetection,
          disclaimer: result.disclaimer,
          cached: result.cached,
          source: result.source
        });
        setShowConstitution(true);
        setLoading(false);
      } else {
        // Pas de Constitution → Navigation classique si produit trouvé
        if (result.product?._id) {
          navigate(`/product/${result.product._id}`);
        } else {
          setError("Analyse photo réussie mais produit incomplet");
          setLoading(false);
        }
      }

    } catch (err: any) {
      console.error("❌ [ScanPage] Erreur photo:", err);

      // Stocker erreur détaillée
      setPhotoError({
        code: err.code || 'UNKNOWN_ERROR',
        message: err.message || 'Erreur inconnue',
        issues: err.issues,
        instructions: err.instructions,
        disclaimer: err.disclaimer
      });

      // Message simple pour UI basique (fallback)
      setError(err.message || 'Erreur lors de l\'analyse de la photo');
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    await handleBarcodeDetected(code);
  };

  // Fermer Constitution
  const closeConstitution = () => {
    setShowConstitution(false);
    setConstitutionData(null);
  };

  // Composant ErrorDisplay détaillé
  const ErrorDisplay = () => {
    if (!photoError) return null;

    return (
      <div className="mt-4 rounded-lg border-2 border-red-500 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 mb-2">
              {photoError.message}
            </h3>

            {/* Issues détectés */}
            {photoError.issues && photoError.issues.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium text-red-800 mb-1">
                  Problèmes détectés :
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {photoError.issues.map((issue, idx) => (
                    <li key={idx} className="text-sm text-red-700">
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Instructions */}
            {photoError.instructions && photoError.instructions.length > 0 && (
              <div className="bg-white rounded p-3 border border-red-200">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  💡 Conseils :
                </p>
                <ul className="space-y-1">
                  {photoError.instructions.map((instruction, idx) => (
                    <li key={idx} className="text-sm text-gray-700">
                      • {instruction}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disclaimer médical si présent */}
            {photoError.disclaimer && (
              <div className="mt-3 bg-yellow-50 border border-yellow-300 rounded p-3">
                <p className="text-sm font-medium text-yellow-900 mb-1">
                  ⚠️ {photoError.disclaimer.title}
                </p>
                <p className="text-sm text-yellow-800">
                  {photoError.disclaimer.message}
                </p>
              </div>
            )}

            {/* Bouton réessayer */}
            <button
              onClick={() => {
                setPhotoError(null);
                setError(null);
              }}
              className="mt-3 w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Mobile : Plein écran scanner/photo
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-black">
        {scanMode === "barcode" ? (
          <BarcodeScanner
            key="barcode-scanner-mobile"
            onDetected={handleBarcodeDetected}
            onCancel={() => navigate('/')}
          />
        ) : (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-auto p-4">
              <PhotoCapture
                key="photo-capture-mobile"
                onCapture={handlePhotoCapture}
                onError={(err) => setError(err.message)}
                maxSize={10 * 1024 * 1024}
                acceptedFormats={['image/jpeg', 'image/png', 'image/webp']}
                allowCamera={true}
                allowUpload={true}
              />

              {/* Affichage erreur détaillée mobile */}
              <ErrorDisplay />
            </div>
            <div className="p-4 bg-white border-t">
              <button
                onClick={() => setScanMode("barcode")}
                className="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-xl font-medium"
              >
                Retour au scanner
              </button>
            </div>
          </div>
        )}

        {/* Toggle mode mobile */}
        <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-2 px-4">
          <button
            onClick={() => setScanMode("barcode")}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${
              scanMode === "barcode"
                ? "bg-white text-gray-900"
                : "bg-white/20 text-white"
            }`}
          >
            <Barcode className="w-5 h-5" />
          </button>
          <button
            onClick={() => setScanMode("photo")}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${
              scanMode === "photo"
                ? "bg-white text-gray-900"
                : "bg-white/20 text-white"
            }`}
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Desktop : Layout avec onglets
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Scanner un produit</h1>
          <CategorySelector
            value={selectedCategory}
            onChange={setSelectedCategory}
          />
        </div>

        {/* Onglets Mode */}
        <div className="flex gap-2 bg-white p-1 rounded-xl">
          <button
            onClick={() => setScanMode("barcode")}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              scanMode === "barcode"
                ? "bg-emerald-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Barcode className="w-5 h-5" />
            Scanner Code-Barre
          </button>
          <button
            onClick={() => setScanMode("photo")}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              scanMode === "photo"
                ? "bg-emerald-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Camera className="w-5 h-5" />
            Prendre Photo
          </button>
        </div>

        {/* Contenu selon mode */}
        <div className="bg-white rounded-xl p-4">
          {scanMode === "barcode" ? (
            <>
              <BarcodeScanner
                key="barcode-scanner-desktop"
                onDetected={handleBarcodeDetected}
                onCancel={() => {}}
              />

              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Saisie manuelle</h3>
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Ex: 3017620422003"
                    className="flex-1 px-4 py-2 border rounded-lg"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !manualCode.trim()}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analyse</span>
                      </div>
                    ) : (
                      "Analyser"
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <PhotoCapture
              key="photo-capture-desktop"
              onCapture={handlePhotoCapture}
              onError={(err) => setError(err.message)}
              maxSize={10 * 1024 * 1024}
              acceptedFormats={['image/jpeg', 'image/png', 'image/webp']}
              allowCamera={true}
              allowUpload={true}
            />
          )}
        </div>

        {/* Chargement */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Analyse en cours...</span>
          </div>
        )}

        {/* Affichage erreur détaillée desktop */}
        <ErrorDisplay />

        {/* Constitution Modal - 3 CARTES */}
        {showConstitution && constitutionData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  {constitutionData.cached ? '⚡ Produit connu' : '📸 Analysé par photo'}
                </h2>
                <button
                  onClick={closeConstitution}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Fermer
                </button>
              </div>

              {/* Disclaimer si présent */}
              {constitutionData.disclaimer && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">
                    {constitutionData.disclaimer.title}
                  </h3>
                  <p className="text-sm text-yellow-700">
                    {constitutionData.disclaimer.message}
                  </p>
                </div>
              )}

              {/* Produit */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">
                  {constitutionData.product?.name || 'Produit sans nom'}
                </h3>
                <p className="text-sm text-gray-600">
                  {constitutionData.product?.brand || 'Marque inconnue'}
                </p>
                {constitutionData.product?.scores?.overall && (
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-emerald-600">
                      {constitutionData.product.scores.overall}/100
                    </span>
                  </div>
                )}
              </div>

              {/* Constitution - 3 CARTES */}
              {constitutionData.constitution && (
                <div className="space-y-4">
                  {/* CARTE 1 : Ce que c'est vraiment */}
                  {constitutionData.constitution.whatIsIt && (
                    <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-4 border border-blue-100">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <span className="text-2xl">{constitutionData.constitution.whatIsIt.icon || '🧠'}</span>
                        {constitutionData.constitution.whatIsIt.title}
                      </h4>
                      <p className="text-sm text-gray-700">
                        {constitutionData.constitution.whatIsIt.content}
                      </p>
                    </div>
                  )}

                  {/* CARTE 2 : Le bon réflexe santé */}
                  {constitutionData.constitution.healthReflex && (
                    <div className="bg-gradient-to-br from-green-50 to-white rounded-lg p-4 border border-green-100">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <span className="text-2xl">{constitutionData.constitution.healthReflex.icon || '🌱'}</span>
                        {constitutionData.constitution.healthReflex.title}
                      </h4>
                      <p className="text-sm text-gray-700">
                        {constitutionData.constitution.healthReflex.content}
                      </p>
                    </div>
                  )}

                  {/* CARTE 3 : Actions possibles */}
                  {constitutionData.constitution.actions && (
                    <div className="bg-gradient-to-br from-purple-50 to-white rounded-lg p-4 border border-purple-100">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <span className="text-2xl">{constitutionData.constitution.actions.icon || '🔁'}</span>
                        {constitutionData.constitution.actions.title}
                      </h4>
                      <p className="text-sm text-gray-700 mb-3">
                        {constitutionData.constitution.actions.content}
                      </p>
                      {constitutionData.constitution.actions.items && (
                        <div className="space-y-2">
                          {constitutionData.constitution.actions.items.map((action: any, idx: number) => (
                            <button
                              key={idx}
                              className="w-full text-left p-2 bg-white rounded border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all text-sm"
                            >
                              <span className="mr-2">{action.icon}</span>
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Habitude associée (badge séparé) */}
                  {constitutionData.constitution.associatedHabit && (
                    <div className="bg-gradient-to-br from-yellow-50 to-white rounded-lg p-4 border-2 border-yellow-400">
                      <div className="text-center">
                        <div className="text-3xl mb-2">🏆</div>
                        <p className="text-sm font-medium text-yellow-800 mb-1">
                          Habitude associée
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {constitutionData.constitution.associatedHabit.title}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Métadonnées */}
              <div className="mt-6 pt-4 border-t text-xs text-gray-500">
                Source: {constitutionData.source === 'cache' ? 'Cache (produit connu)' : 'Analyse IA'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanPage;
