/**
 * ============================================
 * SEARCH LAYER SERVICE - ECOLOJIA V3.1
 * ============================================
 * 
 * Service de recherche hybride intelligent :
 * - Algolia : Recherches simples (rapide)
 * - MongoDB : Recherches complexes (riche)
 * - Redis Cache : Optimisation performance
 * - Fallback automatique : Robustesse
 * 
 * @author Lead Technique Senior
 * @date 2025-12-04
 * @version 1.0.0
 */

const algoliasearch = require('algoliasearch');
const Product = require('../models/Product');

// ============================================
// CONFIGURATION
// ============================================

const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
const ALGOLIA_SEARCH_KEY = process.env.ALGOLIA_SEARCH_KEY;
const ALGOLIA_INDEX_NAME = process.env.ALGOLIA_INDEX_NAME || 'products';
const USE_ALGOLIA = process.env.MOCK_ALGOLIA !== 'true' && ALGOLIA_APP_ID && ALGOLIA_SEARCH_KEY;

// Cache simple en mémoire (Redis à implémenter si besoin)
const cache = new Map();
const CACHE_TTL = 3600000; // 1 heure

// Client Algolia (lazy loading)
let algoliaClient = null;
let algoliaIndex = null;

function getAlgoliaClient() {
  if (!algoliaClient && USE_ALGOLIA) {
    try {
      algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);
      algoliaIndex = algoliaClient.initIndex(ALGOLIA_INDEX_NAME);
      console.log('[SearchLayer] ✅ Algolia initialisé');
    } catch (error) {
      console.error('[SearchLayer] ⚠️ Algolia init échoué:', error.message);
      algoliaClient = null;
    }
  }
  return algoliaIndex;
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Génère une clé de cache unique
 */
function getCacheKey(query, filters) {
  return `search:${JSON.stringify({ query, filters })}`;
}

/**
 * Récupère depuis le cache
 */
function getFromCache(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[SearchLayer] 💾 Cache HIT: ${key.substring(0, 50)}...`);
    return cached.data;
  }
  cache.delete(key);
  return null;
}

/**
 * Sauvegarde dans le cache
 */
function saveToCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Détermine si la recherche est "simple" ou "complexe"
 */
function isSimpleSearch(filters) {
  // Simple = juste un texte, pas de filtres complexes
  const hasComplexFilters = filters.filters && Object.keys(filters.filters).length > 0;
  const hasComplexSort = filters.sort && filters.sort.length > 1;
  
  return !hasComplexFilters && !hasComplexSort;
}

/**
 * Normalise les résultats Algolia au format MongoDB
 */
function normalizeAlgoliaResults(hits) {
  return hits.map(hit => ({
    _id: hit.objectID,
    name: hit.name || hit.productName,
    productName: hit.productName || hit.name,
    barcode: hit.barcode,
    categoryType: hit.categoryType || hit.category,
    brands: hit.brands,
    scores: {
      overallScore: hit.overallScore || hit.scores?.overallScore || 0,
      healthScore: hit.healthScore || hit.scores?.healthScore,
      environmentScore: hit.environmentScore || hit.scores?.environmentScore
    },
    imageUrl: hit.imageUrl || hit.image_url,
    // Ajouter l'attribut _highlightResult si disponible
    _highlightResult: hit._highlightResult
  }));
}

// ============================================
// STRATÉGIES DE RECHERCHE
// ============================================

/**
 * Recherche via Algolia (rapide, pertinente)
 */
async function searchWithAlgolia(query, filters) {
  const index = getAlgoliaClient();
  
  if (!index) {
    throw new Error('Algolia non disponible');
  }
  
  console.log(`[SearchLayer] 🔍 Recherche Algolia: "${query}"`);
  
  const searchOptions = {
    hitsPerPage: filters.hitsPerPage || 20,
    page: filters.page || 0
  };
  
  // Filtres Algolia
  if (filters.filters) {
    const algoliaFilters = [];
    
    // Catégorie
    if (filters.filters.categoryType) {
      algoliaFilters.push(`categoryType:${filters.filters.categoryType}`);
    }
    
    // Score minimum
    if (filters.filters.minScore) {
      algoliaFilters.push(`overallScore >= ${filters.filters.minScore}`);
    }
    
    // Diet compatible (si Algolia a ce champ)
    if (filters.filters.compatibleDiets) {
      algoliaFilters.push(`compatibleDiets:${filters.filters.compatibleDiets}`);
    }
    
    if (algoliaFilters.length > 0) {
      searchOptions.filters = algoliaFilters.join(' AND ');
    }
  }
  
  // Facettes
  if (filters.facetFilters && filters.facetFilters.length > 0) {
    searchOptions.facetFilters = filters.facetFilters;
  }
  
  try {
    const result = await index.search(query, searchOptions);
    
    console.log(`[SearchLayer] ✅ Algolia: ${result.nbHits} résultats trouvés`);
    
    return {
      success: true,
      source: 'algolia',
      results: normalizeAlgoliaResults(result.hits),
      total: result.nbHits,
      page: result.page,
      nbPages: result.nbPages
    };
    
  } catch (error) {
    console.error('[SearchLayer] ❌ Erreur Algolia:', error.message);
    throw error;
  }
}

/**
 * Recherche via MongoDB (riche, flexible)
 */
async function searchWithMongoDB(query, filters) {
  console.log(`[SearchLayer] 🔍 Recherche MongoDB: "${query}"`);
  
  const mongoQuery = {};
  
  // Recherche texte (regex si pas d'index texte)
  if (query && query.trim().length > 0) {
    mongoQuery.$or = [
      { name: { $regex: query, $options: 'i' } },
      { productName: { $regex: query, $options: 'i' } },
      { brands: { $regex: query, $options: 'i' } }
    ];
  }
  
  // Filtres MongoDB
  if (filters.filters) {
    // Catégorie
    if (filters.filters.categoryType) {
      mongoQuery.categoryType = filters.filters.categoryType;
    }
    
    // Score minimum
    if (filters.filters.minScore) {
      mongoQuery['scores.overallScore'] = { $gte: filters.filters.minScore };
    }
    
    // Diet compatible
    if (filters.filters.compatibleDiets) {
      mongoQuery.compatibleDiets = filters.filters.compatibleDiets;
    }
    
    // Autres filtres
    Object.keys(filters.filters).forEach(key => {
      if (!['categoryType', 'minScore', 'compatibleDiets'].includes(key)) {
        mongoQuery[key] = filters.filters[key];
      }
    });
  }
  
  // Sort
  let sortOptions = { 'scores.overallScore': -1 };
  if (filters.sort && filters.sort.length > 0) {
    sortOptions = {};
    filters.sort.forEach(s => {
      sortOptions[s.field] = s.order === 'desc' ? -1 : 1;
    });
  }
  
  try {
    const limit = filters.hitsPerPage || 20;
    const skip = (filters.page || 0) * limit;
    
    const results = await Product.find(mongoQuery)
      .sort(sortOptions)
      .limit(limit)
      .skip(skip)
      .lean();
    
    const total = await Product.countDocuments(mongoQuery);
    
    console.log(`[SearchLayer] ✅ MongoDB: ${results.length} résultats trouvés (${total} total)`);
    
    return {
      success: true,
      source: 'mongodb',
      results,
      total,
      page: filters.page || 0,
      nbPages: Math.ceil(total / limit)
    };
    
  } catch (error) {
    console.error('[SearchLayer] ❌ Erreur MongoDB:', error.message);
    throw error;
  }
}

/**
 * Recherche fallback simple (ultra-robuste)
 */
async function searchFallback(query, filters) {
  console.log(`[SearchLayer] 🔍 Recherche Fallback: "${query}"`);
  
  try {
    const limit = filters.hitsPerPage || 20;
    
    // Recherche la plus simple possible
    const results = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { productName: { $regex: query, $options: 'i' } }
      ]
    })
      .sort({ 'scores.overallScore': -1 })
      .limit(limit)
      .lean();
    
    console.log(`[SearchLayer] ✅ Fallback: ${results.length} résultats trouvés`);
    
    return {
      success: true,
      source: 'fallback',
      results,
      total: results.length,
      page: 0,
      nbPages: 1
    };
    
  } catch (error) {
    console.error('[SearchLayer] ❌ Erreur Fallback:', error.message);
    return {
      success: false,
      source: 'fallback',
      results: [],
      total: 0,
      error: error.message
    };
  }
}

// ============================================
// FONCTION PRINCIPALE : SEARCH
// ============================================

/**
 * Recherche hybride intelligente avec cascade
 * 
 * @param {string} query - Texte de recherche
 * @param {object} filters - Filtres et options
 * @returns {Promise<object>} Résultats de recherche
 */
async function search(query, filters = {}) {
  const startTime = Date.now();
  
  console.log('\n[SearchLayer] 🚀 Nouvelle recherche');
  console.log(`  Query: "${query}"`);
  console.log(`  Filters:`, JSON.stringify(filters, null, 2));
  
  // Vérifier le cache
  const cacheKey = getCacheKey(query, filters);
  const cached = getFromCache(cacheKey);
  if (cached) {
    return {
      ...cached,
      cached: true,
      executionTime: Date.now() - startTime
    };
  }
  
  let result;
  
  try {
    // STRATÉGIE 1 : Algolia (si simple et disponible)
    if (isSimpleSearch(filters) && USE_ALGOLIA) {
      try {
        result = await searchWithAlgolia(query, filters);
      } catch (algoliaError) {
        console.warn('[SearchLayer] ⚠️ Algolia échoué, fallback MongoDB');
        result = await searchWithMongoDB(query, filters);
      }
    }
    // STRATÉGIE 2 : MongoDB (si complexe ou Algolia indisponible)
    else {
      try {
        result = await searchWithMongoDB(query, filters);
      } catch (mongoError) {
        console.warn('[SearchLayer] ⚠️ MongoDB échoué, fallback simple');
        result = await searchFallback(query, filters);
      }
    }
    
  } catch (error) {
    // Dernier fallback
    console.error('[SearchLayer] ❌ Toutes stratégies échouées, fallback ultime');
    result = await searchFallback(query, filters);
  }
  
  // Enrichir le résultat
  const executionTime = Date.now() - startTime;
  const enrichedResult = {
    ...result,
    query,
    filters,
    cached: false,
    executionTime
  };
  
  // Sauvegarder dans le cache si succès
  if (result.success) {
    saveToCache(cacheKey, enrichedResult);
  }
  
  console.log(`[SearchLayer] ✅ Recherche terminée en ${executionTime}ms (${result.source})`);
  
  return enrichedResult;
}

// ============================================
// FONCTIONS UTILITAIRES EXPORT
// ============================================

/**
 * Vide le cache (utile pour tests)
 */
function clearCache() {
  cache.clear();
  console.log('[SearchLayer] 🗑️ Cache vidé');
}

/**
 * Stats du cache
 */
function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()).slice(0, 10) // Top 10
  };
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  search,
  clearCache,
  getCacheStats,
  
  // Exports pour tests
  searchWithAlgolia,
  searchWithMongoDB,
  searchFallback,
  isSimpleSearch
};
