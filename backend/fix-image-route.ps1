$file = "src\routes\algolia-unified.js"
$content = Get-Content $file -Raw

# Remplacer la ligne qui utilise hit.imageUrl par hit.images?.[0]
$oldPattern = "imageUrl: hit\.imageUrl \|\| hit\.image_url \|\| '/images/default-product\.jpg'"
$newPattern = "imageUrl: hit.images?.[0] || hit.imageUrl || hit.image_url || '/images/default-product.jpg'"

$content = $content -replace $oldPattern, $newPattern

$content | Out-File -FilePath $file -Encoding UTF8 -NoNewline
Write-Host "✅ Route corrigée pour utiliser hit.images[0]" -ForegroundColor Green
