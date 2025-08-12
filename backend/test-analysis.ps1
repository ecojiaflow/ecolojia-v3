# PATH: backend/test-analysis.ps1
# Script de test pour le service Analysis - ECOLOJIA

# Configuration
$API_URL = "http://localhost:5001"
#$API_URL = "https://ecolojia-backendvf.onrender.com"  # Pour tester en production

Write-Host "🧪 Tests du service Analysis - ECOLOJIA" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# Test 1: Status du service
Write-Host "1️⃣ Test du status du service..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/analysis/_service/status" -Method GET
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Ping
Write-Host "2️⃣ Test du ping..." -ForegroundColor Yellow
try {
    $body = @{
        test = $true
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$API_URL/api/analysis/ping" -Method POST -Body $body -ContentType "application/json"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Analyse Food
Write-Host "3️⃣ Test analyse FOOD (Céréales chocolat)..." -ForegroundColor Yellow
try {
    $body = @{
        name = "Céréales chocolat"
        brand = "TestBrand"
        category = "food"
        ingredients = "Céréales (blé complet 35%, riz), sucre, chocolat en poudre 15% (sucre, cacao), sirop de glucose, sel, arôme naturel, vitamines (B1, B2, B6, B9, B12), fer, émulsifiant (lécithine de soja), antioxydant (E306)"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$API_URL/api/analysis/manual" -Method POST -Body $body -ContentType "application/json"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: Analyse Cosmetics
Write-Host "4️⃣ Test analyse COSMETIC (Crème visage)..." -ForegroundColor Yellow
try {
    $body = @{
        name = "Crème hydratante visage"
        brand = "BeautyTest"
        category = "cosmetic"
        ingredients = "Aqua, Glycerin, Dimethicone, Cetearyl Alcohol, Parfum, Limonene, Linalool, Methylparaben, Propylparaben, BHT, Citral, Sodium Hyaluronate, Tocopheryl Acetate"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$API_URL/api/analysis/manual" -Method POST -Body $body -ContentType "application/json"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: Analyse Detergents
Write-Host "5️⃣ Test analyse DETERGENT (Lessive liquide)..." -ForegroundColor Yellow
try {
    $body = @{
        name = "Lessive liquide concentrée"
        brand = "CleanTest"
        category = "detergent"
        ingredients = "5-15% tensioactifs anioniques, <5% tensioactifs non-ioniques, <5% savon, phosphonates, parfum (Limonene, Benzyl Salicylate), enzymes (protease, amylase), agents de blanchiment oxygénés"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$API_URL/api/analysis/manual" -Method POST -Body $body -ContentType "application/json"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
}
Write-Host ""

# Test 6: Test avec catégorie invalide
Write-Host "6️⃣ Test avec catégorie invalide..." -ForegroundColor Yellow
try {
    $body = @{
        name = "Produit test"
        category = "invalid_category"
        ingredients = "test"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$API_URL/api/analysis/manual" -Method POST -Body $body -ContentType "application/json"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Erreur attendue: $_" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "✅ Tests terminés !" -ForegroundColor Green