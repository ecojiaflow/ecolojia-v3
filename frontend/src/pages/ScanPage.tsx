import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BarcodeScanner from "../components/scanner/BarcodeScanner";
import { Camera, Keyboard, Upload } from "lucide-react";

export default function ScanPage() {
  const navigate = useNavigate();
  const [scanMethod, setScanMethod] = useState<"barcode" | "photo" | "manual">("barcode");
  const [showScanner, setShowScanner] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleScanResult = async (result: any) => {
    setIsProcessing(true);
    try {
      if (result.barcode) {
        navigate(`/product/${result.barcode}`, { 
          state: { productData: result.data, method: 'barcode' } 
        });
      } else if (result.data) {
        navigate('/results', { 
          state: { analysisData: result.data, method: scanMethod } 
        });
      }
    } catch (error) {
      console.error("Erreur traitement résultat:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualInput = (data: { barcode?: string; name?: string; brand?: string }) => {
    if (data.barcode) {
      handleScanResult({ barcode: data.barcode });
    } else {
      navigate('/search', { 
        state: { query: `${data.brand || ''} ${data.name || ''}`.trim() } 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Scanner un produit
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Choisissez une méthode</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                setScanMethod("barcode");
                setShowScanner(true);
              }}
              className={`flex flex-col items-center gap-2 py-6 px-4 border rounded-lg transition-colors ${
                scanMethod === "barcode" 
                  ? "bg-green-600 text-white border-green-600" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Camera className="w-8 h-8" />
              <span>Code-barres</span>
              <span className="text-xs opacity-75">Scanner ou photo</span>
            </button>

            <button
              onClick={() => setScanMethod("photo")}
              className={`flex flex-col items-center gap-2 py-6 px-4 border rounded-lg transition-colors ${
                scanMethod === "photo" 
                  ? "bg-green-600 text-white border-green-600" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Upload className="w-8 h-8" />
              <span>Photo produit</span>
              <span className="text-xs opacity-75">Analyse visuelle</span>
            </button>

            <button
              onClick={() => setScanMethod("manual")}
              className={`flex flex-col items-center gap-2 py-6 px-4 border rounded-lg transition-colors ${
                scanMethod === "manual" 
                  ? "bg-green-600 text-white border-green-600" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Keyboard className="w-8 h-8" />
              <span>Saisie manuelle</span>
              <span className="text-xs opacity-75">Nom ou code</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {isProcessing ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Analyse en cours...</p>
            </div>
          ) : (
            <div className="text-center py-8">
              {scanMethod === "manual" && (
                <div>
                  <input
                    type="text"
                    placeholder="Entrez le code-barres"
                    className="px-4 py-2 border rounded-lg mr-2"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const value = (e.target as HTMLInputElement).value;
                        if (value) handleManualInput({ barcode: value });
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                      if (input?.value) handleManualInput({ barcode: input.value });
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Valider
                  </button>
                </div>
              )}
              {scanMethod === "photo" && (
                <p className="text-gray-500">Upload photo à venir</p>
              )}
              {scanMethod === "barcode" && (
                <p className="text-gray-500">Cliquez sur un bouton ci-dessus</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">?? Conseils</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Le scanner fonctionne mieux avec un bon éclairage</li>
            <li>• Tenez le téléphone stable et le code-barres bien visible</li>
            <li>• Si le scan échoue, utilisez la saisie manuelle</li>
          </ul>
        </div>
      </div>

      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanSuccess={handleScanResult}
      />
    </div>
  );
}