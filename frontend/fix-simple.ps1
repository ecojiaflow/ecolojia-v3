Write-Host "CORRECTION DES FICHIERS" -ForegroundColor Yellow

# Backup
$backup = ".\backup_$(Get-Date -Format 'yyyyMMddHHmmss')"
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item -Path ".\src" -Destination $backup -Recurse

$files = Get-ChildItem -Path ".\src" -Include *.ts,*.tsx,*.js,*.jsx -Recurse
$count = 0

foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw
        $original = $content
        
        # Remplacements simples
        $content = $content -replace "const \? =", "const link ="
        $content = $content -replace "\?\.href", "link.href"
        $content = $content -replace "\?\.download", "link.download"
        $content = $content -replace "\?\.click", "link.click"
        
        # Corriger les proprietes mal nommees
        $content = $content -replace "dataa:", "data?:"
        $content = $content -replace "loadinga:", "loading?:"
        $content = $content -replace "errora:", "error?:"
        $content = $content -replace "branda:", "brand?:"
        $content = $content -replace "evidencea:", "evidence?:"
        $content = $content -replace "visionDat\?", "visionData?"
        
        # Corriger les operateurs ternaires
        $content = $content -replace "(\w+)\s+a\s+'", "`$1 ? '"
        $content = $content -replace "dat\?\.", "data?."
        
        if ($content -ne $original) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8
            Write-Host "Corrige: $($file.Name)" -ForegroundColor Green
            $count++
        }
    } catch {
        Write-Host "Erreur: $($file.Name) - $_" -ForegroundColor Red
    }
}

Write-Host "$count fichiers corriges" -ForegroundColor Green
Write-Host "Backup dans: $backup" -ForegroundColor Cyan
