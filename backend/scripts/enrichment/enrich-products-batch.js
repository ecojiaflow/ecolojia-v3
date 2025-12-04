/**
 * SCRIPT D'ENRICHISSEMENT BATCH - SUBCATEGORY + TAGS
 * 
 * Objectif : Enrichir les produits MongoDB avec :
 *   - subcategory (ex: "spread", "soda", "shampoo")
 *   - tags (ex: ["chocolate", "hazelnut", "sweet"])
 * 
 * Utilise DeepSeek R1 pour déduction intelligente
 * 
 * @author Lead Technique Senior
 * @date 2025-12-04
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

// Configuration
const MONGO_URI = process.env.MONGODB_URI;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

const BATCH_SIZE = 100; // Nombre de produits par batch
const MAX_PRODUCTS = 100; // Limite pour ce test (ajuster pour prod)
const RETRY_ATTEMPTS = 3;
const DELAY_BETWEEN_CALLS = 100; // ms entre appels API

// Stats globales
const stats = {
  total: 0,
  enriched: 0,
  failed: 0,
  skipped: 0,
  startTime: Date.now()
};

/**
 * Génère subcategory + tags via DeepSeek
 */
async function generateSubcategoryAndTags(product) {
  const prompt = `Tu es un expert en catégorisation de produits de consommation.

Analyse ce produit et génère :
1. Une subcategory (1 mot anglais, lowercase)
2. Des tags pertinents (3-7 mots anglais, lowercase)

PRODUIT :
- Nom : ${product.name || product.productName || 'inconnu'}
- Catégorie : ${product.categoryType || 'food'}
- Ingrédients : ${product.ingredients_text ? product.ingredients_text.substring(0, 200) : 'non disponible'}
- Marque : ${product.brands || 'inconnue'}

RÈGLES SUBCATEGORY :
- Alimentaire : spread, soda, juice, snack, cereal, yogurt, cheese, meat, fish, oil, sauce, spice, etc.
- Cosmétique : shampoo, cream, lotion, soap, makeup, perfume, toothpaste, etc.
- Détergent : detergent, cleaner, soap, softener, etc.

RÈGLES TAGS :
- Descriptifs (chocolate, hazelnut, organic, vegan, sweet, salty, etc.)
- 3 minimum, 7 maximum
- Pertinents pour recherche et alternatives

RÉPONDS UNIQUEMENT EN JSON (pas de markdown, pas d'explication) :
{
  "subcategory": "spread",
  "tags": ["chocolate", "hazelnut", "sweet", "breakfast"]
}`;

  const payload = {
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: 'Tu es un expert en catégorisation de produits. Tu réponds uniquement en JSON valide, sans markdown.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 200
  };

  let lastError;
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      const response = await axios.post(DEEPSEEK_API_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        timeout: 10000
      });

      const content = response.data.choices[0].message.content.trim();
      
      // Parser le JSON (enlever markdown si présent)
      let cleanContent = content;
      if (content.includes('```')) {
        cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      }
      
      const result = JSON.parse(cleanContent);
      
      // Validation
      if (!result.subcategory || !Array.isArray(result.tags)) {
        throw new Error('Format JSON invalide');
      }
      
      return {
        subcategory: result.subcategory.toLowerCase().trim(),
        tags: result.tags.map(t => t.toLowerCase().trim()).slice(0, 7)
      };
      
    } catch (error) {
      lastError = error;
      console.error(`   ⚠️  Tentative ${attempt}/${RETRY_ATTEMPTS} échouée : ${error.message}`);
      
      if (attempt < RETRY_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  throw lastError;
}

/**
 * Enrichit un batch de produits
 */
async function enrichBatch(products) {
  console.log(`\n📦 Traitement batch de ${products.length} produits...`);
  
  const results = {
    success: [],
    failed: []
  };
  
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const progress = `[${i + 1}/${products.length}]`;
    
    try {
      console.log(`${progress} ${product.name || product.productName || product._id}...`);
      
      // Générer subcategory + tags
      const enrichment = await generateSubcategoryAndTags(product);
      
      // Mettre à jour en base
      await mongoose.model('Product').updateOne(
        { _id: product._id },
        {
          $set: {
            subcategory: enrichment.subcategory,
            tags: enrichment.tags,
            enrichedAt: new Date(),
            enrichedBy: 'batch-script-v1'
          }
        }
      );
      
      console.log(`   ✅ Enrichi : subcategory="${enrichment.subcategory}", tags=[${enrichment.tags.join(', ')}]`);
      
      results.success.push({
        id: product._id,
        name: product.name || product.productName,
        subcategory: enrichment.subcategory,
        tags: enrichment.tags
      });
      
      stats.enriched++;
      
      // Délai entre appels
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CALLS));
      
    } catch (error) {
      console.error(`   ❌ Échec : ${error.message}`);
      
      results.failed.push({
        id: product._id,
        name: product.name || product.productName,
        error: error.message
      });
      
      stats.failed++;
    }
  }
  
  return results;
}

/**
 * Fonction principale
 */
async function runEnrichment() {
  try {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║     ENRICHISSEMENT BATCH - SUBCATEGORY + TAGS           ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    
    // Vérifications
    if (!DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY manquant dans .env');
    }
    
    // Connexion MongoDB
    console.log('🔌 Connexion MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté\n');
    
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    
    // Récupérer les produits à enrichir
    console.log(`🔍 Récupération des produits sans subcategory/tags (max ${MAX_PRODUCTS})...`);
    
    const productsToEnrich = await Product.find({
      $or: [
        { subcategory: { $exists: false } },
        { subcategory: null },
        { subcategory: '' },
        { tags: { $exists: false } },
        { tags: null },
        { tags: { $size: 0 } }
      ]
    })
    .limit(MAX_PRODUCTS)
    .select('_id name productName categoryType brands ingredients_text')
    .lean();
    
    stats.total = productsToEnrich.length;
    
    console.log(`✅ ${stats.total} produits à enrichir\n`);
    
    if (stats.total === 0) {
      console.log('ℹ️  Aucun produit à enrichir. Tous les produits ont déjà subcategory + tags.');
      return;
    }
    
    // Traitement par batch
    const allResults = {
      success: [],
      failed: []
    };
    
    for (let i = 0; i < productsToEnrich.length; i += BATCH_SIZE) {
      const batch = productsToEnrich.slice(i, Math.min(i + BATCH_SIZE, productsToEnrich.length));
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(productsToEnrich.length / BATCH_SIZE);
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📦 BATCH ${batchNum}/${totalBatches}`);
      console.log(`${'='.repeat(60)}`);
      
      const batchResults = await enrichBatch(batch);
      
      allResults.success.push(...batchResults.success);
      allResults.failed.push(...batchResults.failed);
      
      // Stats intermédiaires
      const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(1);
      const rate = (stats.enriched / (elapsed / 60)).toFixed(1);
      
      console.log(`\n📊 Progression : ${stats.enriched}/${stats.total} (${((stats.enriched / stats.total) * 100).toFixed(1)}%)`);
      console.log(`⏱️  Temps écoulé : ${elapsed}s | Vitesse : ${rate} produits/min`);
    }
    
    // Rapport final
    console.log('\n\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                  RAPPORT FINAL                          ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    
    const totalTime = ((Date.now() - stats.startTime) / 1000).toFixed(1);
    const avgTime = (totalTime / stats.total).toFixed(2);
    
    console.log(`Total produits traités : ${stats.total}`);
    console.log(`✅ Enrichis avec succès : ${stats.enriched} (${((stats.enriched / stats.total) * 100).toFixed(1)}%)`);
    console.log(`❌ Échecs : ${stats.failed} (${((stats.failed / stats.total) * 100).toFixed(1)}%)`);
    console.log(`⏱️  Temps total : ${totalTime}s (${avgTime}s/produit)\n`);
    
    // Sauvegarder rapport
    const fs = require('fs');
    const report = {
      date: new Date().toISOString(),
      config: {
        batchSize: BATCH_SIZE,
        maxProducts: MAX_PRODUCTS,
        retryAttempts: RETRY_ATTEMPTS
      },
      stats,
      results: allResults
    };
    
    const reportPath = `./scripts/enrichment/rapport_enrichment_${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`📄 Rapport sauvegardé : ${reportPath}\n`);
    
    // Exemples de produits enrichis
    if (allResults.success.length > 0) {
      console.log('📋 Exemples de produits enrichis :\n');
      allResults.success.slice(0, 5).forEach((p, i) => {
        console.log(`${i + 1}. ${p.name}`);
        console.log(`   Subcategory : ${p.subcategory}`);
        console.log(`   Tags : [${p.tags.join(', ')}]\n`);
      });
    }
    
    // Produits en échec
    if (allResults.failed.length > 0) {
      console.log('⚠️  Produits en échec :\n');
      allResults.failed.slice(0, 5).forEach((p, i) => {
        console.log(`${i + 1}. ${p.name} : ${p.error}`);
      });
    }
    
    console.log('\n✅ Enrichissement terminé !');
    
  } catch (error) {
    console.error('\n❌ ERREUR CRITIQUE :', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnexion MongoDB\n');
  }
}

// Exécution
runEnrichment();
