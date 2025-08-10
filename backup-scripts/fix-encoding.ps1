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
        
        # Lire avec encodage UTF8
        $content = Get-Content $file -Raw -Encoding UTF8
        
        # Corriger les caractères mal encodés courants
        $corrections = @{
            "Ã©" = "é"
            "Ã¨" = "è"
            "Ã " = "à"
            "Ã¢" = "â"
            "Ãª" = "ê"
            "Ã´" = "ô"
            "Ã®" = "î"
            "Ã§" = "ç"
            "Ã‰" = "É"
            "Ãˆ" = "È"
            "Ã€" = "À"
            "Ã¹" = "ù"
            "Å"" = "œ"
            "â€™" = "'"
            "â€œ" = '"'
            "â€" = '"'
            "â€"" = "–"
            "â€¢" = "•"
        }
        
        foreach ($wrong in $corrections.Keys) {
            $content = $content -replace [regex]::Escape($wrong), $corrections[$wrong]
        }
        
        # Sauvegarder avec bon encodage
        [System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
        Write-Host "✓ $file corrigé" -ForegroundColor Green
    }
}

Write-Host "`n✅ Encodage corrigé! Rafraîchissez la page (F5)" -ForegroundColor Green
