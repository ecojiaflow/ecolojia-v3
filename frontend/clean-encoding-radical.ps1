Write-Host "?? NETTOYAGE RADICAL DE L'ENCODAGE" -ForegroundColor Red

# Fonction de nettoyage agressif
function Clean-Encoding {
    param($content)
    
    # Remplacer TOUS les caract?res non-ASCII par des ?quivalents
    $content = $content -replace '[???]', 'a'
    $content = $content -replace '[????]', 'e'
    $content = $content -replace '[??]', 'i'
    $content = $content -replace '[??]', 'o'
    $content = $content -replace '[???]', 'u'
    $content = $content -replace '?', 'c'
    $content = $content -replace '[???]', 'A'
    $content = $content -replace '[????]', 'E'
    $content = $content -replace '[??]', 'I'
    $content = $content -replace '[??]', 'O'
    $content = $content -replace '[???]', 'U'
    $content = $content -replace '?', 'C'
    $content = $content -replace '?', 'n'
    $content = $content -replace '?', 'N'
    
    # Supprimer tous les autres caract?res non-ASCII
    $content = $content -replace '[^\x00-\x7F]', ''
    
    return $content
}

# Nettoyer TOUS les fichiers
$files = Get-ChildItem -Path ".\src" -Include *.ts,*.tsx,*.js,*.jsx -Recurse
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $cleaned = Clean-Encoding $content
    if ($content -ne $cleaned) {
        [System.IO.File]::WriteAllText($file.FullName, $cleaned, [System.Text.Encoding]::ASCII)
        Write-Host "? Nettoy?: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`n? TERMIN?! Plus AUCUN caract?re sp?cial!" -ForegroundColor Green
