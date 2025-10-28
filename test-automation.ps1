# ========================================
# ECOLOJIA V3 - TESTS AUTOMATIQUES
# ========================================

$API_URL = "https://ecolojia-backendvf.onrender.com/api"
$FRONTEND_URL = "https://ecolojia.com"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "`n╔═══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   ECOLOJIA V3 - AUDIT AUTOMATIQUE            ║" -ForegroundColor Cyan
Write-Host "║   $timestamp                    ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$results = @()
$total = 0
$passed = 0

function Test-Endpoint {
    param($name, $url, $method = "GET", $body = $null, $token = $null)
    
    $total++
    Write-Host "Testing: $name..." -NoNewline
    
    try {
        $headers = @{"Content-Type" = "application/json"}
        if ($token) { $headers["Authorization"] = "Bearer $token" }
        
        $params = @{
            Uri = $url
            Method = $method
            Headers = $headers
            TimeoutSec = 10
        }
        
        if ($body) { $params["Body"] = ($body | ConvertTo-Json) }
        
        $response = Invoke-RestMethod @params
        $script:passed++
        Write-Host " ✅ PASS" -ForegroundColor Green
        return @{Status = "PASS"; Name = $name; Response = $response}
    }
    catch {
        Write-Host " ❌ FAIL" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
        return @{Status = "FAIL"; Name = $name; Error = $_.Exception.Message}
    }
}

# ========================================
# SECTION 1: TESTS BACKEND API
# ========================================

Write-Host "`n[SECTION 1] Tests Backend API`n" -ForegroundColor Magenta

# Test 1.1: Health Check
$results += Test-Endpoint "Health Check" "$API_URL/../health"

# Test 1.2: Produit Nutella
$results += Test-Endpoint "Product Nutella (3017620422003)" "$API_URL/products/3017620422003"

# Test 1.3: Recherche Algolia
$results += Test-Endpoint "Algolia Search 'nutella'" "$API_URL/algolia/search?q=nutella"

# Test 1.4: Autocomplete
$results += Test-Endpoint "Algolia Autocomplete" "$API_URL/algolia/autocomplete?q=nu&limit=5"

# Test 1.5: Produits Trending
$results += Test-Endpoint "Trending Products" "$API_URL/products/trending"

# Test 1.6: Login (obtenir token)
Write-Host "Testing: Login Premium User..." -NoNewline
try {
    $loginBody = @{
        email = "test@ecolojia.fr"
        password = "TestEcolojia2025!"
    }
    
    $loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method POST -Body ($loginBody | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 10
    $token = $loginResponse.token
    $script:passed++
    Write-Host " ✅ PASS (Token obtenu)" -ForegroundColor Green
    $results += @{Status = "PASS"; Name = "Login Premium User"; Token = $token}
}
catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
    $results += @{Status = "FAIL"; Name = "Login Premium User"; Error = $_.Exception.Message}
    $token = $null
}

# Test 1.7: Profile (avec token)
if ($token) {
    $results += Test-Endpoint "User Profile (authenticated)" "$API_URL/auth/profile" -token $token
}

# Test 1.8: Dashboard Stats
if ($token) {
    $results += Test-Endpoint "Dashboard Stats" "$API_URL/dashboard/stats?period=month" -token $token
}

# ========================================
# SECTION 2: TESTS FRONTEND
# ========================================

Write-Host "`n[SECTION 2] Tests Frontend (HTTP)`n" -ForegroundColor Magenta

# Test 2.1: Homepage
$results += Test-Endpoint "Frontend Homepage" "$FRONTEND_URL/"

# Test 2.2: Login Page
$results += Test-Endpoint "Login Page" "$FRONTEND_URL/login"

# Test 2.3: Premium Page
$results += Test-Endpoint "Premium Page" "$FRONTEND_URL/premium"

# ========================================
# SECTION 3: TESTS PERFORMANCE
# ========================================

Write-Host "`n[SECTION 3] Tests Performance`n" -ForegroundColor Magenta

# Test 3.1: Response Time API
Write-Host "Testing: API Response Time..." -NoNewline
try {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    Invoke-RestMethod -Uri "$API_URL/products/3017620422003" -TimeoutSec 5 | Out-Null
    $stopwatch.Stop()
    $responseTime = $stopwatch.ElapsedMilliseconds
    
    if ($responseTime -lt 500) {
        $script:passed++
        Write-Host " ✅ PASS ($responseTime ms)" -ForegroundColor Green
        $results += @{Status = "PASS"; Name = "API Response Time"; Value = "$responseTime ms"}
    } else {
        Write-Host " ⚠️  SLOW ($responseTime ms)" -ForegroundColor Yellow
        $results += @{Status = "WARN"; Name = "API Response Time"; Value = "$responseTime ms"}
    }
}
catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
    $results += @{Status = "FAIL"; Name = "API Response Time"}
}

# Test 3.2: Frontend Response Time
Write-Host "Testing: Frontend Response Time..." -NoNewline
try {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    Invoke-WebRequest -Uri "$FRONTEND_URL/" -TimeoutSec 5 -UseBasicParsing | Out-Null
    $stopwatch.Stop()
    $responseTime = $stopwatch.ElapsedMilliseconds
    
    if ($responseTime -lt 2000) {
        $script:passed++
        Write-Host " ✅ PASS ($responseTime ms)" -ForegroundColor Green
        $results += @{Status = "PASS"; Name = "Frontend Response Time"; Value = "$responseTime ms"}
    } else {
        Write-Host " ⚠️  SLOW ($responseTime ms)" -ForegroundColor Yellow
        $results += @{Status = "WARN"; Name = "Frontend Response Time"; Value = "$responseTime ms"}
    }
}
catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
    $results += @{Status = "FAIL"; Name = "Frontend Response Time"}
}

# ========================================
# RAPPORT FINAL
# ========================================

Write-Host "`n╔═══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              RAPPORT FINAL                    ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$failedTests = $results | Where-Object { $_.Status -eq "FAIL" }

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "✅ Passed: $passed" -ForegroundColor Green
Write-Host "❌ Failed: $($total - $passed)" -ForegroundColor Red
Write-Host "Success Rate: $([math]::Round(($passed/$total)*100, 2))%`n" -ForegroundColor $(if (($passed/$total) -gt 0.8) { "Green" } else { "Yellow" })

if ($failedTests.Count -gt 0) {
    Write-Host "FAILED TESTS:" -ForegroundColor Red
    foreach ($test in $failedTests) {
        Write-Host "  ❌ $($test.Name)" -ForegroundColor Red
        if ($test.Error) {
            Write-Host "     → $($test.Error)" -ForegroundColor Yellow
        }
    }
}

# Sauvegarder rapport
$reportFile = "TEST_REPORT_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
$results | ConvertTo-Json -Depth 5 | Out-File $reportFile -Encoding UTF8
Write-Host "`n📄 Rapport sauvegardé: $reportFile" -ForegroundColor Cyan

Write-Host "`n✅ Audit terminé !`n" -ForegroundColor Green
