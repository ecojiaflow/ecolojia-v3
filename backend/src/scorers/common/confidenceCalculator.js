// src/scorers/common/confidenceCalculator.js
/**
 * Ã°Å¸Å½Â¯ ECOLOJIA ConfidenceCalculator Unifie v2.0
 * Calcule score de confiance global (0-1) pour TOUS types de produits
 * Compatible : Food, Cosmetic, Detergent
 */

class ConfidenceCalculator {
  
  /**
   * Ã°Å¸Â§Â® Calcul principal unifie
   * @param {Object} factors - Facteurs de confiance selon type produit
   * @param {string} productType - 'food', 'cosmetic', 'detergent'
   * @returns {number} Score 0-1
   */
  calculate(factors, productType = 'food') {
    try {
      let confidence = 0.2; // Base minimum pour tous
      
      // === FACTEURS COMMUNS â‚¬ TOUS PRODUITS ===
      
      // Presence d'ingredients/composition
      if (factors.hasIngredients || factors.hasComposition) {
        confidence += 0.3;
      }
      
      // Qualite du nom produit
      if (factors.productName && factors.productName.length > 3) {
        confidence += 0.1;
        
        // Bonus mots-cles specifiques selon type
        const keywordBonus = this.getKeywordBonus(factors.productName, productType);
        confidence += keywordBonus;
      }
      
      // Nombre d'ingredients (plus = mieux)
      if (factors.ingredientsCount) {
        if (factors.ingredientsCount >= 5) confidence += 0.15;
        else if (factors.ingredientsCount >= 3) confidence += 0.1;
        else if (factors.ingredientsCount >= 1) confidence += 0.05;
      }
      
      // === FACTEURS SPâ€°CIFIQUES PAR TYPE ===
      
      switch (productType) {
        case 'food':
          confidence += this.calculateFoodSpecificConfidence(factors);
          break;
          
        case 'cosmetic':
          confidence += this.calculateCosmeticSpecificConfidence(factors);
          break;
          
        case 'detergent':
          confidence += this.calculateDetergentSpecificConfidence(factors);
          break;
      }
      
      // Plafonnement et arrondi
      return Math.min(1.0, Math.round(confidence * 100) / 100);
      
    } catch (error) {
      console.error(`Erreur calcul confiance ${productType}:`, error);
      return 0.1; // Confiance minimum si erreur
    }
  }
  
  /**
   * Ã°Å¸ÂÅ½ Confiance specifique alimentaire
   */
  calculateFoodSpecificConfidence(factors) {
    let foodConfidence = 0;
    
    // Donnees nutritionnelles
    if (factors.hasNutriments) foodConfidence += 0.2;
    
    // Confiance analyses specialisees
    if (factors.novaConfidence) {
      foodConfidence += factors.novaConfidence * 0.15;
    }
    
    if (factors.additivesConfidence) {
      foodConfidence += factors.additivesConfidence * 0.15;
    }
    
    // Code-barres ou marque connue
    if (factors.hasBarcode || factors.knownBrand) {
      foodConfidence += 0.1;
    }
    
    return foodConfidence;
  }
  
  /**
   * Ã°Å¸Â§Â´ Confiance specifique cosmetique
   */
  calculateCosmeticSpecificConfidence(factors) {
    let cosmeticConfidence = 0;
    
    // Liste INCI complete
    if (factors.hasInciList) cosmeticConfidence += 0.2;
    
    // Categorie produit identifiee
    if (factors.hasCategory) cosmeticConfidence += 0.1;
    
    // Marque cosmetique connue
    if (factors.knownCosmeticBrand) cosmeticConfidence += 0.1;
    
    // Certifications detectees
    if (factors.certifications && factors.certifications.length > 0) {
      cosmeticConfidence += Math.min(0.15, factors.certifications.length * 0.05);
    }
    
    return cosmeticConfidence;
  }
  
  /**
   * Ã°Å¸Â§Â½ Confiance specifique detergent
   */
  calculateDetergentSpecificConfidence(factors) {
    let detergentConfidence = 0;
    
    // Type de detergent identifie
    if (factors.detergentType) detergentConfidence += 0.1;
    
    // Certifications ecologiques
    if (factors.ecoLabels && factors.ecoLabels.length > 0) {
      detergentConfidence += Math.min(0.2, factors.ecoLabels.length * 0.07);
    }
    
    // Ingredients reconnus dans base REACH
    if (factors.reachIngredientsRatio) {
      detergentConfidence += factors.reachIngredientsRatio * 0.15;
    }
    
    return detergentConfidence;
  }
  
  /**
   * Ã°Å¸â€Â Bonus mots-cles selon type produit
   */
  getKeywordBonus(productName, productType) {
    const name = productName.toLowerCase();
    
    const keywords = {
      food: ['bio', 'organic', 'naturel', 'sans additif', 'fait maison', 'artisanal'],
      cosmetic: ['creme', 'shampoing', 'gel', 'lotion', 'serum', 'masque', 'soin'],
      detergent: ['lessive', 'detergent', 'nettoyant', 'liquide vaisselle', 'savon', 'desinfectant']
    };
    
    const relevantKeywords = keywords[productType] || [];
    const matchCount = relevantKeywords.filter(keyword => name.includes(keyword)).length;
    
    return Math.min(0.1, matchCount * 0.02); // Max 0.1 bonus
  }
  
  /**
   * Ã°Å¸â€œÅ  Interpretation textuelle du score (uniformisee)
   * @param {number} confidence - Score 0-1
   * @returns {string} Interpretation
   */
  getInterpretation(confidence) {
    if (confidence >= 0.8) return 'Tres fiable';
    if (confidence >= 0.6) return 'Fiable';
    if (confidence >= 0.4) return 'Moderement fiable';
    return 'Peu fiable';
  }
  
  /**
   * Ã¢Å“â€¦ Determine si publication autorisee (seuil unifie)
   * @param {number} confidence - Score 0-1
   * @returns {boolean} Autorisation publication
   */
  isPublishable(confidence) {
    return confidence >= 0.4; // Seuil minimum unifie pour tous types
  }
  
  /**
   * Ã°Å¸Å½Â¯ Methode helper pour DetergentScorer (compatibilite)
   * @param {number} ingredientsCount - Nombre d'ingredients
   * @param {string} productName - Nom du produit
   * @param {string} productType - Type de produit
   * @returns {number} Score confiance
   */
  calculateConfidence(ingredientsCount, productName, productType = 'detergent') {
    const factors = {
      hasIngredients: ingredientsCount > 0,
      ingredientsCount,
      productName,
      // Pour detergents, on assume une reconnaissance REACH de base
      reachIngredientsRatio: Math.min(1.0, ingredientsCount / 5)
    };
    
    return this.calculate(factors, productType);
  }
}

// Export de la CLASSE pour utilisation uniforme
module.exports = ConfidenceCalculator;
