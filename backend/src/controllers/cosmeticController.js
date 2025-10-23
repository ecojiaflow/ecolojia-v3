// PATH: backend/src/controllers/cosmeticController.js
const CosmeticScorer = require('../scorers/cosmetic/cosmeticScorer');
const { Logger } = require('../utils/logger');
const logger = new Logger('CosmeticController');

const analyzeCosmeticController = async (req, res) => {
  try {
    const { name, ingredients, inciList, barcode, language = 'fr' } = req.body;
    
    logger.info('ðŸ§´ Analyse cosmÃ©tique demandÃ©e', { name, barcode });
    
    // Validation basique
    if (!ingredients && !inciList) {
      return res.status(400).json({
        success: false,
        error: 'INGREDIENTS_REQUIRED',
        message: 'Liste des ingrÃ©dients requise'
      });
    }

    // PrÃ©paration des donnÃ©es pour le scorer
    const productData = {
      name: name || 'Produit cosmÃ©tique',
      ingredients: ingredients || inciList,
      barcode
    };

    // Analyse avec le scorer
    const scorer = new CosmeticScorer();
    const analysisResult = await scorer.analyzeCosmetic(productData);

    // Formatage de la rÃ©ponse
    const response = {
      success: true,
      data: {
        id: Date.now().toString(),
        category: 'cosmetic',
        product: {
          name: productData.name,
          barcode: barcode || null
        },
        score: {
          value: analysisResult.score,
          label: getScoreLabel(analysisResult.score)
        },
        confidence: {
          value: analysisResult.confidence,
          label: analysisResult.confidence_label
        },
        breakdown: analysisResult.breakdown,
        risks: formatRisks(analysisResult),
        benefits: formatBenefits(analysisResult),
        allergens: formatAllergens(analysisResult),
        highlights: generateHighlights(analysisResult),
        recommendations: generateRecommendations(analysisResult),
        sources: analysisResult.meta.sources,
        raw: analysisResult
      }
    };

    logger.info('âœ… Analyse cosmÃ©tique terminÃ©e', { 
      product: name, 
      score: analysisResult.score,
      confidence: analysisResult.confidence 
    });

    return res.json(response);

  } catch (error) {
    logger.error('âŒ Erreur analyse cosmÃ©tique', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'COSMETIC_ANALYSIS_FAILED',
      message: error.message
    });
  }
};

// Fonctions utilitaires

function getScoreLabel(score) {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'E';
}

function formatRisks(analysisResult) {
  const risks = [];
  
  // Perturbateurs endocriniens
  if (analysisResult.risk_analysis?.endocrine_disruptors) {
    analysisResult.risk_analysis.endocrine_disruptors.forEach(item => {
      risks.push({
        code: 'ENDOCRINE',
        ingredient: item.name,
        severity: item.risk_level,
        effect: item.effect,
        evidence: [item.source]
      });
    });
  }

  // IngrÃ©dients toxiques/irritants
  if (analysisResult.risk_analysis?.toxic_ingredients) {
    analysisResult.risk_analysis.toxic_ingredients.forEach(item => {
      risks.push({
        code: 'TOXICITY',
        ingredient: item.name,
        severity: 'medium',
        concern: item.concern,
        evidence: ['SCCS 2024']
      });
    });
  }

  return risks;
}

function formatBenefits(analysisResult) {
  if (!analysisResult.benefit_analysis?.active_ingredients) return [];
  
  return analysisResult.benefit_analysis.active_ingredients.map(item => ({
    ingredient: item.name,
    benefit: item.benefit,
    evidenceLevel: item.evidence_level
  }));
}

function formatAllergens(analysisResult) {
  if (!analysisResult.allergen_analysis?.detected_allergens) return [];
  
  return analysisResult.allergen_analysis.detected_allergens.map(item => ({
    code: 'ALLERGEN',
    ingredient: item.name,
    prevalence: item.prevalence,
    evidence: [item.source]
  }));
}

function generateHighlights(analysisResult) {
  const highlights = [];
  
  // Score global
  if (analysisResult.score >= 80) {
    highlights.push("âœ… Formulation de haute qualitÃ©");
  } else if (analysisResult.score >= 60) {
    highlights.push("âš ï¸ Formulation correcte avec quelques rÃ©serves");
  } else {
    highlights.push("âŒ Formulation problÃ©matique");
  }

  // Risques
  const endocrineCount = analysisResult.risk_analysis?.endocrine_disruptors?.length || 0;
  if (endocrineCount > 0) {
    highlights.push(`âš ï¸ ${endocrineCount} perturbateur(s) endocrinien(s) dÃ©tectÃ©(s)`);
  }

  // AllergÃ¨nes
  const allergenCount = analysisResult.allergen_analysis?.total_allergens || 0;
  if (allergenCount > 0) {
    highlights.push(`ðŸŒ¿ ${allergenCount} allergÃ¨ne(s) parfumÃ©(s) dÃ©tectÃ©(s)`);
  }

  // BÃ©nÃ©fices
  const benefitCount = analysisResult.benefit_analysis?.active_ingredients?.length || 0;
  if (benefitCount > 0) {
    highlights.push(`ðŸ’« ${benefitCount} ingrÃ©dient(s) actif(s) bÃ©nÃ©fique(s)`);
  }

  return highlights;
}

function generateRecommendations(analysisResult) {
  const recommendations = [];
  
  // BasÃ©es sur le score
  if (analysisResult.score < 60) {
    recommendations.push("Rechercher des alternatives avec moins d'ingrÃ©dients controversÃ©s");
  }

  // BasÃ©es sur les risques
  if (analysisResult.risk_analysis?.overall_risk === 'high') {
    recommendations.push("Ã‰viter en cas de peau sensible ou de grossesse");
  }

  // BasÃ©es sur les allergÃ¨nes
  if (analysisResult.allergen_analysis?.risk_level === 'high') {
    recommendations.push("Faire un test cutanÃ© avant utilisation");
    recommendations.push("Ã‰viter en cas d'antÃ©cÃ©dents allergiques");
  }

  // Recommandations gÃ©nÃ©rales
  if (analysisResult.breakdown?.formulation?.details?.complexity === 'complex') {
    recommendations.push("PrivilÃ©gier des formulations plus simples si possible");
  }

  if (recommendations.length === 0 && analysisResult.score >= 80) {
    recommendations.push("Produit recommandÃ© pour un usage rÃ©gulier");
  }

  return recommendations;
}

module.exports = { analyzeCosmeticController };