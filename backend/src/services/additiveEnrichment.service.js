const additivesDB = require('../data/additives.json');

class AdditiveEnrichmentService {
  /**
   * Enrichit un tag d'additif avec ses informations complètes
   */
  enrichAdditive(tag) {
    const normalizedTag = tag.toLowerCase().trim();
    const additiveInfo = additivesDB[normalizedTag];
    
    if (additiveInfo) {
      return {
        tag: normalizedTag,
        code: additiveInfo.code,
        name: additiveInfo.name,
        function: additiveInfo.function,
        riskLevel: additiveInfo.riskLevel,
        healthConcerns: additiveInfo.healthConcerns,
        origin: additiveInfo.origin || null
      };
    }
    
    // Si non trouvé, retourner structure minimale
    return {
      tag: normalizedTag,
      code: this.extractCode(normalizedTag),
      name: 'Additif non référencé',
      function: 'Non spécifié',
      riskLevel: 'LOW',
      healthConcerns: []
    };
  }

  /**
   * Enrichit un tableau de tags
   */
  enrichAdditives(tags = []) {
    return tags.map(tag => this.enrichAdditive(tag));
  }

  /**
   * Extrait le code E depuis le tag OpenFoodFacts
   */
  extractCode(tag) {
    const match = tag.match(/e\d+[a-z]*/i);
    return match ? match[0].toUpperCase() : tag;
  }

  /**
   * Calcule le score de risque global des additifs
   */
  calculateAdditiveScore(additives = []) {
    if (additives.length === 0) return 100;

    const riskScores = {
      'LOW': 100,
      'MEDIUM': 70,
      'HIGH': 40,
      'VERY_HIGH': 10
    };

    const totalScore = additives.reduce((sum, additive) => {
      return sum + (riskScores[additive.riskLevel] || 100);
    }, 0);

    return Math.round(totalScore / additives.length);
  }

  /**
   * Obtient les additifs à risque
   */
  getHighRiskAdditives(additives = []) {
    return additives.filter(a => 
      a.riskLevel === 'HIGH' || a.riskLevel === 'VERY_HIGH'
    );
  }
}

module.exports = new AdditiveEnrichmentService();
