param(
  [string]$BACK = 'https://ecolojia-backendvf.onrender.com',
  [string]$QUERY = 'nutella'
)

Write-Host '=== 1) Health (prod) ==='
try {
  Invoke-RestMethod "$BACK/api/health" -ErrorAction Stop | ConvertTo-Json -Depth 5
} catch {
  Write-Host ('Health KO: ' + $_.Exception.Message) -ForegroundColor Red
}

Write-Host '=== 2) Search (Algolia via backend) ==='
try {
  $r = Invoke-RestMethod "$BACK/api/algolia/search?q=$QUERY" -ErrorAction Stop
  if ($r.hits) { 'hits: ' + $r.hits.Count } else { $r | ConvertTo-Json -Depth 5 }
} catch {
  Write-Host ('Search KO: ' + $_.Exception.Message) -ForegroundColor Yellow
}

Write-Host '=== FIN ==='
