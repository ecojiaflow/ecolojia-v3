Write-Host "`n=== Correction de l'encodage UTF-8 ===" -ForegroundColor Cyan

$files = @(
    ".\src\pages\SearchPage.tsx",
    ".\src\App.tsx",
    ".\src\components\Navbar.tsx",
    ".\src\pages\HomePage.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Correction de $file..." -ForegroundColor Yellow
        
        # Lire le fichier
        $content = Get-Content $file -Raw -Encoding UTF8
        
        # Corrections principales
        $content = $content -replace "Ã©", "é"
        $content = $content -replace "Ã¨", "è"
        $content = $content -replace "Ã ", "à"
        $content = $content -replace "Ã¢", "â"
        $content = $content -replace "Ãª", "ê"
        $content = $content -replace "Ã´", "ô"
        $content = $content -replace "Ã®", "î"
        $content = $content -replace "Ã§", "ç"
        $content = $content -replace "Ã‰", "É"
        $content = $content -replace "Ãˆ", "È"
        $content = $content -replace "Ã€", "À"
        $content = $content -replace "Ã¹", "ù"
        $content = $content -replace "Ã»", "û"
        $content = $content -replace "Ã¼", "ü"
        $content = $content -replace "Ã¶", "ö"
        $content = $content -replace "Ã¤", "ä"
        
        # Sauvegarder
        [System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
        Write-Host "✓ $file corrigé" -ForegroundColor Green
    }
}

Write-Host "`n✅ Encodage corrigé! Rafraîchissez la page (F5)" -ForegroundColor Green
