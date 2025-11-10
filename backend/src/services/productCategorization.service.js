const deepSeekService = require('./ai/deepSeekService');

/**
 * SERVICE IA CATÉGORISATION PRODUIT
 * Utilise DeepSeek pour analyser produit et suggérer catégories recettes
 */

class ProductCategorizationService {
  
  constructor() {
    this.cache = new Map(); // Cache 1h
    this.cacheExpiry = 3600000; // 1h en ms
  }

  /**
   * Analyser produit et retourner catégories recettes pertinentes
   */
  async categorizeForRecipes(product) {
    const { name, categoryType, ingredients = [], brand } = product;

    // Cache key
    const cacheKey = `${name}-${brand}`.toLowerCase();
    
    // Vérifier cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log('[ProductCategorization] Cache hit:', cacheKey);
        return cached.data;
      }
    }

    console.log('[ProductCategorization] Analyse IA:', name);

    // ========================================
    // CAS 1 : Non alimentaire
    // ========================================
    if (categoryType !== 'food') {
      return {
        categories: [],
        reason: 'Non alimentaire',
        confidence: 1
      };
    }

    // ========================================
    // CAS 2 : Analyse IA DeepSeek
    // ========================================
    try {
      const prompt = `Tu es un expert culinaire. Analyse ce produit alimentaire et suggère 2-3 types de recettes pertinentes.

PRODUIT :
- Nom : ${name}
- Marque : ${brand || 'N/A'}
- Ingrédients : ${ingredients.slice(0, 5).join(', ') || 'Non spécifié'}

RÈGLES :
1. Sois PRÉCIS et COHÉRENT
2. Nutella → desserts au chocolat, snacks sucrés
3. Pâtes → plats de pâtes, salades
4. Yaourt → petits-déjeuners, desserts légers
5. NE JAMAIS suggérer omelette pour Nutella !

Réponds en JSON :
{
  "categories": ["catégorie1", "catégorie2"],
  "reason": "Explication brève",
  "mainIngredient": "Ingrédient principal"
}`;

      const aiResponse = await deepSeekService.analyze(prompt);
      
      // Parser réponse IA
      let parsed;
      try {
        // Nettoyer markdown si présent
        const cleaned = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch (parseError) {
        console.error('[ProductCategorization] Parse error:', parseError.message);
        return this._getFallbackCategories(name);
      }

      const result = {
        categories: parsed.categories || [],
        reason: parsed.reason || '',
        mainIngredient: parsed.mainIngredient || '',
        confidence: 0.85
      };

      // Mettre en cache
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      console.log('[ProductCategorization] Catégories:', result.categories);

      return result;

    } catch (error) {
      console.error('[ProductCategorization] Erreur IA:', error.message);
      return this._getFallbackCategories(name);
    }
  }

  /**
   * Fallback si IA échoue
   */
  _getFallbackCategories(productName) {
    const name = productName.toLowerCase();

    const rules = {
      'chocolat': { categories: ['dessert-chocolat', 'snack-sucré'], main: 'chocolat' },
      'nutella': { categories: ['dessert-chocolat', 'pâtisserie'], main: 'chocolat' },
      'pates': { categories: ['plat-pâtes', 'salade'], main: 'pâtes' },
      'riz': { categories: ['plat-riz', 'accompagnement'], main: 'riz' },
      'lait': { categories: ['petit-déjeuner', 'smoothie'], main: 'lait' },
      'yaourt': { categories: ['petit-déjeuner', 'dessert-léger'], main: 'yaourt' },
      'fromage': { categories: ['plat-fromage', 'accompagnement'], main: 'fromage' },
      'pain': { categories: ['petit-déjeuner', 'sandwich'], main: 'pain' },
      'cereale': { categories: ['petit-déjeuner', 'bowl'], main: 'céréales' }
    };

    for (const [keyword, data] of Object.entries(rules)) {
      if (name.includes(keyword)) {
        return {
          categories: data.categories,
          reason: `Produit ${keyword} détecté`,
          mainIngredient: data.main,
          confidence: 0.7
        };
      }
    }

    return {
      categories: ['recette-générale'],
      reason: 'Catégorie non identifiée',
      mainIngredient: 'inconnu',
      confidence: 0.3
    };
  }

  /**
   * Nettoyer cache périodiquement
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.cacheExpiry) {
        this.cache.delete(key);
      }
    }
  }
}

module.exports = new ProductCategorizationService();