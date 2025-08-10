param(
  [string]$BaseUrl = $env:API_BASE_URL,
  [string]$JwtToken = $env:JWT_TOKEN
)

if (-not $BaseUrl -or $BaseUrl.Trim().Length -eq 0) { $BaseUrl = "http://localhost:5001" }

Write-Host "=== ECOLOJIA Smoke Test ===" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl"

$headers = @{ "Content-Type" = "application/json" }
if ($JwtToken -and $JwtToken.Trim().Length -gt 0) {
  $headers["Authorization"] = "Bearer $JwtToken"
  Write-Host "JWT: OK" -ForegroundColor DarkGray
} else {
  Write-Host "⚠️ Aucun JWT fourni (si 401/403, lance d’abord get-dev-jwt.ps1)" -ForegroundColor Yellow
}

function Show-HttpError($err) {
  if ($err.Response) {
    $status = $err.Response.StatusCode.value__
    Write-Host "Erreur HTTP: $status" -ForegroundColor Red
    try {
      $reader = New-Object System.IO.StreamReader($err.Response.GetResponseStream())
      Write-Host ($reader.ReadToEnd())
    } catch {}
  } else {
    Write-Host "Erreur PowerShell: $($err.Message)" -ForegroundColor Red
  }
}

# 1) Health
try {
  $h = Invoke-RestMethod -Method Get -Uri "$BaseUrl/health" -TimeoutSec 20
  Write-Host "Health OK" -ForegroundColor Green
} catch { Show-HttpError $_.Exception }

# 2) Payload d’analyse
$payload = @{
  name = "Céréales chocolat"
  category = "food"
  ingredients = "Céréales (blé), sucre, cacao, sirop de glucose, E322, arôme"
  createProduct = $false
} | ConvertTo-Json -Depth 5

function Try-Post($url) {
  Write-Host "POST $url" -ForegroundColor Cyan
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $resp = Invoke-RestMethod -Method Post -Uri $url -Headers $headers -Body $payload -TimeoutSec 120
  $sw.Stop()
  Write-Host ("⏱️  Durée: {0} ms" -f $sw.ElapsedMilliseconds) -ForegroundColor DarkGray
  return $resp
}

# 3) Essai /api/analysis/manual puis fallback /api/analysis
$response = $null
try {
  $response = Try-Post "$BaseUrl/api/analysis/manual"
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  if ($code -eq 404 -or $code -eq 405) {
    Write-Host "→ Fallback vers /api/analysis" -ForegroundColor Yellow
    try { $response = Try-Post "$BaseUrl/api/analysis" } catch { Show-HttpError $_.Exception; exit 1 }
  } elseif ($code -eq 401 -or $code -eq 403) {
    Show-HttpError $_.Exception
    Write-Host "`nAstuce: powershell -ExecutionPolicy Bypass -File .\scripts\win\get-dev-jwt.ps1" -ForegroundColor Yellow
    exit 1
  } else {
    Show-HttpError $_.Exception
    exit 1
  }
}

Write-Host "Réponse analyse: OK" -ForegroundColor Green
$response | ConvertTo-Json -Depth 7

if ($response.scores) {
  $nova = $response.scores.nova
  $nutri = $response.scores.nutriscore
  $eco = $response.scores.ecoscore
  $g = $response.globalScore
  Write-Host ""
  Write-Host ("Résumé -> NOVA={0}  Nutri={1}  Eco={2}  Global={3}" -f $nova,$nutri,$eco,$g) -ForegroundColor Magenta
}
