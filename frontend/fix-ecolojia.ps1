# Script simplifie pour ECOLOJIA V3
Write-Host "=== CORRECTION ECOLOJIA V3 ===" -ForegroundColor Yellow

# 1. SUPPRIMER LES DOUBLONS CHAT
Write-Host "`nSuppression des composants Chat en double..." -ForegroundColor Cyan

$toDelete = @(
    "src/components/ChatBubble.tsx",
    "src/components/chat/ChatInterface.tsx",
    "src/components/ChatBot.tsx"
)

foreach ($file in $toDelete) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  Supprime: $file" -ForegroundColor Red
    }
}

Write-Host "  Garde: ChatPage.tsx et ChatWidget.tsx" -ForegroundColor Green

# 2. LISTER LES FICHIERS QUI UTILISENT realApi
Write-Host "`nFichiers utilisant realApi:" -ForegroundColor Cyan

$realApiFiles = @(
    "src/api/realApi.ts",
    "src/api/realApi.ts.backup",
    "src/api/realApi.ts.backup2",
    "src/components/products/SimilarProductsCarousel.tsx",
    "src/components/scanner/EnhancedBarcodeScanner.tsx",
    "src/hooks/useAnalysis.ts",
    "src/hooks/useProductCache.ts",
    "src/pages/CategoryPage.tsx",
    "src/pages/ProductNotFoundPage.tsx",
    "src/services/analysis/novaAdapter.ts",
    "src/services/product/UniversalSearchService.ts"
)

foreach ($file in $realApiFiles) {
    if (Test-Path $file) {
        Write-Host "  A corriger: $file" -ForegroundColor Yellow
    }
}

# 3. CREER LES FICHIERS MANQUANTS
Write-Host "`nCreation des fichiers manquants..." -ForegroundColor Cyan

if (-not (Test-Path "src/services/chatService.ts")) {
    New-Item -Path "src/services/chatService.ts" -ItemType File -Force | Out-Null
    Write-Host "  Cree: chatService.ts (copier le contenu depuis l'artefact)" -ForegroundColor Green
}

# 4. SUPPRIMER LES BACKUPS
Write-Host "`nNettoyage des backups..." -ForegroundColor Cyan

$backups = @(
    "src/api/realApi.ts.backup",
    "src/api/realApi.ts.backup2"
)

foreach ($backup in $backups) {
    if (Test-Path $backup) {
        Remove-Item $backup -Force
        Write-Host "  Supprime: $backup" -ForegroundColor Red
    }
}

Write-Host "`n=== ACTIONS MANUELLES REQUISES ===" -ForegroundColor Yellow
Write-Host "1. Remplacer tous les imports realApi par api" -ForegroundColor White
Write-Host "2. Copier le contenu de chatService.ts depuis l'artefact" -ForegroundColor White
Write-Host "3. Remplacer useQuota.ts par la version corrigee" -ForegroundColor White
Write-Host "4. Corriger les caracteres mal encodes dans ChatPage.tsx" -ForegroundColor White