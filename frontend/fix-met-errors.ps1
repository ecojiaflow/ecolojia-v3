Write-Host "CORRECTION GLOBALE DES ERREURS import.met" -ForegroundColor Cyan

$files = @(
    ".\src\api\realApi.ts",
    ".\src\auth\components\LoginForm.tsx",
    ".\src\auth\components\RegisterForm.tsx",
    ".\src\components\AffiliateButton.tsx",
    ".\src\components\ErrorBoundary.tsx",
    ".\src\components\PartnerLinks.tsx",
    ".\src\components\ProductCard.tsx",
    ".\src\components\ScanFloatingButton.tsx",
    ".\src\config\constants.ts",
    ".\src\dev\devTools.ts",
    ".\src\hooks\useProductCache.ts",
    ".\src\hooks\useSEO.ts",
    ".\src\hooks\useSimilarProducts.ts",
    ".\src\lib\algolia.ts",
    ".\src\pages\Auth\LoginPage.tsx",
    ".\src\pages\ProductPage.tsx",
    ".\src\services\ai\DeepSeekECOLOJIAService.ts",
    ".\src\services\ai\ultraTransformService.ts",
    ".\src\services\algolia\client.ts",
    ".\src\services\adminApi.ts",
    ".\src\services\aiAnalysisService.ts",
    ".\src\services\cloudinaryService.ts",
    ".\src\utils\performance.ts"
)

$totalFixed = 0

foreach ($file in $files) {
    if (Test-Path $file) {
        try {
            $content = [System.IO.File]::ReadAllText($file)
            $original = $content
            
            # Corriger import.met ? import.meta
            $content = $content -replace 'import\.met\?', 'import.meta'
            $content = $content -replace 'import\.met ', 'import.meta '
            
            # Corriger les autres problemes specifiques
            # RegisterForm.tsx - proprietes "met" dans les criteres
            if ($file -like "*RegisterForm*") {
                $content = $content -replace ': met:', ': test:'
                $content = $content -replace '\.met\)', '.test)'
                $content = $content -replace 'c\.met', 'c.test'
                $content = $content -replace 'criteri\?', 'criteria?'
            }
            
            # realApi.ts - corriger les proprietes avec "a" suffixe
            if ($file -like "*realApi*") {
                $content = $content -replace 'barcodea:', 'barcode?:'
                $content = $content -replace 'categorya:', 'category?:'
                $content = $content -replace 'ingredientsTexta:', 'ingredientsText?:'
            }
            
            # useSEO.ts - corriger les variables "met" et "meta"
            if ($file -like "*useSEO*") {
                $content = $content -replace '\bmet\?\.', 'meta?.'
                $content = $content -replace '\bmet ', 'meta '
                $content = $content -replace 'updateOrCreateMeta', 'updateOrCreateMetaTag'
            }
            
            # ProductPage.tsx - corriger setScanMethod
            if ($file -like "*ProductPage*") {
                $content = $content -replace 'setScanMethod', 'setScanMethod'
                $content = $content -replace 'scanMethod', 'scanMethod'
            }
            
            # ultraTransformService.ts - corriger methods et metadata
            if ($file -like "*ultraTransformService*") {
                $content = $content -replace 'processingMethods:', 'processingMethods:'
                $content = $content -replace 'methods\.push', 'methods.push'
                $content = $content -replace 'metadata:', 'metadata:'
            }
            
            # cosmetique ? cosmetics
            $content = $content -replace 'cosmetique', 'cosmetics'
            
            if ($content -ne $original) {
                [System.IO.File]::WriteAllText($file, $content)
                Write-Host "Corrige: $file" -ForegroundColor Green
                $totalFixed++
            }
        }
        catch {
            Write-Host "Erreur avec $file : $_" -ForegroundColor Red
        }
    }
}

Write-Host "`n$totalFixed fichiers corriges!" -ForegroundColor Green
