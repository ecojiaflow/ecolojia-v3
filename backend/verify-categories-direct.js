require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://salim:Salimbenamara78@ecolojia.mongodb.net/ecolojia?retryWrites=true&w=majority';

async function verifyCategories() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté MongoDB\n');
    
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false, collection: 'products' }));
    
    // 1. Vérifier mouliné bébé spécifiquement
    console.log('🔍 VÉRIFICATION MOULINÉ BÉBÉ (4056489728849):');
    const mouline = await Product.findOne({ code: '4056489728849' }).lean();
    
    if (mouline) {
      console.log('  ✅ Produit trouvé:');
      console.log(`    • Nom: ${mouline.product_name || 'N/A'}`);
      console.log(`    • Catégorie: ${mouline.categoryType || 'undefined'}`);
      console.log(`    • Categories OFF: ${mouline.categories || 'N/A'}`);
      console.log(`    • Score global: ${mouline.scores?.overallScore || 'N/A'}/100`);
      console.log(`    • Nova: ${mouline.nova_group || 'N/A'}`);
      console.log(`    • Nutriscore: ${mouline.nutriscore_grade || 'N/A'}`);
    } else {
      console.log('  ❌ Produit introuvable en base');
    }
    
    // 2. Lister produits sans categoryType
    console.log('\n\n⚠️  PRODUITS SANS categoryType:');
    const withoutCategory = await Product.find({ 
      categoryType: { $exists: false } 
    }).limit(10).lean();
    
    console.log(`  Trouvés: ${withoutCategory.length}\n`);
    
    withoutCategory.forEach((p, idx) => {
      console.log(`  ${idx + 1}. Barcode: ${p.code || 'N/A'}`);
      console.log(`     Nom: ${p.product_name || 'N/A'}`);
      console.log(`     Categories OFF: ${p.categories || 'N/A'}`);
      console.log(`     Nova: ${p.nova_group || 'N/A'}`);
      console.log(`     Nutriscore: ${p.nutriscore_grade || 'N/A'}`);
      console.log(`     Ingredients: ${p.ingredients_text ? 'Oui' : 'Non'}`);
      console.log('');
    });
    
    // 3. Compter total sans categoryType
    const totalWithout = await Product.countDocuments({ 
      categoryType: { $exists: false } 
    });
    console.log(`📊 TOTAL sans categoryType: ${totalWithout}`);
    
    // 4. Compter par catégorie existante
    console.log('\n📊 RÉPARTITION CATÉGORIES:');
    const byCategory = await Product.aggregate([
      { $group: { _id: '$categoryType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    byCategory.forEach(cat => {
      console.log(`  • ${cat._id || 'undefined'}: ${cat.count} produits`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Déconnecté');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

verifyCategories();