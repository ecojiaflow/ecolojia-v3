# Test détaillé des analyses ECOLOJIA
Write-Host "`n🧪 Test détaillé des analyses ECOLOJIA`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:10000/api"

# Test 1: Alimentaire
Write-Host "1️⃣ ANALYSE ALIMENTAIRE" -ForegroundColor Yellow
Write-Host "========================" -ForegroundColor Yellow
try {
    $body = @{
        mode = "manual"
        name = "Yaourt nature bio"
        ingredients = "Lait entier bio, ferments lactiques"
        category = "food"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/analysis" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "✅ Réponse reçue:" -ForegroundColor Green
    Write-Host "   - Score global: $($response.globalScore)/100" -ForegroundColor White
    Write-Host "   - NOVA: $($response.scores.nova)" -ForegroundColor White
    Write-Host "   - Nutri-Score: $($response.scores.nutriscore)" -ForegroundColor White
    Write-Host "   - Confiance: $($response.confidence)" -ForegroundColor White
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
}

# Test 2: Cosmétique
Write-Host "`n2️⃣ ANALYSE COSMÉTIQUE" -ForegroundColor Yellow
Write-Host "======================" -ForegroundColor Yellow
try {
    $body = @{
        name = "Creme visage bio"
        ingredients = "AQUA, GLYCERIN, TOCOPHEROL"
        language = "fr"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/cosmetics/analyze" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "✅ Réponse reçue:" -ForegroundColor Green
    if ($response.score) {
        Write-Host "   - Score: $($response.score.value)/100 ($($response.score.label))" -ForegroundColor White
    } elseif ($response.healthScore) {
        Write-Host "   - Score santé: $($response.healthScore)/100" -ForegroundColor White
    }
    if ($response.risks) {
        Write-Host "   - Risques: $($response.risks.Count)" -ForegroundColor White
    }
    if ($response.recommendations) {
        Write-Host "   - Recommandations: $($response.recommendations.Count)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
}

# Test 3: Détergent
Write-Host "`n3️⃣ ANALYSE DÉTERGENT" -ForegroundColor Yellow
Write-Host "=====================" -ForegroundColor Yellow
try {
    $body = @{
        name = "Lessive ecologique"
        composition = "5-15% savon, agents de surface vegetaux"
        language = "fr"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/detergents/analyze" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "✅ Réponse reçue:" -ForegroundColor Green
    if ($response.score) {
        Write-Host "   - Score: $($response.score.value)/100 ($($response.score.label))" -ForegroundColor White
    } elseif ($response.environmentScore) {
        Write-Host "   - Score environnement: $($response.environmentScore)/100" -ForegroundColor White
    }
    if ($response.risks) {
        Write-Host "   - Risques: $($response.risks.Count)" -ForegroundColor White
    }
    if ($response.recommendations) {
        Write-Host "   - Recommandations: $($response.recommendations.Count)" -ForegroundColor White
    }
    
    # Afficher la structure complète pour debug
    Write-Host "`n📋 Structure de réponse:" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
}

Write-Host "`n✅ Tests terminés!" -ForegroundColor Green
