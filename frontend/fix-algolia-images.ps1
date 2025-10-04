$file = "frontend\src\components\AlgoliaProductCard.tsx"
$content = Get-Content $file -Raw

# Chercher la balise img sans onError
$pattern = '(<img\s+src=\{hit\.images\[0\]\}\s+alt=\{hit\.title\}\s+className="[^"]+"\s+)(/?>)'

# Ajouter onError avant la fermeture
$replacement = '$1onError={(e) => { const target = e.target as HTMLImageElement; target.src = ''/placeholder-image.jpg''; }} $2'

$newContent = $content -replace $pattern, $replacement

if ($newContent -eq $content) {
    Write-Host "❌ Pattern non trouvé" -ForegroundColor Red
    exit
}

$newContent | Out-File -FilePath $file -Encoding UTF8 -NoNewline
Write-Host "✅ onError handler ajouté à AlgoliaProductCard" -ForegroundColor Green
