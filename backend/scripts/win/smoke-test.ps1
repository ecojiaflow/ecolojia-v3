param(
  [string]$BaseUrl = $env:API_BASE_URL,
  [string]$JwtToken = $env:JWT_TOKEN
)

try {
  chcp 65001 | Out-Null
  [Console]::OutputEncoding = [System.Text.UTF8Encoding]::UTF8
  $OutputEncoding = New-Object System.Text.UTF8Encoding $false
} catch {}

if (-not $BaseUrl -or $BaseUrl.Trim().Length -eq 0) { $BaseUrl = "http://localhost:5001" }

Write-Host "=== ECOLOJIA Smoke Test ===" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl"

$headers = @{ "Accept" = "application/json" }
if ($JwtToken -and $JwtToken.Trim().Length -gt 0) {
  $headers["Authorization"] = "Bearer $JwtToken"
  Write-Host "JWT: OK" -ForegroundColor DarkGray
} else {
  Write-Host "⚠️ Aucun JWT (si 401/403, lance get-dev-jwt.ps1)" -ForegroundColor Yellow
}

function Show-HttpError($err) {
  if ($err.Response) {
    $status = $err.Response.StatusCode.value__
    Write-Host "Erreur HTTP: $status" -ForegroundColor Red
    try {
      $reader = New-Object System.IO.StreamReader($err.Response.GetResponseStream(), [System.Text.Encoding]::UTF8)
      Write-Host ($reader.ReadToEnd())
    } catch {}
  } else {
    Write-Host "Erreur PowerShell: $($err.Message)" -ForegroundColor Red
  }
}

# 0) Service status
try {
  $status = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/analysis/_service/status" -Headers $headers -TimeoutSec 20
  Write-Host ("Service: {0}" -f ($status.service)) -ForegroundColor DarkGray
} catch { }

# 1) PING
try {
  Write-Host "POST $BaseUrl/api/analysis/ping" -ForegroundColor Cyan
  $pingResp = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/analysis/ping" -Headers ($headers + @{ "Content-Type" = "application/json; charset=utf-8" }) -Body ([System.Text.Encoding]::UTF8.GetBytes("{}")) -TimeoutSec 30
  Write-Host "Ping OK" -ForegroundColor Green
  $pingResp | ConvertTo-Json -Depth 5
} catch { Show-HttpError $_.Exception; Write-Host "⚠️ Ping KO" -ForegroundColor Yellow }

# 2) Payload d’analyse (accents)
$payloadObj = @{
  name = "Céréales chocolat"
  category = "food"
  ingredients = "Céréales (blé), sucre, cacao, sirop de glucose, E322, arôme"
  createProduct = $false
}
$payload = ($payloadObj | ConvertTo-Json -Depth 5)

function Try-Post($url) {
  Write-Host "POST $url" -ForegroundColor Cyan
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $resp = Invoke-RestMethod -Method Post -Uri $url `
    -Headers ($headers + @{ "Content-Type" = "application/json; charset=utf-8" }) `
    -Body ([System.Text.Encoding]::UTF8.GetBytes($payload)) `
    -TimeoutSec 120
  $sw.Stop()
  Write-Host ("⏱️  Durée: {0} ms" -f $sw.ElapsedMilliseconds) -ForegroundColor DarkGray
  return $resp
}

# 3) /manual puis fallback /
$response = $null
try {
  $response = Try-Post "$BaseUrl/api/analysis/manual"
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  if ($code -eq 404 -or $code -eq 405) {
    Write-Host "→ Fallback vers /api/analysis" -ForegroundColor Yellow
    try { $response = Try-Post "$BaseUrl/api/analysis" } catch { Show-HttpError $_.Exception; exit 1 }
  } elseif ($code -eq 401 -or $code -eq 403) {
    Show-HttpError $_.Exception; exit 1
  } else { Show-HttpError $_.Exception; exit 1 }
}

Write-Host "Réponse analyse: OK" -ForegroundColor Green
$response | ConvertTo-Json -Depth 7

# Résumé lisant d'abord scores, puis details si manquants
$nova  = $response.scores.nova
$nutri = $response.scores.nutriscore; if (-not $nutri) { $nutri = $response.details.nutriscore }
$eco   = $response.scores.ecoscore;   if (-not $eco)   { $eco   = $response.details.ecoscore }
$g     = $response.globalScore

Write-Host ""
Write-Host ("Résumé -> NOVA={0}  Nutri={1}  Eco={2}  Global={3}" -f $nova,$nutri,$eco,$g) -ForegroundColor Magenta
