const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config();

async function importDetergents() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🧽 Import détergents...');
  
  const detergents = [
    { code: '3228880011305', name: 'Skip lessive liquide Excellence', brand: 'Skip' },
    { code: '3257982341019', name: 'Ariel pods 3 en 1', brand: 'Ariel' },
    { code: '8710908501111', name: 'Persil gel', brand: 'Persil' },
    { code: '3038359008931', name: 'Le Chat lessive liquide', brand: 'Le Chat' },
    { code: '3594081008889', name: 'X-Tra lessive poudre', brand: 'X-Tra' },
    { code: '3276550008901', name: 'Mir vaisselle citron', brand: 'Mir' },
    { code: '8002910004309', name: 'Paic vaisselle citron', brand: 'Paic' },
    { code: '3155250338117', name: 'Cif crème à récurer', brand: 'Cif' },
    { code: '8710908501203', name: 'Cajoline adoucissant', brand: 'Cajoline' },
    { code: '3228881008916', name: 'Soupline adoucissant', brand: 'Soupline' }
  ];
  
  let imported = 0;
  
  for (const det of detergents) {
    if (await Product.exists({ barcode: det.code })) continue;
    
    await Product.create({
      barcode: det.code,
      name: det.name,
      brand: det.brand,
      category: 'detergents',
      detergentsData: {}
    });
    
    imported++;
    console.log(`  ✅ ${det.name}`);
  }
  
  console.log(`\n🎉 ${imported} détergents ajoutés`);
  await mongoose.disconnect();
  process.exit(0);
}

importDetergents().catch(console.error);
