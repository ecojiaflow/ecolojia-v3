/**
 * Service de calcul de complétude des données produit
 * AJOUTE des métadonnées SANS modifier le scoring existant
 */

class DataCompletenessService {
  
  /**
   * Calcule le pourcentage de données disponibles (0-100%)
   */
  calculateCompleteness(product) {
    if (!product) return 0;
    
    let score = 0;
    
    // Données basiques (20 points)
    if (product.barcode) score += 5;
    if (product.name) score += 5;
    if (product.brand) score += 5;
    if (product.imageUrl) score += 5;
    
    // Données spécifiques catégorie (80 points)
    switch(product.category) {
      case 'food':
        score += this._calculateFoodCompleteness(product.foodData);
        break;
      case 'cosmetics':
        score += this._calculateCosmeticCompleteness(product.cosmeticData);
        break;
      case 'detergents':
        score += this._calculateDetergentCompleteness(product.detergentData);
        break;
    }
    
    return Math.round(Math.min(100, score));
  }
  
  _calculateFoodCompleteness(foodData) {
    if (!foodData) return 0;
    
    let score = 0;
    
    if (foodData.novaGroup !== undefined) score += 20;
    if (foodData.nutriScore) score += 20;
    if (foodData.ecoScore !== undefined) score += 15;
    if (foodData.ingredients && foodData.ingredients.length > 0) score += 10;
    if (foodData.additives !== undefined) score += 5;
    if (foodData.allergens !== undefined) score += 5;
    if (foodData.origin) score += 5;
    
    return score;
  }
  
  _calculateCosmeticCompleteness(cosmeticData) {
    if (!cosmeticData) return 0;
    
    let score = 0;
    
    if (cosmeticData.ingredients && cosmeticData.ingredients.length > 0) {
      score += 40;
    }
    
    if (cosmeticData.endocrineDisruptors !== undefined) score += 20;
    if (cosmeticData.certifications && cosmeticData.certifications.length > 0) score += 10;
    if (cosmeticData.allergens !== undefined) score += 10;
    
    return score;
  }
  
  _calculateDetergentCompleteness(detergentData) {
    if (!detergentData) return 0;
    
    let score = 0;
    
    if (detergentData.surfactants && detergentData.surfactants.length > 0) score += 30;
    if (detergentData.biodegradability) score += 25;
    if (detergentData.aquaticImpact) score += 15;
    if (detergentData.phosphates !== undefined) score += 10;
    
    return score;
  }
  
  /**
   * Calcule la confiance dans le score (0-100%)
   */
  calculateScoreConfidence(product) {
    if (!product) return 0;
    
    const completeness = this.calculateCompleteness(product);
    let confidence = completeness;
    
    // Pénalité si données obsolètes
    if (product.updatedAt) {
      const monthsOld = Math.floor(
        (Date.now() - new Date(product.updatedAt)) / (1000 * 60 * 60 * 24 * 30)
      );
      
      if (monthsOld > 6) {
        confidence -= Math.min(20, monthsOld * 2);
      }
    }
    
    return Math.max(0, Math.min(100, Math.round(confidence)));
  }
  
  /**
   * Génère warnings basés sur données manquantes
   */
  generateWarnings(product) {
    if (!product) return [];
    
    const warnings = [];
    const completeness = this.calculateCompleteness(product);
    
    if (completeness < 70) {
      warnings.push('partial_data');
    }
    
    if (product.category === 'food' && product.foodData) {
      if (!product.foodData.origin) {
        warnings.push('missing_origin');
      }
      
      if (product.updatedAt) {
        const monthsOld = Math.floor(
          (Date.now() - new Date(product.updatedAt)) / (1000 * 60 * 60 * 24 * 30)
        );
        if (monthsOld > 6) {
          warnings.push('outdated_data');
        }
      }
    }
    
    if (product.category === 'cosmetics') {
      if (!product.cosmeticData || !product.cosmeticData.ingredients || product.cosmeticData.ingredients.length === 0) {
        warnings.push('no_inci');
      }
    }
    
    if (product.category === 'detergents') {
      if (!product.detergentData || !product.detergentData.biodegradability) {
        warnings.push('missing_biodegradability');
      }
    }
    
    return warnings;
  }
}

module.exports = new DataCompletenessService();
