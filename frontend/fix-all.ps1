Write-Host "REPARATION COMPLETE DU PROJET" -ForegroundColor Cyan

# 1. Corriger les operateurs ternaires casses
$files = Get-ChildItem -Path ".\src" -Include *.tsx,*.ts,*.jsx,*.js -Recurse
$count = 0

foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        $original = $content
        
        # Corrections
        $content = $content -replace ' a ', ' ? '
        $content = $content -replace '\.a\.', '?.'
        $content = $content -replace 'a\.', '?.'
        $content = $content -replace ' a\(', ' ?('
        
        # Supprimer les caracteres invisibles
        $content = $content -replace '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', ''
        
        if ($content -ne $original) {
            [System.IO.File]::WriteAllText($file.FullName, $content)
            Write-Host "Corrige: $($file.Name)" -ForegroundColor Green
            $count++
        }
    } catch {
        Write-Host "Erreur avec $($file.Name): $_" -ForegroundColor Red
    }
}

Write-Host "$count fichiers corriges!" -ForegroundColor Green
