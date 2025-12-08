// PATH: backend/batch-enrich-tags.js
const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./src/models/Product');
const deepSeekService = require('./src/services/ai/deepSeekService');

const logger = {
  info: (...args) => console.log('[BATCH-TAGS]', ...args),
  warn: (...args) => console.warn('[BATCH-TAGS WARN]', ...args),
  error: (...args) => console.error('[BATCH-TAGS ERROR]', ...args)
};

// Configuration
const BATCH_SIZE = 50; // Nombre de produits par appel DeepSeek
const DRY_RUN = true; // true = simulation sans sauvegarde
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // ms

/**
 * Générer des tags pour un batch de produits via DeepSeek
 */
async function generateTagsForBatch(products) {
  const productList = products.map((p, idx) => {
    return `${idx + 1}. ${p.name || 'Nom inconnu'}
   Catégorie: ${p.categoryType}
   Subcategory: ${p.subcategory || 'non défini'}
   Marque: ${p.brand || 'non défini'}
   Ingrédients: ${p.ingredients_text ? p.ingredients_text.substring(0, 200) : 'non défini'}`;
  }).join('\n\n');

  const prompt = `Tu es un expert en classification de produits alimentaires, cosmétiques et détergents.

Génère des TAGS descriptifs pour chaque produit ci-dessous. Les tags doivent être :
- En ANGLAIS (lowercase)
- Simples et descriptifs (1-2 mots max par tag)
- Pertinents pour la recherche et les alternatives
- Entre 5 et 10 tags par produit

Exemples de bons tags :
- Alimentaire : sweet, salty, crunchy, breakfast, snack, fruit, vegetable, meat, dairy, organic, chocolate, hazelnut
- Cosmétique : moisturizing, cleansing, anti-aging, sensitive-skin, fragrance-free, natural
- Détergent : laundry, dishes, eco-friendly, concentrated, fresh-scent

PRODUITS À ANALYSER :
${productList}

RÉPONDS UNIQUEMENT avec un JSON valide au format :
{
  "products": [
    {
      "index": 1,
      "tags": ["tag1", "tag2", "tag3", ...]
    },
    {
      "index": 2,
      "tags": ["tag1", "tag2", "tag3", ...]
    }
  ]
}

IMPORTANT : Pas de texte avant ou après le JSON, uniquement le JSON.`;

  try {
    // ✅ CORRECTION : Utiliser chat() au lieu de generateContent()
    const response = await deepSeekService.chat({
      apiKey: process.env.DEEPSEEK_API_KEY,
      model: 'deepseek-chat',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.3
    });
    
    if (!response || !response.content) {
      throw new Error('Réponse DeepSeek vide');
    }

    // Parser la réponse JSON
    let jsonText = response.content.trim();
    
    // Nettoyer les markdown code blocks si présents
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const parsed = JSON.parse(jsonText);
    
    if (!parsed.products || !Array.isArray(parsed.products)) {
      throw new Error('Format JSON invalide');
    }

    return parsed.products;
    
  } catch (error) {
    logger.error('Erreur génération tags:', error.message);
    return null;
  }
}

/**
 * Traiter un batch de produits avec retry
 */
async function processBatchWithRetry(products, attempt = 1) {
  try {
    logger.info(`📡 Appel DeepSeek pour ${products.length} produits (tentative ${attempt}/${MAX_RETRIES})...`);
    
    const tagsResults = await generateTagsForBatch(products);
    
    if (!tagsResults) {
      throw new Error('Génération tags échouée');
    }

    // Mapper les tags aux produits
    const updates = [];
    for (const result of tagsResults) {
      const productIndex = result.index - 1; // index commence à 1 dans le prompt
      if (productIndex >= 0 && productIndex < products.length) {
        const product = products[productIndex];
        const tags = Array.isArray(result.tags) ? result.tags : [];
        
        if (tags.length > 0) {
          updates.push({
            productId: product._id,
            productName: product.name,
            tags: tags.filter(t => t && typeof t === 'string').map(t => t.toLowerCase().trim())
          });
        }
      }
    }

    return updates;
    
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      logger.warn(`⚠️ Tentative ${attempt} échouée, retry dans ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return processBatchWithRetry(products, attempt + 1);
    } else {
      logger.error(`❌ Échec après ${MAX_RETRIES} tentatives`);
      return [];
    }
  }
}

/**
 * Fonction principale
 */
async function batchEnrichTags() {
  const startTime = Date.now();
  
  try {
    logger.info('🚀 Démarrage enrichissement massif tags...');
    logger.info(`Mode: ${DRY_RUN ? 'SIMULATION (DRY RUN)' : 'PRODUCTION'}`);
    logger.info('');

    // Connexion MongoDB
    logger.info('🔌 Connexion MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('✅ Connecté à MongoDB\n');

    // Compter produits sans tags
    const totalWithoutTags = await Product.countDocuments({
      $or: [
        { tags: { $exists: false } },
        { tags: { $eq: [] } },
        { tags: { $size: 0 } }
      ]
    });

    logger.info(`📊 Produits sans tags : ${totalWithoutTags.toLocaleString()}`);
    logger.info(`📦 Taille batch : ${BATCH_SIZE} produits par appel`);
    logger.info(`🔢 Nombre d'appels DeepSeek estimé : ${Math.ceil(totalWithoutTags / BATCH_SIZE)}`);
    logger.info('');

    if (totalWithoutTags === 0) {
      logger.info('✅ Tous les produits ont déjà des tags !');
      return;
    }

    // Statistiques
    let processed = 0;
    let enriched = 0;
    let errors = 0;
    const batchTimes = [];

    // Traitement par batches
    const totalBatches = Math.ceil(totalWithoutTags / BATCH_SIZE);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStartTime = Date.now();
      
      logger.info(`\n${'='.repeat(80)}`);
      logger.info(`📦 BATCH ${batchIndex + 1}/${totalBatches}`);
      logger.info(`${'='.repeat(80)}`);

      // Charger le batch
      const products = await Product.find({
        $or: [
          { tags: { $exists: false } },
          { tags: { $eq: [] } },
          { tags: { $size: 0 } }
        ]
      })
      .limit(BATCH_SIZE)
      .lean();

      if (products.length === 0) {
        logger.info('✅ Plus de produits à traiter');
        break;
      }

      logger.info(`📥 ${products.length} produits chargés`);

      // Générer tags via DeepSeek
      const updates = await processBatchWithRetry(products);

      if (updates.length === 0) {
        logger.error('❌ Aucun tag généré pour ce batch');
        errors += products.length;
        processed += products.length;
        continue;
      }

      // Sauvegarder en MongoDB
      if (!DRY_RUN) {
        logger.info(`💾 Sauvegarde ${updates.length} produits en MongoDB...`);
        
        for (const update of updates) {
          try {
            await Product.updateOne(
              { _id: update.productId },
              { $set: { tags: update.tags } }
            );
            enriched++;
            
            logger.info(`  ✅ ${update.productName.substring(0, 40)} : [${update.tags.slice(0, 5).join(', ')}${update.tags.length > 5 ? '...' : ''}]`);
          } catch (err) {
            logger.error(`  ❌ Erreur sauvegarde ${update.productName}: ${err.message}`);
            errors++;
          }
        }
      } else {
        logger.info(`🔍 SIMULATION - ${updates.length} produits seraient sauvegardés`);
        updates.forEach(update => {
          logger.info(`  📝 ${update.productName.substring(0, 40)} : [${update.tags.slice(0, 5).join(', ')}${update.tags.length > 5 ? '...' : ''}]`);
        });
        enriched += updates.length;
      }

      processed += products.length;
      
      const batchTime = Date.now() - batchStartTime;
      batchTimes.push(batchTime);
      
      const avgBatchTime = batchTimes.reduce((a, b) => a + b, 0) / batchTimes.length;
      const remainingBatches = totalBatches - batchIndex - 1;
      const estimatedTimeRemaining = (avgBatchTime * remainingBatches) / 1000 / 60;

      logger.info('');
      logger.info(`⏱️  Temps batch : ${(batchTime / 1000).toFixed(1)}s`);
      logger.info(`📊 Progrès : ${processed}/${totalWithoutTags} (${((processed/totalWithoutTags)*100).toFixed(1)}%)`);
      logger.info(`✅ Enrichis : ${enriched}`);
      logger.info(`❌ Erreurs : ${errors}`);
      logger.info(`⏳ Temps restant estimé : ${estimatedTimeRemaining.toFixed(1)} minutes`);

      // Petite pause entre batches pour éviter rate limiting
      if (batchIndex < totalBatches - 1) {
        logger.info('⏸️  Pause 2s avant prochain batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Résumé final
    const totalTime = (Date.now() - startTime) / 1000 / 60;
    
    logger.info('');
    logger.info(`${'='.repeat(80)}`);
    logger.info('🎉 ENRICHISSEMENT TERMINÉ');
    logger.info(`${'='.repeat(80)}`);
    logger.info(`✅ Produits enrichis : ${enriched.toLocaleString()}`);
    logger.info(`❌ Erreurs : ${errors.toLocaleString()}`);
    logger.info(`⏱️  Temps total : ${totalTime.toFixed(1)} minutes`);
    logger.info(`💰 Coût estimé : ~${((totalBatches * 0.002) * 5).toFixed(2)}€`);
    logger.info('');

  } catch (error) {
    logger.error('❌ Erreur fatale:', error);
  } finally {
    await mongoose.disconnect();
    logger.info('🔌 Déconnecté de MongoDB');
  }
}

// Exécution
batchEnrichTags().catch(console.error);
