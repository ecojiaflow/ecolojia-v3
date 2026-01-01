require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const Product = require('./src/models/Product');

const DELAY_MS = 650;
const PROGRESS_FILE = 'enrich-progress.json';

function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    }
  } catch (e) {}
  return { lastId: null, done: 0, enriched: 0, l1: 0, l2: 0, l3: 0 };
}

function saveProgress(data) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data));
}

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
  
  // Initialiser les champs null
  console.log('Initialisation...');
  await Product.updateMany({ 'scores.breakdown': null }, { $set: { 'scores.breakdown': { nova: {}, nutriScore: {}, additives: {} } } });
  await Product.updateMany({ constitution: null }, { $set: { constitution: {} } });
  
  let progress = loadProgress();
  console.log('=== ENRICHISSEMENT NOVA (RENDER) ===');
  if (progress.lastId) {
    console.log('REPRISE depuis:', progress.done, 'produits');
  }
  
  const query = { barcode: { $regex: /^[0-9]{8,13}$/ } };
  if (progress.lastId) {
    query._id = { $gt: progress.lastId };
  }
  
  const total = await Product.countDocuments({ barcode: { $regex: /^[0-9]{8,13}$/ } });
  console.log('Total:', total, '| Restants:', total - progress.done);
  
  const cursor = Product.find(query).sort({ _id: 1 }).cursor();
  
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
        
        progress.enriched++;
        if (hr.level === 1) progress.l1++;
        if (hr.level === 2) progress.l2++;
        if (hr.level === 3) progress.l3++;
      }
    } catch (e) {}
    
    progress.done++;
    progress.lastId = p._id.toString();
    
    if (progress.done % 100 === 0) {
      saveProgress(progress);
      const pct = (progress.done/total*100).toFixed(1);
      console.log(`[${pct}%] ${progress.done}/${total} | Enrichis: ${progress.enriched} | L1:${progress.l1} L2:${progress.l2} L3:${progress.l3}`);
    }
    
    await new Promise(r => setTimeout(r, DELAY_MS));
  }
  
  if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
  
  console.log('');
  console.log('=== TERMINE ===');
  console.log('Enrichis:', progress.enriched, '/', progress.done);
  console.log('L1:', progress.l1, '| L2:', progress.l2, '| L3:', progress.l3);
  
  process.exit(0);
}
main();
