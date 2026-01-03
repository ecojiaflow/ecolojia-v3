/**
 * ECOLOJIA — Search Service V1.0.0
 * Service de recherche MongoDB optimise
 * @version 1.0.0
 * @date 2026-01-03
 */

const Product = require('../models/Product');

const SEARCH_CONFIG = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 50,
  MIN_QUERY_LENGTH: 2,
  TIMEOUT_MS: 5000
};

const SEARCH_PROJECTION = {
  _id: 1,
  barcode: 1,
  name: 1,
  brand: 1,
  categoryType: 1,
  subcategory: 1,
  'images.front': 1,
  imageUrl: 1,
  'scores.overall': 1,
  'constitution.healthReflex.level': 1,
  'constitution.healthReflex.levelLabel': 1
};

async function searchProducts(query, options = {}) {
  const {
    limit = SEARCH_CONFIG.DEFAULT_LIMIT,
    skip = 0,
    categoryType = null,
    sortBy = 'relevance'
  } = options;

  if (!query || typeof query !== 'string') {
    return { products: [], total: 0, query: '', error: 'Query required' };
  }

  const cleanQuery = query.trim();
  
  if (cleanQuery.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
    return { 
      products: [], 
      total: 0, 
      query: cleanQuery, 
      error: 'Query must be at least ' + SEARCH_CONFIG.MIN_QUERY_LENGTH + ' characters' 
    };
  }

  const effectiveLimit = Math.min(limit, SEARCH_CONFIG.MAX_LIMIT);

  try {
    let results = await searchWithTextIndex(cleanQuery, {
      limit: effectiveLimit,
      skip,
      categoryType,
      sortBy
    });

    if (results.products.length === 0) {
      console.log('[Search] Text index returned 0 results, trying regex fallback for: "' + cleanQuery + '"');
      results = await searchWithRegex(cleanQuery, {
        limit: effectiveLimit,
        skip,
        categoryType,
        sortBy
      });
    }

    return results;

  } catch (error) {
    console.error('[Search] Error:', error.message);
    
    if (error.message.includes('text index') || error.code === 27) {
      console.log('[Search] Text index not available, using regex fallback');
      return await searchWithRegex(cleanQuery, {
        limit: effectiveLimit,
        skip,
        categoryType,
        sortBy
      });
    }

    throw error;
  }
}

async function searchWithTextIndex(query, options) {
  const { limit, skip, categoryType, sortBy } = options;

  const filter = { $text: { $search: query } };

  if (categoryType) {
    filter.categoryType = categoryType;
  }

  let sort = {};
  if (sortBy === 'relevance') {
    sort = { score: { $meta: 'textScore' } };
  } else if (sortBy === 'score') {
    sort = { 'scores.overall': -1 };
  } else if (sortBy === 'name') {
    sort = { name: 1 };
  }

  const [products, total] = await Promise.all([
    Product.find(filter, { ...SEARCH_PROJECTION, score: { $meta: 'textScore' } })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
      .maxTimeMS(SEARCH_CONFIG.TIMEOUT_MS),
    Product.countDocuments(filter).maxTimeMS(SEARCH_CONFIG.TIMEOUT_MS)
  ]);

  return {
    products: formatSearchResults(products),
    total,
    query,
    method: 'textIndex'
  };
}

async function searchWithRegex(query, options) {
  const { limit, skip, categoryType, sortBy } = options;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escapedQuery, 'i');

  const filter = {
    $or: [
      { name: regex },
      { brand: regex }
    ]
  };

  if (categoryType) {
    filter.categoryType = categoryType;
  }

  let sort = { 'scores.overall': -1 };
  if (sortBy === 'name') {
    sort = { name: 1 };
  }

  const [products, total] = await Promise.all([
    Product.find(filter, SEARCH_PROJECTION)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
      .maxTimeMS(SEARCH_CONFIG.TIMEOUT_MS),
    Product.countDocuments(filter).maxTimeMS(SEARCH_CONFIG.TIMEOUT_MS)
  ]);

  return {
    products: formatSearchResults(products),
    total,
    query,
    method: 'regex'
  };
}

async function searchByBarcode(barcode) {
  if (!barcode || typeof barcode !== 'string') {
    return null;
  }

  const cleanBarcode = barcode.trim().replace(/\D/g, '');
  
  if (cleanBarcode.length < 8) {
    return null;
  }

  const product = await Product.findOne(
    { barcode: cleanBarcode },
    SEARCH_PROJECTION
  ).lean();

  return product ? formatSearchResult(product) : null;
}

async function getSuggestions(query, limit = 10) {
  if (!query || query.length < 2) {
    return [];
  }

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp('^' + escapedQuery, 'i');

  const [nameResults, brandResults] = await Promise.all([
    Product.find({ name: regex }, { name: 1 }).limit(limit).lean(),
    Product.distinct('brand', { brand: regex })
  ]);

  const suggestions = new Set();
  
  nameResults.forEach(p => {
    if (p.name) suggestions.add(p.name);
  });
  
  brandResults.slice(0, limit).forEach(brand => {
    if (brand) suggestions.add(brand);
  });

  return Array.from(suggestions).slice(0, limit);
}

function formatSearchResults(products) {
  return products.map(formatSearchResult);
}

function formatSearchResult(product) {
  return {
    _id: product._id,
    barcode: product.barcode,
    name: product.name || 'Produit sans nom',
    brand: product.brand || '',
    categoryType: product.categoryType || 'food',
    subcategory: product.subcategory || '',
    image: product.images?.front || product.imageUrl || null,
    score: product.scores?.overall || null,
    level: product.constitution?.healthReflex?.level || null,
    levelLabel: product.constitution?.healthReflex?.levelLabel || null
  };
}

async function checkTextIndex() {
  try {
    const indexes = await Product.collection.indexes();
    const textIndex = indexes.find(idx => idx.key && idx.key._fts === 'text');
    return !!textIndex;
  } catch (error) {
    console.error('[Search] Error checking text index:', error.message);
    return false;
  }
}

async function ensureTextIndex() {
  try {
    const hasIndex = await checkTextIndex();
    
    if (!hasIndex) {
      console.log('[Search] Creating text index on name and brand...');
      await Product.collection.createIndex(
        { name: 'text', brand: 'text' },
        { 
          name: 'search_text_index',
          weights: { name: 10, brand: 5 },
          default_language: 'french'
        }
      );
      console.log('[Search] Text index created successfully');
      return true;
    }
    
    console.log('[Search] Text index already exists');
    return true;
  } catch (error) {
    console.error('[Search] Error creating text index:', error.message);
    return false;
  }
}

module.exports = {
  searchProducts,
  searchByBarcode,
  getSuggestions,
  checkTextIndex,
  ensureTextIndex,
  SEARCH_CONFIG
};
