// PATH: backend\src\services\analysis\cosmetics.js
/**
 * Cosmetics Analysis Service - Analyse des produits cosmetiques
 * Conforme   TechReference.md : INCI, allergenes, perturbateurs endocriniens, microplastiques
 */

class CosmeticsAnalyzer {
  constructor() {
    // Base de donnees des ingredients   risque
    this.riskIngredients = {
      allergens: {
        'limonene': { severity: 'medium', type: 'parfum allergene' },
        'linalool': { severity: 'medium', type: 'parfum allergene' },
        'citral': { severity: 'medium', type: 'parfum allergene' },
        'geraniol': { severity: 'medium', type: 'parfum allergene' },
        'eugenol': { severity: 'high', type: 'parfum allergene' },
        'coumarin': { severity: 'medium', type: 'parfum allergene' },
        'citronellol': { severity: 'medium', type: 'parfum allergene' },
        'benzyl alcohol': { severity: 'low', type: 'conservateur/parfum' },
        'benzyl salicylate': { severity: 'medium', type: 'parfum allergene' },
        'cinnamal': { severity: 'high', type: 'parfum allergene' },
        'cinnamyl alcohol': { severity: 'high', type: 'parfum allergene' },
        'hydroxycitronellal': { severity: 'medium', type: 'parfum allergene' }
      },
      endocrineDisruptors: {
        'bht': { severity: 'high', fullName: 'Butylated Hydroxytoluene' },
        'triclosan': { severity: 'high', fullName: 'Triclosan' },
        'oxybenzone': { severity: 'high', fullName: 'Benzophenone-3' },
        'octinoxate': { severity: 'medium', fullName: 'Ethylhexyl Methoxycinnamate' },
        'propylparaben': { severity: 'medium', fullName: 'Propylparaben' },
        'butylparaben': { severity: 'medium', fullName: 'Butylparaben' },
        'methylparaben': { severity: 'low', fullName: 'Methylparaben' },
        'ethylparaben': { severity: 'low', fullName: 'Ethylparaben' },
        'benzophenone': { severity: 'medium', fullName: 'Benzophenone' },
        'resorcinol': { severity: 'medium', fullName: 'Resorcinol' }
      },
      microplastics: {
        'polyethylene': { type: 'microplastic', usage: 'exfoliant' },
        'polypropylene': { type: 'microplastic', usage: 'agent de texture' },
        'polyethylene terephthalate': { type: 'microplastic', usage: 'paillettes' },
        'polymethyl methacrylate': { type: 'microplastic', usage: 'agent filmogene' },
        'nylon-12': { type: 'microplastic', usage: 'agent matifiant' },
        'nylon-6': { type: 'microplastic', usage: 'agent de texture' },
        'polyurethane': { type: 'microplastic', usage: 'agent filmogene' },
        'acrylates copolymer': { type: 'microplastic', usage: 'agent filmogene' },
        'polyquaternium': { type: 'microplastic', usage: 'conditionnement' },
        'carbomer': { type: 'microplastic', usage: 'gelifiant' }
      },
      silicones: {
        'dimethicone': { type: 'silicone non volatile', concern: 'accumulation' },
        'dimethiconol': { type: 'silicone non volatile', concern: 'accumulation' },
        'amodimethicone': { type: 'silicone non volatile', concern: 'accumulation' },
        'cyclopentasiloxane': { type: 'silicone volatile', concern: 'environnement' },
        'cyclohexasiloxane': { type: 'silicone volatile', concern: 'environnement' },
        'phenyl trimethicone': { type: 'silicone', concern: 'accumulation' }
      },
      preservatives: {
        'methylisothiazolinone': { severity: 'high', abbr: 'MIT' },
        'methylchloroisothiazolinone': { severity: 'high', abbr: 'CMIT' },
        'formaldehyde': { severity: 'high', type: 'liberateur de formol' },
        'dmdm hydantoin': { severity: 'medium', type: 'liberateur de formol' },
        'imidazolidinyl urea': { severity: 'medium', type: 'liberateur de formol' },
        'diazolidinyl urea': { severity: 'medium', type: 'liberateur de formol' },
        'quaternium-15': { severity: 'medium', type: 'liberateur de formol' }
      },
      colorants: {
        'ci 16035': { name: 'Rouge Allura', concern: 'allergie' },
        'ci 19140': { name: 'Tartrazine', concern: 'allergie' },
        'ci 42090': { name: 'Bleu Brillant', concern: 'allergie' },
        'ci 14700': { name: 'Rouge Ponceau', concern: 'allergie' }
      }
    };
    
    // PEG pattern
    this.pegPattern = /\bpeg[-\s]?\d+\b/gi;
  }

  /**
   * Analyse principale d'un produit cosmetique
   */
  async analyzeProduct(product, options = {}) {
    const ingredientsText = this.extractIngredientsText(product);
    
    if (!ingredientsText) {
      return this.createEmptyResult('Pas d\'ingredients fournis');
    }
    
    // Parser la liste INCI
    const ingredients = this.parseINCI(ingredientsText);
    
    // Analyser les risques
    const riskAnalysis = this.analyzeRisks(ingredients);
    
    // Calculer les scores
    const healthScore = this.calculateHealthScore(riskAnalysis, ingredients);
    const environmentScore = this.calculateEnvironmentScore(riskAnalysis, ingredients);
    const globalScore = Math.round((healthScore + environmentScore) / 2);
    
    return {
      category: 'cosmetics',
      timestamp: new Date(),
      scores: {
        healthScore,
        environmentScore
      },
      details: {
        inciTextRaw: ingredientsText,
        riskFlags: this.extractRiskFlags(riskAnalysis),
        notableIngredients: this.extractNotableIngredients(riskAnalysis),
        riskLevel: this.determineRiskLevel(healthScore),
        allergenCount: riskAnalysis.allergens.length,
        endocrineDisruptorCount: riskAnalysis.endocrineDisruptors.length,
        microplasticCount: riskAnalysis.microplastics.length,
        analysis: riskAnalysis
      },
      globalScore,
      confidence: this.calculateConfidence(ingredients, riskAnalysis),
      recommendations: this.generateRecommendations(riskAnalysis, healthScore, environmentScore)
    };
  }

  /**
   * Extrait le texte des ingredients
   */
  extractIngredientsText(product) {
    if (typeof product.ingredients === 'string') {
      return product.ingredients;
    }
    if (product.ingredients?.text) {
      return product.ingredients.text;
    }
    return '';
  }

  /**
   * Parse la liste INCI
   */
  parseINCI(ingredientsText) {
    // Nettoyer et normaliser
    const cleaned = ingredientsText
      .replace(/\([^)]*\)/g, '') // Enlever les parentheses
      .replace(/\[[^\]]*\]/g, '') // Enlever les crochets
      .toLowerCase()
      .trim();
    
    // Separer les ingredients
    const ingredients = cleaned
      .split(/[,;]/)
      .map(ing => ing.trim())
      .filter(ing => ing.length > 0)
      .map((ing, index) => ({
        name: ing,
        position: index + 1,
        concentration: this.estimateConcentration(index)
      }));
    
    return ingredients;
  }

  /**
   * Estime la concentration selon la position
   */
  estimateConcentration(position) {
    if (position === 0) return 'high';
    if (position < 5) return 'medium';
    if (position < 10) return 'low';
    return 'trace';
  }

  /**
   * Analyse les risques
   */
  analyzeRisks(ingredients) {
    const analysis = {
      allergens: [],
      endocrineDisruptors: [],
      microplastics: [],
      silicones: [],
      preservatives: [],
      colorants: [],
      pegs: []
    };
    
    ingredients.forEach(ing => {
      const name = ing.name.toLowerCase();
      
      // Allergenes
      Object.entries(this.riskIngredients.allergens).forEach(([key, data]) => {
        if (name.includes(key)) {
          analysis.allergens.push({
            ingredient: ing.name,
            position: ing.position,
            ...data
          });
        }
      });
      
      // Perturbateurs endocriniens
      Object.entries(this.riskIngredients.endocrineDisruptors).forEach(([key, data]) => {
        if (name.includes(key)) {
          analysis.endocrineDisruptors.push({
            ingredient: ing.name,
            position: ing.position,
            ...data
          });
        }
      });
      
      // Microplastiques
      Object.entries(this.riskIngredients.microplastics).forEach(([key, data]) => {
        if (name.includes(key)) {
          analysis.microplastics.push({
            ingredient: ing.name,
            position: ing.position,
            ...data
          });
        }
      });
      
      // Silicones
      Object.entries(this.riskIngredients.silicones).forEach(([key, data]) => {
        if (name.includes(key)) {
          analysis.silicones.push({
            ingredient: ing.name,
            position: ing.position,
            ...data
          });
        }
      });
      
      // Conservateurs problematiques
      Object.entries(this.riskIngredients.preservatives).forEach(([key, data]) => {
        if (name.includes(key)) {
          analysis.preservatives.push({
            ingredient: ing.name,
            position: ing.position,
            ...data
          });
        }
      });
      
      // Colorants
      const colorantMatch = name.match(/\bci\s*\d{5}\b/);
      if (colorantMatch) {
        const ciNumber = colorantMatch[0].replace(/\s/g, '');
        const colorantInfo = this.riskIngredients.colorants[ciNumber];
        if (colorantInfo) {
          analysis.colorants.push({
            ingredient: ing.name,
            position: ing.position,
            ciNumber,
            ...colorantInfo
          });
        }
      }
      
      // PEGs
      const pegMatch = name.match(this.pegPattern);
      if (pegMatch) {
        analysis.pegs.push({
          ingredient: ing.name,
          position: ing.position,
          type: pegMatch[0]
        });
      }
    });
    
    return analysis;
  }

  /**
   * Calcule le score de sante
   */
  calculateHealthScore(riskAnalysis, ingredients) {
    let score = 100;
    const totalIngredients = ingredients.length || 1;
    
    // Penalites selon la position (plus haut = plus concentre)
    const positionFactor = (position) => {
      if (position <= 3) return 1.0;
      if (position <= 5) return 0.7;
      if (position <= 10) return 0.4;
      return 0.2;
    };
    
    // Perturbateurs endocriniens (penalite forte)
    riskAnalysis.endocrineDisruptors.forEach(item => {
      const penalty = item.severity === 'high' ? 15 : 10;
      score -= penalty * positionFactor(item.position);
    });
    
    // Allergenes
    riskAnalysis.allergens.forEach(item => {
      const penalty = item.severity === 'high' ? 8 : 5;
      score -= penalty * positionFactor(item.position);
    });
    
    // Conservateurs problematiques
    riskAnalysis.preservatives.forEach(item => {
      const penalty = item.severity === 'high' ? 12 : 8;
      score -= penalty * positionFactor(item.position);
    });
    
    // Colorants synthetiques
    score -= riskAnalysis.colorants.length * 3;
    
    // PEGs
    score -= riskAnalysis.pegs.length * 5;
    
    // Bonus si peu d'ingredients (formulation simple)
    if (totalIngredients < 10) score += 10;
    else if (totalIngredients > 30) score -= 10;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calcule le score environnemental
   */
  calculateEnvironmentScore(riskAnalysis, ingredients) {
    let score = 100;
    
    // Microplastiques (penalite forte)
    riskAnalysis.microplastics.forEach(item => {
      score -= 15 * (item.position <= 5 ? 1 : 0.5);
    });
    
    // Silicones non biodegradables
    riskAnalysis.silicones.forEach(item => {
      if (item.type.includes('non volatile')) {
        score -= 10 * (item.position <= 5 ? 1 : 0.5);
      }
    });
    
    // PEGs (derives petrochimiques)
    score -= riskAnalysis.pegs.length * 8;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Extrait les flags de risque
   */
  extractRiskFlags(riskAnalysis) {
    const flags = [];
    
    if (riskAnalysis.allergens.length > 0) flags.push('allergen');
    if (riskAnalysis.endocrineDisruptors.length > 0) flags.push('endocrine');
    if (riskAnalysis.microplastics.length > 0) flags.push('microplastic');
    if (riskAnalysis.colorants.length > 0) flags.push('colorant');
    
    return flags;
  }

  /**
   * Extrait les ingredients notables
   */
  extractNotableIngredients(riskAnalysis) {
    const notable = [];
    
    // Top 3 perturbateurs endocriniens
    riskAnalysis.endocrineDisruptors
      .slice(0, 3)
      .forEach(item => notable.push(item.fullName || item.ingredient));
    
    // Top 2 allergenes si position haute
    riskAnalysis.allergens
      .filter(item => item.position <= 5)
      .slice(0, 2)
      .forEach(item => notable.push(item.ingredient));
    
    return [...new Set(notable)]; // Deduplique
  }

  /**
   * Determine le niveau de risque
   */
  determineRiskLevel(healthScore) {
    if (healthScore >= 80) return 'low';
    if (healthScore >= 50) return 'medium';
    return 'high';
  }

  /**
   * Calcule la confiance
   */
  calculateConfidence(ingredients, riskAnalysis) {
    // Plus on a d'ingredients analyses, plus la confiance est haute
    const analyzedCount = Object.values(riskAnalysis)
      .reduce((sum, arr) => sum + arr.length, 0);
    
    const ratio = analyzedCount / Math.max(ingredients.length, 1);
    
    return Math.min(0.9, 0.5 + ratio * 0.4);
  }

  /**
   * Genere des recommandations
   */
  generateRecommendations(riskAnalysis, healthScore, environmentScore) {
    const recommendations = [];
    
    // Recommandations sante
    if (riskAnalysis.endocrineDisruptors.length > 0) {
      recommendations.push('âš ï¸ Contient des perturbateurs endocriniens suspectes');
    }
    
    if (riskAnalysis.allergens.length > 3) {
      recommendations.push('ðŸ”´ Nombreux allergenes :   eviter pour les peaux sensibles');
    }
    
    if (healthScore < 50) {
      recommendations.push('ðŸ’¡ Score sante faible : privilegiez des alternatives plus sures');
    } else if (healthScore > 80) {
      recommendations.push('âœ… Bonne composition pour la sante');
    }
    
    // Recommandations environnement
    if (riskAnalysis.microplastics.length > 0) {
      recommendations.push('ðŸŒŠ Contient des microplastiques : impact negatif sur les oceans');
    }
    
    if (environmentScore < 50) {
      recommendations.push('ðŸŒ± Impact environnemental eleve : cherchez des alternatives ecologiques');
    }
    
    return recommendations;
  }

  /**
   * Cree un resultat vide avec erreur
   */
  createEmptyResult(error) {
    return {
      category: 'cosmetics',
      timestamp: new Date(),
      scores: {
        healthScore: 0,
        environmentScore: 0
      },
      details: {
        inciTextRaw: '',
        riskFlags: [],
        notableIngredients: [],
        riskLevel: 'unknown',
        error
      },
      globalScore: 0,
      confidence: 0,
      recommendations: []
    };
  }
}

module.exports = new CosmeticsAnalyzer();