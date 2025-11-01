# Test API Alternatives avec vrai produit
$baseUrl = "http://localhost:10000"

Write-Host "`n🔍 TEST ALTERNATIVES AVEC PRODUIT RÉEL`n" -ForegroundColor Cyan

# Étape 1 : Chercher un produit
Write-Host "1. Recherche produit..." -ForegroundColor Yellow
try {
    $products = Invoke-RestMethod -Uri "$baseUrl/api/products?limit=1" -TimeoutSec 10
    $product = $products[0]
    
    Write-Host "   ✅ Produit : $($product.name)" -ForegroundColor Green
    Write-Host "   ID : $($product._id)" -ForegroundColor Gray
    Write-Host "   Score : $($product.scores.global)/100`n" -ForegroundColor Gray
    
    # Étape 2 : Chercher alternatives
    Write-Host "2. Recherche alternatives..." -ForegroundColor Yellow
    $result = Invoke-RestMethod -Uri "$baseUrl/api/alternatives/$($product._id)" -TimeoutSec 30
    
    Write-Host "   ✅ Source : $($result.source)" -ForegroundColor Green
    Write-Host "   Alternatives : $($result.alternatives.Count)" -ForegroundColor White
    Write-Host "   Durée : $($result.metrics.duration)ms" -ForegroundColor Gray
    Write-Host "   DB hits : $($result.metrics.dbHits)" -ForegroundColor Gray
    Write-Host "   AI hits : $($result.metrics.aiHits)`n" -ForegroundColor Gray
    
    if ($result.alternatives.Count -gt 0) {
        Write-Host "🎯 ALTERNATIVES :`n" -ForegroundColor Cyan
        $i = 1
        foreach ($alt in $result.alternatives) {
            Write-Host "   $i. $($alt.name) - Score: $($alt.scores.global)/100" -ForegroundColor White
            $i++
        }
    } else {
        Write-Host "   ⚠️ Aucune alternative trouvée" -ForegroundColor Yellow
    }
    
    Write-Host "`n✅ TEST TERMINÉ !`n" -ForegroundColor Green
    
} catch {
    Write-Host "   ❌ Erreur : $($_.Exception.Message)`n" -ForegroundColor Red
}
