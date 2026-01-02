require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

const DELAY_MS = 650;

async function fetchOFF(barcode) {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, {
      headers: { 'User-Agent': 'Ecolojia/1.0' }
    });
    const data = await res.json();
    if (data.status !== 1) return null;
    return {
      nova: data.product.nova_group || null,
      nutri: data.product.nutriscore_grade || null,
      ing: data.product.ingredients_text_fr || data.product.ingredients_text || null,
      additives: data.product.additives_n || 0
    };
  } catch (e) { return null; }
}

function calcLevel(nova, nutri, additives) {
  const flags = [];
  if (nova === 4) flags.push('ultra_transforme');
  if (nova === 3) flags.push('transformation_elevee');
  if (nutri === 'e') flags.push('nutriscore_e');
  if (nutri === 'd') flags.push('nutriscore_d');
  if (additives >= 5) flags.push('additifs_multiples');
  
  if (flags.includes('ultra_transforme')) {
    if (flags.includes('nutriscore_e') || flags.includes('additifs_multiples'))
      return { level: 3, sublevel: 'limit_strongly', levelLabel: 'A limiter fortement', flags };
    return { level: 3, sublevel: 'occasions', levelLabel: 'A reserver aux occasions', flags };
  }
  if (flags.includes('transformation_elevee') || flags.includes('nutriscore_e') || flags.includes('nutriscore_d'))
    return { level: 2, sublevel: null, levelLabel: 'A limiter au quotidien', flags };
  return { level: 1, sublevel: null, levelLabel: 'Acceptable', flags };
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // D'abord initialiser scores.breakdown pour ceux qui ont null
  console.log('Initialisation scores.breakdown...');
  await Product.updateMany(
    { 'scores.breakdown': null },
    { $set: { 'scores.breakdown': { nova: {}, nutriScore: {}, additives: {} } } }
  );
  console.log('OK');
  
  // Initialiser constitution pour ceux qui ont null
  console.log('Initialisation constitution...');
  await Product.updateMany(
    { constitution: null },
    { $set: { constitution: {} } }
  );
  console.log('OK');
  
  const total = await Product.countDocuments({ barcode: { $regex: /^[0-9]{8,13}$/ } });
  console.log('Produits a enrichir:', total);
  console.log('Debut:', new Date().toLocaleTimeString());
  
  let done = 0, enriched = 0, l1 = 0, l2 = 0, l3 = 0;
  const cursor = Product.find({ barcode: { $regex: /^[0-9]{8,13}$/ } }).cursor();
  
  for await (const p of cursor) {
    try {
      const off = await fetchOFF(p.barcode);
      
      if (off && off.nova) {
        const hr = calcLevel(off.nova, off.nutri, off.additives);
        
        await Product.updateOne({ _id: p._id }, { $set: {
          'scores.breakdown.nova.group': off.nova,
          'foodData.novaGroup': off.nova,
          'scores.breakdown.nutriScore.grade': off.nutri,
          'ingredients_text': off.ing,
          'scores.breakdown.additives.count': off.additives,
          'constitution.healthReflex': hr
        }});
        
        enriched++;
        if (hr.level === 1) l1++;
        if (hr.level === 2) l2++;
        if (hr.level === 3) l3++;
      }
    } catch (e) {
      // Skip erreurs individuelles
    }
    
    done++;
    if (done % 500 === 0) {
      const pct = (done/total*100).toFixed(1);
      console.log(`[${pct}%] ${done}/${total} | Enrichis: ${enriched} | L1:${l1} L2:${l2} L3:${l3}`);
    }
    
    await new Promise(r => setTimeout(r, DELAY_MS));
  }
  
  console.log('');
  console.log('=== TERMINE ===');
  console.log('Fin:', new Date().toLocaleTimeString());
  console.log('Enrichis:', enriched, '/', done);
  console.log('L1:', l1, '| L2:', l2, '| L3:', l3);
  
  process.exit(0);
}
main();
