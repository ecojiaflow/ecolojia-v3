Write-Host "NETTOYAGE DE L'ENCODAGE" -ForegroundColor Yellow

$files = Get-ChildItem -Path ".\src" -Include *.ts,*.tsx,*.js,*.jsx -Recurse

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $original = $content
    
    # Remplacements simples
    $content = $content -replace "??", "e"
    $content = $content -replace "??", "e"
    $content = $content -replace "? ", "a"
    $content = $content -replace "??", "o"
    $content = $content -replace "??", "c"
    $content = $content -replace "??", "u"
    $content = $content -replace "??", "i"
    $content = $content -replace "??", "E"
    $content = $content -replace "??", "E"
    $content = $content -replace "??", "A"
    $content = $content -replace "??", "C"
    
    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $content)
        Write-Host "OK: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "TERMINE!" -ForegroundColor Green
