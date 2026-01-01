require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const PhotoAnalysisService = require('../src/services/photoAnalysis.service');

async function fixNutella() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté');
    
    const nutella = await Product.findOne({ barcode: '3017620422003' });
    if (!nutella) {
      console.log('❌ Nutella non trouvé');
      process.exit(1);
    }
    
    console.log('📦 Nutella trouvé:', nutella.name);
    console.log('Constitution avant:', nutella.constitution ? 'EXISTE' : 'NULL');
    
    console.log('\n🔄 Génération Constitution...');
    const constitution = await PhotoAnalysisService._generateConstitution(nutella);
    console.log('✅ Constitution générée');
    console.log('Contenu:', JSON.stringify(constitution, null, 2).substring(0, 500));
    
    nutella.constitution = constitution;
    nutella.constitutionGeneratedAt = new Date();
    nutella.constitutionVersion = '3.0';
    
    console.log('\n💾 Sauvegarde...');
    await nutella.save();
    console.log('✅ Nutella sauvegardé');
    
    // Vérifier
    const check = await Product.findOne({ barcode: '3017620422003' }).select('constitution');
    console.log('\n🔍 Vérification:');
    console.log('Constitution présente:', check.constitution ? 'OUI ✅' : 'NON ❌');
    
    if (check.constitution) {
      console.log('whatIsIt:', check.constitution.whatIsIt ? 'OK' : 'MANQUANT');
      console.log('healthReflex:', check.constitution.healthReflex ? 'OK' : 'MANQUANT');
      console.log('actions:', check.constitution.actions ? 'OK' : 'MANQUANT');
    }
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

fixNutella();
