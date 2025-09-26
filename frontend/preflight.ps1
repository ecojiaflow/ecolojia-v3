param([switch]\)

Write-Host "
== PRE-FLIGHT CHECKS ==" -ForegroundColor Cyan
Set-Location "C:\Users\salim\Desktop\ECOLOJIA VF CLEAN"

# 1) Envs clés
Write-Host "
[ENVS]" -ForegroundColor Yellow
Get-Content .\backend\.env  | Select-String "ALGOLIA|MONGODB_URI|INDEX"
Get-Content .\frontend\.env | Select-String "VITE_ALGOLIA|INDEX"

# 2) Backend endpoints vitaux
Write-Host "
[BACKEND]" -ForegroundColor Yellow
try {
  \ = Invoke-RestMethod "http://localhost:10000/api/health"
  Write-Host "Health: OK"
} catch { Write-Host "Health: FAIL" -ForegroundColor Red }

try {
  \ = Invoke-RestMethod "http://localhost:10000/api/algolia-reindex/reindex/status"
  Write-Host "Reindex status: OK"
} catch { Write-Host "Reindex status: FAIL" -ForegroundColor Red }

# 3) Front build (skip si -Fast)
if (-not \) {
  Write-Host "
[FRONTEND BUILD]" -ForegroundColor Yellow
  Set-Location .\frontend
  npm ci
  npm run -s lint
  npm run -s build
  Set-Location ..
}

Write-Host "
== PRE-FLIGHT DONE ==" -ForegroundColor Cyan
