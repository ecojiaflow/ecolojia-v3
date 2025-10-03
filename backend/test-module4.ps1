# Test Module 4 - PowerShell Version
Write-Host "🧪 Module 4 - OpenFoodFacts Integration Tests (PowerShell)" -ForegroundColor Yellow
Write-Host ""

# Test 1: Check OFF for Nutella
Write-Host "1️⃣ Checking Nutella on OFF..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:10000/api/products/check-off/3017620422003" -Method Get
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✅ OFF check: $($data.found)" -ForegroundColor Green
    Write-Host "   Source: $($data.source)" -ForegroundColor Gray
    if ($data.data) {
        Write-Host "   Product: $($data.data.name)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

# Test 2: Enrich existing product
Write-Host "`n2️⃣ Enriching Nutella..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:10000/api/products/enrich/3017620422003" -Method Post
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✅ Enrichment: $($data.message)" -ForegroundColor Green
    if ($data.product.nutriscore_grade) {
        Write-Host "   Nutriscore: $($data.product.nutriscore_grade)" -ForegroundColor Gray
    }
    if ($data.product.nova_group) {
        Write-Host "   Nova group: $($data.product.nova_group)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

# Test 3: Get all products
Write-Host "`n3️⃣ Verifying products count..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:10000/api/products" -Method Get
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✅ Total products: $($data.Length)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

# Test 4: Create and enrich new product
Write-Host "`n4️⃣ Creating and enriching new product (Barilla)..." -ForegroundColor Cyan
$productData = @{
    barcode = "8076800195057"
    name = "Pâtes Barilla"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:10000/api/products/create-and-enrich" `
        -Method Post `
        -ContentType "application/json" `
        -Body $productData
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✅ New product: $($data.message)" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "⚠️  Product already exists (OK)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Error: $_" -ForegroundColor Red
    }
}

Write-Host "`n✅ All tests completed!" -ForegroundColor Green
