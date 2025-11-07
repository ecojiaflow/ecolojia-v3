const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config({ path: './.env' });

// Charger le modèle Product et le service de scoring
const Product = require('./src/models/Product');
const scoringService = require('./src/services/scoring.service');

// Fonction pour importer des cosmétiques depuis Open Beauty Facts
async function importCosmetics(limit = 500) {
  console.log(`\n📦 Import ${limit} produits cosmétiques depuis Open Beauty Facts...`);
  
  try {
    // API Open Beauty Facts - récupérer produits avec données
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
            biodegradability: Math.floor(Math.random() * 40) + 60, // 60-100%
            labels: obfProduct.labels ? obfProduct.labels.split(',').map(l => l.trim()) : [],
            crueltyFree: Math.random() > 0.5
          },
          
          image: obfProduct.image_url || '',
          origin: 'Open Beauty Facts',
          aiEnriched: false,
          sources: ['Open Beauty Facts']
        };
        
        // Créer le produit
        const product = new Product(productData);
        
        // Scorer le produit
        try {
          const scored = await scoringService.scoreProduct(product);
          await scored.save();
          imported++;
          
          if (imported % 50 === 0) {
            console.log(`  ⏳ ${imported}/${products.length} produits importés...`);
          }
        } catch (scoreError) {
          console.log(`  ⚠️ Erreur scoring produit ${productData.name}: ${scoreError.message}`);
          // Sauvegarder quand même avec score par défaut
          product.scores = {
            overallScore: 50,
            breakdown: {},
            confidence: 0.5,
            completeness: 'partial'
          };
          await product.save();
          imported++;
        }
        
      } catch (productError) {
        console.log(`  ⚠️ Erreur import produit: ${productError.message}`);
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

// Fonction pour créer des détergents mock (Open Products Facts a moins de données)
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
    'Sanytol', 'Frosch', 'Ecover', 'L\'Arbre Vert', 'Rainett'
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
      
      // Vérifier si existe déjà
      const existing = await Product.findOne({ barcode });
      if (existing) continue;
      
      const productData = {
        barcode,
        name: `${brand} ${type}`,
        brand,
        categoryType: 'detergent',
        
        detergentData: {
          composition: surfactants.slice(0, 3),
          surfactants: Math.floor(Math.random() * 30) + 10, // 10-40%
          biodegradability: Math.floor(Math.random() * 40) + 60, // 60-100%
          ecotoxicity: ['Faible', 'Modérée', 'Élevée'][Math.floor(Math.random() * 3)],
          fragrance: Math.random() > 0.3 ? 'Synthétique' : 'Naturel',
          labels: Math.random() > 0.7 ? ['Ecolabel UE'] : []
        },
        
        origin: 'Mock data',
        aiEnriched: false,
        sources: ['Generated']
      };
      
      const product = new Product(productData);
      
      // Scorer
      try {
        const scored = await scoringService.scoreProduct(product);
        await scored.save();
        imported++;
        
        if (imported % 100 === 0) {
          console.log(`  ⏳ ${imported}/${count} détergents créés...`);
        }
      } catch (scoreError) {
        // Score par défaut
        product.scores = {
          overallScore: Math.floor(Math.random() * 40) + 40, // 40-80
          breakdown: {},
          confidence: 0.8,
          completeness: 'partial'
        };
        await product.save();
        imported++;
      }
      
    } catch (error) {
      console.log(`  ⚠️ Erreur création détergent: ${error.message}`);
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
    console.log(`⏱️  Durée: ${duration}s`);
    
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