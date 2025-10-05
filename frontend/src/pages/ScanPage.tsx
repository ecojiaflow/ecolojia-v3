import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BarcodeScanner from "../components/scanner/BarcodeScanner";
import { Camera, Keyboard, Upload, Info } from "lucide-react";
import { useDeviceContext } from "../hooks/useDeviceContext";

export default function ScanPage() {
  const navigate = useNavigate();
  const { isMobile } = useDeviceContext();
  const [showScanner, setShowScanner] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleScanResult = async (result: any) => {
    setIsProcessing(true);
    try {
      if (result.barcode) {
        navigate(`/product/${result.barcode}`);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Mobile: Scan fullscreen dominant
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-green-600 to-green-800 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-8">
          <button
            onClick={() => setShowScanner(true)}
            className="flex flex-col items-center gap-6 text-white"
          >
            <div className="w-40 h-40 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Camera className="w-20 h-20" />
            </div>
            <span className="text-3xl font-bold">Scanner un produit</span>
          </button>
        </div>
        
        <div className="p-6 bg-white bg-opacity-10 backdrop-blur-md">
          <button
            onClick={() => navigate('/search')}
            className="w-full py-4 text-white border-2 border-white rounded-xl font-semibold"
          >
            <Keyboard className="w-5 h-5 inline mr-2" />
            Rechercher par nom
          </button>
        </div>

        <BarcodeScanner isOpen={showScanner} onClose={() => setShowScanner(false)} onScanSuccess={handleScanResult} />
      </div>
    );
  }

  // Desktop: Recherche dominante
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Scanner un produit</h1>
        
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="grid grid-cols-3 gap-6">
            <button onClick={() => navigate('/search')} className="flex flex-col items-center gap-4 py-8 px-6 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all">
              <Upload className="w-12 h-12" />
              <span className="font-semibold text-lg">Recherche</span>
            </button>
            
            <button onClick={() => setShowScanner(true)} className="flex flex-col items-center gap-4 py-8 px-6 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all">
              <Camera className="w-12 h-12 text-gray-700" />
              <span className="font-semibold text-lg text-gray-700">Scanner</span>
            </button>
            
            <button onClick={() => navigate('/ocr')} className="flex flex-col items-center gap-4 py-8 px-6 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all">
              <Keyboard className="w-12 h-12 text-gray-700" />
              <span className="font-semibold text-lg text-gray-700">Photo</span>
            </button>
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Info className="w-5 h-5" />
            Conseils de scan
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Assurez-vous d'avoir un bon éclairage</li>
            <li>• Tenez le code-barres bien visible</li>
            <li>• Utilisez la recherche si le scan échoue</li>
          </ul>
        </div>
      </div>

      <BarcodeScanner isOpen={showScanner} onClose={() => setShowScanner(false)} onScanSuccess={handleScanResult} />
    </div>
  );
}
