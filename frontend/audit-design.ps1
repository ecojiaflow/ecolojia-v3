Write-Host "`n╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     ECOLOJIA - AUDIT DESIGN COHÉRENCE       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$pages = @(
    "src\pages\ChatPage.tsx",
    "src\pages\ShoppingListPage.tsx",
    "src\pages\MealPlanPage.tsx",
    "src\pages\DashboardPage.tsx",
    "src\pages\HomePage.tsx",
    "src\pages\ProductPage.tsx"
)

$issues = @()

foreach ($page in $pages) {
    Write-Host "Analyzing: $page" -ForegroundColor Yellow
    
    if (Test-Path $page) {
        $content = Get-Content $page -Raw
        
        # Chercher backgrounds non-standard
        if ($content -match 'bg-green-\d+|bg-gray-\d+|bg-white') {
            $matches = [regex]::Matches($content, 'bg-(green|gray|white|blue|purple)-?\d*')
            $bgColors = $matches | ForEach-Object { $_.Value } | Select-Object -Unique
            
            Write-Host "  Backgrounds trouvés: $($bgColors -join ', ')" -ForegroundColor Gray
            
            # Vérifier incohérences
            if ($bgColors -contains "bg-green-50" -or $bgColors -contains "bg-green-100") {
                $issues += "❌ $page : Fond vert clair (devrait être neutral-50)"
            }
        }
        
        # Chercher textes grisés
        if ($content -match 'text-gray-(400|500)') {
            $issues += "⚠️  $page : Textes grisés potentiellement illisibles"
        }
    }
}

Write-Host "`n═══ RÉSULTATS AUDIT ═══`n" -ForegroundColor Magenta

if ($issues.Count -eq 0) {
    Write-Host "✅ Aucun problème détecté" -ForegroundColor Green
} else {
    foreach ($issue in $issues) {
        Write-Host $issue -ForegroundColor Red
    }
    Write-Host "`nTotal problèmes: $($issues.Count)" -ForegroundColor Yellow
}
