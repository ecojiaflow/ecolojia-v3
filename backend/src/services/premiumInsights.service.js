/**
 * premiumInsights.service.js
 * Service d'enrichissement IA - Complete les donnees manquantes
 */

const deepSeekService = require('./ai/deepSeekService');

const logger = {
  info: (...args) => console.log('[AI-ENRICH]', ...args),
  warn: (...args) => console.warn('[AI-ENRICH WARN]', ...args),
  error: (...args) => console.error('[AI-ENRICH ERROR]', ...args)
};

class PremiumInsightsService {

  static async generateInsights(product) {
    const startTime = Date.now();
    logger.info('Enrichissement IA pour:', product.name);

    try {
      const knownData = this.extractKnownData(product);
      
      // Si produit deja complet, retourner juste les infos
      if (knownData.completeness.score >= 80) {
        logger.info('Produit deja complet, pas d enrichissement necessaire');
        return {
          success: true,
          version: '2.0.0',
          generatedAt: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          knownData,
          estimatedData: { nova: null, nutriScore: null, description: null, typicalIngredients: [], generated: false },
          needsEnrichment: false
        };
      }

      // Construire le prompt pour estimer les donnees manquantes
      const prompt = this.buildEnrichmentPrompt(product, knownData);
      const aiResponse = await this.callDeepSeek(prompt);
      const estimatedData = this.parseEstimatedData(aiResponse, knownData);

      const duration = Date.now() - startTime;
      logger.info('Enrichissement termine en ' + duration + 'ms');

      return {
        success: true,
        version: '2.0.0',
        generatedAt: new Date().toISOString(),
        processingTime: duration,
        knownData,
        estimatedData,
        needsEnrichment: true
      };

    } catch (error) {
      logger.error('Erreur enrichissement:', error.message);
      return {
        success: false,
        error: error.message,
        estimatedData: null
      };
    }
  }

  static extractKnownData(product) {
    const nutrition = product.nutriments || product.foodData?.nutritionalInfo || {};
    const hasNutrition = !!(nutrition.energy_100g || nutrition.sugars_100g);
    const hasIngredients = !!(product.ingredients_text && product.ingredients_text.length > 10);
    const hasAdditives = !!((product.additives_extracted && product.additives_extracted.length > 0) || (product.additives_tags && product.additives_tags.length > 0));
    const hasNova = !!(product.nova_group && product.nova_group >= 1 && product.nova_group <= 4);
    const hasNutriScore = !!(product.nutriscore_grade && ['a','b','c','d','e'].includes(product.nutriscore_grade.toLowerCase()));

    const score = [hasNutrition, hasIngredients, hasAdditives, hasNova, hasNutriScore].filter(Boolean).length * 20;

    return {
      name: product.name || 'Produit inconnu',
      brand: product.brand || null,
      category: product.category || 'food',
      subcategory: product.subcategory || null,
      facts: {
        nova: hasNova ? product.nova_group : null,
        nutriScore: hasNutriScore ? product.nutriscore_grade.toUpperCase() : null,
        sugars100g: nutrition.sugars_100g || null,
        salt100g: nutrition.salt_100g || null,
        fat100g: nutrition.fat_100g || null,
        proteins100g: nutrition.proteins_100g || null
      },
      completeness: { hasNutrition, hasIngredients, hasAdditives, hasNova, hasNutriScore, score }
    };
  }

  static buildEnrichmentPrompt(product, knownData) {
    const missing = [];
    if (!knownData.facts.nova) missing.push('NOVA');
    if (!knownData.facts.nutriScore) missing.push('Nutri-Score');
    if (!knownData.completeness.hasIngredients) missing.push('ingredients');

    let nutritionContext = '';
    if (knownData.facts.sugars100g) nutritionContext += 'Sucres: ' + knownData.facts.sugars100g + 'g/100g. ';
    if (knownData.facts.fat100g) nutritionContext += 'Graisses: ' + knownData.facts.fat100g + 'g/100g. ';
    if (knownData.facts.salt100g) nutritionContext += 'Sel: ' + knownData.facts.salt100g + 'g/100g. ';

    return 'Tu es un expert en nutrition. Estime les donnees manquantes pour ce produit.\n\n' +
      'PRODUIT: ' + knownData.name + (knownData.brand ? ' (' + knownData.brand + ')' : '') + '\n' +
      'CATEGORIE: ' + (knownData.subcategory || knownData.category) + '\n' +
      (nutritionContext ? 'NUTRITION CONNUE: ' + nutritionContext + '\n' : '') +
      '\nDONNEES MANQUANTES A ESTIMER: ' + missing.join(', ') + '\n\n' +
      'REGLES:\n' +
      '- NOVA: 1=brut, 2=transforme simple, 3=transforme, 4=ultra-transforme\n' +
      '- Nutri-Score: A=excellent, B=bon, C=moyen, D=mauvais, E=tres mauvais\n' +
      '- Base tes estimations sur le nom, la categorie et la nutrition connue\n' +
      '- Sois conservateur dans tes estimations\n\n' +
      'Reponds UNIQUEMENT en JSON:\n' +
      '{\n' +
      '  "nova": { "value": 1-4, "confidence": 0.0-1.0, "reasoning": "..." },\n' +
      '  "nutriScore": { "value": "A-E", "confidence": 0.0-1.0, "reasoning": "..." },\n' +
      '  "description": "Description courte du produit",\n' +
      '  "typicalIngredients": ["ingredient1", "ingredient2"]\n' +
      '}';
  }

  static async callDeepSeek(prompt) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error('DEEPSEEK_API_KEY non configuree');
    
    const response = await deepSeekService.chat({
      apiKey,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500
    });
    return response.text || '';
  }

  static parseEstimatedData(aiResponse, knownData) {
    try {
      let cleaned = aiResponse.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/```json\n?/, '').replace(/```$/, '');
      if (cleaned.startsWith('```')) cleaned = cleaned.replace(/```\n?/, '').replace(/```$/, '');

      const parsed = JSON.parse(cleaned);

      return {
        nova: !knownData.facts.nova && parsed.nova ? {
          value: parsed.nova.value,
          confidence: parsed.nova.confidence || 0.6,
          reasoning: parsed.nova.reasoning || '',
          isEstimated: true
        } : null,
        nutriScore: !knownData.facts.nutriScore && parsed.nutriScore ? {
          value: parsed.nutriScore.value,
          confidence: parsed.nutriScore.confidence || 0.6,
          reasoning: parsed.nutriScore.reasoning || '',
          isEstimated: true
        } : null,
        description: parsed.description || null,
        typicalIngredients: parsed.typicalIngredients || []
      };

    } catch (error) {
      logger.warn('Erreur parsing, fallback:', error.message);
      return this.getFallbackEstimation(knownData);
    }
  }

  static getFallbackEstimation(knownData) {
    // Estimation basique basee sur la categorie
    const category = knownData.subcategory || knownData.category;
    const ultraTransformedCategories = ['biscuit', 'candy', 'chocolate-spread', 'soda', 'chips', 'cereal'];
    const isLikelyUltraTransformed = ultraTransformedCategories.includes(category);

    return {
      nova: !knownData.facts.nova ? {
        value: isLikelyUltraTransformed ? 4 : 3,
        confidence: 0.4,
        reasoning: 'Estimation basee sur la categorie ' + category,
        isEstimated: true
      } : null,
      nutriScore: null,
      description: null,
      typicalIngredients: []
    };
  }
}

module.exports = PremiumInsightsService;

