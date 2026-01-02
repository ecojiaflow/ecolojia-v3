require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('✅ MongoDB connecté');
  
  const nutella = await Product.findOne({ barcode: '3017620422003' });
  console.log('📦 Nutella trouvé:', nutella.name);
  console.log('Score actuel:', nutella.scores?.overallScore || 'N/A');
  
  // Forcer recalcul en modifiant puis sauvegardant
  console.log('🔄 Forçage recalcul scores...');
  
  // Supprimer scores pour forcer recalcul
  nutella.scores = undefined;
  
  // Sauvegarder (déclenche middleware pre-save)
  await nutella.save();
  
  // Recharger pour voir nouveau score
  const updated = await Product.findOne({ barcode: '3017620422003' });
  
  console.log('✅ Nutella score:', updated.scores?.overallScore);
  console.log('Breakdown:', {
    health: updated.scores?.healthScore,
    environment: updated.scores?.environmentScore,
    nutrition: updated.scores?.breakdown?.nutriScore?.score
  });
  
  process.exit(0);
}).catch(err => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
