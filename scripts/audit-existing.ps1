# ECOLOJIA V3 - Audit Fichiers Existants
param(
    [string]$OutputFile = "AUDIT_EXISTING_FILES.md"
)

$rootPath = "C:\Users\salim\Desktop\ECOLOJIA VF CLEAN"
Set-Location $rootPath

Write-Host "[*] Scan en cours..." -ForegroundColor Cyan

# Initialiser rapport
$report = @"
# AUDIT FICHIERS EXISTANTS - ECOLOJIA V3
Date: $(Get-Date -Format "yyyy-MM-dd HH:mm")

---

## FRONTEND

### Pages (src/pages/)
"@

# Scanner pages
Write-Host "[*] Scan pages..." -ForegroundColor Yellow
$pages = Get-ChildItem -Path "frontend\src\pages" -Recurse -Filter "*.tsx" -ErrorAction SilentlyContinue | Sort-Object Name
foreach ($page in $pages) {
    $report += "`n- [OK] $($page.Name)"
}

Write-Host "[*] Scan composants..." -ForegroundColor Yellow
$report += "`n`n### Composants (src/components/)"
$components = Get-ChildItem -Path "frontend\src\components" -Recurse -Filter "*.tsx" -ErrorAction SilentlyContinue | Sort-Object Name
foreach ($comp in $components) {
    $relativePath = $comp.FullName.Replace("$rootPath\frontend\src\components\", "")
    $report += "`n- [OK] $relativePath"
}

Write-Host "[*] Scan services frontend..." -ForegroundColor Yellow
$report += "`n`n### Services Frontend"
$frontServices = Get-ChildItem -Path "frontend\src" -Recurse -Filter "*service*.ts*" -ErrorAction SilentlyContinue | Sort-Object Name
if ($frontServices.Count -eq 0) {
    $report += "`n- [INFO] Aucun service trouve"
} else {
    foreach ($service in $frontServices) {
        $relativePath = $service.FullName.Replace("$rootPath\frontend\src\", "")
        $report += "`n- [OK] $relativePath"
    }
}

Write-Host "[*] Scan hooks..." -ForegroundColor Yellow
$report += "`n`n### Hooks"
$hooks = Get-ChildItem -Path "frontend\src" -Recurse -Filter "use*.ts*" -ErrorAction SilentlyContinue | Sort-Object Name
if ($hooks.Count -eq 0) {
    $report += "`n- [INFO] Aucun hook trouve"
} else {
    foreach ($hook in $hooks) {
        $report += "`n- [OK] $($hook.Name)"
    }
}

Write-Host "[*] Scan routes backend..." -ForegroundColor Yellow
$report += "`n`n---`n`n## BACKEND`n`n### Routes (src/routes/)"
$routes = Get-ChildItem -Path "backend\src\routes" -Filter "*.js" -ErrorAction SilentlyContinue | Sort-Object Name
foreach ($route in $routes) {
    $report += "`n- [OK] $($route.Name)"
}

Write-Host "[*] Scan services backend..." -ForegroundColor Yellow
$report += "`n`n### Services (src/services/)"
$backServices = Get-ChildItem -Path "backend\src\services" -Filter "*.js" -ErrorAction SilentlyContinue | Sort-Object Name
foreach ($service in $backServices) {
    $report += "`n- [OK] $($service.Name)"
}

Write-Host "[*] Scan configuration..." -ForegroundColor Yellow
$report += "`n`n---`n`n## CONFIGURATION`n`n### Variables Environnement Backend"
$report += "`n"
if (Test-Path "backend\.env") {
    $envContent = Get-Content "backend\.env" -ErrorAction SilentlyContinue
    $algoliaAppId = ""
    $algoliaAdminKey = ""
    
    foreach ($line in $envContent) {
        if ($line -match '^ALGOLIA_APP_ID=(.+)') {
            $algoliaAppId = $matches[1]
        }
        if ($line -match '^ALGOLIA_ADMIN_KEY=(.+)' -or $line -match '^ALGOLIA_API_KEY=(.+)') {
            $algoliaAdminKey = $matches[1]
        }
        
        if ($line -match '^([A-Z_]+)=(.*)$') {
            $key = $matches[1]
            $value = $matches[2]
            if ($value -eq "" -or $value -match "xxx|change-me|<.*>|APPID") {
                $report += "`n- [WARN] **$key** : NON CONFIGURE"
            } else {
                $maskedValue = if ($value.Length -gt 10) { "$($value.Substring(0,10))..." } else { "***" }
                $report += "`n- [OK] $key : Configure ($maskedValue)"
            }
        }
    }
} else {
    $report += "`n- [ERROR] Fichier .env manquant"
}

$report += "`n`n### Variables Environnement Frontend"
if (Test-Path "frontend\.env") {
    $envContent = Get-Content "frontend\.env" -ErrorAction SilentlyContinue
    foreach ($line in $envContent) {
        if ($line -match '^(VITE_[A-Z_]+)=(.*)$') {
            $key = $matches[1]
            $value = $matches[2]
            if ($value -eq "" -or $value -match "xxx|change-me") {
                $report += "`n- [WARN] **$key** : NON CONFIGURE"
            } else {
                $maskedValue = if ($value.Length -gt 10) { "$($value.Substring(0,10))..." } else { "***" }
                $report += "`n- [OK] $key : Configure ($maskedValue)"
            }
        }
    }
} else {
    $report += "`n- [ERROR] Fichier .env manquant"
}

# Vérifier Algolia spécifiquement
$report += "`n`n---`n`n## ALGOLIA STATUS"
$hasAlgoliaBackend = $false
$hasAlgoliaFrontend = $false

if (Test-Path "backend\.env") {
    $envContent = Get-Content "backend\.env"
    foreach ($line in $envContent) {
        if ($line -match '^ALGOLIA_APP_ID=(.+)' -and $matches[1] -notmatch "xxx|APPID|change") {
            $hasAlgoliaBackend = $true
            break
        }
    }
}

if (Test-Path "frontend\.env") {
    $envContent = Get-Content "frontend\.env"
    foreach ($line in $envContent) {
        if ($line -match '^VITE_ALGOLIA_APP_ID=(.+)' -and $matches[1] -notmatch "xxx|change") {
            $hasAlgoliaFrontend = $true
            break
        }
    }
}

if ($hasAlgoliaBackend -and $hasAlgoliaFrontend) {
    $report += "`n- [OK] **Algolia configure** (backend + frontend)"
} elseif ($hasAlgoliaBackend) {
    $report += "`n- [WARN] **Algolia semi-configure** (backend OK, frontend manquant)"
} elseif ($hasAlgoliaFrontend) {
    $report += "`n- [WARN] **Algolia semi-configure** (frontend OK, backend manquant)"
} else {
    $report += "`n- [ERROR] **Algolia NON CONFIGURE** (cles manquantes)"
}

# Vérifier fichiers Algolia
$report += "`n`n### Fichiers Algolia existants"
$algoliaFiles = @(
    "backend\src\services\algolia.service.js",
    "backend\src\routes\algolia-unified.js",
    "backend\src\routes\algolia.js",
    "frontend\src\components\AlgoliaProductCard.tsx"
)

foreach ($file in $algoliaFiles) {
    if (Test-Path $file) {
        $report += "`n- [OK] $file"
    } else {
        $report += "`n- [MISSING] $file"
    }
}

# Stats finales
$report += "`n`n---`n`n## STATISTIQUES"
$report += "`n- Pages frontend : $($pages.Count)"
$report += "`n- Composants : $($components.Count)"
$report += "`n- Routes backend : $($routes.Count)"
$report += "`n- Services backend : $($backServices.Count)"

# Sauvegarder rapport
$report | Out-File -FilePath $OutputFile -Encoding UTF8
Write-Host "`n[OK] Audit termine : $OutputFile" -ForegroundColor Green
Write-Host "[*] Ouverture du rapport..." -ForegroundColor Cyan
Start-Sleep -Seconds 1
notepad $OutputFile