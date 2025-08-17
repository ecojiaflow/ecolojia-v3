// PATH: backend/src/controllers/cosmeticController.js
const CosmeticScorer = require('../scorers/cosmetic/cosmeticScorer');
const { Logger } = require('../utils/logger');
const logger = new Logger('CosmeticController');

const analyzeCosmeticController = async (req, res) => {
  try {
    const { name, ingredients, inciList, barcode, language = 'fr' } = req.body;
    
    logger.info('🧴 Analyse cosmétique demandée', { name, barcode });
    
    // Validation basique
    if (!ingredients && !inciList) {
      return res.status(400).json({
        success: false,
        error: 'INGREDIENTS_REQUIRED',
        message: 'Liste des ingrédients requise'
      });
    }

    // Préparation des données pour le scorer
    const productData = {
      name: name || 'Produit cosmétique',
      ingredients: ingredients || inciList,
      barcode
    };

    // Analyse avec le scorer
    const scorer = new CosmeticScorer();
    const analysisResult = await scorer.analyzeCosmetic(productData);

    // Formatage de la réponse
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

    logger.info('✅ Analyse cosmétique terminée', { 
      product: name, 
      score: analysisResult.score,
      confidence: analysisResult.confidence 
    });

    return res.json(response);

  } catch (error) {
    logger.error('❌ Erreur analyse cosmétique', { error: error.message });
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

  // Ingrédients toxiques/irritants
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
    highlights.push("✅ Formulation de haute qualité");
  } else if (analysisResult.score >= 60) {
    highlights.push("⚠️ Formulation correcte avec quelques réserves");
  } else {
    highlights.push("❌ Formulation problématique");
  }

  // Risques
  const endocrineCount = analysisResult.risk_analysis?.endocrine_disruptors?.length || 0;
  if (endocrineCount > 0) {
    highlights.push(`⚠️ ${endocrineCount} perturbateur(s) endocrinien(s) détecté(s)`);
  }

  // Allergènes
  const allergenCount = analysisResult.allergen_analysis?.total_allergens || 0;
  if (allergenCount > 0) {
    highlights.push(`🌿 ${allergenCount} allergène(s) parfumé(s) détecté(s)`);
  }

  // Bénéfices
  const benefitCount = analysisResult.benefit_analysis?.active_ingredients?.length || 0;
  if (benefitCount > 0) {
    highlights.push(`💫 ${benefitCount} ingrédient(s) actif(s) bénéfique(s)`);
  }

  return highlights;
}

function generateRecommendations(analysisResult) {
  const recommendations = [];
  
  // Basées sur le score
  if (analysisResult.score < 60) {
    recommendations.push("Rechercher des alternatives avec moins d'ingrédients controversés");
  }

  // Basées sur les risques
  if (analysisResult.risk_analysis?.overall_risk === 'high') {
    recommendations.push("Éviter en cas de peau sensible ou de grossesse");
  }

  // Basées sur les allergènes
  if (analysisResult.allergen_analysis?.risk_level === 'high') {
    recommendations.push("Faire un test cutané avant utilisation");
    recommendations.push("Éviter en cas d'antécédents allergiques");
  }

  // Recommandations générales
  if (analysisResult.breakdown?.formulation?.details?.complexity === 'complex') {
    recommendations.push("Privilégier des formulations plus simples si possible");
  }

  if (recommendations.length === 0 && analysisResult.score >= 80) {
    recommendations.push("Produit recommandé pour un usage régulier");
  }

  return recommendations;
}

module.exports = { analyzeCosmeticController };