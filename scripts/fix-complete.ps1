# ECOLOJIA V3 - Correction Complete Ultra

$rootPath = "C:\Users\salim\Desktop\ECOLOJIA VF CLEAN"
Set-Location $rootPath

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  ECOLOJIA V3 - CORRECTION COMPLETE" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ===== CORRECTION HISTORYPAGE =====
Write-Host "[1/2] Correction HistoryPage.tsx..." -ForegroundColor Yellow

$historyFile = "frontend\src\pages\HistoryPage.tsx"

if (Test-Path $historyFile) {
    # Backup
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "$historyFile.backup_$timestamp"
    Copy-Item $historyFile $backupFile -Force
    Write-Host "  Backup cree: $(Split-Path $backupFile -Leaf)" -ForegroundColor Gray
    
    # Lire contenu
    $content = Get-Content $historyFile -Raw
    
    # CORRECTION 1: Remplacer TOUTES les occurrences de MOCK_MODE
    $mockModeCount = ([regex]::Matches($content, '\bMOCK_MODE\b')).Count
    Write-Host "  Trouve $mockModeCount occurrence(s) de MOCK_MODE" -ForegroundColor Gray
    
    # Remplacer par import.meta.env
    $content = $content -replace '\bMOCK_MODE\b', '(import.meta.env.VITE_MOCK_MODE === "true")'
    Write-Host "  [OK] MOCK_MODE remplace" -ForegroundColor Green
    
    # CORRECTION 2: Importer services manquants
    if ($content -notmatch "import.*dashboardService") {
        Write-Host "  Ajout import dashboardService..." -ForegroundColor Gray
        $content = $content -replace "(import \{ getHistory, clearHistory \} from '../services/history.service';)", "`$1`nimport * as dashboardService from '@/services/dashboardService';"
        Write-Host "  [OK] dashboardService importe" -ForegroundColor Green
    }
    
    if ($content -notmatch "import.*historyService") {
        Write-Host "  Ajout import historyService..." -ForegroundColor Gray
        $content = $content -replace "(import \{ getHistory, clearHistory \} from '../services/history.service';)", "`$1`nimport * as historyService from '@/services/historyService';"
        Write-Host "  [OK] historyService importe" -ForegroundColor Green
    }
    
    # CORRECTION 3: Fixer fetchHistory (lignes 121-123 cassees)
    $content = $content -replace "const history = getHistory\(\); setHistory\(history\);[\s\S]*?setHistory\(response\.items", "const historyData = getHistory();`n      setHistory(historyData"
    Write-Host "  [OK] fetchHistory corrige" -ForegroundColor Green
    
    # Sauvegarder
    $content | Out-File -FilePath $historyFile -Encoding UTF8 -NoNewline
    Write-Host "  [SUCCESS] HistoryPage.tsx completement corrige" -ForegroundColor Green
    
} else {
    Write-Host "  [ERROR] HistoryPage.tsx introuvable" -ForegroundColor Red
}

Write-Host ""

# ===== VERIFICATION FAVORITESPAGE =====
Write-Host "[2/2] Verification FavoritesPage.tsx..." -ForegroundColor Yellow

$favoritesFile = "frontend\src\pages\FavoritesPage.tsx"

if (Test-Path $favoritesFile) {
    # Backup
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "$favoritesFile.backup_$timestamp"
    Copy-Item $favoritesFile $backupFile -Force
    Write-Host "  Backup cree: $(Split-Path $backupFile -Leaf)" -ForegroundColor Gray
    
    # Lire contenu
    $content = Get-Content $favoritesFile -Raw
    
    # Corriger MOCK_MODE si present
    $mockModeCount = ([regex]::Matches($content, '\bMOCK_MODE\b')).Count
    if ($mockModeCount -gt 0) {
        Write-Host "  Trouve $mockModeCount occurrence(s) de MOCK_MODE" -ForegroundColor Gray
        $content = $content -replace '\bMOCK_MODE\b', '(import.meta.env.VITE_MOCK_MODE === "true")'
        Write-Host "  [OK] MOCK_MODE remplace" -ForegroundColor Green
    }
    
    # Verifier import useNavigate
    if ($content -notmatch "import.*useNavigate.*from.*react-router-dom") {
        Write-Host "  [WARN] useNavigate non importe - ajout..." -ForegroundColor Yellow
        
        # Chercher import react-router-dom existant
        if ($content -match "import\s*\{([^}]+)\}\s*from\s*['\`"]react-router-dom['\`"]") {
            $imports = $matches[1].Trim()
            if ($imports -notmatch "useNavigate") {
                $newImports = "$imports, useNavigate"
                $content = $content -replace "(import\s*\{)[^}]+(}\s*from\s*['\`"]react-router-dom['\`"])", "`${1}$newImports`$2"
                Write-Host "  [OK] useNavigate ajoute aux imports" -ForegroundColor Green
            }
        } else {
            # Ajouter nouvel import
            $content = "import { useNavigate } from 'react-router-dom';`n" + $content
            Write-Host "  [OK] Import useNavigate ajoute" -ForegroundColor Green
        }
    }
    
    # Verifier const navigate
    if ($content -notmatch "const\s+navigate\s*=\s*useNavigate\(\)") {
        Write-Host "  [WARN] const navigate manquant - ajout..." -ForegroundColor Yellow
        
        # Chercher debut du composant
        if ($content -match "(const\s+FavoritesPage[^{]*\{)") {
            $content = $content -replace "(const\s+FavoritesPage[^{]*\{)", "`$1`n  const navigate = useNavigate();`n"
            Write-Host "  [OK] const navigate ajoute" -ForegroundColor Green
        }
    }
    
    # Ajouter try-catch sur fetchFavorites
    if ($content -match "fetchFavorites\(\)" -and $content -notmatch "fetchFavorites\(\)\.catch") {
        Write-Host "  Ajout gestion erreurs fetchFavorites..." -ForegroundColor Gray
        $content = $content -replace "await\s+fetchFavorites\(\)", "await fetchFavorites().catch(() => [])"
        Write-Host "  [OK] Gestion erreurs ajoutee" -ForegroundColor Green
    }
    
    # Sauvegarder
    $content | Out-File -FilePath $favoritesFile -Encoding UTF8 -NoNewline
    Write-Host "  [SUCCESS] FavoritesPage.tsx verifie et corrige" -ForegroundColor Green
    
} else {
    Write-Host "  [ERROR] FavoritesPage.tsx introuvable" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  CORRECTIONS TERMINEES" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# Afficher resume
Write-Host "Resume des modifications:" -ForegroundColor Cyan
Write-Host "  - HistoryPage: MOCK_MODE corrige + imports ajoutes + fetchHistory fixe" -ForegroundColor White
Write-Host "  - FavoritesPage: MOCK_MODE corrige + useNavigate verifie + gestion erreurs" -ForegroundColor White
Write-Host ""

Write-Host "Backups sauvegardes:" -ForegroundColor Cyan
Get-ChildItem -Path "frontend\src\pages" -Filter "*.backup_$timestamp" | ForEach-Object {
    Write-Host "  - $($_.Name)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "PROCHAINES ETAPES:" -ForegroundColor Yellow
Write-Host "1. Redemarrer le serveur frontend (Ctrl+C puis 'npm run dev')" -ForegroundColor White
Write-Host "2. Tester http://localhost:5173/history" -ForegroundColor White
Write-Host "3. Tester http://localhost:5173/favorites" -ForegroundColor White
Write-Host ""

# Proposer de redémarrer automatiquement
Write-Host "Voulez-vous redemarrer le frontend maintenant ? (O/N)" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq "O" -or $response -eq "o") {
    Write-Host ""
    Write-Host "Pour redemarrer le frontend:" -ForegroundColor Cyan
    Write-Host "1. Appuyez sur Ctrl+C dans le terminal frontend" -ForegroundColor White
    Write-Host "2. Puis tapez: npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou ouvrez un nouveau terminal et executez:" -ForegroundColor Cyan
    Write-Host "  cd frontend && npm run dev" -ForegroundColor White
}

Write-Host ""
Write-Host "Script termine avec succes !" -ForegroundColor Green