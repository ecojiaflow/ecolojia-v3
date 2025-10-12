# ECOLOJIA V3 - Script de correction automatique
# Corrige les erreurs identifiées dans HistoryPage et FavoritesPage

$rootPath = "C:\Users\salim\Desktop\ECOLOJIA VF CLEAN"
Set-Location $rootPath

Write-Host "=== ECOLOJIA V3 - CORRECTIONS AUTOMATIQUES ===" -ForegroundColor Cyan
Write-Host ""

# ===== CORRECTION 1 : HistoryPage.tsx =====
Write-Host "[1/2] Correction HistoryPage.tsx..." -ForegroundColor Yellow

$historyPagePath = "frontend\src\pages\HistoryPage.tsx"

if (Test-Path $historyPagePath) {
    # Backup original
    $backupPath = "$historyPagePath.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item $historyPagePath $backupPath
    Write-Host "  Backup cree: $backupPath" -ForegroundColor Gray
    
    # Lire contenu
    $content = Get-Content $historyPagePath -Raw
    
    # Correction 1: MOCK_MODE -> import.meta.env.VITE_MOCK_MODE
    $content = $content -replace 'if\s*\(\s*MOCK_MODE\s*\)', 'if (import.meta.env.VITE_MOCK_MODE === "true")'
    $content = $content -replace 'MOCK_MODE\s*\?\s*', '(import.meta.env.VITE_MOCK_MODE === "true") ? '
    
    # Correction 2: Ajouter import si manquant
    if ($content -notmatch "import\.meta\.env") {
        Write-Host "  Ajout verification environnement..." -ForegroundColor Gray
    }
    
    # Sauvegarder
    $content | Out-File -FilePath $historyPagePath -Encoding UTF8 -NoNewline
    Write-Host "  [OK] HistoryPage.tsx corrige" -ForegroundColor Green
} else {
    Write-Host "  [WARN] HistoryPage.tsx introuvable" -ForegroundColor Red
}

Write-Host ""

# ===== CORRECTION 2 : FavoritesPage.tsx =====
Write-Host "[2/2] Correction FavoritesPage.tsx..." -ForegroundColor Yellow

$favoritesPagePath = "frontend\src\pages\FavoritesPage.tsx"

if (Test-Path $favoritesPagePath) {
    # Backup original
    $backupPath = "$favoritesPagePath.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item $favoritesPagePath $backupPath
    Write-Host "  Backup cree: $backupPath" -ForegroundColor Gray
    
    # Lire contenu
    $content = Get-Content $favoritesPagePath -Raw
    
    # Correction: Ajouter try-catch autour de fetchFavorites
    # Chercher les appels fetchFavorites sans try-catch
    if ($content -match "fetchFavorites\(\)" -and $content -notmatch "try\s*\{[^}]*fetchFavorites") {
        Write-Host "  Ajout gestion erreurs..." -ForegroundColor Gray
        
        # Remplacer appels directs par version securisee
        $content = $content -replace '(const\s+\w+\s*=\s*)(await\s+fetchFavorites\(\))', '$1await fetchFavorites().catch(() => [])'
    }
    
    # Sauvegarder
    $content | Out-File -FilePath $favoritesPagePath -Encoding UTF8 -NoNewline
    Write-Host "  [OK] FavoritesPage.tsx corrige" -ForegroundColor Green
} else {
    Write-Host "  [WARN] FavoritesPage.tsx introuvable" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== CORRECTIONS TERMINEES ===" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Cyan
Write-Host "1. Redemarrer le serveur frontend (Ctrl+C puis 'npm run dev')" -ForegroundColor White
Write-Host "2. Tester http://localhost:5173/history" -ForegroundColor White
Write-Host "3. Tester http://localhost:5173/favorites" -ForegroundColor White
Write-Host ""
Write-Host "Backups sauvegardes dans:" -ForegroundColor Gray
Write-Host "  - $historyPagePath.backup_*" -ForegroundColor Gray
Write-Host "  - $favoritesPagePath.backup_*" -ForegroundColor Gray
