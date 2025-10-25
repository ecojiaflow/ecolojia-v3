# ECOLOJIA V3 - SUITE DE TESTS PROFESSIONNELLE
# Testeur SaaS - 15 ans d'expérience

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AUDIT COMPLET ECOLOJIA V3" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$score = 0
$maxScore = 100

# TEST 1 - BACKEND HEALTH (10 points)
Write-Host "[TEST 1/10] Backend Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:10000/api/health" -Method Get -TimeoutSec 5
    Write-Host "  [OK] Backend UP (v$($health.version))" -ForegroundColor Green
    $score += 10
} catch {
    Write-Host "  [FAIL] Backend DOWN" -ForegroundColor Red
}

# TEST 2 - FRONTEND BUILD (10 points)
Write-Host "`n[TEST 2/10] Frontend Build..." -ForegroundColor Yellow
cd frontend
$build = npm run build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Build reussi" -ForegroundColor Green
    $score += 10
} else {
    Write-Host "  [FAIL] Build echoue" -ForegroundColor Red
}

# TEST 3 - RESPONSIVE (10 points)
Write-Host "`n[TEST 3/10] Test Responsive..." -ForegroundColor Yellow
$responsivePages = @("HomePage", "SearchPage", "ProductPage")
$responsiveScore = 0
foreach ($page in $responsivePages) {
    if (Select-String -Path "src/pages/$page.tsx" -Pattern "(md:|lg:|sm:)" -Quiet) {
        $responsiveScore += 3.33
    }
}
Write-Host "  Score: $([math]::Round($responsiveScore, 0))/10" -ForegroundColor $(if ($responsiveScore -ge 7) { "Green" } else { "Red" })
$score += $responsiveScore

# TEST 4 - NAVIGATION COHERENCE (10 points)
Write-Host "`n[TEST 4/10] Coherence Navigation..." -ForegroundColor Yellow
$navScore = 0
# Check Navbar
if (Select-String -Path "src/components/Navbar.tsx" -Pattern "to=`"/profile`"" -Quiet) {
    $navScore += 2.5
    Write-Host "  [OK] Lien profil presente" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Lien profil absent" -ForegroundColor Red
}
# Check Bottom Nav
if (Select-String -Path "src/components/layout/MobileBottomNav.tsx" -Pattern "to=`"/`"" -Quiet -ErrorAction SilentlyContinue) {
    $navScore += 2.5
}
# Check HomePage auth buttons
if (Select-String -Path "src/pages/HomePage.tsx" -Pattern "(Login|S'inscrire|Connexion)" -Quiet) {
    $navScore += 2.5
    Write-Host "  [OK] Boutons auth visibles" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Boutons auth absents" -ForegroundColor Red
}
$score += $navScore

# TEST 5 - PROFIL UTILISATEUR (10 points)
Write-Host "`n[TEST 5/10] Profil Utilisateur..." -ForegroundColor Yellow
if (Select-String -Path "src/pages/ProfilePage.tsx" -Pattern "(email|name|isPremium)" -Quiet -ErrorAction SilentlyContinue) {
    Write-Host "  [OK] ProfilePage avec donnees" -ForegroundColor Green
    $score += 10
} else {
    Write-Host "  [FAIL] ProfilePage incomplete ou absente" -ForegroundColor Red
}

# TEST 6 - DESIGN SYSTEM (10 points)
Write-Host "`n[TEST 6/10] Design System..." -ForegroundColor Yellow
$designScore = 0
if (Test-Path "src/components/ui") {
    $designScore += 5
    Write-Host "  [OK] Dossier ui/ existe" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Pas de composants ui/" -ForegroundColor Yellow
}
if (Select-String -Path "src/pages/*.tsx" -Pattern "primary-500|shadow-2" -Quiet) {
    $designScore += 5
    Write-Host "  [OK] Tokens design utilises" -ForegroundColor Green
}
$score += $designScore

# TEST 7 - AUTH FLOW (15 points)
Write-Host "`n[TEST 7/10] Flux Authentification..." -ForegroundColor Yellow
$authScore = 0
# Check AuthContext
if (Test-Path "src/Contexts/AuthContext.tsx") {
    $authScore += 5
}
# Check Login/Register pages
if ((Test-Path "src/pages/LoginPage.tsx") -and (Test-Path "src/pages/RegisterPage.tsx")) {
    $authScore += 5
}
# Check protected routes
if (Select-String -Path "src/App.tsx" -Pattern "PrivateRoute|isAuthenticated" -Quiet -ErrorAction SilentlyContinue) {
    $authScore += 5
}
Write-Host "  Score: $authScore/15" -ForegroundColor $(if ($authScore -ge 10) { "Green" } else { "Red" })
$score += $authScore

# TEST 8 - PWA (10 points)
Write-Host "`n[TEST 8/10] Progressive Web App..." -ForegroundColor Yellow
if (Select-String -Path "vite.config.ts" -Pattern "VitePWA" -Quiet) {
    Write-Host "  [OK] VitePWA configure" -ForegroundColor Green
    $score += 10
} else {
    Write-Host "  [FAIL] PWA non configure" -ForegroundColor Red
}

# TEST 9 - PERFORMANCE (10 points)
Write-Host "`n[TEST 9/10] Performance Bundles..." -ForegroundColor Yellow
$distSize = (Get-ChildItem dist -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
if ($distSize -gt 0) {
    if ($distSize -lt 2) {
        Write-Host "  [OK] Bundle total: $([math]::Round($distSize, 2)) MB" -ForegroundColor Green
        $score += 10
    } else {
        Write-Host "  [WARN] Bundle: $([math]::Round($distSize, 2)) MB (>2MB)" -ForegroundColor Yellow
        $score += 5
    }
}

# TEST 10 - DOCUMENTATION (5 points)
Write-Host "`n[TEST 10/10] Documentation..." -ForegroundColor Yellow
cd ..
$docScore = 0
if (Test-Path "README.md") { $docScore += 1 }
if (Test-Path "HANDOVER_*.md") { $docScore += 2 }
if (Test-Path ".env.example") { $docScore += 2 }
Write-Host "  Score: $docScore/5" -ForegroundColor $(if ($docScore -ge 3) { "Green" } else { "Yellow" })
$score += $docScore

# RESULTAT FINAL
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SCORE FINAL: $score / $maxScore" -ForegroundColor $(if ($score -ge 70) { "Green" } elseif ($score -ge 50) { "Yellow" } else { "Red" })
Write-Host "========================================" -ForegroundColor Cyan

if ($score -ge 80) {
    Write-Host "`n✅ EXCELLENT - Pret production" -ForegroundColor Green
} elseif ($score -ge 60) {
    Write-Host "`n⚠️ BON - Quelques ameliorations necessaires" -ForegroundColor Yellow
} elseif ($score -ge 40) {
    Write-Host "`n❌ MOYEN - Refonte UX necessaire" -ForegroundColor Red
} else {
    Write-Host "`n🚨 CRITIQUE - Reprendre architecture" -ForegroundColor Red
}

Write-Host "`nVoir HANDOVER_CRITIQUE.md pour details" -ForegroundColor Cyan