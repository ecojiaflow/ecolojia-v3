Write-Host "CORRECTION DES FICHIERS .js" -ForegroundColor Cyan

$jsFiles = Get-ChildItem -Path ".\src" -Include *.js -Recurse
$fixed = 0

foreach ($file in $jsFiles) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        $original = $content
        
        # Corriger import.met ? import.meta
        $content = $content -replace 'import\.met\?', 'import.meta'
        $content = $content -replace 'import\.met ', 'import.meta '
        
        if ($content -ne $original) {
            [System.IO.File]::WriteAllText($file.FullName, $content)
            Write-Host "Corrige: $($file.Name)" -ForegroundColor Green
            $fixed++
        }
    }
    catch {
        Write-Host "Erreur avec $($file.Name): $_" -ForegroundColor Red
    }
}

Write-Host "`n$fixed fichiers .js corriges!" -ForegroundColor Green
