// backend/src/services/analysis/cosmeticAnalyzer.js

const { inciDatabase } = require('../../data/inciDatabase');
const { endocrineDisruptors } = require('../../data/endocrineDisruptors');

class CosmeticAnalyzer {
  constructor() {
    this.inciDb = inciDatabase;
    this.disruptors = endocrineDisruptors;
  }

  /**
   * Analyse complete d'un produit cosmetique
   */
  async analyzeProduct(product) {
    try {
      const ingredients = this.parseINCI(product.ingredients);
      
      // Scores principaux
      const safetyScore = this.calculateSafetyScore(ingredients);
      const naturalnessScore = this.calculateNaturalnessScore(ingredients);
      const effectivenessScore = this.calculateEffectivenessScore(ingredients, product.category);
      
      // Details d'analyse
      const concerns = this.detectConcerns(ingredients);
      const allergens = this.detectAllergens(ingredients);
      const certifications = this.validateCertifications(product.labels);
      
      // Recommandations
      const skinTypes = this.recommendSkinTypes(ingredients, product.category);
      const warnings = this.generateWarnings(concerns, allergens);
      
      return {
        scores: {
          safety: safetyScore,
          naturalness: naturalnessScore,
          effectiveness: effectivenessScore,
          overall: Math.round((safetyScore + naturalnessScore + effectivenessScore) / 3)
        },
        details: {
          inci: ingredients,
          concerns: concerns,
          allergens: allergens,
          certifications: certifications,
          pao: this.extractPAO(product) // Period After Opening
        },
        recommendations: {
          skinTypes: skinTypes,
          warnings: warnings,
          alternatives: await this.findAlternatives(product, safetyScore)
        },
        analysis: {
          totalIngredients: ingredients.length,
          naturalIngredients: ingredients.filter(i => i.natural).length,
          syntheticIngredients: ingredients.filter(i => !i.natural).length,
          concerningIngredients: concerns.length
        }
      };
    } catch (error) {
      console.error('Cosmetic analysis error:', error);
      throw new Error('Erreur lors de l\'analyse du produit cosmetique');
    }
  }

  /**
   * Parse la liste INCI et enrichit avec notre base de donnees
   */
  parseINCI(ingredientsList) {
    if (!ingredientsList || typeof ingredientsList !== 'string') {
      return [];
    }

    // Nettoyer et separer les ingredients
    const ingredients = ingredientsList
      .replace(/\([^)]*\)/g, '') // Retirer les parentheses
      .split(/[,;]/)
      .map(ing => ing.trim())
      .filter(ing => ing.length > 0);

    return ingredients.map((name, index) => {
      const dbIngredient = this.findInDatabase(name);
      
      return {
        name: name,
        inci: dbIngredient?.inci || name.toUpperCase(),
        position: index + 1,
        concentration: this.estimateConcentration(index, ingredients.length),
        ...dbIngredient,
        concerns: this.getIngredientConcerns(dbIngredient)
      };
    });
  }

  /**
   * Recherche un ingredient dans la base de donnees
   */
  findInDatabase(ingredientName) {
    const normalized = this.normalizeIngredientName(ingredientName);
    
    return this.inciDb.find(ing => 
      this.normalizeIngredientName(ing.name) === normalized ||
      this.normalizeIngredientName(ing.inci) === normalized ||
      ing.synonyms?.some(syn => this.normalizeIngredientName(syn) === normalized)
    );
  }

  /**
   * Normalise les noms d'ingredients pour la comparaison
   */
  normalizeIngredientName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/extract$/i, '')
      .replace(/oil$/i, '');
  }

  /**
   * Calcule le score de securite (0-100)
   */
  calculateSafetyScore(ingredients) {
    let score = 100;
    
    ingredients.forEach(ing => {
      // Perturbateurs endocriniens
      if (this.isEndocrineDisruptor(ing)) {
        score -= 15;
      }
      
      // Allergenes
      if (ing.allergen) {
        score -= 5;
      }
      
      // Irritants
      if (ing.irritant) {
        score -= ing.irritant === 'high' ? 10 : 5;
      }
      
      // CMR (Cancerigene, Mutagene, Reprotoxique)
      if (ing.cmr) {
        score -= 20;
      }
      
      // Nano-particules
      if (ing.nano) {
        score -= 10;
      }
    });
    
    return Math.max(0, Math.round(score));
  }

  /**
   * Calcule le score de naturalite (0-100)
   */
  calculateNaturalnessScore(ingredients) {
    if (ingredients.length === 0) return 0;
    
    const naturalCount = ingredients.filter(ing => ing.natural).length;
    const syntheticCount = ingredients.filter(ing => !ing.natural && !ing.mineral).length;
    const mineralCount = ingredients.filter(ing => ing.mineral).length;
    
    // Ponderation : naturel 100%, mineral 50%, synthetique 0%
    const weightedScore = (
      (naturalCount * 100) + 
      (mineralCount * 50) + 
      (syntheticCount * 0)
    ) / ingredients.length;
    
    return Math.round(weightedScore);
  }

  /**
   * Calcule le score d'efficacite base sur les actifs
   */
  calculateEffectivenessScore(ingredients, category) {
    let score = 70; // Score de base
    
    // Bonus pour les actifs reconnus selon la categorie
    const categoryActives = this.getCategoryActives(category);
    
    ingredients.forEach((ing, index) => {
      if (categoryActives.includes(ing.function)) {
        // Plus l'actif est haut dans la liste, plus il est concentre
        const positionBonus = Math.max(0, 20 - index * 2);
        score += positionBonus;
      }
    });
    
    return Math.min(100, Math.round(score));
  }

  /**
   * Detecte les ingredients preoccupants
   */
  detectConcerns(ingredients) {
    const concerns = [];
    
    ingredients.forEach(ing => {
      if (this.isEndocrineDisruptor(ing)) {
        concerns.push({
          ingredient: ing.name,
          type: 'endocrine_disruptor',
          severity: 'high',
          description: 'Perturbateur endocrinien suspecte'
        });
      }
      
      if (ing.cmr) {
        concerns.push({
          ingredient: ing.name,
          type: 'cmr',
          severity: 'critical',
          description: 'Substance CMR (Cancerigene, Mutagene ou Reprotoxique)'
        });
      }
      
      if (ing.nano) {
        concerns.push({
          ingredient: ing.name,
          type: 'nano',
          severity: 'medium',
          description: 'Contient des nano-particules'
        });
      }
      
      if (ing.environmental_hazard) {
        concerns.push({
          ingredient: ing.name,
          type: 'environmental',
          severity: 'medium',
          description: 'Impact environnemental negatif'
        });
      }
    });
    
    return concerns;
  }

  /**
   * Detecte les allergenes
   */
  detectAllergens(ingredients) {
    return ingredients
      .filter(ing => ing.allergen)
      .map(ing => ({
        ingredient: ing.name,
        type: ing.allergen_type || 'contact',
        severity: ing.allergen_severity || 'medium'
      }));
  }

  /**
   * Verifie si un ingredient est un perturbateur endocrinien
   */
  isEndocrineDisruptor(ingredient) {
    return this.disruptors.some(disruptor => 
      this.normalizeIngredientName(ingredient.name) === this.normalizeIngredientName(disruptor.name) ||
      ingredient.cas === disruptor.cas
    );
  }

  /**
   * Estime la concentration d'un ingredient selon sa position
   */
  estimateConcentration(position, totalIngredients) {
    if (position === 0) return 'high';
    if (position < 5) return 'medium';
    if (position < totalIngredients * 0.5) return 'low';
    return 'trace';
  }

  /**
   * Recommande les types de peau adaptes
   */
  recommendSkinTypes(ingredients, category) {
    const skinTypes = {
      all: true,
      sensitive: true,
      dry: true,
      oily: true,
      combination: true,
      acneic: true
    };
    
    // Analyse pour peau sensible
    if (ingredients.some(ing => ing.irritant === 'high' || ing.allergen)) {
      skinTypes.sensitive = false;
    }
    
    // Analyse pour peau grasse/acneique
    if (ingredients.some(ing => ing.comedogenic > 3)) {
      skinTypes.oily = false;
      skinTypes.acneic = false;
    }
    
    // Si un type est exclu, ce n'est pas pour tous
    if (Object.values(skinTypes).some(v => !v)) {
      skinTypes.all = false;
    }
    
    return Object.entries(skinTypes)
      .filter(([_, suitable]) => suitable)
      .map(([type, _]) => type);
  }

  /**
   * Genere les avertissements
   */
  generateWarnings(concerns, allergens) {
    const warnings = [];
    
    if (concerns.some(c => c.severity === 'critical')) {
      warnings.push({
        level: 'danger',
        message: 'Ce produit contient des substances tres preoccupantes'
      });
    }
    
    if (concerns.filter(c => c.type === 'endocrine_disruptor').length > 2) {
      warnings.push({
        level: 'warning',
        message: 'Plusieurs perturbateurs endocriniens detectes'
      });
    }
    
    if (allergens.length > 0) {
      warnings.push({
        level: 'info',
        message: `${allergens.length} allergene(s) potentiel(s) detecte(s)`
      });
    }
    
    return warnings;
  }

  /**
   * Extrait la PAO (Period After Opening)
   */
  extractPAO(product) {
    // Recherche dans les metadonnees ou le texte
    const paoMatch = product.description?.match(/(\d+)M/i);
    return paoMatch ? parseInt(paoMatch[1]) : 12; // 12 mois par defaut
  }

  /**
   * Trouve des alternatives plus sures
   */
  async findAlternatives(product, currentScore) {
    // TODO: Implementer la recherche d'alternatives dans la base de donnees
    // Pour l'instant, retourne un tableau vide
    return [];
  }

  /**
   * Retourne les actifs pertinents selon la categorie
   */
  getCategoryActives(category) {
    const actives = {
      'face_cream': ['moisturizer', 'anti-aging', 'antioxidant'],
      'cleanser': ['surfactant', 'cleansing'],
      'serum': ['active', 'anti-aging', 'brightening'],
      'sunscreen': ['uv_filter', 'antioxidant'],
      'shampoo': ['surfactant', 'conditioning'],
      'makeup': ['colorant', 'coverage']
    };
    
    return actives[category] || [];
  }

  /**
   * Obtient les preoccupations specifiques d'un ingredient
   */
  getIngredientConcerns(ingredient) {
    if (!ingredient) return [];
    
    const concerns = [];
    
    if (ingredient.irritant) {
      concerns.push(`Irritant (${ingredient.irritant})`);
    }
    
    if (ingredient.allergen) {
      concerns.push('Allergene potentiel');
    }
    
    if (ingredient.comedogenic > 2) {
      concerns.push(`Comedogene (${ingredient.comedogenic}/5)`);
    }
    
    return concerns;
  }

  /**
   * Valide les certifications
   */
  validateCertifications(labels) {
    const validCertifications = [
      'cosmos_organic',
      'cosmos_natural', 
      'ecocert',
      'natrue',
      'bdih',
      'leaping_bunny',
      'cruelty_free',
      'vegan'
    ];
    
    return labels?.filter(label => validCertifications.includes(label)) || [];
  }
}

module.exports = CosmeticAnalyzer;
