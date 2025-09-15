# Test API Nutella
$body = @{ barcode = "3017620422003"; category = "food" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "https://ecolojia-backendvf.onrender.com/api/analysis" -Method POST -ContentType "application/json" -Body $body
$response | ConvertTo-Json -Depth 4

# Vérifier que les scores ne sont pas 50/50
if ($response.scores.health -eq 50 -and $response.scores.eco -eq 50) {
    Write-Host "❌ ERREUR: Scores par défaut détectés!" -ForegroundColor Red
} else {
    Write-Host "✅ Scores différenciés: Health=$($response.scores.health), Eco=$($response.scores.eco), Global=$($response.scores.global)" -ForegroundColor Green
}
