import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BarcodeScanner from "../components/scanner/BarcodeScanner";
import CategorySelector from "../components/CategorySelector";
import { productService } from "../services/api";
import { Loader2 } from "lucide-react";
import { useDeviceContext } from "../hooks/useDeviceContext";

const ScanPage: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile } = useDeviceContext();
  const [showScanner, setShowScanner] = useState(true);
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<"food" | "cosmetics" | "detergents" | "auto">("auto");

  const handleScanSuccess = async (result: any) => {
    if (result?.barcode) {
      await handleBarcodeDetected(result.barcode);
    }
  };

  const handleBarcodeDetected = async (code: string) => {
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

      // Navigate vers ProductPage avec l'ID produit (scoring complet)
      if (normalizedResult?.product?._id) {
        navigate(`/product/${normalizedResult.product._id}`);
      } else {
        setError("Produit trouvé mais ID manquant");
        setLoading(false);
      }

    } catch (err: any) {
      console.error("Erreur:", err);
      setError(err?.response?.data?.error || err?.message || "Erreur lors de l'analyse");
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    await handleBarcodeDetected(code);
  };

  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-gray-900">
        <BarcodeScanner
          isOpen={showScanner}
          onClose={() => navigate('/')}
          onScanSuccess={handleScanSuccess}
          autoStartCamera={true}
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

        {showScanner && (
          <div className="mb-4">
            <BarcodeScanner
              isOpen={showScanner}
              onClose={() => setShowScanner(false)}
              onScanSuccess={handleScanSuccess}
            />
          </div>
        )}

        <div className="bg-white rounded-xl p-4">
          <h3 className="text-sm font-medium mb-2">Saisie manuelle du code-barres</h3>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ex: 3017620422003"
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !manualCode.trim()}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Analyse…</>) : "Analyser"}
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
        )}
      </div>
    </div>
  );
};

export default ScanPage;
