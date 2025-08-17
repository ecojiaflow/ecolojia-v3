// backend/src/routes/analysis.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { asyncHandler } = require('../utils/errors');

// Import des analyseurs
let cosmeticAnalyzer, detergentAnalyzer, novaClassifier;
try {
  cosmeticAnalyzer = require('../services/analysis/cosmeticAnalyzer');
  detergentAnalyzer = require('../services/analysis/detergentAnalyzer');
  novaClassifier = require('../services/analysis/novaClassifier');
} catch (error) {
  console.warn('Some analyzers not found:', error.message);
}

/**
 * POST /api/analysis/food
 * Analyse alimentaire (NOVA + Nutri-Score)
 */
router.post('/food', asyncHandler(async (req, res) => {
  const { productName, ingredients, nutritionFacts } = req.body;

  if (!ingredients) {
    return res.status(400).json({
      success: false,
      error: 'Les ingredients sont requis'
    });
  }

  try {
    // Classification NOVA
    const novaScore = novaClassifier ? 
      novaClassifier.classify(ingredients) : 
      { score: 4, confidence: 0.5 };

    // Analyse DeepSeek pour plus de details
    let aiAnalysis = null;
    if (process.env.DEEPSEEK_API_KEY) {
      try {
        const response = await axios.post(
          'https://api.deepseek.com/v1/chat/completions',
          {
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: 'Tu es un expert en nutrition. Analyse les produits et fournis des conseils sante.'
              },
              {
                role: 'user',
                content: `Analyse nutritionnelle de "${productName}" avec ingredients: ${ingredients}. Fournis le Nutri-Score et des recommandations.`
              }
            ],
            temperature: 0.7,
            max_tokens: 500
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        aiAnalysis = response.data.choices[0].message.content;
      } catch (error) {
        console.error('DeepSeek error:', error.message);
      }
    }

    res.json({
      success: true,
      data: {
        category: 'food',
        productName,
        scores: {
          nova: novaScore.score,
          nutriScore: 'B', // TODO: Calculer vraiment
          healthScore: 100 - (novaScore.score * 25)
        },
        analysis: {
          nova: novaScore,
          aiInsights: aiAnalysis,
          recommendations: [
            novaScore.score >= 3 ? 'Limiter la consommation' : 'Produit peu transforme',
            'Verifier la teneur en sel et sucres'
          ]
        },
        timestamp: new Date()
      }
    });
  } catch (error) {
    throw error;
  }
}));

/**
 * POST /api/analysis/cosmetic
 * Analyse cosmetique (INCI + Securite)
 */
router.post('/cosmetic', asyncHandler(async (req, res) => {
  const { productName, ingredients, category, labels } = req.body;

  if (!ingredients) {
    return res.status(400).json({
      success: false,
      error: 'La liste INCI est requise'
    });
  }

  if (!cosmeticAnalyzer) {
    return res.status(503).json({
      success: false,
      error: 'Service d\'analyse cosmetique non disponible'
    });
  }

  try {
    const analysis = await cosmeticAnalyzer.analyzeProduct({
      name: productName,
      ingredients,
      category: category || 'general',
      labels: labels || []
    });

    res.json({
      success: true,
      data: {
        category: 'cosmetic',
        productName,
        ...analysis,
        timestamp: new Date()
      }
    });
  } catch (error) {
    throw error;
  }
}));

/**
 * POST /api/analysis/detergent
 * Analyse detergent (‰cologie + CDV)
 */
router.post('/detergent', asyncHandler(async (req, res) => {
  const { productName, ingredients, category, labels } = req.body;

  if (!ingredients) {
    return res.status(400).json({
      success: false,
      error: 'La composition est requise'
    });
  }

  if (!detergentAnalyzer) {
    return res.status(503).json({
      success: false,
      error: 'Service d\'analyse detergent non disponible'
    });
  }

  try {
    const analysis = await detergentAnalyzer.analyzeProduct({
      name: productName,
      ingredients,
      category: category || 'general_cleaner',
      labels: labels || []
    });

    res.json({
      success: true,
      data: {
        category: 'detergent',
        productName,
        ...analysis,
        timestamp: new Date()
      }
    });
  } catch (error) {
    throw error;
  }
}));

/**
 * POST /api/analysis/deepseek
 * Analyse generique avec DeepSeek AI
 */
router.post('/deepseek', asyncHandler(async (req, res) => {
  const { productName, ingredients, question, category } = req.body;

  if (!productName || !ingredients) {
    return res.status(400).json({
      success: false,
      error: 'productName et ingredients sont requis'
    });
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    return res.status(503).json({
      success: false,
      error: 'Service AI non configure'
    });
  }

  // Adapter le prompt selon la categorie
  let systemPrompt = 'Tu es un expert en analyse de produits. ';
  switch (category) {
    case 'food':
      systemPrompt += 'Specialise en nutrition et classification NOVA.';
      break;
    case 'cosmetic':
      systemPrompt += 'Specialise en cosmetologie, INCI et securite cutanee.';
      break;
    case 'detergent':
      systemPrompt += 'Specialise en chimie des detergents et impact environnemental.';
      break;
    default:
      systemPrompt += 'Analyse les produits selon leur categorie.';
  }

  const userPrompt = question || `Analyse complete du produit "${productName}" avec les ingredients: ${ingredients}`;

  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 secondes
      }
    );

    const analysis = response.data.choices[0].message.content;

    res.json({
      success: true,
      data: {
        productName,
        category,
        analysis,
        model: 'deepseek-chat',
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('[DeepSeek] Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(503).json({
        success: false,
        error: 'Configuration API DeepSeek incorrecte'
      });
    }

    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        error: 'Timeout - L\'analyse a pris trop de temps'
      });
    }

    throw error;
  }
}));

/**
 * POST /api/analysis/batch
 * Analyse de plusieurs produits
 */
router.post('/batch', asyncHandler(async (req, res) => {
  const { products } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Un tableau de produits est requis'
    });
  }

  if (products.length > 10) {
    return res.status(400).json({
      success: false,
      error: 'Maximum 10 produits par batch'
    });
  }

  const results = [];
  const errors = [];

  for (const product of products) {
    try {
      let analysis;
      
      switch (product.category) {
        case 'cosmetic':
          if (cosmeticAnalyzer) {
            analysis = await cosmeticAnalyzer.analyzeProduct(product);
          }
          break;
        case 'detergent':
          if (detergentAnalyzer) {
            analysis = await detergentAnalyzer.analyzeProduct(product);
          }
          break;
        default:
          // Food par defaut
          if (novaClassifier) {
            const novaScore = novaClassifier.classify(product.ingredients);
            analysis = {
              scores: { nova: novaScore.score },
              analysis: { nova: novaScore }
            };
          }
      }

      if (analysis) {
        results.push({
          productId: product.id,
          productName: product.name,
          category: product.category,
          ...analysis
        });
      }
    } catch (error) {
      errors.push({
        productId: product.id,
        productName: product.name,
        error: error.message
      });
    }
  }

  res.json({
    success: true,
    data: {
      analyzed: results.length,
      failed: errors.length,
      results,
      errors,
      timestamp: new Date()
    }
  });
}));

/**
 * GET /api/analysis/health
 * Check si les services d'analyse sont disponibles
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'analysis',
    status: 'operational',
    services: {
      deepseek: !!process.env.DEEPSEEK_API_KEY,
      food: !!novaClassifier,
      cosmetic: !!cosmeticAnalyzer,
      detergent: !!detergentAnalyzer
    },
    features: [
      'Food analysis (NOVA, Nutri-Score)',
      'Cosmetic analysis (INCI, Safety)',
      'Detergent analysis (Eco, CDV)',
      'AI-powered insights',
      'Batch processing'
    ],
    timestamp: new Date()
  });
});

/**
 * GET /api/analysis/ingredients/search
 * Recherche d'informations sur un ingredient
 */
router.get('/ingredients/search', asyncHandler(async (req, res) => {
  const { q, category } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      error: 'Parametre de recherche requis'
    });
  }

  let result = null;

  switch (category) {
    case 'cosmetic':
      if (cosmeticAnalyzer) {
        const { inciDatabase } = require('../data/inciDatabase');
        result = inciDatabase.findByName(q);
      }
      break;
    
    case 'detergent':
      if (detergentAnalyzer) {
        const { chemicalDatabase } = require('../data/chemicalDatabase');
        result = chemicalDatabase.findByName(q);
      }
      break;
  }

  if (result) {
    res.json({
      success: true,
      data: result
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Ingredient non trouve'
    });
  }
}));

module.exports = router;
