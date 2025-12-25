/**
 * Knowledge Base Service V2.0
 * Service de gestion de la base de connaissances Ecolojia
 * Sélection habitudes + templates + remplacement variables
 */

const path = require('path');
const fs = require('fs');

class KnowledgeBaseService {
  constructor() {
    this.basePath = path.join(__dirname, '../knowledge');
    this.index = null;
    this.habits = null;
    this.additives = null;
    this.nova = null;
    this.templates = null;
    this.loaded = false;
  }

  /**
   * Charger tous les fichiers Knowledge Base
   */
  load() {
    if (this.loaded) return;

    try {
      // Charger index
      this.index = this.loadJSON('index.json');
      
      // Charger habits
      this.habits = this.loadJSON('habits/library.json');
      
      // Charger additives
      this.additives = this.loadJSON('criteria/food/additives.json');
      
      // Charger NOVA
      this.nova = this.loadJSON('criteria/food/nova.json');
      
      // Charger templates
      this.templates = this.loadJSON('templates/responses/food.json');
      
      this.loaded = true;
      console.log('[Knowledge Base] ✅ Chargée avec succès');
      console.log(`  - Habitudes: ${this.habits.totalHabits}`);
      console.log(`  - Additifs: ${this.additives.totalAdditives}`);
      console.log(`  - Groupes NOVA: ${this.nova.totalGroups}`);
      console.log(`  - Templates: ${this.templates.totalTemplates}`);
    } catch (error) {
      console.error('[Knowledge Base] ❌ Erreur chargement:', error.message);
      throw error;
    }
  }

  /**
   * Charger fichier JSON
   */
  loadJSON(relativePath) {
    const fullPath = path.join(this.basePath, relativePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(content);
  }

  /**
   * Sélectionner habitude selon produit
   */
  selectHabit(product) {
    if (!this.loaded) this.load();

    const rules = this.habits.mappingRules.rules;

    // Parcourir règles dans l'ordre (priorité)
    for (const rule of rules) {
      if (this.matchesCondition(product, rule.condition)) {
        const habit = this.habits.habits.find(h => h.id === rule.habitId);
        if (habit) {
          return {
            id: habit.id,
            name: habit.name,
            description: habit.description,
            examples: habit.examples,
            reasoning: rule.reasoning
          };
        }
      }
    }

    // Fallback : habitude par défaut
    const defaultHabit = this.habits.habits.find(h => h.id === 'surveiller-frequence-non-interdiction');
    return {
      id: defaultHabit.id,
      name: defaultHabit.name,
      description: defaultHabit.description,
      examples: defaultHabit.examples,
      reasoning: 'Habitude générale par défaut'
    };
  }

  /**
   * Vérifier si produit matche condition
   */
  matchesCondition(product, condition) {
    // Condition par défaut
    if (condition.default === true) return true;

    // NOVA group
    if (condition.novaGroup !== undefined) {
      const productNova = product.scores?.novaGroup || product.novaGroup || 4;
      if (typeof condition.novaGroup === 'object') {
        const operator = Object.keys(condition.novaGroup)[0];
        const value = condition.novaGroup[operator];
        return this.compareValues(productNova, operator, value);
      } else {
        return productNova === condition.novaGroup;
      }
    }

    // Additifs count
    if (condition.additivesCount !== undefined) {
      const count = this.countAdditives(product);
      if (typeof condition.additivesCount === 'object') {
        const operator = Object.keys(condition.additivesCount)[0];
        const value = condition.additivesCount[operator];
        return this.compareValues(count, operator, value);
      } else {
        return count === condition.additivesCount;
      }
    }

    // Sucres
    if (condition.sugars100g !== undefined) {
      const sugars = product.nutrition?.sugars_100g || product.nutrition?.sugars || 0;
      if (typeof condition.sugars100g === 'object') {
        const operator = Object.keys(condition.sugars100g)[0];
        const value = condition.sugars100g[operator];
        return this.compareValues(sugars, operator, value);
      }
    }

    // Sel
    if (condition.salt100g !== undefined) {
      const salt = product.nutrition?.salt_100g || product.nutrition?.salt || 0;
      if (typeof condition.salt100g === 'object') {
        const operator = Object.keys(condition.salt100g)[0];
        const value = condition.salt100g[operator];
        return this.compareValues(salt, operator, value);
      }
    }

    // Fibres
    if (condition.fiber100g !== undefined) {
      const fiber = product.nutrition?.fiber_100g || product.nutrition?.fiber || 0;
      if (typeof condition.fiber100g === 'object') {
        const operator = Object.keys(condition.fiber100g)[0];
        const value = condition.fiber100g[operator];
        return this.compareValues(fiber, operator, value);
      }
    }

    // Ingrédients count
    if (condition.ingredientsCount !== undefined) {
      const count = this.countIngredients(product);
      if (typeof condition.ingredientsCount === 'object') {
        const operator = Object.keys(condition.ingredientsCount)[0];
        const value = condition.ingredientsCount[operator];
        return this.compareValues(count, operator, value);
      }
    }

    // Subcategory regex
    if (condition.subcategory && condition.subcategory.$regex) {
      const regex = new RegExp(condition.subcategory.$regex, 'i');
      return regex.test(product.subcategory || '');
    }

    // CategoryType
    if (condition.categoryType) {
      return product.categoryType === condition.categoryType;
    }

    // Organic
    if (condition.organic !== undefined) {
      return product.labels?.includes('bio') || product.labels?.includes('organic');
    }

    return false;
  }

  /**
   * Comparer valeurs avec opérateur
   */
  compareValues(productValue, operator, compareValue) {
    switch (operator) {
      case '$gte': return productValue >= compareValue;
      case '$gt': return productValue > compareValue;
      case '$lte': return productValue <= compareValue;
      case '$lt': return productValue < compareValue;
      case '$eq': return productValue === compareValue;
      default: return false;
    }
  }

  /**
   * Compter additifs dans produit
   */
  countAdditives(product) {
    if (!product.ingredients_text) return 0;
    
    const text = product.ingredients_text.toLowerCase();
    let count = 0;
    
    // Chercher codes E
    const eCodeRegex = /e\d{3,4}[a-z]?/gi;
    const matches = text.match(eCodeRegex);
    if (matches) count += matches.length;
    
    return count;
  }

  /**
   * Compter ingrédients dans produit
   */
  countIngredients(product) {
    if (!product.ingredients_text) return 0;
    
    // Split par virgule
    const ingredients = product.ingredients_text.split(',');
    return ingredients.length;
  }

  /**
   * Sélectionner template selon produit
   */
  selectTemplate(product) {
    if (!this.loaded) this.load();

    const novaGroup = product.scores?.novaGroup || product.novaGroup || 4;
    const subcategory = (product.subcategory || '').toLowerCase();
    const name = (product.name || '').toLowerCase();
    const sugars = product.nutrition?.sugars_100g || product.nutrition?.sugars || 0;
    const salt = product.nutrition?.salt_100g || product.nutrition?.salt || 0;
    const additivesCount = this.countAdditives(product);

    // Parcourir templates par ordre de spécificité
    const templates = this.templates.templates;

    // 1. Match EXACT par subcategory
    for (const template of templates) {
      if (template.subcategories && Array.isArray(template.subcategories)) {
        for (const sub of template.subcategories) {
          if (subcategory.includes(sub.toLowerCase()) || name.includes(sub.toLowerCase())) {
            return template;
          }
        }
      }
    }

    // 2. Match par critères nutrition NOVA 4
    if (novaGroup === 4) {
      // Très sucré
      if (sugars >= 15) {
        const t = templates.find(t => t.id === 'ultra-processed-high-sugar');
        if (t) return t;
      }
      
      // Très salé
      if (salt >= 1.5) {
        const t = templates.find(t => t.id === 'ultra-processed-high-salt');
        if (t) return t;
      }
      
      // Nombreux additifs
      if (additivesCount >= 5) {
        const t = templates.find(t => t.id === 'ultra-processed-multiple-additives');
        if (t) return t;
      }
    }

    // 3. Match par NOVA group générique
    if (novaGroup === 1) {
      // Produit brut
      if (name.includes('eau') || name.includes('water')) {
        return templates.find(t => t.id === 'fresh-vegetables') || templates[0];
      }
      return templates.find(t => t.id === 'fresh-vegetables') || templates[0];
    }

    if (novaGroup === 3) {
      // Transformé simple
      return templates.find(t => t.id === 'bread-simple-artisanal') || 
             templates.find(t => t.novaGroup === 3) || 
             templates[0];
    }

    if (novaGroup === 4) {
      // Ultra-transformé générique
      return templates.find(t => t.id === 'ultra-processed-general') || templates[0];
    }

    // Fallback : premier template
    return templates[0];
  }

  /**
   * Remplacer variables dans template
   */
  replaceVariables(template, product) {
    const habit = this.selectHabit(product);
    const additivesCount = this.countAdditives(product);
    const ingredientsCount = this.countIngredients(product);

    // Extraire 3 premiers ingrédients
    const ingredients = product.ingredients_text 
      ? product.ingredients_text.split(',').slice(0, 3).join(', ')
      : 'ingrédients non disponibles';

    const replacements = {
      '{{productName}}': product.name || 'Ce produit',
      '{{brand}}': product.brand || 'cette marque',
      '{{category}}': product.category || 'cette catégorie',
      '{{subcategory}}': product.subcategory || 'cette sous-catégorie',
      '{{mainIngredients}}': ingredients,
      '{{additivesCount}}': additivesCount.toString(),
      '{{ingredientsCount}}': ingredientsCount.toString(),
      '{{novaGroup}}': (product.scores?.novaGroup || product.novaGroup || 4).toString(),
      '{{sugars100g}}': (product.nutrition?.sugars_100g || product.nutrition?.sugars || 0).toFixed(1),
      '{{salt100g}}': (product.nutrition?.salt_100g || product.nutrition?.salt || 0).toFixed(1),
      '{{fat100g}}': (product.nutrition?.fat_100g || product.nutrition?.fat || 0).toFixed(1),
      '{{fiber100g}}': (product.nutrition?.fiber_100g || product.nutrition?.fiber || 0).toFixed(1),
      '{{energy}}': (product.nutrition?.energy_kcal || product.nutrition?.energy || 0).toString(),
      '{{overallScore}}': (product.scores?.overall || 50).toString(),
      '{{nutritionScore}}': (product.scores?.nutrition || 50).toString(),
      '{{processingScore}}': (product.scores?.processing || 50).toString(),
      '{{additivesScore}}': (product.scores?.additives || 50).toString(),
      '{{selectedHabit}}': habit.name,
      '{{habitDescription}}': habit.description,
      '{{habitExamples}}': habit.examples ? habit.examples.join(', ') : ''
    };

    // Fonction de remplacement
    const replace = (text) => {
      if (!text) return '';
      let result = text;
      for (const [key, value] of Object.entries(replacements)) {
        result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
      }
      return result;
    };

    // Remplacer dans tout le template
    const replaced = {
      whatItIs: replace(template.template.whatItIs),
      composition: replace(template.template.composition),
      science: replace(template.template.science),
      reflex: replace(template.template.reflex),
      actions: template.template.actions.map(a => replace(a)),
      habitImpact: replace(template.template.habitImpact)
    };

    return replaced;
  }

  /**
   * Générer réponse complète
   */
  generateResponse(product) {
    if (!this.loaded) this.load();

    const habit = this.selectHabit(product);
    const template = this.selectTemplate(product);
    const response = this.replaceVariables(template, product);

    return {
      habit: habit,
      template: {
        id: template.id,
        name: template.name
      },
      response: {
        whatItIs: response.whatItIs,
        composition: response.composition,
        science: response.science,
        reflex: response.reflex,
        actions: response.actions,
        habitImpact: response.habitImpact
      }
    };
  }

  /**
   * Obtenir info additif
   */
  getAdditiveInfo(code) {
    if (!this.loaded) this.load();
    
    const additiveCode = code.toUpperCase().replace(/^E/, 'E');
    const additive = this.additives.additives.find(a => 
      a.code.toUpperCase() === additiveCode
    );
    
    return additive || null;
  }

  /**
   * Obtenir info NOVA group
   */
  getNovaInfo(groupNumber) {
    if (!this.loaded) this.load();
    
    const group = this.nova.groups.find(g => g.id === groupNumber);
    return group || null;
  }
}

// Singleton
const knowledgeBaseService = new KnowledgeBaseService();

module.exports = knowledgeBaseService;
