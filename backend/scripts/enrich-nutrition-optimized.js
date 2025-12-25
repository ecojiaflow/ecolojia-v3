const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config();

const CONFIG = {
  BATCH_SIZE: 500,
  WORKERS: 3,
  DEEPSEEK_RATE_LIMIT: 50,
  MAX_RETRIES: 2,
  SAVE_INTERVAL: 100
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
      estimation_source: 'local_fresh_produce'
    };
  }
  
  return null;
}

function buildCompactPrompt(product) {
  return `Product: ${product.name}
Brand: ${product.brand || 'N/A'}
Category: ${product.subcategory || 'food'}

Return ONLY valid JSON (no markdown):
{
  "nutrition": {
    "energy_kcal": <number>,
    "fat": <g per 100g>,
    "saturated_fat": <g>,
    "carbohydrates": <g>,
    "sugars": <g>,
    "fiber": <g>,
    "proteins": <g>,
    "salt": <g>
  },
  "ingredients": "<main ingredients>",
  "additives": ["<E-codes if any>"]
}`;
}

async function enrichWithDeepSeek(product) {
  const prompt = buildCompactPrompt(product);
  
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
          { role: 'system', content: 'You are a food data expert. Return ONLY valid JSON, no markdown.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 300
      })
    });

    if (!response.ok) throw new Error(`DeepSeek API error: ${response.status}`);

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const parsed = JSON.parse(content);
    
    return {
      nutrition: parsed.nutrition,
      ingredients_text: parsed.ingredients,
      additives_tags: parsed.additives || [],
      estimated: true,
      estimation_source: 'deepseek_ai'
    };
    
  } catch (error) {
    console.error(`[DeepSeek Error] ${product.name}:`, error.message);
    return null;
  }
}

class RateLimitedWorker {
  constructor(requestsPerMinute) {
    this.queue = [];
    this.processing = false;
    this.interval = 60000 / requestsPerMinute;
    this.lastRequest = 0;
  }

  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    
    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequest;
      
      if (timeSinceLastRequest < this.interval) {
        await new Promise(r => setTimeout(r, this.interval - timeSinceLastRequest));
      }
      
      const { fn, resolve, reject } = this.queue.shift();
      this.lastRequest = Date.now();
      
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }
    
    this.processing = false;
  }
}

async function enrichNutritionData() {
  console.log('\n🚀 ENRICHISSEMENT NUTRITION ULTRA-OPTIMISÉ\n');
  
  await mongoose.connect(process.env.MONGODB_URI);
  const worker = new RateLimitedWorker(CONFIG.DEEPSEEK_RATE_LIMIT);
  
  const stats = {
    total: 0, skipped: 0, localEstimated: 0,
    deepseekCalled: 0, updated: 0, errors: 0,
    startTime: Date.now()
  };

  const totalProducts = await Product.countDocuments();
  stats.total = totalProducts;
  
  console.log(`📦 Total produits: ${totalProducts.toLocaleString()}`);
  console.log(`⚙️  Batch size: ${CONFIG.BATCH_SIZE}`);
  console.log(`🔄 Rate limit: ${CONFIG.DEEPSEEK_RATE_LIMIT} req/min\n`);

  let processed = 0;
  let batch = 0;

  while (processed < totalProducts) {
    batch++;
    const products = await Product.find().skip(processed).limit(CONFIG.BATCH_SIZE).lean();
    console.log(`\n📦 Batch ${batch} | Produits ${processed + 1}-${processed + products.length}`);

    for (const product of products) {
      processed++;
      
      if (shouldSkipProduct(product)) {
        stats.skipped++;
        continue;
      }

      const localEstimate = canEstimateLocally(product);
      if (localEstimate) {
        await Product.updateOne({ _id: product._id }, { $set: localEstimate });
        stats.localEstimated++;
        stats.updated++;
        continue;
      }

      try {
        const enrichedData = await worker.add(() => enrichWithDeepSeek(product));
        if (enrichedData) {
          await Product.updateOne({ _id: product._id }, { $set: enrichedData });
          stats.deepseekCalled++;
          stats.updated++;
        } else {
          stats.errors++;
        }
      } catch (error) {
        stats.errors++;
      }

      if (processed % 100 === 0) {
        const progress = ((processed / totalProducts) * 100).toFixed(1);
        const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(0);
        const rate = (processed / elapsed * 60).toFixed(1);
        
        console.log(`  ✅ ${processed.toLocaleString()}/${totalProducts.toLocaleString()} (${progress}%) | ${rate} produits/min`);
        console.log(`     Skipped: ${stats.skipped} | Local: ${stats.localEstimated} | DeepSeek: ${stats.deepseekCalled} | Erreurs: ${stats.errors}`);
      }
    }
  }

  const duration = ((Date.now() - stats.startTime) / 1000).toFixed(0);
  const avgRate = (processed / duration * 60).toFixed(1);
  const avgTokensPerCall = 200;
  const totalTokens = stats.deepseekCalled * avgTokensPerCall;
  const estimatedCost = (totalTokens / 1000000) * 0.14;

  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSULTATS FINAUX');
  console.log('='.repeat(60));
  console.log(`Total traités: ${stats.total.toLocaleString()}`);
  console.log(`✅ Mis à jour: ${stats.updated.toLocaleString()} (${((stats.updated/stats.total)*100).toFixed(1)}%)`);
  console.log(`⏭️  Skipped (déjà OK): ${stats.skipped.toLocaleString()}`);
  console.log(`💾 Estimations locales: ${stats.localEstimated.toLocaleString()}`);
  console.log(`🤖 Appels DeepSeek: ${stats.deepseekCalled.toLocaleString()}`);
  console.log(`❌ Erreurs: ${stats.errors.toLocaleString()}`);
  console.log(`⏱️  Durée: ${duration}s (${avgRate} produits/min)`);
  console.log(`💰 Coût estimé: $${estimatedCost.toFixed(2)} (€${(estimatedCost * 0.92).toFixed(2)})`);
  console.log('='.repeat(60) + '\n');

  await mongoose.disconnect();
}

enrichNutritionData().catch(console.error);
