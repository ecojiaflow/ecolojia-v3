const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://Ecolojia:SalimEcolojia@ecolojia.gnfz2k8.mongodb.net/ecolojia-prod?retryWrites=true&w=majority';

async function verifyGlobalScore() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('ecolojia-prod');
    const products = db.collection('products');
    
    const product = await products.findOne({ barcode: '5449000000996' });
    
    console.log('\n🔍 Produit dans MongoDB :');
    console.log('   Nom:', product.name);
    console.log('   globalScore:', product.globalScore);
    console.log('   scores.overallScore:', product.scores?.overallScore);
    
    if (product.globalScore) {
      console.log('\n✅ globalScore EXISTE en base !');
    } else {
      console.log('\n❌ globalScore NULL en base !');
    }
  } finally {
    await client.close();
  }
}

verifyGlobalScore();
