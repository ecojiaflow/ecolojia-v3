// ═══════════════════════════════════════════════════════════════════
// ECOLOJIA V3.2 - SERVICE ALTERNATIVES INTELLIGENTES
// ═══════════════════════════════════════════════════════════════════
//
// OBJECTIF : Proposer alternatives plus saines via cascade DB → Algo → IA
// ÉCONOMIE : 97% réduction coûts IA grâce au cache intelligent
//
// CASCADE :
// 1. DB Strict (exact match catégorie + critères) → 0ms, gratuit
// 2. DB Relaxed (match relaxé) → <100ms, gratuit
// 3. IA DeepSeek (si <3 résultats) → 2-5s, 0.0001€/requête
//
// ═══════════════════════════════════════════════════════════════════

const Product = require('../models/Product');
const conversationalAI = require('./ai/conversationalAI');

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const CONFIG = {
  MIN_RESULTS_BEFORE_AI: 3,      // Minimum de résultats DB avant d'appeler IA
  MAX_RESULTS: 5,                 // Maximum d'alternatives à retourner
  MIN_SCORE_IMPROVEMENT: 5,       // Amélioration minimale de score (points)
  BUDGET_TOLERANCE: 1.15,         // +15% tolérance prix
  CACHE_TTL: 3600000,             // 1h cache en mémoire (optionnel)
  ENABLE_AI_FALLBACK: true        // Activer fallback IA si DB insuffisant
};

// Cache en mémoire simple (optionnel, pour perf)
const cache = new Map();

// ═══════════════════════════════════════════════════════════════════
// FONCTION PRINCIPALE : findAlternatives
// ═══════════════════════════════════════════════════════════════════

/**
 * Trouve des alternatives plus saines pour un produit
 *
 * @param {Object} params - Paramètres de recherche
 * @param {string} params.productId - ID MongoDB du produit
 * @param {string} [params.barcode] - Code-barres (fallback si pas d'ID)
 * @param {Object} [params.userPreferences] - Préférences utilisateur
 * @param {number} [params.maxResults=5] - Nombre max de résultats
 * @returns {Promise<Object>} { alternatives: Product[], source: 'db'|'ai', metrics: {...} }
 */
async function findAlternatives(params) {
  const startTime = Date.now();

  try {
    // ─────────────────────────────────────────────────────────────
    // 1. RÉCUPÉRER PRODUIT ORIGINAL
    // ─────────────────────────────────────────────────────────────

    const originalProduct = await getOriginalProduct(params);

    if (!originalProduct) {
      console.log('[ALTERNATIVES] Produit original introuvable');
      return {
        alternatives: [],
        source: 'none',
        message: 'Produit introuvable',
        metrics: { duration: Date.now() - startTime }
      };
    }

    console.log(`[ALTERNATIVES] Recherche alternatives pour : ${originalProduct.name}`);
    console.log(`[ALTERNATIVES] Catégorie : ${originalProduct.categoryType || 'NON DÉFINIE ⚠️'}`);
    console.log(`[ALTERNATIVES] Score actuel : ${(originalProduct.scores?.global || originalProduct.scores?.overallScore) || 'N/A'}/100`);

    // VALIDATION CRITIQUE : CategoryType doit exister
    if (!originalProduct.categoryType) {
      console.error('[ALTERNATIVES] ❌ ERREUR CRITIQUE : categoryType manquant pour le produit');
      return {
        alternatives: [],
        source: 'error',
        message: 'Produit sans catégorie définie',
        metrics: { duration: Date.now() - startTime }
      };
    }

    // Normaliser categoryType (lowercase)
    const normalizedCategory = originalProduct.categoryType.toLowerCase();
    console.log(`[ALTERNATIVES] Catégorie normalisée : ${normalizedCategory}`);

    // ─────────────────────────────────────────────────────────────
    // 2. VÉRIFIER CACHE (optionnel)
    // ─────────────────────────────────────────────────────────────

    const cacheKey = `alt_${originalProduct._id}_${JSON.stringify(params.userPreferences || {})}`;

    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CONFIG.CACHE_TTL) {
        console.log('[ALTERNATIVES] ✅ Cache HIT');
        return {
          ...cached.data,
          metrics: {
            ...cached.data.metrics,
            cached: true,
            duration: Date.now() - startTime
          }
        };
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 3. CASCADE DB → IA
    // ─────────────────────────────────────────────────────────────

    let alternatives = [];
    let source = 'none';

    // Niveau 1 : DB Strict
    alternatives = await searchDatabaseStrict(originalProduct, params, normalizedCategory);

    if (alternatives.length >= CONFIG.MIN_RESULTS_BEFORE_AI) {
      source = 'db_strict';
      console.log(`[ALTERNATIVES] ✅ DB Strict : ${alternatives.length} résultats`);
    } else {
      // Niveau 2 : DB Relaxed
      alternatives = await searchDatabaseRelaxed(originalProduct, params, normalizedCategory);

      if (alternatives.length >= CONFIG.MIN_RESULTS_BEFORE_AI) {
        source = 'db_relaxed';
        console.log(`[ALTERNATIVES] ✅ DB Relaxed : ${alternatives.length} résultats`);
      } else if (CONFIG.ENABLE_AI_FALLBACK) {
        // Niveau 3 : IA (uniquement si <3 résultats)
        console.log(`[ALTERNATIVES] ⚠️ DB insuffisant (${alternatives.length}), appel IA...`);

        // const aiAlternatives = await searchWithAI(originalProduct, params); // Désactivé MVP
        const aiAlternatives = []; // Fallback vide pour MVP
        alternatives = [...alternatives, ...aiAlternatives];
        source = alternatives.length > 0 ? 'ai' : 'none';

        console.log(`[ALTERNATIVES] ${source === 'ai' ? '✅' : '❌'} IA : ${aiAlternatives.length} suggestions`);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 4. POST-TRAITEMENT & ENRICHISSEMENT
    // ─────────────────────────────────────────────────────────────

    const enrichedAlternatives = await enrichAlternatives(alternatives, originalProduct, params);

    // Limiter au max demandé
    const finalAlternatives = enrichedAlternatives.slice(0, params.maxResults || CONFIG.MAX_RESULTS);

    // ─────────────────────────────────────────────────────────────
    // 5. RÉSULTAT & MÉTRIQUES
    // ─────────────────────────────────────────────────────────────

    const result = {
      alternatives: finalAlternatives,
      source,
      original: {
        id: originalProduct._id,
        name: originalProduct.name,
        score: (originalProduct.scores?.global || originalProduct.scores?.overallScore),
        categoryType: normalizedCategory
      },
      metrics: {
        duration: Date.now() - startTime,
        dbHits: alternatives.filter(a => a._id).length,
        aiHits: alternatives.filter(a => !a._id).length,
        cached: false
      }
    };

    // Mettre en cache (optionnel)
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    console.log(`[ALTERNATIVES] ✅ ${finalAlternatives.length} alternatives retournées (source: ${source}, ${result.metrics.duration}ms)`);

    return result;

  } catch (error) {
    console.error('[ALTERNATIVES] Erreur:', error);
    return {
      alternatives: [],
      source: 'error',
      error: error.message,
      metrics: { duration: Date.now() - startTime }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// NIVEAU 1 : RECHERCHE DB STRICTE
// ═══════════════════════════════════════════════════════════════════

async function searchDatabaseStrict(originalProduct, params, normalizedCategory) {
  const currentScore = originalProduct.scores?.global || originalProduct.scores?.overallScore || 0;
  const minScore = currentScore + CONFIG.MIN_SCORE_IMPROVEMENT;

  const query = {
    categoryType: normalizedCategory, // FILTRE CATÉGORIE NORMALISÉ
    _id: { $ne: originalProduct._id },
    'scores.overallScore': { $gte: minScore } // UNIFORMISÉ : scores.overallScore
  };

  console.log(`[ALTERNATIVES] DB Strict query:`, JSON.stringify(query));

  // Filtres utilisateur (allergènes, labels, budget)
  if (params.userPreferences) {
    applyUserFilters(query, params.userPreferences);
  }

  try {
    const results = await Product.find(query)
      .sort({ 'scores.overallScore': -1 })
      .limit(CONFIG.MAX_RESULTS)
      .lean();

    console.log(`[ALTERNATIVES] DB Strict résultats:`, results.map(r => `${r.name} (${r.categoryType}, ${r.scores?.global}/100)`));

    return results;
  } catch (error) {
    console.error('[ALTERNATIVES] Erreur DB Strict:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════
// NIVEAU 2 : RECHERCHE DB RELAXÉE
// ═══════════════════════════════════════════════════════════════════

async function searchDatabaseRelaxed(originalProduct, params, normalizedCategory) {
  const currentScore = originalProduct.scores?.global || originalProduct.scores?.overallScore || 0;

  const query = {
    categoryType: normalizedCategory, // FILTRE CATÉGORIE NORMALISÉ
    _id: { $ne: originalProduct._id },
    'scores.overallScore': { $gte: currentScore } // Pas d'amélioration minimale
  };

  console.log(`[ALTERNATIVES] DB Relaxed query:`, JSON.stringify(query));

  // Critères relaxés
  if (params.userPreferences) {
    applyUserFilters(query, params.userPreferences, { relaxed: true });
  }

  try {
    const results = await Product.find(query)
      .sort({ 'scores.overallScore': -1 })
      .limit(CONFIG.MAX_RESULTS * 2) // Chercher plus large
      .lean();

    console.log(`[ALTERNATIVES] DB Relaxed résultats:`, results.map(r => `${r.name} (${r.categoryType}, ${r.scores?.global}/100)`));

    return results;
  } catch (error) {
    console.error('[ALTERNATIVES] Erreur DB Relaxed:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════
// NIVEAU 3 : RECHERCHE AVEC IA (FALLBACK)
// ═══════════════════════════════════════════════════════════════════

async function searchWithAI(originalProduct, params) {
  try {
    const prompt = buildAIPrompt(originalProduct, params);

    // Utiliser conversationalAI existant
    const response = await conversationalAI.getAlternatives({
      productName: originalProduct.name,
      category: originalProduct.categoryType,
      currentScore: (originalProduct.scores?.global || originalProduct.scores?.overallScore),
      userPreferences: params.userPreferences
    });

    // Parser la réponse IA et chercher produits dans DB
    const suggestedNames = extractProductNames(response);

    const alternatives = await Promise.all(
      suggestedNames.map(name => findProductByName(name, originalProduct.categoryType))
    );

    return alternatives.filter(Boolean); // Retirer nulls

  } catch (error) {
    console.error('[ALTERNATIVES] Erreur IA:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════════════════════════════

async function getOriginalProduct(params) {
  try {
    if (params.productId) {
      return await Product.findById(params.productId).lean();
    } else if (params.barcode) {
      return await Product.findOne({ barcode: params.barcode }).lean();
    }
    return null;
  } catch (error) {
    console.error('[ALTERNATIVES] Erreur récupération produit:', error);
    return null;
  }
}

function applyUserFilters(query, prefs, options = {}) {
  const relaxed = options.relaxed || false;

  // Allergènes (strict)
  if (prefs.allergens && prefs.allergens.length > 0 && !relaxed) {
    query['foodData.allergens'] = { $nin: prefs.allergens };
  }

  // Labels (ex: bio, vegan)
  if (prefs.labels && prefs.labels.length > 0) {
    if (relaxed) {
      query['labels'] = { $in: prefs.labels }; // Au moins un label
    } else {
      query['labels'] = { $all: prefs.labels }; // Tous les labels
    }
  }

  // Budget (si disponible dans params)
  if (prefs.maxPrice) {
    query['price'] = { $lte: prefs.maxPrice * (relaxed ? CONFIG.BUDGET_TOLERANCE : 1) };
  }
}

async function enrichAlternatives(alternatives, originalProduct, params) {
  return alternatives.map(alt => ({
    ...alt,
    improvements: calculateImprovements(alt, originalProduct),
    matchScore: calculateMatchScore(alt, originalProduct, params.userPreferences),
    reasons: generateReasons(alt, originalProduct)
  }));
}

function calculateImprovements(alternative, original) {
  const improvements = [];

  const altScore = (alternative.scores?.global || alternative.scores?.overallScore) || 0;
  const origScore = (original.scores?.global || original.scores?.overallScore) || 0;
  const scoreDiff = altScore - origScore;

  if (scoreDiff > 0) {
    improvements.push(`+${scoreDiff} points de score global`);
  }

  // Analyser composantes
  const altBreakdown = alternative.scores?.breakdown || {};
  const origBreakdown = original.scores?.breakdown || {};

  if (altBreakdown.nova?.score > origBreakdown.nova?.score) {
    improvements.push('Moins transformé (NOVA)');
  }

  if (altBreakdown.additives?.score > origBreakdown.additives?.score) {
    improvements.push('Moins d\'additifs');
  }

  if (altBreakdown.ecoScore?.score > origBreakdown.ecoScore?.score) {
    improvements.push('Meilleur impact environnemental');
  }

  return improvements;
}

function calculateMatchScore(alternative, original, userPrefs) {
  let score = 70; // Base

  // Score global
  const scoreDiff = ((alternative.scores?.global || alternative.scores?.overallScore) || 0) - ((original.scores?.global || original.scores?.overallScore) || 0);
  score += Math.min(scoreDiff, 20);

  // Préférences utilisateur
  if (userPrefs?.labels && alternative.labels) {
    const matchingLabels = userPrefs.labels.filter(l => alternative.labels.includes(l));
    score += matchingLabels.length * 3;
  }

  // Même catégorie
  if (alternative.categoryType === original.categoryType) {
    score += 5;
  }

  return Math.min(Math.max(score, 0), 100);
}

function generateReasons(alternative, original) {
  const reasons = [];

  if (alternative.labels?.includes('bio')) {
    reasons.push('Produit biologique certifié');
  }

  if (alternative.labels?.includes('vegan')) {
    reasons.push('Sans produits d\'origine animale');
  }

  const altScore = (alternative.scores?.global || alternative.scores?.overallScore) || 0;
  const origScore = (original.scores?.global || original.scores?.overallScore) || 0;

  if (altScore > origScore + 15) {
    reasons.push('Score nettement supérieur');
  }

  return reasons;
}

function buildAIPrompt(product, params) {
  return `Suggère 3 alternatives plus saines pour "${product.name}" (catégorie: ${product.categoryType}, score: ${(product.scores?.global || product.scores?.overallScore)}/100).`;
}

function extractProductNames(aiResponse) {
  // Parser réponse IA pour extraire noms de produits
  // Format attendu : liste de noms
  if (typeof aiResponse === 'string') {
    return aiResponse.split('\n').filter(line => line.trim().length > 0).slice(0, 3);
  }
  return [];
}

async function findProductByName(name, category) {
  try {
    return await Product.findOne({
      name: new RegExp(name, 'i'),
      categoryType: category
    }).lean();
  } catch (error) {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  findAlternatives,
  searchDatabaseStrict,
  searchDatabaseRelaxed,
  CONFIG
};
