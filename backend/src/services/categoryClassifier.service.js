/**
 * ECOLOJIA - SERVICE DE CLASSIFICATION PAR MOTS-CLES
 * Classification deterministe sans IA
 * @version 1.0.0
 */

const logger = require('../utils/logger');

// REGLES DE CLASSIFICATION (ordre = priorite)
const CLASSIFICATION_RULES = [
  // PATES
  {
    subcategory: 'pasta',
    keywords: ['tagliatelle', 'tagliatelles', 'spaghetti', 'penne', 'fusilli', 'farfalle', 'rigatoni', 'linguine', 'fettuccine', 'lasagne', 'lasagnes', 'cannelloni', 'macaroni', 'coquillettes', 'coquillette', 'tortellini', 'ravioli', 'gnocchi', 'pates', 'pasta', 'nouilles', 'vermicelle', 'mafalda', 'bucatini', 'pappardelle', 'orzo']
  },
  // BISCUITS
  {
    subcategory: 'biscuit',
    keywords: ['biscuit', 'biscuits', 'cookie', 'cookies', 'prince', 'oreo', 'petit-beurre', 'petit beurre', 'sable', 'sables', 'galette', 'galettes', 'speculoos', 'palmier', 'granola', 'crackers', 'cracker', 'gaufrette', 'gaufrettes', 'barquette', 'madeleines', 'madeleine', 'financier', 'brownie', 'brownies']
  },
  // CEREALES PETIT-DEJEUNER
  {
    subcategory: 'cereal',
    keywords: ['cereales', 'cereal', 'muesli', 'granola', 'corn flakes', 'flocons', 'avoine', 'porridge', 'chocapic', 'nesquik cereales', 'special k', 'fitness', 'cheerios', 'frosties', 'lion cereales']
  },
  // PATES A TARTINER
  {
    subcategory: 'spread',
    keywords: ['pate a tartiner', 'tartiner', 'nutella', 'spread', 'confiture', 'confitures', 'marmelade', 'miel', 'beurre de cacahuete', 'beurre cacahuete', 'praline', 'chocolat a tartiner']
  },
  // CHOCOLAT
  {
    subcategory: 'chocolate',
    keywords: ['chocolat noir', 'chocolat lait', 'chocolat blanc', 'tablette chocolat', 'tablette de chocolat', 'praline', 'truffe', 'rocher', 'bonbon chocolat', 'kinder', 'lindt', 'cote dor', 'milka tablette']
  },
  // PRODUITS LAITIERS
  {
    subcategory: 'dairy',
    keywords: ['yaourt', 'yogourt', 'fromage blanc', 'petit suisse', 'fromage', 'camembert', 'brie', 'emmental', 'gruyere', 'comte', 'roquefort', 'chevre', 'mozzarella', 'parmesan', 'creme fraiche', 'creme dessert', 'flan', 'danette', 'activia', 'danone']
  },
  // LEGUMINEUSES
  {
    subcategory: 'legumes',
    keywords: ['lentilles', 'lentille', 'pois chiches', 'pois chiche', 'haricots', 'haricot', 'flageolet', 'feves', 'feve', 'soja', 'edamame', 'lupin', 'pois casses']
  },
  // PAIN & BOULANGERIE
  {
    subcategory: 'bread',
    keywords: ['pain', 'baguette', 'brioche', 'croissant', 'pain de mie', 'pain complet', 'pain cereales', 'toast', 'biscottes', 'cracotte', 'wasa', 'pain grille']
  },
  // RIZ
  {
    subcategory: 'rice',
    keywords: ['riz', 'rice', 'basmati', 'jasmin', 'riz complet', 'riz thai', 'risotto', 'riz arborio', 'riz long', 'riz rond']
  },
  // BOISSONS
  {
    subcategory: 'beverage',
    keywords: ['jus', 'juice', 'soda', 'coca', 'pepsi', 'orangina', 'limonade', 'eau minerale', 'eau gazeuse', 'the glace', 'ice tea', 'smoothie', 'nectar', 'sirop']
  },
  // SNACKS SALES
  {
    subcategory: 'snack-salty',
    keywords: ['chips', 'cacahuetes', 'pistaches', 'noix de cajou', 'amandes salees', 'bretzel', 'bretzels', 'crackers sales', 'biscuits aperitif', 'tucs', 'curly', 'monster munch', 'pringles', 'lays', 'doritos']
  },
  // SNACKS SUCRES
  {
    subcategory: 'snack-sweet',
    keywords: ['bonbons', 'bonbon', 'haribo', 'carambar', 'caramel', 'reglisse', 'chewing-gum', 'mentos', 'tic tac', 'sucette', 'nougat', 'guimauve', 'marshmallow', 'dragees']
  },
  // PLATS PREPARES
  {
    subcategory: 'ready-meal',
    keywords: ['pizza', 'lasagne plat', 'hachis parmentier', 'blanquette', 'couscous plat', 'tajine', 'paella', 'cassoulet', 'chili con carne', 'bolognaise', 'carbonara', 'quiche', 'tarte salee', 'wrap', 'sandwich', 'burger', 'nuggets', 'cordon bleu']
  },
  // CONSERVES LEGUMES
  {
    subcategory: 'canned-vegetables',
    keywords: ['petits pois', 'haricots verts', 'mais', 'tomates pelees', 'champignons', 'carottes conserve', 'macedoine', 'ratatouille']
  },
  // HUILES
  {
    subcategory: 'oil',
    keywords: ['huile olive', 'huile tournesol', 'huile colza', 'huile arachide', 'huile noix', 'huile sesame', 'huile coco', 'huile vegetale']
  },
  // SAUCES
  {
    subcategory: 'sauce',
    keywords: ['ketchup', 'mayonnaise', 'moutarde', 'sauce tomate', 'sauce soja', 'vinaigrette', 'sauce barbecue', 'sauce burger', 'sauce salade', 'pesto', 'sauce bolognaise']
  }
];

/**
 * Normalise un texte pour la comparaison
 */
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever accents
    .replace(/[^a-z0-9\s]/g, ' ')    // Garder alphanumerique
    .replace(/\s+/g, ' ')            // Espaces multiples
    .trim();
}

/**
 * Classifie un produit par son nom
 * @param {Object} product - Produit avec name, ingredients_text, categories_tags
 * @returns {Object} { subcategory, confidence, matchedKeyword }
 */
function classifyProduct(product) {
  const name = normalizeText(product.name || '');
  const ingredients = normalizeText(product.ingredients_text || '');
  const categories = normalizeText((product.categories_tags || []).join(' '));
  
  // Texte combine pour recherche
  const searchText = `${name} ${categories}`;
  
  for (const rule of CLASSIFICATION_RULES) {
    for (const keyword of rule.keywords) {
      const normalizedKeyword = normalizeText(keyword);
      
      // Match exact ou au debut/fin de mot
      const regex = new RegExp(`(^|\\s)${normalizedKeyword}(s|es)?($|\\s)`, 'i');
      
      if (regex.test(searchText)) {
        logger.info(`[CLASSIFIER] "${product.name}" -> ${rule.subcategory} (match: "${keyword}")`);
        return {
          subcategory: rule.subcategory,
          confidence: 0.9,
          matchedKeyword: keyword,
          source: 'rule-based'
        };
      }
    }
  }
  
  // Pas de match - retourner 'other'
  logger.warn(`[CLASSIFIER] "${product.name}" -> other (aucun match)`);
  return {
    subcategory: 'other',
    confidence: 0.3,
    matchedKeyword: null,
    source: 'default'
  };
}

/**
 * Classifie et met a jour un produit
 * @param {Object} product - Document MongoDB
 * @returns {Object} Produit avec subcategory corrigee
 */
function classifyAndUpdate(product) {
  const result = classifyProduct(product);
  
  return {
    ...product,
    subcategory: result.subcategory,
    classificationConfidence: result.confidence,
    classificationSource: result.source,
    classificationKeyword: result.matchedKeyword
  };
}

/**
 * Genere les tags pertinents basés sur la subcategory
 */
function generateTags(subcategory, productName) {
  const baseTags = {
    'pasta': ['pasta', 'carbs', 'italian', 'staple'],
    'biscuit': ['biscuit', 'sweet', 'snack', 'breakfast'],
    'cereal': ['cereal', 'breakfast', 'grains'],
    'spread': ['spread', 'breakfast', 'sweet'],
    'chocolate': ['chocolate', 'sweet', 'snack'],
    'dairy': ['dairy', 'protein', 'calcium'],
    'legumes': ['legumes', 'protein', 'fiber', 'plant-based'],
    'bread': ['bread', 'carbs', 'staple', 'bakery'],
    'rice': ['rice', 'carbs', 'staple', 'grains'],
    'beverage': ['beverage', 'drink'],
    'snack-salty': ['snack', 'salty', 'aperitif'],
    'snack-sweet': ['snack', 'sweet', 'candy'],
    'ready-meal': ['ready-meal', 'convenience', 'prepared'],
    'canned-vegetables': ['vegetables', 'canned', 'preserved'],
    'oil': ['oil', 'fat', 'cooking'],
    'sauce': ['sauce', 'condiment', 'seasoning'],
    'other': ['food']
  };
  
  return baseTags[subcategory] || ['food'];
}

module.exports = {
  classifyProduct,
  classifyAndUpdate,
  generateTags,
  normalizeText,
  CLASSIFICATION_RULES
};
