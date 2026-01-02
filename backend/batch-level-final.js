require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

function calcLevel(p) {
  const nova = p.scores?.breakdown?.nova?.group;
  const nutriGrade = p.scores?.breakdown?.nutriScore?.grade;
  const additifCount = p.scores?.breakdown?.additives?.count || 0;
  const flags = [];
  
  // NOVA
  if (nova === 4) flags.push('ultra_transforme');
  if (nova === 3) flags.push('transformation_elevee');
  if (nova === 2) flags.push('transformation_moderee');
  
  // Nutri-Score
  if (nutriGrade === 'e') flags.push('nutriscore_e');
  if (nutriGrade === 'd') flags.push('nutriscore_d');
  
  // Additifs
  if (additifCount >= 5) flags.push('additifs_multiples');
  else if (additifCount >= 2) flags.push('additifs_presents');
  
  // Niveau 3
  if (flags.includes('ultra_transforme')) {
    if (flags.includes('nutriscore_e') || flags.includes('additifs_multiples'))
      return { level: 3, sublevel: 'limit_strongly', levelLabel: 'A limiter fortement', flags };
    return { level: 3, sublevel: 'occasions', levelLabel: 'A reserver aux occasions', flags };
  }
  
  // Niveau 2
  if (flags.includes('transformation_elevee') || flags.includes('nutriscore_e') || flags.includes('nutriscore_d'))
    return { level: 2, sublevel: null, levelLabel: 'A limiter au quotidien', flags };
  
  // Niveau 1
  return { level: 1, sublevel: null, levelLabel: 'Acceptable', flags };
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const total = await Product.countDocuments({});
  console.log('Total:', total);
  
  let done = 0, l1 = 0, l2 = 0, l3 = 0;
  const cursor = Product.find({}).cursor();
  
  for await (const p of cursor) {
    const result = calcLevel(p);
    
    await Product.updateOne({ _id: p._id }, { 
      $set: { 'constitution.healthReflex': result } 
    });
    
    if (result.level === 1) l1++;
    if (result.level === 2) l2++;
    if (result.level === 3) l3++;
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
