# SCRIPT SIMPLE ECOLOJIA - SANS EMOJIS
# =====================================

param(
    [string]$Command = "all"
)

# Configuration
$FRONTEND_PATH = "C:\Users\salim\Desktop\ECOLOJIA VF CLEAN\frontend"
$API_URL = "https://ecolojia-backendvf.onrender.com/api"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "     ECOLOJIA - CORRECTION AUTO      " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# ETAPE 1: CORRIGER LE SCANNER
Write-Host "[1/3] CORRECTION DU SCANNER..." -ForegroundColor Yellow
Set-Location $FRONTEND_PATH

# Créer le nouveau scanner simple
$scannerContent = @'
import React, { useState } from 'react';
import { X, Camera, Keyboard } from 'lucide-react';
import { productService } from '../../services/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import './BarcodeScanner.css';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (result: any) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onScanSuccess }) => {
  const navigate = useNavigate();
  const [manualCode, setManualCode] = useState('');
  const [productName, setProductName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!manualCode && !productName) {
      toast.error('Entrez un code-barres ou un nom de produit');
      return;
    }
    setIsLoading(true);
    try {
      if (manualCode) {
        const result = await productService.getByBarcode(manualCode);
        if (result && result._id) {
          navigate(`/product/${result._id}`);
          onClose();
          return;
        }
      }
      const searchQuery = productName || manualCode;
      const searchResults = await productService.search(searchQuery);
      if (searchResults?.products?.length > 0) {
        navigate(`/product/${searchResults.products[0]._id}`);
        onClose();
      } else {
        toast.info('Produit non trouve');
      }
    } catch (error) {
      toast.error('Erreur lors de la recherche');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Recherche de produit</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ''))}
            placeholder="Code-barres (ex: 3017620422003)"
            className="w-full px-4 py-2 border rounded-lg"
          />
          <div className="text-center text-gray-500">OU</div>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Nom du produit"
            className="w-full px-4 py-2 border rounded-lg"
          />
          <button
            onClick={handleSearch}
            disabled={isLoading || (!manualCode && !productName)}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
          >
            {isLoading ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
'@

# Sauvegarder le fichier
$scannerContent | Out-File -FilePath "src\components\scanner\BarcodeScanner.tsx" -Encoding UTF8
Write-Host "  [OK] Scanner corrige" -ForegroundColor Green

# ETAPE 2: BUILD DE TEST
Write-Host ""
Write-Host "[2/3] TEST DU BUILD..." -ForegroundColor Yellow
npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Build reussi" -ForegroundColor Green
} else {
    Write-Host "  [ERREUR] Build echoue" -ForegroundColor Red
    exit 1
}

# ETAPE 3: DEPLOIEMENT
Write-Host ""
Write-Host "[3/3] DEPLOIEMENT..." -ForegroundColor Yellow

# Verifier s'il y a des changements
$status = git status --porcelain
if ($status) {
    git add -A
    git commit -m "fix: scanner simplifie avec recherche manuelle" | Out-Null
    git push origin main | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Deploye sur GitHub" -ForegroundColor Green
    } else {
        Write-Host "  [ERREUR] Push echoue" -ForegroundColor Red
    }
} else {
    Write-Host "  [INFO] Aucun changement a deployer" -ForegroundColor Gray
}

# RESUME
Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "         TERMINE AVEC SUCCES         " -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "URLS:" -ForegroundColor Cyan
Write-Host "  Frontend: https://frontendvf.netlify.app" -ForegroundColor White
Write-Host "  Scanner: https://frontendvf.netlify.app/scan" -ForegroundColor White
Write-Host ""
Write-Host "ATTENDEZ 3-5 MINUTES pour le deploiement Netlify" -ForegroundColor Yellow