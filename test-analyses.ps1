# Test des endpoints d'analyse
Write-Host "`n🧪 Test des analyses ECOLOJIA`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:10000/api"

# Test 1: Alimentaire
Write-Host "1️⃣ Test analyse alimentaire..." -ForegroundColor Yellow
try {
    $body = @{
        mode = "manual"
        name = "Yaourt nature bio"
        ingredients = "Lait entier bio, ferments lactiques"
        category = "food"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/analysis" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Alimentaire OK - Score: $($response.globalScore)/100" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur alimentaire: $_" -ForegroundColor Red
}

# Test 2: Cosmétique
Write-Host "`n2️⃣ Test analyse cosmétique..." -ForegroundColor Yellow
try {
    $body = @{
        name = "Creme visage bio"
        ingredients = "AQUA, GLYCERIN, TOCOPHEROL"
        language = "fr"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/cosmetics/analyze" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Cosmétique OK - Score: $($response.score.value)/100" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur cosmétique: $_" -ForegroundColor Red
}

# Test 3: Détergent
Write-Host "`n3️⃣ Test analyse détergent..." -ForegroundColor Yellow
try {
    $body = @{
        name = "Lessive ecologique"
        composition = "5-15% savon, agents de surface vegetaux"
        language = "fr"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/detergents/analyze" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Détergent OK - Score: $($response.score.value)/100" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur détergent: $_" -ForegroundColor Red
}

Write-Host "`n✅ Tests terminés!" -ForegroundColor Green
