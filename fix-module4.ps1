# ═══════════════════════════════════════════════════════════
# ECOLOJIA V3 - CORRECTION AUTOMATIQUE MODULE 4
# ═══════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"
$projectPath = "C:\Users\salim\Desktop\ECOLOJIA VF CLEAN"
$servicePath = "$projectPath\backend\src\services\enrichment.service.js"

Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  CORRECTION AUTOMATIQUE MODULE 4 - ENRICHMENT SERVICE   ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# ─────────────────────────────────────────────────────────
# ÉTAPE 1 : Backup automatique
# ─────────────────────────────────────────────────────────
Write-Host "[1/5] Création backup de sécurité..." -ForegroundColor Yellow
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupPath = "$servicePath.backup-$timestamp"
Copy-Item $servicePath $backupPath -Force
Write-Host "      ✅ Backup créé: enrichment.service.js.backup-$timestamp`n" -ForegroundColor Green

# ─────────────────────────────────────────────────────────
# ÉTAPE 2 : Écriture fichier corrigé
# ─────────────────────────────────────────────────────────
Write-Host "[2/5] Écriture fichier corrigé..." -ForegroundColor Yellow

$newContent = @'
const { fetchExternalData } = require('./offClient');
const Product = require('../models/Product');

/**
 * Enrichit et sauvegarde un produit depuis OpenFoodFacts/OpenBeautyFacts
 */
async function enrichProduct(barcode, category = 'food') {
  console.log(`[Enrichment] Fetching ${barcode} from ${category}`);
  
  // 1. Appeler OFF/OBF
  const offData = await fetchExternalData(barcode, category);
  
  if (!offData || !offData.name) {
    console.log(`[Enrichment] Aucune donnée trouvée pour ${barcode}`);
    return null;
  }

  // 2. Normaliser les données
  const productData = {
    barcode: barcode,
    code: barcode,
    name: offData.name || 'Produit sans nom',
    brand: offData.brand || 'Marque inconnue',
    category: category,
    
    // Scores
    nutriScore: offData.nutriScore,
    novaGroup: offData.novaGroup,
    ecoScore: offData.ecoScore,
    
    // Additifs
    additives: offData.additives || [],
    additives_tags: offData.additives || [],
    
    // Image
    image_url: offData.imageUrl,
    image: offData.imageUrl,
    
    // Ingrédients
    ingredients_text: offData.ingredients,
    
    // Métadonnées
    source: 'OpenFoodFacts',
    lastEnriched: new Date(),
    viewCount: 0
  };

  // 3. Sauvegarder dans MongoDB - CORRECTION APPLIQUÉE
  try {
    // Supprimer l'ancien produit s'il existe (force la mise à jour complète)
    await Product.deleteOne({ barcode: barcode });
    
    // Créer le produit avec toutes les nouvelles données OFF
    const product = await Product.create(productData);
    
    console.log(`[Enrichment] ✅ Produit complètement sauvegardé: ${product.name} - NutriScore: ${product.nutriScore} - NOVA: ${product.novaGroup} - Additifs: ${product.additives?.length || 0}`);
    return product;
  } catch (error) {
    console.error(`[Enrichment] Erreur sauvegarde:`, error.message);
    return productData;
  }
}

/**
 * Vérifie si un produit nécessite un enrichissement
 */
function needsEnrichment(product) {
  if (!product) return true;
  if (!product.name || product.name === 'Produit sans nom') return true;
  if (!product.brand || product.brand === 'Marque inconnue') return true;
  if (!product.source || product.source === 'manual') return true;
  
  // Enrichir si trop ancien (>30 jours)
  if (product.lastEnriched) {
    const daysSince = (Date.now() - product.lastEnriched.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > 30) return true;
  }
  
  return false;
}

module.exports = { enrichProduct, needsEnrichment };
'@

[System.IO.File]::WriteAllText($servicePath, $newContent, [System.Text.Encoding]::UTF8)
Write-Host "      ✅ Fichier corrigé écrit avec succès`n" -ForegroundColor Green

# ─────────────────────────────────────────────────────────
# ÉTAPE 3 : Redémarrage backend
# ─────────────────────────────────────────────────────────
Write-Host "[3/5] Arrêt processus backend existants..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Where-Object {$_.Path -like "*$projectPath*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "      ✅ Processus arrêtés`n" -ForegroundColor Green

Write-Host "[4/5] Démarrage nouveau backend..." -ForegroundColor Yellow
Write-Host "      ⚠️  Une nouvelle fenêtre va s'ouvrir - NE PAS LA FERMER`n" -ForegroundColor Yellow

$backendPath = "$projectPath\backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendPath'; npm run dev"

Write-Host "      ⏳ Attente démarrage serveur (15 secondes)..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

# ─────────────────────────────────────────────────────────
# ÉTAPE 5 : Tests validation
# ─────────────────────────────────────────────────────────
Write-Host "[5/5] Validation Module 4..." -ForegroundColor Yellow

# Test santé API
try {
    $health = Invoke-WebRequest "http://localhost:10000/api/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "      ✅ API backend opérationnelle`n" -ForegroundColor Green
} catch {
    Write-Host "      ❌ API backend non accessible - Vérifiez la console backend`n" -ForegroundColor Red
    exit 1
}

# Supprimer ancien Nutella
Write-Host "      🗑️  Suppression ancien produit Nutella..." -ForegroundColor Cyan
try {
    Invoke-WebRequest -Uri "http://localhost:10000/api/products/barcode/3017620422003" -Method DELETE -ErrorAction SilentlyContinue
} catch {
    # Produit peut ne pas exister, c'est OK
}
Start-Sleep -Seconds 2

# Récupérer nouveau produit enrichi
Write-Host "      🔄 Nouvel enrichissement depuis OpenFoodFacts...`n" -ForegroundColor Cyan
Start-Sleep -Seconds 3

try {
    $response = Invoke-WebRequest "http://localhost:10000/api/products/barcode/3017620422003" -TimeoutSec 10
    $product = ($response.Content | ConvertFrom-Json).product

    # Affichage résultats
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║           VALIDATION MODULE 4 - NUTELLA                  ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

    $checks = @(
        @{Label="Nom"; Value=$product.name; Check={$product.name -eq "Nutella"}},
        @{Label="Source"; Value=$product.source; Check={$product.source -eq "OpenFoodFacts"}},
        @{Label="NutriScore"; Value=$product.nutriScore; Check={$product.nutriScore -ne $null -and $product.nutriScore -ne ""}},
        @{Label="NOVA Group"; Value=$product.novaGroup; Check={$product.novaGroup -ne $null}},
        @{Label="Additifs"; Value=$product.additives.Count; Check={$product.additives.Count -gt 0}},
        @{Label="Ingrédients"; Value=""; Check={$product.ingredients_text -ne $null -and $product.ingredients_text -ne ""}},
        @{Label="Image URL"; Value=""; Check={$product.image_url -ne $null -and $product.image_url -ne ""}},
        @{Label="Date enrichi"; Value=$product.lastEnriched; Check={$product.lastEnriched -ne $null}}
    )

    $allPassed = $true
    foreach ($check in $checks) {
        $passed = & $check.Check
        $status = if ($passed) { "✅" } else { "❌"; $allPassed = $false }
        $color = if ($passed) { "Green" } else { "Red" }
        
        $displayValue = if ($check.Value -eq "" -and $check.Check) { 
            if ($passed) { "OK" } else { "MANQUANT" }
        } else { 
            $check.Value 
        }
        
        Write-Host "  $status $($check.Label.PadRight(15)) : $displayValue" -ForegroundColor $color
    }

    Write-Host ""
    if ($allPassed) {
        Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║  🎉 MODULE 4 VALIDÉ AVEC SUCCÈS !                        ║" -ForegroundColor Green
        Write-Host "║  ✅ Toutes les données OpenFoodFacts sont présentes      ║" -ForegroundColor Green
        Write-Host "║  ✅ Prêt à passer au Module 5 (Scoring)                 ║" -ForegroundColor Green
        Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
        
        # Créer checkpoint
        $checkpoint = @"

═══════════════════════════════════════════════════════════
CHECKPOINT MODULE 4 - $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')
═══════════════════════════════════════════════════════════

✅ MODULE 4 VALIDÉ

Modifications appliquées :
- enrichment.service.js corrigé (deleteOne + create au lieu de findOneAndUpdate)
- Backup créé : $backupPath

Tests validés :
- ✅ Source : OpenFoodFacts
- ✅ NutriScore : $($product.nutriScore)
- ✅ NOVA Group : $($product.novaGroup)
- ✅ Additifs : $($product.additives.Count) trouvés
- ✅ Ingrédients : Présents
- ✅ Image URL : Présente
- ✅ Date enrichissement : $($product.lastEnriched)

Produit test : Nutella (3017620422003)

Prochaine étape : Module 5 - Scoring V2
═══════════════════════════════════════════════════════════

"@
        
        Add-Content -Path "$projectPath\PROGRESS.md" -Value $checkpoint -Encoding UTF8
        Write-Host "`n✅ Checkpoint sauvegardé dans PROGRESS.md`n" -ForegroundColor Cyan
        
    } else {
        Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Red
        Write-Host "║  ⚠️  VALIDATION ÉCHOUÉE                                   ║" -ForegroundColor Red
        Write-Host "║  Vérifiez les logs dans la console backend                ║" -ForegroundColor Red
        Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Red
    }

} catch {
    Write-Host "❌ ERREUR lors du test: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Vérifiez que le backend est bien démarré dans l'autre console`n" -ForegroundColor Yellow
}

Write-Host "`nScript terminé. Appuyez sur Entrée pour fermer..." -ForegroundColor Gray
$null = Read-Host