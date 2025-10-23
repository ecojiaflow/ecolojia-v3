// backend/src/services/analysis/novaClassifier.js
// Classification NOVA : de 1 (non transforme) Â  4 (ultra-transforme)

class NovaClassifier {
  constructor() {
    // Marqueurs d'ultra-transformation
    this.ultraProcessedMarkers = [
      // Additifs cosmetiques
      'e102', 'e104', 'e110', 'e122', 'e124', 'e129', 'e131', 'e132', 'e133',
      'e142', 'e150c', 'e150d', 'e151', 'e154', 'e155', 'e160b', 'e160c',
      
      // â€°dulcorants
      'e950', 'e951', 'e952', 'e954', 'e955', 'e960', 'e961', 'e962',
      'aspartame', 'acesulfame', 'sucralose', 'saccharine',
      
      // Exhausteurs de gout
      'e620', 'e621', 'e622', 'e623', 'e624', 'e625', 'e626', 'e627', 'e628',
      'e629', 'e630', 'e631', 'e632', 'e633', 'e634', 'e635',
      'glutamate', 'msg',
      
      // â€°mulsifiants
      'e322', 'e471', 'e472a', 'e472b', 'e472c', 'e472d', 'e472e', 'e472f',
      'e473', 'e474', 'e475', 'e476', 'e477', 'e481', 'e482',
      
      // Ingredients ultra-transformes
      'sirop de glucose', 'sirop de fructose', 'sirop de mais',
      'maltodextrine', 'dextrose', 'amidon modifie',
      'huile hydrogenee', 'huile partiellement hydrogenee',
      'isolat de proteine', 'caseine', 'whey',
      'arome', 'arome naturel', 'arome artificiel'
    ];
    
    // Ingredients minimalement transformes (NOVA 1-2)
    this.minimallyProcessed = [
      'eau', 'lait', 'Ã…â€œuf', 'farine', 'sucre', 'sel', 'huile', 'beurre',
      'viande', 'poisson', 'fruits', 'legumes', 'cereales', 'legumineuses',
      'noix', 'graines', 'herbes', 'epices', 'cafe', 'the', 'cacao'
    ];
  }
  
  /**
   * Classifie un produit selon NOVA
   * @param {Object} product - Produit avec ingredients
   * @returns {Object} Classification NOVA detaillee
   */
  classify(product) {
    if (!product.ingredients) {
      return {
        group: null,
        confidence: 0,
        reason: 'Pas d\'ingredients disponibles'
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
        label: 'Ultra-transforme',
        reason: `Contient des marqueurs d'ultra-transformation: ${ultraProcessedFound.join(', ')}`,
        markers: ultraProcessedFound,
        healthImpact: 'â‚¬ limiter - Associe Â  des risques pour la sante'
      };
    }
    
    // Ratio ingredients transformes vs minimaux
    const totalIngredients = processedIngredients + minimalIngredients;
    const processedRatio = totalIngredients > 0 ? processedIngredients / totalIngredients : 0;
    
    if (processedRatio > 0.7) {
      return {
        group: 3,
        confidence: 0.8,
        label: 'Transforme',
        reason: 'Majorite d\'ingredients transformes',
        healthImpact: 'â‚¬ consommer avec moderation'
      };
    }
    
    if (processedRatio > 0.3) {
      return {
        group: 2,
        confidence: 0.8,
        label: 'Transforme culinaire',
        reason: 'Transformation culinaire simple',
        healthImpact: 'Acceptable dans une alimentation equilibree'
      };
    }
    
    // Produit peu ou pas transforme
    return {
      group: 1,
      confidence: 0.85,
      label: 'Non transforme ou minimalement transforme',
      reason: 'Ingredients naturels ou peu transformes',
      healthImpact: 'â‚¬ privilegier pour une alimentation saine'
    };
  }
  
  detectUltraProcessedMarkers(ingredients, additives) {
    const found = [];
    
    // Verifier dans les ingredients texte
    for (const marker of this.ultraProcessedMarkers) {
      if (ingredients.includes(marker)) {
        found.push(marker);
      }
    }
    
    // Verifier dans les tags d'additifs
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
      'modifie', 'hydrogene', 'raffine', 'concentre', 'isolat',
      'hydrolyse', 'esterifie', 'malte', 'instantane'
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
   * Obtenir des recommandations basees sur NOVA
   */
  getRecommendations(novaGroup) {
    const recommendations = {
      1: {
        message: 'Excellent choix ! Produit non transforme.',
        tips: [
          'Privilegiez ces aliments dans votre alimentation',
          'Base ideale pour des repas sains'
        ]
      },
      2: {
        message: 'Bon choix. Transformation culinaire acceptable.',
        tips: [
          'â‚¬ utiliser pour cuisiner des plats maison',
          'Verifiez les quantites de sel/sucre ajoutes'
        ]
      },
      3: {
        message: 'â‚¬ consommer avec moderation.',
        tips: [
          'Limitez Â  2-3 portions par semaine',
          'Cherchez des alternatives moins transformees',
          'Lisez bien la liste des ingredients'
        ]
      },
      4: {
        message: 'â‚¬ eviter autant que possible.',
        tips: [
          'Reservez pour les occasions exceptionnelles',
          'Remplacez par des alternatives maison',
          'Risque accru d\'obesite, diabete et maladies cardiovasculaires'
        ],
        alternatives: [
          'Preparez vos propres collations',
          'Choisissez des produits NOVA 1-2',
          'Optez pour des marques bio/artisanales'
        ]
      }
    };
    
    return recommendations[novaGroup] || { message: 'Classification non disponible' };
  }
}

module.exports = new NovaClassifier();
