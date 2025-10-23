require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

async function forceRecalc() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connecté\n');
  
  const nutella = await Product.findOne({ barcode: '3017620422003' });
  
  console.log('🔄 FORCER recalcul (marquer modifié)...\n');
  
  // SUPPRIMER scores ET marquer comme modifié
  delete nutella.scores;
  nutella.markModified('scores');
  
  // Sauvegarder → DOIT déclencher middleware
  await nutella.save();
  
  console.log('✅ Save() terminé\n');
  
  // Recharger
  const updated = await Product.findOne({ barcode: '3017620422003' });
  
  console.log('📊 RÉSULTAT :');
  console.log('Score global :', updated.scores?.overallScore || 'NULL');
  
  if (updated.scores?.breakdown) {
    console.log('\nBreakdown :');
    Object.keys(updated.scores.breakdown).forEach(key => {
      const item = updated.scores.breakdown[key];
      console.log('  -', key, ':', item.score !== undefined ? item.score + '/100' : 'VIDE');
    });
    
    const filled = Object.values(updated.scores.breakdown).filter(item => item.score !== undefined).length;
    console.log('\n✅ Composantes remplies :', filled, '/ 8');
    
    if (filled === 8) {
      console.log('🎉 SUCCÈS TOTAL !');
    }
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

forceRecalc().catch(console.error);
