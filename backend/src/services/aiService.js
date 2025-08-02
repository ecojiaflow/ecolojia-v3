// backend/src/services/aiService.js
const axios = require('axios');
const { deepSeekCircuitBreaker } = require('./circuitBreaker');
const OpenAI = require('openai');

class AIService {
  constructor() {
    // Clients API
    this.deepseekClient = axios.create({
      baseURL: 'https://api.deepseek.com/v1',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // OpenAI comme fallback
    this.openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Cache de réponses pour économiser les appels API
    this.responseCache = new Map();
    this.CACHE_TTL = 3600000; // 1 heure

    // Fallback responses pour mode dégradé
    this.fallbackResponses = {
      productAnalysis: "Je suis temporairement limité dans mes capacités d'analyse. Basé sur les informations disponibles, ce produit semble contenir des ingrédients standards. Pour une analyse complète, veuillez réessayer dans quelques instants.",
      nutritionAdvice: "Le service de conseil nutritionnel est temporairement indisponible. N'oubliez pas de privilégier une alimentation équilibrée et variée. Pour des conseils personnalisés, consultez un professionnel de santé.",
      general: "Je rencontre actuellement des difficultés techniques. Veuillez réessayer dans quelques instants ou consulter notre FAQ pour les questions courantes."
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MÉTHODE PRINCIPALE AVEC CIRCUIT BREAKER
  // ═══════════════════════════════════════════════════════════════════════

  async chat(message, context = {}, userId) {
    // Vérifier le cache
    const cacheKey = this.generateCacheKey(message, context);
    const cachedResponse = this.getFromCache(cacheKey);
    if (cachedResponse) {
      console.log('[AIService] Response from cache');
      return {
        response: cachedResponse,
        source: 'cache',
        cached: true
      };
    }

    try {
      // Utiliser le circuit breaker pour DeepSeek
      const response = await deepSeekCircuitBreaker.execute(
        // Fonction principale
        async () => await this.callDeepSeek(message, context, userId),
        
        // Fonction fallback
        async () => await this.fallbackStrategy(message, context, userId)
      );

      // Mettre en cache si succès
      if (response.source === 'deepseek') {
        this.saveToCache(cacheKey, response.response);
      }

      return response;

    } catch (error) {
      console.error('[AIService] All strategies failed:', error);
      
      // Dernier recours : réponse statique
      return {
        response: this.getFallbackResponse(context.type),
        source: 'static_fallback',
        error: true
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // APPEL DEEPSEEK
  // ═══════════════════════════════════════════════════════════════════════

  async callDeepSeek(message, context, userId) {
    console.log('[AIService] Calling DeepSeek API');
    
    const systemPrompt = this.buildSystemPrompt(context);
    
    const response = await this.deepseekClient.post('/chat/completions', {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        ...(context.history || []),
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: context.maxTokens || 500,
      user: userId
    });

    return {
      response: response.data.choices[0].message.content,
      source: 'deepseek',
      model: 'deepseek-chat',
      usage: response.data.usage
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STRATÉGIES DE FALLBACK
  // ═══════════════════════════════════════════════════════════════════════

  async fallbackStrategy(message, context, userId) {
    console.log('[AIService] Circuit breaker OPEN - Using fallback strategy');
    
    // Stratégie 1 : Essayer OpenAI GPT-4
    if (process.env.OPENAI_API_KEY && context.allowGPT4 !== false) {
      try {
        return await this.callOpenAI(message, context, userId);
      } catch (error) {
        console.error('[AIService] OpenAI fallback failed:', error);
      }
    }

    // Stratégie 2 : Utiliser une réponse en cache similaire
    const similarResponse = this.findSimilarCachedResponse(message);
    if (similarResponse) {
      return {
        response: similarResponse,
        source: 'similar_cache',
        degraded: true
      };
    }

    // Stratégie 3 : Réponse générée localement
    return this.generateLocalResponse(message, context);
  }

  async callOpenAI(message, context, userId) {
    console.log('[AIService] Fallback to OpenAI GPT-4');
    
    const systemPrompt = this.buildSystemPrompt(context);
    
    const completion = await this.openaiClient.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: context.maxTokens || 500,
      user: userId
    });

    return {
      response: completion.choices[0].message.content,
      source: 'openai',
      model: 'gpt-4-turbo-preview',
      fallback: true,
      usage: completion.usage
    };
  }

  generateLocalResponse(message, context) {
    console.log('[AIService] Generating local response');
    
    // Analyse simple basée sur des mots-clés
    const lowercaseMessage = message.toLowerCase();
    
    if (context.type === 'product_analysis') {
      return {
        response: this.generateProductAnalysisResponse(context.product),
        source: 'local',
        degraded: true
      };
    }
    
    if (lowercaseMessage.includes('allergie') || lowercaseMessage.includes('allergène')) {
      return {
        response: "Les informations sur les allergènes sont disponibles dans la section 'Ingrédients' du produit. Les allergènes majeurs sont mis en évidence. En cas de doute, consultez toujours l'emballage du produit.",
        source: 'local',
        degraded: true
      };
    }
    
    if (lowercaseMessage.includes('nova') || lowercaseMessage.includes('transformation')) {
      return {
        response: "La classification NOVA évalue le degré de transformation des aliments de 1 (non transformé) à 4 (ultra-transformé). Privilégiez les produits NOVA 1 et 2 pour une alimentation plus saine.",
        source: 'local',
        degraded: true
      };
    }
    
    // Réponse générique
    return {
      response: this.fallbackResponses.general,
      source: 'local',
      degraded: true
    };
  }

  generateProductAnalysisResponse(product) {
    if (!product) {
      return this.fallbackResponses.productAnalysis;
    }

    let response = `Analyse rapide de ${product.name || 'ce produit'} :\n\n`;
    
    if (product.nova) {
      response += `• Classification NOVA : ${product.nova}/4\n`;
      response += product.nova >= 3 
        ? "  ⚠️ Produit transformé à ultra-transformé\n"
        : "  ✅ Produit peu transformé\n";
    }
    
    if (product.nutriscore) {
      response += `• Nutri-Score : ${product.nutriscore}\n`;
      response += product.nutriscore <= 'B'
        ? "  ✅ Bonne qualité nutritionnelle\n"
        : "  ⚠️ Qualité nutritionnelle à améliorer\n";
    }
    
    if (product.allergens && product.allergens.length > 0) {
      response += `• Allergènes : ${product.allergens.join(', ')}\n`;
    }
    
    response += "\nPour une analyse détaillée avec recommandations personnalisées, le service IA complet sera bientôt disponible.";
    
    return response;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // GESTION DU CACHE
  // ═══════════════════════════════════════════════════════════════════════

  generateCacheKey(message, context) {
    const contextStr = JSON.stringify({
      type: context.type,
      productId: context.productId,
      userId: context.userId
    });
    
    return `${message.substring(0, 100)}_${contextStr}`;
  }

  getFromCache(key) {
    const cached = this.responseCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.response;
    }
    
    // Nettoyer l'entrée expirée
    if (cached) {
      this.responseCache.delete(key);
    }
    
    return null;
  }

  saveToCache(key, response) {
    this.responseCache.set(key, {
      response,
      timestamp: Date.now()
    });
    
    // Limiter la taille du cache
    if (this.responseCache.size > 1000) {
      const firstKey = this.responseCache.keys().next().value;
      this.responseCache.delete(firstKey);
    }
  }

  findSimilarCachedResponse(message) {
    // Recherche simple basée sur les mots-clés
    const keywords = message.toLowerCase().split(' ').filter(word => word.length > 3);
    
    for (const [key, value] of this.responseCache) {
      const keyLower = key.toLowerCase();
      const matchCount = keywords.filter(keyword => keyLower.includes(keyword)).length;
      
      if (matchCount >= keywords.length * 0.6) {
        return value.response;
      }
    }
    
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PROMPTS SYSTÈME
  // ═══════════════════════════════════════════════════════════════════════

  buildSystemPrompt(context) {
    const basePrompt = `Tu es l'assistant IA d'ECOLOJIA, expert en nutrition, santé et produits de consommation. 
Tu analyses les produits alimentaires, cosmétiques et détergents selon des critères scientifiques.
Tu fournis des conseils personnalisés, bienveillants et basés sur des données fiables.
Réponds de manière concise mais informative, en utilisant des emojis pour rendre les réponses plus agréables.`;

    const contextPrompts = {
      product_analysis: `
Focus sur l'analyse du produit fourni. Mentionne:
- La classification NOVA et ce que cela signifie
- Le Nutri-Score et son interprétation
- Les points positifs et négatifs
- Des alternatives plus saines si nécessaire
- Des conseils de consommation`,
      
      nutrition_advice: `
Fournis des conseils nutritionnels personnalisés. Considère:
- Les besoins nutritionnels généraux
- L'équilibre alimentaire
- Les recommandations officielles (PNNS)
- Des suggestions pratiques et réalistes`,
      
      allergen_check: `
Analyse les allergènes avec précision. Mentionne:
- Les allergènes majeurs présents
- Les traces possibles
- Les risques de contamination croisée
- Les précautions à prendre`
    };

    return basePrompt + (contextPrompts[context.type] || '');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MÉTHODES UTILITAIRES
  // ═══════════════════════════════════════════════════════════════════════

  getFallbackResponse(type) {
    return this.fallbackResponses[type] || this.fallbackResponses.general;
  }

  getCircuitBreakerStatus() {
    return deepSeekCircuitBreaker.getStatus();
  }

  resetCircuitBreaker() {
    deepSeekCircuitBreaker.reset();
  }

  clearCache() {
    this.responseCache.clear();
  }
}

// Export singleton
module.exports = new AIService();