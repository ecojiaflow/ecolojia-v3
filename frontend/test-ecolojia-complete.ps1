# Test-Ecolojia-Complete.ps1
# Script de validation complète du projet ECOLOJIA

param(
    [string]$BackendUrl = "http://localhost:10000",
    [string]$FrontendUrl = "http://localhost:5173",
    [switch]$SkipFrontend,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$VerbosePreference = if ($Verbose) { "Continue" } else { "SilentlyContinue" }

# Couleurs pour output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Info { Write-Host $args -ForegroundColor Cyan }

Write-Info "`n🚀 ECOLOJIA - Test de validation complète`n"

# Test de santé backend
Write-Info "1️⃣ Test de santé du backend..."
try {
    $health = Invoke-RestMethod -Uri "$BackendUrl/api/health" -Method GET
    Write-Success "✅ Backend opérationnel"
} catch {
    Write-Error "❌ Backend non accessible"
    exit 1
}

# Tests des analyses
Write-Info "`n2️⃣ Test des analyses par catégorie..."

$testCases = @(
    @{
        Name = "Alimentaire - Yaourt bio"
        Endpoint = "/api/analysis"
        Body = @{
            mode = "manual"
            name = "Yaourt nature bio"
            ingredients = "Lait entier bio, ferments lactiques"
            category = "food"
        }
    },
    @{
        Name = "Cosmétique - Crème bio"
        Endpoint = "/api/cosmetics/analyze"
        Body = @{
            name = "Crème visage bio"
            ingredients = "AQUA, ALOE BARBADENSIS LEAF JUICE, GLYCERIN, TOCOPHEROL"
            language = "fr"
        }
    },
    @{
        Name = "Détergent - Lessive éco"
        Endpoint = "/api/detergents/analyze"
        Body = @{
            name = "Lessive écologique"
            composition = "5-15% savon, agents de surface végétaux"
            language = "fr"
        }
    }
)

foreach ($test in $testCases) {
    try {
        $response = Invoke-RestMethod -Uri "$BackendUrl$($test.Endpoint)" -Method POST -Body ($test.Body | ConvertTo-Json) -ContentType "application/json"
        Write-Success "✅ $($test.Name) - OK"
    } catch {
        Write-Error "❌ $($test.Name) - Erreur: $_"
    }
}

Write-Info "`n✅ Tests terminés!"
