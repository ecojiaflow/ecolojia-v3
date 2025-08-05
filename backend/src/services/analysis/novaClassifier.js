// backend/src/services/analysis/novaClassifier.js
// Classification NOVA : de 1 (non transformé) à 4 (ultra-transformé)

class NovaClassifier {
  constructor() {
    // Marqueurs d'ultra-transformation
    this.ultraProcessedMarkers = [
      // Additifs cosmétiques
      'e102', 'e104', 'e110', 'e122', 'e124', 'e129', 'e131', 'e132', 'e133',
      'e142', 'e150c', 'e150d', 'e151', 'e154', 'e155', 'e160b', 'e160c',
      
      // Édulcorants
      'e950', 'e951', 'e952', 'e954', 'e955', 'e960', 'e961', 'e962',
      'aspartame', 'acesulfame', 'sucralose', 'saccharine',
      
      // Exhausteurs de goût
      'e620', 'e621', 'e622', 'e623', 'e624', 'e625', 'e626', 'e627', 'e628',
      'e629', 'e630', 'e631', 'e632', 'e633', 'e634', 'e635',
      'glutamate', 'msg',
      
      // Émulsifiants
      'e322', 'e471', 'e472a', 'e472b', 'e472c', 'e472d', 'e472e', 'e472f',
      'e473', 'e474', 'e475', 'e476', 'e477', 'e481', 'e482',
      
      // Ingrédients ultra-transformés
      'sirop de glucose', 'sirop de fructose', 'sirop de maïs',
      'maltodextrine', 'dextrose', 'amidon modifié',
      'huile hydrogénée', 'huile partiellement hydrogénée',
      'isolat de protéine', 'caséine', 'whey',
      'arôme', 'arôme naturel', 'arôme artificiel'
    ];
    
    // Ingrédients minimalement transformés (NOVA 1-2)
    this.minimallyProcessed = [
      'eau', 'lait', 'œuf', 'farine', 'sucre', 'sel', 'huile', 'beurre',
      'viande', 'poisson', 'fruits', 'légumes', 'céréales', 'légumineuses',
      'noix', 'graines', 'herbes', 'épices', 'café', 'thé', 'cacao'
    ];
  }
  
  /**
   * Classifie un produit selon NOVA
   * @param {Object} product - Produit avec ingredients
   * @returns {Object} Classification NOVA détaillée
   */
  classify(product) {
    if (!product.ingredients) {
      return {
        group: null,
        confidence: 0,
        reason: 'Pas d\'ingrédients disponibles'
      };
    }
    
    const ingredients = product.ingredients.toLowerCase();
    const additives = product.additives_tags || [];
    
    // Analyse des marqueurs
    const ultraProcessedFound = this.detectUltraProcessedMarkers(ingredients, additives);
    const processedIngredients = this.countProcessedIngredients(ingredients);
    const minimalIngredients = this.countMinimalIngredients(ingredients);
    
    // Logique de classification
    if (ultraProcessedFound.length > 0) {
      return {
        group: 4,
        confidence: 0.9,
        label: 'Ultra-transformé',
        reason: `Contient des marqueurs d'ultra-transformation: ${ultraProcessedFound.join(', ')}`,
        markers: ultraProcessedFound,
        healthImpact: 'À limiter - Associé à des risques pour la santé'
      };
    }
    
    // Ratio ingrédients transformés vs minimaux
    const totalIngredients = processedIngredients + minimalIngredients;
    const processedRatio = totalIngredients > 0 ? processedIngredients / totalIngredients : 0;
    
    if (processedRatio > 0.7) {
      return {
        group: 3,
        confidence: 0.8,
        label: 'Transformé',
        reason: 'Majorité d\'ingrédients transformés',
        healthImpact: 'À consommer avec modération'
      };
    }
    
    if (processedRatio > 0.3) {
      return {
        group: 2,
        confidence: 0.8,
        label: 'Transformé culinaire',
        reason: 'Transformation culinaire simple',
        healthImpact: 'Acceptable dans une alimentation équilibrée'
      };
    }
    
    // Produit peu ou pas transformé
    return {
      group: 1,
      confidence: 0.85,
      label: 'Non transformé ou minimalement transformé',
      reason: 'Ingrédients naturels ou peu transformés',
      healthImpact: 'À privilégier pour une alimentation saine'
    };
  }
  
  detectUltraProcessedMarkers(ingredients, additives) {
    const found = [];
    
    // Vérifier dans les ingrédients texte
    for (const marker of this.ultraProcessedMarkers) {
      if (ingredients.includes(marker)) {
        found.push(marker);
      }
    }
    
    // Vérifier dans les tags d'additifs
    for (const additive of additives) {
      const code = additive.replace('en:', '');
      if (this.ultraProcessedMarkers.includes(code)) {
        found.push(code);
      }
    }
    
    return [...new Set(found)]; // Retirer les doublons
  }
  
  countProcessedIngredients(ingredients) {
    const processed = [
      'modifié', 'hydrogéné', 'raffiné', 'concentré', 'isolat',
      'hydrolyse', 'estérifié', 'malté', 'instantané'
    ];
    
    let count = 0;
    for (const term of processed) {
      if (ingredients.includes(term)) count++;
    }
    return count;
  }
  
  countMinimalIngredients(ingredients) {
    let count = 0;
    for (const ingredient of this.minimallyProcessed) {
      if (ingredients.includes(ingredient)) count++;
    }
    return count;
  }
  
  /**
   * Obtenir des recommandations basées sur NOVA
   */
  getRecommendations(novaGroup) {
    const recommendations = {
      1: {
        message: 'Excellent choix ! Produit non transformé.',
        tips: [
          'Privilégiez ces aliments dans votre alimentation',
          'Base idéale pour des repas sains'
        ]
      },
      2: {
        message: 'Bon choix. Transformation culinaire acceptable.',
        tips: [
          'À utiliser pour cuisiner des plats maison',
          'Vérifiez les quantités de sel/sucre ajoutés'
        ]
      },
      3: {
        message: 'À consommer avec modération.',
        tips: [
          'Limitez à 2-3 portions par semaine',
          'Cherchez des alternatives moins transformées',
          'Lisez bien la liste des ingrédients'
        ]
      },
      4: {
        message: 'À éviter autant que possible.',
        tips: [
          'Réservez pour les occasions exceptionnelles',
          'Remplacez par des alternatives maison',
          'Risque accru d\'obésité, diabète et maladies cardiovasculaires'
        ],
        alternatives: [
          'Préparez vos propres collations',
          'Choisissez des produits NOVA 1-2',
          'Optez pour des marques bio/artisanales'
        ]
      }
    };
    
    return recommendations[novaGroup] || { message: 'Classification non disponible' };
  }
}

module.exports = new NovaClassifier();
