import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services/api';
import BarcodeScanner from '../components/scanner/BarcodeScannerEnhanced';
import { useDeviceContext } from '../hooks/useDeviceContext';
import { ArrowLeft } from 'lucide-react';

const ScanBarcodePage: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile } = useDeviceContext();

  // Redirect desktop vers home
  useEffect(() => {
    if (!isMobile) {
      navigate('/', { replace: true });
    }
  }, [isMobile, navigate]);

  const handleBarcodeDetected = async (code: string) => {
    console.log('📷 [ScanBarcode] Code détecté:', code);

    try {
      const result = await productService.analyze({ barcode: code });
      
      const normalizedResult = result?.data?.product ? result.data : result;
      
      if (normalizedResult?.product?._id) {
        const category = normalizedResult.product?.domain || normalizedResult.product?.categoryType;
        
        let targetUrl = '';
        if (category === 'cosmetics' && normalizedResult.product?.barcode) {
          targetUrl = `/cosmetics/${normalizedResult.product.barcode}`;
        } else if (category === 'detergents' && normalizedResult.product?.barcode) {
          targetUrl = `/detergents/${normalizedResult.product.barcode}`;
        } else {
          targetUrl = `/product/${normalizedResult.product._id}`;
        }
        
        console.log('✅ [ScanBarcode] Navigation vers:', targetUrl);
        navigate(targetUrl);
      }
    } catch (err: any) {
      console.error('❌ [ScanBarcode] Erreur:', err);
      
      const errorMsg = err?.response?.data?.error || err?.message || '';
      const isNotFound = errorMsg.toLowerCase().includes('non trouvé') ||
                         errorMsg.toLowerCase().includes('not found') ||
                         err?.response?.status === 404;
      
      if (isNotFound) {
        navigate(`/ocr-wizard?barcode=${code}`);
      }
    }
  };

  // Mobile uniquement
  if (!isMobile) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Header minimal */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white"
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="text-sm font-medium">Retour</span>
        </button>
      </div>

      {/* Scanner plein écran */}
      <BarcodeScanner
        onDetected={handleBarcodeDetected}
        onCancel={() => navigate('/')}
      />

      {/* Instructions overlay */}
      <div className="absolute bottom-8 left-0 right-0 px-6 text-center">
        <div className="inline-block bg-black/50 backdrop-blur-sm text-white px-6 py-3 rounded-full">
          <p className="text-sm font-medium">Cadrez le code-barres</p>
        </div>
      </div>
    </div>
  );
};

export default ScanBarcodePage;
