// Charger .env en premier
require('dotenv').config({ path: './.env' });

const mongoose = require('mongoose');
const Product = require('./src/models/Product');

// Vérifier MONGODB_URI
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI non trouvé dans .env');
  process.exit(1);
}

console.log('✅ MONGODB_URI chargé');

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connecté');
    
    // 1. Chercher un produit cosmétique existant
    console.log('\n📋 Recherche produits cosmétiques...');
    const cosmeticProduct = await Product.findOne({ categoryType: 'cosmetic' });
    
    if (cosmeticProduct) {
      console.log('✅ Produit cosmétique trouvé :');
      console.log('   ID:', cosmeticProduct._id);
      console.log('   Nom:', cosmeticProduct.name);
      console.log('   Score:', cosmeticProduct.scores?.overallScore);
      console.log('\n⚠️ UTILISE CET ID POUR TESTER : ' + cosmeticProduct._id);
    } else {
      console.log('⚠️ Aucun produit cosmétique en base');
    }
    
    // 2. Chercher le produit détergent
    console.log('\n📋 Vérification produit détergent test...');
    const detergentProduct = await Product.findById('690b865d19f181bb90b7ebf6');
    
    if (detergentProduct) {
      console.log('✅ Produit détergent trouvé :');
      console.log('   ID:', detergentProduct._id);
      console.log('   Nom:', detergentProduct.name);
      console.log('   CategoryType:', detergentProduct.categoryType);
      console.log('   Score:', detergentProduct.scores?.overallScore);
    } else {
      console.log('⚠️ Produit détergent non trouvé');
    }
    
    // 3. Si pas de produit cosmétique, en créer un
    if (!cosmeticProduct) {
      console.log('\n📋 Création produit cosmétique de test...');
      
      const newCosmetic = await Product.create({
        name: 'Crème Hydratante Test IA',
        brand: 'Test Brand',
        barcode: '3245678901234',
        categoryType: 'cosmetic',
        scores: {
          overallScore: 58,
          healthScore: 55,
          environmentScore: 60,
          breakdown: {
            ingredients: { score: 50 },
            endocrineDisruptors: { score: 40 },
            biodegradability: { score: 60 }
          }
        },
        cosmeticData: {
          inci: ['Aqua', 'Glycerin', 'Butylphenyl Methylpropional', 'Parfum'],
          endocrineDisruptors: ['Butylphenyl Methylpropional'],
          allergens: ['Parfum'],
          biodegradability: 65,
          labels: []
        },
        image: 'https://via.placeholder.com/200',
        createdAt: new Date()
      });
      
      console.log('✅ Produit cosmétique créé :');
      console.log('   ID:', newCosmetic._id);
      console.log('   Nom:', newCosmetic.name);
      console.log('\n⚠️ UTILISE CET ID POUR TESTER : ' + newCosmetic._id);
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Terminé - Déconnexion MongoDB');
    process.exit(0);
    
  })
  .catch(err => {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  });
