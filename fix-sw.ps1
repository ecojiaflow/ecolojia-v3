$file = "frontend\index.html"
$content = Get-Content $file -Raw

# Remplacer l'enregistrement inconditionnel par une version qui respecte l'env
$oldPattern = "if \('serviceWorker' in navigator\) \{\s+navigator\.serviceWorker\.register\('/sw\.js'\);"
$newPattern = @"
if ('serviceWorker' in navigator && import.meta.env.PROD) {
        navigator.serviceWorker.register('/sw.js');
"@

$newContent = $content -replace $oldPattern, $newPattern

if ($newContent -eq $content) {
    Write-Host "⚠️ Pattern non trouvé, modification manuelle requise" -ForegroundColor Yellow
} else {
    $newContent | Out-File -FilePath $file -Encoding UTF8 -NoNewline
    Write-Host "✅ Service Worker désactivé en dev" -ForegroundColor Green
}
