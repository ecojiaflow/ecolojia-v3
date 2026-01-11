/**
 * Script d'enrichissement subcategory via DeepSeek
 * Version: 1.0.0 | Date: 11 janvier 2026
 * Usage: node scripts/enrich-subcategory.js [--dry-run] [--limit=100]
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

// Configuration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const BATCH_SIZE = 10;
const DELAY_BETWEEN_BATCHES = 2000; // 2 secondes

// Subcategories valides (liste fermée)
const VALID_SUBCATEGORIES = [
  // Produits sucrés
  'biscuit', 'chocolate', 'candy', 'spread', 'jam', 'honey', 'cereal', 'cake', 'pastry', 'ice-cream',
  // Boissons
  'beverage', 'juice', 'soda', 'water', 'milk', 'yogurt-drink', 'tea', 'coffee',
  // Produits laitiers
  'yogurt', 'cheese', 'cream', 'butter', 'dairy-dessert',
  // Viandes et protéines
  'meat', 'poultry', 'fish', 'seafood', 'eggs', 'cold-cuts', 'sausage',
  // Fruits et légumes
  'fruit', 'vegetable', 'legume', 'canned-vegetables', 'canned-fruit', 'dried-fruit', 'nuts',
  // Féculents
  'bread', 'pasta', 'rice', 'flour', 'potato',
  // Plats préparés
  'ready-meal', 'pizza', 'sandwich', 'soup', 'sauce', 'condiment',
  // Snacks
  'chips', 'cracker', 'snack', 'popcorn',
  // Autres
  'oil', 'vinegar', 'spice', 'baby-food', 'dietary-supplement', 'protein-bar'
];

async function classifyProduct(product) {
  const prompt = `Tu es un expert en classification de produits alimentaires.

Analyse ce produit et détermine sa sous-catégorie la plus appropriée.

Produit:
- Nom: ${product.name || 'N/A'}
- Marque: ${product.brand || 'N/A'}
- Ingrédients: ${(product.ingredients_text || '').substring(0, 500)}

Sous-catégories disponibles:
${VALID_SUBCATEGORIES.join(', ')}

IMPORTANT: Réponds UNIQUEMENT avec la sous-catégorie choisie, rien d'autre.
Si tu ne peux pas déterminer la catégorie, réponds "unknown".

Sous-catégorie:`;

  try {
    const response = await axios.post(
      'https://api.deepseek.com/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50,
        temperature: 0.1
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const answer = response.data.choices[0].message.content.trim().toLowerCase();
    
    // Valider que la réponse est dans la liste
    if (VALID_SUBCATEGORIES.includes(answer)) {
      return answer;
    }
    
    // Essayer de matcher partiellement
    const match = VALID_SUBCATEGORIES.find(s => answer.includes(s) || s.includes(answer));
    return match || 'unknown';
    
  } catch (error) {
    console.error(`   ❌ Erreur API: ${error.message}`);
    return 'error';
  }
}

async function enrichProducts(options = {}) {
  const { dryRun = false, limit = 100 } = options;
  
  console.log('🚀 ENRICHISSEMENT SUBCATEGORY');
  console.log(`   Mode: ${dryRun ? 'DRY-RUN (simulation)' : 'PRODUCTION'}`);
  console.log(`   Limite: ${limit} produits`);
  console.log(`   DeepSeek API: ${DEEPSEEK_API_KEY ? '✅ Configuré' : '❌ Manquant'}`);
  
  if (!DEEPSEEK_API_KEY) {
    console.error('❌ DEEPSEEK_API_KEY manquant dans .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connecté à MongoDB\n');
  
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }), 'products');
  
  // Récupérer les produits "other"
  const products = await Product.find({ subcategory: 'other' })
    .select('_id name brand ingredients_text subcategory')
    .limit(limit)
    .lean();
  
  console.log(`📦 ${products.length} produits à traiter\n`);
  
  const stats = { success: 0, unknown: 0, error: 0, skipped: 0 };
  const results = [];
  
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    console.log(`[${i+1}/${products.length}] ${product.name}`);
    
    // Classifier
    const newSubcategory = await classifyProduct(product);
    
    if (newSubcategory === 'unknown') {
      console.log(`   → unknown (pas de classification)`);
      stats.unknown++;
      continue;
    }
    
    if (newSubcategory === 'error') {
      stats.error++;
      continue;
    }
    
    console.log(`   → ${newSubcategory} ✅`);
    stats.success++;
    
    results.push({
      _id: product._id,
      name: product.name,
      oldSubcategory: 'other',
      newSubcategory
    });
    
    // Mettre à jour en base si pas dry-run
    if (!dryRun) {
      await Product.updateOne(
        { _id: product._id },
        { 
          $set: { 
            subcategory: newSubcategory,
            enrichedAt: new Date(),
            enrichedBy: 'ai-subcategory-v1'
          }
        }
      );
    }
    
    // Pause entre les requêtes
    if ((i + 1) % BATCH_SIZE === 0) {
      console.log(`   ⏳ Pause ${DELAY_BETWEEN_BATCHES/1000}s...`);
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES));
    }
  }
  
  // Résumé
  console.log('\n📊 RÉSUMÉ:');
  console.log(`   ✅ Classifiés: ${stats.success}`);
  console.log(`   ❓ Unknown: ${stats.unknown}`);
  console.log(`   ❌ Erreurs: ${stats.error}`);
  
  if (dryRun) {
    console.log('\n🔍 APERÇU DES CHANGEMENTS (dry-run):');
    results.slice(0, 20).forEach(r => {
      console.log(`   ${r.name} → ${r.newSubcategory}`);
    });
  }
  
  await mongoose.disconnect();
  console.log('\n✅ Terminé');
}

// Parse arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitArg = args.find(a => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 100;

enrichProducts({ dryRun, limit });
