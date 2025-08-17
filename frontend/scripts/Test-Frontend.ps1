# ECOLOJIA - Frontend viability test (Windows PowerShell 5.1+ friendly)
# Usage (repo root):
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Test-Frontend.ps1 -FrontendDir frontend -ApiUrl http://localhost:10000/api
# Usage (inside frontend/):
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Test-Frontend.ps1 -FrontendDir . -ApiUrl http://localhost:10000/api

param(
  [string]$FrontendDir = "frontend",
  [string]$ApiUrl = "",
  [switch]$SkipBuild,
  [switch]$KeepPreview,
  [string[]]$Routes = @("/", "/scan", "/favorites", "/history", "/dashboard"),
  [int]$TimeoutSec = 15,
  [int]$PreviewPort = 5173
)

# Auto-fix when already inside frontend/ and user passed -FrontendDir frontend
if ((Split-Path -Leaf (Get-Location)) -eq 'frontend' -and $FrontendDir -eq 'frontend') { $FrontendDir = '.' }

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}

function New-Stamp { (Get-Date).ToString("yyyyMMdd-HHmmss") }
$stamp      = New-Stamp
$repoRoot   = Resolve-Path "."
$reportsDir = Join-Path $repoRoot "reports"
if (-not (Test-Path $reportsDir)) { New-Item -ItemType Directory -Force -Path $reportsDir | Out-Null }
$logPath  = Join-Path $reportsDir ("frontend-viability-{0}.log" -f $stamp)
$mdPath   = Join-Path $reportsDir ("frontend-viability-{0}.md" -f $stamp)
$jsonPath = Join-Path $reportsDir ("frontend-viability-{0}.json" -f $stamp)

# logger
$Results = New-Object System.Collections.ArrayList
function Add-Result {
  param([string]$Category,[string]$Name,[string]$Status,[string]$Message,[int]$DurationMs)
  $obj = [pscustomobject]@{category=$Category;name=$Name;status=$Status;message=$Message;durationMs=$DurationMs}
  [void]$Results.Add($obj)
  $line = "[{0}] {1} :: {2} -> {3} ({4} ms)" -f (Get-Date), $Category, $Name, $Status, $DurationMs
  Add-Content -Path $logPath -Value $line
  switch ($Status) { "PASS"{Write-Host $line -ForegroundColor Green};"WARN"{Write-Host $line -ForegroundColor Yellow};"FAIL"{Write-Host $line -ForegroundColor Red}; default{Write-Host $line} }
}

function Test-Command {
  param([string]$Cmd,[string]$MinVersion="")
  $sw=[System.Diagnostics.Stopwatch]::StartNew()
  try {
    $ver = & $Cmd --version 2>$null; if (-not $ver) { $ver = & $Cmd -v 2>$null }
    if ($MinVersion) {
      $v=($ver -replace '[^\d\.]').Trim(); $cur=[version]::Parse(($v.Split(' '))[0]); $min=[version]::Parse($MinVersion)
      if ($cur -lt $min) { $sw.Stop(); Add-Result "deps" "$Cmd >= $MinVersion" "FAIL" ("Detected: {0}" -f $ver) $sw.ElapsedMilliseconds; return $false }
    }
    $sw.Stop(); Add-Result "deps" "$Cmd present" "PASS" ("Version: {0}" -f $ver) $sw.ElapsedMilliseconds; return $true
  } catch { $sw.Stop(); Add-Result "deps" "$Cmd present" "FAIL" $_.Exception.Message $sw.ElapsedMilliseconds; return $false }
}

function Read-DotEnv {
  param([string]$Path)
  $map=@{}; if (-not (Test-Path $Path)) { return $map }
  Get-Content $Path | ForEach-Object {
    $line=$_.Trim(); if ($line -match '^\s*#') { return }; if ($line -match '^\s*$') { return }
    $kv=$line -split '=',2; if ($kv.Count -eq 2) { $k=$kv[0].Trim(); $v=$kv[1].Trim().Trim('"').Trim("'"); $map[$k]=$v }
  }; return $map
}

function Resolve-ApiUrl {
  param([string]$FrontendDir,[string]$CliApiUrl)
  $sw=[System.Diagnostics.Stopwatch]::StartNew()
  try {
    if ($CliApiUrl) { $sw.Stop(); Add-Result "config" "VITE_API_URL (CLI)" "PASS" $CliApiUrl $sw.ElapsedMilliseconds; return $CliApiUrl.TrimEnd('/') }
    $envPath=Join-Path $FrontendDir ".env"; $map=Read-DotEnv $envPath; $val=$map["VITE_API_URL"]
    if (-not $val) { $sw.Stop(); Add-Result "config" "VITE_API_URL (.env)" "WARN" "Not set, fallback http://localhost:10000/api" $sw.ElapsedMilliseconds; return "http://localhost:10000/api" }
    if ($val -notmatch '^https?://.+/api$') { $sw.Stop(); Add-Result "config" "VITE_API_URL (.env)" "WARN" ("Suspicious value: {0}" -f $val) $sw.ElapsedMilliseconds }
    else { $sw.Stop(); Add-Result "config" "VITE_API_URL (.env)" "PASS" $val $sw.ElapsedMilliseconds }
    return $val.TrimEnd('/')
  } catch { $sw.Stop(); Add-Result "config" "VITE_API_URL" "WARN" ("Error reading .env: {0}. Using http://localhost:10000/api" -f $_.Exception.Message) $sw.ElapsedMilliseconds; return "http://localhost:10000/api" }
}

# Robust HTTP checker: use Invoke-WebRequest for status + body, then try parse JSON
function Test-Endpoint {
  param([string]$Name,[string]$Url,[string]$Method="GET",[object]$Body=$null)
  $sw=[System.Diagnostics.Stopwatch]::StartNew()
  try {
    $params = @{ Uri=$Url; Method=$Method; TimeoutSec=$TimeoutSec; Headers=@{Accept="application/json"}; ErrorAction="Stop" }
    if ($null -ne $Body) { $params.ContentType="application/json"; $params.Body=($Body|ConvertTo-Json -Depth 8 -Compress) }
    $r = Invoke-WebRequest @params
    $sw.Stop()
    $status = $r.StatusCode
    $content = $r.Content
    $json = $null
    try { $json = $content | ConvertFrom-Json } catch {}
    if ($status -ge 200 -and $status -lt 300) {
      $hint = if ($json) { if ($json.success -eq $true) { "success=true" } elseif ($json.ok) { "ok=true" } elseif ($json.data) { "data present" } else { "2xx" } } else { "2xx (non-JSON)" }
      Add-Result "api" $Name "PASS" ("{0} [{1}]" -f $Url,$hint) $sw.ElapsedMilliseconds
      return $true
    } else {
      $err = if ($json -and $json.error) { $json.error } else { if ($content) { $content.Substring(0,[Math]::Min(160,$content.Length)) } else { "no body" } }
      Add-Result "api" $Name "FAIL" ("{0} -> HTTP {1} {2}" -f $Url,$status,$err) $sw.ElapsedMilliseconds
      return $false
    }
  } catch {
    $sw.Stop()
    Add-Result "api" $Name "FAIL" ("{0} -> {1}" -f $Url, $_.Exception.Message) $sw.ElapsedMilliseconds
    return $false
  }
}

function Ensure-Frontend {
  param([string]$Dir,[switch]$SkipBuild)
  Push-Location $Dir
  try {
    if (-not (Test-Path "package.json")) { Add-Result "build" "package.json" "FAIL" ("Not found in {0}" -f $Dir) 0; return $false }
    try { npm ci | Out-Null; Add-Result "build" "npm ci" "PASS" "Dependencies OK" 0 }
    catch { Add-Result "build" "npm ci" "WARN" ("Failed, trying npm install: {0}" -f $_.Exception.Message) 0; npm install | Out-Null; Add-Result "build" "npm install" "PASS" "Dependencies OK (fallback)" 0 }
    if (-not $SkipBuild) {
      $t=Measure-Command { npm run build --silent }; Add-Result "build" "npm run build" "PASS" ("Vite build OK in {0}s" -f [math]::Round($t.TotalSeconds,2)) $t.TotalMilliseconds
      if (-not (Test-Path "dist")) { Add-Result "build" "dist/" "FAIL" "dist folder missing after build" 0; return $false }
    } else { Add-Result "build" "npm run build" "WARN" "Skipped (--SkipBuild)" 0 }
    return $true
  } finally { Pop-Location }
}

function Start-Preview {
  param([string]$Dir,[int]$Port=5173)
  Push-Location $Dir
  try {
    $useNpmScript = $false
    if (Test-Path "package.json") {
      try {
        $pkg = Get-Content package.json -Raw | ConvertFrom-Json
        if ($pkg.scripts -and $pkg.scripts.preview) { $useNpmScript = $true }
      } catch {}
    }
    if ($useNpmScript) {
      $proc = Start-Process -FilePath "npm" -ArgumentList @("run","preview","--silent","--","--port",$Port,"--strictPort") -WindowStyle Hidden -PassThru
    } else {
      $proc = Start-Process -FilePath "npx" -ArgumentList @("vite","preview","--port",$Port,"--strictPort") -WindowStyle Hidden -PassThru
    }
    $base="http://localhost:$Port"; $deadline=(Get-Date).AddSeconds(30); $ready=$false
    while ((Get-Date) -lt $deadline) { try { $r=Invoke-WebRequest -Uri $base -UseBasicParsing -TimeoutSec 3; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { $ready=$true; break } } catch { Start-Sleep -Milliseconds 300 } }
    if ($ready) { Add-Result "preview" "vite preview" "PASS" ("Listening on {0} (PID {1})" -f $base,$proc.Id) 0; return $proc }
    else { Add-Result "preview" "vite preview" "FAIL" "Timeout waiting for readiness" 0; try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}; return $null }
  } finally { Pop-Location }
}

function Stop-Preview {
  param([System.Diagnostics.Process]$Proc,[switch]$Keep)
  if ($null -ne $Proc -and -not $Keep) { try { Stop-Process -Id $Proc.Id -Force -ErrorAction SilentlyContinue; Add-Result "preview" "vite preview" "PASS" ("Stopped (PID {0})" -f $Proc.Id) 0 } catch { Add-Result "preview" "vite preview" "WARN" ("Could not stop PID {0}" -f $Proc.Id) 0 } }
  elseif ($Keep) { Add-Result "preview" "vite preview" "WARN" "Kept alive (--KeepPreview)" 0 }
}

function Test-Page {
  param([string]$Base,[string]$Path)
  $url="$Base$Path"; $sw=[System.Diagnostics.Stopwatch]::StartNew()
  try { $r=Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec $TimeoutSec -Method GET; $sw.Stop()
    if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) { Add-Result "page" $Path "PASS" ("HTTP {0}" -f $r.StatusCode) $sw.ElapsedMilliseconds; return $true }
    else { Add-Result "page" $Path "WARN" ("HTTP {0}" -f $r.StatusCode) $sw.ElapsedMilliseconds; return $false }
  } catch { $sw.Stop(); Add-Result "page" $Path "FAIL" $_.Exception.Message $sw.ElapsedMilliseconds; return $false }
}

function Test-I18n-Fr {
  param([string]$FrontendDir)
  $sw=[System.Diagnostics.Stopwatch]::StartNew()
  try {
    $frPath=Join-Path $FrontendDir "src\i18n\locales\fr.ts"
    if (-not (Test-Path $frPath)) { $sw.Stop(); Add-Result "i18n" "fr.ts" "WARN" "File not found" $sw.ElapsedMilliseconds; return }
    $content=Get-Content $frPath -Raw
    $hasArtifacts = ($content -match '(\u00C2|\u00C3)')
    if ($hasArtifacts) { $sw.Stop(); Add-Result "i18n" "UTF-8 encoding" "FAIL" "Encoding artifacts detected (U+00C2/U+00C3). Fix file encoding." $sw.ElapsedMilliseconds }
    else { $sw.Stop(); Add-Result "i18n" "UTF-8 encoding" "PASS" "No artifacts detected" $sw.ElapsedMilliseconds }
  } catch { $sw.Stop(); Add-Result "i18n" "fr.ts" "WARN" $_.Exception.Message $sw.ElapsedMilliseconds }
}

function Scan-HardcodedUrls {
  param([string]$FrontendDir)
  $sw=[System.Diagnostics.Stopwatch]::StartNew()
  try {
    $files=@( (Join-Path $FrontendDir "src\services\chat\ChatService.ts"), (Join-Path $FrontendDir "src\services\apiClient.ts") )
    $found=@()
    foreach ($f in $files) {
      if (Test-Path $f) {
        $txt=Get-Content $f -Raw
        $matches=[regex]::Matches($txt,'https?://\S+')
        foreach ($m in $matches) { $found += ("{0} -> {1}" -f [System.IO.Path]::GetFileName($f), $m.Value) }
      }
    }
    if ($found.Count -gt 0) { $sw.Stop(); Add-Result "config" "Hardcoded URLs" "WARN" ($found -join '; ') $sw.ElapsedMilliseconds }
    else { $sw.Stop(); Add-Result "config" "Hardcoded URLs" "PASS" "None" $sw.ElapsedMilliseconds }
  } catch { $sw.Stop(); Add-Result "config" "Hardcoded URLs" "WARN" $_.Exception.Message $sw.ElapsedMilliseconds }
}

# 1) deps
$null = Test-Command "node" "18.0.0"
$null = Test-Command "npm"  "9.0.0"

# 2) API base
$ApiBase = Resolve-ApiUrl -FrontendDir $FrontendDir -CliApiUrl $ApiUrl

# 3) API probes
$null = Test-Endpoint -Name "Cosmetics health"  -Url "$ApiBase/cosmetics/health"
$null = Test-Endpoint -Name "Detergents health" -Url "$ApiBase/detergents/health"
$bodyCosm=@{ name="Creme visage bio"; ingredients="AQUA, GLYCERIN, NIACINAMIDE, TOCOPHEROL"; language="fr" }
$bodyDet=@{ name="Lessive ecologique"; composition="COCO GLUCOSIDE, SODIUM BICARBONATE, CITRIC ACID"; language="fr" }
$bodyFood=@{ mode="manual"; name="Cookies industriels"; ingredients="Farine, sucre, huile de palme, E320, E321, sirop de glucose" }
$bodyAI=@{ message="Ce produit est-il sain ?"; context=@{ productName="Creme visage bio"; healthScore=82 } }
$null = Test-Endpoint -Name "Cosmetics analyze"  -Url "$ApiBase/cosmetics/analyze"  -Method "POST" -Body $bodyCosm
$null = Test-Endpoint -Name "Detergents analyze" -Url "$ApiBase/detergents/analyze" -Method "POST" -Body $bodyDet
$null = Test-Endpoint -Name "Food analysis"      -Url "$ApiBase/analysis"          -Method "POST" -Body $bodyFood
$null = Test-Endpoint -Name "AI chat"            -Url "$ApiBase/ai/chat"           -Method "POST" -Body $bodyAI

# 4) frontend build
$null = Ensure-Frontend -Dir $FrontendDir -SkipBuild:$SkipBuild

# 5) static checks
Test-I18n-Fr -FrontendDir $FrontendDir
Scan-HardcodedUrls -FrontendDir $FrontendDir

# 6) preview and pages
$previewProc=$null
try {
  $previewProc = Start-Preview -Dir $FrontendDir -Port $PreviewPort
  if ($previewProc -ne $null) {
    $base="http://localhost:$PreviewPort"
    foreach ($r in $Routes) { $null = Test-Page -Base $base -Path $r }
  }
} finally {
  if ($previewProc -ne $null) { Stop-Preview -Proc $previewProc -Keep:$KeepPreview }
}

# 7) reports
$Results | ConvertTo-Json -Depth 6 | Out-File -FilePath $jsonPath -Encoding UTF8
$pass = @($Results | Where-Object { $_.status -eq 'PASS' }).Count
$warn = @($Results | Where-Object { $_.status -eq 'WARN' }).Count
$fail = @($Results | Where-Object { $_.status -eq 'FAIL' }).Count

$md=@()
$md += "# Frontend viability report - $stamp"
$md += ""
$md += "- API base: `$ApiBase"
$md += "- Frontend dir: `$FrontendDir"
$md += ""
$md += "| Category | Test | Status | Detail | Duration (ms) |"
$md += "|---|---|---|---|---|"
foreach ($r in $Results) {
  $detail = [string]$r.message
  $detail = $detail -replace '\|','&#124;'
  $md += "| $($r.category) | $($r.name) | $($r.status) | $detail | $($r.durationMs) |"
}
$md += ""
$md += "**Summary** : PASS=$pass / WARN=$warn / FAIL=$fail"
$md -join "`r`n" | Out-File -FilePath $mdPath -Encoding UTF8

Write-Host ""
Write-Host "Reports saved:" -ForegroundColor Cyan
Write-Host " - Log     : $logPath"
Write-Host " - JSON    : $jsonPath"
Write-Host " - Markdown: $mdPath"
Write-Host ""
if ($fail -gt 0) { exit 2 } elseif ($warn -gt 0) { exit 1 } else { exit 0 }
