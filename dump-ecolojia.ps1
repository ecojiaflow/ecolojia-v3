$ErrorActionPreference = "Continue"
$root   = (Get-Location).Path
$stamp  = Get-Date -Format "yyyyMMdd-HHmmss"
$outDir = Join-Path $root ".ecolojia-dump\$stamp"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Function Write-Info($msg){ Write-Host "[*] $msg" -ForegroundColor Cyan }
Function Safe-Run($name, [ScriptBlock]$block){
  Write-Info $name
  try { & $block } catch { "[ERROR] $($_.Exception.Message)" }
}

# 0) Contexte système / outils
$sysFile = Join-Path $outDir "system-info.txt"
Safe-Run "Collecte système" {
  $lines = @()
  $lines += "Timestamp: $(Get-Date -Format u)"
  $lines += "PSVersion: $($PSVersionTable.PSVersion)"
  $lines += "OS: $([System.Environment]::OSVersion.VersionString)"
  $lines += ""
  $lines += "Node path: $(cmd /c where node 2>$null)"
  $lines += "NPM  path: $(cmd /c where npm  2>$null)"
  $lines += "node -v: $(cmd /c node -v 2>$null)"
  $lines += "npm  -v: $(cmd /c npm -v 2>$null)"
  $lines += ""
  $lines += "Git path: $(cmd /c where git 2>$null)"
  $lines += "git version: $(cmd /c git --version 2>$null)"
  $lines += "git branch: $(cmd /c git rev-parse --abbrev-ref HEAD 2>$null)"
  $lines += "git last commit: $(cmd /c git log -1 --pretty=""%h %ci %s"" 2>$null)"
  $lines -join "`r`n" | Out-File -Encoding UTF8 $sysFile
}

# 1) Listes de fichiers (hors poids lourds)
$excludeRegex = '\\(node_modules|dist|build|coverage|\.git|\.next|\.turbo|\.cache|out|cypress|\.parcel-cache)\\'
Function Dump-Tree($base, $tag){
  $files = Get-ChildItem -Path $base -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch $excludeRegex } |
    ForEach-Object { $_.FullName.Substring($root.Length).TrimStart('\') }
  $dirs = Get-ChildItem -Path $base -Recurse -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch $excludeRegex } |
    ForEach-Object { $_.FullName.Substring($root.Length).TrimStart('\') }
  $files | Out-File -Encoding UTF8 (Join-Path $outDir "$tag-files.txt")
  $dirs  | Out-File -Encoding UTF8 (Join-Path $outDir "$tag-dirs.txt")
}

if (Test-Path "$root\frontend") { Dump-Tree "$root\frontend" "frontend" }
if (Test-Path "$root\backend")  { Dump-Tree "$root\backend"  "backend"  }

# 2) Contenus de fichiers clés (front)
Function Dump-IfExists($path, $destName){
  if (Test-Path $path) {
    "`n===== $destName ($path) =====`n" | Out-File -Append -Encoding UTF8 (Join-Path $outDir "frontend-configs.txt")
    Get-Content -Raw $path | Out-File -Append -Encoding UTF8 (Join-Path $outDir "frontend-configs.txt")
  }
}
Dump-IfExists "$root\frontend\package.json" "frontend package.json"
Dump-IfExists "$root\frontend\vite.config.ts" "vite.config.ts"
Dump-IfExists "$root\frontend\vite.config.js" "vite.config.js"
Dump-IfExists "$root\frontend\tailwind.config.ts" "tailwind.config.ts"
Dump-IfExists "$root\frontend\tailwind.config.js" "tailwind.config.js"
Dump-IfExists "$root\frontend\postcss.config.cjs" "postcss.config.cjs"
Dump-IfExists "$root\frontend\postcss.config.js"  "postcss.config.js"
Dump-IfExists "$root\frontend\tsconfig.json"      "tsconfig.json"
Dump-IfExists "$root\frontend\src\main.tsx"       "src/main.tsx"
Dump-IfExists "$root\frontend\src\routes.tsx"     "src/routes.tsx"
Dump-IfExists "$root\frontend\src\App.tsx"        "src/App.tsx"
Dump-IfExists "$root\frontend\src\pages\Search.tsx" "src/pages/Search.tsx"

# 3) Contenus de fichiers clés (back)
Function DumpBack-IfExists($path, $destName){
  if (Test-Path $path) {
    "`n===== $destName ($path) =====`n" | Out-File -Append -Encoding UTF8 (Join-Path $outDir "backend-configs.txt")
    Get-Content -Raw $path | Out-File -Append -Encoding UTF8 (Join-Path $outDir "backend-configs.txt")
  }
}
DumpBack-IfExists "$root\backend\package.json" "backend package.json"
DumpBack-IfExists "$root\backend\src\main.js"   "backend src/main.js"
DumpBack-IfExists "$root\backend\server.js"     "backend server.js"
DumpBack-IfExists "$root\backend\render.yaml"   "render.yaml"
Dump-Tree "$root\backend\src" "backend-src"     # listing détaillé src/

# 4) Routes Express (scan)
$routesOut = Join-Path $outDir "backend-routes-scan.txt"
if (Test-Path "$root\backend\src") {
  $pattern = '(^|[^a-zA-Z])(app|router)\s*\.\s*(get|post|put|patch|delete)\s*\('
  Get-ChildItem "$root\backend\src" -Recurse -Include *.js,*.ts -File |
    Where-Object { $_.FullName -notmatch $excludeRegex } |
    ForEach-Object {
      $m = Select-String -Path $_.FullName -Pattern $pattern -SimpleMatch:$false
      if ($m) { $m | ForEach-Object { "$($_.Path):$($_.LineNumber): $($_.Line.Trim())" } }
    } | Out-File -Encoding UTF8 $routesOut
}

# 5) Routes React (scan)
$reactRoutesOut = Join-Path $outDir "frontend-routes-scan.txt"
if (Test-Path "$root\frontend\src") {
  $pat1 = '<Route\s+[^>]*path='
  $pat2 = 'createBrowserRouter|createRoutesFromElements|path\s*:'
  Get-ChildItem "$root\frontend\src" -Recurse -Include *.tsx,*.ts,*.jsx,*.js -File |
    Where-Object { $_.FullName -notmatch $excludeRegex } |
    ForEach-Object {
      $m = Select-String -Path $_.FullName -Pattern $pat1,$pat2
      if ($m) { $m | ForEach-Object { "$($_.Path):$($_.LineNumber): $($_.Line.Trim())" } }
    } | Out-File -Encoding UTF8 $reactRoutesOut

  Get-ChildItem "$root\frontend\src\pages" -Recurse -Include *.tsx,*.jsx -ErrorAction SilentlyContinue |
    ForEach-Object { $_.FullName.Substring($root.Length).TrimStart('\') } |
    Out-File -Encoding UTF8 (Join-Path $outDir "frontend-pages.txt")
}

# 6) Envs (sanitisation valeurs -> REDACTED)
Function Sanitize-EnvFile($srcPath, $dstPath){
  if (Test-Path $srcPath) {
    (Get-Content $srcPath) | ForEach-Object {
      if ($_ -match '^\s*#' -or $_ -match '^\s*$') { $_ }
      else { $_ -replace '=(.*)$', '=REDACTED' }
    } | Out-File -Encoding UTF8 $dstPath
  }
}
$newvDir = Join-Path $outDir "envs"
New-Item -ItemType Directory -Force -Path $newvDir | Out-Null
Sanitize-EnvFile "$root\.env"               (Join-Path $newvDir "root.env.sanitized")
Sanitize-EnvFile "$root\frontend\.env"      (Join-Path $newvDir "frontend.env.sanitized")
Sanitize-EnvFile "$root\frontend\.env.local"(Join-Path $newvDir "frontend.env.local.sanitized")
Sanitize-EnvFile "$root\backend\.env"       (Join-Path $newvDir "backend.env.sanitized")
Get-ChildItem "$root" -Filter ".env.*" -File | ForEach-Object { Sanitize-EnvFile $_.FullName (Join-Path $newvDir ($_.Name + ".sanitized")) }
Get-ChildItem "$root\frontend" -Filter ".env.*" -File | ForEach-Object { Sanitize-EnvFile $_.FullName (Join-Path $newvDir ("frontend-" + $_.Name + ".sanitized")) }
Get-ChildItem "$root\backend"  -Filter ".env.*" -File | ForEach-Object { Sanitize-EnvFile $_.FullName (Join-Path $newvDir ("backend-"  + $_.Name + ".sanitized")) }

# 7) package.json (front/back)
Function Dump-Scripts($pkg, $out){
  if (Test-Path $pkg) {
    "`n===== $pkg =====`n" | Out-File -Append -Encoding UTF8 $out
    Get-Content -Raw $pkg | Out-File -Append -Encoding UTF8 $out
  }
}
$scriptsOut = Join-Path $outDir "package-jsons.txt"
Dump-Scripts "$root\frontend\package.json" $scriptsOut
Dump-Scripts "$root\backend\package.json"  $scriptsOut

# 8) Probes serveurs locaux (si actifs)
$probeOut = Join-Path $outDir "local-probes.txt"
Safe-Run "Probe dev servers" {
  $lines = @()
  $frontPort = 5173
  $backPort  = 10000
  $resF = Test-NetConnection -ComputerName "localhost" -Port $frontPort
  $resB = Test-NetConnection -ComputerName "localhost" -Port $backPort
  $lines += "Front 5173 TcpTestSucceeded: $($resF.TcpTestSucceeded)"
  $lines += "Back  10000 TcpTestSucceeded: $($resB.TcpTestSucceeded)"
  try {
    $h = Invoke-WebRequest "http://localhost:$backPort/api/health" -UseBasicParsing -TimeoutSec 3
    $lines += "/api/health status: $($h.StatusCode)"
    $lines += "Body: $($h.Content)"
  } catch {
    $lines += "/api/health: unreachable ($($_.Exception.Message))"
  }
  $lines -join "`r`n" | Out-File -Encoding UTF8 $probeOut
}

# 9) ZIP final
$zipPath = Join-Path $root ("ecolojia-diagnostics-" + $stamp + ".zip")
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $outDir "*") -DestinationPath $zipPath -Force

Write-Host ""
Write-Host "=== Terminé ===" -ForegroundColor Green
Write-Host "Dossier : $outDir"
Write-Host "ZIP     : $zipPath"
