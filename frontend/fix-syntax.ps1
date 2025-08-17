Write-Host "CORRECTION DES ERREURS DE SYNTAXE" -ForegroundColor Yellow

# Fichiers avec erreurs specifiques
$fixes = @{
    ".\src\pages\DashboardPage.tsx" = @{
        "isDemo a 'Tableau de bord demo'" = "isDemo ? 'Tableau de bord demo'"
        "usera.profilea.firstName" = "user?.profile?.firstName"
    }
    ".\src\components\Navbar.tsx" = @{
        "quickSearchQuery a 'Suggestions" = "quickSearchQuery ? 'Suggestions"
    }
    ".\src\components\scanner\BarcodeScanner.tsx" = @{
        "onErrora.(" = "onError?.("
    }
    ".\src\components\scanner\PhotoCapture.tsx" = @{
        "onErrora.(" = "onError?.("
    }
    ".\src\components\scanner\ManualSearch.tsx" = @{
        "formData.category a [" = "formData.category ? ["
    }
}

foreach ($file in $fixes.Keys) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        foreach ($bad in $fixes[$file].Keys) {
            $good = $fixes[$file][$bad]
            $content = $content -replace [regex]::Escape($bad), $good
        }
        Set-Content -Path $file -Value $content -Encoding UTF8
        Write-Host "OK: $file" -ForegroundColor Green
    }
}

# Correction generale des "a" mal places
$files = Get-ChildItem -Path ".\src" -Include *.tsx,*.ts -Recurse
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Remplacer les operateurs ternaires casses
    $content = $content -replace '(\w+)\s+a\s+([''"])', '$1 ? $2'
    $content = $content -replace '(\))\s+a\s+([''"])', '$1 ? $2'
    
    # Remplacer les acces casses
    $content = $content -replace '(\w+)a\.', '$1?.'
    
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        Write-Host "Corrige: $($file.Name)" -ForegroundColor Yellow
    }
}

Write-Host "TERMINE!" -ForegroundColor Green
