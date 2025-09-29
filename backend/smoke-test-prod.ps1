# ============================================
# ECOLOJIA V3 - Smoke Test Production
# ============================================

Write-Host ""
Write-Host "ECOLOJIA V3 - Test de sante Production" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "https://ecolojia-backendvf.onrender.com"
$frontUrl = "https://frontendvf.netlify.app"
$allPassed = $true

# ============================================
# Test 1 : Backend Health
# ============================================
Write-Host "Test 1/3 : Backend Health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get -TimeoutSec 30
    if ($response.status -eq "healthy" -and $response.database -eq "connected") {
        Write-Host "   [OK] Backend Health - Version $($response.version)" -ForegroundColor Green
        Write-Host "   Database: $($response.database)" -ForegroundColor Gray
    } else {
        Write-Host "   [ERREUR] Backend Health: etat inattendu" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "   [ERREUR] Backend Health: $($_.Exception.Message)" -ForegroundColor Red
    $allPassed = $false
}

# ============================================
# Test 2 : Recherche Algolia
# ============================================
Write-Host ""
Write-Host "Test 2/3 : Recherche Algolia..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/algolia/search?q=nutella" -Method Get -TimeoutSec 30
    if ($response.success -and $response.data.products.Count -gt 0) {
        $count = $response.data.products.Count
        Write-Host "   [OK] Recherche Algolia - $count resultats" -ForegroundColor Green
        Write-Host "   Premier produit: $($response.data.products[0].name)" -ForegroundColor Gray
    } else {
        Write-Host "   [ERREUR] Recherche Algolia: aucun resultat" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "   [ERREUR] Recherche Algolia: $($_.Exception.Message)" -ForegroundColor Red
    $allPassed = $false
}

# ============================================
# Test 3 : Frontend
# ============================================
Write-Host ""
Write-Host "Test 3/3 : Frontend Netlify..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $frontUrl -Method Get -TimeoutSec 30 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "   [OK] Frontend accessible - HTTP $($response.StatusCode)" -ForegroundColor Green
    } else {
        Write-Host "   [ATTENTION] Frontend: code HTTP $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   [ERREUR] Frontend: $($_.Exception.Message)" -ForegroundColor Red
    $allPassed = $false
}

# ============================================
# Resumé
# ============================================
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "[SUCCESS] TOUS LES TESTS SONT PASSES" -ForegroundColor Green
    Write-Host "Production prete pour release!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[FAILED] CERTAINS TESTS ONT ECHOUE" -ForegroundColor Red
    Write-Host "Verifier les logs ci-dessus" -ForegroundColor Red
    exit 1
}