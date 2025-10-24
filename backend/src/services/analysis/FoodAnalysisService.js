// backend/src/services/analysis/FoodAnalyzer.js
// Service d'analyse alimentaire complet

const novaClassifier = require('./novaClassifier');
const nutriscoreCalculator = require('./nutriscoreCalculator');
const mongoose = require('mongoose');

class FoodAnalyzer {
  constructor() {
    // Base de données d'additifs controversés
    this.controversialAdditives = {
      'e102': { name: 'Tartrazine', risk: 'high', effects: ['Hyperactivité', 'Allergies'] },
      'e110': { name: 'Sunset Yellow', risk: 'high', effects: ['Hyperactivité', 'Allergies'] },
      'e124': { name: 'Ponceau 4R', risk: 'high', effects: ['Hyperactivité', 'Allergies'] },
      'e211': { name: 'Benzoate de sodium', risk: 'medium', effects: ['Hyperactivité'] },
      'e320': { name: 'BHA', risk: 'high', effects: ['Cancérogène possible'] },
      'e321': { name: 'BHT', risk: 'high', effects: ['Cancérogène possible'] },
      'e621': { name: 'Glutamate monosodique', risk: 'medium', effects: ['Maux de tête', 'Nausées'] },
      'e951': { name: 'Aspartame', risk: 'medium', effects: ['Controverse'] },
      'e954': { name: 'Saccharine', risk: 'medium', effects: ['Cancérogène possible'] }
    };
    
    // Allergènes majeurs (réglementation EU)
    this.majorAllergens = {
      'gluten': ['blé', 'seigle', 'orge', 'avoine', 'épeautre', 'kamut'],
      'crustacés': ['crevette', 'homard', 'crabe', 'langouste', 'écrevisse'],
      'Å“ufs': ['Å“uf', 'albumine', 'ovalbumine', 'lysozyme'],
      'poissons': ['poisson', 'anchois', 'saumon', 'thon', 'cabillaud'],
      'arachides': ['arachide', 'cacahuète', 'huile d\'arachide'],
      'soja': ['soja', 'lécithine de soja', 'protéine de soja'],
      'lait': ['lait', 'lactose', 'caséine', 'lactosérum', 'beurre', 'crème'],
      'fruits Ã  coque': ['amande', 'noisette', 'noix', 'cajou', 'pécan', 'pistache'],
      'céleri': ['céleri', 'céleri-rave'],
      'moutarde': ['moutarde', 'graines de moutarde'],
      'sésame': ['sésame', 'huile de sésame', 'tahini'],
      'sulfites': ['sulfite', 'bisulfite', 'métabisulfite', 'e220', 'e228'],
      'lupin': ['lupin', 'farine de lupin'],
      'mollusques': ['huître', 'moule', 'coquille', 'escargot', 'poulpe']
    };
  }
  
  /**
   * Analyse complète d'un produit alimentaire
   * @param {string|object} dataOrBarcode - Soit un barcode string, soit un objet avec les données
   * @param {string} userId - ID de l'utilisateur
   */
  async analyze(dataOrBarcode, userId) {
    try {
      let product = null;
      let isManualAnalysis = false;
      
      // Si c'est un objet avec des données (analyse manuelle)
      if (typeof dataOrBarcode === 'object' && dataOrBarcode !== null) {
        console.log('Analyse manuelle avec données:', dataOrBarcode.name);
        isManualAnalysis = true;
        product = dataOrBarcode; // Utiliser directement les données fournies
        
      } 
      // Si c'est un barcode string
      else if (typeof dataOrBarcode === 'string') {
        console.log('Recherche par barcode:', dataOrBarcode);
        const Product = mongoose.model('Product');
        product = await Product.findOne({ barcode: dataOrBarcode });
        
        if (!product) {
          // Essayer de récupérer depuis Open Food Facts
          const offProduct = await this.fetchFromOpenFoodFacts(dataOrBarcode);
          if (!offProduct) {
            throw new Error('Produit non trouvé');
          }
          // Sauvegarder en base
          product = await this.saveProduct(offProduct);
        }
      } else {
        throw new Error('Format de données invalide pour l\'analyse');
      }
      
      // Analyses
      const novaAnalysis = novaClassifier.classify(product);
      const nutriscoreAnalysis = nutriscoreCalculator.calculate(product);
      const additivesAnalysis = this.analyzeAdditives(product);
      const allergensAnalysis = this.detectAllergens(product);
      const healthScore = this.calculateHealthScore(product, novaAnalysis, nutriscoreAnalysis, additivesAnalysis);
      
      // Ne sauvegarder l'analyse que si ce n'est pas manuel
      if (!isManualAnalysis && product._id) {
        const Analysis = mongoose.model('Analysis');
        const analysis = new Analysis({
          userId,
          productId: product._id,
          timestamp: new Date(),
          method: 'barcode',
          results: {
            category: 'food',
            scores: {
              nova: novaAnalysis.group,
              nutriscore: nutriscoreAnalysis.grade,
              ecoscore: product.ecoscore_grade || 'N/A',
              health: healthScore.score
            },
            summary: {
              fr: this.generateSummary(product, novaAnalysis, nutriscoreAnalysis, healthScore),
              en: 'Summary in English...' // TODO: Traduire
            },
            details: {
              nova: novaAnalysis,
              nutriscore: nutriscoreAnalysis,
              additives: additivesAnalysis,
              allergens: allergensAnalysis,
              nutritionFacts: product.nutritionFacts
            },
            recommendations: await this.generateRecommendations(product, healthScore)
          }
        });
        
        await analysis.save();
      }
      
      return {
        product: {
          name: product.name || 'Produit analysé',
          brand: product.brand,
          image: product.image_url,
          barcode: product.barcode
        },
        scores: {
          nova: novaAnalysis.group,
          nutriscore: nutriscoreAnalysis.grade,
          ecoscore: product.ecoscore_grade || 'N/A',
          health: healthScore.score
        },
        summary: this.generateSummary(product, novaAnalysis, nutriscoreAnalysis, healthScore),
        details: {
          nova: novaAnalysis,
          nutriscore: nutriscoreAnalysis,
          additives: additivesAnalysis,
          allergens: allergensAnalysis,
          nutritionFacts: product.nutritionFacts
        },
        recommendations: await this.generateRecommendations(product, healthScore)
      };
      
    } catch (error) {
      console.error('Erreur analyse alimentaire:', error);
      throw error;
    }
  }
  
  analyzeAdditives(product) {
    const additives = product.additives_tags || [];
    const analysis = {
      total: additives.length,
      controversial: [],
      safe: [],
      unknown: []
    };
    
    for (const additive of additives) {
      const code = additive.replace('en:', '').toLowerCase();
      
      if (this.controversialAdditives[code]) {
        analysis.controversial.push({
          code,
          ...this.controversialAdditives[code]
        });
      } else if (code.match(/^e[0-9]{3}[a-z]?$/)) {
        // Additif connu mais non controversé
        analysis.safe.push({ code, name: 'Additif autorisé' });
      } else {
        analysis.unknown.push({ code });
      }
    }
    
    return analysis;
  }
  
  detectAllergens(product) {
    const detected = [];
    const ingredients = (product.ingredients || '').toLowerCase();
    const allergenTags = product.allergens_tags || [];
    
    // Détection par tags
    for (const tag of allergenTags) {
      const allergen = tag.replace('en:', '');
      if (this.majorAllergens[allergen]) {
        detected.push({
          type: allergen,
          source: 'tag',
          severity: 'high'
        });
      }
    }
    
    // Détection dans les ingrédients
    for (const [allergen, keywords] of Object.entries(this.majorAllergens)) {
      if (detected.find(d => d.type === allergen)) continue;
      
      for (const keyword of keywords) {
        if (ingredients.includes(keyword)) {
          detected.push({
            type: allergen,
            source: 'ingredients',
            severity: 'high',
            keyword
          });
          break;
        }
      }
    }
    
    return {
      detected,
      count: detected.length,
      warning: detected.length > 0 ? 'Ce produit contient des allergènes' : null
    };
  }
  
  calculateHealthScore(product, novaAnalysis, nutriscoreAnalysis, additivesAnalysis) {
    let score = 50; // Score de base
    
    // Impact NOVA (30 points)
    const novaImpact = {
      1: 30,
      2: 20,
      3: 10,
      4: 0
    };
    score += novaImpact[novaAnalysis.group] || 0;
    
    // Impact Nutri-Score (30 points)
    const nutriImpact = {
      'A': 30,
      'B': 22,
      'C': 15,
      'D': 7,
      'E': 0
    };
    score += nutriImpact[nutriscoreAnalysis.grade] || 0;
    
    // Impact additifs (20 points)
    if (additivesAnalysis.controversial.length === 0) {
      score += 20;
    } else if (additivesAnalysis.controversial.length <= 2) {
      score += 10;
    }
    
    // Pénalités
    if (product.nutritionFacts?.sugars_100g > 15) score -= 5;
    if (product.nutritionFacts?.salt_100g > 1.5) score -= 5;
    if (product.nutritionFacts?.saturated_fat_100g > 5) score -= 5;
    
    // Bonus
    if (product.nutritionFacts?.fiber_100g > 6) score += 5;
    if (product.labels?.includes('bio')) score += 5;
    
    return {
      score: Math.max(0, Math.min(100, score)),
      factors: {
        nova: novaAnalysis.group,
        nutriscore: nutriscoreAnalysis.grade,
        additives: additivesAnalysis.controversial.length,
        sugar: product.nutritionFacts?.sugars_100g,
        salt: product.nutritionFacts?.salt_100g
      }
    };
  }
  
  generateSummary(product, novaAnalysis, nutriscoreAnalysis, healthScore) {
    const parts = [];
    
    // Score principal
    parts.push(`${product.name || 'Ce produit'} obtient un score santé de ${healthScore.score}/100.`);
    
    // NOVA
    if (novaAnalysis.group === 4) {
      parts.push(`âš ï¸ Produit ultra-transformé (NOVA ${novaAnalysis.group}).`);
    } else if (novaAnalysis.group <= 2) {
      parts.push(`âœ… Transformation minimale (NOVA ${novaAnalysis.group}).`);
    }
    
    // Nutri-Score
    if (['D', 'E'].includes(nutriscoreAnalysis.grade)) {
      parts.push(`âš ï¸ Qualité nutritionnelle faible (Nutri-Score ${nutriscoreAnalysis.grade}).`);
    } else if (['A', 'B'].includes(nutriscoreAnalysis.grade)) {
      parts.push(`âœ… Bonne qualité nutritionnelle (Nutri-Score ${nutriscoreAnalysis.grade}).`);
    }
    
    // Points d'attention
    if (healthScore.factors.sugar > 15) {
      parts.push(`ðŸ”´ Teneur élevée en sucre (${healthScore.factors.sugar}g/100g).`);
    }
    
    return parts.join(' ');
  }
  
  async generateRecommendations(product, healthScore) {
    const recommendations = {
      healthImpact: '',
      alternatives: [],
      advice: []
    };
    
    // Impact santé
    if (healthScore.score >= 70) {
      recommendations.healthImpact = 'Bon choix pour une alimentation équilibrée';
    } else if (healthScore.score >= 40) {
      recommendations.healthImpact = 'Ã€ consommer avec modération';
    } else {
      recommendations.healthImpact = 'Ã€ limiter dans votre alimentation';
    }
    
    // Conseils personnalisés
    if (healthScore.factors.nova === 4) {
      recommendations.advice.push('Privilégiez des alternatives moins transformées');
    }
    
    if (healthScore.factors.sugar > 15) {
      recommendations.advice.push('Attention Ã  la teneur en sucre, limitez la consommation');
    }
    
    // TODO: Chercher des alternatives dans la base
    
    return recommendations;
  }
  
  async fetchFromOpenFoodFacts(barcode) {
    try {
      const axios = require('axios');
      const response = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      
      if (response.data.status === 1) {
        return response.data.product;
      }
      return null;
    } catch (error) {
      console.error('Erreur Open Food Facts:', error);
      return null;
    }
  }
  
  async saveProduct(offProduct) {
    const Product = mongoose.model('Product');
    
    const productData = {
      barcode: offProduct.code,
      name: offProduct.product_name,
      brand: offProduct.brands,
      category: 'food',
      ingredients: offProduct.ingredients_text,
      nutritionFacts: {
        energy_100g: offProduct.nutriments?.['energy-kcal_100g'],
        fat_100g: offProduct.nutriments?.fat_100g,
        saturated_fat_100g: offProduct.nutriments?.['saturated-fat_100g'],
        carbohydrates_100g: offProduct.nutriments?.carbohydrates_100g,
        sugars_100g: offProduct.nutriments?.sugars_100g,
        proteins_100g: offProduct.nutriments?.proteins_100g,
        salt_100g: offProduct.nutriments?.salt_100g,
        fiber_100g: offProduct.nutriments?.fiber_100g
      },
      nutriscore_grade: offProduct.nutriscore_grade,
      nova_group: offProduct.nova_group,
      ecoscore_grade: offProduct.ecoscore_grade,
      additives_tags: offProduct.additives_tags || [],
      allergens_tags: offProduct.allergens_tags || [],
      labels: offProduct.labels_tags || [],
      image_url: offProduct.image_url,
      imported_from: 'openfoodfacts'
    };
    
    return await Product.create(productData);
  }
}

module.exports = FoodAnalyzer;