Write-Host "🔍 DIAGNOSTIC ECOLOJIA OCR ROUTES" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# 1. Vérifier les fichiers
Write-Host "`n📁 Vérification des fichiers:" -ForegroundColor Yellow
$files = @(
    "src/server.js",
    "src/routes/vision.routes.js", 
    "src/services/vision/ProductOCRService.js",
    "src/services/vision/VisionService.js"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✅ $file existe" -ForegroundColor Green
    } else {
        Write-Host "❌ $file MANQUANT" -ForegroundColor Red
    }
}

# 2. Vérifier le montage des routes
Write-Host "`n🔗 Montage des routes vision:" -ForegroundColor Yellow
$visionMount = Select-String -Path "src/server.js" -Pattern "app\.use\(.*/api/vision.*\)" -AllMatches
if ($visionMount) {
    foreach ($match in $visionMount) {
        Write-Host "Ligne $($match.LineNumber): $($match.Line.Trim())" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ Routes vision non montées!" -ForegroundColor Red
}

# 3. Vérifier l'ordre des middlewares
Write-Host "`n📋 Ordre des middlewares:" -ForegroundColor Yellow
$middlewares = Select-String -Path "src/server.js" -Pattern "app\.use\(.*(cors|body|json|auth|vision)" | Select-Object -First 10
foreach ($mw in $middlewares) {
    Write-Host "L$($mw.LineNumber): $($mw.Line.Trim())"
}

# 4. Tester le serveur
Write-Host "`n🌐 Test du serveur:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5001/api/health" -Method GET -ErrorAction Stop
    Write-Host "✅ Serveur accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ Serveur non accessible sur le port 5001" -ForegroundColor Red
}

Write-Host "`n💡 Recommandations:" -ForegroundColor Magenta
Write-Host "1. Vérifier que le serveur tourne sur le port 5001"
Write-Host "2. S'assurer que authMiddleware n'est pas appliqué deux fois"
Write-Host "3. Redémarrer le serveur après modifications"
