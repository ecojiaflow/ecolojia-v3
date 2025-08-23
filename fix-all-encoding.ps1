# Correction globale des problèmes d'encodage
Write-Host "🔧 Correction globale des fichiers..." -ForegroundColor Cyan

# Fonction de correction
function Fix-Encoding {
    param($path, $pattern)
    
    if (-not (Test-Path $path)) {
        Write-Host "  ⚠️ Chemin non trouvé: $path" -ForegroundColor Yellow
        return 0
    }
    
    $files = Get-ChildItem -Path $path -Include $pattern -Recurse
    $fixedCount = 0
    
    foreach ($file in $files) {
        if ($file.FullName -notmatch "node_modules|dist|build|.git") {
            try {
                $content = Get-Content $file.FullName -Raw -Encoding UTF8
                $original = $content
                
                # Corrections
                $content = $content -replace 'Ã©', 'e'
                $content = $content -replace 'Ã¨', 'e'
                $content = $content -replace 'Ãª', 'e'
                $content = $content -replace 'Ã ', 'a'
                $content = $content -replace 'Ã¢', 'a'
                $content = $content -replace 'Ã´', 'o'
                $content = $content -replace 'Ã®', 'i'
                $content = $content -replace 'Ã¯', 'i'
                $content = $content -replace 'Ã§', 'c'
                $content = $content -replace 'Ã¹', 'u'
                $content = $content -replace 'Ã»', 'u'
                $content = $content -replace 'Ã¼', 'u'
                $content = $content -replace 'Å"', 'oe'
                $content = $content -replace 'Ã', ''
                
                if ($content -ne $original) {
                    [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.UTF8Encoding]::new($false))
                    Write-Host "  ✓ $($file.Name)" -ForegroundColor Green
                    $fixedCount++
                }
            }
            catch {
                Write-Host "  ✗ Erreur avec $($file.Name): $_" -ForegroundColor Red
            }
        }
    }
    
    return $fixedCount
}

# Backend
Write-Host "`nBackend:" -ForegroundColor Yellow
$backendFixed = Fix-Encoding -path ".\backend\src" -pattern "*.js"
Write-Host "  $backendFixed fichiers corrigés" -ForegroundColor Cyan

# Frontend
Write-Host "`nFrontend:" -ForegroundColor Yellow
$frontendFixed = Fix-Encoding -path ".\frontend\src" -pattern @("*.ts", "*.tsx", "*.js", "*.jsx")
Write-Host "  $frontendFixed fichiers corrigés" -ForegroundColor Cyan

Write-Host "`n✨ Correction terminée!" -ForegroundColor Green
