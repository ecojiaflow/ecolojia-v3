require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

// Mapping tags OpenFoodFacts â†’ subcategories FR lisibles
const CATEGORY_MAP = {
  // LÃ©gumes/Conserves
  'en:palm-hearts': 'conserves-legumes',
  'en:canned-vegetables': 'conserves-legumes',
  'en:tomatoes': 'conserves-legumes',
  'en:green-beans': 'conserves-legumes',
  'en:corn': 'conserves-legumes',
  'en:peas': 'conserves-legumes',
  'en:carrots': 'conserves-legumes',
  'en:mushrooms': 'conserves-legumes',
  
  // Fruits
  'en:fresh-fruits': 'fruits-frais',
  'en:apples': 'fruits-frais',
  'en:bananas': 'fruits-frais',
  'en:oranges': 'fruits-frais',
  'en:compotes': 'compotes',
  'en:fruit-compotes': 'compotes',
  'en:fruit-purÃ©es': 'compotes',
  
  // Produits laitiers
  'en:yogurts': 'yaourts',
  'en:fermented-milk-products': 'yaourts',
  'en:plant-based-yogurt-alternatives': 'yaourts-vegetaux',
  'en:cheeses': 'fromages',
  'en:milk': 'produits-laitiers',
  'en:plant-based-milk-alternatives': 'laits-vegetaux',
  'en:butter': 'beurre',
  'en:cream': 'creme',
  
  // CÃ©rÃ©ales/FÃ©culents
  'en:breakfast-cereals': 'cereales',
  'en:pastas': 'pates',
  'en:rice': 'riz',
  'en:breads': 'pains',
  'en:rusks': 'biscottes',
  'en:flour': 'farines',
  
  // Boissons
  'en:waters': 'eaux',
  'en:fruit-juices': 'jus',
  'en:sodas': 'sodas',
  'en:plant-based-beverages': 'boissons-vegetales',
  'en:coffees': 'cafes',
  'en:teas': 'thes',
  
  // Sucreries
  'en:chocolates': 'chocolat',
  'en:biscuits': 'biscuits',
  'en:sweet-spreads': 'spreads',
  'en:hazelnut-spreads': 'spreads',
  'en:jams': 'confitures',
  'en:honey': 'miel',
  'en:candies': 'bonbons',
  
  // Sauces/Condiments
  'en:condiments': 'condiments',
  'en:sauces': 'sauces',
  'en:oils': 'huiles',
  'en:vinegars': 'vinaigres',
  'en:mayonnaises': 'mayonnaises',
  'en:mustards': 'moutardes',
  'en:ketchup': 'ketchup',
  
  // Plats prÃ©parÃ©s
  'en:prepared-meals': 'plats-prepares',
  'en:pizzas': 'pizzas',
  'en:sandwiches': 'sandwiches',
  'en:soups': 'soupes',
  'en:salads': 'salades',
  
  // Viandes/Poissons
  'en:meats': 'viandes',
  'en:poultry': 'volailles',
  'en:fish': 'poissons',
  'en:seafood': 'fruits-mer',
  'en:plant-based-meat-alternatives': 'alternatives-viande',
  
  // Snacks
  'en:chips': 'chips',
  'en:crackers': 'crackers',
  'en:nuts': 'fruits-secs',
  'en:dried-fruits': 'fruits-secs'
};

// Fallback keywords (dans le nom du produit)
const KEYWORDS_MAP = {
  'tartiner': 'spreads',
  'nutella': 'spreads',
  'pÃ¢te Ã  tartiner': 'spreads',
  'palmier': 'conserves-legumes',
  'cÅ“ur': 'conserves-legumes',
  'tomate': 'conserves-legumes',
  'haricot': 'conserves-legumes',
  'mais': 'conserves-legumes',
  'maÃ¯s': 'conserves-legumes',
  'pois': 'conserves-legumes',
  'carotte': 'conserves-legumes',
  'champignon': 'conserves-legumes',
  'compote': 'compotes',
  'purÃ©e de fruit': 'compotes',
  'confiture': 'confitures',
  'chocolat': 'chocolat',
  'biscuit': 'biscuits',
  'gÃ¢teau': 'biscuits',
  'yaourt': 'yaourts',
  'yogurt': 'yaourts',
  'fromage': 'fromages',
  'lait': 'produits-laitiers',
  'pÃ¢tes': 'pates',
  'pasta': 'pates',
  'riz': 'riz',
  'cÃ©rÃ©ales': 'cereales',
  'pain': 'pains',
  'biscotte': 'biscottes',
  'jus': 'jus',
  'eau': 'eaux',
  'soda': 'sodas',
  'sauce': 'sauces',
  'huile': 'huiles',
  'vinaigre': 'vinaigres',
  'mayonnaise': 'mayonnaises',
  'moutarde': 'moutardes',
  'ketchup': 'ketchup',
  'pizza': 'pizzas',
  'sandwich': 'sandwiches',
  'soupe': 'soupes',
  'salade': 'salades',
  'chips': 'chips',
  'beurre': 'beurre',
  'crÃ¨me': 'creme',
  'miel': 'miel'
};

function detectSubcategory(product) {
  const categories = product.categories_tags || [];
  
  // StratÃ©gie 1: Utiliser le tag le plus spÃ©cifique (dernier de la liste)
  for (let i = categories.length - 1; i >= 0; i--) {
    const tag = categories[i];
    if (CATEGORY_MAP[tag]) {
      return CATEGORY_MAP[tag];
    }
  }
  
  // StratÃ©gie 2: Fallback keywords dans le nom du produit
  const name = (product.product_name || '').toLowerCase();
  for (const [keyword, subcategory] of Object.entries(KEYWORDS_MAP)) {
    if (name.includes(keyword)) {
      return subcategory;
    }
  }
  
  // StratÃ©gie 3: Utiliser premiÃ¨re catÃ©gorie gÃ©nÃ©rique si disponible
  if (categories.length > 0) {
    const firstCat = categories[0]
      .replace('en:', '')
      .replace(/-/g, '_')
      .substring(0, 30); // Limiter longueur
    return firstCat;
  }
  
  return 'autres';
}

async function reimportProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    console.log('\nðŸ”„ RÃ‰IMPORT DE 5000 PRODUITS AVEC CATEGORIES_TAGS\n');
    console.log('âš ï¸  Les produits food existants vont Ãªtre supprimÃ©s et rÃ©importÃ©s\n');
    
    // Supprimer les anciens produits food
    const deleteResult = await db.collection('products').deleteMany({ category: 'food' });
    console.log(`âœ“ ${deleteResult.deletedCount} anciens produits food supprimÃ©s\n`);
    
    let imported = 0;
    let page = 1;
    const errors = [];
    
    while (imported < 5000 && page < 100) { // Limite sÃ©curitÃ© 100 pages
      try {
        console.log(`RequÃªte page ${page}...`);
        
        const response = await axios.get('https://world.openfoodfacts.org/cgi/search.pl', {
          params: {
            search_terms: '',
            page,
            page_size: 100,
            json: true,
            fields: 'code,product_name,brands,nutriscore_grade,nova_group,ecoscore_grade,categories_tags,additives_tags,allergens_tags,ingredients_text,labels_tags,packaging,origins,image_url'
          },
          timeout: 10000
        });
        
        const products = response.data.products || [];
        
        if (products.length === 0) {
          console.log('Plus de produits disponibles, arrÃªt.');
          break;
        }
        
        for (const p of products) {
          if (!p.code || !p.product_name || imported >= 5000) continue;
          
          const subcategory = detectSubcategory(p);
          
          await db.collection('products').insertOne({
            barcode: p.code,
            name: p.product_name,
            brand: p.brands || 'Marque inconnue',
            category: 'food',
            subcategory,
            categories_tags: p.categories_tags || [],
            imageUrl: p.image_url,
            foodData: {
              novaGroup: p.nova_group,
              nutriScore: ['A','B','C','D','E'].includes(p.nutriscore_grade?.toUpperCase()) 
                ? p.nutriscore_grade.toUpperCase() 
                : undefined,
              ecoScore: ['A','B','C','D','E'].includes(p.ecoscore_grade?.toUpperCase()) 
                ? p.ecoscore_grade.toUpperCase() 
                : undefined,
              additives: (p.additives_tags || []).map(tag => ({
                tag,
                code: tag.replace('en:', '').toUpperCase(),
                name: tag.replace('en:', '').replace(/-/g, ' ')
              })),
              allergens: (p.allergens_tags || []).map(tag => ({
                tag,
                name: tag.replace('en:', '').replace(/-/g, ' ')
              })),
              ingredients: p.ingredients_text || '',
              labels: p.labels_tags || []
            },
            packaging: p.packaging,
            origin: p.origins,
            viewCount: 0,
            scanCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          imported++;
          
          if (imported % 500 === 0) {
            console.log(`  âœ“ ${imported}/5000 produits importÃ©s`);
          }
        }
        
        page++;
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
        
      } catch (err) {
        console.error(`Erreur page ${page}:`, err.message);
        errors.push({ page, error: err.message });
        page++;
      }
    }
    
    console.log(`\nâœ… ${imported} produits importÃ©s avec subcategories\n`);
    
    if (errors.length > 0) {
      console.log(`âš ï¸  ${errors.length} erreurs rencontrÃ©es (voir dÃ©tails ci-dessous)`);
    }
    
    // Statistiques subcategories
    console.log('ðŸ“Š DISTRIBUTION DES SUBCATEGORIES:\n');
    const stats = await db.collection('products').aggregate([
      { $match: { category: 'food' } },
      { $group: { _id: '$subcategory', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 30 }
    ]).toArray();
    
    stats.forEach(s => {
      const percentage = ((s.count / imported) * 100).toFixed(1);
      console.log(`  ${s._id.padEnd(25)} : ${s.count.toString().padStart(4)} (${percentage}%)`);
    });
    
    const autresCount = stats.find(s => s._id === 'autres')?.count || 0;
    const autresPercentage = ((autresCount / imported) * 100).toFixed(1);
    
    console.log('\nðŸ“ˆ AMÃ‰LIORATION:');
    console.log(`  Avant : 83.5% en "autres"`);
    console.log(`  AprÃ¨s : ${autresPercentage}% en "autres"`);
    console.log(`  Gain  : ${(83.5 - autresPercentage).toFixed(1)}% de produits mieux catÃ©gorisÃ©s\n`);
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (err) {
    console.error('âŒ ERREUR CRITIQUE:', err.message);
    process.exit(1);
  }
}

reimportProducts();