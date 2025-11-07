const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

// Charger le modèle Product
const Product = require('./src/models/Product');

// Fonction pour générer un score réaliste pour cosmétiques
function generateCosmeticScore(product) {
  let baseScore = 70; // Score de base
  
  // Ajuster selon les ingrédients
  const inci = product.cosmeticData.inci || [];
  const inciText = inci.join(' ').toLowerCase();
  
  // Pénalités
  if (inciText.includes('paraben')) baseScore -= 15;
  if (inciText.includes('sulfate') && inciText.includes('sodium laureth')) baseScore -= 10;
  if (inciText.includes('silicone') || inciText.includes('dimethicone')) baseScore -= 5;
  if (inciText.includes('mineral oil') || inciText.includes('petrolatum')) baseScore -= 10;
  if (inciText.includes('peg-')) baseScore -= 8;
  
  // Bonus
  if (product.cosmeticData.labels && product.cosmeticData.labels.length > 0) {
    baseScore += product.cosmeticData.labels.length * 5;
  }
  if (product.cosmeticData.crueltyFree) baseScore += 5;
  if (inciText.includes('bio') || inciText.includes('organic')) baseScore += 10;
  
  // Limiter entre 20 et 95
  return Math.max(20, Math.min(95, baseScore));
}

// Fonction pour générer un score réaliste pour détergents
function generateDetergentScore(product) {
  let baseScore = 65;
  
  // Bonus éco-labels
  if (product.detergentData.labels && product.detergentData.labels.length > 0) {
    baseScore += 15;
  }
  
  // Biodégradabilité
  if (product.detergentData.biodegradability > 90) baseScore += 10;
  else if (product.detergentData.biodegradability < 70) baseScore -= 10;
  
  // Toxicité
  if (product.detergentData.ecotoxicity === 'Faible') baseScore += 10;
  else if (product.detergentData.ecotoxicity === 'Élevée') baseScore -= 15;
  
  // Parfum
  if (product.detergentData.fragrance === 'Naturel') baseScore += 5;
  
  // Limiter entre 30 et 90
  return Math.max(30, Math.min(90, baseScore));
}

// Fonction pour importer des cosmétiques depuis Open Beauty Facts
async function importCosmetics(limit = 500) {
  console.log(`\n📦 Import ${limit} produits cosmétiques depuis Open Beauty Facts...`);
  
  try {
    const response = await axios.get('https://world.openbeautyfacts.org/cgi/search.pl', {
      params: {
        action: 'process',
        json: true,
        page_size: limit,
        fields: 'code,product_name,brands,ingredients_text,categories,labels,image_url'
      },
      timeout: 30000
    });
    
    if (!response.data || !response.data.products) {
      console.log('❌ Aucun produit reçu de Open Beauty Facts');
      return 0;
    }
    
    const products = response.data.products;
    console.log(`✅ ${products.length} produits reçus de l'API`);
    
    let imported = 0;
    let skipped = 0;
    
    for (const obfProduct of products) {
      try {
        // Vérifier si produit existe déjà
        if (obfProduct.code) {
          const existing = await Product.findOne({ barcode: obfProduct.code });
          if (existing) {
            skipped++;
            continue;
          }
        }
        
        // Transformer en format Ecolojia
        const productData = {
          barcode: obfProduct.code || `COSMETIC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: obfProduct.product_name || 'Produit cosmétique',
          brand: obfProduct.brands || 'Marque inconnue',
          categoryType: 'cosmetic',
          
          cosmeticData: {
            inci: obfProduct.ingredients_text ? 
              obfProduct.ingredients_text.split(',').map(i => i.trim()).slice(0, 20) : 
              ['Aqua', 'Glycerin', 'Cetearyl Alcohol'],
            allergens: [],
            endocrineDisruptors: [],
            biodegradability: Math.floor(Math.random() * 40) + 60,
            labels: obfProduct.labels ? obfProduct.labels.split(',').map(l => l.trim()).slice(0, 3) : [],
            crueltyFree: Math.random() > 0.5
          },
          
          image: obfProduct.image_url || '',
          origin: 'Open Beauty Facts',
          aiEnriched: false,
          sources: ['Open Beauty Facts']
        };
        
        // Générer score réaliste
        const score = generateCosmeticScore(productData);
        productData.scores = {
          overallScore: score,
          breakdown: {
            ingredients: score,
            endocrineDisruptors: score + Math.floor(Math.random() * 10) - 5,
            biodegradability: productData.cosmeticData.biodegradability,
            labels: productData.cosmeticData.labels.length * 20
          },
          confidence: 0.75,
          completeness: 'good'
        };
        
        // Créer et sauvegarder
        const product = new Product(productData);
        await product.save();
        imported++;
        
        if (imported % 50 === 0) {
          console.log(`  ⏳ ${imported}/${products.length} cosmétiques importés...`);
        }
        
      } catch (productError) {
        console.log(`  ⚠️ Erreur import: ${productError.message}`);
      }
    }
    
    console.log(`\n✅ Cosmétiques importés: ${imported}`);
    console.log(`⚠️ Cosmétiques ignorés (déjà en base): ${skipped}`);
    
    return imported;
    
  } catch (error) {
    console.error('❌ Erreur API Open Beauty Facts:', error.message);
    return 0;
  }
}

// Fonction pour créer des détergents mock
async function importDetergents(count = 500) {
  console.log(`\n🧼 Création ${count} produits détergents mock...`);
  
  const detergentTypes = [
    'Lessive liquide', 'Liquide vaisselle', 'Nettoyant multi-surfaces',
    'Lessive en poudre', 'Produit WC', 'Nettoyant salle de bain',
    'Détergent lave-vaisselle', 'Adoucissant', 'Nettoyant vitres',
    'Dégraissant cuisine'
  ];
  
  const brands = [
    'Ariel', 'Skip', 'Le Chat', 'X-TRA', 'Mir', 'Paic', 'Cif',
    'Sanytol', 'Frosch', 'Ecover', "L'Arbre Vert", 'Rainett'
  ];
  
  const surfactants = [
    'Sodium Laureth Sulfate', 'Cocamidopropyl Betaine',
    'Sodium Lauryl Sulfate', 'Linear Alkylbenzene Sulfonate'
  ];
  
  let imported = 0;
  
  for (let i = 0; i < count; i++) {
    try {
      const type = detergentTypes[Math.floor(Math.random() * detergentTypes.length)];
      const brand = brands[Math.floor(Math.random() * brands.length)];
      const barcode = `DETERGENT_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
      
      const productData = {
        barcode,
        name: `${brand} ${type}`,
        brand,
        categoryType: 'detergent',
        
        detergentData: {
          composition: surfactants.slice(0, 3),
          surfactants: Math.floor(Math.random() * 30) + 10,
          biodegradability: Math.floor(Math.random() * 40) + 60,
          ecotoxicity: ['Faible', 'Modérée', 'Élevée'][Math.floor(Math.random() * 3)],
          fragrance: Math.random() > 0.3 ? 'Synthétique' : 'Naturel',
          labels: Math.random() > 0.7 ? ['Ecolabel UE'] : []
        },
        
        origin: 'Mock data',
        aiEnriched: false,
        sources: ['Generated']
      };
      
      // Générer score réaliste
      const score = generateDetergentScore(productData);
      productData.scores = {
        overallScore: score,
        breakdown: {
          composition: score,
          biodegradability: productData.detergentData.biodegradability,
          toxicity: score - 5,
          ecoLabels: productData.detergentData.labels.length * 20
        },
        confidence: 0.8,
        completeness: 'good'
      };
      
      // Créer et sauvegarder
      const product = new Product(productData);
      await product.save();
      imported++;
      
      if (imported % 100 === 0) {
        console.log(`  ⏳ ${imported}/${count} détergents créés...`);
      }
      
    } catch (error) {
      console.log(`  ⚠️ Erreur création: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Détergents créés: ${imported}`);
  return imported;
}

// Fonction principale
async function main() {
  try {
    console.log('🔄 Connexion MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté\n');
    
    console.log('========================================');
    console.log('  IMPORT PRODUITS - DÉBUT');
    console.log('========================================');
    
    const startTime = Date.now();
    
    // Importer cosmétiques
    const cosmeticsCount = await importCosmetics(500);
    
    // Créer détergents
    const detergentsCount = await importDetergents(500);
    
    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);
    
    console.log('\n========================================');
    console.log('  IMPORT TERMINÉ');
    console.log('========================================');
    console.log(`✅ Total cosmétiques: ${cosmeticsCount}`);
    console.log(`✅ Total détergents: ${detergentsCount}`);
    console.log(`✅ Total importé: ${cosmeticsCount + detergentsCount}`);
    console.log(`⏱️  Durée: ${duration}s (${Math.floor(duration / 60)}min ${duration % 60}s)`);
    
    await mongoose.connection.close();
    console.log('\n✅ Connexion MongoDB fermée');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Lancer l'import
main();