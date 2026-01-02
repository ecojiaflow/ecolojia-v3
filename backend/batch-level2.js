require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

function calcFlags(p) {
  const flags = [];
  const nova = p.foodData?.novaGroup || p.nova_group || null;
  if (nova === 4) flags.push('ultra_transforme');
  if (nova >= 3) flags.push('transformation_elevee');
  const ing = (p.ingredients_text || '').toLowerCase();
  if (ing.startsWith('sucre') || ing.startsWith('sugar')) flags.push('sucre_en_premier');
  if (ing.includes('palme') || ing.includes('palm')) flags.push('huile_de_palme');
  if (ing.includes('sirop') || ing.includes('glucose') || ing.includes('fructose')) flags.push('sucre_ajoute');
  return flags;
}

function calcLevel(flags) {
  if (flags.includes('ultra_transforme')) {
    if (flags.includes('sucre_en_premier') || flags.includes('sucre_ajoute')) 
      return { level: 3, sublevel: 'limit_strongly', levelLabel: 'A limiter fortement' };
    return { level: 3, sublevel: 'occasions', levelLabel: 'A reserver aux occasions' };
  }
  if (flags.includes('transformation_elevee') || flags.includes('huile_de_palme')) 
    return { level: 2, sublevel: null, levelLabel: 'A limiter au quotidien' };
  return { level: 1, sublevel: null, levelLabel: 'Acceptable' };
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const total = await Product.countDocuments({});
  console.log('Total:', total);
  
  // D abord initialiser constitution pour ceux qui ont null
  console.log('Init constitution null...');
  await Product.updateMany(
    { constitution: null },
    { $set: { constitution: {} } }
  );
  console.log('OK');
  
  let done = 0, l1 = 0, l2 = 0, l3 = 0;
  const cursor = Product.find({}).cursor();
  
  for await (const p of cursor) {
    const flags = calcFlags(p);
    const lvl = calcLevel(flags);
    
    await Product.updateOne({ _id: p._id }, { 
      $set: { 
        'constitution.healthReflex': { 
          level: lvl.level, 
          sublevel: lvl.sublevel, 
          levelLabel: lvl.levelLabel, 
          flags: flags 
        } 
      } 
    });
    
    if (lvl.level === 1) l1++;
    if (lvl.level === 2) l2++;
    if (lvl.level === 3) l3++;
    done++;
    
    if (done % 2000 === 0) console.log(done + '/' + total + ' - L1:' + l1 + ' L2:' + l2 + ' L3:' + l3);
  }
  
  console.log('');
  console.log('=== TERMINE ===');
  console.log('Niveau 1:', l1);
  console.log('Niveau 2:', l2);
  console.log('Niveau 3:', l3);
  process.exit(0);
}
main();
