Write-Host "`n=== TEST COMPLET ECOLOJIA ===" -ForegroundColor Green

$baseUrl = "https://frontendvf.netlify.app"
$apiUrl = "https://ecolojia-backendvf.onrender.com"

# 1. Frontend accessible
try {
    $web = Invoke-WebRequest -Uri $baseUrl -UseBasicParsing
    Write-Host "✅ Frontend accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend inaccessible" -ForegroundColor Red
}

# 2. API santé
try {
    $health = Invoke-RestMethod -Uri "$apiUrl/health"
    Write-Host "✅ API Backend OK" -ForegroundColor Green
} catch {
    Write-Host "❌ API Backend HS" -ForegroundColor Red
}

# 3. Test recherche
try {
    $search = Invoke-RestMethod -Uri "$apiUrl/api/products/search?q=bio&limit=5"
    Write-Host "✅ Recherche produits OK" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Recherche produits KO" -ForegroundColor Yellow
}

Write-Host "`n🌐 Ouverture du site..." -ForegroundColor Cyan
Start-Process $baseUrl
