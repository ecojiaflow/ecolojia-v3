Write-Host "`n?? TEST AUTOMATIQUE ECOLOJIA SCANNER" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta

# Vérifier processus
Write-Host "1?? Vérification processus Node.js..." -ForegroundColor Cyan
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses.Count -ge 2) {
    Write-Host "   ? Backend et Frontend actifs ($($nodeProcesses.Count) processus)" -ForegroundColor Green
} else {
    Write-Host "   ?? Seulement $($nodeProcesses.Count) processus Node" -ForegroundColor Yellow
}

# Test API
Write-Host "`n2?? Test API Backend..." -ForegroundColor Cyan
try {
    $apiTest = Invoke-RestMethod -Uri "http://localhost:10000/api/products/3017620422003" -Method Get -TimeoutSec 5
    Write-Host "   ? API répond: $($apiTest.product.name)" -ForegroundColor Green
    $testProductId = $apiTest.product._id
} catch {
    Write-Host "   ? API non accessible" -ForegroundColor Red
    exit
}

# Test Frontend
Write-Host "`n3?? Test Frontend..." -ForegroundColor Cyan
try {
    $frontTest = Invoke-WebRequest -Uri "http://localhost:5173" -Method Get -TimeoutSec 5 -UseBasicParsing
    Write-Host "   ? Frontend accessible (Status: $($frontTest.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ? Frontend non accessible" -ForegroundColor Red
    exit
}

# Ouvrir navigateur avec tests
Write-Host "`n4?? Lancement tests navigateur..." -ForegroundColor Cyan
Write-Host "   ?? Ouverture page scan..." -ForegroundColor Yellow
Start-Process "http://localhost:5173/scan"

Start-Sleep -Seconds 2

Write-Host "   ?? Ouverture page produit directe..." -ForegroundColor Yellow
Start-Process "http://localhost:5173/product/$testProductId"

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "?? INSTRUCTIONS:" -ForegroundColor Cyan
Write-Host "1. Ouvre DevTools (F12) sur la page /scan" -ForegroundColor White
Write-Host "2. Va dans l'onglet Console" -ForegroundColor White
Write-Host "3. Clique 'Scanner le code-barres'" -ForegroundColor White
Write-Host "4. Scanne le code 3017620422003" -ForegroundColor White
Write-Host "5. Observe les logs [DEBUG] dans la console" -ForegroundColor White
Write-Host "6. Tu devrais voir une ALERTE popup 'Code détecté'" -ForegroundColor White
Write-Host "`n7. Copie-colle TOUS les logs console ici après le scan" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Magenta
