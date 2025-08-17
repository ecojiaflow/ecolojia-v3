# Script de conversion UTF-8 pour ECOLOJIA
# Convertit tous les fichiers source en UTF-8 sans BOM

Write-Host "🔄 Conversion UTF-8 en cours..." -ForegroundColor Cyan

# Conversion du frontend (dossier actuel)
$frontendFiles = Get-ChildItem -Path ".\src" -Include "*.js","*.jsx","*.ts","*.tsx","*.json" -Recurse
foreach ($file in $frontendFiles) {
    if ($file.FullName -notmatch "node_modules|dist|build") {
        try {
            $content = Get-Content $file.FullName -Raw -Encoding Default
            $utf8NoBOM = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBOM)
            Write-Host "✅ Frontend: $($file.Name)" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ Erreur: $($file.Name)" -ForegroundColor Red
        }
    }
}

# Conversion du backend
$backendPath = "..\backend"
if (Test-Path $backendPath) {
    $backendFiles = Get-ChildItem -Path $backendPath -Include "*.js","*.json" -Recurse
    foreach ($file in $backendFiles) {
        if ($file.FullName -notmatch "node_modules|dist|build") {
            try {
                $content = Get-Content $file.FullName -Raw -Encoding Default
                $utf8NoBOM = New-Object System.Text.UTF8Encoding $false
                [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBOM)
                Write-Host "✅ Backend: $($file.Name)" -ForegroundColor Green
            }
            catch {
                Write-Host "❌ Erreur: $($file.Name)" -ForegroundColor Red
            }
        }
    }
}

Write-Host "`n✨ Conversion terminée!" -ForegroundColor Yellow
Write-Host "📝 Fichiers importants convertis:" -ForegroundColor Yellow
Write-Host "  - src/i18n/locales/fr.ts" -ForegroundColor White
