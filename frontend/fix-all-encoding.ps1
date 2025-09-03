# Script PowerShell pour corriger seulement les fichiers importants
# Compatible avec PowerShell v2+

Write-Host "🔧 Correction ciblée des fichiers importants..." -ForegroundColor Cyan

# Liste des fichiers critiques à corriger
$criticalFiles = @(
    "src\pages\HomePage.tsx",
    "src\pages\ChatPage.tsx",
    "src\pages\DashboardPage.tsx",
    "src\pages\ResultsPage.tsx",
    "src\pages\ProductPage.tsx",
    "src\pages\SearchPage.tsx",
    "src\App.tsx",
    "src\components\Layout.tsx",
    "src\services\api.ts",
    "src\services\chatService.ts",
    "src\services\dashboardService.ts",
    "src\contexts\AuthContext.tsx",
    "src\hooks\useAuth.ts"
)

$fixedCount = 0

foreach ($filePath in $criticalFiles) {
    $fullPath = Join-Path $PWD $filePath
    
    if (Test-Path $fullPath) {
        Write-Host "📄 Correction de: $filePath" -ForegroundColor Yellow
        
        try {
            # Lire le contenu
            $content = [System.IO.File]::ReadAllText($fullPath, [System.Text.Encoding]::UTF8)
            
            # Remplacements
            $content = $content -replace 'Ã©', 'é'
            $content = $content -replace 'Ã¨', 'è'
            $content = $content -replace 'Ã ', 'à'
            $content = $content -replace 'Ã§', 'ç'
            $content = $content -replace 'Ã´', 'ô'
            $content = $content -replace 'Ã¢', 'â'
            $content = $content -replace 'Ãª', 'ê'
            $content = $content -replace 'Ã®', 'î'
            $content = $content -replace 'Ã¹', 'ù'
            $content = $content -replace 'Ã»', 'û'
            $content = $content -replace 'Ã¼', 'ü'
            $content = $content -replace 'Ã¶', 'ö'
            $content = $content -replace 'Ã¤', 'ä'
            $content = $content -replace 'Ã¯', 'ï'
            $content = $content -replace 'Ã«', 'ë'
            $content = $content -replace 'Ã‰', 'É'
            $content = $content -replace 'ÃŠ', 'Ê'
            $content = $content -replace 'Ã"', 'Ô'
            $content = $content -replace 'Ã®le', 'île'
            
            # Sauvegarder
            $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
            [System.IO.File]::WriteAllText($fullPath, $content, $utf8NoBom)
            
            Write-Host "  ✅ Corrigé!" -ForegroundColor Green
            $fixedCount++
        }
        catch {
            Write-Host "  ❌ Erreur: $_" -ForegroundColor Red
        }
    }
    else {
        Write-Host "  ⚠️  Fichier non trouvé: $filePath" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ $fixedCount fichiers corrigés" -ForegroundColor Green
Write-Host "🔄 Relancez 'npm run dev' pour voir les changements" -ForegroundColor Cyan