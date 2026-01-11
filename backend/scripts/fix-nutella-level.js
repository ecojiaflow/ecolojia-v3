// backend/scripts/fix-nutella-level.js
const mongoose = require('mongoose');
require('dotenv').config();

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Product = mongoose.connection.collection('products');
  
  console.log('=== CORRECTION NUTELLA LEVEL & FLAGS ===\n');
  
  // Récupérer Nutella actuel
  const nutella = await Product.findOne({ barcode: '3017620422003' });
  
  console.log('AVANT:');
  console.log(`  Level: ${nutella.constitution?.healthReflex?.level}`);
  console.log(`  Flags: ${JSON.stringify(nutella.constitution?.healthReflex?.flags)}`);
  console.log(`  Score: ${nutella.scores?.overallScore}`);
  
  // Corriger Nutella : Level 3 + flags complets
  const result = await Product.updateOne(
    { barcode: '3017620422003' },
    { 
      $set: { 
        'constitution.healthReflex.level': 3,
        'constitution.healthReflex.levelLabel': 'À réserver aux occasions',
        'constitution.healthReflex.flags': [
          'ultra_transforme',
          'nutriscore_e', 
          'sucre_eleve',
          'additifs_presents'
        ],
        'constitution.healthReflex.content': 'Ce type de produit se consomme mieux occasionnellement, en petite quantité.'
      }
    }
  );
  
  console.log(`\nModifications: ${result.modifiedCount}`);
  
  // Vérifier
  const nutellaUpdated = await Product.findOne({ barcode: '3017620422003' });
  
  console.log('\nAPRÈS:');
  console.log(`  Level: ${nutellaUpdated.constitution?.healthReflex?.level}`);
  console.log(`  LevelLabel: ${nutellaUpdated.constitution?.healthReflex?.levelLabel}`);
  console.log(`  Flags: ${JSON.stringify(nutellaUpdated.constitution?.healthReflex?.flags)}`);
  console.log(`  Content: ${nutellaUpdated.constitution?.healthReflex?.content}`);
  
  // Corriger aussi les autres Nutella (variantes)
  const otherNutellas = await Product.updateMany(
    { 
      name: { $regex: /nutella/i },
      barcode: { $ne: '3017620422003' }
    },
    { 
      $set: { 
        'constitution.healthReflex.level': 3,
        'constitution.healthReflex.levelLabel': 'À réserver aux occasions',
        'constitution.healthReflex.flags': [
          'ultra_transforme',
          'nutriscore_e', 
          'sucre_eleve'
        ]
      }
    }
  );
  
  console.log(`\nAutres Nutella corrigés: ${otherNutellas.modifiedCount}`);
  
  await mongoose.connection.close();
  console.log('\n✅ Correction terminée !');
}
fix().catch(console.error);
