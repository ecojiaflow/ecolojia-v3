# Script de correction d'encodage
$files = Get-ChildItem -Path . -Include *.ts,*.tsx,*.js,*.jsx,*.json -Recurse
$count = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $newContent = $content
    
    # Pattern pour d?tecter les caract?res corrompus
    if ($content -match '[\xC0-\xFF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\xF0-\xF7][\x80-\xBF]{3}') {
        Write-Host "Probleme trouve dans: $($file.Name)" -ForegroundColor Yellow
        
        # Corrections sp?cifiques
        $newContent = $newContent -replace 'beaut\xC3\x83\xC2\xA9', 'beaut?'
        $newContent = $newContent -replace 'Beaut\xC3\x83\xC2\xA9', 'Beaut?'
        $newContent = $newContent -replace 'beaut\xC3\xA9', 'beaut?'
        $newContent = $newContent -replace 'Beaut\xC3\xA9', 'Beaut?'
        
        # Correction pour ?lectronique (plusieurs variantes possibles)
        $newContent = $newContent -replace '\xC3\x83\xC6\x92\xC3\x86\xE2\x80\x99\xC3\x83\xC2\xA2\xC3\xA2\xE2\x80\x9A\xC2\xAC\xC3\x82\xC2\xB0lectronique', '?lectronique'
        $newContent = $newContent -replace '\xC3\x83\xC6\x92\xC3\xA2\xE2\x82\xAC\xC2\xB0lectronique', '?lectronique'
        $newContent = $newContent -replace '\xC3\x89lectronique', '?lectronique'
        
        # Sauvegarder si modifi?
        if ($content -ne $newContent) {
            [System.IO.File]::WriteAllText($file.FullName, $newContent, [System.Text.UTF8Encoding]::new($false))
            Write-Host "Corrige: $($file.Name)" -ForegroundColor Green
            $count++
        }
    }
}

Write-Host "Total: $count fichiers corriges" -ForegroundColor Cyan
