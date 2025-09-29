import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BarcodeScanner from "../components/scanner/BarcodeScannerEnhanced";
import CategorySelector from "../components/CategorySelector";
import { productService } from "../services/api";
import { Loader2 } from "lucide-react";

const ScanPage: React.FC = () => {
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(true);
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<"food" | "cosmetics" | "detergents" | "auto">("auto");

  const persistAndGo = (result: any, code?: string) => {
    try { 
      sessionStorage.setItem("ecolojia:lastResult", JSON.stringify(result));
      sessionStorage.setItem("ecolojia:lastCategory", selectedCategory);
    } catch {}
    const q = code ? `?barcode=${encodeURIComponent(code)}` : "";
    navigate(`/results${q}`, {
      state: {
        product: result.product,
        scores: result.scores,
        insights: result.insights,
        dataSource: result.dataSource,
        category: selectedCategory
      },
    });
  };

  const handleBarcodeDetected = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log("🔍 Analyse du code:", code, "Catégorie:", selectedCategory);
      
      // UTILISER UNIQUEMENT LA ROUTE /analysis POUR TOUT
      const result = await productService.analyze({ 
        barcode: code, 
        category: selectedCategory === "auto" ? undefined : selectedCategory 
      });

      const normalizedResult = (result && (result as any).data && (result as any).data.product) 
        ? (result as any).data 
        : result;
        
      console.log("✅ Résultat API (normalisé):", normalizedResult);
      setShowScanner(false);
      persistAndGo(normalizedResult, code);

    } catch (err: any) {
      console.error("❌ Erreur:", err);
      setError(err?.response?.data?.error || err?.message || "Erreur lors de l'analyse. Réessayez.");
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    await handleBarcodeDetected(code);
  };

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
              defaultEngine="zxing"
              onDetected={handleBarcodeDetected}
              onCancel={() => setShowScanner(false)}
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

        {selectedCategory !== "auto" && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm">
            <strong>Catégorie sélectionnée :</strong> {
              selectedCategory === "food" ? "🍕 Alimentaire" :
              selectedCategory === "cosmetics" ? "💄 Cosmétiques" :
              "🧽 Détergents"
            }
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
        )}

        <div className="text-sm text-gray-600 mt-4">
          <p>💡 Conseil : Sélectionnez la catégorie appropriée pour une analyse plus précise.</p>
          <p>Le mode "Auto" tentera de détecter automatiquement le type de produit.</p>
        </div>
      </div>
    </div>
  );
};

export default ScanPage;