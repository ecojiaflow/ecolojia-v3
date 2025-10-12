# ECOLOJIA V3 - Nettoyage Services

$rootPath = "C:\Users\salim\Desktop\ECOLOJIA VF CLEAN"
Set-Location $rootPath

Write-Host "=== NETTOYAGE FINAL ===" -ForegroundColor Cyan
Write-Host ""

# ===== VÉRIFIER ET CORRIGER HISTORYPAGE =====
$historyFile = "frontend\src\pages\HistoryPage.tsx"

if (Test-Path $historyFile) {
    Write-Host "[1/1] Nettoyage HistoryPage.tsx..." -ForegroundColor Yellow
    
    $content = Get-Content $historyFile -Raw
    
    # Supprimer complètement fetchStats et son appel
    Write-Host "  Suppression fetchStats..." -ForegroundColor Gray
    $content = $content -replace "const fetchStats = async \(\) => \{[^\}]+\};", ""
    $content = $content -replace "fetchStats\(\);", "// fetchStats désactivé"
    $content = $content -replace "const \[stats, setStats\] = useState<any>\(null\);", "const [stats] = useState<any>(null);"
    
    # Supprimer complètement handleDelete
    Write-Host "  Suppression handleDelete..." -ForegroundColor Gray
    $content = $content -replace "const handleDelete = async \(ids: string\[\]\) => \{[^\}]+\};", @"
const handleDelete = async (ids: string[]) => {
    toast.error('Suppression désactivée pour le moment');
  };
"@
    
    # Supprimer useEffect pour fetchStats
    $content = $content -replace "useEffect\(\(\) => \{[\s\S]*?fetchHistory\(\);[\s\S]*?fetchStats\(\);[\s\S]*?\}, \[currentPage, filters\]\);", @"
useEffect(() => {
    fetchHistory();
  }, [currentPage, filters]);
"@
    
    Write-Host "  [OK] HistoryPage nettoye" -ForegroundColor Green
    
    # Sauvegarder
    $content | Out-File -FilePath $historyFile -Encoding UTF8 -NoNewline
    Write-Host "  [SUCCESS] Fichier sauvegarde" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== NETTOYAGE TERMINE ===" -ForegroundColor Green
Write-Host ""
Write-Host "PROCHAINES ETAPES:" -ForegroundColor Yellow
Write-Host "1. Tester le dev server: npm run dev" -ForegroundColor White
Write-Host "2. Rebuild si necessaire: npm run build" -ForegroundColor White