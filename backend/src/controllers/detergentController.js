// PATH: backend/src/controllers/detergentController.js
const { DetergentScorer } = require('../scorers/detergent/detergentScorer');
const { Logger } = require('../utils/logger');
const logger = new Logger('DetergentController');

const analyzeDetergentController = async (req, res) => {
  try {
    const { name, composition, ingredients, barcode, certifications = [], language = 'fr' } = req.body;
    
    logger.info('🧽 Analyse détergent demandée', { name, barcode });
    
    // Validation basique
    if (!composition && !ingredients) {
      return res.status(400).json({
        success: false,
        error: 'COMPOSITION_REQUIRED',
        message: 'Composition ou liste d\'ingrédients requise'
      });
    }

    // Normalisation des ingrédients
    const ingredientList = normalizeIngredients(composition || ingredients);
    
    if (ingredientList.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_INGREDIENTS',
        message: 'Aucun ingrédient valide détecté'
      });
    }

    // Analyse avec le scorer
    const scorer = new DetergentScorer();
    const analysisResult = await scorer.analyzeDetergent(
      ingredientList,
      name || 'Produit ménager',
      certifications
    );

    // Formatage de la réponse
    const response = {
      success: true,
      data: {
        id: Date.now().toString(),
        category: 'detergent',
        product: {
          name: name || 'Produit ménager',
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

    logger.info('✅ Analyse détergent terminée', { 
      product: name, 
      score: analysisResult.score 
    });

    return res.json(response);

  } catch (error) {
    logger.error('❌ Erreur analyse détergent', { error: error.message });
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
  
  // Si c'est déjà un tableau
  if (Array.isArray(input)) {
    return input.map(s => String(s).toUpperCase().trim()).filter(Boolean);
  }
  
  // Si c'est une chaîne
  return String(input)
    .toUpperCase()
    .replace(/INGRÉDIENTS?|INGREDIENTS?\s*[:;-]?\s*/i, '')
    .replace(/\([^)]*\)/g, '') // Supprime les parenthèses
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
  if (confidence >= 0.8) return 'Très fiable';
  if (confidence >= 0.6) return 'Fiable';
  if (confidence >= 0.4) return 'Modéré';
  return 'Faible';
}

function formatRisks(analysisResult) {
  const risks = [];
  
  // Issues détectées
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

  // Pénalités écotoxiques
  if (analysisResult.breakdown?.ecotoxicity?.penalties) {
    analysisResult.breakdown.ecotoxicity.penalties.forEach(penalty => {
      if (penalty.penalty <= -20) { // Seulement les pénalités importantes
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
    carbon_footprint: 'Non évalué'
  };

  // Ajouter les préoccupations écotoxiques
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
    highlights.push("✅ Produit écologique haute performance");
  } else if (analysisResult.score >= 60) {
    highlights.push("⚠️ Impact environnemental modéré");
  } else {
    highlights.push("❌ Impact environnemental préoccupant");
  }

  // Biodégradabilité
  if (analysisResult.breakdown?.biodegradability?.score >= 80) {
    highlights.push("🌱 Bonne biodégradabilité");
  }

  // Ecotoxicité
  const ecotoxScore = analysisResult.breakdown?.ecotoxicity?.score || 0;
  if (ecotoxScore < 50) {
    highlights.push("⚠️ Risques écotoxiques identifiés");
  }

  // Certifications
  if (analysisResult.certifications?.length > 0) {
    highlights.push(`🏆 ${analysisResult.certifications.length} certification(s) écologique(s)`);
  }

  // Insights spécifiques
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
  
  // Basées sur le score
  if (analysisResult.score < 60) {
    recommendations.push("Rechercher des alternatives avec label écologique");
    recommendations.push("Privilégier les produits concentrés pour réduire l'emballage");
  }

  // Basées sur la biodégradabilité
  if (analysisResult.breakdown?.biodegradability?.score < 70) {
    recommendations.push("Éviter le rejet direct dans l'environnement");
  }

  // Basées sur l'écotoxicité
  if (analysisResult.breakdown?.ecotoxicity?.score < 50) {
    recommendations.push("Utiliser avec parcimonie et bien doser");
    recommendations.push("Ne pas surdoser - respecter les instructions");
  }

  // Alternatives suggérées
  if (analysisResult.alternatives) {
    analysisResult.alternatives.slice(0, 2).forEach(alt => {
      if (alt.title) {
        recommendations.push(alt.title);
      }
    });
  }

  // Recommandations positives
  if (recommendations.length === 0 && analysisResult.score >= 80) {
    recommendations.push("Excellent choix écologique");
    recommendations.push("Produit recommandé pour un usage régulier");
  }

  return recommendations;
}

module.exports = { analyzeDetergentController };