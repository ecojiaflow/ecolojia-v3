// backend/src/controllers/analysisController.js - Version corrigÃ©e UTF-8

const Product = require('../models/Product');
const scoreCalculator = require('../scorers/alimentaire');
const { logger } = require('../utils/logger');

class AnalysisController {
  async analyzeProduct(req, res) {
    try {
      const { mode, barcode, name, ingredients, category } = req.body;
      
      logger.info('Analyse request:', { mode, barcode: barcode ? 'provided' : 'none', category });

      let product = null;
      let analysisData = {};

      // Gestion du mode barcode SEULEMENT si barcode fourni et valide
      if (mode === 'barcode' && barcode) {
        const barcodeStr = String(barcode).trim();
        
        if (barcodeStr && barcodeStr !== 'undefined' && barcodeStr !== 'null') {
          try {
            product = await Product.findOne({ barcode: barcodeStr });
            logger.info('Barcode lookup:', { found: !!product });
          } catch (dbError) {
            logger.error('DB lookup error:', dbError);
            // Continue sans produit
          }
        }
      }

      // Si produit trouvÃ© en DB
      if (product) {
        analysisData = {
          name: product.name,
          brand: product.brand,
          ingredients: product.ingredients?.text || product.ingredients || '',
          category: product.category || 'food',
          nutrition: product.nutrition || {}
        };
      } 
      // Mode manuel - PAS de recherche barcode ici
      else if (mode === 'manual') {
        analysisData = {
          name: name || 'Produit inconnu',
          ingredients: ingredients || '',
          category: category || 'food'
          // PAS de barcode dans analysisData pour Ã©viter les erreurs
        };
      }

      // Validation des donnÃ©es minimales
      if (!analysisData.ingredients || analysisData.ingredients.trim() === '') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_INGREDIENTS',
            message: 'Les ingrÃ©dients sont requis pour l\'analyse'
          }
        });
      }

      // Calcul des scores
      const startTime = Date.now();
      const analysis = scoreCalculator.analyzeProduct(analysisData);
      const analysisTime = Date.now() - startTime;

      logger.info('Analysis completed:', { 
        nova: analysis.scores?.nova, 
        time: analysisTime 
      });

      // RÃ©ponse normalisÃ©e
      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        analysisTime,
        data: {
          id: product?._id || `temp-${Date.now()}`,
          category: analysisData.category || 'food',
          name: analysisData.name,
          brand: analysisData.brand,
          barcode: product?.barcode || undefined, // Seulement si trouvÃ© en DB
          
          // Scores normalisÃ©s
          score: {
            value: analysis.globalScore || 0,
            label: this.getScoreLabel(analysis.globalScore || 0)
          },
          
          // DÃ©tails spÃ©cifiques alimentaire
          details: {
            nova: analysis.scores?.nova || null,
            novaLabel: analysis.details?.novaLabel || '',
            nutriscore: analysis.scores?.nutriscore || null,
            ecoscore: analysis.details?.ecoscore || null,
            ingredientsText: analysisData.ingredients
          },
          
          // Risques et recommandations
          risks: this.extractRisks(analysis),
          highlights: this.extractHighlights(analysis),
          recommendations: this.getRecommendations(analysis),
          
          // DonnÃ©es brutes pour debug
          raw: {
            scores: analysis.scores,
            details: analysis.details,
            confidence: analysis.confidence
          }
        }
      };

      // Cache si nouveau produit avec barcode valide
      if (!product && barcode && mode === 'barcode') {
        const validBarcode = String(barcode).trim();
        if (validBarcode && validBarcode !== 'undefined' && validBarcode !== 'null') {
          this.cacheAnalysis(validBarcode, response.data);
        }
      }

      res.json(response);

    } catch (error) {
      logger.error('Analysis error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ANALYSIS_ERROR',
          message: 'Erreur lors de l\'analyse du produit',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  }

  // MÃ©thodes helper
  getScoreLabel(score) {
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    if (score >= 20) return 'D';
    return 'E';
  }

  extractRisks(analysis) {
    const risks = [];
    
    if (analysis.scores?.nova === 4) {
      risks.push({
        code: 'ULTRA_PROCESSED',
        severity: 'high',
        message: 'Produit ultra-transformÃ©',
        evidence: analysis.details?.novaReason ? [analysis.details.novaReason] : []
      });
    }
    
    if (analysis.scores?.nutriscore === 'E' || analysis.scores?.nutriscore === 'D') {
      risks.push({
        code: 'POOR_NUTRITION',
        severity: 'medium',
        message: 'QualitÃ© nutritionnelle faible'
      });
    }

    // Additifs controversÃ©s
    if (analysis.details?.additives?.controversial?.length > 0) {
      risks.push({
        code: 'CONTROVERSIAL_ADDITIVES',
        severity: 'medium',
        message: 'Contient des additifs controversÃ©s',
        evidence: analysis.details.additives.controversial.map(a => a.name || a.code)
      });
    }

    return risks;
  }

  extractHighlights(analysis) {
    const highlights = [];
    
    if (analysis.scores?.nova <= 2) {
      highlights.push('âœ¨ Peu ou pas transformÃ©');
    }
    
    if (analysis.scores?.nutriscore === 'A' || analysis.scores?.nutriscore === 'B') {
      highlights.push('ðŸ¥— Bonne qualitÃ© nutritionnelle');
    }

    if (analysis.details?.additives?.total === 0) {
      highlights.push('âœ… Sans additifs');
    }

    return highlights;
  }

  getRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.scores?.nova >= 3) {
      recommendations.push('PrivilÃ©gier des alternatives moins transformÃ©es');
    }
    
    if (analysis.details?.additives?.controversial?.length > 0) {
      recommendations.push('VÃ©rifier la prÃ©sence d\'additifs controversÃ©s');
    }

    if (analysis.scores?.nutriscore === 'D' || analysis.scores?.nutriscore === 'E') {
      recommendations.push('Ã€ consommer avec modÃ©ration');
    }

    return recommendations;
  }

  async cacheAnalysis(barcode, analysisData) {
    try {
      await Product.create({
        barcode,
        name: analysisData.name,
        category: 'food',
        analysis: analysisData,
        lastAnalyzed: new Date()
      });
    } catch (error) {
      logger.error('Cache error:', error);
    }
  }
}

module.exports = new AnalysisController();