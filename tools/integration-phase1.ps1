# Script PowerShell - ECOLOJIA V3 Integration Phase 1
# Exécuter depuis la racine du projet ECOLOJIA
# Date: 2025-01-14

Write-Host "🚀 ECOLOJIA V3 - PHASE 1: QUICK WINS" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Configuration
$frontendPath = ".\frontend"
$backendPath = ".\backend"
$toolsPath = ".\tools"

# Vérification structure
if (-not (Test-Path $frontendPath)) {
    Write-Error "❌ Dossier frontend non trouvé. Êtes-vous dans la racine du projet?"
    exit 1
}

# 1. CRÉATION DU DOSSIER TOOLS
Write-Host "`n📁 Création du dossier tools..." -ForegroundColor Yellow
if (-not (Test-Path $toolsPath)) {
    New-Item -ItemType Directory -Path $toolsPath -Force | Out-Null
    Write-Host "✅ Dossier tools créé" -ForegroundColor Green
}

# 2. SAUVEGARDE DES FICHIERS EXISTANTS
Write-Host "`n💾 Sauvegarde des fichiers existants..." -ForegroundColor Yellow
$backupDate = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = ".\backup-integration-$backupDate"

$filesToBackup = @(
    "$frontendPath\src\services\api.ts",
    "$frontendPath\src\services\dashboardService.ts",
    "$frontendPath\src\components\scanner\BarcodeScanner.tsx",
    "$frontendPath\src\i18n\locales\fr.json",
    "$backendPath\src\server.js",
    "$backendPath\src\services\aiService.js"
)

foreach ($file in $filesToBackup) {
    if (Test-Path $file) {
        $relativePath = $file.Replace(".\", "")
        $backupFile = Join-Path $backupPath $relativePath
        $backupDir = Split-Path $backupFile -Parent
        
        if (-not (Test-Path $backupDir)) {
            New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        }
        
        Copy-Item -Path $file -Destination $backupFile -Force
        Write-Host "  ✅ Sauvegardé: $relativePath" -ForegroundColor Gray
    }
}

# 3. NETTOYAGE DES FICHIERS LEGACY
Write-Host "`n🧹 Nettoyage des fichiers legacy..." -ForegroundColor Yellow

# Patterns à nettoyer
$cleanupPatterns = @(
    "$frontendPath\src\**\*.backup_*",
    "$frontendPath\src\**\_archive",
    "$backendPath\**\*postgres*",
    "$backendPath\**\*prisma*",
    "$backendPath\**\_archive*"
)

$filesRemoved = 0
foreach ($pattern in $cleanupPatterns) {
    $files = Get-ChildItem -Path $pattern -Recurse -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        Remove-Item -Path $file.FullName -Recurse -Force -ErrorAction SilentlyContinue
        $filesRemoved++
    }
}

Write-Host "✅ $filesRemoved fichiers/dossiers legacy supprimés" -ForegroundColor Green

# 4. CORRECTION ENCODAGE UTF-8
Write-Host "`n🔧 Correction de l'encodage UTF-8..." -ForegroundColor Yellow

# Fonction de correction inline
function Fix-FileEncoding {
    param([string]$FilePath)
    
    if (-not (Test-Path $FilePath)) { return }
    
    try {
        # Lire avec détection auto
        $content = Get-Content -Path $FilePath -Raw -Encoding Default
        
        # Détecter et corriger les caractères mal encodés
        if ($content -match "Ã©|Ã¨|Ã |Ã®|Ã§|â€™|â€œ") {
            # Essayer de réparer via double conversion
            $bytes = [System.Text.Encoding]::GetEncoding("ISO-8859-1").GetBytes($content)
            $repaired = [System.Text.Encoding]::UTF8.GetString($bytes)
            
            # Corrections supplémentaires
            $repaired = $repaired -replace "â€™", "'"
            $repaired = $repaired -replace "â€œ", '"'
            $repaired = $repaired -replace "â€", '"'
            
            # Sauvegarder en UTF-8 sans BOM
            $utf8NoBom = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::WriteAllText($FilePath, $repaired, $utf8NoBom)
            
            Write-Host "  ✅ Corrigé: $($FilePath.Replace($PWD, '.'))" -ForegroundColor Green
            return $true
        }
        else {
            # Juste s'assurer que c'est en UTF-8 sans BOM
            $utf8NoBom = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::WriteAllText($FilePath, $content, $utf8NoBom)
            return $false
        }
    }
    catch {
        Write-Warning "  ⚠️ Erreur sur: $FilePath - $_"
        return $false
    }
}

# Corriger tous les fichiers source
$extensions = @("*.ts", "*.tsx", "*.js", "*.jsx", "*.json", "*.css", "*.html")
$totalFixed = 0

foreach ($ext in $extensions) {
    $files = Get-ChildItem -Path $frontendPath -Filter $ext -Recurse -File |
             Where-Object { $_.DirectoryName -notmatch "node_modules|dist|build|\.git" }
    
    foreach ($file in $files) {
        if (Fix-FileEncoding -FilePath $file.FullName) {
            $totalFixed++
        }
    }
}

# Corriger aussi le backend
foreach ($ext in @("*.js", "*.json")) {
    $files = Get-ChildItem -Path $backendPath -Filter $ext -Recurse -File |
             Where-Object { $_.DirectoryName -notmatch "node_modules|dist|\.git" }
    
    foreach ($file in $files) {
        if (Fix-FileEncoding -FilePath $file.FullName) {
            $totalFixed++
        }
    }
}

Write-Host "✅ $totalFixed fichiers corrigés pour l'encodage" -ForegroundColor Green

# 5. VÉRIFICATION FINALE
Write-Host "`n🔍 Vérification des problèmes restants..." -ForegroundColor Yellow

$remainingIssues = 0
$checkPaths = @($frontendPath, $backendPath)

foreach ($path in $checkPaths) {
    $issues = Get-ChildItem -Path $path -Recurse -Include *.ts,*.tsx,*.js,*.json |
              Where-Object { $_.DirectoryName -notmatch "node_modules|dist|build" } |
              Select-String -Pattern "Ã©|Ã¨|Ã |â€" -List
    
    $remainingIssues += $issues.Count
}

if ($remainingIssues -eq 0) {
    Write-Host "✅ Aucun problème d'encodage détecté!" -ForegroundColor Green
} else {
    Write-Host "⚠️ $remainingIssues fichiers avec problèmes potentiels restants" -ForegroundColor Yellow
}

# 6. CRÉATION .ENV SI NÉCESSAIRE
Write-Host "`n📝 Vérification des fichiers .env..." -ForegroundColor Yellow

# Frontend .env
$frontendEnv = "$frontendPath\.env"
if (-not (Test-Path $frontendEnv)) {
    @"
VITE_APP_NAME=ECOLOJIA
VITE_API_URL=https://ecolojia-backendvf.onrender.com/api
VITE_REQUEST_TIMEOUT_MS=20000
"@ | Out-File -FilePath $frontendEnv -Encoding UTF8
    Write-Host "✅ Créé: frontend/.env" -ForegroundColor Green
} else {
    Write-Host "  ℹ️ frontend/.env existe déjà" -ForegroundColor Gray
}

# Backend .env check
$backendEnv = "$backendPath\.env"
if (-not (Test-Path $backendEnv)) {
    Write-Host "⚠️ backend/.env manquant - créez-le avec les variables nécessaires" -ForegroundColor Yellow
} else {
    Write-Host "  ℹ️ backend/.env existe" -ForegroundColor Gray
}

# 7. RÉSUMÉ
Write-Host "`n📊 RÉSUMÉ PHASE 1" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host "✅ Fichiers sauvegardés dans: $backupPath" -ForegroundColor White
Write-Host "✅ $filesRemoved fichiers legacy supprimés" -ForegroundColor White
Write-Host "✅ $totalFixed fichiers corrigés (encodage)" -ForegroundColor White
Write-Host "✅ Structure nettoyée et prête" -ForegroundColor White

Write-Host "`n💡 PROCHAINE ÉTAPE:" -ForegroundColor Yellow
Write-Host "Exécutez le script Phase 2 pour intégrer les fichiers corrigés" -ForegroundColor White
Write-Host ".\tools\integration-phase2.ps1" -ForegroundColor Green

Write-Host "`n✨ Phase 1 terminée avec succès!" -ForegroundColor Green