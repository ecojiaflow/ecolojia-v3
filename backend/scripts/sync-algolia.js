require('dotenv').config();
const algoliasearch = require('algoliasearch');
const mongoose = require('mongoose');

async function sync() {
  console.log('Connexion MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('Récupération produits...');
  const products = await mongoose.connection.db.collection('products').find().toArray();
  console.log(`${products.length} produits trouvés`);
  
  console.log('Initialisation Algolia...');
  const client = algoliasearch(
    process.env.ALGOLIA_APP_ID,
    process.env.ALGOLIA_ADMIN_API_KEY
  );
  const index = client.initIndex('products');
  
  console.log('Indexation en cours...');
  const records = products.map(p => ({
    objectID: p._id.toString(),
    name: p.name,
    brand: p.brand,
    barcode: p.barcode,
    category: p.category,
    subcategory: p.subcategory,
    imageUrl: p.imageUrl || (p.images ? p.images.front : null),
    overallScore: p.scores ? p.scores.overallScore : null,
    nutriScore: p.foodData ? p.foodData.nutriScore : null
  }));
  
  await index.saveObjects(records);
  console.log(`? ${records.length} produits indexés dans Algolia`);
  
  process.exit(0);
}

sync().catch(err => {
  console.error('Erreur:', err.message);
  process.exit(1);
});
