// backend/src/services/ai/NutritionistChatService.js
// Service de chat avec IA nutritionniste utilisant DeepSeek

const axios = require('axios');
const User = require('../../models/User');
const Analysis = require('../../models/Analysis');
const ChatHistory = require('../../models/ChatHistory');

class NutritionistChatService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.apiUrl = 'https://api.deepseek.com/v1/chat/completions';
    
    // Configuration du systeme
    this.systemPrompt = `Tu es NutriAI, l'assistant nutritionniste expert d'ECOLOJIA. Tu es specialise dans l'analyse nutritionnelle et la sante alimentaire.

Tes connaissances incluent :
- Analyse NOVA et Nutri-Score
- Additifs alimentaires et leurs effets sur la sante
- Allergenes et intolerances alimentaires
- Nutrition sportive et regimes speciaux
- Impact environnemental des aliments
- Lecture et interpretation des etiquettes

Ton approche :
- Bienveillant et pedagogue, jamais moralisateur
- Scientifiquement rigoureux avec des sources fiables
- Personnalise selon le profil de l'utilisateur
- Pratique avec des conseils applicables au quotidien
- Encourageant vers des choix plus sains et durables

Instructions importantes :
- Toujours rester dans le domaine de la nutrition et de l'alimentation
- Ne jamais remplacer un avis medical professionnel
- Citer les classifications NOVA et Nutri-Score quand pertinent
- Proposer des alternatives concretes et accessibles
- Adapter tes reponses au niveau de connaissance de l'utilisateur`;

    // Limites de tokens
    this.maxTokens = 500;
    this.maxContextMessages = 10;
  }

  /**
   * Envoie un message au chat IA
   * @param {string} userId - ID de l'utilisateur
   * @param {string} message - Message de l'utilisateur
   * @param {Object} context - Contexte additionnel (produit analyse, etc.)
   * @returns {Promise<Object>} Reponse de l'IA
   */
  async sendMessage(userId, message, context = {}) {
    try {
      // Verifier l'utilisateur et ses quotas
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouve');
      }

      // Verifier les quotas
      const quotaCheck = await this.checkQuota(user);
      if (!quotaCheck.allowed) {
        throw new Error(quotaCheck.message);
      }

      // Recuperer l'historique de conversation
      const conversationHistory = await this.getConversationHistory(userId);
      
      // Construire le contexte utilisateur
      const userContext = await this.buildUserContext(userId, context);
      
      // Preparer les messages pour l'API
      const messages = this.prepareMessages(
        message,
        conversationHistory,
        userContext
      );

      // Appeler l'API DeepSeek
      console.log('Ã°Å¸Â¤â€“ Appel API DeepSeek...');
      const response = await this.callDeepSeekAPI(messages);
      
      // Sauvegarder l'echange
      await this.saveConversation(userId, message, response.content, context);
      
      // Incrementer le compteur de quotas
      await this.incrementQuotaUsage(user);
      
      // Analyser la reponse pour des actions
      const actions = this.extractActions(response.content);
      
      return {
        success: true,
        response: response.content,
        actions,
        quotaRemaining: quotaCheck.remaining - 1,
        conversationId: conversationHistory[0]?.conversationId || null
      };

    } catch (error) {
      console.error('Ã¢ÂÅ’ Erreur chat IA:', error);
      
      // Gestion des erreurs specifiques
      if (error.response?.status === 429) {
        throw new Error('Limite de l\'API atteinte. Reessayez dans quelques instants.');
      }
      
      throw error;
    }
  }

  /**
   * Verifie les quotas de l'utilisateur
   */
  async checkQuota(user) {
    const limit = user.tier === 'premium' 
      ? (user.quotas?.aiQuestionsLimit || 500)
      : (user.quotas?.aiQuestionsLimit || 5);
      
    const used = user.quotas?.aiQuestionsUsed || 0;
    const remaining = limit - used;
    
    if (limit === -1) { // Illimite
      return { allowed: true, remaining: -1 };
    }
    
    if (remaining <= 0) {
      return {
        allowed: false,
        message: user.tier === 'free' 
          ? 'Quota depasse. Passez Â  Premium pour continuer.'
          : 'Quota mensuel depasse. Il se renouvellera le mois prochain.',
        remaining: 0
      };
    }
    
    return { allowed: true, remaining };
  }

  /**
   * Recupere l'historique de conversation
   */
  async getConversationHistory(userId) {
    const history = await ChatHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(this.maxContextMessages);
    
    return history.reverse(); // Ordre chronologique
  }

  /**
   * Construit le contexte utilisateur
   */
  async buildUserContext(userId, additionalContext) {
    // Recuperer les dernieres analyses
    const recentAnalyses = await Analysis.find({ userId })
      .populate('productId', 'name brand category')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Recuperer le profil utilisateur
    const user = await User.findById(userId)
      .select('preferences profile');
    
    // Calculer des statistiques
    const stats = await this.calculateUserStats(recentAnalyses);
    
    const context = {
      userProfile: {
        diet: user.preferences?.diet || 'omnivore',
        allergies: user.preferences?.allergies || [],
        intolerances: user.preferences?.intolerances || [],
        healthGoals: user.preferences?.healthGoals || [],
        activityLevel: user.profile?.activityLevel || 'moderate'
      },
      recentProducts: recentAnalyses.map(a => ({
        name: a.productId?.name,
        category: a.productId?.category,
        scores: {
          health: a.results?.scores?.health,
          nova: a.results?.scores?.nova,
          nutriScore: a.results?.scores?.nutriscore
        },
        date: a.createdAt
      })),
      stats,
      ...additionalContext
    };
    
    return context;
  }

  /**
   * Prepare les messages pour l'API
   */
  prepareMessages(currentMessage, history, context) {
    const messages = [
      {
        role: 'system',
        content: this.systemPrompt
      },
      {
        role: 'system',
        content: `Contexte utilisateur actuel :
${JSON.stringify(context, null, 2)}

Utilise ces informations pour personnaliser tes reponses.`
      }
    ];
    
    // Ajouter l'historique de conversation
    history.forEach(exchange => {
      messages.push({
        role: 'user',
        content: exchange.userMessage
      });
      messages.push({
        role: 'assistant',
        content: exchange.aiResponse
      });
    });
    
    // Ajouter le message actuel
    messages.push({
      role: 'user',
      content: currentMessage
    });
    
    return messages;
  }

  /**
   * Appelle l'API DeepSeek
   */
  async callDeepSeekAPI(messages) {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'deepseek-chat',
          messages,
          temperature: 0.7,
          max_tokens: this.maxTokens,
          top_p: 0.9,
          frequency_penalty: 0.3,
          presence_penalty: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 secondes
        }
      );
      
      return response.data.choices[0].message;
      
    } catch (error) {
      console.error('Erreur API DeepSeek:', error.response?.data || error);
      
      if (error.response?.status === 401) {
        throw new Error('Cle API invalide');
      }
      
      throw new Error('Erreur de communication avec l\'IA');
    }
  }

  /**
   * Sauvegarde la conversation
   */
  async saveConversation(userId, userMessage, aiResponse, context) {
    try {
      // Generer un ID de conversation si necessaire
      const lastChat = await ChatHistory.findOne({ userId })
        .sort({ createdAt: -1 });
      
      const conversationId = lastChat?.conversationId || 
        `conv_${userId}_${Date.now()}`;
      
      await ChatHistory.create({
        userId,
        conversationId,
        userMessage,
        aiResponse,
        context,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Erreur sauvegarde conversation:', error);
    }
  }

  /**
   * Incremente l'utilisation du quota
   */
  async incrementQuotaUsage(user) {
    user.quotas.aiQuestionsUsed = (user.quotas.aiQuestionsUsed || 0) + 1;
    await user.save();
  }

  /**
   * Extrait les actions suggerees de la reponse
   */
  extractActions(response) {
    const actions = [];
    
    // Recherche de produits mentionnes
    const productPattern = /recherch(?:er|ez) "([^"]+)"/gi;
    let match;
    while ((match = productPattern.exec(response)) !== null) {
      actions.push({
        type: 'search_product',
        value: match[1]
      });
    }
    
    // Suggestions d'alternatives
    if (response.includes('alternative') || response.includes('remplacer')) {
      actions.push({
        type: 'suggest_alternatives',
        value: true
      });
    }
    
    // Recommandation de scan
    if (response.includes('scanner') || response.includes('analyser')) {
      actions.push({
        type: 'recommend_scan',
        value: true
      });
    }
    
    return actions;
  }

  /**
   * Calcule les statistiques utilisateur
   */
  async calculateUserStats(analyses) {
    if (!analyses || analyses.length === 0) {
      return {
        avgHealthScore: null,
        commonCategories: [],
        improvements: []
      };
    }
    
    // Score sante moyen
    const healthScores = analyses
      .map(a => a.results?.scores?.health)
      .filter(s => s !== undefined);
    
    const avgHealthScore = healthScores.length > 0
      ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length)
      : null;
    
    // Categories frequentes
    const categories = {};
    analyses.forEach(a => {
      const cat = a.productId?.category || 'unknown';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    
    const commonCategories = Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat);
    
    // Tendances d'amelioration
    const improvements = [];
    if (healthScores.length >= 3) {
      const recent = healthScores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      const older = healthScores.slice(-3).reduce((a, b) => a + b, 0) / 3;
      
      if (recent > older + 5) {
        improvements.push('scores_improving');
      } else if (recent < older - 5) {
        improvements.push('scores_declining');
      }
    }
    
    return {
      avgHealthScore,
      commonCategories,
      improvements
    };
  }

  /**
   * Genere une reponse Â  une question sur un produit specifique
   */
  async answerProductQuestion(userId, productId, question) {
    try {
      // Recuperer l'analyse du produit
      const analysis = await Analysis.findOne({ userId, productId })
        .populate('productId')
        .sort({ createdAt: -1 });
      
      if (!analysis) {
        throw new Error('Produit non analyse');
      }
      
      // Contexte specifique au produit
      const productContext = {
        currentProduct: {
          name: analysis.productId.name,
          brand: analysis.productId.brand,
          category: analysis.productId.category,
          scores: analysis.results.scores,
          ingredients: analysis.productId.foodData?.ingredients,
          additives: analysis.results.details?.additives,
          allergens: analysis.results.details?.allergens,
          concerns: analysis.results.details?.concerns
        }
      };
      
      // Ajouter un prefixe Â  la question pour orienter l'IA
      const enhancedQuestion = `Concernant le produit "${analysis.productId.name}" : ${question}`;
      
      return await this.sendMessage(userId, enhancedQuestion, productContext);
      
    } catch (error) {
      console.error('Erreur question produit:', error);
      throw error;
    }
  }

  /**
   * Genere des suggestions personnalisees
   */
  async generateSuggestions(userId) {
    const prompt = `Donne-moi 3 conseils nutritionnels personnalises bases sur mon historique recent d'analyses de produits. Sois concret et actionnable.`;
    
    return await this.sendMessage(userId, prompt, { 
      requestType: 'suggestions' 
    });
  }

  /**
   * Analyse comparative de produits
   */
  async compareProducts(userId, productIds) {
    try {
      // Recuperer les analyses des produits
      const analyses = await Analysis.find({
        userId,
        productId: { $in: productIds }
      }).populate('productId');
      
      if (analyses.length < 2) {
        throw new Error('Pas assez de produits Â  comparer');
      }
      
      // Preparer le contexte de comparaison
      const comparisonContext = {
        comparison: analyses.map(a => ({
          name: a.productId.name,
          scores: a.results.scores,
          mainConcerns: a.results.details?.concerns?.slice(0, 3)
        }))
      };
      
      const prompt = `Compare ces ${analyses.length} produits en termes de qualite nutritionnelle, d'impact sante et donne une recommandation claire.`;
      
      return await this.sendMessage(userId, prompt, comparisonContext);
      
    } catch (error) {
      console.error('Erreur comparaison produits:', error);
      throw error;
    }
  }

  /**
   * Reinitialise une conversation
   */
  async clearConversation(userId) {
    try {
      // Marquer les anciennes conversations comme archivees
      await ChatHistory.updateMany(
        { userId, archived: { $ne: true } },
        { archived: true }
      );
      
      return {
        success: true,
        message: 'Conversation reinitialisee'
      };
      
    } catch (error) {
      console.error('Erreur reinitialisation conversation:', error);
      throw error;
    }
  }

  /**
   * Recupere l'historique complet d'une conversation
   */
  async getFullConversation(userId, conversationId) {
    try {
      const history = await ChatHistory.find({
        userId,
        conversationId
      }).sort({ createdAt: 1 });
      
      return history.map(h => ({
        id: h._id,
        userMessage: h.userMessage,
        aiResponse: h.aiResponse,
        timestamp: h.timestamp,
        context: h.context
      }));
      
    } catch (error) {
      console.error('Erreur recuperation conversation:', error);
      return [];
    }
  }

  /**
   * Obtient des suggestions de questions
   */
  async getQuestionSuggestions(userId, context = {}) {
    const suggestions = [
      "Quels sont les additifs Â  eviter absolument ?",
      "Comment reduire ma consommation de sucre ?",
      "Quelles alternatives saines pour mes snacks ?",
      "Comment lire correctement une etiquette nutritionnelle ?",
      "Quelle est la difference entre NOVA 3 et NOVA 4 ?"
    ];
    
    // Personnaliser selon le contexte
    if (context.lastProduct) {
      suggestions.unshift(
        `Ce produit est-il adapte Â  mon regime ?`,
        `Quelles sont les alternatives plus saines ?`
      );
    }
    
    if (context.userHasAllergies) {
      suggestions.push(
        "Comment reperer mes allergenes sur les etiquettes ?",
        "Quels produits sont surs pour mes allergies ?"
      );
    }
    
    return suggestions.slice(0, 5);
  }
}

// Export singleton
module.exports = new NutritionistChatService();
