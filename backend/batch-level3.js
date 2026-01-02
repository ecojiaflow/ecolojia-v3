require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

function calcFlags(p) {
  const flags = [];
  const ing = (p.ingredients_text || '').toLowerCase();
  
  if (!ing || ing.length < 3) return flags;
  
  // Sucre en premier
  if (ing.startsWith('sucre') || ing.startsWith('sugar') || ing.startsWith('glucose') || ing.startsWith('sirop')) {
    flags.push('sucre_en_premier');
  }
  
  // Sucre present
  if (ing.includes('sucre') || ing.includes('sugar') || ing.includes('glucose') || ing.includes('fructose') || ing.includes('sirop')) {
    flags.push('sucre_present');
  }
  
  // Huile de palme
  if (ing.includes('palme') || ing.includes('palm oil') || ing.includes('palmiste')) {
    flags.push('huile_de_palme');
  }
  
  // Additifs (E + numero)
  const additifCount = (ing.match(/e\d{3}/gi) || []).length;
  if (additifCount >= 5) flags.push('additifs_multiples');
  else if (additifCount >= 2) flags.push('additifs_presents');
  
  // Liste longue = probable ultra-transforme
  const ingredientCount = (ing.match(/,/g) || []).length + 1;
  if (ingredientCount >= 15) flags.push('liste_longue');
  if (ingredientCount >= 25) flags.push('ultra_transforme');
  
  // Mots cles ultra-transforme
  if (ing.includes('amidon modifi') || ing.includes('modified starch') || 
      ing.includes('hydrogenat') || ing.includes('hydrogena') ||
      ing.includes('emulsifiant') || ing.includes('emulsifier') ||
      ing.includes('maltodextrin') || ing.includes('dextrose')) {
    flags.push('transformation_elevee');
  }
  
  return [...new Set(flags)];
}

function calcLevel(flags) {
  // Niveau 3
  if (flags.includes('ultra_transforme') || 
      (flags.includes('sucre_en_premier') && flags.includes('additifs_multiples')) ||
      (flags.includes('sucre_en_premier') && flags.includes('huile_de_palme'))) {
    if (flags.includes('additifs_multiples')) 
      return { level: 3, sublevel: 'limit_strongly', levelLabel: 'A limiter fortement' };
    return { level: 3, sublevel: 'occasions', levelLabel: 'A reserver aux occasions' };
  }
  
  // Niveau 2
  if (flags.includes('transformation_elevee') || 
      flags.includes('liste_longue') ||
      flags.includes('huile_de_palme') ||
      flags.includes('additifs_presents') ||
      flags.includes('sucre_en_premier')) {
    return { level: 2, sublevel: null, levelLabel: 'A limiter au quotidien' };
  }
  
  // Niveau 1
  return { level: 1, sublevel: null, levelLabel: 'Acceptable' };
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const total = await Product.countDocuments({});
  console.log('Total:', total);
  
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
  console.log('Niveau 1 (Acceptable):', l1, '(' + (l1/total*100).toFixed(1) + '%)');
  console.log('Niveau 2 (A limiter):', l2, '(' + (l2/total*100).toFixed(1) + '%)');
  console.log('Niveau 3 (Occasions):', l3, '(' + (l3/total*100).toFixed(1) + '%)');
  process.exit(0);
}
main();
