/**
 * ECOLOJIA - SERVICE DE CLASSIFICATION PAR MOTS-CLES
 * @version 2.1.0 - Exclusions contextuelles anti faux-positifs
 */

const logger = require('../utils/logger');

// REGLES avec excludeIf : si un mot d'exclusion est present, on skip la regle
const CLASSIFICATION_RULES = [
  // ===== PLATS PREPARES (PRIORITE MAX - avant riz/legumes/dairy) =====
  {
    subcategory: 'ready-meal',
    keywords: ['pizza', 'lasagne plat', 'hachis parmentier', 'parmentier',
      'blanquette', 'couscous', 'tajine', 'paella', 'cassoulet',
      'chili con carne', 'chili sin carne', 'bolognaise', 'carbonara',
      'quiche', 'tarte salee', 'wrap', 'sandwich', 'burger',
      'nuggets', 'cordon bleu', 'tiefkuhlpizza', 'fertiggericht',
      'buddha bowl', 'dal makhani', 'tikka', 'tandoori',
      'poulet roti', 'saute de veau', 'filet de saumon',
      'filet de cabillaud', 'colin d alaska', 'merlu blanc',
      'saucisses de toulouse', 'boulettes', 'galettes au sarrasin',
      'pasta box'],
    excludeIf: []
  },

  // EAU
  {
    subcategory: 'water',
    keywords: ['eau minerale', 'eau de source', 'eau gazeuse', 'eau plate',
      'mineral water', 'sparkling water', 'spring water', 'still water',
      'mineralwasser', 'sprudelwasser', 'stilles wasser', 'tafelwasser',
      'evian', 'vittel', 'volvic', 'cristalline', 'hepar', 'contrex',
      'perrier', 'badoit', 'san pellegrino', 'gerolsteiner',
      'agua mineral', 'agua con gas', 'agua sin gas', 'agua de manantial'],
    excludeIf: []
  },

  // LAIT (exclure si "chocolat au lait", "pain au lait", etc.)
  {
    subcategory: 'milk',
    keywords: ['lait entier', 'lait demi ecreme', 'lait ecreme',
      'lait bio', 'lait frais', 'lait uht', 'lait cru', 'lait de vache',
      'lait de chevre', 'lait de brebis',
      'whole milk', 'skimmed milk', 'semi skimmed', 'full fat milk',
      'vollmilch', 'h milch', 'frischmilch', 'fettarme milch',
      'halbfettmilch', 'magermilch', 'bio milch', 'weidemilch',
      'buttermilch', 'buttermilk', 'lait battu', 'lait ribot',
      'lait fermente', 'kefir',
      'leche entera', 'leche desnatada', 'leche semidesnatada', 'leche bio',
      'leite inteiro', 'leite magro', 'leite meio gordo'],
    excludeIf: ['pain au']
  },

  // JUS DE FRUITS (avant beverage)
  {
    subcategory: 'juice',
    keywords: ['jus de fruits', 'jus d orange', 'jus de pomme', 'jus de raisin',
      'jus multifruits', 'jus de tomate', 'jus de legumes', 'nectar',
      'smoothie', 'fruit juice', 'orange juice', 'apple juice',
      'fruchtsaft', 'orangensaft', 'apfelsaft', 'multivitaminsaft',
      'innocent', 'tropicana', 'joker', 'pressade',
      'zumo de naranja', 'zumo de manzana', 'zumo de frutas',
      'suco de laranja', 'suco de maca', 'suco de frutas', 'sumo de laranja'],
    excludeIf: []
  },

  // PATES A TARTINER CHOCOLATEES
  {
    subcategory: 'chocolate-spread',
    keywords: ['pate a tartiner chocolat', 'pate a tartiner noisette',
      'pate a tartiner noisettes', 'pate a tartiner cacao',
      'pate a tartiner bio', 'pate a tartiner amandes',
      'nutella', 'nocciolata', 'ovomaltine tartiner',
      'chocolate spread', 'hazelnut spread', 'schokocreme',
      'nuss nougat creme', 'nuss nougat', 'nugat creme'],
    excludeIf: []
  },

  // HUILES (normalise sans accents)
  {
    subcategory: 'oil',
    keywords: ['huile olive', 'huile d olive', 'huile tournesol', 'huile colza',
      'huile arachide', 'huile noix', 'huile sesame', 'huile coco',
      'huile vegetale', 'olivenol', 'sonnenblumenol', 'rapsl',
      'olive oil', 'sunflower oil', 'coconut oil'],
    excludeIf: []
  },

  // PATES
  {
    subcategory: 'pasta',
    keywords: ['tagliatelle', 'tagliatelles', 'spaghetti', 'penne', 'fusilli',
      'farfalle', 'rigatoni', 'linguine', 'fettuccine', 'lasagne', 'lasagnes',
      'cannelloni', 'macaroni', 'coquillettes', 'coquillette', 'tortellini',
      'ravioli', 'gnocchi', 'pates', 'pasta', 'nouilles', 'vermicelle',
      'mafalda', 'bucatini', 'pappardelle', 'orzo', 'nudeln', 'spaetzle',
      'fideos', 'macarrones', 'massa', 'massas'],
    excludeIf: ['sauce', 'poulet', 'saumon', 'boeuf', 'veau', 'box']
  },

  // BISCUITS (palmier retire, biskream ajoute)
  {
    subcategory: 'biscuit',
    keywords: ['biscuit', 'biscuits', 'cookie', 'cookies', 'prince', 'oreo',
      'petit beurre', 'sable', 'sables', 'speculoos', 'galette bretonne',
      'gaufrette', 'gaufrettes', 'barquette', 'madeleines', 'madeleine',
      'financier', 'brownie', 'brownies', 'biskream', 'keks', 'butterkeks',
      'doppelkeks', 'digestive', 'shortbread', 'weetabix', 'wheat bisks',
      'galleta', 'galletas', 'bolacha', 'bolachas', 'biscoito', 'biscoitos'],
    excludeIf: ['palmier', 'galettes de riz', 'galettes au sarrasin', 'coeur']
  },

  // CEREALES PETIT-DEJEUNER
  {
    subcategory: 'cereal',
    keywords: ['cereales', 'cereal', 'muesli', 'musli', 'granola', 'corn flakes',
      'flocons', 'avoine', 'porridge', 'chocapic', 'special k', 'fitness',
      'cheerios', 'frosties', 'lion cereales', 'haferflocken', 'crunchy',
      'cruesli', 'country crisp', 'krounchy', 'all bran', 'bran flakes',
      'rice krispies', 'coco pops', 'tresor',
      'cereales desayuno', 'copos de avena', 'aveia', 'flocos de aveia'],
    excludeIf: []
  },

  // PATES A TARTINER GENERIQUES (confiture, miel, beurre cacahuete)
  {
    subcategory: 'spread',
    keywords: ['confiture', 'confitures', 'marmelade', 'marmalade',
      'beurre de cacahuete', 'beurre cacahuete', 'peanut butter',
      'erdnussmus', 'erdnussbutter', 'jam', 'sirop erable', 'maple syrup',
      'creme de marron',
      'mermelada', 'mermelada de fresa', 'mantequilla de cacahuete',
      'geleia', 'geleia de morango', 'manteiga de amendoim', 'doce de leite'],
    excludeIf: []
  },

  // MIEL (separe de spread pour eviter faux positifs cereales)
  {
    subcategory: 'spread',
    keywords: ['miel de fleurs', 'miel liquide', 'miel d acacia', 'miel bio',
      'miel l apiculteur', 'manuka honey', 'blossom honey', 'runny honey',
      'raw honey', 'honig', 'multifloral honey'],
    excludeIf: ['cereales', 'muesli', 'granola', 'cruesli', 'crunchy', 'croustillant']
  },

  // CHOCOLAT EN TABLETTE
  {
    subcategory: 'chocolate-bar',
    keywords: ['tablette chocolat', 'tablette de chocolat', 'chocolat noir',
      'chocolat blanc', 'tafel schokolade', 'dark chocolate',
      'bonbon chocolat', 'kinder', 'lindt', 'cote dor', 'milka tablette',
      'rocher suchard', 'truffe chocolat', 'ferrero'],
    excludeIf: ['tartiner', 'cereales', 'muesli', 'granola', 'pate a',
      'country crisp', 'spread', 'creme', 'lait']
  },

  // PRODUITS LAITIERS (yaourts, fromages)
  {
    subcategory: 'dairy',
    keywords: ['yaourt', 'yogourt', 'yogurt', 'joghurt', 'fromage blanc',
      'petit suisse', 'fromage', 'camembert', 'brie', 'gruyere', 'comte',
      'roquefort', 'mozzarella', 'creme fraiche', 'creme dessert', 'flan',
      'danette', 'activia', 'danone', 'skyr', 'quark', 'frischkase',
      'kase', 'cheese',
      'yogur', 'queso', 'nata', 'cuajada',
      'iogurte', 'queijo', 'requeijao', 'natas'],
    excludeIf: ['pizza', 'galette', 'quiche', 'sandwich', 'burger',
      'poulet', 'saumon', 'quinotto', 'risotto', 'gratin']
  },

  // LEGUMINEUSES
  {
    subcategory: 'legumes',
    keywords: ['lentilles', 'lentille', 'pois chiches', 'pois chiche',
      'flageolet', 'feves', 'feve', 'edamame', 'lupin', 'pois casses',
      'linsen', 'kichererbsen', 'chickpeas', 'lentils'],
    excludeIf: ['poulet', 'saumon', 'saucisse', 'petit sale', 'cassoulet',
      'curry', 'dal', 'saute', 'boeuf']
  },

  // PAIN & BOULANGERIE
  {
    subcategory: 'bread',
    keywords: ['pain complet', 'pain de mie', 'pain cereales', 'pain grille',
      'baguette', 'brioche', 'croissant', 'biscottes', 'cracotte', 'wasa',
      'brot', 'vollkornbrot', 'toastbrot', 'bread', 'pain bio', 'pain au lait', 'pain au chocolat', 'pain aux raisins',
      'pan de molde', 'pan integral', 'pan de centeno', 'pao de forma', 'pao integral'],
    excludeIf: []
  },

  // RIZ (produit sec uniquement, pas les plats)
  {
    subcategory: 'rice',
    keywords: ['riz basmati', 'riz complet', 'riz thai', 'riz long', 'riz rond',
      'riz arborio', 'riz jasmin', 'galette de riz', 'galettes de riz',
      'reiswaffel', 'rice cake', 'reis waffeln',
      'arroz basmati', 'arroz integral', 'arroz largo', 'arroz redondo',
      'tortitas de arroz'],
    excludeIf: ['poulet', 'saumon', 'boeuf', 'veau', 'canard', 'cabillaud',
      'colin', 'merlu', 'curry', 'chili', 'blanquette', 'butter chicken',
      'filet', 'saute', 'pilaf', 'cantonais', 'poule au']
  },

  // BOISSONS (soda, the, cafe)
  {
    subcategory: 'beverage',
    keywords: ['soda', 'coca cola', 'pepsi', 'orangina', 'limonade',
      'the glace', 'ice tea', 'energy drink', 'red bull', 'monster energy',
      'fanta', 'sprite', 'schweppes', 'tonic', 'fritz kola',
      'refresco', 'gaseosa', 'te helado', 'bebida energetica',
      'refrigerante', 'cha gelado', 'bebida energetica'],
    excludeIf: []
  },

  // SNACKS SALES
  {
    subcategory: 'snack-salty',
    keywords: ['chips', 'cacahuetes', 'pistaches', 'noix de cajou',
      'amandes salees', 'bretzel', 'bretzels', 'crackers sales',
      'biscuits aperitif', 'tucs', 'curly', 'monster munch',
      'pringles', 'lays', 'doritos',
      'patatas fritas', 'pistachos', 'anacardos',
      'batatas fritas', 'pistachios', 'castanha de caju'],
    excludeIf: []
  },

  // SNACKS SUCRES (caramel retire car trop large)
  {
    subcategory: 'snack-sweet',
    keywords: ['bonbons', 'bonbon', 'haribo', 'carambar', 'reglisse',
      'chewing gum', 'mentos', 'tic tac', 'sucette', 'nougat',
      'guimauve', 'marshmallow', 'dragees', 'gummibarchen', 'weingummi',
      'caramelos', 'gominolas', 'chicle',
      'balas', 'gomas', 'chicletes'],
    excludeIf: []
  },

  // CONSERVES LEGUMES
  {
    subcategory: 'canned-vegetables',
    keywords: ['petits pois', 'haricots verts', 'tomates pelees',
      'champignons conserve', 'macedoine', 'ratatouille',
      'coeurs de palmier', 'palmier bio', 'mais doux'],
    excludeIf: []
  },

  // SAUCES
  {
    subcategory: 'sauce',
    keywords: ['ketchup', 'mayonnaise', 'moutarde', 'sauce tomate',
      'sauce soja', 'vinaigrette', 'sauce barbecue', 'sauce burger',
      'sauce salade', 'pesto', 'sauce bolognaise', 'senf', 'mustard',
      'salsa de tomate', 'mostaza', 'mayonesa',
      'molho de tomate', 'mostarda', 'maionese'],
    excludeIf: []
  }
];

function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function classifyProduct(product) {
  const name = normalizeText(product.name || '');
  const categories = normalizeText((product.categories_tags || []).join(' '));
  const searchText = name + ' ' + categories;

  for (const rule of CLASSIFICATION_RULES) {
    // Verifier exclusions d'abord
    if (rule.excludeIf && rule.excludeIf.length > 0) {
      const excluded = rule.excludeIf.some(function(ex) {
        return searchText.indexOf(normalizeText(ex)) !== -1;
      });
      if (excluded) continue;
    }

    for (const keyword of rule.keywords) {
      const normalizedKeyword = normalizeText(keyword);
      var regex = new RegExp('(^|\\s)' + normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(s|es)?($|\\s)', 'i');

      if (regex.test(searchText)) {
        logger.info('[CLASSIFIER] "' + (product.name || '') + '" -> ' + rule.subcategory + ' (match: "' + keyword + '")');
        return {
          subcategory: rule.subcategory,
          confidence: 0.9,
          matchedKeyword: keyword,
          source: 'rule-based'
        };
      }
    }
  }

  logger.warn('[CLASSIFIER] "' + (product.name || '') + '" -> other (aucun match)');
  return {
    subcategory: 'other',
    confidence: 0.3,
    matchedKeyword: null,
    source: 'default'
  };
}

function classifyAndUpdate(product) {
  var result = classifyProduct(product);
  return {
    ...product,
    subcategory: result.subcategory,
    classificationConfidence: result.confidence,
    classificationSource: result.source,
    classificationKeyword: result.matchedKeyword
  };
}

function generateTags(subcategory) {
  var baseTags = {
    'water': ['water', 'drink', 'hydration', 'base'],
    'milk': ['milk', 'dairy', 'protein', 'calcium', 'base'],
    'juice': ['juice', 'drink', 'fruit', 'vitamins'],
    'chocolate-spread': ['spread', 'chocolate', 'sweet', 'breakfast'],
    'oil': ['oil', 'fat', 'cooking'],
    'pasta': ['pasta', 'carbs', 'italian', 'staple'],
    'biscuit': ['biscuit', 'sweet', 'snack', 'breakfast'],
    'cereal': ['cereal', 'breakfast', 'grains'],
    'spread': ['spread', 'breakfast', 'sweet'],
    'chocolate-bar': ['chocolate', 'sweet', 'snack'],
    'dairy': ['dairy', 'protein', 'calcium'],
    'legumes': ['legumes', 'protein', 'fiber', 'plant-based'],
    'bread': ['bread', 'carbs', 'staple', 'bakery'],
    'rice': ['rice', 'carbs', 'staple', 'grains'],
    'beverage': ['beverage', 'drink'],
    'snack-salty': ['snack', 'salty', 'aperitif'],
    'snack-sweet': ['snack', 'sweet', 'candy'],
    'ready-meal': ['ready-meal', 'convenience', 'prepared'],
    'canned-vegetables': ['vegetables', 'canned', 'preserved'],
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

