Write-Host '=== ECOLOJIA - Verification du projet ===' -ForegroundColor Green

# 1. Vérifier les routes backend
Write-Host "`n[1] Routes backend:" -ForegroundColor Yellow
$routesPath = '.\backend\src\routes'
$requiredRoutes = @('analysis.routes.js', 'auth.js', 'dashboard.js', 'payment.routes.js', 'gdpr.routes.js')
foreach ($route in $requiredRoutes) {
    if (Test-Path "$routesPath\$route") {
        Write-Host "  ✓ $route" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $route MANQUANT!" -ForegroundColor Red
    }
}

# 2. Vérifier le service d'analyse
Write-Host "`n[2] Service analyse:" -ForegroundColor Yellow
if (Test-Path '.\backend\src\services\analysis\index.js') {
    Write-Host '  ✓ Service analysis/index.js présent' -ForegroundColor Green
} else {
    Write-Host '  ✗ Service analysis/index.js MANQUANT!' -ForegroundColor Red
}

# 3. Vérifier les variables d'environnement
Write-Host "`n[3] Configuration:" -ForegroundColor Yellow
if (Test-Path '.\backend\.env.example') {
    Write-Host '  ✓ .env.example présent' -ForegroundColor Green
} else {
    Write-Host '  ✗ .env.example MANQUANT!' -ForegroundColor Red
}

# 4. Vérifier les dépendances
Write-Host "`n[4] Dépendances:" -ForegroundColor Yellow
if (Test-Path '.\backend\node_modules') {
    Write-Host '  ✓ Backend node_modules OK' -ForegroundColor Green
} else {
    Write-Host '  ⚠ Backend: npm install nécessaire' -ForegroundColor Yellow
}

if (Test-Path '.\frontend\node_modules') {
    Write-Host '  ✓ Frontend node_modules OK' -ForegroundColor Green
} else {
    Write-Host '  ⚠ Frontend: npm install nécessaire' -ForegroundColor Yellow
}

Write-Host "`n=== Verification terminée ===" -ForegroundColor Green
