require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI non definie dans .env');
  process.exit(1);
}

async function createSearchIndex() {
  console.log('Connexion a MongoDB...');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connecte a MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('products');

    console.log('Index existants:');
    const existingIndexes = await collection.indexes();
    existingIndexes.forEach(idx => {
      console.log('  - ' + idx.name + ': ' + JSON.stringify(idx.key));
    });

    const textIndexExists = existingIndexes.some(
      idx => idx.key && idx.key._fts === 'text'
    );

    if (textIndexExists) {
      console.log('Index text deja existant');
    } else {
      console.log('Creation de l index text...');
      
      await collection.createIndex(
        { name: 'text', brand: 'text' },
        {
          name: 'search_text_index',
          weights: { name: 10, brand: 5 },
          default_language: 'french'
        }
      );
      
      console.log('Index text cree avec succes');
    }

    console.log('Test de recherche "Nutella"...');
    const testResults = await collection.find(
      { $text: { $search: 'Nutella' } },
      { projection: { name: 1, brand: 1, score: { $meta: 'textScore' } } }
    ).sort({ score: { $meta: 'textScore' } }).limit(5).toArray();

    console.log('Trouve ' + testResults.length + ' resultats:');
    testResults.forEach((p, i) => {
      console.log('  ' + (i + 1) + '. ' + p.name + ' (' + p.brand + ')');
    });

    const totalProducts = await collection.countDocuments();
    console.log('Total produits: ' + totalProducts);

  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Deconnecte de MongoDB');
  }
}

createSearchIndex();
