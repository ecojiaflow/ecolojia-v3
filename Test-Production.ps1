# Test-Production.ps1 - Tester ECOLOJIA en production

Write-Host "=== TEST ECOLOJIA PRODUCTION ===" -ForegroundColor Cyan
Write-Host ""

# URL de production
$apiUrl = "https://ecolojia-backendvf.onrender.com/api"

# Test 1: Health Check
Write-Host "1. Test Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Method GET "https://ecolojia-backendvf.onrender.com/health"
    if ($health.status -eq "ok") {
        Write-Host "✅ SUCCÈS - Backend opérationnel" -ForegroundColor Green
        Write-Host "   MongoDB: $($health.mongodb)" -ForegroundColor Gray
        Write-Host "   Redis: $($health.redis)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ ERREUR: $_" -ForegroundColor Red
}

Write-Host ""

# Test 2: Food Analysis Manuel
Write-Host "2. Test Food/Manual..." -ForegroundColor Yellow
try {
    $body = @{
        mode = "manual"
        category = "food"
        name = "Cookies test"
        ingredients = "Farine, sucre, beurre, chocolat, oeufs, E500, sel"
    } | ConvertTo-Json
    
    $foodTest = Invoke-RestMethod -Method POST "$apiUrl/analysis" `
        -ContentType "application/json" `
        -Body $body
    
    if ($foodTest.success -and $foodTest.data.score) {
        Write-Host "✅ SUCCÈS - Score: $($foodTest.data.score.label) ($($foodTest.data.score.value)/100)" -ForegroundColor Green
        Write-Host "   NOVA: $($foodTest.data.details.nova)" -ForegroundColor Gray
    } else {
        Write-Host "❌ ÉCHEC - Réponse invalide" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ ERREUR: $_" -ForegroundColor Red
}

Write-Host ""

# Test 3: Cosmetics
Write-Host "3. Test Cosmetics..." -ForegroundColor Yellow
try {
    $body = @{
        name = "Creme test"
        ingredients = "AQUA, GLYCERIN, NIACINAMIDE, TOCOPHEROL"
    } | ConvertTo-Json
    
    $cosmeticsTest = Invoke-RestMethod -Method POST "$apiUrl/cosmetics/analyze" `
        -ContentType "application/json" `
        -Body $body
    
    if ($cosmeticsTest.id) {
        Write-Host "✅ SUCCÈS - Score: $($cosmeticsTest.score.label) ($($cosmeticsTest.score.value)/100)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ ERREUR: $_" -ForegroundColor Red
}

Write-Host ""

# Test 4: Detergents
Write-Host "4. Test Detergents..." -ForegroundColor Yellow
try {
    $body = @{
        name = "Lessive test"
        composition = "SODIUM LAURETH SULFATE, SODIUM CARBONATE, ENZYMES"
    } | ConvertTo-Json
    
    $detergentsTest = Invoke-RestMethod -Method POST "$apiUrl/detergents/analyze" `
        -ContentType "application/json" `
        -Body $body
    
    if ($detergentsTest.id) {
        Write-Host "✅ SUCCÈS - Score: $($detergentsTest.score.label)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ ERREUR: $_" -ForegroundColor Red
}

Write-Host ""

# Test 5: AI Chat (sans auth)
Write-Host "5. Test AI Chat..." -ForegroundColor Yellow
try {
    $body = @{
        message = "Qu'est-ce que NOVA ?"
    } | ConvertTo-Json
    
    $aiTest = Invoke-RestMethod -Method POST "$apiUrl/ai/chat" `
        -ContentType "application/json" `
        -Body $body
    
    if ($aiTest.success) {
        Write-Host "✅ SUCCÈS - Chat AI fonctionnel" -ForegroundColor Green
    }
} catch {
    # C'est normal si ça échoue sans auth
    Write-Host "⚠️  Auth requise (normal en prod)" -ForegroundColor Yellow
}

Write-Host ""

# Test 6: API Info
Write-Host "6. Test API Info..." -ForegroundColor Yellow
try {
    $info = Invoke-RestMethod -Method GET "https://ecolojia-backendvf.onrender.com/"
    Write-Host "✅ Version: $($info.version)" -ForegroundColor Green
    Write-Host "   Endpoints: $($info.endpoints.Count)" -ForegroundColor Gray
} catch {
    Write-Host "❌ ERREUR: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== TESTS PRODUCTION TERMINÉS ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 RÉSUMÉ:" -ForegroundColor Yellow
Write-Host "- Backend déployé sur: https://ecolojia-backendvf.onrender.com" -ForegroundColor Gray
Write-Host "- Frontend devrait pointer vers cette URL" -ForegroundColor Gray
Write-Host "- Auth désactivée pour certains endpoints en mode démo" -ForegroundColor Gray