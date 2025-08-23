Write-Host "🧪 TEST RAPIDE ECOLOJIA (Sans Auth)" -ForegroundColor Cyan

$tests = @(
    @{
        Name = "Yaourt Bio"
        Endpoint = "http://localhost:10000/api/analysis"
        Body = @{
            mode = "manual"
            name = "Yaourt nature bio"
            ingredients = "Lait bio, ferments lactiques"
            category = "food"
        }
    },
    @{
        Name = "Creme Visage"
        Endpoint = "http://localhost:10000/api/cosmetics/analyze"
        Body = @{
            name = "Creme hydratante"
            ingredients = "AQUA, GLYCERIN, ALOE VERA"
        }
    },
    @{
        Name = "Lessive"
        Endpoint = "http://localhost:10000/api/detergents/analyze"
        Body = @{
            name = "Lessive ecologique"
            composition = "Savon vegetal, bicarbonate"
        }
    }
)

foreach ($test in $tests) {
    Write-Host "`nTest: $($test.Name)" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri $test.Endpoint -Method POST -Body ($test.Body | ConvertTo-Json) -ContentType "application/json"
        
        # Extraire le score selon la structure
        $score = "N/A"
        if ($response.globalScore) {
            $score = $response.globalScore
        } elseif ($response.score -and $response.score.value) {
            $score = $response.score.value
        } elseif ($response.data -and $response.data.score -and $response.data.score.value) {
            $score = $response.data.score.value
        }
        
        Write-Host "✅ OK - Score: $score/100" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erreur: $_" -ForegroundColor Red
    }
}

Write-Host "`n✅ Tests terminés!" -ForegroundColor Green
