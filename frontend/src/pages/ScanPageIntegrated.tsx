import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BarcodeScanner from "../components/scanner/BarcodeScannerEnhanced";
import CategorySelector from "../components/CategorySelector";
import { productService } from "../services/api";
import { Loader2 } from "lucide-react";
import { useDeviceContext } from "../hooks/useDeviceContext";

const ScanPage: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile } = useDeviceContext();
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<"food" | "cosmetics" | "detergents" | "auto">("auto");

  const handleBarcodeDetected = async (code: string) => {
    console.log("🟢 [ScanPage] handleBarcodeDetected appelé avec code:", code);
    console.log("🟢 [ScanPage] Type de code:", typeof code);
    console.log("🟢 [ScanPage] Longueur:", code?.length);
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("🟢 [ScanPage] Appel API productService.analyze...");
      console.log("🟢 [ScanPage] Catégorie sélectionnée:", selectedCategory);
      
      const result = await productService.analyze({
        barcode: code,
        category: selectedCategory === "auto" ? undefined : selectedCategory
      });

      console.log("🟢 [ScanPage] Réponse API reçue:", result);
      console.log("🟢 [ScanPage] result.data:", result?.data);
      console.log("🟢 [ScanPage] result.data.product:", result?.data?.product);

      const normalizedResult = (result && result.data && result.data.product)
        ? result.data
        : result;

      console.log("🟢 [ScanPage] normalizedResult:", normalizedResult);
      console.log("🟢 [ScanPage] Product ID:", normalizedResult?.product?._id);

      if (normalizedResult?.product?._id) {
        const detectedCategory = normalizedResult.product?.domain || selectedCategory;
        console.log("🟢 [ScanPage] Catégorie détectée:", detectedCategory);
        console.log("🟢 [ScanPage] Barcode produit:", normalizedResult.product?.barcode);

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
        console.log("✅ [ScanPage] Navigation déclenchée");
      } else {
        console.log("❌ [ScanPage] Produit trouvé mais ID manquant");
        setError("Produit trouvé mais ID manquant");
        setLoading(false);
      }

    } catch (err: any) {
      console.error("❌ [ScanPage] Erreur scan:", err);
      console.log("❌ [ScanPage] err.response:", err?.response);
      console.log("❌ [ScanPage] err.response.data:", err?.response?.data);
      console.log("❌ [ScanPage] err.response.status:", err?.response?.status);
      console.log("❌ [ScanPage] err.message:", err?.message);

      const errorMsg = err?.response?.data?.error || err?.message || "";
      const isNotFound = errorMsg.toLowerCase().includes("non trouvé") ||
                         errorMsg.toLowerCase().includes("not found") ||
                         err?.response?.status === 404;

      console.log("🔍 [ScanPage] errorMsg:", errorMsg);
      console.log("🔍 [ScanPage] isNotFound:", isNotFound);

      if (isNotFound) {
        const targetUrl = `/ocr-wizard?barcode=${code}`;
        console.log("🔄 [ScanPage] Produit non trouvé → Redirection vers:", targetUrl);
        navigate(targetUrl);
        console.log("✅ [ScanPage] Redirection OCR déclenchée");
      } else {
        console.log("❌ [ScanPage] Erreur non-404, affichage message");
        setError(errorMsg || "Erreur lors de l'analyse");
        setLoading(false);
      }
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🟢 [ScanPage] Soumission manuelle");
    const code = manualCode.trim();
    if (!code) return;
    await handleBarcodeDetected(code);
  };

  console.log("🟢 [ScanPage] Render - isMobile:", isMobile);

  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-black">
        <BarcodeScanner
          onDetected={handleBarcodeDetected}
          onCancel={() => navigate('/')}
        />
      </div>
    );
  }

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

        <div className="mb-4">
          <BarcodeScanner
            onDetected={handleBarcodeDetected}
            onCancel={() => {}}
          />
        </div>

        <div className="bg-white rounded-xl p-4">
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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanPage;
