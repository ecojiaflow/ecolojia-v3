Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   AUDIT DESIGN PROFESSIONNEL ECOLOJIA      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$pages = @(
    "src\pages\HomePage.tsx",
    "src\pages\SearchPage.tsx",
    "src\pages\ChatPage.tsx",
    "src\pages\DashboardPage.tsx",
    "src\pages\FavoritesPage.tsx",
    "src\pages\HistoryPage.tsx",
    "src\pages\ProfilePage.tsx",
    "src\pages\MealPlanPage.tsx",
    "src\pages\ShoppingListPage.tsx",
    "src\pages\ProductPage.tsx"
)

$report = @()

foreach ($page in $pages) {
    if (Test-Path $page) {
        $content = Get-Content $page -Raw -Encoding UTF8
        $pageName = Split-Path $page -Leaf
        
        $status = @{
            Page = $pageName
            HasBgPrimary = $content -match 'bg-primary-50'
            HasMinHeight = $content -match 'min-h-screen'
            HasWhiteBg = $content -match 'bg-white(?!-)'
            HasGrayBg = $content -match 'bg-gray-'
            EncodingIssue = $content -match '\?\?'
            LineCount = ($content -split "`n").Count
        }
        
        $report += [PSCustomObject]$status
    }
}

# Afficher rapport
Write-Host "═══ RAPPORT COHÉRENCE ═══`n" -ForegroundColor Yellow

$report | Format-Table -AutoSize

Write-Host "`n═══ RECOMMANDATIONS ═══`n" -ForegroundColor Magenta

$pagesWithoutGreen = $report | Where-Object { -not $_.HasBgPrimary }
if ($pagesWithoutGreen) {
    Write-Host "❌ Pages SANS bg-primary-50:" -ForegroundColor Red
    $pagesWithoutGreen.Page | ForEach-Object { Write-Host "   • $_" -ForegroundColor Gray }
}

$pagesWithWhite = $report | Where-Object { $_.HasWhiteBg }
if ($pagesWithWhite) {
    Write-Host "`n⚠️  Pages avec bg-white:" -ForegroundColor Yellow
    $pagesWithWhite.Page | ForEach-Object { Write-Host "   • $_" -ForegroundColor Gray }
}

$encodingIssues = $report | Where-Object { $_.EncodingIssue }
if ($encodingIssues) {
    Write-Host "`n❌ Problèmes encoding (???):" -ForegroundColor Red
    $encodingIssues.Page | ForEach-Object { Write-Host "   • $_" -ForegroundColor Gray }
}

Write-Host "`n✅ Page RÉFÉRENCE à copier: MealPlanPage.tsx" -ForegroundColor Green
