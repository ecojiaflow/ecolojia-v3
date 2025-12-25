/**
 * Knowledge Base Service V2.1 - MULTI-FORMAT
 * Gère anciennes et nouvelles structures de données produit
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

  load() {
    if (this.loaded) return;

    try {
      this.index = this.loadJSON('index.json');
      this.habits = this.loadJSON('habits/library.json');
      this.additives = this.loadJSON('criteria/food/additives.json');
      this.nova = this.loadJSON('criteria/food/nova.json');
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

  loadJSON(relativePath) {
    const fullPath = path.join(this.basePath, relativePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(content);
  }

  selectHabit(product) {
    if (!this.loaded) this.load();

    const rules = this.habits.mappingRules.rules;

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

    const defaultHabit = this.habits.habits.find(h => h.id === 'surveiller-frequence-non-interdiction');
    return {
      id: defaultHabit.id,
      name: defaultHabit.name,
      description: defaultHabit.description,
      examples: defaultHabit.examples,
      reasoning: 'Habitude générale par défaut'
    };
  }

  matchesCondition(product, condition) {
    if (condition.default === true) return true;

    if (condition.novaGroup !== undefined) {
      const productNova = this.getNovaGroup(product);
      if (typeof condition.novaGroup === 'object') {
        const operator = Object.keys(condition.novaGroup)[0];
        const value = condition.novaGroup[operator];
        return this.compareValues(productNova, operator, value);
      } else {
        return productNova === condition.novaGroup;
      }
    }

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

    if (condition.sugars100g !== undefined) {
      const sugars = this.getNutrition(product, 'sugars');
      if (typeof condition.sugars100g === 'object') {
        const operator = Object.keys(condition.sugars100g)[0];
        const value = condition.sugars100g[operator];
        return this.compareValues(sugars, operator, value);
      }
    }

    if (condition.salt100g !== undefined) {
      const salt = this.getNutrition(product, 'salt');
      if (typeof condition.salt100g === 'object') {
        const operator = Object.keys(condition.salt100g)[0];
        const value = condition.salt100g[operator];
        return this.compareValues(salt, operator, value);
      }
    }

    if (condition.fiber100g !== undefined) {
      const fiber = this.getNutrition(product, 'fiber');
      if (typeof condition.fiber100g === 'object') {
        const operator = Object.keys(condition.fiber100g)[0];
        const value = condition.fiber100g[operator];
        return this.compareValues(fiber, operator, value);
      }
    }

    if (condition.ingredientsCount !== undefined) {
      const count = this.countIngredients(product);
      if (typeof condition.ingredientsCount === 'object') {
        const operator = Object.keys(condition.ingredientsCount)[0];
        const value = condition.ingredientsCount[operator];
        return this.compareValues(count, operator, value);
      }
    }

    if (condition.subcategory && condition.subcategory.$regex) {
      const regex = new RegExp(condition.subcategory.$regex, 'i');
      return regex.test(product.subcategory || '');
    }

    if (condition.categoryType) {
      return product.categoryType === condition.categoryType;
    }

    if (condition.organic !== undefined) {
      return product.labels?.includes('bio') || product.labels?.includes('organic');
    }

    return false;
  }

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

  countAdditives(product) {
    if (!product.ingredients_text && !product.ingredientsText) return 0;
    
    const text = (product.ingredients_text || product.ingredientsText || '').toLowerCase();
    let count = 0;
    
    const eCodeRegex = /e\d{3,4}[a-z]?/gi;
    const matches = text.match(eCodeRegex);
    if (matches) count += matches.length;
    
    return count;
  }

  countIngredients(product) {
    const text = product.ingredients_text || product.ingredientsText;
    if (!text) return 0;
    
    const ingredients = text.split(',');
    return ingredients.length;
  }

  // NOUVELLE FONCTION: Gestion multi-format NOVA
  getNovaGroup(product) {
    return product.scores?.novaGroup || 
           product.scores?.breakdown?.nova?.group ||
           product.nova_group || 
           product.novaGroup ||
           4;
  }

  // NOUVELLE FONCTION: Gestion multi-format nutrition
  getNutrition(product, field) {
    // Nouvelle structure: nutrition.sugars
    if (product.nutrition?.[field]) return product.nutrition[field];
    
    // Ancienne structure: nutrition.sugars_100g
    if (product.nutrition?.[`${field}_100g`]) return product.nutrition[`${field}_100g`];
    
    // Très ancienne structure: nutriments.sugars_100g
    if (product.nutriments?.[`${field}_100g`]) return product.nutriments[`${field}_100g`];
    if (product.nutriments?.[field]) return product.nutriments[field];
    
    return 0;
  }

  // NOUVELLE FONCTION: Gestion multi-format scores
  getScore(product, field) {
    if (product.scores?.[field]) return product.scores[field];
    
    // Ancien format avec "overallScore" au lieu de "overall"
    if (field === 'overall' && product.scores?.overallScore) {
      return product.scores.overallScore;
    }
    if (field === 'health' && product.scores?.healthScore) {
      return product.scores.healthScore;
    }
    if (field === 'environment' && product.scores?.environmentScore) {
      return product.scores.environmentScore;
    }
    
    return 50;
  }

  selectTemplate(product) {
    if (!this.loaded) this.load();

    const novaGroup = this.getNovaGroup(product);
    const subcategory = (product.subcategory || '').toLowerCase();
    const name = (product.name || '').toLowerCase();
    const sugars = this.getNutrition(product, 'sugars');
    const salt = this.getNutrition(product, 'salt');
    const additivesCount = this.countAdditives(product);

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
      if (sugars >= 15) {
        const t = templates.find(t => t.id === 'ultra-processed-high-sugar');
        if (t) return t;
      }
      
      if (salt >= 1.5) {
        const t = templates.find(t => t.id === 'ultra-processed-high-salt');
        if (t) return t;
      }
      
      if (additivesCount >= 5) {
        const t = templates.find(t => t.id === 'ultra-processed-multiple-additives');
        if (t) return t;
      }
    }

    // 3. Match par NOVA group générique
    if (novaGroup === 1) {
      if (name.includes('eau') || name.includes('water')) {
        return templates.find(t => t.id === 'fresh-vegetables') || templates[0];
      }
      return templates.find(t => t.id === 'fresh-vegetables') || templates[0];
    }

    if (novaGroup === 3) {
      return templates.find(t => t.id === 'bread-simple-artisanal') || 
             templates.find(t => t.novaGroup === 3) || 
             templates[0];
    }

    if (novaGroup === 4) {
      return templates.find(t => t.id === 'ultra-processed-general') || templates[0];
    }

    return templates[0];
  }

  replaceVariables(template, product) {
    const habit = this.selectHabit(product);
    const additivesCount = this.countAdditives(product);
    const ingredientsCount = this.countIngredients(product);

    const ingredients = (product.ingredients_text || product.ingredientsText)
      ? (product.ingredients_text || product.ingredientsText).split(',').slice(0, 3).join(', ')
      : 'ingrédients non disponibles';

    const replacements = {
      '{{productName}}': product.name || 'Ce produit',
      '{{brand}}': product.brand || 'cette marque',
      '{{category}}': product.category || 'cette catégorie',
      '{{subcategory}}': product.subcategory || 'cette sous-catégorie',
      '{{mainIngredients}}': ingredients,
      '{{additivesCount}}': additivesCount.toString(),
      '{{ingredientsCount}}': ingredientsCount.toString(),
      '{{novaGroup}}': this.getNovaGroup(product).toString(),
      '{{sugars100g}}': this.getNutrition(product, 'sugars').toFixed(1),
      '{{salt100g}}': this.getNutrition(product, 'salt').toFixed(1),
      '{{fat100g}}': this.getNutrition(product, 'fat').toFixed(1),
      '{{fiber100g}}': this.getNutrition(product, 'fiber').toFixed(1),
      '{{energy}}': (this.getNutrition(product, 'energy_kcal') || this.getNutrition(product, 'energy')).toString(),
      '{{overallScore}}': this.getScore(product, 'overall').toString(),
      '{{nutritionScore}}': this.getScore(product, 'nutrition').toString(),
      '{{processingScore}}': this.getScore(product, 'processing').toString(),
      '{{additivesScore}}': this.getScore(product, 'additives').toString(),
      '{{selectedHabit}}': habit.name,
      '{{habitDescription}}': habit.description,
      '{{habitExamples}}': habit.examples ? habit.examples.join(', ') : ''
    };

    const replace = (text) => {
      if (!text) return '';
      let result = text;
      for (const [key, value] of Object.entries(replacements)) {
        result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
      }
      return result;
    };

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

  getAdditiveInfo(code) {
    if (!this.loaded) this.load();
    
    const additiveCode = code.toUpperCase().replace(/^E/, 'E');
    const additive = this.additives.additives.find(a => 
      a.code.toUpperCase() === additiveCode
    );
    
    return additive || null;
  }

  getNovaInfo(groupNumber) {
    if (!this.loaded) this.load();
    
    const group = this.nova.groups.find(g => g.id === groupNumber);
    return group || null;
  }
}

const knowledgeBaseService = new KnowledgeBaseService();

module.exports = knowledgeBaseService;
