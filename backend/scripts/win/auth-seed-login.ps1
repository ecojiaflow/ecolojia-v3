param(
  [string]$BaseUrl = $env:API_BASE_URL,
  [string]$Email,
  [string]$Password = "Test1234!",
  [string]$Name = "Tester Local"
)

if (-not $BaseUrl -or $BaseUrl.Trim().Length -eq 0) { $BaseUrl = "http://localhost:5001" }
if (-not $Email -or $Email.Trim().Length -eq 0) {
  $ts = Get-Date -Format "yyyyMMddHHmmss"
  $Email = "test$ts@ecolojia.dev"
}

$headers = @{ "Content-Type" = "application/json" }

function Show-HttpError($err) {
  if ($err.Response) {
    $status = $err.Response.StatusCode.value__
    Write-Host "Erreur HTTP: $status" -ForegroundColor Red
    try {
      $reader = New-Object System.IO.StreamReader($err.Response.GetResponseStream())
      $body = $reader.ReadToEnd()
      Write-Host $body
      return @{ StatusCode = $status; Body = $body }
    } catch {
      return @{ StatusCode = $status; Body = "" }
    }
  } else {
    Write-Host "Erreur PowerShell: $($err.Message)" -ForegroundColor Red
    return @{ StatusCode = -1; Body = $err.Message }
  }
}

function Try-Register([string]$emailToUse) {
  Write-Host "→ Register $emailToUse" -ForegroundColor Cyan

  $registerBody = @{
    email       = $emailToUse
    password    = $Password
    name        = $Name
    acceptTerms = $true
    plan        = "free"
    role        = "user"
    newsletter  = $false
    locale      = "fr-FR"
    source      = "dev-script"
  } | ConvertTo-Json -Depth 5

  try {
    $r = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/auth/register" -Headers $headers -Body $registerBody -TimeoutSec 30
    Write-Host "   Register OK" -ForegroundColor Green
    return @{ Ok = $true; StatusCode = 200; Body = $r }
  } catch {
    $info = Show-HttpError $_.Exception
    return @{ Ok = $false; StatusCode = $info.StatusCode; Body = $info.Body }
  }
}

function Get-JwtFromObject($obj) {
  if (-not $obj) { return $null }
  foreach ($p in $obj.PSObject.Properties.Name) {
    $v = $obj.$p
    if ($v -is [string]) {
      if ($v.Contains('.') -and ($v.Split('.').Count -ge 3)) { return $v }
    } elseif ($v -is [pscustomobject]) {
      $inner = Get-JwtFromObject $v
      if ($inner) { return $inner }
    }
  }
  return $null
}

function Do-Login([string]$emailToUse) {
  Write-Host "→ Login $emailToUse" -ForegroundColor Cyan
  $body = @{ email = $emailToUse; password = $Password } | ConvertTo-Json
  try {
    $login = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/auth/login" -Headers $headers -Body $body -TimeoutSec 30
  } catch {
    $null = Show-HttpError $_.Exception
    return $null
  }

  $token = $null
  if ($login.token) { $token = $login.token }
  elseif ($login.accessToken) { $token = $login.accessToken }
  elseif ($login.jwt) { $token = $login.jwt }
  if (-not $token) { $token = Get-JwtFromObject $login }

  return $token
}

Write-Host "=== ECOLOJIA Auth Seed & Login ===" -ForegroundColor Magenta
Write-Host "Base URL: $BaseUrl"
Write-Host "Email cible: $Email"

$reg = Try-Register -emailToUse $Email
if (-not $reg.Ok) {
  $ts = Get-Date -Format "yyyyMMddHHmmss"
  $Email = "tester$ts@ecolojia.dev"
  Write-Host "   Register 400 → nouvel email: $Email" -ForegroundColor Yellow
  $reg = Try-Register -emailToUse $Email
  if (-not $reg.Ok -and $reg.StatusCode -ne 409) { throw "Echec register: $($reg.StatusCode)" }
}

$token = Do-Login -emailToUse $Email
if (-not $token) { throw "Echec login (vérifie les logs /api/auth/login)" }

$env:JWT_TOKEN = $token
Write-Host "✅ JWT stocké dans `$env:JWT_TOKEN" -ForegroundColor Green
try { Write-Host ("Extrait: {0}..." -f $token.Substring(0,20)) -ForegroundColor DarkGray } catch {}
