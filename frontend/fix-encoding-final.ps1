# Sauvegarde d'abord
$backupDir = ".\backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force
Copy-Item -Path ".\src" -Destination $backupDir -Recurse

Write-Host "CORRECTION DEFINITIVE DE L'ENCODAGE" -ForegroundColor Cyan

# Fonction de correction s?re
function Fix-FileEncoding {
    param($Path)
    
    try {
        # Lire en tant que bytes pour pr?server le contenu
        $bytes = [System.IO.File]::ReadAllBytes($Path)
        $text = [System.Text.Encoding]::UTF8.GetString($bytes)
        
        # Corrections des caract?res corrompus
        $replacements = @{
            "??" = "?"
            "??" = "?"
            "? " = "?"
            "??" = "?"
            "??" = "?"
            "??" = "?"
            "??" = "?"
            "??" = "?"
            "???" = "'"
            "???" = '"'
            "??" = '"'
            "??"" = "?"
            "? " = " "
        }
        
        foreach ($key in $replacements.Keys) {
            $text = $text -replace [regex]::Escape($key), $replacements[$key]
        }
        
        # Corriger les op?rateurs ternaires mal convertis
        # Pattern: variable a 'value' ? variable ? 'value'
        $text = $text -replace '(\w+)\s+a\s+([''"])', '$1 ? $2'
        $text = $text -replace '(\))\s+a\s+([''"])', '$1 ? $2'
        
        # Corriger les optional chaining mal convertis
        $text = $text -replace '(\w+)a\.', '$1?.'
        $text = $text -replace '\.a\.', '?.'
        
        # Corriger sp?cifiquement const ? = 
        $text = $text -replace 'const \?\s*=', 'const link ='
        $text = $text -replace '(let|var)\s+\?\s*=', '$1 link ='
        
        # Sauvegarder en UTF-8 sans BOM
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($Path, $text, $utf8NoBom)
        
        return $true
    } catch {
        Write-Host "Erreur avec $Path : $_" -ForegroundColor Red
        return $false
    }
}

# Appliquer ? tous les fichiers
$files = Get-ChildItem -Path ".\src" -Include *.ts,*.tsx,*.js,*.jsx -Recurse
$success = 0
$failed = 0

foreach ($file in $files) {
    Write-Host "Traitement: $($file.Name)" -NoNewline
    if (Fix-FileEncoding -Path $file.FullName) {
        Write-Host " [OK]" -ForegroundColor Green
        $success++
    } else {
        Write-Host " [ERREUR]" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`nR?sum?: $success fichiers corrig?s, $failed erreurs" -ForegroundColor Yellow
Write-Host "Backup cr?? dans: $backupDir" -ForegroundColor Cyan
