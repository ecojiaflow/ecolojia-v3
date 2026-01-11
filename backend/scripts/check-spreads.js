// backend/scripts/check-spreads.js
const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Product = mongoose.connection.collection('products');
  
  // Compter les spreads
  const totalSpreads = await Product.countDocuments({ subcategory: 'spread' });
  console.log('Total produits spread:', totalSpreads);
  
  // Spreads avec score >= 33 et level <= 2
  const goodSpreads = await Product.countDocuments({ 
    subcategory: 'spread',
    'scores.overallScore': { $gte: 33 },
    'constitution.healthReflex.level': { $lte: 2 }
  });
  console.log('Spreads avec score>=33 et level<=2:', goodSpreads);
  
  // Spreads avec score >= 33 (sans filtre level)
  const spreadsGoodScore = await Product.countDocuments({ 
    subcategory: 'spread',
    'scores.overallScore': { $gte: 33 }
  });
  console.log('Spreads avec score>=33 (tous levels):', spreadsGoodScore);
  
  // Lister les 10 meilleurs spreads
  const bestSpreads = await Product.find({ subcategory: 'spread' })
    .project({ name: 1, barcode: 1, 'scores.overallScore': 1, 'constitution.healthReflex.level': 1 })
    .sort({ 'scores.overallScore': -1 })
    .limit(10)
    .toArray();
  
  console.log('\nTop 10 spreads par score:');
  bestSpreads.forEach((p, i) => {
    const level = p.constitution?.healthReflex?.level || '?';
    const score = p.scores?.overallScore || '?';
    console.log(`${i+1}. ${p.name} - Score: ${score}, Level: ${level}`);
  });
  
  // Lister les spreads DIFFÉRENTS de Nutella avec score > 33
  const alternativeSpreads = await Product.find({ 
    subcategory: 'spread',
    barcode: { $ne: '3017620422003' },
    'scores.overallScore': { $gte: 34 }
  })
    .project({ name: 1, barcode: 1, 'scores.overallScore': 1, 'constitution.healthReflex.level': 1 })
    .sort({ 'scores.overallScore': -1 })
    .limit(10)
    .toArray();
  
  console.log('\nAlternatives possibles pour Nutella (spreads score>33):');
  if (alternativeSpreads.length === 0) {
    console.log('  AUCUNE ALTERNATIVE TROUVÉE !');
  } else {
    alternativeSpreads.forEach((p, i) => {
      const level = p.constitution?.healthReflex?.level || '?';
      const score = p.scores?.overallScore || '?';
      console.log(`${i+1}. ${p.name} - Score: ${score}, Level: ${level}`);
    });
  }
  
  await mongoose.connection.close();
}
check().catch(console.error);
