require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const axios = require('axios');
const { calculateFoodScores } = require('../src/services/scoringEngine');

async function importFoodMassive(targetTotal = 5000) {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('? MongoDB connecté');

  const existing = await Product.countDocuments({ category: 'food' });
  console.log(`?? Produits food existants: ${existing}`);
  
  const toImport = Math.max(0, targetTotal - existing);
  if (toImport === 0) {
    console.log('? Objectif déjà atteint');
    process.exit(0);
  }

  console.log(`?? Objectif: importer ${toImport} nouveaux produits\n`);

  let imported = 0;
  let page = 1;
  const pageSize = 100;

  while (imported < toImport) {
    console.log(`\n?? Page ${page}...`);
    
    try {
      const categories = [
        'breakfast-cereals', 'yogurts', 'cheeses', 'breads', 
        'fruits', 'vegetables', 'pasta', 'rice', 'chicken',
        'spreads', 'cookies', 'chocolate', 'juices', 'waters'
      ];
      
      const category = categories[page % categories.length];
      
      const { data } = await axios.get(
        `https://world.openfoodfacts.org/category/${category}/${page}.json`,
        {
          params: {
            page_size: pageSize,
            fields: 'code,product_name,brands,image_url,nova_group,nutriscore_grade,ecoscore_grade,ingredients_text,additives_tags,labels_tags,packaging,origins,countries'
          },
          timeout: 10000
        }
      );

      const products = data.products || [];
      console.log(`  ? ${products.length} produits reçus`);

      for (const offProduct of products) {
        if (!offProduct.code || !offProduct.product_name) continue;
        if (offProduct.product_name.length < 3) continue;

        const exists = await Product.findOne({ barcode: offProduct.code });
        if (exists) continue;

        // Nettoyer nutriScore
        let nutriScore = undefined;
        if (offProduct.nutriscore_grade) {
          const grade = offProduct.nutriscore_grade.toUpperCase();
          if (['A', 'B', 'C', 'D', 'E'].includes(grade)) {
            nutriScore = grade;
          }
        }

        const foodData = {
          ingredients: offProduct.ingredients_text || '',
          additives: (offProduct.additives_tags || []).map(tag => ({
            tag,
            code: tag.replace('en:', '').toUpperCase()
          })),
          allergens: [],
          labels: offProduct.labels_tags || [],
          novaGroup: offProduct.nova_group,
          nutriScore,
          ecoScore: offProduct.ecoscore_grade?.toUpperCase()
        };

        let scores = {};
        try {
          scores = calculateFoodScores({
            novaGroup: foodData.novaGroup,
            nutriScore: foodData.nutriScore,
            ecoScore: foodData.ecoScore,
            additives: foodData.additives.map(a => a.code),
            allergens: [],
            labels: foodData.labels,
            packaging: offProduct.packaging,
            origin: offProduct.origins || offProduct.countries
          });
        } catch (err) {
          scores = { healthScore: 50, environmentScore: 50, overallScore: 50 };
        }

        const product = {
          barcode: offProduct.code,
          name: offProduct.product_name,
          brand: offProduct.brands || 'Sans marque',
          category: 'food',
          imageUrl: offProduct.image_url,
          foodData,
          scores
        };

        await Product.create(product);
        imported++;

        if (imported % 50 === 0) {
          console.log(`  ? ${imported}/${toImport} importés`);
        }

        if (imported >= toImport) break;
      }

      page++;
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (err) {
      console.error(`? Erreur page ${page}:`, err.message);
      page++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const finalCount = await Product.countDocuments({ category: 'food' });
  console.log(`\n? TERMINÉ`);
  console.log(`?? Total food en base: ${finalCount}`);
  process.exit(0);
}

importFoodMassive(5000).catch(err => {
  console.error('? Erreur fatale:', err);
  process.exit(1);
});
