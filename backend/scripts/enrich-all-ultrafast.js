const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config();

const CONFIG = {
  BATCH_SIZE: 1000,          // Gros batches MongoDB
  PARALLEL_WORKERS: 10,      // 10 requêtes parallèles
  DEEPSEEK_RATE_LIMIT: 100,  // Proche limite API (120/min)
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  SAVE_BATCH: 100            // Bulk update tous les 100
};

function shouldSkipProduct(product) {
  if (product.nutrition?.energy_kcal && product.ingredients_text) return true;
  if (!product.name || product.name.length < 3) return true;
  return false;
}

function canEstimateLocally(product) {
  const subcategory = product.subcategory?.toLowerCase() || '';
  const tags = product.tags || [];
  
  if (subcategory.includes('water') || tags.includes('water')) {
    return {
      nutrition: { energy_kcal: 0, fat: 0, saturated_fat: 0, carbohydrates: 0, sugars: 0, fiber: 0, proteins: 0, salt: 0 },
      ingredients_text: 'Eau',
      additives_tags: [],
      estimated: true,
      estimation_source: 'local_water'
    };
  }
  
  if ((subcategory.includes('fruit') || subcategory.includes('vegetable')) && tags.includes('fresh')) {
    return {
      nutrition: { energy_kcal: 45, fat: 0.2, saturated_fat: 0, carbohydrates: 10, sugars: 8, fiber: 2, proteins: 0.8, salt: 0.01 },
      ingredients_text: product.name,
      additives_tags: [],
      estimated: true,
      estimation_source: 'local_fresh'
    };
  }
  
  return null;
}

function buildMinimalPrompt(product) {
  const name = product.name.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 40);
  const category = (product.subcategory || 'food').replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 20);
  
  return `${name} (${category}). Return JSON only:
{"nutrition":{"energy_kcal":400,"fat":5,"saturated_fat":2,"carbohydrates":60,"sugars":20,"fiber":3,"proteins":8,"salt":0.5},"ingredients":"flour sugar","additives":[]}`;
}

function extractJSON(text) {
  try {
    let clean = text.replace(/```json/g, '').replace(/```/g, '').replace(/\n/g, ' ').trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) return null;
    return JSON.parse(clean.substring(firstBrace, lastBrace + 1));
  } catch (e) {
    try {
      const match = text.match(/\{[^{}]*"nutrition"[^{}]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch (e2) {}
  }
  return null;
}

async function enrichWithDeepSeek(product, retryCount = 0) {
  const prompt = buildMinimalPrompt(product);
  
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Return ONLY JSON. No text before or after.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0,
        max_tokens: 200,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const parsed = extractJSON(data.choices[0].message.content);
    
    if (!parsed?.nutrition) throw new Error('Invalid JSON');
    
    return {
      _id: product._id,
      data: {
        nutrition: {
          energy_kcal: Number(parsed.nutrition.energy_kcal) || 250,
          fat: Number(parsed.nutrition.fat) || 5,
          saturated_fat: Number(parsed.nutrition.saturated_fat) || 2,
          carbohydrates: Number(parsed.nutrition.carbohydrates) || 40,
          sugars: Number(parsed.nutrition.sugars) || 10,
          fiber: Number(parsed.nutrition.fiber) || 2,
          proteins: Number(parsed.nutrition.proteins) || 5,
          salt: Number(parsed.nutrition.salt) || 0.5
        },
        ingredients_text: parsed.ingredients || product.name,
        additives_tags: Array.isArray(parsed.additives) ? parsed.additives : [],
        estimated: true,
        estimation_source: 'deepseek_ai'
      }
    };
    
  } catch (error) {
    if (retryCount < CONFIG.MAX_RETRIES) {
      await new Promise(r => setTimeout(r, CONFIG.RETRY_DELAY));
      return enrichWithDeepSeek(product, retryCount + 1);
    }
    return null;
  }
}

// Worker pool avec rate limiting intelligent
class ParallelWorkerPool {
  constructor(maxWorkers, requestsPerMinute) {
    this.maxWorkers = maxWorkers;
    this.activeWorkers = 0;
    this.queue = [];
    this.requestsThisMinute = 0;
    this.minuteStart = Date.now();
    this.maxRequestsPerMinute = requestsPerMinute;
  }

  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }

  async process() {
    while (this.queue.length > 0 && this.activeWorkers < this.maxWorkers) {
      // Rate limiting par minute
      const now = Date.now();
      if (now - this.minuteStart > 60000) {
        this.requestsThisMinute = 0;
        this.minuteStart = now;
      }

      if (this.requestsThisMinute >= this.maxRequestsPerMinute) {
        const waitTime = 60000 - (now - this.minuteStart);
        await new Promise(r => setTimeout(r, waitTime));
        this.requestsThisMinute = 0;
        this.minuteStart = Date.now();
      }

      const { fn, resolve, reject } = this.queue.shift();
      this.activeWorkers++;
      this.requestsThisMinute++;

      fn()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.activeWorkers--;
          this.process();
        });
    }
  }
}

async function enrichAll() {
  console.log('\n🚀 ENRICHISSEMENT ULTRA-RAPIDE - TOUTE LA BASE\n');
  
  await mongoose.connect(process.env.MONGODB_URI);
  const worker = new ParallelWorkerPool(CONFIG.PARALLEL_WORKERS, CONFIG.DEEPSEEK_RATE_LIMIT);
  
  const stats = {
    total: 0, skipped: 0, localEstimated: 0,
    deepseekCalled: 0, updated: 0, errors: 0,
    startTime: Date.now()
  };

  const totalProducts = await Product.countDocuments();
  stats.total = totalProducts;
  
  console.log(`📦 Total: ${totalProducts.toLocaleString()} produits`);
  console.log(`⚙️  Batch: ${CONFIG.BATCH_SIZE}`);
  console.log(`🔄 Workers: ${CONFIG.PARALLEL_WORKERS}`);
  console.log(`⚡ Rate: ${CONFIG.DEEPSEEK_RATE_LIMIT} req/min\n`);

  let processed = 0;
  let batchNum = 0;
  let updateBuffer = [];

  while (processed < totalProducts) {
    batchNum++;
    const products = await Product.find().skip(processed).limit(CONFIG.BATCH_SIZE).lean();
    
    console.log(`📦 Batch ${batchNum}/${Math.ceil(totalProducts/CONFIG.BATCH_SIZE)} (${processed.toLocaleString()}-${(processed + products.length).toLocaleString()})`);

    const promises = [];

    for (const product of products) {
      processed++;
      
      if (shouldSkipProduct(product)) {
        stats.skipped++;
        continue;
      }

      const localEstimate = canEstimateLocally(product);
      if (localEstimate) {
        updateBuffer.push({ _id: product._id, data: localEstimate });
        stats.localEstimated++;
        stats.updated++;
        continue;
      }

      // Parallélisation des appels DeepSeek
      promises.push(
        worker.add(() => enrichWithDeepSeek(product))
          .then(result => {
            if (result) {
              updateBuffer.push(result);
              stats.deepseekCalled++;
              stats.updated++;
            } else {
              stats.errors++;
            }
          })
          .catch(() => stats.errors++)
      );
    }

    // Attendre toutes les promesses du batch
    await Promise.all(promises);

    // Bulk update tous les 100 produits
    if (updateBuffer.length >= CONFIG.SAVE_BATCH) {
      const bulkOps = updateBuffer.map(item => ({
        updateOne: {
          filter: { _id: item._id },
          update: { $set: item.data }
        }
      }));
      
      await Product.bulkWrite(bulkOps);
      updateBuffer = [];
    }

    // Stats toutes les 1000 produits
    if (processed % 1000 === 0) {
      const progress = ((processed / totalProducts) * 100).toFixed(1);
      const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(0);
      const rate = (processed / elapsed * 60).toFixed(0);
      const errorRate = ((stats.errors / processed) * 100).toFixed(1);
      
      console.log(`  ✅ ${progress}% | ${rate}/min | Err: ${errorRate}% | DeepSeek: ${stats.deepseekCalled.toLocaleString()}`);
    }
  }

  // Derniers updates
  if (updateBuffer.length > 0) {
    const bulkOps = updateBuffer.map(item => ({
      updateOne: {
        filter: { _id: item._id },
        update: { $set: item.data }
      }
    }));
    await Product.bulkWrite(bulkOps);
  }

  const duration = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
  const errorRate = ((stats.errors / stats.total) * 100).toFixed(1);
  const successRate = ((stats.updated / stats.total) * 100).toFixed(1);
  const cost = ((stats.deepseekCalled * 150) / 1000000) * 0.14;

  console.log('\n' + '='.repeat(60));
  console.log('🎉 ENRICHISSEMENT TERMINÉ');
  console.log('='.repeat(60));
  console.log(`✅ Succès: ${stats.updated.toLocaleString()}/${stats.total.toLocaleString()} (${successRate}%)`);
  console.log(`❌ Erreurs: ${stats.errors.toLocaleString()} (${errorRate}%)`);
  console.log(`⏭️  Skipped: ${stats.skipped.toLocaleString()}`);
  console.log(`💾 Local: ${stats.localEstimated.toLocaleString()}`);
  console.log(`🤖 DeepSeek: ${stats.deepseekCalled.toLocaleString()}`);
  console.log(`⏱️  Durée: ${duration} min (${(duration/60).toFixed(1)}h)`);
  console.log(`💰 Coût: $${cost.toFixed(2)} (€${(cost * 0.92).toFixed(2)})`);
  console.log('='.repeat(60) + '\n');

  await mongoose.disconnect();
}

enrichAll().catch(console.error);
