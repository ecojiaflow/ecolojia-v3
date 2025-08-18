// Script d'import MongoDB COMPLET pour ECOLOJIA
// Import Food, Cosmetics et Detergents

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Product = require('../models/Product');

console.log('🚀 ECOLOJIA - Import COMPLET (Food + Cosmetics + Detergents)');
console.log('='.repeat(60));

async function importAllCategories() {
  try {
    // Connexion MongoDB
    console.log('📡 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecolojia');
    console.log('✅ Connecté à MongoDB!\n');

    let totalImported = 0;

    // 1. IMPORT ALIMENTAIRE
    console.log('🍎 === IMPORT PRODUITS ALIMENTAIRES ===');
    const foodQueries = ['bio', 'chocolat', 'lait', 'coca cola', 'chips', 'biscuit', 'eau minerale', 'jus fruit', 'yaourt', 'nutella'];
    totalImported += await importFromOpenFoodFacts(foodQueries, 'food');

    // 2. IMPORT COSMÉTIQUES  
    console.log('\n💄 === IMPORT PRODUITS COSMÉTIQUES ===');
    const cosmeticsQueries = ['shampoing', 'creme', 'savon', 'dentifrice', 'deodorant', 'gel douche', 'lotion', 'mascara', 'rouge levres', 'parfum'];
    totalImported += await importFromOpenBeautyFacts(cosmeticsQueries, 'cosmetics');

    // 3. IMPORT DÉTERGENTS
    console.log('\n🧹 === IMPORT PRODUITS DÉTERGENTS ===');
    const detergentProducts = [
      {
        barcode: '3450970103442',
        name: 'Ariel Pods 3en1 Original',
        brand: 'Ariel',
        category: 'detergents',
        imageUrl: 'https://images.openfoodfacts.org/images/products/345/097/010/3442/front_fr.4.400.jpg',
        detergentsData: {
          productType: 'lessive',
          form: 'capsules',
          ingredients: '15-30% agents de surface anioniques, 5-15% agents de surface non ioniques, <5% phosphonates, savon, enzymes, azurants optiques, parfums',
          usageInstructions: '1 capsule pour une charge normale',
          ecoLabel: false
        }
      },
      {
        barcode: '8001841831015',
        name: 'Dash Liquide Régulier',
        brand: 'Dash',
        category: 'detergents',
        imageUrl: 'https://images.openfoodfacts.org/images/products/800/184/183/1015/front_fr.4.400.jpg',
        detergentsData: {
          productType: 'lessive',
          form: 'liquide',
          ingredients: '5-15% agents de surface anioniques, <5% agents de surface non ioniques, phosphonates, savon, enzymes, parfums',
          usageInstructions: '35ml pour 4-5kg de linge',
          ecoLabel: false
        }
      },
      {
        barcode: '3178041324298',
        name: 'L\'Arbre Vert Lessive Liquide Écologique',
        brand: 'L\'Arbre Vert',
        category: 'detergents',
        imageUrl: 'https://images.openfoodfacts.org/images/products/317/804/132/4298/front_fr.4.400.jpg',
        detergentsData: {
          productType: 'lessive',
          form: 'liquide',
          ingredients: '5-15% agents de surface anioniques d\'origine végétale, <5% agents de surface non ioniques d\'origine végétale, savon',
          usageInstructions: '40ml pour une charge normale',
          ecoLabel: true,
          certifications: ['Ecocert', 'Ecolabel Européen']
        }
      },
      {
        barcode: '3015810921879',
        name: 'Mir Vaisselle Secrets de Bicarbonate',
        brand: 'Mir',
        category: 'detergents',
        imageUrl: 'https://images.openfoodfacts.org/images/products/301/581/092/1879/front_fr.4.400.jpg',
        detergentsData: {
          productType: 'liquide vaisselle',
          form: 'liquide',
          ingredients: '5-15% agents de surface anioniques, <5% agents de surface amphotères, parfums, conservateurs',
          usageInstructions: 'Quelques gouttes sur une éponge humide',
          ecoLabel: false
        }
      },
      {
        barcode: '3178041318501',
        name: 'L\'Arbre Vert Liquide Vaisselle Écologique',
        brand: 'L\'Arbre Vert',
        category: 'detergents',
        imageUrl: 'https://images.openfoodfacts.org/images/products/317/804/131/8501/front_fr.4.400.jpg',
        detergentsData: {
          productType: 'liquide vaisselle',
          form: 'liquide',
          ingredients: '5-15% agents de surface anioniques d\'origine végétale, <5% agents de surface amphotères d\'origine végétale',
          usageInstructions: 'Verser sur éponge humide',
          ecoLabel: true,
          certifications: ['Ecocert']
        }
      },
      {
        barcode: '5410091721454',
        name: 'Ajax Nettoyant Multi-Surfaces',
        brand: 'Ajax',
        category: 'detergents',
        imageUrl: 'https://images.openfoodfacts.org/images/products/541/009/172/1454/front_fr.4.400.jpg',
        detergentsData: {
          productType: 'nettoyant multi-surfaces',
          form: 'liquide',
          ingredients: '<5% agents de surface non ioniques, agents de surface anioniques, savon, parfums',
          usageInstructions: 'Diluer dans l\'eau selon salissure',
          ecoLabel: false
        }
      },
      {
        barcode: '3450970049436',
        name: 'Skip Ultimate Triple Pouvoir',
        brand: 'Skip',
        category: 'detergents',
        imageUrl: 'https://images.openfoodfacts.org/images/products/345/097/004/9436/front_fr.4.400.jpg',
        detergentsData: {
          productType: 'lessive',
          form: 'capsules',
          ingredients: '15-30% agents de surface anioniques, 5-15% agents de surface non ioniques, <5% phosphonates, polycarboxylates, enzymes, azurants optiques, parfums',
          usageInstructions: '1 capsule = 1 lavage',
          ecoLabel: false
        }
      },
      {
        barcode: '8718114742892',
        name: 'Ecover Lessive Liquide Universal',
        brand: 'Ecover',
        category: 'detergents',
        imageUrl: 'https://images.openfoodfacts.org/images/products/871/811/474/2892/front_fr.4.400.jpg',
        detergentsData: {
          productType: 'lessive',
          form: 'liquide',
          ingredients: '5-15% agents de surface anioniques, <5% agents de surface non ioniques, savon, parfums',
          usageInstructions: '35ml pour 4-5kg de linge peu sale',
          ecoLabel: true,
          certifications: ['Ecocert', 'Leaping Bunny']
        }
      }
    ];

    console.log(`📦 Import de ${detergentProducts.length} détergents...`);
    for (const product of detergentProducts) {
      try {
        await Product.findOneAndUpdate(
          { barcode: product.barcode },
          product,
          { upsert: true, new: true }
        );
        console.log(`  ✅ ${product.name}`);
        totalImported++;
      } catch (error) {
        console.error(`  ❌ Erreur pour ${product.name}:`, error.message);
      }
    }

    // RÉSUMÉ FINAL
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ FINAL:');
    console.log(`✅ Total produits importés: ${totalImported}`);
    
    const counts = await Promise.all([
      Product.countDocuments({ category: 'food' }),
      Product.countDocuments({ category: 'cosmetics' }),
      Product.countDocuments({ category: 'detergents' })
    ]);
    
    console.log(`🍎 Alimentaire: ${counts[0]} produits`);
    console.log(`💄 Cosmétiques: ${counts[1]} produits`);
    console.log(`🧹 Détergents: ${counts[2]} produits`);
    console.log(`📦 TOTAL EN BASE: ${counts[0] + counts[1] + counts[2]} produits`);

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Import terminé!');
  }
}

// Fonction pour OpenFoodFacts (alimentaire)
async function importFromOpenFoodFacts(queries, category) {
  let imported = 0;
  
  for (const query of queries) {
    try {
      console.log(`  🔍 Recherche: ${query}...`);
      
      const response = await axios.get('https://world.openfoodfacts.org/cgi/search.pl', {
        params: {
          search_terms: query,
          search_simple: 1,
          json: 1,
          page_size: 10,
          tagtype_0: 'countries',
          tag_contains_0: 'contains',
          tag_0: 'france'
        },
        timeout: 10000
      });

      if (response.data.products) {
        for (const p of response.data.products) {
          if (!p.code || !p.product_name) continue;
          
          try {
            await Product.findOneAndUpdate(
              { barcode: p.code },
              {
                barcode: p.code,
                name: p.product_name,
                brand: p.brands || 'Marque inconnue',
                category: category,
                imageUrl: p.image_url || p.image_front_url,
                foodData: {
                  ingredients: p.ingredients_text ? [p.ingredients_text] : [],
                  allergens: p.allergens_tags || [],
                  novaScore: p.nova_group ? parseInt(p.nova_group) : undefined,
                  nutriScore: p.nutriscore_grade?.toUpperCase(),
                  ecoScore: p.ecoscore_grade?.toUpperCase()
                }
              },
              { upsert: true, new: true }
            );
            imported++;
          } catch (err) {
            // Ignorer les doublons
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`    ❌ Erreur recherche ${query}:`, error.message);
    }
  }
  
  console.log(`  ✅ ${imported} produits alimentaires importés`);
  return imported;
}

// Fonction pour OpenBeautyFacts (cosmétiques)
async function importFromOpenBeautyFacts(queries, category) {
  let imported = 0;
  
  // Produits cosmétiques manuels (OpenBeautyFacts moins fourni)
  const cosmeticProducts = [
    {
      barcode: '3600523586523',
      name: 'Mixa Intensif Crème Mains Réparation Forte',
      brand: 'Mixa',
      imageUrl: 'https://images.openbeautyfacts.org/images/products/360/052/358/6523/front_fr.4.400.jpg',
      cosmeticsData: {
        inciList: 'Aqua, Glycerin, Dimethicone, Glyceryl Stearate, PEG-100 Stearate, Butyrospermum Parkii Butter, Cetearyl Alcohol'
      }
    },
    {
      barcode: '3600541121584',
      name: 'L\'Oréal Men Expert Déodorant Carbon Protect',
      brand: 'L\'Oréal',
      imageUrl: 'https://images.openbeautyfacts.org/images/products/360/054/112/1584/front_fr.4.400.jpg',
      cosmeticsData: {
        inciList: 'Butane, Isobutane, Propane, Aluminum Chlorohydrate, Isocetyl Stearate, Parfum'
      }
    },
    {
      barcode: '3574661467528',
      name: 'Dove Original Déodorant',
      brand: 'Dove',
      imageUrl: 'https://images.openbeautyfacts.org/images/products/357/466/146/7528/front_fr.4.400.jpg',
      cosmeticsData: {
        inciList: 'Aqua, Aluminum Chlorohydrate, Glycerin, Helianthus Annuus Seed Oil, Steareth-2'
      }
    },
    {
      barcode: '8710522327944',
      name: 'Signal Dentifrice Integral 8 Complet',
      brand: 'Signal',
      imageUrl: 'https://images.openbeautyfacts.org/images/products/871/052/232/7944/front_fr.4.400.jpg',
      cosmeticsData: {
        inciList: 'Aqua, Sorbitol, Hydrated Silica, Sodium Lauryl Sulfate, PEG-32, Aroma, Cellulose Gum, Sodium Fluoride'
      }
    },
    {
      barcode: '3600530704156',
      name: 'Garnier SkinActive Eau Micellaire',
      brand: 'Garnier',
      imageUrl: 'https://images.openbeautyfacts.org/images/products/360/053/070/4156/front_fr.4.400.jpg',
      cosmeticsData: {
        inciList: 'Aqua, Hexylene Glycol, Glycerin, Poloxamer 184, Disodium Cocoamphodiacetate, Disodium EDTA'
      }
    },
    {
      barcode: '3600523569625',
      name: 'Nivea Crème Hydratante',
      brand: 'Nivea',
      imageUrl: 'https://images.openbeautyfacts.org/images/products/360/052/356/9625/front_fr.4.400.jpg',
      cosmeticsData: {
        inciList: 'Aqua, Paraffinum Liquidum, Cera Microcristallina, Glycerin, Lanolin Alcohol, Paraffin'
      }
    },
    {
      barcode: '3614272049529',
      name: 'Yves Rocher Shampooing Nutrition',
      brand: 'Yves Rocher',
      imageUrl: 'https://images.openbeautyfacts.org/images/products/361/427/204/9529/front_fr.4.400.jpg',
      cosmeticsData: {
        inciList: 'Aqua, Sodium Laureth Sulfate, Cocamidopropyl Betaine, Sodium Chloride, Parfum, Citric Acid'
      }
    }
  ];

  console.log(`  📦 Import de ${cosmeticProducts.length} cosmétiques...`);
  for (const product of cosmeticProducts) {
    try {
      await Product.findOneAndUpdate(
        { barcode: product.barcode },
        { ...product, category: 'cosmetics' },
        { upsert: true, new: true }
      );
      imported++;
    } catch (err) {
      // Ignorer les erreurs
    }
  }

  console.log(`  ✅ ${imported} produits cosmétiques importés`);
  return imported;
}

// Lancer l'import
importAllCategories();
