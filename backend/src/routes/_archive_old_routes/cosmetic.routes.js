// PATH: backend/src/routes/cosmetic.routes.js
const express = require('express');
const router = express.Router();
const { Logger } = require('../utils/logger');
const logger = new Logger('CosmeticRoutes');

// Import du scorer cosmetic
let CosmeticScorer;
try {
  CosmeticScorer = require('../scorers/cosmetic/cosmeticScorer');
} catch (error) {
  console.warn('CosmeticScorer not found, using mock');
  // Mock scorer pour tests
  CosmeticScorer = class {
    async analyzeCosmetic(productData) {
      return {
        score: 70,
        grade: 'B',
        confidence: 0.8,
        breakdown: {
          safety: { score: 75 },
          naturality: { score: 65 },
          allergens: { score: 80 },
          benefits: { score: 60 }
        },
        risk_analysis: {
          endocrine_disruptors: [],
          irritants: [],
          controversial: []
        },
        allergen_analysis: {
          total_allergens: 0,
          allergens_list: [],
          risk_level: 'low'
        },
        recommendations: ['Produit bien tolere'],
        meta: {
          total_ingredients: 10,
          analyzed_ingredients: 8,
          analysis_version: '2.0'
        }
      };
    }
  };
}

const cosmeticScorer = new CosmeticScorer();

// Middleware auth avec fallback - CORRECTION ICI
let authMiddleware;
try {
  authMiddleware = require('../middleware/auth');
  // Si c'est un objet avec plusieurs exports, prendre le bon
  if (authMiddleware.authenticateUser) {
    authMiddleware = authMiddleware.authenticateUser;
  } else if (authMiddleware.auth) {
    authMiddleware = authMiddleware.auth;
  }
} catch (error) {
  console.warn('Auth middleware not found, using bypass');
  authMiddleware = (req, res, next) => {
    req.userId = 'test-user';
    req.user = { _id: req.userId, tier: 'free' };
    next();
  };
}

/**
 * POST /api/cosmetic/analyze
 * Analyser un produit cosmetique
 */
router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    logger.info('Cosmetic analysis request received', { body: req.body });

    const { 
      product_name, 
      productName,
      ingredients, 
      composition, 
      inci,
      brand,
      category,
      type 
    } = req.body;

    // Validation
    const name = product_name || productName || 'Produit cosmetique';
    const ingredientsList = ingredients || composition || inci;

    if (!ingredientsList) {
      return res.status(400).json({
        success: false,
        error: 'Donnees insuffisantes',
        message: 'Les ingredients (INCI) sont requis',
        required_fields: ['ingredients', 'composition', 'inci']
      });
    }

    logger.info('Analyzing cosmetic', { 
      name, 
      hasIngredients: !!ingredientsList,
      ingredientsLength: ingredientsList.length 
    });

    // Preparer les donnees pour l'analyse
    const productData = {
      name,
      ingredients: ingredientsList,
      composition: ingredientsList,
      inci: ingredientsList,
      brand: brand || null,
      category: category || 'cosmetique',
      type: type || null
    };

    // Analyse avec le scorer
    const analysisResult = await cosmeticScorer.analyzeCosmetic(productData);

    // Verifier la confiance
    if (analysisResult.confidence < 0.4) {
      console.warn('Low confidence analysis', { 
        confidence: analysisResult.confidence,
        productName: name 
      });
      
      return res.status(422).json({
        success: false,
        error: 'Analyse non fiable',
        message: 'Les donnees fournies ne permettent pas une analyse suffisamment fiable',
        confidence: analysisResult.confidence,
        min_confidence_required: 0.4,
        suggestions: [
          'Verifiez la liste INCI complete',
          'Assurez-vous que les ingredients sont correctement orthographies',
          'Fournissez plus d\'informations sur le produit'
        ]
      });
    }

    // Enrichir le resultat
    const enrichedResult = {
      ...analysisResult,
      product_info: {
        name,
        brand: brand || null,
        category: category || 'cosmetique',
        type: type || null
      },
      insights: generateCosmeticInsights(analysisResult),
      alternatives: await generateCosmeticAlternatives(productData, analysisResult)
    };

    logger.info('Cosmetic analysis completed', { 
      score: analysisResult.score,
      grade: analysisResult.grade,
      confidence: analysisResult.confidence
    });

    res.json({
      success: true,
      type: 'cosmetic',
      analysis: enrichedResult,
      disclaimers: [
        'Analyse basee sur la composition INCI',
        'Les reactions cutanees sont individuelles',
        'Informations educatives - consultez un dermatologue',
        'Sources : ANSM, EFSA, SCCS'
      ]
    });

  } catch (error) {
    logger.error('Error in cosmetic analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'analyse',
      message: error.message || 'Erreur interne du serveur'
    });
  }
});

/**
 * GET /api/cosmetic/ingredients/:ingredient
 * Obtenir des informations sur un ingredient specifique
 */
router.get('/ingredients/:ingredient', async (req, res) => {
  try {
    const { ingredient } = req.params;
    
    // Base de donnees simplifiee des ingredients
    const ingredientDatabase = {
      'parabens': {
        name: 'Parabenes',
        concern: 'Perturbateur endocrinien potentiel',
        alternatives: ['Phenoxyethanol', 'Sodium benzoate'],
        risk_level: 'medium'
      },
      'sulfates': {
        name: 'Sulfates (SLS/SLES)',
        concern: 'Irritant potentiel',
        alternatives: ['Coco glucoside', 'Decyl glucoside'],
        risk_level: 'low'
      },
      'silicones': {
        name: 'Silicones',
        concern: 'Occlusif, impact environnemental',
        alternatives: ['Huiles vegetales', 'Beurres naturels'],
        risk_level: 'low'
      }
    };

    const info = ingredientDatabase[ingredient.toLowerCase()];
    
    if (!info) {
      return res.status(404).json({
        success: false,
        error: 'Ingredient non trouve'
      });
    }

    res.json({
      success: true,
      ingredient: info
    });

  } catch (error) {
    logger.error('Error getting ingredient info:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recuperation des informations'
    });
  }
});

/**
 * GET /api/cosmetic/status
 * Verifier le statut du service
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'operational',
    service: 'Cosmetic Analysis Service',
    version: '2.0',
    endpoints: [
      'POST /api/cosmetic/analyze',
      'GET /api/cosmetic/ingredients/:ingredient',
      'GET /api/cosmetic/status'
    ],
    features: [
      'INCI analysis',
      'Endocrine disruptors detection',
      'Allergen detection',
      'Natural percentage calculation'
    ]
  });
});

// Fonctions helper

/**
 * Generer des insights pour l'analyse cosmetique
 */
function generateCosmeticInsights(analysisResult) {
  const insights = [];
  
  if (analysisResult.risk_analysis?.endocrine_disruptors?.length > 0) {
    insights.push('âš ï¸ Perturbateurs endocriniens detectes');
  }
  
  if (analysisResult.allergen_analysis?.total_allergens > 2) {
    insights.push('âš ï¸ Plusieurs allergenes presents - test cutane recommande');
  }
  
  if (analysisResult.breakdown?.naturality?.score > 80) {
    insights.push('âœ… Formule majoritairement naturelle');
  }
  
  if (analysisResult.score > 80) {
    insights.push('âœ… Produit bien formule avec peu de risques');
  }
  
  return insights;
}

/**
 * Generer des alternatives cosmetiques
 */
async function generateCosmeticAlternatives(productData, analysisResult) {
  const alternatives = [];
  
  if (analysisResult.risk_analysis?.endocrine_disruptors?.length > 0) {
    alternatives.push({
      type: 'clean_beauty',
      reason: 'Sans perturbateurs endocriniens',
      examples: ['Weleda', 'Dr. Hauschka', 'Melvita'],
      benefit: 'Reduction risque hormonal'
    });
  }
  
  if (analysisResult.breakdown?.naturality?.score < 50) {
    alternatives.push({
      type: 'natural',
      reason: 'Formules plus naturelles',
      examples: ['Cattier', 'Avril', 'Lavera'],
      benefit: 'Meilleure tolerance cutanee'
    });
  }
  
  return alternatives;
}

module.exports = router;
