/**
 * ESTIMATEUR INDEX GLYCÉMIQUE
 * Basé sur Table Internationale IG 2024 + modifications nutritionnelles
 * Sources: University of Sydney + INSERM + Diabetes Care Journal
 */

const glycemicDB = require('../../data/glycemic-index-db.json');

class GlycemicEstimator {
  constructor() {
    this.database = glycemicDB;
    this.minConfidence = 0.4;
    console.log('📊 GlycemicEstimator initialisé avec base internationale 2024');
  }

  /**
   * Estime l'index glycémique d'un produit
   * @param {Object} productData - Données du produit (ingrédients + nutrition)
   * @param {Object} novaData - Classification NOVA pour modulation
   * @returns {Object} Estimation IG complète
   */
  estimateGlycemicIndex(productData, novaData = {}) {
    try {
      console.log('🔬 Estimation IG démarrée');
      
      const { ingredients = [], nutrition = {} } = productData;
      
      // 1. Recherche IG de base par matching ingrédients
      const baseEstimation = this.findBaseGlycemicIndex(ingredients);
      
      if (!baseEstimation.found) {
        return this.createLowConfidenceResult('Ingrédients non reconnus dans base IG');
      }

      // 2. Application des modificateurs nutritionnels
      const modifiedGI = this.applyNutritionalModifiers(baseEstimation, nutrition);
      
      // 3. Application modificateur transformation (NOVA)
      const finalGI = this.applyProcessingModifier(modifiedGI, novaData);
      
      // 4. Calcul charge glycémique
      const glycemicLoad = this.calculateGlycemicLoad(finalGI.value, nutrition);
      
      // 5. Catégorisation et impact
      const category = this.categorizeGlycemicImpact(finalGI.value, glycemicLoad);
      const scoringImpact = this.calculateScoringImpact(finalGI.value, category);

      const result = {
        index: Math.round(finalGI.value),
        load: Math.round(glycemicLoad * 10) / 10,
        category: category.level,
        confidence: finalGI.confidence,
        status: 'estimated',
        
        // Détails calcul
        breakdown: {
          base: {
            value: baseEstimation.gi,
            source: baseEstimation.source,
            category: baseEstimation.category
          },
          modifiers: finalGI.modifiers,
          final_gi: Math.round(finalGI.value)
        },
        
        // Impact sur scoring ECOLOJIA
        impact: scoringImpact,
        
        // Explication éducative
        explanation: this.generateExplanation(finalGI.value, glycemicLoad, category),
        
        // Métadonnées
        meta: {
          algorithm: 'Estimation IG basée table internationale',
          sources: this.database.meta.references,
          calculated_at: new Date().toISOString(),
          legal_disclaimer: this.database.meta.legal_disclaimer
        }
      };

      console.log(`✅ IG estimé: ${result.index} (${category.level})`);
      return result;

    } catch (error) {
      console.error('❌ Erreur estimation IG:', error);
      return this.createLowConfidenceResult(`Erreur calcul: ${error.message}`);
    }
  }

  /**
   * Recherche IG de base dans la database par matching ingrédients
   */
  findBaseGlycemicIndex(ingredients) {
    if (!ingredients || ingredients.length === 0) {
      return { found: false, confidence: 0 };
    }

    let bestMatch = null;
    let highestConfidence = 0;

    console.log('🔍 Recherche IG pour ingrédients:', ingredients.slice(0, 3));

    // Parcours toutes les catégories d'aliments
    for (const [categoryName, categoryData] of Object.entries(this.database.categories)) {
      for (const [foodName, foodData] of Object.entries(categoryData.items)) {
        
        // Test de matching avec chaque ingrédient
        for (const ingredient of ingredients) {
          const matchConfidence = this.calculateMatchConfidence(ingredient, foodName);
          
          if (matchConfidence > highestConfidence && matchConfidence >= 0.3) {
            bestMatch = {
              gi: foodData.gi,
              source: foodName,
              category: categoryName,
              confidence: Math.min(matchConfidence, foodData.confidence),
              gl_serving: foodData.gl_per_serving
            };
            highestConfidence = matchConfidence;
          }
        }
      }
    }

    if (bestMatch) {
      console.log(`✅ Match trouvé: ${bestMatch.source} (IG ${bestMatch.gi})`);
      return {
        found: true,
        gi: bestMatch.gi,
        source: bestMatch.source,
        category: bestMatch.category,
        confidence: bestMatch.confidence,
        gl_serving: bestMatch.gl_serving
      };
    }

    // Si aucun match, estimation par défaut selon type
    return this.getDefaultEstimation(ingredients);
  }

  /**
   * Calcule la confiance du matching ingrédient-aliment
   */
  calculateMatchConfidence(ingredient, foodName) {
    const ingredientLower = ingredient.toLowerCase().trim();
    const foodLower = foodName.toLowerCase().trim();
    
    // Match exact
    if (ingredientLower === foodLower) {
      return 0.95;
    }
    
    // L'un contient l'autre complètement
    if (ingredientLower.includes(foodLower) || foodLower.includes(ingredientLower)) {
      return 0.85;
    }
    
    // Match de mots-clés
    const ingredientWords = ingredientLower.split(/[\s,_-]+/);
    const foodWords = foodLower.split(/[\s,_-]+/);
    
    let matchingWords = 0;
    let totalWords = Math.max(ingredientWords.length, foodWords.length);
    
    for (const iWord of ingredientWords) {
      for (const fWord of foodWords) {
        if (iWord.length > 3 && (iWord.includes(fWord) || fWord.includes(iWord))) {
          matchingWords++;
          break;
        }
      }
    }
    
    const wordMatchRatio = matchingWords / totalWords;
    
    if (wordMatchRatio >= 0.5) return 0.7;
    if (wordMatchRatio >= 0.3) return 0.5;
    if (wordMatchRatio > 0) return 0.3;
    
    return 0;
  }

  /**
   * Estimation par défaut selon type d'ingrédients
   */
  getDefaultEstimation(ingredients) {
    const firstIngredient = ingredients[0]?.toLowerCase() || '';
    
    // Heuristiques basées sur le premier ingrédient
    const patterns = [
      { pattern: /sucre|glucose|sirop|miel/, gi: 70, confidence: 0.6, source: 'estimation sucre' },
      { pattern: /farine|blé|avoine/, gi: 65, confidence: 0.5, source: 'estimation céréale' },
      { pattern: /riz/, gi: 70, confidence: 0.6, source: 'estimation riz' },
      { pattern: /fruit|pomme|orange/, gi: 45, confidence: 0.4, source: 'estimation fruit' },
      { pattern: /légume|carotte|tomate/, gi: 35, confidence: 0.4, source: 'estimation légume' },
      { pattern: /lait|yaourt/, gi: 35, confidence: 0.5, source: 'estimation laitage' }
    ];
    
    for (const { pattern, gi, confidence, source } of patterns) {
      if (pattern.test(firstIngredient)) {
        console.log(`📝 Estimation par défaut: ${source} (IG ${gi})`);
        return {
          found: true,
          gi,
          source,
          category: 'default_estimation',
          confidence,
          gl_serving: gi * 0.2 // Estimation CG
        };
      }
    }
    
    return { found: false, confidence: 0 };
  }

  /**
   * Applique les modificateurs nutritionnels
   */
  applyNutritionalModifiers(baseEstimation, nutrition) {
    let modifiedGI = baseEstimation.gi;
    const modifiers = this.database.modifying_factors;
    const appliedModifiers = {};
    
    // Modificateur fibres
    const fiberLevel = this.getFiberLevel(nutrition.fiber);
    const fiberModifier = modifiers.fiber_content[fiberLevel]?.modifier || 1.0;
    modifiedGI *= fiberModifier;
    appliedModifiers.fiber = { level: fiberLevel, modifier: fiberModifier };
    
    // Modificateur lipides
    const fatLevel = this.getFatLevel(nutrition.fat);
    const fatModifier = modifiers.fat_content[fatLevel]?.modifier || 1.0;
    modifiedGI *= fatModifier;
    appliedModifiers.fat = { level: fatLevel, modifier: fatModifier };
    
    // Modificateur protéines
    const proteinLevel = this.getProteinLevel(nutrition.proteins);
    const proteinModifier = modifiers.protein_content[proteinLevel]?.modifier || 1.0;
    modifiedGI *= proteinModifier;
    appliedModifiers.protein = { level: proteinLevel, modifier: proteinModifier };
    
    console.log('🔧 Modificateurs nutritionnels appliqués:', appliedModifiers);
    
    return {
      value: modifiedGI,
      confidence: baseEstimation.confidence * 0.95, // Légère réduction confiance
      modifiers: appliedModifiers
    };
  }

  /**
   * Applique le modificateur de transformation (NOVA)
   */
  applyProcessingModifier(estimation, novaData) {
    const novaGroup = novaData.group || 1;
    const modifiers = this.database.modifying_factors.processing_level;
    
    let processingModifier = 1.0;
    let processingLevel = 'minimal';
    
    if (novaGroup <= 1) {
      processingLevel = 'minimal';
      processingModifier = modifiers.minimal.modifier;
    } else if (novaGroup <= 3) {
      processingLevel = 'processed';
      processingModifier = modifiers.processed.modifier;
    } else {
      processingLevel = 'ultra_processed';
      processingModifier = modifiers.ultra_processed.modifier;
    }
    
    const finalGI = estimation.value * processingModifier;
    estimation.modifiers.processing = {
      level: processingLevel,
      nova_group: novaGroup,
      modifier: processingModifier
    };
    
    console.log(`🏭 Modificateur transformation: NOVA ${novaGroup} → x${processingModifier}`);
    
    return {
      value: Math.min(finalGI, 100), // IG max = 100
      confidence: estimation.confidence,
      modifiers: estimation.modifiers
    };
  }

  /**
   * Calcule la charge glycémique
   */
  calculateGlycemicLoad(gi, nutrition) {
    const carbohydrates = nutrition.carbohydrates || nutrition.glucides || 0;
    
    if (carbohydrates === 0) {
      return 0;
    }
    
    // Formule: CG = (IG × glucides pour 100g) / 100
    const glycemicLoad = (gi * carbohydrates) / 100;
    
    console.log(`📊 Charge glycémique: (${gi} × ${carbohydrates}g) / 100 = ${glycemicLoad.toFixed(1)}`);
    
    return glycemicLoad;
  }

  /**
   * Catégorise l'impact glycémique
   */
  categorizeGlycemicImpact(gi, gl) {
    const giRanges = this.database.classification_ranges;
    const glRanges = this.database.glycemic_load_ranges;
    
    let giCategory = 'high_gi';
    let glCategory = 'high_gl';
    
    // Détermination catégorie IG
    if (gi <= giRanges.low_gi.max) {
      giCategory = 'low_gi';
    } else if (gi <= giRanges.medium_gi.max) {
      giCategory = 'medium_gi';
    }
    
    // Détermination catégorie CG
    if (gl <= glRanges.low_gl.max) {
      glCategory = 'low_gl';
    } else if (gl <= glRanges.medium_gl.max) {
      glCategory = 'medium_gl';
    }
    
    // Catégorie finale (plus restrictive)
    const levelPriority = { 'low': 0, 'medium': 1, 'high': 2 };
    const giLevel = giCategory.split('_')[0];
    const glLevel = glCategory.split('_')[0];
    
    const finalLevel = levelPriority[giLevel] >= levelPriority[glLevel] ? giLevel : glLevel;
    
    return {
      level: finalLevel,
      gi_category: giCategory,
      gl_category: glCategory,
      health_impact: giRanges[giCategory]?.health_impact || 'unfavorable'
    };
  }

  /**
   * Calcule l'impact sur le score ECOLOJIA
   */
  calculateScoringImpact(gi, category) {
    const penalties = this.database.scoring_impact.penalties;
    
    let penalty = 0;
    let description = '';
    
    if (gi <= 35) {
      penalty = penalties.very_low_gi.penalty;
      description = `IG très faible (${gi}) - Aucune pénalité`;
    } else if (gi <= 55) {
      penalty = penalties.low_gi.penalty;
      description = `IG faible (${gi}) - Légère pénalité (${penalty} pts)`;
    } else if (gi <= 69) {
      penalty = penalties.medium_gi.penalty;
      description = `IG modéré (${gi}) - Pénalité (${penalty} pts)`;
    } else if (gi <= 84) {
      penalty = penalties.high_gi.penalty;
      description = `IG élevé (${gi}) - Forte pénalité (${penalty} pts)`;
    } else {
      penalty = penalties.very_high_gi.penalty;
      description = `IG très élevé (${gi}) - Pénalité maximale (${penalty} pts)`;
    }
    
    return {
      penalty,
      description,
      health_relevance: this.getHealthRelevance(category.level),
      recommendation: this.getRecommendation(gi, category.level)
    };
  }

  /**
   * Génère une explication éducative
   */
  generateExplanation(gi, gl, category) {
    const explanations = {
      'low': `IG faible (${gi}) - Absorption lente du glucose, maintien glycémie stable`,
      'medium': `IG modéré (${gi}) - Impact glycémique acceptable, à consommer avec modération`,
      'high': `IG élevé (${gi}) - Pic glycémique rapide, risque hypoglycémie réactionnelle`
    };
    
    const glExplanation = gl > 0 ? ` Charge glycémique: ${gl.toFixed(1)}.` : '';
    
    return explanations[category.level] + glExplanation;
  }

  /**
   * Pertinence santé selon catégorie
   */
  getHealthRelevance(level) {
    const relevance = {
      'low': 'Favorable pour régulation glycémique et contrôle du poids',
      'medium': 'Acceptable dans alimentation équilibrée, surveiller quantités',
      'high': 'Peut perturber glycémie, privilégier consommation occasionnelle'
    };
    
    return relevance[level] || 'Impact glycémique non évalué';
  }

  /**
   * Recommandations selon IG
   */
  getRecommendation(gi, level) {
    if (level === 'low') {
      return 'Excellent choix pour maintenir une glycémie stable';
    } else if (level === 'medium') {
      return 'Associer avec des fibres ou protéines pour modérer l\'impact';
    } else {
      return 'Consommer avec des aliments à IG faible pour équilibrer le repas';
    }
  }

  /**
   * Méthodes utilitaires pour les niveaux nutritionnels
   */
  getFiberLevel(fiber) {
    if (!fiber || fiber < 3) return 'low_fiber';
    if (fiber < 6) return 'medium_fiber';
    return 'high_fiber';
  }

  getFatLevel(fat) {
    if (!fat || fat < 5) return 'low_fat';
    if (fat < 15) return 'medium_fat';
    return 'high_fat';
  }

  getProteinLevel(protein) {
    if (!protein || protein < 5) return 'low_protein';
    if (protein < 15) return 'medium_protein';
    return 'high_protein';
  }

  /**
   * Crée un résultat de faible confiance
   */
  createLowConfidenceResult(reason) {
    return {
      index: null,
      load: null,
      category: 'unknown',
      confidence: 0,
      status: 'insufficient_data',
      message: reason,
      impact: {
        penalty: 0,
        description: 'IG non estimable - Aucune pénalité appliquée',
        health_relevance: 'Données insuffisantes pour évaluation glycémique'
      },
      meta: {
        algorithm: 'Estimation IG impossible',
        legal_disclaimer: this.database.meta.legal_disclaimer
      }
    };
  }

  /**
   * Valide l'estimateur avec exemples
   */
  validateWithExamples() {
    console.log('🧪 Validation estimateur IG...');
    
    const testCases = [
      {
        name: 'pain_blanc',
        ingredients: ['farine de blé'],
        nutrition: { fiber: 2, fat: 3, proteins: 8 },
        expected_range: [70, 80]
      },
      {
        name: 'galettes_riz',
        ingredients: ['riz'],
        nutrition: { fiber: 1, fat: 1, proteins: 3 },
        novaData: { group: 4 },
        expected_range: [85, 95]
      }
    ];
    
    for (const testCase of testCases) {
      const result = this.estimateGlycemicIndex(testCase, testCase.novaData);
      const inRange = result.index >= testCase.expected_range[0] && 
                     result.index <= testCase.expected_range[1];
      
      console.log(`${inRange ? '✅' : '❌'} ${testCase.name}: IG ${result.index} (attendu ${testCase.expected_range[0]}-${testCase.expected_range[1]})`);
    }
  }
}

module.exports = GlycemicEstimator;
