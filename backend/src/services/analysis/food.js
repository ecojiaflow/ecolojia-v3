// PATH: backend\src\services\analysis\food.js
/**
 * Food Analysis Service - Analyse complète alimentaire
 * Conforme à TechReference.md : NOVA (1-4), Nutri-Score (A-E), Eco-Score
 */

class FoodAnalyzer {
  constructor() {
    // Marqueurs ultra-transformés (NOVA 4)
    this.ultraProcessedMarkers = [
      'sirop de glucose', 'sirop de fructose', 'sirop de glucose-fructose',
      'maltodextrine', 'dextrose', 'amidon modifié', 'amidons modifiés',
      'huile hydrogénée', 'huile partiellement hydrogénée', 'hydrogéné',
      'isolat de protéine', 'caséine', 'protéine de lactosérum',
      'arôme', 'arôme naturel', 'arôme artificiel', 'exhausteur de goût',
      'colorant', 'conservateur', 'émulsifiant', 'stabilisant',
      'épaississant', 'gélifiant', 'édulcorant', 'correcteur d\'acidité'
    ];

    // Additifs E-xxx pattern
    this.additivePattern = /\be\s?\d{3,4}[a-z]?\b/gi;
  }

  /**
   * Analyse principale d'un produit alimentaire
   */
  async analyzeProduct(product, options = {}) {
    const ingredientsText = this.extractIngredientsText(product);
    
    // Analyse NOVA
    const novaAnalysis = this.analyzeNOVA(ingredientsText);
    
    // Nutri-Score (fallback si pas de données nutritionnelles)
    const nutriscoreAnalysis = this.analyzeNutriScore(product);
    
    // Eco-Score (fallback conservateur)
    const ecoscoreAnalysis = this.analyzeEcoScore(product, ingredientsText);
    
    // Calcul des scores globaux
    const healthScore = this.calculateHealthScore(novaAnalysis, nutriscoreAnalysis);
    const environmentScore = this.calculateEnvironmentScore(ecoscoreAnalysis, product);
    const globalScore = Math.round(healthScore * 0.6 + environmentScore * 0.4);
    
    return {
      category: 'food',
      timestamp: new Date(),
      scores: {
        nova: novaAnalysis.nova,
        healthScore,
        environmentScore,
        nutriscore: nutriscoreAnalysis.grade
      },
      details: {
        ingredientsTextRaw: ingredientsText,
        nova: novaAnalysis.nova,
        novaLabel: novaAnalysis.label,
        novaReason: novaAnalysis.reason,
        novaConfidence: novaAnalysis.confidence,
        ecoscore: ecoscoreAnalysis.grade,
        ultraProcessed: novaAnalysis.nova === 4,
        additiveCount: novaAnalysis.additiveCount,
        ultraProcessedMarkers: novaAnalysis.markers
      },
      globalScore,
      confidence: this.calculateConfidence(novaAnalysis, nutriscoreAnalysis, ecoscoreAnalysis),
      recommendations: this.generateRecommendations(novaAnalysis, healthScore)
    };
  }

  /**
   * Extrait le texte des ingrédients
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
   * Analyse NOVA (1-4)
   */
  analyzeNOVA(ingredientsText) {
    if (!ingredientsText) {
      return {
        nova: 1,
        label: 'Non classifiable',
        reason: 'Pas d\'ingrédients fournis',
        confidence: 0.3,
        additiveCount: 0,
        markers: []
      };
    }

    const lowerText = ingredientsText.toLowerCase();
    
    // Compter les additifs E-xxx
    const additives = lowerText.match(this.additivePattern) || [];
    const additiveCount = additives.length;
    
    // Détecter les marqueurs ultra-transformés
    const foundMarkers = this.ultraProcessedMarkers.filter(marker => 
      lowerText.includes(marker)
    );
    
    // Détecter les procédés industriels
    const hasIndustrialProcess = /\b(modifié|hydrogéné|raffiné|concentré|isolat|hydrolyse|estérifié|malté|instantané)\b/i.test(lowerText);
    
    // Logique de classification NOVA
    let nova = 1;
    let label = 'Non transformé';
    let reason = 'Aliment brut ou minimalement transformé';
    let confidence = 0.85;
    
    // Compter les ingrédients (approximatif)
    const ingredientCount = lowerText.split(/[,;]/).filter(s => s.trim().length > 2).length;
    
    if (additiveCount >= 3 || (additiveCount >= 1 && foundMarkers.length > 0)) {
      // NOVA 4 : Ultra-transformé
      nova = 4;
      label = 'Ultra-transformé';
      reason = `Contient ${additiveCount} additif(s) et/ou marqueurs d'ultra-transformation`;
      confidence = 0.9;
    } else if (foundMarkers.length > 0 || hasIndustrialProcess) {
      // NOVA 4 : Ultra-transformé (même sans beaucoup d'additifs)
      nova = 4;
      label = 'Ultra-transformé';
      reason = 'Contient des ingrédients ou procédés caractéristiques de l\'ultra-transformation';
      confidence = 0.85;
    } else if (additiveCount >= 1 || ingredientCount > 5) {
      // NOVA 3 : Aliment transformé
      nova = 3;
      label = 'Aliment transformé';
      reason = `Contient ${additiveCount} additif(s) ou plusieurs ingrédients transformés`;
      confidence = 0.8;
    } else if (ingredientCount > 1) {
      // NOVA 2 : Ingrédient culinaire transformé
      nova = 2;
      label = 'Ingrédient culinaire transformé';
      reason = 'Transformation simple d\'aliments du groupe 1';
      confidence = 0.8;
    }
    
    return {
      nova,
      label,
      reason,
      confidence,
      additiveCount,
      markers: foundMarkers
    };
  }

  /**
   * Analyse Nutri-Score avec fallback
   */
  analyzeNutriScore(product) {
    // Si on a des données nutritionnelles
    if (product.foodData?.nutrition || product.nutriments) {
      const nutrition = product.foodData?.nutrition || product.nutriments;
      
      // Calcul simplifié du Nutri-Score
      let score = 0;
      
      // Points négatifs
      if (nutrition.energy_100g > 3350) score += 10;
      else if (nutrition.energy_100g > 3015) score += 9;
      else if (nutrition.energy_100g > 2680) score += 8;
      else if (nutrition.energy_100g > 2345) score += 7;
      else if (nutrition.energy_100g > 2010) score += 6;
      else if (nutrition.energy_100g > 1675) score += 5;
      else if (nutrition.energy_100g > 1340) score += 4;
      else if (nutrition.energy_100g > 1005) score += 3;
      else if (nutrition.energy_100g > 670) score += 2;
      else if (nutrition.energy_100g > 335) score += 1;
      
      if (nutrition.sugars_100g > 45) score += 10;
      else if (nutrition.sugars_100g > 40) score += 9;
      else if (nutrition.sugars_100g > 36) score += 8;
      else if (nutrition.sugars_100g > 31) score += 7;
      else if (nutrition.sugars_100g > 27) score += 6;
      else if (nutrition.sugars_100g > 22.5) score += 5;
      else if (nutrition.sugars_100g > 18) score += 4;
      else if (nutrition.sugars_100g > 13.5) score += 3;
      else if (nutrition.sugars_100g > 9) score += 2;
      else if (nutrition.sugars_100g > 4.5) score += 1;
      
      // Conversion score -> grade
      let grade = 'C'; // Fallback par défaut
      if (score <= -1) grade = 'A';
      else if (score <= 2) grade = 'B';
      else if (score <= 10) grade = 'C';
      else if (score <= 18) grade = 'D';
      else grade = 'E';
      
      return { grade, score, method: 'calculated' };
    }
    
    // Fallback conservateur
    return { 
      grade: 'C', 
      score: null, 
      method: 'fallback',
      reason: 'Données nutritionnelles manquantes'
    };
  }

  /**
   * Analyse Eco-Score avec fallback
   */
  analyzeEcoScore(product, ingredientsText) {
    // Si mention bio explicite
    const lowerText = ingredientsText.toLowerCase();
    const hasBio = /\b(bio|biologique|organic|agriculture biologique)\b/.test(lowerText);
    
    if (hasBio) {
      return { 
        grade: 'B', 
        method: 'detected',
        reason: 'Mention bio détectée'
      };
    }
    
    // Fallback conservateur
    return { 
      grade: 'C', 
      method: 'fallback',
      reason: 'Pas assez d\'informations environnementales'
    };
  }

  /**
   * Calcule le score de santé global
   */
  calculateHealthScore(novaAnalysis, nutriscoreAnalysis) {
    const novaScores = { 1: 90, 2: 75, 3: 55, 4: 30 };
    const nutriScores = { 'A': 90, 'B': 75, 'C': 50, 'D': 30, 'E': 10 };
    
    const novaScore = novaScores[novaAnalysis.nova] || 50;
    const nutriScore = nutriScores[nutriscoreAnalysis.grade] || 50;
    
    // Pondération : NOVA 60%, Nutri-Score 40%
    return Math.round(novaScore * 0.6 + nutriScore * 0.4);
  }

  /**
   * Calcule le score environnemental
   */
  calculateEnvironmentScore(ecoscoreAnalysis, product) {
    const ecoScores = { 'A': 90, 'B': 75, 'C': 50, 'D': 30, 'E': 10 };
    return ecoScores[ecoscoreAnalysis.grade] || 50;
  }

  /**
   * Calcule la confiance globale
   */
  calculateConfidence(novaAnalysis, nutriscoreAnalysis, ecoscoreAnalysis) {
    const confidences = [novaAnalysis.confidence];
    
    if (nutriscoreAnalysis.method === 'calculated') {
      confidences.push(0.9);
    } else {
      confidences.push(0.5);
    }
    
    if (ecoscoreAnalysis.method === 'detected') {
      confidences.push(0.8);
    } else {
      confidences.push(0.4);
    }
    
    // Moyenne des confiances
    return confidences.reduce((a, b) => a + b, 0) / confidences.length;
  }

  /**
   * Génère des recommandations
   */
  generateRecommendations(novaAnalysis, healthScore) {
    const recommendations = [];
    
    if (novaAnalysis.nova === 4) {
      recommendations.push('⚠️ Produit ultra-transformé : à limiter dans votre alimentation');
      recommendations.push('💡 Privilégiez des alternatives moins transformées');
    } else if (novaAnalysis.nova === 3) {
      recommendations.push('⚡ Produit transformé : à consommer avec modération');
    } else if (novaAnalysis.nova <= 2) {
      recommendations.push('✅ Bon choix : produit peu transformé');
    }
    
    if (healthScore < 40) {
      recommendations.push('🔴 Score santé faible : cherchez des alternatives plus saines');
    } else if (healthScore > 70) {
      recommendations.push('🟢 Excellent score santé : à privilégier');
    }
    
    return recommendations;
  }
}

module.exports = new FoodAnalyzer();