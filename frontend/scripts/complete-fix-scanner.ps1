# CORRECTION SCANNER ET DONNEES REELLES - VERSION SIMPLE
# ======================================================

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   CORRECTION SCANNER ECOLOJIA       " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$FRONTEND_PATH = "C:\Users\salim\Desktop\ECOLOJIA VF CLEAN\frontend"
Set-Location $FRONTEND_PATH

# 1. CREER LE SERVICE DE SAUVEGARDE
Write-Host "[1/3] CREATION SERVICE SAUVEGARDE..." -ForegroundColor Yellow

$saveService = @'
// PATH: frontend/src/services/productSaveService.ts
import { apiClient } from './api';

export const productSaveService = {
  async saveAnalyzedProduct(analysisResult: any, productData: any): Promise<any> {
    try {
      const productToSave = {
        barcode: productData.barcode || '',
        name: productData.name || 'Produit analyse',
        brand: productData.brand || '',
        category: productData.category || 'food',
        scores: {
          healthScore: analysisResult.healthScore || 50,
          environmentScore: analysisResult.environmentScore || 50
        },
        ingredients: productData.ingredients || '',
        images: productData.images || {},
        source: 'user_analysis',
        status: 'active'
      };
      const response = await apiClient.post('/products', productToSave);
      return response.data;
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      return null;
    }
  }
};
'@

$saveService | Out-File -FilePath ".\src\services\productSaveService.ts" -Encoding UTF8
Write-Host "  [OK] Service cree" -ForegroundColor Green

# 2. CREER LE CSS DU SCANNER
Write-Host ""
Write-Host "[2/3] CREATION CSS SCANNER..." -ForegroundColor Yellow

$scannerCSS = @'
/* PATH: frontend/src/components/scanner/BarcodeScanner.css */
.scanner-overlay {
  position: relative;
}

.scanner-frame {
  position: relative;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 0.8; }
  50% { opacity: 1; }
  100% { opacity: 0.8; }
}

.scanner-line {
  position: absolute;
  width: 100%;
  height: 2px;
  background: linear-gradient(to right, transparent, #10b981, transparent);
  top: 50%;
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { transform: translateY(-24px); }
  100% { transform: translateY(24px); }
}

.scanner-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
'@

$scannerCSS | Out-File -FilePath ".\src\components\scanner\BarcodeScanner.css" -Encoding UTF8
Write-Host "  [OK] CSS cree" -ForegroundColor Green

# 3. BUILD ET DEPLOY
Write-Host ""
Write-Host "[3/3] BUILD ET DEPLOIEMENT..." -ForegroundColor Yellow

# Build
npm run build 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Build reussi" -ForegroundColor Green
    
    # Git
    git add -A
    git commit -m "fix: add product save service and scanner CSS" | Out-Null
    git push origin main | Out-Null
    
    Write-Host "  [OK] Deploye sur GitHub" -ForegroundColor Green
}
else {
    Write-Host "  [ERREUR] Build echoue" -ForegroundColor Red
}

# INSTRUCTIONS FINALES
Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "        ETAPES SUIVANTES             " -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "POUR FINIR LA CORRECTION:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. DANS ResultsPage.tsx, AJOUTEZ EN HAUT:" -ForegroundColor Cyan
Write-Host "   import { productSaveService } from '../services/productSaveService';" -ForegroundColor White
Write-Host ""
Write-Host "2. DANS ResultsPage.tsx, AJOUTEZ CE useEffect:" -ForegroundColor Cyan
Write-Host @"
   useEffect(() => {
     if (location.state?.analysisData && !isSaved) {
       productSaveService.saveAnalyzedProduct(
         location.state.analysisData,
         { barcode: location.state.barcode, name: location.state.productName }
       ).then(() => setIsSaved(true));
     }
   }, []);
"@ -ForegroundColor White
Write-Host ""
Write-Host "3. CONSEILS POUR LE SCANNER:" -ForegroundColor Cyan
Write-Host "   - Bon eclairage" -ForegroundColor White
Write-Host "   - Distance 10-20 cm" -ForegroundColor White
Write-Host "   - Tenir stable" -ForegroundColor White
Write-Host "   - Code-barres net" -ForegroundColor White
Write-Host ""
Write-Host "URL: https://frontendvf.netlify.app/scan" -ForegroundColor Cyan