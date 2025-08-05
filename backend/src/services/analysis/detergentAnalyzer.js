// backend/src/services/analysis/detergentAnalyzer.js

const { chemicalDatabase } = require('../../data/chemicalDatabase');

class DetergentAnalyzer {
  constructor() {
    this.chemicalDb = chemicalDatabase;
    
    // Seuils pour les scores
    this.thresholds = {
      biodegradability: {
        excellent: 95,  // > 95% en 28 jours
        good: 80,       // > 80% en 28 jours
        moderate: 60,   // > 60% en 28 jours
        poor: 40        // < 40% en 28 jours
      },
      cdv: {
        excellent: 1000,     // < 1000 L/g
        good: 10000,         // < 10 000 L/g
        moderate: 100000,    // < 100 000 L/g
        poor: 1000000        // > 1 000 000 L/g
      },
      phosphates: {
        excellent: 0,        // 0%
        good: 0.5,          // < 0.5%
        moderate: 5,        // < 5%
        poor: 15            // > 15%
      },
      voc: {
        excellent: 1,       // < 1%
        good: 5,           // < 5%
        moderate: 15,      // < 15%
        poor: 30           // > 30%
      }
    };
  }

  /**
   * Analyse complète d'un détergent
   */
  async analyzeProduct(product) {
    try {
      const composition = this.parseComposition(product.ingredients);
      
      // Calcul des scores principaux
      const ecologicalScore = this.calculateEcologicalScore(composition);
      const efficiencyScore = this.calculateEfficiencyScore(composition, product.category);
      const safetyScore = this.calculateSafetyScore(composition);
      
      // Calcul du score global
      const overallScore = Math.round((ecologicalScore + efficiencyScore + safetyScore) / 3);
      
      // Analyses détaillées
      const biodegradability = this.calculateBiodegradability(composition);
      const cdv = this.calculateCDV(composition);
      const irritants = this.detectIrritants(composition);
      const voc = this.calculateVOC(composition);
      const phosphates = this.detectPhosphates(composition);
      
      // Certifications
      const certifications = this.validateCertifications(product.labels);
      
      // Recommandations
      const recommendations = this.generateRecommendations(ecologicalScore, safetyScore, composition);
      
      return {
        scores: {
          ecological: ecologicalScore,
          efficiency: efficiencyScore,
          safety: safetyScore,
          overall: overallScore
        },
        details: {
          biodegradability: biodegradability.percentage + '% en ' + biodegradability.timeframe,
          biodegradabilityData: biodegradability,
          cdv: cdv.value + ' ' + cdv.unit,
          cdvData: cdv,
          irritants,
          voc: voc.percentage + '%',
          vocData: voc,
          phosphates: phosphates.present,
          phosphatesData: phosphates,
          composition
        },
        certifications,
        recommendations,
        analysis: {
          totalIngredients: composition.length,
          problematicIngredients: composition.filter(c => 
            c.irritant === 'high' || 
            c.environmental_hazard || 
            c.persistent
          ).length,
          ecoCertified: certifications.eco.length > 0
        }
      };
    } catch (error) {
      console.error('Detergent analysis error:', error);
      throw new Error('Erreur lors de l\'analyse du produit détergent');
    }
  }

  /**
   * Parse la composition et enrichit avec la base de données
   */
  parseComposition(ingredientsList) {
    if (!ingredientsList || typeof ingredientsList !== 'string') {
      return [];
    }

    // Patterns pour extraire les pourcentages
    const percentagePattern = /(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)\s*%|([<>≤≥]?\s*\d+(?:[.,]\d+)?)\s*%/;
    
    // Séparer et analyser chaque ingrédient
    const ingredients = ingredientsList
      .split(/[,;]/)
      .map(ing => {
        const match = ing.match(/^(.+?)\s*\((.+?)\)$|^(.+)$/);
        let name, percentage = null;
        
        if (match[1] && match[2]) {
          // Format: "Nom (pourcentage%)"
          name = match[1].trim();
          const percentMatch = match[2].match(percentagePattern);
          if (percentMatch) {
            if (percentMatch[1] && percentMatch[2]) {
              // Range: "5-15%"
              percentage = (parseFloat(percentMatch[1]) + parseFloat(percentMatch[2])) / 2;
            } else if (percentMatch[3]) {
              // Single: ">5%", "<15%", "5%"
              percentage = parseFloat(percentMatch[3].replace(/[<>≤≥]/g, ''));
            }
          }
        } else {
          name = (match[3] || ing).trim();
        }
        
        return { name, percentage };
      })
      .filter(ing => ing.name.length > 0);

    // Enrichir avec la base de données
    return ingredients.map((ing, index) => {
      const dbChemical = this.findInDatabase(ing.name);
      
      return {
        name: ing.name,
        percentage: ing.percentage || this.estimatePercentage(index, ingredients.length),
        position: index + 1,
        ...dbChemical,
        category: dbChemical?.category || 'other',
        hazards: this.getChemicalHazards(dbChemical)
      };
    });
  }

  /**
   * Recherche dans la base de données chimique
   */
  findInDatabase(chemicalName) {
    const normalized = this.normalizeChemicalName(chemicalName);
    
    return this.chemicalDb.find(chem => 
      this.normalizeChemicalName(chem.name) === normalized ||
      this.normalizeChemicalName(chem.inci) === normalized ||
      chem.synonyms?.some(syn => this.normalizeChemicalName(syn) === normalized) ||
      chem.cas === chemicalName
    );
  }

  /**
   * Normalise les noms chimiques pour la comparaison
   */
  normalizeChemicalName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/sodium$/i, '')
      .replace(/potassium$/i, '')
      .replace(/salt$/i, '');
  }

  /**
   * Calcule le score écologique (0-100)
   */
  calculateEcologicalScore(composition) {
    let score = 100;
    
    composition.forEach(chem => {
      // Biodégradabilité
      if (chem.biodegradability !== undefined) {
        if (chem.biodegradability < 60) {
          score -= 15 * (chem.percentage || 5) / 100;
        } else if (chem.biodegradability < 80) {
          score -= 10 * (chem.percentage || 5) / 100;
        }
      }
      
      // Toxicité aquatique
      if (chem.aquaticToxicity === 'high') {
        score -= 20 * (chem.percentage || 5) / 100;
      } else if (chem.aquaticToxicity === 'moderate') {
        score -= 10 * (chem.percentage || 5) / 100;
      }
      
      // Bioaccumulation
      if (chem.bioaccumulative) {
        score -= 15 * (chem.percentage || 5) / 100;
      }
      
      // Phosphates
      if (chem.category === 'phosphate') {
        score -= 25 * (chem.percentage || 5) / 100;
      }
      
      // EDTA et dérivés
      if (chem.category === 'chelating' && chem.persistent) {
        score -= 15 * (chem.percentage || 5) / 100;
      }
      
      // COV
      if (chem.voc) {
        score -= 10 * (chem.percentage || 5) / 100;
      }
    });
    
    return Math.max(0, Math.round(score));
  }

  /**
   * Calcule le score d'efficacité basé sur les actifs
   */
  calculateEfficiencyScore(composition, category) {
    let score = 70; // Score de base
    
    const requiredActives = this.getRequiredActives(category);
    const presentActives = new Set();
    
    composition.forEach(chem => {
      // Vérifier la présence des actifs nécessaires
      if (requiredActives.includes(chem.function)) {
        presentActives.add(chem.function);
        score += 10;
      }
      
      // Bonus pour concentration optimale
      if (chem.optimalConcentration) {
        const ratio = (chem.percentage || 5) / chem.optimalConcentration;
        if (ratio >= 0.8 && ratio <= 1.2) {
          score += 5;
        }
      }
      
      // Pénalité pour ingrédients inutiles
      if (chem.function === 'filler' && chem.percentage > 20) {
        score -= 10;
      }
    });
    
    // Vérifier que tous les actifs requis sont présents
    const missingActives = requiredActives.filter(a => !presentActives.has(a));
    score -= missingActives.length * 15;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calcule le score de sécurité (0-100)
   */
  calculateSafetyScore(composition) {
    let score = 100;
    
    composition.forEach(chem => {
      // Irritants
      if (chem.irritant) {
        const severity = chem.irritant === 'high' ? 15 : 8;
        score -= severity * (chem.percentage || 5) / 100;
      }
      
      // Corrosifs
      if (chem.corrosive) {
        score -= 20 * (chem.percentage || 5) / 100;
      }
      
      // Allergènes
      if (chem.allergen) {
        score -= 10 * (chem.percentage || 5) / 100;
      }
      
      // pH extrême
      if (chem.ph !== undefined) {
        if (chem.ph < 2 || chem.ph > 11.5) {
          score -= 20;
        } else if (chem.ph < 4 || chem.ph > 10) {
          score -= 10;
        }
      }
      
      // Sensibilisants respiratoires
      if (chem.respiratorySensitizer) {
        score -= 15 * (chem.percentage || 5) / 100;
      }
      
      // Substances CMR
      if (chem.cmr) {
        score -= 30 * (chem.percentage || 5) / 100;
      }
    });
    
    return Math.max(0, Math.round(score));
  }

  /**
   * Calcule la biodégradabilité globale
   */
  calculateBiodegradability(composition) {
    let totalBiodegradability = 0;
    let totalPercentage = 0;
    
    composition.forEach(chem => {
      if (chem.biodegradability !== undefined && chem.percentage) {
        totalBiodegradability += chem.biodegradability * chem.percentage;
        totalPercentage += chem.percentage;
      }
    });
    
    const avgBiodegradability = totalPercentage > 0 
      ? totalBiodegradability / totalPercentage 
      : 70; // Valeur par défaut
    
    return {
      percentage: Math.round(avgBiodegradability),
      rating: this.getBiodegradabilityRating(avgBiodegradability),
      timeframe: '28 jours',
      details: composition
        .filter(c => c.biodegradability !== undefined)
        .map(c => ({
          ingredient: c.name,
          biodegradability: c.biodegradability,
          percentage: c.percentage
        }))
    };
  }

  /**
   * Calcule le Volume Critique de Dilution (CDV)
   */
  calculateCDV(composition) {
    let totalCDV = 0;
    
    composition.forEach(chem => {
      if (chem.cdvFactor && chem.percentage) {
        // CDV = (Concentration × CDV Factor) / EC50
        const concentration = (chem.percentage / 100) * 1000; // g/L
        const cdv = concentration * chem.cdvFactor;
        totalCDV += cdv;
      }
    });
    
    return {
      value: Math.round(totalCDV),
      unit: 'L/g',
      rating: this.getCDVRating(totalCDV),
      interpretation: this.interpretCDV(totalCDV),
      breakdown: composition
        .filter(c => c.cdvFactor)
        .map(c => ({
          ingredient: c.name,
          contribution: Math.round((c.percentage / 100) * 1000 * c.cdvFactor)
        }))
        .sort((a, b) => b.contribution - a.contribution)
    };
  }

  /**
   * Détecte les irritants
   */
  detectIrritants(composition) {
    return composition
      .filter(chem => chem.irritant || chem.corrosive || chem.sensitizer)
      .map(chem => ({
        ingredient: chem.name,
        type: this.getIrritantType(chem),
        severity: chem.irritant || (chem.corrosive ? 'high' : 'moderate'),
        percentage: chem.percentage,
        hazards: chem.hazards || []
      }))
      .sort((a, b) => {
        const severityOrder = { high: 3, moderate: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
  }

  /**
   * Calcule les Composés Organiques Volatils (COV)
   */
  calculateVOC(composition) {
    let totalVOC = 0;
    const vocComponents = [];
    
    composition.forEach(chem => {
      if (chem.voc && chem.percentage) {
        totalVOC += chem.percentage;
        vocComponents.push({
          ingredient: chem.name,
          percentage: chem.percentage,
          category: chem.vocCategory || 'other'
        });
      }
    });
    
    return {
      percentage: totalVOC,
      rating: this.getVOCRating(totalVOC),
      components: vocComponents,
      euLimit: this.getEUVOCLimit(composition[0]?.productType),
      compliant: totalVOC <= this.getEUVOCLimit(composition[0]?.productType)
    };
  }

  /**
   * Détecte les phosphates
   */
  detectPhosphates(composition) {
    const phosphates = composition.filter(chem => 
      chem.category === 'phosphate' || 
      chem.name.toLowerCase().includes('phosphate') ||
      chem.name.toLowerCase().includes('phosphonate')
    );
    
    const totalPhosphates = phosphates.reduce((sum, p) => sum + (p.percentage || 0), 0);
    
    return {
      present: phosphates.length > 0,
      percentage: totalPhosphates,
      components: phosphates.map(p => ({
        name: p.name,
        percentage: p.percentage,
        type: p.phosphateType || 'unknown'
      })),
      euCompliant: totalPhosphates < 0.5, // Limite EU pour lessives
      environmental_impact: totalPhosphates > 0 ? 'eutrophisation' : 'none'
    };
  }

  /**
   * Valide les certifications
   */
  validateCertifications(labels) {
    const certifications = {
      eco: [],
      safety: [],
      performance: []
    };
    
    const certMap = {
      'eu_ecolabel': { type: 'eco', name: 'EU Ecolabel', verified: true },
      'nordic_swan': { type: 'eco', name: 'Nordic Swan', verified: true },
      'blue_angel': { type: 'eco', name: 'Blue Angel', verified: true },
      'ecocert': { type: 'eco', name: 'Ecocert', verified: true },
      'cradle_to_cradle': { type: 'eco', name: 'Cradle to Cradle', verified: true },
      'safer_choice': { type: 'safety', name: 'EPA Safer Choice', verified: true },
      'dermatologically_tested': { type: 'safety', name: 'Dermatologically Tested', verified: false },
      'a_i_s_e': { type: 'performance', name: 'A.I.S.E. Charter', verified: true }
    };
    
    labels?.forEach(label => {
      const cert = certMap[label];
      if (cert) {
        certifications[cert.type].push({
          id: label,
          name: cert.name,
          verified: cert.verified
        });
      }
    });
    
    return certifications;
  }

  /**
   * Génère des recommandations
   */
  generateRecommendations(ecologicalScore, safetyScore, composition) {
    const recommendations = {
      usage: [],
      warnings: [],
      alternatives: [],
      tips: []
    };
    
    // Recommandations d'usage
    if (safetyScore < 70) {
      recommendations.usage.push({
        type: 'protection',
        message: 'Porter des gants lors de l\'utilisation'
      });
      recommendations.usage.push({
        type: 'ventilation',
        message: 'Utiliser dans un endroit bien ventilé'
      });
    }
    
    // Avertissements
    const irritants = composition.filter(c => c.irritant === 'high');
    if (irritants.length > 0) {
      recommendations.warnings.push({
        level: 'warning',
        message: 'Contient des substances irritantes',
        details: irritants.map(i => i.name)
      });
    }
    
    const phosphates = composition.filter(c => c.category === 'phosphate');
    if (phosphates.length > 0) {
      recommendations.warnings.push({
        level: 'info',
        message: 'Contient des phosphates - Impact sur l\'environnement aquatique'
      });
    }
    
    // Alternatives écologiques
    if (ecologicalScore < 60) {
      recommendations.alternatives.push({
        type: 'ecological',
        message: 'Privilégier des produits avec Ecolabel européen'
      });
    }
    
    // Conseils d'utilisation
    recommendations.tips.push({
      category: 'dosage',
      message: 'Respecter les doses recommandées pour limiter l\'impact environnemental'
    });
    
    if (composition.some(c => c.enzyme)) {
      recommendations.tips.push({
        category: 'temperature',
        message: 'Efficace dès 30°C grâce aux enzymes'
      });
    }
    
    return recommendations;
  }

  /**
   * Estime le pourcentage si non fourni
   */
  estimatePercentage(position, total) {
    // Estimation basée sur la position dans la liste
    if (position === 0) return 30;
    if (position === 1) return 20;
    if (position === 2) return 15;
    if (position < 5) return 10;
    if (position < total * 0.5) return 5;
    return 1;
  }

  /**
   * Retourne les actifs requis selon la catégorie
   */
  getRequiredActives(category) {
    const actives = {
      'laundry_detergent': ['surfactant', 'enzyme', 'builder'],
      'dishwasher_detergent': ['surfactant', 'enzyme', 'rinse_aid'],
      'dish_soap': ['surfactant', 'degreaser'],
      'all_purpose_cleaner': ['surfactant', 'solvent'],
      'bathroom_cleaner': ['surfactant', 'acid', 'disinfectant'],
      'floor_cleaner': ['surfactant', 'solvent'],
      'glass_cleaner': ['surfactant', 'solvent', 'anti_streak']
    };
    
    return actives[category] || ['surfactant'];
  }

  /**
   * Obtient les dangers chimiques
   */
  getChemicalHazards(chemical) {
    if (!chemical) return [];
    
    const hazards = [];
    
    if (chemical.irritant) {
      hazards.push(`Irritant (${chemical.irritant})`);
    }
    if (chemical.corrosive) {
      hazards.push('Corrosif');
    }
    if (chemical.sensitizer) {
      hazards.push('Sensibilisant');
    }
    if (chemical.cmr) {
      hazards.push('CMR (Cancérigène, Mutagène ou Reprotoxique)');
    }
    if (chemical.aquaticToxicity) {
      hazards.push(`Toxicité aquatique (${chemical.aquaticToxicity})`);
    }
    if (chemical.bioaccumulative) {
      hazards.push('Bioaccumulable');
    }
    
    return hazards;
  }

  /**
   * Évalue la biodégradabilité
   */
  getBiodegradabilityRating(percentage) {
    if (percentage >= this.thresholds.biodegradability.excellent) return 'excellent';
    if (percentage >= this.thresholds.biodegradability.good) return 'good';
    if (percentage >= this.thresholds.biodegradability.moderate) return 'moderate';
    return 'poor';
  }

  /**
   * Évalue le CDV
   */
  getCDVRating(cdv) {
    if (cdv <= this.thresholds.cdv.excellent) return 'excellent';
    if (cdv <= this.thresholds.cdv.good) return 'good';
    if (cdv <= this.thresholds.cdv.moderate) return 'moderate';
    return 'poor';
  }

  /**
   * Interprète le CDV
   */
  interpretCDV(cdv) {
    if (cdv < 1000) {
      return 'Impact environnemental très faible';
    } else if (cdv < 10000) {
      return 'Impact environnemental faible';
    } else if (cdv < 100000) {
      return 'Impact environnemental modéré';
    } else {
      return 'Impact environnemental élevé - Dilution importante nécessaire';
    }
  }

  /**
   * Détermine le type d'irritant
   */
  getIrritantType(chemical) {
    const types = [];
    if (chemical.irritant) types.push('skin');
    if (chemical.eyeIrritant) types.push('eye');
    if (chemical.respiratoryIrritant) types.push('respiratory');
    if (chemical.corrosive) types.push('corrosive');
    if (chemical.sensitizer) types.push('sensitizer');
    
    return types.join(', ') || 'general';
  }

  /**
   * Évalue les COV
   */
  getVOCRating(percentage) {
    if (percentage <= this.thresholds.voc.excellent) return 'excellent';
    if (percentage <= this.thresholds.voc.good) return 'good';
    if (percentage <= this.thresholds.voc.moderate) return 'moderate';
    return 'poor';
  }

  /**
   * Obtient la limite EU pour les COV
   */
  getEUVOCLimit(productType) {
    const limits = {
      'general_cleaner': 30,
      'window_cleaner': 100,
      'sanitary_cleaner': 30,
      'carpet_cleaner': 50,
      'oven_cleaner': 300
    };
    
    return limits[productType] || 30;
  }

  /**
   * Méthode principale pour l'analyse
   */
  async analyze(productName, ingredients, userId) {
    const product = {
      name: productName,
      ingredients: ingredients,
      category: 'general_cleaner', // Par défaut
      labels: []
    };
    
    return this.analyzeProduct(product);
  }
}

module.exports = new DetergentAnalyzer();
