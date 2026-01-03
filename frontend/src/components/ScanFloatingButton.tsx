import React, { useState } from 'react';
import { Camera, Search } from 'lucide-react';
import BarcodeScanner from './scanner/BarcodeScanner';
import { useNavigate } from 'react-router-dom';

interface ScanFloatingButtonProps {
  onScanResult?: (barcode: string, product: any) => void;
  className?: string;
}

const ScanFloatingButton: React.FC<ScanFloatingButtonProps> = ({
  onScanResult,
  className = ''
}) => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const handleScanSuccess = async (barcode: string) => {
    setIsSearching(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(apiUrl + '/api/products/scan/' + barcode);
      
      if (response.ok) {
        const product = await response.json();
        if (onScanResult) {
          onScanResult(barcode, product);
        } else {
          navigate('/product/' + (product.slug || product.id));
        }
      } else {
        await handleProductNotFound(barcode);
      }
    } catch (error) {
      console.error('Erreur recherche code-barres:', error);
      await handleProductNotFound(barcode);
    } finally {
      setIsSearching(false);
      setIsScannerOpen(false);
    }
  };

  const handleProductNotFound = async (barcode: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await fetch(apiUrl + '/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode,
          source: 'scanner_mobile',
          auto_enrich: true
        })
      });
      navigate('/scan/not-found?barcode=' + barcode);
    } catch (error) {
      console.error('Erreur enrichissement:', error);
      alert('Produit non trouve (' + barcode + ')\n\nCe produit sera ajoute prochainement.');
    }
  };

  return (
    <>
      {/* Version mobile - Bouton rond flottant */}
      <div className="md:hidden fixed bottom-20 right-4 z-40">
        <button
          onClick={() => setIsScannerOpen(true)}
          disabled={isSearching}
          aria-label="Scanner un produit"
          className={
            'w-14 h-14 rounded-full bg-[#16A34A] text-white shadow-lg flex items-center justify-center hover:bg-[#15803d] transition-all ' +
            (isSearching ? 'opacity-50 cursor-not-allowed' : '') + ' ' + className
          }
        >
          {isSearching ? (
            <Search className="h-6 w-6 animate-pulse" />
          ) : (
            <Camera className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Version desktop - Bouton avec texte */}
      <div className="hidden md:block fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsScannerOpen(true)}
          disabled={isSearching}
          className={
            'flex items-center gap-2 px-5 py-3 rounded-full bg-[#16A34A] text-white shadow-lg hover:bg-[#15803d] transition-all ' +
            (isSearching ? 'opacity-50 cursor-not-allowed' : '') + ' ' + className
          }
        >
          {isSearching ? (
            <>
              <Search className="h-5 w-5 animate-pulse" />
              <span>Recherche...</span>
            </>
          ) : (
            <>
              <Camera className="h-5 w-5" />
              <span>Scanner</span>
            </>
          )}
        </button>
      </div>

      {/* Composant Scanner */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(result: any) => {
          if (result?.barcode) {
            handleScanSuccess(result.barcode);
          } else if (typeof result === 'string') {
            handleScanSuccess(result);
          }
        }}
      />
    </>
  );
};

export default ScanFloatingButton;
