/**
 * ECOLOJIA V3.1 - SERVICE DE CONNAISSANCE SCIENTIFIQUE HYBRIDE
 * 
 * Système intelligent combinant :
 * - Règles universelles (détection patterns vagues)
 * - Base de données spécifiques (détails scientifiques)
 * - Analyse hybride complète
 * 
 * @module knowledge.service
 * @version 2.0.0
 * @date 2025-11-16
 */

const path = require('path');
const fs = require('fs').promises;

class KnowledgeService {
  constructor() {
    this.database = {
      food: {},
      cosmetics: {},
      detergents: {},
      studies: null
    };
    this.universalRules = null;
    this.initialized = false;
    this.databasePath = path.join(__dirname, 'scientific-database');
  }

  /**
   * Initialise la base de connaissance complète
   */
  async initialize() {
    if (this.initialized) return;

    try {
      console.log('[KnowledgeService] 🔄 Chargement de la base de connaissance scientifique...');

      // 1. Charger les règles universelles (PRIORITÉ)
      await this.loadUniversalRules();

      // 2. Charger les catégories spécifiques
      await this.loadCategory('food');

      this.initialized = true;
      console.log('[KnowledgeService] ✅ Base de connaissance chargée avec succès');
      
      const loadedCategories = Object.keys(this.database || {})
        .filter(k => this.database[k] && Object.keys(this.database[k]).length > 0);
      
      console.log(`[KnowledgeService] 📊 Catégories chargées: ${loadedCategories.join(', ')}`);
      console.log(`[KnowledgeService] 🎯 Règles universelles: ${this.universalRules ? 'ACTIVÉES' : 'NON'}`);
    } catch (error) {
      console.error('[KnowledgeService] ❌ Erreur lors du chargement:', error);
      throw error;
    }
  }

  /**
   * Charge les règles universelles
   */
  async loadUniversalRules() {
    try {
      const rulesPath = path.join(this.databasePath, 'universal-rules.json');
      const content = await fs.readFile(rulesPath, 'utf8');
      this.universalRules = JSON.parse(content);
      console.log('[KnowledgeService] ✅ Règles universelles chargées');
      console.log(`[KnowledgeService]    - Ingrédients vagues: ${this.universalRules.categories.vagueIngredients.rules.length}`);
      console.log(`[KnowledgeService]    - Procédés cachés: ${this.universalRules.categories.hiddenProcesses.rules.length}`);
      console.log(`[KnowledgeService]    - Red flags: ${this.universalRules.categories.redFlags.rules.length}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn('[KnowledgeService] ⚠️  universal-rules.json non trouvé');
        this.universalRules = null;
      } else {
        throw error;
      }
    }
  }

  async loadCategory(category) {
    const categoryPath = path.join(this.databasePath, category);

    try {
      const files = await fs.readdir(categoryPath);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      for (const file of jsonFiles) {
        const filePath = path.join(categoryPath, file);
        const content = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(content);
        
        const key = file.replace('.json', '');
        this.database[category][key] = data;

        console.log(`[KnowledgeService] ✅ Chargé: ${category}/${file}`);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`[KnowledgeService] ⚠️  Catégorie ${category} non disponible (à venir)`);
      } else {
        throw error;
      }
    }
  }

  normalizeIngredient(name) {
    if (!name) return '';
    return name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/['']/g, ' ');
  }

  /**
   * NOUVELLE MÉTHODE : Vérifie les règles universelles pour un ingrédient
   * @param {string} ingredientName - Nom de l'ingrédient
   * @returns {Array} Règles correspondantes
   */
    /**
   * NOUVELLE MÉTHODE : Vérifie les règles universelles pour un ingrédient
   * @param {string} ingredientName - Nom de l'ingrédient
   * @returns {Array} Règles correspondantes
   */
  checkUniversalRules(ingredientName) {
    if (!this.universalRules) return [];

    const normalized = this.normalizeIngredient(ingredientName);
    const matches = [];

    // Vérifier les ingrédients vagues
    for (const rule of this.universalRules.categories.vagueIngredients.rules) {
      for (const trigger of rule.triggers) {
        if (normalized.includes(this.normalizeIngredient(trigger))) {
          
          // ✅ NOUVEAU : Vérifier les exceptions
          let hasException = false;
          if (rule.exceptions && Array.isArray(rule.exceptions)) {
            for (const exception of rule.exceptions) {
              if (normalized.includes(this.normalizeIngredient(exception))) {
                hasException = true;
                break;
              }
            }
          }

          // Si exception trouvée, ne pas ajouter cette règle
          if (!hasException) {
            matches.push({
              type: 'vagueIngredient',
              rule: rule,
              matchedTrigger: trigger
            });
          }
          
          break; // Un seul match par règle
        }
      }
    }

    return matches;
  }

  /**
   * NOUVELLE MÉTHODE : Détecte les procédés cachés
   * @param {string} ingredientsList - Liste complète des ingrédients
   * @returns {Array} Procédés détectés
   */
  detectHiddenProcesses(ingredientsList) {
    if (!this.universalRules) return [];

    const normalized = this.normalizeIngredient(ingredientsList);
    const detected = [];

    for (const process of this.universalRules.categories.hiddenProcesses.rules) {
      for (const trigger of process.triggers) {
        if (normalized.includes(this.normalizeIngredient(trigger))) {
          detected.push({
            type: 'hiddenProcess',
            process: process,
            matchedTrigger: trigger
          });
          break;
        }
      }
    }

    return detected;
  }

  /**
   * NOUVELLE MÉTHODE : Détecte les red flags
   * @param {Array<string>} ingredients - Liste des ingrédients
   * @param {string} fullText - Texte complet des ingrédients
   * @returns {Array} Red flags détectés
   */
  detectRedFlags(ingredients, fullText) {
    if (!this.universalRules) return [];

    const flags = [];
    const normalized = this.normalizeIngredient(fullText);

    // Red flag: liste longue
    if (ingredients.length > 10) {
      const rule = this.universalRules.categories.redFlags.rules.find(r => r.id === 'red_flag_long_ingredients');
      if (rule) {
        flags.push({
          type: 'redFlag',
          flag: rule,
          value: ingredients.length
        });
      }
    }

    // Red flag: E-numbers
    const eNumberPattern = /e[0-9]{3,4}/i;
    if (eNumberPattern.test(fullText)) {
      const rule = this.universalRules.categories.redFlags.rules.find(r => r.id === 'red_flag_e_numbers');
      if (rule) {
        const eNumbers = fullText.match(/e[0-9]{3,4}/gi) || [];
        flags.push({
          type: 'redFlag',
          flag: rule,
          value: eNumbers
        });
      }
    }

    // Red flag: Huile de palme
    if (normalized.includes('palme')) {
      const rule = this.universalRules.categories.redFlags.rules.find(r => r.id === 'red_flag_palm_oil');
      if (rule) {
        flags.push({
          type: 'redFlag',
          flag: rule
        });
      }
    }

    // Red flag: Sirop glucose-fructose
    if (normalized.includes('glucose-fructose') || normalized.includes('sirop de glucose')) {
      const rule = this.universalRules.categories.redFlags.rules.find(r => r.id === 'red_flag_glucose_fructose');
      if (rule) {
        flags.push({
          type: 'redFlag',
          flag: rule
        });
      }
    }

    // Red flag: Huiles hydrogénées
    if (normalized.includes('hydrogene')) {
      const rule = this.universalRules.categories.redFlags.rules.find(r => r.id === 'red_flag_trans_fats');
      if (rule) {
        flags.push({
          type: 'redFlag',
          flag: rule
        });
      }
    }

    return flags;
  }

  /**
   * NOUVELLE MÉTHODE : Analyse complète hybride d'un produit
   * Combine règles universelles + données spécifiques
   * @param {Object} product - Produit à analyser
   * @returns {Object} Analyse complète
   */
  analyzeProductComplete(product) {
    const ingredientsText = product.ingredients_text || product.ingredients || '';
    const ingredientsList = ingredientsText.split(/[,;]+/).map(i => i.trim()).filter(i => i);

    const analysis = {
      productName: product.name || product.product_name,
      totalIngredients: ingredientsList.length,
      ingredientsAnalysis: [],
      hiddenProcesses: [],
      redFlags: [],
      criticalIssues: [],
      highIssues: [],
      moderateIssues: [],
      scoreImpact: 0,
      recommendations: []
    };

    // 1. Analyser chaque ingrédient individuellement
    for (const ingredient of ingredientsList) {
      // Vérifier d'abord données spécifiques

      const specificData = this.getIngredientRisks(ingredient);

      

      // Si données spécifiques trouvées ET score > 70, ne pas appliquer règles universelles

      let universalRules = [];

      if (!specificData || (specificData.variants && specificData.variants[0].score < 70)) {

        universalRules = this.checkUniversalRules(ingredient);

      }

      

      const ingredientAnalysis = {

        name: ingredient,

        universalRules: universalRules,

        specificData: specificData

      };

      // Calculer l'impact sur le score
      ingredientAnalysis.universalRules.forEach(match => {
        const severity = match.rule.severity;
        const impact = this.universalRules.scoringImpact.vagueIngredient[severity] || 0;
        analysis.scoreImpact += impact;

        if (severity === 'critical') {
          analysis.criticalIssues.push({
            ingredient,
            issue: match.rule.reason,
            details: match.rule.explanation
          });
        } else if (severity === 'high') {
          analysis.highIssues.push({
            ingredient,
            issue: match.rule.reason,
            details: match.rule.explanation
          });
        } else if (severity === 'moderate') {
          analysis.moderateIssues.push({
            ingredient,
            issue: match.rule.reason
          });
        }
      });

      analysis.ingredientsAnalysis.push(ingredientAnalysis);
    }

    // 2. Détecter les procédés cachés
    analysis.hiddenProcesses = this.detectHiddenProcesses(ingredientsText);
    analysis.hiddenProcesses.forEach(process => {
      const severity = process.process.severity;
      const impact = this.universalRules.scoringImpact.hiddenProcess[severity] || 0;
      analysis.scoreImpact += impact;

      if (severity === 'critical') {
        analysis.criticalIssues.push({
          type: 'process',
          name: process.process.processName,
          details: process.process.description
        });
      }
    });

    // 3. Détecter les red flags
    analysis.redFlags = this.detectRedFlags(ingredientsList, ingredientsText);
    analysis.redFlags.forEach(flag => {
      const severity = flag.flag.severity;
      const impact = this.universalRules.scoringImpact.redFlag[severity] || 0;
      analysis.scoreImpact += impact;

      if (severity === 'critical') {
        analysis.criticalIssues.push({
          type: 'redFlag',
          flag: flag.flag.description,
          reason: flag.flag.reason
        });
      }
    });

    // 4. Générer des recommandations
    if (analysis.criticalIssues.length > 0) {
      analysis.recommendations.push('⚠️ PRODUIT À ÉVITER - Contient des ingrédients/procédés critiques');
    }
    if (analysis.highIssues.length > 3) {
      analysis.recommendations.push('Trop d\'ingrédients problématiques - Chercher une alternative');
    }
    if (analysis.totalIngredients > 15) {
      analysis.recommendations.push('Liste d\'ingrédients très longue - Produit ultra-transformé');
    }

    return analysis;
  }

  // ========== MÉTHODES EXISTANTES (conservées) ==========

    searchIngredient(ingredientName, category = 'food') {
    const normalizedSearch = this.normalizeIngredient(ingredientName);

    for (const [key, data] of Object.entries(this.database[category])) {
      // ⭐ SUPPORT FORMAT OILS (oils.json - format spécial)
      if (data.oils) {
        for (const oil of data.oils) {
          const normalizedOilName = this.normalizeIngredient(oil.name);
          
          // Match exact
          if (normalizedOilName === normalizedSearch) {
            return oil;
          }
          
          // Chercher dans commonNames
          if (oil.commonNames) {
            for (const commonName of oil.commonNames) {
              if (this.normalizeIngredient(commonName) === normalizedSearch) {
                return oil;
              }
            }
          }
          
          // Match partiel
          if (normalizedOilName.includes(normalizedSearch) || normalizedSearch.includes(normalizedOilName)) {
            return oil;
          }
        }
      }
      
      // ⭐ SUPPORT FORMAT ITEMS (sugars, acids, controversial, additives)
      if (data.items) {
        for (const item of data.items) {
          // Chercher dans le tableau names
          if (item.names && Array.isArray(item.names)) {
            for (const name of item.names) {
              const normalizedName = this.normalizeIngredient(name);
              
              // Match exact
              if (normalizedName === normalizedSearch) {
                return {
                  name: item.names[0],
                  variants: [{
                    type: item.category || 'standard',
                    score: item.score,
                    description: item.description,
                    risks: item.concerns ? item.concerns.map(c => ({
                      severity: item.severity,
                      description: c,
                      details: item.details
                    })) : [],
                    benefits: [],
                    alternatives: item.alternatives || [],
                    usage: item.sources || []
                  }]
                };
              }
              
              // Match partiel
              if (normalizedName.includes(normalizedSearch) || normalizedSearch.includes(normalizedName)) {
                return {
                  name: item.names[0],
                  variants: [{
                    type: item.category || 'standard',
                    score: item.score,
                    description: item.description,
                    risks: item.concerns ? item.concerns.map(c => ({
                      severity: item.severity,
                      description: c,
                      details: item.details
                    })) : [],
                    benefits: [],
                    alternatives: item.alternatives || [],
                    usage: item.sources || []
                  }]
                };
              }
            }
          }
        }
      }
    }

    return null;
  }

  getIngredientRisks(ingredientName, category = 'food') {
    const ingredient = this.searchIngredient(ingredientName, category);
    if (!ingredient) return null;

    return {
      ingredient: ingredientName,
      found: ingredient.name,
      variants: ingredient.variants.map(variant => ({
        type: variant.type,
        score: variant.score,
        description: variant.description,
        risks: variant.risks || [],
        benefits: variant.benefits || [],
        alternatives: variant.alternatives || [],
        usage: variant.usage
      }))
    };
  }

  detectVagueIngredient(ingredientName) {
    const normalized = this.normalizeIngredient(ingredientName);

    const vaguePatterns = {
      'huile vegetale': {
        assumed: 'huile végétale raffinée (tournesol ou palme probable)',
        risk: 'high',
        reason: 'Absence de précision = industriel = raffiné',
        details: 'Quand un produit mentionne "huile végétale" sans préciser laquelle ni le procédé, il s\'agit systématiquement d\'huile raffinée industrielle bon marché (tournesol ou palme le plus souvent).'
      },
      'huile': {
        assumed: 'huile raffinée non précisée',
        risk: 'high',
        reason: 'Huile sans qualificatif = raffinée',
        details: 'Une huile de qualité est toujours précisée: "vierge", "extra vierge", "première pression à froid", "bio". L\'absence de mention indique un raffinage industriel.'
      },
      'sucre': {
        assumed: 'sucre blanc raffiné',
        risk: 'high',
        reason: 'Sans mention "complet" ou "canne" = raffiné',
        details: 'Le sucre standard est du saccharose blanc raffiné à 99,9%. Un sucre de qualité est toujours précisé: "sucre de canne complet", "rapadura", "muscovado".'
      },
      'farine': {
        assumed: 'farine blanche T45',
        risk: 'moderate',
        reason: 'Sans mention "complète" = appauvrie en fibres',
        details: 'Farine sans précision = T45 ou T55 (farine blanche raffinée, appauvrie en fibres, minéraux et vitamines du son et du germe).'
      },
      'poisson': {
        assumed: 'poisson d\'élevage',
        risk: 'high',
        reason: 'Sans mention "sauvage" = élevage industriel',
        details: 'Un poisson sauvage est toujours valorisé sur l\'étiquette. L\'absence de mention "sauvage" ou "pêche durable MSC" indique un élevage intensif avec antibiotiques et contaminations.'
      }
    };

    for (const [pattern, info] of Object.entries(vaguePatterns)) {
      if (normalized.includes(pattern)) {
        const ingredientData = this.searchIngredient(info.assumed);

        return {
          original: ingredientName,
          normalized: normalized,
          detected: pattern,
          ...info,
          knowledgeData: ingredientData ? this.getIngredientRisks(info.assumed) : null
        };
      }
    }

    return null;
  }

  getAlternatives(ingredientName, variantType = null) {
    const ingredient = this.searchIngredient(ingredientName);
    if (!ingredient) return [];

    let alternatives = [];

    if (variantType) {
      const variant = ingredient.variants.find(v => 
        this.normalizeIngredient(v.type) === this.normalizeIngredient(variantType)
      );
      if (variant && variant.alternatives) {
        alternatives = variant.alternatives;
      }
    } else {
      const worstVariant = ingredient.variants.reduce((worst, current) => 
        current.score < worst.score ? current : worst
      );
      if (worstVariant && worstVariant.alternatives) {
        alternatives = worstVariant.alternatives;
      }
    }

    return alternatives;
  }

  analyzeIngredientsList(ingredients, category = 'food') {
    const analysis = {
      totalIngredients: ingredients.length,
      knownIngredients: [],
      vagueIngredients: [],
      unknownIngredients: [],
      criticalRisks: [],
      highRisks: [],
      moderateRisks: [],
      alternatives: []
    };

    for (const ingredient of ingredients) {
      const vagueDetection = this.detectVagueIngredient(ingredient);
      if (vagueDetection) {
        analysis.vagueIngredients.push(vagueDetection);
        
        if (vagueDetection.knowledgeData) {
          const worstVariant = vagueDetection.knowledgeData.variants[0];
          worstVariant.risks.forEach(risk => {
            if (risk.severity === 'critical') {
              analysis.criticalRisks.push({ ingredient, ...risk });
            } else if (risk.severity === 'high') {
              analysis.highRisks.push({ ingredient, ...risk });
            } else if (risk.severity === 'moderate') {
              analysis.moderateRisks.push({ ingredient, ...risk });
            }
          });
        }
        continue;
      }

      const ingredientData = this.getIngredientRisks(ingredient, category);
      if (ingredientData) {
        analysis.knownIngredients.push({
          original: ingredient,
          found: ingredientData.found,
          variants: ingredientData.variants
        });

        ingredientData.variants.forEach(variant => {
          variant.risks.forEach(risk => {
            const riskWithIngredient = { 
              ingredient, 
              variant: variant.type,
              ...risk 
            };

            if (risk.severity === 'critical') {
              analysis.criticalRisks.push(riskWithIngredient);
            } else if (risk.severity === 'high') {
              analysis.highRisks.push(riskWithIngredient);
            } else if (risk.severity === 'moderate') {
              analysis.moderateRisks.push(riskWithIngredient);
            }
          });

          if (variant.alternatives) {
            analysis.alternatives.push({
              ingredient,
              variant: variant.type,
              alternatives: variant.alternatives
            });
          }
        });
      } else {
        analysis.unknownIngredients.push(ingredient);
      }
    }

    return analysis;
  }

  getGeneralRecommendations(category = 'food') {
    if (category === 'food' && this.database.food.oils) {
      return this.database.food.oils.generalRecommendations || null;
    }

    return null;
  }

  getRelatedStudies(topic) {
    const normalized = this.normalizeIngredient(topic);
    const studies = [];

    if (this.database.food.oils && this.database.food.oils.sources) {
      const oilSources = this.database.food.oils.sources;
      
      if (oilSources.mainReferences) {
        oilSources.mainReferences.forEach(ref => {
          if (this.normalizeIngredient(ref).includes(normalized)) {
            studies.push({ type: 'main', reference: ref });
          }
        });
      }

      if (oilSources.peerReviewedJournals) {
        oilSources.peerReviewedJournals.forEach(journal => {
          if (this.normalizeIngredient(journal).includes(normalized)) {
            studies.push({ type: 'journal', reference: journal });
          }
        });
      }
    }

    return studies;
  }
}

const knowledgeService = new KnowledgeService();
module.exports = knowledgeService;