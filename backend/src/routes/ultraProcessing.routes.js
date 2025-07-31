// backend/src/routes/ultraProcessing.routes.js
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/errors');
const { Logger } = require('../utils/logger');

const logger = new Logger('UltraProcessingRoutes');

// 🔎 Liste simplifiée des procédés ultra-transformants connus
const suspiciousKeywords = [
  'extrusion',
  'hydrogénation',
  'hydrogéné',
  'maltodextrine',
  'arôme artificiel',
  'arôme',
  'émulsifiant',
  'emulsifiant',
  'correcteur d\'acidité',
  'colorant',
  'édulcorant',
  'edulcorant',
  'gomme xanthane',
  'monoglycéride',
  'diglycéride',
  'conservateur',
  'antioxydant',
  'stabilisant',
  'épaississant',
  'exhausteur de goût',
  'anti-agglomérant',
  'agent de texture',
  'sirop de glucose',
  'sirop de fructose',
  'amidon modifié',
  'protéine hydrolysée',
  'huile hydrogénée',
  'huile partiellement hydrogénée',
  'isolat de protéine',
  'caséinate',
  'dextrose',
  'fructose',
  'glucose',
  'sirop de maïs',
  'lécithine',
  'carraghénane',
  'gélifiant',
  'acidifiant'
];

// Patterns pour détecter les additifs E-numbers
const eNumberPattern = /\bE\d{3,4}\b/gi;

/**
 * 🔬 Analyse IA ultra-transformation
 */
const detectUltraTransformation = (ingredients) => {
  const found = [];
  const eNumbers = [];
  
  // Convertir en tableau si c'est une string
  const ingredientsList = Array.isArray(ingredients) 
    ? ingredients 
    : ingredients.split(',').map(i => i.trim());

  for (const ingredient of ingredientsList) {
    const lowerIngredient = ingredient.toLowerCase();
    
    // Détecter les mots-clés suspects
    for (const keyword of suspiciousKeywords) {
      if (lowerIngredient.includes(keyword) && !found.includes(keyword)) {
        found.push(keyword);
      }
    }
    
    // Détecter les E-numbers
    const matches = ingredient.match(eNumberPattern);
    if (matches) {
      eNumbers.push(...matches.filter(e => !eNumbers.includes(e)));
    }
  }

  // Calcul du score et du niveau
  const totalSuspicious = found.length + eNumbers.length;
  let level = 'minimal';
  let score = 0;

  if (totalSuspicious === 0) {
    level = 'minimal';
    score = 0;
  } else if (totalSuspicious === 1) {
    level = 'léger';
    score = 25;
  } else if (totalSuspicious === 2) {
    level = 'modéré';
    score = 50;
  } else if (totalSuspicious <= 4) {
    level = 'élevé';
    score = 75;
  } else {
    level = 'sévère';
    score = 90;
  }

  // Recommandations basées sur le niveau
  const recommendations = {
    minimal: "Excellent ! Ce produit semble peu ou pas transformé.",
    léger: "Produit légèrement transformé, consommation occasionnelle recommandée.",
    modéré: "Produit transformé, à consommer avec modération.",
    élevé: "Produit hautement transformé, privilégier des alternatives plus naturelles.",
    sévère: "Produit ultra-transformé, éviter la consommation régulière."
  };

  return {
    level,
    score,
    detected: found,
    eNumbers,
    totalMarkers: totalSuspicious,
    recommendation: recommendations[level],
    justification: `Analyse des ingrédients : ${found.length} procédé(s) suspect(s) et ${eNumbers.length} additif(s) détecté(s)`
  };
};

// POST /api/ultra-processing/analyze - Analyser l'ultra-transformation
router.post('/analyze', asyncHandler(async (req, res) => {
  const { product, ingredients, name } = req.body;
  
  logger.info('Ultra-processing analysis request', { name: name || product?.title });

  // Validation des données
  const productName = name || product?.title || product?.name || 'Produit inconnu';
  const ingredientsList = ingredients || product?.ingredients;
  
  if (!ingredientsList) {
    return res.status(400).json({ 
      success: false, 
      error: 'Ingredients list is required',
      message: 'Veuillez fournir la liste des ingrédients'
    });
  }

  // Analyse
  const result = detectUltraTransformation(ingredientsList);
  
  logger.info('Ultra-processing analysis completed', { 
    productName,
    level: result.level,
    score: result.score 
  });

  return res.json({
    success: true,
    product: productName,
    ultraProcessing: result,
    sources: [
      'Monteiro et al. NOVA Classification 2019',
      'EFSA Guidelines on Food Additives 2021',
      'INSERM - Ultra-processed Foods Study 2024',
      'ANSES - Food Processing Report 2022'
    ],
    metadata: {
      analyzedAt: new Date(),
      version: '1.0'
    }
  });
}));

// GET /api/ultra-processing/check/:barcode - Vérifier par code-barres
router.get('/check/:barcode', asyncHandler(async (req, res) => {
  const { barcode } = req.params;
  
  logger.info('Ultra-processing check by barcode', { barcode });
  
  // TODO: Intégrer avec la base de données des produits
  // Pour l'instant, retourner une réponse mock
  
  res.json({
    success: true,
    barcode,
    message: 'Feature coming soon - barcode lookup for ultra-processing analysis'
  });
}));

// GET /api/ultra-processing/additives - Liste des additifs suspects
router.get('/additives', (req, res) => {
  const dangerousAdditives = {
    colorants: {
      'E102': 'Tartrazine - Colorant jaune, peut causer hyperactivité',
      'E110': 'Sunset Yellow - Colorant orange, allergène potentiel',
      'E122': 'Azorubine - Colorant rouge, interdit dans certains pays',
      'E124': 'Ponceau 4R - Colorant rouge, peut causer hyperactivité',
      'E129': 'Allura Red - Colorant rouge, allergène potentiel'
    },
    conservateurs: {
      'E211': 'Benzoate de sodium - Conservateur, peut former du benzène',
      'E220': 'Dioxyde de soufre - Conservateur, allergène majeur',
      'E250': 'Nitrite de sodium - Conservateur, potentiellement cancérigène',
      'E320': 'BHA - Antioxydant, perturbateur endocrinien suspecté',
      'E321': 'BHT - Antioxydant, perturbateur endocrinien suspecté'
    },
    édulcorants: {
      'E951': 'Aspartame - Édulcorant artificiel controversé',
      'E952': 'Cyclamate - Édulcorant interdit aux USA',
      'E954': 'Saccharine - Édulcorant artificiel',
      'E955': 'Sucralose - Édulcorant artificiel'
    },
    autres: {
      'E621': 'Glutamate monosodique - Exhausteur de goût',
      'E150d': 'Caramel au sulfite d\'ammonium - Colorant',
      'E471': 'Mono- et diglycérides - Émulsifiant'
    }
  };
  
  res.json({
    success: true,
    additives: dangerousAdditives,
    totalCount: Object.values(dangerousAdditives).reduce((acc, cat) => acc + Object.keys(cat).length, 0),
    keywords: suspiciousKeywords
  });
});

// GET /api/ultra-processing/stats - Statistiques globales
router.get('/stats', asyncHandler(async (req, res) => {
  // TODO: Implémenter les vraies statistiques depuis la DB
  
  const mockStats = {
    totalAnalyzed: 15234,
    distribution: {
      minimal: 12,
      léger: 18,
      modéré: 35,
      élevé: 25,
      sévère: 10
    },
    topAdditives: [
      { code: 'E330', name: 'Acide citrique', count: 3421 },
      { code: 'E322', name: 'Lécithines', count: 2987 },
      { code: 'E471', name: 'Mono- et diglycérides', count: 2341 }
    ],
    averageScore: 52.3
  };
  
  res.json({
    success: true,
    stats: mockStats,
    lastUpdated: new Date()
  });
}));

module.exports = router;