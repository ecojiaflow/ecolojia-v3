# Test-Fixes.ps1 - Tester les corrections ECOLOJIA

Write-Host "=== TEST DES CORRECTIONS ECOLOJIA ===" -ForegroundColor Cyan
Write-Host ""

$apiUrl = "http://localhost:10000/api"

# Test 1: Food Analysis Manuel (le bug principal)
Write-Host "1. Test Food/Manual (sans barcode)..." -ForegroundColor Yellow
try {
    $body = @{
        mode = "manual"
        category = "food"
        name = "Cookies au chocolat"
        ingredients = "Farine de ble, sucre, beurre, chocolat noir 20% (pate de cacao, sucre, beurre de cacao), oeufs, poudre a lever (E500), sel, arome vanille"
    } | ConvertTo-Json
    
    $foodTest = Invoke-RestMethod -Method POST "$apiUrl/analysis" `
        -ContentType "application/json" `
        -Body $body
    
    if ($foodTest.success -and $foodTest.data.score) {
        Write-Host "✅ SUCCÈS - Score: $($foodTest.data.score.label) ($($foodTest.data.score.value)/100)" -ForegroundColor Green
        Write-Host "   NOVA: $($foodTest.data.details.nova)" -ForegroundColor Gray
        Write-Host "   Risques: $($foodTest.data.risks.Count)" -ForegroundColor Gray
    } else {
        Write-Host "❌ ÉCHEC - Réponse invalide" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ ERREUR: $_" -ForegroundColor Red
}

Write-Host ""

# Test 2: AI Chat
Write-Host "2. Test AI Chat..." -ForegroundColor Yellow
try {
    $body = @{
        message = "Qu'est-ce que le score NOVA ?"
        context = @{
            productName = "Cookies"
        }
    } | ConvertTo-Json
    
    $aiTest = Invoke-RestMethod -Method POST "$apiUrl/ai/chat" `
        -ContentType "application/json" `
        -Body $body
    
    if ($aiTest.success -and $aiTest.response) {
        Write-Host "✅ SUCCÈS - Réponse reçue" -ForegroundColor Green
        Write-Host "   Début: $($aiTest.response.Substring(0, [Math]::Min(100, $aiTest.response.Length)))..." -ForegroundColor Gray
    } else {
        Write-Host "❌ ÉCHEC - Pas de réponse" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ ERREUR: $_" -ForegroundColor Red
}

Write-Host ""

# Test 3: Health endpoints
Write-Host "3. Test Health Endpoints..." -ForegroundColor Yellow
$healthEndpoints = @("/ai/health", "/cosmetics/health", "/detergents/health")

foreach ($endpoint in $healthEndpoints) {
    try {
        $health = Invoke-RestMethod -Method GET "$apiUrl$endpoint"
        if ($health.status -eq "operational") {
            Write-Host "   ✅ $endpoint - OK" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $endpoint - Non opérationnel" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ $endpoint - Erreur: $_" -ForegroundColor Red
    }
}

Write-Host ""

# Test 4: Cosmetics (pour vérifier que ça marche toujours)
Write-Host "4. Test Cosmetics..." -ForegroundColor Yellow
try {
    $body = @{
        name = "Creme visage"
        ingredients = "AQUA, GLYCERIN, NIACINAMIDE, TOCOPHEROL, PARFUM, LIMONENE"
    } | ConvertTo-Json
    
    $cosmeticsTest = Invoke-RestMethod -Method POST "$apiUrl/cosmetics/analyze" `
        -ContentType "application/json" `
        -Body $body
    
    if ($cosmeticsTest.id) {
        Write-Host "✅ SUCCÈS - Score: $($cosmeticsTest.score.label)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ ERREUR: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== TESTS TERMINES ===" -ForegroundColor Cyan