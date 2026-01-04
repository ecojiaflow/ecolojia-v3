const Product = require('../models/Product');
const logger = require('../utils/logger');
const stringSimilarity = require('string-similarity');

// ================== CONFIGURATION V3.4 ==================
// ✅ V3.4 : Filtrage par NIVEAU + SCORE + CONFIDENCE
// Niveau 1 = Acceptable, 2 = À limiter, 3 = À réserver aux occasions
const CONFIG = {
  MAX_RESULTS: 5,
  MAX_LEVEL_FOR_ALTERNATIVES: 2, // Alternatives niveau 1 ou 2 max (pas niveau 3)
  FALLBACK_MAX_LEVEL: 3, // Fallback : accepter niveau 3 si aucun résultat
  MIN_CONFIDENCE: 0.4, // Données minimalement fiables
  MIN_KEYWORD_LENGTH: 3,
  MIN_RELEVANCE_SCORE: 40,
  WEIGHT_NAME_SIMILARITY: 0.4,
  WEIGHT_CATEGORY_MATCH: 0.3,
  WEIGHT_LEVEL_IMPROVEMENT: 0.3, // Bonus si niveau meilleur
  TIMEOUT_DB_SMART: 5000,
  TIMEOUT_DB_RELAXED: 3000,
  TIMEOUT_AI: 10000
};

// ================== STOPWORDS FRANÇAIS ==================
const FRENCH_STOPWORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'au', 'aux',
  'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car',
  'ce', 'cet', 'cette', 'ces',
  'mon', 'ton', 'son', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses',
  'notre', 'votre', 'leur', 'nos', 'vos', 'leurs',
  'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
  'que', 'qui', 'quoi', 'dont', 'où',
  'avec', 'sans', 'pour', 'par', 'dans', 'sur', 'sous',
  'à', 'en', 'y'
]);

// ================== DICTIONNAIRE INGRÉDIENTS ==================
const INGREDIENT_PATTERNS = {
  chocolat: ['chocolat', 'cacao', 'cacaotier', 'theobroma'],
  noisette: ['noisette', 'hazelnut', 'aveline'],
  lait: ['lait', 'lactose', 'milk', 'dairy', 'crème', 'beurre'],
  sucre: ['sucre', 'sugar', 'glucose', 'fructose', 'sirop', 'miel'],
  huile: ['huile', 'oil', 'graisse', 'fat', 'lipide'],
  pâte: ['pâte', 'tartiner', 'spread', 'crème'],
  bio: ['bio', 'organic', 'biologique', 'agriculture biologique'],
  vegan: ['vegan', 'végétal', 'végétarien', 'sans lait'],
  gluten: ['gluten', 'blé', 'wheat', 'céréale']
};

// ================== FONCTIONS UTILITAIRES ==================

/**
 * Détecte le type de produit (chocolat, noisette, lait, etc.)
 */
function detectProductType(product) {
  const searchText = `${product.name} ${product.ingredients || ''}`.toLowerCase();
  const types = [];
  
  for (const [type, patterns] of Object.entries(INGREDIENT_PATTERNS)) {
    if (patterns.some(p => searchText.includes(p))) {
      types.push(type);
    }
  }
  
  return types;
}

/**
 * 🔍 EXTRACTION KEYWORDS AMÉLIORÉE (6 sources)
 * @param {Object} product - Produit source
 * @returns {Array<string>} - Liste de mots-clés pertinents
 */
function extractKeywords(product) {
  const keywords = new Set();

  // 1. Depuis le nom du produit
  if (product.name) {
    const words = product.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever accents
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= CONFIG.MIN_KEYWORD_LENGTH && !FRENCH_STOPWORDS.has(w));
    
    words.forEach(w => keywords.add(w));
  }

  // 2. Depuis types détectés
  const types = detectProductType(product);
  types.forEach(t => keywords.add(t));

  // 3. Depuis catégorie principale
  if (product.categoryType) {
    keywords.add(product.categoryType.toLowerCase());
  }

  // 4. Depuis tags catégories (amélioration parsing tirets)
  if (product.categories_tags && Array.isArray(product.categories_tags)) {
    product.categories_tags.forEach(tag => {
      const cleaned = tag
        .replace(/^[a-z]{2}:/, '') // Enlever préfixe langue (en:, fr:)
        .replace(/-/g, ' ')        // Remplacer tirets par espaces
        .toLowerCase();
      
      cleaned.split(' ').forEach(w => {
        if (w.length >= CONFIG.MIN_KEYWORD_LENGTH && !FRENCH_STOPWORDS.has(w)) {
          keywords.add(w);
        }
      });
    });
  }

  // 5. Depuis ingrédients (top 5 ingrédients principaux)
  if (product.ingredients_text) {
    const ingredients = product.ingredients_text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/[,;.]/)               // Séparer par virgules/points
      .slice(0, 5)                  // Garder les 5 premiers (principaux)
      .map(ing => ing.trim())
      .filter(ing => ing.length > 0);
    
    ingredients.forEach(ing => {
      const words = ing
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= CONFIG.MIN_KEYWORD_LENGTH && !FRENCH_STOPWORDS.has(w));
      
      words.forEach(w => keywords.add(w));
    });
  }

  // 6. Depuis marque
  if (product.brands) {
    const brandWords = product.brands
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= CONFIG.MIN_KEYWORD_LENGTH);
    
    brandWords.forEach(w => keywords.add(w));
  }

  const result = Array.from(keywords);
  logger.info(`[ALTERNATIVES] Keywords extraits : [${result.join(', ')}]`);
  return result;
}

/**
 * ✅ V3.3 : Récupère le niveau d'un produit (1, 2 ou 3)
 * @param {Object} product - Produit
 * @returns {number} - Niveau (1=Acceptable, 2=À limiter, 3=À réserver)
 */
function getProductLevel(product) {
  // Priorité 1 : constitution.healthReflex.level
  if (product.constitution?.healthReflex?.level) {
    return product.constitution.healthReflex.level;
  }
  // Priorité 2 : level direct (pour les résultats de recherche)
  if (product.level) {
    return product.level;
  }
  // Défaut : niveau 3 (prudent)
  return 3;
}

/**
 * ✅ V3.3 : Calcule score de pertinence avec bonus niveau
 */
function calculateRelevanceScore(originalProduct, alternative, keywords) {
  let score = 0;
  
  // 1. Similarité nom (40%)
  const similarity = stringSimilarity.compareTwoStrings(
    originalProduct.name.toLowerCase(),
    alternative.name.toLowerCase()
  );
  score += similarity * CONFIG.WEIGHT_NAME_SIMILARITY * 100;
  
  // 2. Match catégorie (30%)
  if (alternative.categoryType === originalProduct.categoryType) {
    score += CONFIG.WEIGHT_CATEGORY_MATCH * 100;
  }
  
  // 3. ✅ V3.3 : Bonus amélioration niveau (30%)
  // Niveau 1 = meilleur, donc on inverse la logique
  const originalLevel = getProductLevel(originalProduct);
  const alternativeLevel = getProductLevel(alternative);
  const levelImprovement = originalLevel - alternativeLevel; // Positif si alternative meilleure
  const normalizedImprovement = Math.max(0, Math.min(levelImprovement / 2, 1)); // 0 à 1
  score += normalizedImprovement * CONFIG.WEIGHT_LEVEL_IMPROVEMENT * 100;
  
  return Math.round(score);
}

/**
 * ✅ V3.4 : Recherche par taxonomie (subcategory exact match)
 * Filtrage par NIVEAU + SCORE + CONFIDENCE
 * PRIORITÉ 1 : Match exact sous-catégorie
 */
async function searchDatabaseTaxonomy(product, maxLevel, minScore) {
  try {
    // Vérifier si subcategory existe
    if (!product.subcategory) {
      logger.info('[ALTERNATIVES] Pas de subcategory → skip recherche taxonomy');
      return [];
    }

    logger.info(`[ALTERNATIVES] Stratégie : Taxonomy Match (subcategory: "${product.subcategory}", maxLevel: ${maxLevel}, minScore: ${minScore})`);

    const query = {
      $and: [
        { barcode: { $ne: product.barcode } },
        { categoryType: product.categoryType },
        { subcategory: product.subcategory },
        { 'constitution.healthReflex.level': { $lte: maxLevel } },
        { 'scores.overallScore': { $gte: minScore } },
        { 'scores.confidence': { $gte: CONFIG.MIN_CONFIDENCE } }
      ]
    };

    const candidates = await Product.find(query)
      .select('barcode name scores categoryType subcategory tags constitution')
      .sort({ 'scores.overallScore': -1 }) // ✅ V3.4 : Tri par score décroissant
      .limit(10)
      .maxTimeMS(CONFIG.TIMEOUT_DB_RELAXED)
      .lean();

    logger.info(`[ALTERNATIVES] Taxonomy Match : ${candidates.length} candidats trouvés`);

    if (candidates.length > 0) {
      logger.info('[ALTERNATIVES] ✅ Taxonomy Match réussi → Alternatives de même sous-catégorie');
    }

    return candidates;

  } catch (error) {
    logger.error(`[ALTERNATIVES] Erreur Taxonomy Match : ${error.message}`);
    return [];
  }
}

/**
 * ✅ V3.4 : Recherche par tags (intersection)
 * Filtrage par NIVEAU + SCORE + CONFIDENCE
 * PRIORITÉ 2 : Match si ≥2 tags communs
 */
async function searchDatabaseTags(product, maxLevel, minScore) {
  try {
    // Vérifier si tags existent
    if (!product.tags || product.tags.length === 0) {
      logger.info('[ALTERNATIVES] Pas de tags → skip recherche tags');
      return [];
    }

    logger.info(`[ALTERNATIVES] Stratégie : Tags Match (${product.tags.length} tags, maxLevel: ${maxLevel}, minScore: ${minScore})`);

    const query = {
      $and: [
        { barcode: { $ne: product.barcode } },
        { categoryType: product.categoryType },
        { 'constitution.healthReflex.level': { $lte: maxLevel } },
        { 'scores.overallScore': { $gte: minScore } },
        { 'scores.confidence': { $gte: CONFIG.MIN_CONFIDENCE } },
        {
          tags: {
            $in: product.tags
          }
        }
      ]
    };

    const candidates = await Product.find(query)
      .select('barcode name scores categoryType subcategory tags constitution')
      .sort({ 'scores.overallScore': -1 }) // ✅ V3.4 : Tri par score décroissant
      .limit(50)
      .maxTimeMS(CONFIG.TIMEOUT_DB_RELAXED)
      .lean();

    logger.info(`[ALTERNATIVES] Tags Match : ${candidates.length} candidats bruts`);

    // Filtrage : garder uniquement si ≥2 tags communs
    const filtered = candidates.filter(candidate => {
      if (!candidate.tags || candidate.tags.length === 0) return false;
      const commonTags = product.tags.filter(tag => candidate.tags.includes(tag));
      return commonTags.length >= 2;
    });

    logger.info(`[ALTERNATIVES] Tags Match : ${filtered.length} après filtre (≥2 tags communs)`);

    if (filtered.length > 0) {
      logger.info('[ALTERNATIVES] ✅ Tags Match réussi → Alternatives avec tags similaires');
    }

    return filtered.slice(0, 10);

  } catch (error) {
    logger.error(`[ALTERNATIVES] Erreur Tags Match : ${error.message}`);
    return [];
  }
}

/**
 * ✅ V3.4 : Recherche DB Smart
 * Filtrage par NIVEAU + SCORE + CONFIDENCE
 */
async function searchDatabaseSmart(product, keywords, maxLevel, minScore) {
  try {
    logger.info(`[ALTERNATIVES] Stratégie : DB Smart (mots-clés + filtres, maxLevel: ${maxLevel}, minScore: ${minScore})`);
    
    // Construire regex pour recherche flexible
    const keywordRegex = keywords.map(k => `(?=.*${k})`).join('');
    const searchRegex = new RegExp(keywordRegex, 'i');
    
    const query = {
      $and: [
        { barcode: { $ne: product.barcode } },
        { categoryType: product.categoryType },
        { 'constitution.healthReflex.level': { $lte: maxLevel } },
        { 'scores.overallScore': { $gte: minScore } },
        { 'scores.confidence': { $gte: CONFIG.MIN_CONFIDENCE } },
        {
          $or: [
            { name: searchRegex },
            { categories_tags: { $in: keywords.map(k => new RegExp(k, 'i')) } }
          ]
        }
      ]
    };
    
    const results = await Product.find(query)
      .select('barcode name scores categoryType categories_tags constitution')
      .sort({ 'scores.overallScore': -1 }) // ✅ V3.4 : Tri par score décroissant
      .limit(20)
      .maxTimeMS(CONFIG.TIMEOUT_DB_SMART)
      .lean();
    
    logger.info(`[ALTERNATIVES] DB Smart : ${results.length} candidats trouvés`);

    if (results.length > 0) {
      logger.info('[ALTERNATIVES] ✅ Stratégie Smart réussie : alternatives par mots-clés');
    }
    return results;
    
  } catch (error) {
    logger.error(`[ALTERNATIVES] Erreur DB Smart : ${error.message}`);
    return [];
  }
}

/**
 * ✅ V3.4 : Recherche DB Relaxed (fallback)
 * Filtrage par NIVEAU + SCORE optionnel
 */
async function searchDatabaseRelaxed(product, maxLevel, minScore) {
  try {
    logger.info(`[ALTERNATIVES] Stratégie : DB Relaxed (catégorie large, maxLevel: ${maxLevel}, minScore: ${minScore})`);
    
    const query = {
      barcode: { $ne: product.barcode },
      categoryType: product.categoryType,
      'constitution.healthReflex.level': { $lte: maxLevel },
      'scores.overallScore': { $gte: minScore }
    };
    
    const results = await Product.find(query)
      .select('barcode name scores categoryType constitution')
      .sort({ 'scores.overallScore': -1 }) // ✅ V3.4 : Tri par score décroissant
      .limit(10)
      .maxTimeMS(CONFIG.TIMEOUT_DB_RELAXED)
      .lean();
    
    logger.info(`[ALTERNATIVES] DB Relaxed : ${results.length} candidats trouvés`);
    return results;
    
  } catch (error) {
    logger.error(`[ALTERNATIVES] Erreur DB Relaxed : ${error.message}`);
    return [];
  }
}

// ================== FONCTION PRINCIPALE V3.4 ==================
/**
 * ✅ V3.4 : Point d'entrée - Filtrage par NIVEAU + SCORE + CONFIDENCE
 * Cherche des alternatives de niveau meilleur ou égal ET score supérieur ou égal
 */
async function findAlternatives({
  product,
  maxResults = CONFIG.MAX_RESULTS
}) {
  try {
    const originalLevel = getProductLevel(product);
    const originalScore = product.scores?.overallScore || 0;
    
    logger.info('\n========== RECHERCHE ALTERNATIVES V3.4 ==========');
    logger.info(`Produit original : ${product.name}`);
    logger.info(`  - Niveau : ${originalLevel} (${originalLevel === 1 ? 'Acceptable' : originalLevel === 2 ? 'À limiter' : 'À réserver'})`);
    logger.info(`  - Score : ${originalScore}/100`);
    
    // ✅ V3.4 : Filtres combinés
    // - Niveau meilleur ou égal (1 ou 2 max pour un produit niveau 3)
    // - Score supérieur ou égal au produit original
    // - Confidence >= 0.4 (données fiables)
    const maxLevel = Math.min(originalLevel, CONFIG.MAX_LEVEL_FOR_ALTERNATIVES);
    const minScore = originalScore;
    
    logger.info(`Critères recherche : niveau ≤ ${maxLevel}, score ≥ ${minScore}, confidence ≥ ${CONFIG.MIN_CONFIDENCE}`);
    
    // 1. Extraire mots-clés
    const keywords = extractKeywords(product);
    
    // 2. Cascade de recherche
    let candidates = [];
    
    // ÉTAPE 1 : Match taxonomie exacte (même subcategory)
    candidates = await searchDatabaseTaxonomy(product, maxLevel, minScore);
    
    // ÉTAPE 2 : Match tags (≥2 tags communs) si < 3 résultats
    if (candidates.length < 3) {
      const tagResults = await searchDatabaseTags(product, maxLevel, minScore);
      candidates.push(...tagResults);
    }
    
    // ÉTAPE 3 : Recherche textuelle (fallback) si < 3 résultats
    if (candidates.length < 3) {
      const smartResults = await searchDatabaseSmart(product, keywords, maxLevel, minScore);
      candidates.push(...smartResults);
    }
    
    // ÉTAPE 4 : DB Relaxed (si pas assez de résultats)
    if (candidates.length < 3) {
      logger.info('[ALTERNATIVES] Pas assez de résultats, passage en Relaxed...');
      const relaxedResults = await searchDatabaseRelaxed(product, maxLevel, minScore);
      candidates.push(...relaxedResults);
    }
    
    // Dédupliquer
    candidates = Array.from(
      new Map(candidates.map(p => [p.barcode, p])).values()
    );
    
    // ⚠️ FALLBACK : Si 0 résultats, relâcher les contraintes progressivement
    if (candidates.length === 0) {
      logger.warn('[ALTERNATIVES] ⚠️ Aucune alternative trouvée. Fallback : score >= 0...');
      candidates = await searchDatabaseRelaxed(product, maxLevel, 0);
      
      // Si toujours 0, accepter niveau 3
      if (candidates.length === 0 && maxLevel < CONFIG.FALLBACK_MAX_LEVEL) {
        logger.warn(`[ALTERNATIVES] ⚠️ Fallback niveau ${CONFIG.FALLBACK_MAX_LEVEL}...`);
        candidates = await searchDatabaseRelaxed(product, CONFIG.FALLBACK_MAX_LEVEL, 0);
      }
    }
    
    // 3. Calculer score de pertinence et trier
    const alternativesWithScore = candidates
      .filter(alt => alt.barcode !== product.barcode)
      .map(alt => ({
        ...alt,
        level: getProductLevel(alt),
        relevanceScore: calculateRelevanceScore(product, alt, keywords)
      }))
      .filter(alt => alt.relevanceScore >= CONFIG.MIN_RELEVANCE_SCORE)
      .sort((a, b) => {
        // ✅ V3.4 : Priorité au SCORE (plus haut = meilleur)
        const scoreA = a.scores?.overallScore || 0;
        const scoreB = b.scores?.overallScore || 0;
        if (scoreA !== scoreB) {
          return scoreB - scoreA; // Score décroissant
        }
        // Puis par niveau (1 = meilleur)
        if (a.level !== b.level) {
          return a.level - b.level;
        }
        // Puis par pertinence
        return b.relevanceScore - a.relevanceScore;
      })
      .slice(0, maxResults);
    
    logger.info(`[ALTERNATIVES] ${alternativesWithScore.length} alternatives pertinentes retournées`);
    if (alternativesWithScore.length > 0) {
      alternativesWithScore.forEach((alt, i) => {
        logger.info(`  ${i + 1}. ${alt.name} - Score: ${alt.scores?.overallScore || '?'}, Niveau: ${alt.level}`);
      });
    }
    logger.info('========== FIN RECHERCHE ALTERNATIVES ==========\n');
    
    return { alternatives: alternativesWithScore, source: 'database' };
    
  } catch (error) {
    logger.error(`[ALTERNATIVES] Erreur fonction principale : ${error.message}`);
    return { alternatives: [], source: 'error' };
  }
}

// ================== EXPORTS ==================
module.exports = {
  findAlternatives,
  extractKeywords,
  calculateRelevanceScore,
  getProductLevel,
  CONFIG
};