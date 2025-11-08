param(
  [string]$LocalBase = "http://localhost:10000",
  [string]$ProdBase  = "https://ecolojia-backendvf.onrender.com"
)

function Test-One {
  param([string]$base)
  Write-Host "`n=== TEST $base ===" -ForegroundColor Green

  try {
    $h = Invoke-RestMethod -Uri "$base/api/ai/recipes/health" -TimeoutSec 10
    Write-Host "/ai/recipes/health -> $($h | ConvertTo-Json -Depth 3)"
  } catch { Write-Host "/ai/recipes/health KO -> $($_.Exception.Message)" -ForegroundColor Red }

  try {
    $r = Invoke-RestMethod -Uri "$base/api/ai/recipes/suggest?name=poulet&categoryType=food" -TimeoutSec 10
    Write-Host "/ai/recipes/suggest (food) -> $((($r.recipes | Select-Object -First 1).title) )"
  } catch { Write-Host "/ai/recipes/suggest (food) KO -> $($_.Exception.Message)" -ForegroundColor Red }

  try {
    $r2 = Invoke-RestMethod -Uri "$base/api/ai/recipes/suggest?name=shampoo&categoryType=cosmetic" -TimeoutSec 10
    Write-Host "/ai/recipes/suggest (cosmetic) -> $((($r2.recipes | Select-Object -First 1).title) )"
  } catch { Write-Host "/ai/recipes/suggest (cosmetic) KO -> $($_.Exception.Message)" -ForegroundColor Red }
}

Test-One -base $LocalBase
Test-One -base $ProdBase
