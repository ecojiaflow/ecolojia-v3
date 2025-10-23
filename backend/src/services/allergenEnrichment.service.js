const allergensDB = require('../data/allergens.json');

class AllergenEnrichmentService {
  enrichAllergen(tag) {
    const normalizedTag = tag.toLowerCase().trim();
    const allergenInfo = allergensDB[normalizedTag];
    
    if (allergenInfo) {
      return {
        tag: normalizedTag,
        name: allergenInfo.name,
        category: allergenInfo.category,
        riskLevel: allergenInfo.riskLevel,
        description: allergenInfo.description,
        concerns: allergenInfo.concerns,
        icon: allergenInfo.icon
      };
    }
    
    return {
      tag: normalizedTag,
      name: this.extractName(normalizedTag),
      category: 'Autre',
      riskLevel: 'MEDIUM',
      description: 'Allergène non référencé',
      concerns: [],
      icon: '⚠️'
    };
  }

  enrichAllergens(tags = []) {
    return tags.map(tag => this.enrichAllergen(tag));
  }

  extractName(tag) {
    return tag.replace('en:', '').replace(/-/g, ' ')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  getHighRiskAllergens(allergens = []) {
    return allergens.filter(a => 
      a.riskLevel === 'HIGH' || a.riskLevel === 'VERY_HIGH'
    );
  }

  calculateAllergenScore(allergens = []) {
    if (allergens.length === 0) return 100;

    const riskScores = {
      'LOW': 100,
      'MEDIUM': 70,
      'HIGH': 40,
      'VERY_HIGH': 10
    };

    const totalScore = allergens.reduce((sum, allergen) => {
      return sum + (riskScores[allergen.riskLevel] || 100);
    }, 0);

    return Math.round(totalScore / allergens.length);
  }
}

module.exports = new AllergenEnrichmentService();
