// backend/src/services/analysis/foodAnalyzer.js

const deepSeekService = require('../ai/deepSeekService');
const { calculateNutriScore } = require('../../utils/nutriScore');

class FoodAnalyzer {
  constructor() {
    this.novaGroups = {
      1: 'Aliments non transformés ou transformés minimalement',
      2: 'Ingrédients culinaires transformés',
      3: 'Aliments transformés',
      4: 'Aliments ultra-transformés'
    };

    // Base de données des additifs problématiques
    this.problematicAdditives = {
      'E102': { name: 'Tartrazine', concern: 'allergène', level: 'high' },
      'E110': { name: 'Sunset Yellow', concern: 'hyperactivité', level: 'high' },
      'E122': { name: 'Carmoisine', concern: 'allergène', level: 'medium' },
      'E124': { name: 'Ponceau 4R', concern: 'allergène', level: 'medium' },
      'E129': { name: 'Rouge Allura', concern: 'hyperactivité', level: 'high' },
      'E211': { name: 'Benzoate de sodium', concern: 'conservateur controversé', level: 'medium' },
      'E320': { name: 'BHA', concern: 'cancérogène possible', level: 'high' },
      'E321': { name: 'BHT', concern: 'perturbateur endocrinien', level: 'high' },
      'E621': { name: 'Glutamate monosodique', concern: 'excitotoxine', level: 'medium' },
      'E951': { name: 'Aspartame', concern: 'édulcorant controversé', level: 'medium' }
    };
  }

  /**
   * Analyse complète d'un produit alimentaire
   */
  async analyzeProduct(product) {
    console.log(`🍎 Analyse alimentaire de: ${product.name}`);

    try {
      // 1. Classification NOVA
      const novaAnalysis = this.analyzeNova(product);
      
      // 2. Analyse nutritionnelle
      const nutritionAnalysis = this.analyzeNutrition(product);
      
      // 3. Analyse des additifs
      const additivesAnalysis = this.analyzeAdditives(product);
      
      // 4. Détection allergènes
      const allergensAnalysis = this.detectAllergens(product);
      
      // 5. Score santé global
      const healthScore = this.calculateHealthScore({
        nova: novaAnalysis,
        nutrition: nutritionAnalysis,
        additives: additivesAnalysis
      });

      // 6. Analyse IA approfondie
      let aiAnalysis = null;
      if (process.env.DEEPSEEK_API_KEY) {
        aiAnalysis = await this.getAIAnalysis(product, {
          nova: novaAnalysis,
          nutrition: nutritionAnalysis,
          additives: additivesAnalysis
        });
      }

      return {
        category: 'food',
        timestamp: new Date(),
        
        scores: {
          healthScore: healthScore,
          nova: novaAnalysis.group,
          nutriscore: nutritionAnalysis.nutriScore,
          ecoscore: product.scores?.ecoscore || 'C',
          additiveScore: 100 - (additivesAnalysis.problematicCount * 10)
        },

        analysis: {
          nova: novaAnalysis,
          nutrition: nutritionAnalysis,
          additives: additivesAnalysis,
          allergens: allergensAnalysis
        },

        aiInsights: aiAnalysis,

        recommendations: this.generateRecommendations({
          nova: novaAnalysis,
          nutrition: nutritionAnalysis,
          additives: additivesAnalysis,
          healthScore
        }),

        alternatives: await this.suggestAlternatives(product, healthScore)
      };
    } catch (error) {
      console.error('Erreur analyse alimentaire:', error);
      throw error;
    }
  }

  /**
   * Analyse NOVA
   */
  analyzeNova(product) {
    let novaGroup = 1;
    const markers = [];

    // Extraction des ingrédients
    const ingredients = product.ingredients || [];
    const ingredientNames = ingredients.map(i => i.name?.toLowerCase() || '').join(' ');

    // Marqueurs NOVA 4 (ultra-transformés)
    const nova4Markers = [
      'sirop de glucose', 'sirop de fructose', 'maltodextrine', 'dextrose',
      'huile hydrogénée', 'huile de palme', 'margarine',
      'protéine hydrolysée', 'isolat de protéine',
      'caséine', 'lactosérum', 'gluten',
      'arôme', 'arôme naturel', 'exhausteur de goût',
      'colorant', 'édulcorant', 'émulsifiant', 'stabilisant',
      'épaississant', 'gélifiant', 'agent de texture'
    ];

    // Marqueurs NOVA 3 (transformés)
    const nova3Markers = [
      'sucre ajouté', 'sel ajouté', 'huile végétale',
      'conservateur', 'antioxydant', 'acidifiant'
    ];

    // Marqueurs NOVA 2 (ingrédients culinaires)
    const nova2Markers = [
      'huile', 'beurre', 'sucre', 'sel', 'vinaigre', 'amidon'
    ];

    // Détection des marqueurs
    nova4Markers.forEach(marker => {
      if (ingredientNames.includes(marker)) {
        novaGroup = 4;
        markers.push(marker);
      }
    });

    if (novaGroup < 4) {
      nova3Markers.forEach(marker => {
        if (ingredientNames.includes(marker)) {
          novaGroup = Math.max(novaGroup, 3);
          markers.push(marker);
        }
      });
    }

    // Vérification des additifs (E-numbers)
    const additiveCount = (product.additives || []).length;
    if (additiveCount > 5) novaGroup = 4;
    else if (additiveCount > 2) novaGroup = Math.max(novaGroup, 3);

    return {
      group: novaGroup,
      label: this.novaGroups[novaGroup],
      markers: markers,
      additiveCount: additiveCount,
      confidence: markers.length > 0 ? 0.9 : 0.7,
      explanation: this.getNovaExplanation(novaGroup, markers)
    };
  }

  /**
   * Analyse nutritionnelle
   */
  analyzeNutrition(product) {
    const nutrition = product.nutrition?.per100g || {};
    
    // Calcul du Nutri-Score
    const nutriScore = calculateNutriScore(nutrition, product.category);

    // Analyse des points critiques
    const concerns = [];
    
    if (nutrition.sugars > 15) {
      concerns.push({ nutrient: 'sucres', value: nutrition.sugars, level: 'high' });
    }
    if (nutrition.saturatedFat > 5) {
      concerns.push({ nutrient: 'graisses saturées', value: nutrition.saturatedFat, level: 'high' });
    }
    if (nutrition.salt > 1.5) {
      concerns.push({ nutrient: 'sel', value: nutrition.salt, level: 'high' });
    }

    // Points positifs
    const positives = [];
    if (nutrition.fiber > 3) {
      positives.push({ nutrient: 'fibres', value: nutrition.fiber });
    }
    if (nutrition.protein > 5) {
      positives.push({ nutrient: 'protéines', value: nutrition.protein });
    }

    return {
      nutriScore: nutriScore,
      values: nutrition,
      concerns: concerns,
      positives: positives,
      caloriesLevel: this.evaluateCalories(nutrition.energy),
      balance: this.evaluateNutritionalBalance(nutrition)
    };
  }

  /**
   * Analyse des additifs
   */
  analyzeAdditives(product) {
    const additives = product.additives || [];
    const problematic = [];
    const acceptable = [];
    const unknown = [];

    additives.forEach(additive => {
      const code = additive.replace('en:', '').toUpperCase();
      
      if (this.problematicAdditives[code]) {
        problematic.push({
          code: code,
          ...this.problematicAdditives[code]
        });
      } else if (this.isAcceptableAdditive(code)) {
        acceptable.push({ code: code, name: this.getAdditiveName(code) });
      } else {
        unknown.push({ code: code });
      }
    });

    return {
      total: additives.length,
      problematic: problematic,
      problematicCount: problematic.length,
      acceptable: acceptable,
      unknown: unknown,
      riskLevel: this.calculateAdditiveRisk(problematic)
    };
  }

  /**
   * Détection des allergènes
   */
  detectAllergens(product) {
    const allergenList = [
      'gluten', 'crustacés', 'oeufs', 'poisson', 'arachides',
      'soja', 'lait', 'fruits à coque', 'céleri', 'moutarde',
      'sésame', 'sulfites', 'lupin', 'mollusques'
    ];

    const detected = [];
    const ingredients = (product.ingredients || []).map(i => i.name?.toLowerCase() || '').join(' ');
    const allergenTags = product.allergens || [];

    allergenList.forEach(allergen => {
      if (ingredients.includes(allergen) || allergenTags.includes(`en:${allergen}`)) {
        detected.push(allergen);
      }
    });

    return {
      detected: detected,
      count: detected.length,
      tags: allergenTags,
      hasGluten: detected.includes('gluten'),
      hasLactose: detected.includes('lait'),
      hasNuts: detected.includes('fruits à coque') || detected.includes('arachides')
    };
  }

  /**
   * Calcul du score santé global
   */
  calculateHealthScore({ nova, nutrition, additives }) {
    let score = 100;

    // Impact NOVA (30 points)
    score -= (nova.group - 1) * 10;

    // Impact Nutri-Score (30 points)
    const nutriScoreImpact = {
      'A': 0, 'B': -5, 'C': -10, 'D': -20, 'E': -30
    };
    score += nutriScoreImpact[nutrition.nutriScore] || -15;

    // Impact additifs (20 points)
    score -= Math.min(additives.problematicCount * 5, 20);

    // Impact nutrition (20 points)
    score -= nutrition.concerns.length * 5;
    score += nutrition.positives.length * 2;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Analyse IA via DeepSeek
   */
  async getAIAnalysis(product, quickAnalysis) {
    const prompt = `
      Produit alimentaire: ${product.name}
      Marque: ${product.brand}
      Nova: ${quickAnalysis.nova.group}
      Nutri-Score: ${quickAnalysis.nutrition.nutriScore}
      Additifs problématiques: ${quickAnalysis.additives.problematicCount}
      
      Fournis une analyse nutritionnelle approfondie en 3 points maximum.
    `;

    try {
      const aiResponse = await deepSeekService.analyze(prompt);
      return {
        summary: aiResponse,
        generated: true
      };
    } catch (error) {
      console.error('Erreur analyse IA:', error);
      return null;
    }
  }

  /**
   * Génération de recommandations
   */
  generateRecommendations({ nova, nutrition, additives, healthScore }) {
    const recommendations = [];

    // Recommandations NOVA
    if (nova.group === 4) {
      recommendations.push({
        type: 'nova',
        priority: 'high',
        message: 'Produit ultra-transformé. Privilégiez des alternatives moins transformées.',
        action: 'reduce_consumption'
      });
    }

    // Recommandations nutritionnelles
    nutrition.concerns.forEach(concern => {
      recommendations.push({
        type: 'nutrition',
        priority: concern.level,
        message: `Teneur élevée en ${concern.nutrient} (${concern.value}g/100g)`,
        action: 'monitor_intake'
      });
    });

    // Recommandations additifs
    if (additives.problematicCount > 0) {
      recommendations.push({
        type: 'additives',
        priority: 'medium',
        message: `Contient ${additives.problematicCount} additif(s) controversé(s)`,
        action: 'check_alternatives'
      });
    }

    return recommendations;
  }

  /**
   * Suggestion d'alternatives
   */
  async suggestAlternatives(product, currentScore) {
    // Ici, on pourrait interroger la base de données pour trouver
    // des produits similaires avec de meilleurs scores
    return [
      {
        name: 'Alternative Bio',
        reason: 'Sans additifs, agriculture biologique',
        improvementScore: currentScore + 15
      }
    ];
  }

  // Méthodes utilitaires
  getNovaExplanation(group, markers) {
    const explanations = {
      1: "Aliment brut ou minimalement transformé, idéal pour la santé",
      2: "Ingrédient culinaire simple, à utiliser avec modération",
      3: "Aliment transformé, consommation occasionnelle recommandée",
      4: "Ultra-transformé avec nombreux additifs, à limiter fortement"
    };
    return explanations[group];
  }

  evaluateCalories(energy) {
    if (!energy) return 'unknown';
    if (energy < 100) return 'low';
    if (energy < 250) return 'moderate';
    return 'high';
  }

  evaluateNutritionalBalance(nutrition) {
    let balance = 'balanced';
    const concerns = 0;
    
    if (nutrition.sugars > 15) concerns++;
    if (nutrition.saturatedFat > 5) concerns++;
    if (nutrition.salt > 1.5) concerns++;
    
    if (concerns >= 2) balance = 'unbalanced';
    else if (concerns === 1) balance = 'moderate';
    
    return balance;
  }

  isAcceptableAdditive(code) {
    const acceptable = ['E300', 'E301', 'E330', 'E440']; // Vitamine C, acide citrique, pectine
    return acceptable.includes(code);
  }

  getAdditiveName(code) {
    const names = {
      'E300': 'Acide ascorbique (Vitamine C)',
      'E330': 'Acide citrique',
      'E440': 'Pectines'
    };
    return names[code] || 'Additif';
  }

  calculateAdditiveRisk(problematicAdditives) {
    if (problematicAdditives.length === 0) return 'low';
    if (problematicAdditives.length === 1) return 'moderate';
    return 'high';
  }
}

module.exports = new FoodAnalyzer();

// ====================================
// backend/src/services/analysis/cosmeticsAnalyzer.js
// ====================================

const deepSeekService = require('../ai/deepSeekService');

class CosmeticsAnalyzer {
  constructor() {
    // Base de données des ingrédients problématiques INCI
    this.problematicIngredients = {
      // Perturbateurs endocriniens
      'METHYLPARABEN': { concern: 'perturbateur endocrinien', level: 'high' },
      'PROPYLPARABEN': { concern: 'perturbateur endocrinien', level: 'high' },
      'BUTYLPARABEN': { concern: 'perturbateur endocrinien', level: 'high' },
      'BHA': { concern: 'perturbateur endocrinien, cancérogène possible', level: 'high' },
      'BHT': { concern: 'perturbateur endocrinien', level: 'medium' },
      'TRICLOSAN': { concern: 'perturbateur endocrinien, résistance antibiotique', level: 'high' },
      
      // Allergènes
      'LIMONENE': { concern: 'allergène réglementaire', level: 'medium' },
      'LINALOOL': { concern: 'allergène réglementaire', level: 'medium' },
      'CITRONELLOL': { concern: 'allergène réglementaire', level: 'medium' },
      'GERANIOL': { concern: 'allergène réglementaire', level: 'medium' },
      'EUGENOL': { concern: 'allergène réglementaire', level: 'medium' },
      
      // Irritants
      'SODIUM LAURYL SULFATE': { concern: 'irritant cutané', level: 'medium' },
      'SODIUM LAURETH SULFATE': { concern: 'irritant modéré', level: 'low' },
      'FORMALDEHYDE': { concern: 'cancérogène, allergène', level: 'high' },
      'TOLUENE': { concern: 'toxique, irritant', level: 'high' },
      
      // Silicones et pétrochimie
      'DIMETHICONE': { concern: 'silicone occlusif', level: 'low' },
      'PETROLATUM': { concern: 'dérivé pétrochimique', level: 'low' },
      'PARAFFINUM LIQUIDUM': { concern: 'huile minérale', level: 'low' }
    };

    // 26 allergènes réglementaires EU
    this.regulatoryAllergens = [
      'ALPHA-ISOMETHYL IONONE', 'AMYL CINNAMAL', 'AMYLCINNAMYL ALCOHOL',
      'ANISE ALCOHOL', 'BENZYL ALCOHOL', 'BENZYL BENZOATE',
      'BENZYL CINNAMATE', 'BENZYL SALICYLATE', 'BUTYLPHENYL METHYLPROPIONAL',
      'CINNAMAL', 'CINNAMYL ALCOHOL', 'CITRAL', 'CITRONELLOL',
      'COUMARIN', 'EUGENOL', 'EVERNIA FURFURACEA', 'EVERNIA PRUNASTRI',
      'FARNESOL', 'GERANIOL', 'HEXYL CINNAMAL', 'HYDROXYCITRONELLAL',
      'HYDROXYISOHEXYL 3-CYCLOHEXENE CARBOXALDEHYDE', 'ISOEUGENOL',
      'LIMONENE', 'LINALOOL', 'METHYL 2-OCTYNOATE'
    ];
  }

  /**
   * Analyse complète d'un produit cosmétique
   */
  async analyzeProduct(product) {
    console.log(`💄 Analyse cosmétique de: ${product.name}`);

    try {
      // 1. Analyse INCI
      const inciAnalysis = this.analyzeInciList(product);
      
      // 2. Détection perturbateurs endocriniens
      const endocrineAnalysis = this.detectEndocrineDisruptors(product);
      
      // 3. Analyse allergènes
      const allergenAnalysis = this.analyzeAllergens(product);
      
      // 4. Score de naturalité
      const naturalityScore = this.calculateNaturalityScore(product);
      
      // 5. Score de sécurité
      const safetyScore = this.calculateSafetyScore({
        inci: inciAnalysis,
        endocrine: endocrineAnalysis,
        allergens: allergenAnalysis
      });

      // 6. Analyse IA
      let aiAnalysis = null;
      if (process.env.DEEPSEEK_API_KEY) {
        aiAnalysis = await this.getAIAnalysis(product, {
          inci: inciAnalysis,
          safety: safetyScore
        });
      }

      return {
        category: 'cosmetics',
        timestamp: new Date(),
        
        scores: {
          safetyScore: safetyScore,
          naturalityScore: naturalityScore,
          allergenScore: 100 - (allergenAnalysis.count * 5),
          overallScore: Math.round((safetyScore + naturalityScore) / 2)
        },

        analysis: {
          inci: inciAnalysis,
          endocrineDisruptors: endocrineAnalysis,
          allergens: allergenAnalysis,
          naturality: {
            score: naturalityScore,
            syntheticCount: inciAnalysis.synthetic.length,
            naturalCount: inciAnalysis.natural.length
          }
        },

        aiInsights: aiAnalysis,

        recommendations: this.generateRecommendations({
          inci: inciAnalysis,
          safety: safetyScore,
          naturality: naturalityScore
        }),

        suitability: this.analyzeSuitability(product, inciAnalysis)
      };
    } catch (error) {
      console.error('Erreur analyse cosmétique:', error);
      throw error;
    }
  }

  /**
   * Analyse de la liste INCI
   */
  analyzeInciList(product) {
    const ingredients = product.inci || product.ingredients || [];
    const problematic = [];
    const acceptable = [];
    const natural = [];
    const synthetic = [];

    ingredients.forEach(ingredient => {
      const name = (typeof ingredient === 'string' ? ingredient : ingredient.name || '').toUpperCase();
      
      // Vérifier si problématique
      if (this.problematicIngredients[name]) {
        problematic.push({
          name: name,
          ...this.problematicIngredients[name]
        });
      } else {
        acceptable.push({ name: name });
      }

      // Classifier naturel vs synthétique
      if (this.isNaturalIngredient(name)) {
        natural.push(name);
      } else {
        synthetic.push(name);
      }
    });

    return {
      total: ingredients.length,
      problematic: problematic,
      acceptable: acceptable,
      natural: natural,
      synthetic: synthetic,
      concerns: this.groupConcerns(problematic)
    };
  }

  /**
   * Détection des perturbateurs endocriniens
   */
  detectEndocrineDisruptors(product) {
    const ingredients = product.inci || product.ingredients || [];
    const endocrineDisruptors = [];

    const knownDisruptors = [
      'METHYLPARABEN', 'ETHYLPARABEN', 'PROPYLPARABEN', 'BUTYLPARABEN',
      'BHA', 'BHT', 'TRICLOSAN', 'OXYBENZONE', 'OCTINOXATE',
      'PHTHALATES', 'RESORCINOL', 'OCTYL METHOXYCINNAMATE'
    ];

    ingredients.forEach(ingredient => {
      const name = (typeof ingredient === 'string' ? ingredient : ingredient.name || '').toUpperCase();
      
      knownDisruptors.forEach(disruptor => {
        if (name.includes(disruptor)) {
          endocrineDisruptors.push({
            name: name,
            type: disruptor,
            concern: 'Perturbateur endocrinien suspecté'
          });
        }
      });
    });

    return {
      detected: endocrineDisruptors,
      count: endocrineDisruptors.length,
      riskLevel: this.calculateEndocrineRisk(endocrineDisruptors)
    };
  }

  /**
   * Analyse des allergènes
   */
  analyzeAllergens(product) {
    const ingredients = product.inci || product.ingredients || [];
    const detectedAllergens = [];

    ingredients.forEach(ingredient => {
      const name = (typeof ingredient === 'string' ? ingredient : ingredient.name || '').toUpperCase();
      
      this.regulatoryAllergens.forEach(allergen => {
        if (name.includes(allergen)) {
          detectedAllergens.push({
            name: allergen,
            regulatory: true,
            mustDeclare: true
          });
        }
      });
    });

    return {
      detected: detectedAllergens,
      count: detectedAllergens.length,
      hasRegulatoryAllergens: detectedAllergens.length > 0,
      allergenList: detectedAllergens.map(a => a.name)
    };
  }

  /**
   * Calcul du score de naturalité
   */
  calculateNaturalityScore(product) {
    const ingredients = product.inci || product.ingredients || [];
    if (ingredients.length === 0) return 50;

    let naturalCount = 0;
    let syntheticCount = 0;

    ingredients.forEach(ingredient => {
      const name = (typeof ingredient === 'string' ? ingredient : ingredient.name || '').toUpperCase();
      
      if (this.isNaturalIngredient(name)) {
        naturalCount++;
      } else {
        syntheticCount++;
      }
    });

    // Score basé sur le ratio naturel/total
    const naturalRatio = naturalCount / ingredients.length;
    let score = Math.round(naturalRatio * 100);

    // Bonus pour certifications
    if (product.certifications?.includes('cosmos') || product.certifications?.includes('ecocert')) {
      score = Math.min(100, score + 20);
    }

    return score;
  }

  /**
   * Calcul du score de sécurité
   */
  calculateSafetyScore({ inci, endocrine, allergens }) {
    let score = 100;

    // Impact des ingrédients problématiques
    inci.problematic.forEach(ing => {
      if (ing.level === 'high') score -= 10;
      else if (ing.level === 'medium') score -= 5;
      else score -= 2;
    });

    // Impact perturbateurs endocriniens
    score -= endocrine.count * 15;

    // Impact allergènes (moins sévère car réglementaire)
    score -= allergens.count * 2;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Analyse IA via DeepSeek
   */
  async getAIAnalysis(product, quickAnalysis) {
    const prompt = `
      Produit cosmétique: ${product.name}
      Type: ${product.type || 'cosmétique'}
      Score sécurité: ${quickAnalysis.safety}/100
      Ingrédients problématiques: ${quickAnalysis.inci.problematic.length}
      
      Fournis une analyse dermatologique en 3 points maximum.
    `;

    try {
      const aiResponse = await deepSeekService.analyze(prompt);
      return {
        summary: aiResponse,
        generated: true
      };
    } catch (error) {
      console.error('Erreur analyse IA cosmétique:', error);
      return null;
    }
  }

  /**
   * Génération de recommandations
   */
  generateRecommendations({ inci, safety, naturality }) {
    const recommendations = [];

    // Recommandations sécurité
    if (safety < 60) {
      recommendations.push({
        type: 'safety',
        priority: 'high',
        message: 'Ce produit contient plusieurs ingrédients controversés',
        action: 'consider_alternatives'
      });
    }

    // Recommandations ingrédients
    inci.problematic.forEach(ing => {
      if (ing.level === 'high') {
        recommendations.push({
          type: 'ingredient',
          priority: 'high',
          message: `Contient ${ing.name}: ${ing.concern}`,
          action: 'avoid_if_sensitive'
        });
      }
    });

    // Recommandations naturalité
    if (naturality < 30) {
      recommendations.push({
        type: 'naturality',
        priority: 'medium',
        message: 'Produit majoritairement synthétique',
        action: 'explore_natural_options'
      });
    }

    return recommendations;
  }

  /**
   * Analyse de compatibilité (type de peau, etc.)
   */
  analyzeSuitability(product, inciAnalysis) {
    const suitability = {
      sensitiveSkin: true,
      drySkin: true,
      oilySkin: true,
      pregnantWomen: true,
      children: true
    };

    // Peau sensible
    if (inciAnalysis.problematic.some(ing => ing.concern.includes('irritant'))) {
      suitability.sensitiveSkin = false;
    }

    // Femmes enceintes
    if (inciAnalysis.problematic.some(ing => ing.concern.includes('perturbateur'))) {
      suitability.pregnantWomen = false;
    }

    // Enfants
    if (inciAnalysis.problematic.length > 2) {
      suitability.children = false;
    }

    return suitability;
  }

  // Méthodes utilitaires
  isNaturalIngredient(name) {
    const naturalIndicators = [
      'EXTRACT', 'OIL', 'BUTTER', 'AQUA', 'WATER',
      'GLYCERIN', 'ALCOHOL', 'ACID', 'VITA'
    ];
    
    return naturalIndicators.some(indicator => name.includes(indicator));
  }

  groupConcerns(problematicIngredients) {
    const concerns = {};
    
    problematicIngredients.forEach(ing => {
      if (!concerns[ing.concern]) {
        concerns[ing.concern] = [];
      }
      concerns[ing.concern].push(ing.name);
    });
    
    return concerns;
  }

  calculateEndocrineRisk(disruptors) {
    if (disruptors.length === 0) return 'low';
    if (disruptors.length <= 2) return 'medium';
    return 'high';
  }
}

module.exports = new CosmeticsAnalyzer();

// ====================================
// backend/src/services/analysis/detergentAnalyzer.js
// ====================================

const deepSeekService = require('../ai/deepSeekService');

class DetergentAnalyzer {
  constructor() {
    // Substances problématiques pour l'environnement
    this.problematicSubstances = {
      // Phosphates et dérivés
      'PHOSPHATE': { concern: 'eutrophisation des eaux', impact: 'high' },
      'PHOSPHONATE': { concern: 'pollution aquatique', impact: 'medium' },
      
      // Tensioactifs problématiques
      'EDTA': { concern: 'non biodégradable, chélateur', impact: 'high' },
      'NTA': { concern: 'toxique aquatique', impact: 'high' },
      'OPTICAL BRIGHTENER': { concern: 'peu biodégradable', impact: 'medium' },
      
      // Composés chlorés
      'SODIUM HYPOCHLORITE': { concern: 'formation de composés toxiques', impact: 'high' },
      'CHLORINE BLEACH': { concern: 'toxique aquatique', impact: 'high' },
      
      // Autres
      'FORMALDEHYDE': { concern: 'cancérogène, irritant', impact: 'high' },
      'BENZISOTHIAZOLINONE': { concern: 'allergène puissant', impact: 'medium' },
      'METHYLISOTHIAZOLINONE': { concern: 'allergène, écotoxique', impact: 'medium' }
    };

    // Critères écologiques
    this.ecoLabels = {
      'EU_ECOLABEL': { score: 95, name: 'EU Ecolabel' },
      'ECOCERT': { score: 90, name: 'Ecocert' },
      'NORDIC_SWAN': { score: 95, name: 'Nordic Swan' },
      'BLUE_ANGEL': { score: 90, name: 'Blue Angel' }
    };
  }

  /**
   * Analyse complète d'un détergent
   */
  async analyzeProduct(product) {
    console.log(`🧽 Analyse détergent de: ${product.name}`);

    try {
      // 1. Analyse composition
      const compositionAnalysis = this.analyzeComposition(product);
      
      // 2. Impact environnemental
      const environmentalImpact = this.calculateEnvironmentalImpact(product);
      
      // 3. Biodégradabilité
      const biodegradability = this.analyzeBiodegradability(product);
      
      // 4. Toxicité aquatique
      const aquaticToxicity = this.analyzeAquaticToxicity(product);
      
      // 5. Score écologique global
      const ecoScore = this.calculateEcoScore({
        composition: compositionAnalysis,
        environmental: environmentalImpact,
        biodegradability: biodegradability,
        toxicity: aquaticToxicity
      });

      // 6. Analyse IA
      let aiAnalysis = null;
      if (process.env.DEEPSEEK_API_KEY) {
        aiAnalysis = await this.getAIAnalysis(product, {
          composition: compositionAnalysis,
          ecoScore: ecoScore
        });
      }

      return {
        category: 'detergents',
        timestamp: new Date(),
        
        scores: {
          ecoScore: ecoScore,
          biodegradabilityScore: biodegradability.score,
          toxicityScore: 100 - (aquaticToxicity.level * 25),
          efficiencyScore: this.estimateEfficiency(product),
          overallScore: Math.round((ecoScore + biodegradability.score) / 2)
        },

        analysis: {
          composition: compositionAnalysis,
          environmentalImpact: environmentalImpact,
          biodegradability: biodegradability,
          aquaticToxicity: aquaticToxicity,
          cdv: this.calculateCDV(product)
        },

        aiInsights: aiAnalysis,

        recommendations: this.generateRecommendations({
          composition: compositionAnalysis,
          environmental: environmentalImpact,
          ecoScore: ecoScore
        }),

        usage: this.generateUsageGuidelines(product)
      };
    } catch (error) {
      console.error('Erreur analyse détergent:', error);
      throw error;
    }
  }

  /**
   * Analyse de la composition
   */
  analyzeComposition(product) {
    const ingredients = product.ingredients || [];
    const problematic = [];
    const ecological = [];
    const neutral = [];

    ingredients.forEach(ingredient => {
      const name = (typeof ingredient === 'string' ? ingredient : ingredient.name || '').toUpperCase();
      
      // Vérifier substances problématiques
      let found = false;
      Object.keys(this.problematicSubstances).forEach(substance => {
        if (name.includes(substance)) {
          problematic.push({
            name: name,
            substance: substance,
            ...this.problematicSubstances[substance]
          });
          found = true;
        }
      });

      // Ingrédients écologiques
      if (!found) {
        if (this.isEcologicalIngredient(name)) {
          ecological.push({ name: name });
        } else {
          neutral.push({ name: name });
        }
      }
    });

    return {
      total: ingredients.length,
      problematic: problematic,
      ecological: ecological,
      neutral: neutral,
      hasPhosphates: problematic.some(p => p.substance.includes('PHOSPHAT')),
      hasOpticalBrighteners: problematic.some(p => p.substance.includes('OPTICAL')),
      hasChlorine: problematic.some(p => p.substance.includes('CHLOR'))
    };
  }

  /**
   * Calcul de l'impact environnemental
   */
  calculateEnvironmentalImpact(product) {
    const composition = this.analyzeComposition(product);
    let impactScore = 0;
    const impacts = [];

    // Impact des phosphates
    if (composition.hasPhosphates) {
      impactScore += 30;
      impacts.push({
        type: 'eutrophisation',
        severity: 'high',
        description: 'Favorise la prolifération d\'algues'
      });
    }

    // Impact des azurants optiques
    if (composition.hasOpticalBrighteners) {
      impactScore += 20;
      impacts.push({
        type: 'pollution persistante',
        severity: 'medium',
        description: 'Peu biodégradable, s\'accumule'
      });
    }

    // Impact du chlore
    if (composition.hasChlorine) {
      impactScore += 25;
      impacts.push({
        type: 'toxicité',
        severity: 'high',
        description: 'Formation de composés organochlorés'
      });
    }

    return {
      score: Math.max(0, 100 - impactScore),
      impacts: impacts,
      level: impactScore > 50 ? 'high' : impactScore > 25 ? 'medium' : 'low'
    };
  }

  /**
   * Analyse de biodégradabilité
   */
  analyzeBiodegradability(product) {
    let biodegradabilityScore = 70; // Base
    const factors = [];

    // Vérifier certifications
    if (product.ecoLabels?.includes('EU_ECOLABEL')) {
      biodegradabilityScore = 95;
      factors.push('Certifié EU Ecolabel (>70% biodégradable)');
    }

    // Analyse composition
    const composition = this.analyzeComposition(product);
    
    // Pénalités
    if (composition.hasPhosphates) {
      biodegradabilityScore -= 20;
      factors.push('Phosphates non biodégradables');
    }

    if (composition.hasOpticalBrighteners) {
      biodegradabilityScore -= 15;
      factors.push('Azurants optiques persistants');
    }

    // Bonus tensioactifs végétaux
    if (product.ingredients?.some(i => i.toString().includes('végétal'))) {
      biodegradabilityScore += 10;
      factors.push('Tensioactifs d\'origine végétale');
    }

    return {
      score: Math.max(0, Math.min(100, biodegradabilityScore)),
      percentage: `${biodegradabilityScore}%`,
      timeframe: biodegradabilityScore > 80 ? '< 28 jours' : '> 28 jours',
      factors: factors
    };
  }

  /**
   * Analyse de toxicité aquatique
   */
  analyzeAquaticToxicity(product) {
    const composition = this.analyzeComposition(product);
    let toxicityLevel = 0;
    const toxicFactors = [];

    composition.problematic.forEach(substance => {
      if (substance.impact === 'high') {
        toxicityLevel += 2;
        toxicFactors.push(`${substance.name}: haute toxicité`);
      } else if (substance.impact === 'medium') {
        toxicityLevel += 1;
        toxicFactors.push(`${substance.name}: toxicité modérée`);
      }
    });

    return {
      level: toxicityLevel,
      classification: toxicityLevel > 3 ? 'high' : toxicityLevel > 1 ? 'medium' : 'low',
      factors: toxicFactors,
      cdv: this.calculateCDV(product)
    };
  }

  /**
   * Calcul du Critical Dilution Volume (CDV)
   */
  calculateCDV(product) {
    // Simulation du CDV basée sur la composition
    const composition = this.analyzeComposition(product);
    let cdv = 10000; // Base en L/kg

    if (composition.hasPhosphates) cdv *= 3;
    if (composition.hasChlorine) cdv *= 2.5;
    if (composition.hasOpticalBrighteners) cdv *= 1.5;

    return {
      value: Math.round(cdv),
      unit: 'L/kg',
      interpretation: cdv > 50000 ? 'Très élevé' : cdv > 20000 ? 'Élevé' : 'Acceptable'
    };
  }

  /**
   * Calcul du score écologique global
   */
  calculateEcoScore({ composition, environmental, biodegradability, toxicity }) {
    let score = 50; // Base

    // Bonus certifications
    if (biodegradability.score > 90) score += 20;

    // Impact composition
    score -= composition.problematic.length * 5;
    score += composition.ecological.length * 3;

    // Impact environnemental
    score += environmental.score * 0.3;

    // Impact biodégradabilité
    score += biodegradability.score * 0.2;

    // Impact toxicité
    if (toxicity.classification === 'low') score += 10;
    else if (toxicity.classification === 'high') score -= 20;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Analyse IA via DeepSeek
   */
  async getAIAnalysis(product, quickAnalysis) {
    const prompt = `
      Produit détergent: ${product.name}
      Type: ${product.type || 'détergent'}
      Score écologique: ${quickAnalysis.ecoScore}/100
      Substances problématiques: ${quickAnalysis.composition.problematic.length}
      
      Fournis une analyse environnementale en 3 points maximum.
    `;

    try {
      const aiResponse = await deepSeekService.analyze(prompt);
      return {
        summary: aiResponse,
        generated: true
      };
    } catch (error) {
      console.error('Erreur analyse IA détergent:', error);
      return null;
    }
  }

  /**
   * Génération de recommandations
   */
  generateRecommendations({ composition, environmental, ecoScore }) {
    const recommendations = [];

    // Recommandations score
    if (ecoScore < 50) {
      recommendations.push({
        type: 'eco_score',
        priority: 'high',
        message: 'Impact environnemental élevé, considérez des alternatives écologiques',
        action: 'switch_product'
      });
    }

    // Recommandations phosphates
    if (composition.hasPhosphates) {
      recommendations.push({
        type: 'phosphates',
        priority: 'high',
        message: 'Contient des phosphates nocifs pour les milieux aquatiques',
        action: 'choose_phosphate_free'
      });
    }

    // Recommandations dosage
    recommendations.push({
      type: 'usage',
      priority: 'medium',
      message: 'Respectez les doses recommandées pour limiter l\'impact',
      action: 'follow_dosage'
    });

    return recommendations;
  }

  /**
   * Génération de conseils d'utilisation
   */
  generateUsageGuidelines(product) {
    return {
      dosage: {
        soft_water: '15ml pour 5L d\'eau',
        medium_water: '25ml pour 5L d\'eau',
        hard_water: '35ml pour 5L d\'eau'
      },
      tips: [
        'Utilisez de l\'eau froide quand possible',
        'Ne surdosez pas, cela n\'améliore pas l\'efficacité',
        'Préférez les cycles courts',
        'Attendez d\'avoir une charge complète'
      ],
      storage: 'Conserver à l\'abri de la lumière et de l\'humidité'
    };
  }

  // Méthodes utilitaires
  isEcologicalIngredient(name) {
    const ecoIndicators = [
      'VÉGÉTAL', 'PLANT', 'BIO', 'NATUREL',
      'CITRIC ACID', 'SODIUM BICARBONATE', 'VINEGAR'
    ];
    
    return ecoIndicators.some(indicator => name.includes(indicator));
  }

  estimateEfficiency(product) {
    // Estimation basique de l'efficacité
    let efficiency = 70;
    
    if (product.type === 'concentrated') efficiency += 15;
    if (product.certifications?.includes('tested')) efficiency += 10;
    
    return Math.min(100, efficiency);
  }
}

module.exports = new DetergentAnalyzer();