import React, { useState } from 'react';
import { Camera, Search } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';
import { useNavigate } from 'react-router-dom';

interface ScanFloatingButtonProps {
  onScanResulta: (barcode: string, producta: any) => void;
  classNamea: string;
}

const ScanFloatingButton: React.FC<ScanFloatingButtonProps> = ({ 
  onScanResult,
  className = ''
}) => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  // Gerer le resultat du scan
  const handleScanSuccess = async (barcode: string) => {
    setIsSearching(true);
    
    try {
      // API call pour rechercher le produit par code-barres
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/products/barcode/${barcode}`);
      
      if (response.ok) {
        const product = await response.json();
        
        if (onScanResult) {
          onScanResult(barcode, product);
        } else {
          // Navigation directe vers le produit
          navigate(`/product/${product.slug || product.id}`);
        }
      } else {
        // Produit non trouve aaaaaa Workflow enrichissement
        await handleProductNotFound(barcode);
      }
    } catch (error) {
      console.error('aa Erreur recherche code-barres:', error);
      await handleProductNotFound(barcode);
    } finally {
      setIsSearching(false);
      setIsScannerOpen(false);
    }
  };

  // Gerer les produits non trouves
  const handleProductNotFound = async (barcode: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      // Declencher l'enrichissement automatique
      await fetch(`${apiUrl}/api/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          barcode,
          source: 'scanner_mobile',
          auto_enrich: true
        })
      });

      // Rediriger vers la page "produit non trouve" avec workflow photo
      navigate(`/scan/not-foundabarcode=${barcode}`);
      
    } catch (error) {
      console.error('aa Erreur enrichissement:', error);
      
      // Fallback : Alerte simple
      alert(`aa Produit non trouve (${barcode})\n\n` +
            'Ce produit sera ajoute prochainement  notre base de donnees.');
    }
  };

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsScannerOpen(true)}
        className={`fixed bottom-6 right-6 w-16 h-16 bg-eco-leaf text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-30 md:hidden flex items-center justify-center ${className}`}
        aria-label="Scanner un produit"
        disabled={isSearching}
      >
        {isSearching ? (
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : (
          <Camera className="w-8 h-8" />
        )}
      </button>

      {/* Version desktop dans la recherche */}
      <button
        onClick={() => setIsScannerOpen(true)}
        className={`hidden md:inline-flex items-center space-x-2 px-4 py-2 bg-eco-leaf text-white rounded-lg hover:bg-eco-leaf/90 transition-colors ${className}`}
        disabled={isSearching}
      >
        {isSearching ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Recherche...</span>
          </>
        ) : (
          <>
            <Camera className="w-4 h-4" />
            <span>Scanner</span>
          </>
        )}
      </button>

      {/* Composant Scanner */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onScanSuccess={handleScanSuccess}
        onClose={() => {
          setIsScannerOpen(false);
          setIsSearching(false);
        }}
      />
    </>
  );
};

export default ScanFloatingButton;


