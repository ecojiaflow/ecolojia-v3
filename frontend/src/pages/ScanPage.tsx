// PATH: frontend/src/pages/ScanPage.tsx
import { useState } from "react";
import BarcodeScanner from "../components/scanner/BarcodeScanner";
import PhotoCapture from "../components/scanner/PhotoCapture";
import ManualInput from "../components/scanner/ManualInput";
import analysisService from "../services/analysisService";
import { useNavigate } from "react-router-dom";
import type { AnalysisResult } from "../types/api";

type Mode = "barcode" | "photo" | "manual";

export default function ScanPage() {
  const [mode, setMode] = useState<Mode>("barcode");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  function goResult(result: AnalysisResult) {
    localStorage.setItem("lastAnalysis", JSON.stringify(result));
    navigate("/result", { state: { result } });
  }

  async function handleBarcode(code: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await analysisService.analyzeByBarcode(code);
      goResult(res);
    } catch (e: any) {
      setError(e?.message || "Analyse par code-barres impossible");
    } finally {
      setBusy(false);
    }
  }

  async function handleOcrDone(data: { ingredients: string[]; barcode?: string; text?: string }) {
    if (data.barcode) return handleBarcode(data.barcode);
    setMode("manual");
  }

  async function handleManual(payload: { name: string; category: string; ingredients: string[] }) {
    setBusy(true);
    setError(null);
    try {
      const res = await analysisService.analyzeManual(payload);
      goResult(res);
    } catch (e: any) {
      setError(e?.message || "Analyse manuelle impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-bold mb-4">Scanner un produit</h1>

      <div className="flex gap-2 mb-4">
        <button
          className={`px-3 py-2 rounded-lg ${mode === "barcode" ? "bg-emerald-600 text-white" : "bg-gray-200"}`}
          onClick={() => setMode("barcode")}
        >
          Code-barres
        </button>
        <button
          className={`px-3 py-2 rounded-lg ${mode === "photo" ? "bg-emerald-600 text-white" : "bg-gray-200"}`}
          onClick={() => setMode("photo")}
        >
          Photo (OCR)
        </button>
        <button
          className={`px-3 py-2 rounded-lg ${mode === "manual" ? "bg-emerald-600 text-white" : "bg-gray-200"}`}
          onClick={() => setMode("manual")}
        >
          Saisie manuelle
        </button>
      </div>

      {error && (
        <div className="mb-3 text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      {mode === "barcode" && (
        <BarcodeScanner onDetected={handleBarcode} onClose={() => setMode("manual")} onError={(e) => setError(e.message)} />
      )}
      {mode === "photo" && (
        <PhotoCapture onOcrDone={handleOcrDone} onClose={() => setMode("manual")} onError={(e) => setError(e.message)} />
      )}
      {mode === "manual" && <ManualInput onSubmit={handleManual} onClose={() => setMode("barcode")} />}

      {busy && <div className="mt-4 text-sm text-gray-600">Analyse en cours…</div>}
    </div>
  );
}
