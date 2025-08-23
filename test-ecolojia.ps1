# Test-Ecolojia-Complete.ps1
param(
    [string]$BackendUrl = "http://localhost:10000",
    [string]$FrontendUrl = "http://localhost:5173"
)

Write-Host "`n🚀 ECOLOJIA - Test de validation complète`n" -ForegroundColor Cyan

# Vérifier si le backend est lancé
Write-Host "1️⃣ Test du backend..." -ForegroundColor Yellow
try {
    $null = Invoke-RestMethod -Uri "$BackendUrl/api/health" -Method GET -TimeoutSec 2
    Write-Host "✅ Backend accessible" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Backend non accessible - Assurez-vous qu'il est lancé sur le port 10000" -ForegroundColor Red
    Write-Host "   Lancez: cd backend && npm start" -ForegroundColor Yellow
}

# Vérifier si le frontend est lancé
Write-Host "`n2️⃣ Test du frontend..." -ForegroundColor Yellow
try {
    $null = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing -TimeoutSec 2
    Write-Host "✅ Frontend accessible" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Frontend non accessible - Assurez-vous qu'il est lancé sur le port 5173" -ForegroundColor Red
    Write-Host "   Lancez: cd frontend && npm run dev" -ForegroundColor Yellow
}

Write-Host "`n✅ Test terminé!" -ForegroundColor Green
Write-Host "`n📝 Pour lancer l'application complète:" -ForegroundColor Cyan
Write-Host "   1. Terminal 1: cd backend && npm start" -ForegroundColor White
Write-Host "   2. Terminal 2: cd frontend && npm run dev" -ForegroundColor White
Write-Host "   3. Ouvrir: http://localhost:5173" -ForegroundColor White
