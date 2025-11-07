require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connecté\n');
    
    // 1. Supprimer ancien produit test
    console.log('📋 Suppression ancien produit test...');
    await Product.deleteOne({ barcode: '3245678901234' });
    console.log('✅ Ancien produit supprimé\n');
    
    // 2. Créer nouveau produit avec categoryType
    console.log('📋 Création NOUVEAU produit cosmétique...');
    
    const newProduct = await Product.create({
      name: 'Crème Hydratante Test IA V2',
      brand: 'Test Brand',
      barcode: '3245678901234',
      categoryType: 'cosmetic',  // ⭐ NOUVEAU CHAMP
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
    
    console.log('✅ Produit créé avec succès !');
    console.log('   ID:', newProduct._id);
    console.log('   Nom:', newProduct.name);
    console.log('   CategoryType:', newProduct.categoryType);
    console.log('   Score:', newProduct.scores.overallScore);
    
    // 3. VÉRIFIER que categoryType est bien enregistré
    console.log('\n📋 Vérification lecture depuis DB...');
    const verif = await Product.findById(newProduct._id);
    console.log('✅ Relecture :');
    console.log('   CategoryType depuis DB:', verif.categoryType);
    
    if (verif.categoryType === 'cosmetic') {
      console.log('\n🎉 SUCCÈS ! Le champ categoryType est bien enregistré !');
      console.log('\n⚠️ UTILISE CET ID POUR TESTER : ' + verif._id);
    } else {
      console.log('\n❌ ERREUR ! CategoryType toujours undefined');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Terminé');
    process.exit(0);
    
  })
  .catch(err => {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  });
