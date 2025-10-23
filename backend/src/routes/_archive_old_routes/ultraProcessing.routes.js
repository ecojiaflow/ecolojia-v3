// backend/src/routes/ultraProcessing.routes.js
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/errors');
const { Logger } = require('../utils/logger');

const logger = new Logger('UltraProcessingRoutes');

// Ã°Å¸â€Å½ Liste simplifiee des procedes ultra-transformants connus
const suspiciousKeywords = [
  'extrusion',
  'hydrogenation',
  'hydrogene',
  'maltodextrine',
  'arome artificiel',
  'arome',
  'emulsifiant',
  'emulsifiant',
  'correcteur d\'acidite',
  'colorant',
  'edulcorant',
  'edulcorant',
  'gomme xanthane',
  'monoglyceride',
  'diglyceride',
  'conservateur',
  'antioxydant',
  'stabilisant',
  'epaississant',
  'exhausteur de gout',
  'anti-agglomerant',
  'agent de texture',
  'sirop de glucose',
  'sirop de fructose',
  'amidon modifie',
  'proteine hydrolysee',
  'huile hydrogenee',
  'huile partiellement hydrogenee',
  'isolat de proteine',
  'caseinate',
  'dextrose',
  'fructose',
  'glucose',
  'sirop de mais',
  'lecithine',
  'carraghenane',
  'gelifiant',
  'acidifiant'
];

// Patterns pour detecter les additifs E-numbers
const eNumberPattern = /\bE\d{3,4}\b/gi;

/**
 * Ã°Å¸â€Â¬ Analyse IA ultra-transformation
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
    
    // Detecter les mots-cles suspects
    for (const keyword of suspiciousKeywords) {
      if (lowerIngredient.includes(keyword) && !found.includes(keyword)) {
        found.push(keyword);
      }
    }
    
    // Detecter les E-numbers
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
    level = 'leger';
    score = 25;
  } else if (totalSuspicious === 2) {
    level = 'modere';
    score = 50;
  } else if (totalSuspicious <= 4) {
    level = 'eleve';
    score = 75;
  } else {
    level = 'severe';
    score = 90;
  }

  // Recommandations basees sur le niveau
  const recommendations = {
    minimal: "Excellent ! Ce produit semble peu ou pas transforme.",
    leger: "Produit legerement transforme, consommation occasionnelle recommandee.",
    modere: "Produit transforme, Â  consommer avec moderation.",
    eleve: "Produit hautement transforme, privilegier des alternatives plus naturelles.",
    severe: "Produit ultra-transforme, eviter la consommation reguliere."
  };

  return {
    level,
    score,
    detected: found,
    eNumbers,
    totalMarkers: totalSuspicious,
    recommendation: recommendations[level],
    justification: `Analyse des ingredients : ${found.length} procede(s) suspect(s) et ${eNumbers.length} additif(s) detecte(s)`
  };
};

// POST /api/ultra-processing/analyze - Analyser l'ultra-transformation
router.post('/analyze', asyncHandler(async (req, res) => {
  const { product, ingredients, name } = req.body;
  
  logger.info('Ultra-processing analysis request', { name: name || product?.title });

  // Validation des donnees
  const productName = name || product?.title || product?.name || 'Produit inconnu';
  const ingredientsList = ingredients || product?.ingredients;
  
  if (!ingredientsList) {
    return res.status(400).json({ 
      success: false, 
      error: 'Ingredients list is required',
      message: 'Veuillez fournir la liste des ingredients'
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

// GET /api/ultra-processing/check/:barcode - Verifier par code-barres
router.get('/check/:barcode', asyncHandler(async (req, res) => {
  const { barcode } = req.params;
  
  logger.info('Ultra-processing check by barcode', { barcode });
  
  // TODO: Integrer avec la base de donnees des produits
  // Pour l'instant, retourner une reponse mock
  
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
      'E102': 'Tartrazine - Colorant jaune, peut causer hyperactivite',
      'E110': 'Sunset Yellow - Colorant orange, allergene potentiel',
      'E122': 'Azorubine - Colorant rouge, interdit dans certains pays',
      'E124': 'Ponceau 4R - Colorant rouge, peut causer hyperactivite',
      'E129': 'Allura Red - Colorant rouge, allergene potentiel'
    },
    conservateurs: {
      'E211': 'Benzoate de sodium - Conservateur, peut former du benzene',
      'E220': 'Dioxyde de soufre - Conservateur, allergene majeur',
      'E250': 'Nitrite de sodium - Conservateur, potentiellement cancerigene',
      'E320': 'BHA - Antioxydant, perturbateur endocrinien suspecte',
      'E321': 'BHT - Antioxydant, perturbateur endocrinien suspecte'
    },
    edulcorants: {
      'E951': 'Aspartame - â€°dulcorant artificiel controverse',
      'E952': 'Cyclamate - â€°dulcorant interdit aux USA',
      'E954': 'Saccharine - â€°dulcorant artificiel',
      'E955': 'Sucralose - â€°dulcorant artificiel'
    },
    autres: {
      'E621': 'Glutamate monosodique - Exhausteur de gout',
      'E150d': 'Caramel au sulfite d\'ammonium - Colorant',
      'E471': 'Mono- et diglycerides - â€°mulsifiant'
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
  // TODO: Implementer les vraies statistiques depuis la DB
  
  const mockStats = {
    totalAnalyzed: 15234,
    distribution: {
      minimal: 12,
      leger: 18,
      modere: 35,
      eleve: 25,
      severe: 10
    },
    topAdditives: [
      { code: 'E330', name: 'Acide citrique', count: 3421 },
      { code: 'E322', name: 'Lecithines', count: 2987 },
      { code: 'E471', name: 'Mono- et diglycerides', count: 2341 }
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
