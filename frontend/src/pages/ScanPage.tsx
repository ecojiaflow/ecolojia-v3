import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BarcodeScanner from "../components/scanner/BarcodeScanner";
import { useDeviceContext } from "../hooks/useDeviceContext";

export default function ScanPage() {
  const navigate = useNavigate();
  const { isMobile } = useDeviceContext();
  const [searchParams] = useSearchParams();
  const [showScanner, setShowScanner] = useState(false);

  // Auto-open si mode=camera
  useEffect(() => {
    if (searchParams.get('mode') === 'camera') {
      setShowScanner(true);
    }
  }, [searchParams]);

  const handleScanResult = async (result: any) => {
    if (result.barcode) {
      navigate(`/product/${result.barcode}`);
    }
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-green-600">
        <BarcodeScanner 
          isOpen={showScanner || searchParams.get('mode') === 'camera'} 
          onClose={() => navigate('/scan')} 
          onScanSuccess={handleScanResult}
          autoStartCamera={searchParams.get('mode') === 'camera'}
        />
        {!showScanner && (
          <div className="h-screen flex items-center justify-center">
            <button onClick={() => setShowScanner(true)} className="text-white text-2xl">
              📷 Scanner
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <button onClick={() => setShowScanner(true)} className="bg-green-600 text-white px-6 py-3 rounded-lg">
        Scanner
      </button>
      <BarcodeScanner isOpen={showScanner} onClose={() => setShowScanner(false)} onScanSuccess={handleScanResult} />
    </div>
  );
}
