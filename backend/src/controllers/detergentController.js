// PATH: backend/src/controllers/detergentController.js
const { DetergentScorer } = require('../scorers/detergent/detergentScorer');
const { Logger } = require('../utils/logger');
const logger = new Logger('DetergentController');

const analyzeDetergentController = async (req, res) => {
  try {
    const { name, composition, ingredients, barcode, certifications = [], language = 'fr' } = req.body;
    
    logger.info('ðŸ§½ Analyse dÃ©tergent demandÃ©e', { name, barcode });
    
    // Validation basique
    if (!composition && !ingredients) {
      return res.status(400).json({
        success: false,
        error: 'COMPOSITION_REQUIRED',
        message: 'Composition ou liste d\'ingrÃ©dients requise'
      });
    }

    // Normalisation des ingrÃ©dients
    const ingredientList = normalizeIngredients(composition || ingredients);
    
    if (ingredientList.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_INGREDIENTS',
        message: 'Aucun ingrÃ©dient valide dÃ©tectÃ©'
      });
    }

    // Analyse avec le scorer
    const scorer = new DetergentScorer();
    const analysisResult = await scorer.analyzeDetergent(
      ingredientList,
      name || 'Produit mÃ©nager',
      certifications
    );

    // Formatage de la rÃ©ponse
    const response = {
      success: true,
      data: {
        id: Date.now().toString(),
        category: 'detergent',
        product: {
          name: name || 'Produit mÃ©nager',
          barcode: barcode || null,
          certifications: certifications
        },
        score: {
          value: analysisResult.score,
          label: getScoreLabel(analysisResult.score)
        },
        confidence: {
          value: analysisResult.confidence || 0.85,
          label: getConfidenceLabel(analysisResult.confidence || 0.85)
        },
        breakdown: analysisResult.breakdown,
        risks: formatRisks(analysisResult),
        environmental_impact: formatEnvironmentalImpact(analysisResult),
        highlights: generateHighlights(analysisResult),
        recommendations: generateRecommendations(analysisResult),
        sources: ['REACH', 'ECHA 2024', 'EU Ecolabel', 'EU 648/2004'],
        raw: analysisResult
      }
    };

    logger.info('âœ… Analyse dÃ©tergent terminÃ©e', { 
      product: name, 
      score: analysisResult.score 
    });

    return res.json(response);

  } catch (error) {
    logger.error('âŒ Erreur analyse dÃ©tergent', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'DETERGENT_ANALYSIS_FAILED',
      message: error.message
    });
  }
};

// Fonctions utilitaires

function normalizeIngredients(input) {
  if (!input) return [];
  
  // Si c'est dÃ©jÃ  un tableau
  if (Array.isArray(input)) {
    return input.map(s => String(s).toUpperCase().trim()).filter(Boolean);
  }
  
  // Si c'est une chaÃ®ne
  return String(input)
    .toUpperCase()
    .replace(/INGRÃ‰DIENTS?|INGREDIENTS?\s*[:;-]?\s*/i, '')
    .replace(/\([^)]*\)/g, '') // Supprime les parenthÃ¨ses
    .replace(/\d+[-]\d+%/g, '') // Supprime les pourcentages de type "5-15%"
    .replace(/[<>]\s*\d+%/g, '') // Supprime "<5%" ou ">15%"
    .split(/[,;]\s*|\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 2);
}

function getScoreLabel(score) {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'E';
}

function getConfidenceLabel(confidence) {
  if (confidence >= 0.8) return 'TrÃ¨s fiable';
  if (confidence >= 0.6) return 'Fiable';
  if (confidence >= 0.4) return 'ModÃ©rÃ©';
  return 'Faible';
}

function formatRisks(analysisResult) {
  const risks = [];
  
  // Issues dÃ©tectÃ©es
  if (analysisResult.detected_issues) {
    analysisResult.detected_issues.forEach(issue => {
      risks.push({
        code: issue.type.toUpperCase(),
        ingredient: issue.ingredient,
        severity: issue.severity || 'medium',
        concern: issue.concern,
        evidence: [issue.source || 'ECHA/CLP']
      });
    });
  }

  // PÃ©nalitÃ©s Ã©cotoxiques
  if (analysisResult.breakdown?.ecotoxicity?.penalties) {
    analysisResult.breakdown.ecotoxicity.penalties.forEach(penalty => {
      if (penalty.penalty <= -20) { // Seulement les pÃ©nalitÃ©s importantes
        risks.push({
          code: 'ECOTOXICITY',
          ingredient: penalty.ingredient,
          severity: penalty.penalty <= -30 ? 'high' : 'medium',
          impact: penalty.reason,
          evidence: [penalty.source || 'EU 648/2004']
        });
      }
    });
  }

  return risks;
}

function formatEnvironmentalImpact(analysisResult) {
  const impact = {
    biodegradability: analysisResult.breakdown?.biodegradability || {},
    ecotoxicity: {
      score: analysisResult.breakdown?.ecotoxicity?.score || 0,
      concerns: []
    },
    packaging: analysisResult.breakdown?.packaging || {},
    carbon_footprint: 'Non Ã©valuÃ©'
  };

  // Ajouter les prÃ©occupations Ã©cotoxiques
  if (analysisResult.breakdown?.ecotoxicity?.penalties) {
    analysisResult.breakdown.ecotoxicity.penalties.forEach(penalty => {
      impact.ecotoxicity.concerns.push({
        ingredient: penalty.ingredient,
        impact: penalty.reason,
        severity: penalty.penalty <= -30 ? 'high' : 'medium'
      });
    });
  }

  return impact;
}

function generateHighlights(analysisResult) {
  const highlights = [];
  
  // Score global
  if (analysisResult.score >= 80) {
    highlights.push("âœ… Produit Ã©cologique haute performance");
  } else if (analysisResult.score >= 60) {
    highlights.push("âš ï¸ Impact environnemental modÃ©rÃ©");
  } else {
    highlights.push("âŒ Impact environnemental prÃ©occupant");
  }

  // BiodÃ©gradabilitÃ©
  if (analysisResult.breakdown?.biodegradability?.score >= 80) {
    highlights.push("ðŸŒ± Bonne biodÃ©gradabilitÃ©");
  }

  // EcotoxicitÃ©
  const ecotoxScore = analysisResult.breakdown?.ecotoxicity?.score || 0;
  if (ecotoxScore < 50) {
    highlights.push("âš ï¸ Risques Ã©cotoxiques identifiÃ©s");
  }

  // Certifications
  if (analysisResult.certifications?.length > 0) {
    highlights.push(`ðŸ† ${analysisResult.certifications.length} certification(s) Ã©cologique(s)`);
  }

  // Insights spÃ©cifiques
  if (analysisResult.insights) {
    analysisResult.insights.slice(0, 2).forEach(insight => {
      if (insight.title) {
        highlights.push(insight.title);
      }
    });
  }

  return highlights;
}

function generateRecommendations(analysisResult) {
  const recommendations = [];
  
  // BasÃ©es sur le score
  if (analysisResult.score < 60) {
    recommendations.push("Rechercher des alternatives avec label Ã©cologique");
    recommendations.push("PrivilÃ©gier les produits concentrÃ©s pour rÃ©duire l'emballage");
  }

  // BasÃ©es sur la biodÃ©gradabilitÃ©
  if (analysisResult.breakdown?.biodegradability?.score < 70) {
    recommendations.push("Ã‰viter le rejet direct dans l'environnement");
  }

  // BasÃ©es sur l'Ã©cotoxicitÃ©
  if (analysisResult.breakdown?.ecotoxicity?.score < 50) {
    recommendations.push("Utiliser avec parcimonie et bien doser");
    recommendations.push("Ne pas surdoser - respecter les instructions");
  }

  // Alternatives suggÃ©rÃ©es
  if (analysisResult.alternatives) {
    analysisResult.alternatives.slice(0, 2).forEach(alt => {
      if (alt.title) {
        recommendations.push(alt.title);
      }
    });
  }

  // Recommandations positives
  if (recommendations.length === 0 && analysisResult.score >= 80) {
    recommendations.push("Excellent choix Ã©cologique");
    recommendations.push("Produit recommandÃ© pour un usage rÃ©gulier");
  }

  return recommendations;
}

module.exports = { analyzeDetergentController };