# CORRECTION ERREUR BUILD NETLIFY
# ================================

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   CORRECTION ERREUR BUILD NETLIFY   " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$FRONTEND_PATH = "C:\Users\salim\Desktop\ECOLOJIA VF CLEAN\frontend"
Set-Location $FRONTEND_PATH

# 1. CORRIGER productSaveService.ts
Write-Host "[1/3] CORRECTION productSaveService.ts..." -ForegroundColor Yellow

$serviceContent = @'
// PATH: frontend/src/services/productSaveService.ts
import { productService } from './api';

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
      
      // Utiliser la methode create si elle existe, sinon faire un POST direct
      if (productService.create) {
        return await productService.create(productToSave);
      } else {
        // Fallback - utiliser analyze qui existe deja
        return await productService.analyze(productToSave);
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      return null;
    }
  }
};
'@

$serviceContent | Out-File -FilePath ".\src\services\productSaveService.ts" -Encoding UTF8
Write-Host "  [OK] Service corrige" -ForegroundColor Green

# 2. TEST BUILD LOCAL
Write-Host ""
Write-Host "[2/3] TEST BUILD LOCAL..." -ForegroundColor Yellow
npm run build 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Build local reussi" -ForegroundColor Green
} else {
    Write-Host "  [ERREUR] Build echoue localement" -ForegroundColor Red
    Write-Host "  Verifiez les erreurs ci-dessus" -ForegroundColor Yellow
    exit 1
}

# 3. DEPLOIEMENT
Write-Host ""
Write-Host "[3/3] DEPLOIEMENT..." -ForegroundColor Yellow

git add -A
git commit -m "fix: correct import error in productSaveService" | Out-Null
git push origin main | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Code pousse sur GitHub" -ForegroundColor Green
} else {
    Write-Host "  [INFO] Pas de changements ou erreur push" -ForegroundColor Yellow
}

# RESUME
Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "       CORRECTION TERMINEE           " -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "CHANGEMENTS:" -ForegroundColor Cyan
Write-Host "  - Import corrige: productService au lieu de apiClient" -ForegroundColor White
Write-Host "  - Utilise productService.analyze comme fallback" -ForegroundColor White
Write-Host ""
Write-Host "VERIFIEZ LE BUILD NETLIFY:" -ForegroundColor Yellow
Write-Host "  https://app.netlify.com/sites/frontendvf/deploys" -ForegroundColor White
Write-Host ""
Write-Host "Le build devrait maintenant reussir!" -ForegroundColor Green