# 🚀 SCRIPT TOUT-EN-UN POUR IMPLÉMENTER PR#1
# Execute ce seul fichier et suis les instructions !

Write-Host @"

    ███████╗ ██████╗ ██████╗ ██╗      ██████╗      ██╗██╗ █████╗ 
    ██╔════╝██╔════╝██╔═══██╗██║     ██╔═══██╗     ██║██║██╔══██╗
    █████╗  ██║     ██║   ██║██║     ██║   ██║     ██║██║███████║
    ██╔══╝  ██║     ██║   ██║██║     ██║   ██║██   ██║██║██╔══██║
    ███████╗╚██████╗╚██████╔╝███████╗╚██████╔╝╚█████╔╝██║██║  ██║
    ╚══════╝ ╚═════╝ ╚═════╝ ╚══════╝ ╚═════╝  ╚════╝ ╚═╝╚═╝  ╚═╝
                                                                    
    🚀 IMPLÉMENTATION AUTOMATIQUE PR#1 - ANALYSES RÉELLES
    
"@ -ForegroundColor Cyan

Write-Host "Ce script va :" -ForegroundColor Yellow
Write-Host "  1. Installer les dépendances" -ForegroundColor White
Write-Host "  2. Créer tous les fichiers nécessaires" -ForegroundColor White
Write-Host "  3. Déployer sur GitHub" -ForegroundColor White
Write-Host "  4. Tester que tout fonctionne" -ForegroundColor White
Write-Host ""

# Vérifier qu'on est au bon endroit
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "❌ ERREUR: Tu n'es pas dans le bon dossier !" -ForegroundColor Red
    Write-Host ""
    Write-Host "📁 Va dans le dossier principal de ton projet ECOLOJIA" -ForegroundColor Yellow
    Write-Host "   (celui qui contient les dossiers 'backend' et 'frontend')" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Puis relance ce script." -ForegroundColor White
    pause
    exit 1
}

Write-Host "✅ Dossier OK" -ForegroundColor Green
Write-Host ""
pause

# ÉTAPE 1 : INSTALLATION
Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "📦 ÉTAPE 1/4 : INSTALLATION DES DÉPENDANCES" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""

Set-Location backend
Write-Host "Installation des packages NPM..." -ForegroundColor Yellow
npm install axios@^1.6.0 zod@^3.22.0 string-similarity@^4.0.4
npm install --save-dev @types/string-similarity@^4.0.0
Set-Location ..

Write-Host ""
Write-Host "✅ Dépendances installées" -ForegroundColor Green
Write-Host ""
pause

# ÉTAPE 2 : CRÉATION DES FICHIERS
Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "📝 ÉTAPE 2/4 : CRÉATION DES FICHIERS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""

# Créer la structure
$folders = @(
    "backend/src/services",
    "backend/src/scorers",
    "backend/src/scorers/food",
    "backend/src/scorers/cosmetic", 
    "backend/src/scorers/detergent"
)

foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
    }
}

# Exécuter le script de création
Write-Host "Création des fichiers..." -ForegroundColor Yellow
& "$PSScriptRoot\create-all-files.ps1"

Write-Host ""
Write-Host "✅ Tous les fichiers créés" -ForegroundColor Green
Write-Host ""
pause

# ÉTAPE 3 : DÉPLOIEMENT
Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "🚀 ÉTAPE 3/4 : DÉPLOIEMENT" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""

Write-Host "Vérification des changements Git..." -ForegroundColor Yellow
git status --short

Write-Host ""
$deploy = Read-Host "Veux-tu déployer ces changements ? (O/N)"
if ($deploy -eq 'O' -or $deploy -eq 'o') {
    git add .
    git commit -m "feat: real product analysis with OpenFoodFacts integration"
    git push origin main
    
    Write-Host ""
    Write-Host "✅ Code déployé !" -ForegroundColor Green
    Write-Host ""
    Write-Host "⏰ Attends 5 minutes que Render déploie..." -ForegroundColor Yellow
    Write-Host "   (Tu peux suivre sur https://dashboard.render.com)" -ForegroundColor Gray
    Write-Host ""
    
    # Timer visuel
    $seconds = 300  # 5 minutes
    for ($i = $seconds; $i -gt 0; $i--) {
        $minutes = [math]::Floor($i / 60)
        $secs = $i % 60
        Write-Progress -Activity "Déploiement en cours..." `
                      -Status "Temps restant: $minutes min $secs sec" `
                      -PercentComplete ((($seconds - $i) / $seconds) * 100)
        Start-Sleep -Seconds 1
    }
    Write-Progress -Activity "Déploiement en cours..." -Completed
} else {
    Write-Host "Déploiement annulé. Tu peux le faire plus tard avec:" -ForegroundColor Yellow
    Write-Host "  git push origin main" -ForegroundColor White
    Write-Host ""
    pause
    exit 0
}

# ÉTAPE 4 : TESTS
Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "🧪 ÉTAPE 4/4 : TESTS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""

& "$PSScriptRoot\test-pr1.ps1"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "🎉 TERMINÉ !" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Les analyses réelles sont maintenant opérationnelles !" -ForegroundColor Green
Write-Host ""
Write-Host "Tu peux tester avec d'autres produits :" -ForegroundColor Cyan
Write-Host '  .\scripts\test-analysis.ps1 -Barcode "5449000000996"' -ForegroundColor White
Write-Host ""
pause