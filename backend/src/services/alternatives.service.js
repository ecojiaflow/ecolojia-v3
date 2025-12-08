const Product = require('../models/Product');
const logger = require('../utils/logger');
const stringSimilarity = require('string-similarity');

// ================== CONFIGURATION ==================
const CONFIG = {
  MAX_RESULTS: 5,
  MIN_SCORE_IMPROVEMENT: 5, // +5 pts minimum vs produit original
  MIN_ABSOLUTE_SCORE: 70, // ✅ NOUVEAU : Score minimum ABSOLU pour toutes alternatives (zone verte)
  FALLBACK_MIN_SCORE: 60, // ⚠️ Fallback si 0 résultats en zone verte (orange haute)
  MIN_KEYWORD_LENGTH: 3,
  MIN_RELEVANCE_SCORE: 40,
  WEIGHT_NAME_SIMILARITY: 0.4,
  WEIGHT_CATEGORY_MATCH: 0.3,
  WEIGHT_SCORE_DIFF: 0.3,
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
 * Extrait mots-clés pertinents du produit
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

  // 5. ✨ NOUVEAU : Depuis ingrédients (top 5 ingrédients principaux)
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

  // 6. ✨ NOUVEAU : Depuis marque
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
 * Calcule score de pertinence (0-100)
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
  
  // 3. Amélioration score (30%)
  const scoreDiff = alternative.scores.overallScore - originalProduct.scores.overallScore;
  const normalizedDiff = Math.min(scoreDiff / 50, 1); // Normaliser sur 50 pts max
  score += normalizedDiff * CONFIG.WEIGHT_SCORE_DIFF * 100;
  
  return Math.round(score);
}

/**
 * ✨ NOUVEAU V3.2 : Recherche par taxonomie (subcategory exact match)
 * PRIORITÉ 1 : Match exact sous-catégorie (ex: pâtes-à-tartiner → pâtes-à-tartiner)
 */
async function searchDatabaseTaxonomy(product, minScore) {
  try {
    // Vérifier si subcategory existe
    if (!product.subcategory) {
      logger.info('[ALTERNATIVES] Pas de subcategory → skip recherche taxonomy');
      return [];
    }

    logger.info(`[ALTERNATIVES] Stratégie : Taxonomy Match (subcategory: "${product.subcategory}")`);

    const query = {
      $and: [
        { barcode: { $ne: product.barcode } },
        { categoryType: product.categoryType },
        { subcategory: product.subcategory }, // ✨ Match exact
        { 'scores.overallScore': { 
$gte: minScore } }
      ]
    };

    const candidates = await Product.find(query)
      .select('barcode name scores categoryType subcategory tags')
      .sort({ 'scores.overallScore': -1 })
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
    return { alternatives: [], source: 'error' };
  }
}

/**
 * ✨ NOUVEAU V3.2 : Recherche par tags (intersection)
 * PRIORITÉ 2 : Match si ≥2 tags communs
 */
async function searchDatabaseTags(product, minScore) {
  try {
    // Vérifier si tags existent
    if (!product.tags || product.tags.length === 0) {
      logger.info('[ALTERNATIVES] Pas de tags → skip recherche tags');
      return [];
    }

    logger.info(`[ALTERNATIVES] Stratégie : Tags Match (${product.tags.length} tags)`);

    // Construire query : categoryType + au moins 2 tags communs
    const query = {
      $and: [
        { barcode: { $ne: product.barcode } },
        { categoryType: product.categoryType },
        { 'scores.overallScore': { 
$gte: minScore } },
        {
          tags: {
            $in: product.tags // Au moins 1 tag en commun
          }
        }
      ]
    };

    const candidates = await Product.find(query)
      .select('barcode name scores categoryType subcategory tags')
      .sort({ 'scores.overallScore': -1 })
      .limit(50) // Plus large pour inclure purées noisettes
      .maxTimeMS(CONFIG.TIMEOUT_DB_RELAXED)
      .lean();

    logger.info(`[ALTERNATIVES] Tags Match : ${candidates.length} candidats bruts`);

    // Filtrage : garder uniquement si ≥2 tags communs
    const filtered = candidates.filter(candidate => {
      if (!candidate.tags || candidate.tags.length === 0) return false;
      const commonTags = product.tags.filter(tag => candidate.tags.includes(tag));
      return commonTags.length >= 2; // Filtre ≥2 tags communs
    });

    logger.info(`[ALTERNATIVES] Tags Match : ${filtered.length} après filtre (≥2 tags communs)`);

    if (filtered.length > 0) {
      logger.info('[ALTERNATIVES] ✅ Tags Match réussi → Alternatives avec tags similaires');
    }

    return filtered.slice(0, 10); // Top 10

  } catch (error) {
    logger.error(`[ALTERNATIVES] Erreur Tags Match : ${error.message}`);
    return { alternatives: [], source: 'error' };
  }
}

/**
 * Recherche DB Smart : par mots-clés + filtres stricts
 */
async function searchDatabaseSmart(product, keywords, minScore) {
  try {
    logger.info('[ALTERNATIVES] Stratégie : DB Smart (mots-clés + filtres)');
    
    // Construire regex pour recherche flexible
    const keywordRegex = keywords.map(k => `(?=.*${k})`).join('');
    const searchRegex = new RegExp(keywordRegex, 'i');
    
    const query = {
      $and: [
        { barcode: { $ne: product.barcode } },
        { categoryType: product.categoryType },
        { 'scores.overallScore': { $gte: minScore } },
        {
          $or: [
            { name: searchRegex },
            { categories_tags: { $in: keywords.map(k => new RegExp(k, 'i')) } }
          ]
        }
      ]
    };
    
    const results = await Product.find(query)
      .select('barcode name scores categoryType categories_tags')
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
    return { alternatives: [], source: 'error' };
  }
}

/**
 * Recherche DB Relaxed : par catégorie uniquement
 */
async function searchDatabaseRelaxed(product, minScore) {
  try {
    logger.info('[ALTERNATIVES] Stratégie : DB Relaxed (catégorie large)');
    
    const query = {
      barcode: { $ne: product.barcode },
      categoryType: product.categoryType,
      'scores.overallScore': { $gte: minScore }
    };
    
    const results = await Product.find(query)
      .select('barcode name scores categoryType')
      .sort({ 'scores.overallScore': -1 })
      .limit(10)
      .maxTimeMS(CONFIG.TIMEOUT_DB_RELAXED)
      .lean();
    
    logger.info(`[ALTERNATIVES] DB Relaxed : ${results.length} candidats trouvés`);
    return results;
    
  } catch (error) {
    logger.error(`[ALTERNATIVES] Erreur DB Relaxed : ${error.message}`);
    return { alternatives: [], source: 'error' };
  }
}

// ================== FONCTION PRINCIPALE ==================
/**
 * Point d'entrée : Recherche alternatives mieux notées
 */
async function findAlternatives({
  product,
  minScoreImprovement = CONFIG.MIN_SCORE_IMPROVEMENT,
  maxResults = CONFIG.MAX_RESULTS
}) {
  try {
    logger.info('\n========== RECHERCHE ALTERNATIVES ==========');
    logger.info(`Produit original : ${product.name} (${product.scores.overallScore}/100)`);
    logger.info(`Amélioration minimum : +${minScoreImprovement} pts`);
    
    // ✅ CORRECTION PRINCIPALE : Garantir score minimum ABSOLU de 70 (zone verte)
    const minScore = Math.max(
      CONFIG.MIN_ABSOLUTE_SCORE, // 70 minimum (zone verte)
      product.scores.overallScore + minScoreImprovement // Amélioration vs original
    );
    
    logger.info(`Score minimum alternatives : ${minScore}/100 (zone ${minScore >= 70 ? 'VERTE ✅' : 'ORANGE ⚠️'})`);
    
    // 1. Extraire mots-clés
    const keywords = extractKeywords(product);
    
    // 2. Cascade de recherche
    let candidates = [];
    
    // ÉTAPE 1 : DB Smart
    // NOUVELLE CASCADE V3.2 : Taxonomie → Tags → Smart
    // ÉTAPE 1 : Match taxonomie exacte (même subcategory)
    candidates = await searchDatabaseTaxonomy(product, minScore);
  // ÉTAPE 2 : Match tags (≥2 tags communs) si < 3 résultats
  if (candidates.length < 3) {
      candidates = await searchDatabaseTags(product, minScore);
    }
  // ÉTAPE 3 : Recherche textuelle (fallback) si < 3 résultats
  if (candidates.length < 3) {
      candidates = await searchDatabaseSmart(product, keywords, minScore);
    }
    // ÉTAPE 2 : DB Relaxed (si pas assez de résultats)
    if (candidates.length < 3) {
      logger.info('[ALTERNATIVES] Pas assez de résultats Smart, passage en Relaxed...');
      const relaxedResults = await searchDatabaseRelaxed(product, minScore);
      candidates.push(...relaxedResults);
      
      // Dédupliquer
      candidates = Array.from(
        new Map(candidates.map(p => [p.barcode, p])).values()
      );
    }
    
    // ⚠️ FALLBACK : Si 0 résultats en zone verte, on abaisse à 60 (orange haute)
    if (candidates.length === 0 && minScore >= CONFIG.MIN_ABSOLUTE_SCORE) {
      logger.warn(`[ALTERNATIVES] ⚠️ Aucune alternative ≥${minScore}. Fallback à ${CONFIG.FALLBACK_MIN_SCORE}...`);
      
      candidates = await searchDatabaseRelaxed(product, CONFIG.FALLBACK_MIN_SCORE);
      
      if (candidates.length > 0) {
        logger.warn(`[ALTERNATIVES] Fallback réussi : ${candidates.length} alternatives en zone orange (60-69)`);
      }
    }
    
    // 3. Calculer score de pertinence
    const alternativesWithScore = candidates
      .filter(alt => alt.barcode !== product.barcode) // Exclure produit original
      .map(alt => ({
        ...alt,
        relevanceScore: calculateRelevanceScore(product, alt, keywords)
      }))
      .filter(alt => alt.relevanceScore >= CONFIG.MIN_RELEVANCE_SCORE) // Filtre seuil pertinence
      .sort((a, b) => {
        // ✅ CORRECTION TRI : Priorité au SCORE GLOBAL (pas pertinence)
        if (b.scores.overallScore !== a.scores.overallScore) {
          return b.scores.overallScore - a.scores.overallScore;
        }
        return b.relevanceScore - a.relevanceScore;
      })
      .slice(0, maxResults);
    
    logger.info(`[ALTERNATIVES] ${alternativesWithScore.length} alternatives pertinentes retournées\n`);
    
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
  CONFIG
};
