require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('\n✅ Connecté à MongoDB');
    
    const Product = mongoose.model('Product', new mongoose.Schema({}, {strict: false}));
    
    // Vérifier cosmétique
    console.log('\n=== COSMÉTIQUE (3274080003388) ===');
    const cosm = await Product.findOne({barcode: '3274080003388'});
    if (cosm) {
      console.log('Score:', cosm.scores?.overallScore);
      console.log('Ingrédients:', cosm.cosmeticsData?.ingredients?.length);
      console.log('Dernier enrichissement:', cosm.metadata?.lastEnriched);
      console.log('Version IA:', cosm.metadata?.aiEnrichmentVersion);
    } else {
      console.log('❌ Produit non trouvé');
    }
    
    // Vérifier alimentaire
    console.log('\n=== ALIMENTAIRE (3596710545742) ===');
    const food = await Product.findOne({barcode: '3596710545742'});
    if (food) {
      console.log('Score:', food.scores?.overallScore);
      console.log('Sucres:', food.foodData?.nutritionalInfo?.sugars);
      console.log('NOVA:', food.foodData?.novaGroup);
      console.log('Dernier enrichissement:', food.metadata?.lastEnriched);
      console.log('Version IA:', food.metadata?.aiEnrichmentVersion);
    } else {
      console.log('❌ Produit non trouvé');
    }
    
    console.log('\n✅ Vérification terminée');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
})();