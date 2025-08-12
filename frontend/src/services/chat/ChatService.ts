// PATH: frontend/ecolojiaFrontV3/src/services/chat/ChatService.ts

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  context?: any;
}

export interface ChatResponse {
  reply: string;
  suggestions?: string[];
  confidence: number;
}

export interface ProductContext {
  productName: string;
  novaGroup: number;
  additives?: Array<{
    code: string;
    name: string;
    riskLevel: 'low' | 'medium' | 'high';
  }>;
  healthScore: number;
  recommendations?: string[];
}

class ChatService {
  private conversationHistory: ChatMessage[] = [];
  private currentContext: ProductContext | null = null;

  // âÅ“â€¦ Configuration API
  private readonly API_BASE = 'https://ecolojia-backend-working.onrender.com';
  private readonly CHAT_ENDPOINT = '/api/chat/conversation';

  /**
   * Envoie un message au chat IA
   */
  async sendMessage(
    message: string, 
    context?: ProductContext
  ): Promise<ChatResponse> {
    try {
      // Mettre ÃƒÂ  jour le contexte si fourni
      if (context) {
        this.currentContext = context;
      }

      // Ajouter le message utilisateur ÃƒÂ  l'historique
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: message,
        timestamp: new Date()
      };
      this.conversationHistory.push(userMessage);

      // Tentative d'appel API backend
      try {
        const response = await fetch(`${this.API_BASE}${this.CHAT_ENDPOINT}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            message: message,
            context: this.currentContext,
            history: this.conversationHistory.slice(-10) // 10 derniers messages
          })
        });

        if (response.ok) {
          const result = await response.json();
          return {
            reply: result.reply,
            suggestions: result.suggestions || [],
            confidence: result.confidence || 0.8
          };
        }
      } catch (error) {
        console.warn('API chat indisponible, utilisation du fallback intelligent');
      }

      // Fallback vers IA locale intelligente
      return this.getIntelligentResponse(message, this.currentContext);

    } catch (error) {
      console.error('Erreur service chat:', error);
      return {
        reply: "âÂÅ’ Désolé, je rencontre un problème technique. Pouvez-vous reformuler votre question ?",
        suggestions: ["Réessayer", "Analyser un produit", "Conseils nutrition"],
        confidence: 0.3
      };
    }
  }

  /**
   * Réponses intelligentes locales basées sur le contexte
   */
  private getIntelligentResponse(message: string, context?: ProductContext | null): ChatResponse {
    const msg = message.toLowerCase();

    // âÅ“â€¦ Réponses contextuelles si analyse NOVA disponible
    if (context) {
      return this.getContextualResponse(msg, context);
    }

    // âÅ“â€¦ Réponses générales par mots-clés
    if (msg.includes('nova')) {
      return {
        reply: "Ã°Å¸â€œÅ  **Classification NOVA** - Niveau de transformation :\n\nÃ°Å¸Å¸Â¢ **NOVA 1** : Aliments naturels (fruits, légumes, viandes)\nÃ°Å¸Å¸Â¡ **NOVA 2** : Ingrédients culinaires (huile, sel, sucre)\nÃ°Å¸Å¸Â  **NOVA 3** : Aliments transformés (pain, fromage)\nÃ°Å¸â€Â´ **NOVA 4** : Ultra-transformés (sodas, plats préparés)\n\nâÅ¾Â¡ïÂ¸Â **Conseil** : Limitez NOVA 4, privilégiez NOVA 1-2 !",
        suggestions: ["Pourquoi éviter NOVA 4", "Exemples NOVA 1", "Analyser un produit"],
        confidence: 0.9
      };
    }

    if (msg.includes('additif')) {
      return {
        reply: "âÅ¡â€”ïÂ¸Â Les additifs alimentaires les plus préoccupants :\n\nâ€Â¢ **E150d** (Caramel IV) - Colorant potentiellement problématique\nâ€Â¢ **E621** (Glutamate) - Exhausteur de goÃƒÂ»t\nâ€Â¢ **E211** (Benzoate) - Conservateur\nâ€Â¢ **E320/E321** (BHA/BHT) - Antioxydants synthétiques\n\nÃ°Å¸â€™Â¡ **Conseil** : Moins d'additifs = mieux !",
        suggestions: ["Rechercher produit sans additifs", "Classification des additifs", "Alternatives naturelles"],
        confidence: 0.85
      };
    }

    if (msg.includes('santé') || msg.includes('sain')) {
      return {
        reply: "Ã°Å¸Â¥â€” **Pour une alimentation plus saine** :\n\nâÅ“â€¦ **Privilégier NOVA 1-2** (aliments peu transformés)\nâÅ“â€¦ **Lire les étiquettes** (moins d'ingrédients = mieux)\nâÅ“â€¦ **Cuisiner maison** quand possible\nâÅ“â€¦ **Varier les sources** de nutriments\nâÅ“â€¦ **Limiter les produits ultra-transformés**\n\nVoulez-vous analyser vos produits actuels ?",
        suggestions: ["Analyser mes produits", "Groupes NOVA", "Recettes simples"],
        confidence: 0.9
      };
    }

    if (msg.includes('bio')) {
      return {
        reply: "Ã°Å¸Å’Â¿ **Avantages du bio** :\n\nâÅ“â€¦ **Sans pesticides de synthèse**\nâÅ“â€¦ **Plus de nutriments** (études montrent +20-40% antioxydants)\nâÅ“â€¦ **Meilleur pour l'environnement**\nâÅ“â€¦ **Bien-être animal**\n\nLe bio se marie parfaitement avec NOVA 1-2 !",
        suggestions: ["Rechercher produits bio", "Bio vs conventionnel", "Labels qualité"],
        confidence: 0.8
      };
    }

    if (msg.includes('alternative') || msg.includes('remplacer')) {
      return {
        reply: "Ã°Å¸â€â€ž **Trouver des alternatives saines** :\n\nâ€Â¢ **Utiliser notre recherche** pour comparer\nâ€Â¢ **Viser NOVA 1-2** maximum\nâ€Â¢ **Choisir moins d'ingrédients**\nâ€Â¢ **Préférer le fait-maison**\nâ€Â¢ **Lire les compositions**\n\nQue souhaitez-vous remplacer ?",
        suggestions: ["Rechercher des produits", "Cuisiner maison", "Décoder étiquettes"],
        confidence: 0.8
      };
    }

    // Réponse par défaut
    return {
      reply: "Ã°Å¸Â¤â€“ Je suis votre assistant nutritionnel ECOLOJIA !\n\nJe peux vous aider ÃƒÂ  :\nâ€Â¢ Ã°Å¸â€Â¬ Comprendre les analyses NOVA\nâ€Â¢ âÅ¡â€”ïÂ¸Â Décoder les additifs alimentaires\nâ€Â¢ Ã°Å¸Â¥â€” Donner des conseils nutritionnels\nâ€Â¢ Ã°Å¸Å’Â± Trouver des alternatives saines\n\nQue voulez-vous savoir ?",
      suggestions: ["Analyser un produit", "Groupes NOVA", "Additifs dangereux", "Conseils nutrition"],
      confidence: 0.7
    };
  }

  /**
   * Réponses basées sur le contexte d'analyse NOVA
   */
  private getContextualResponse(message: string, context: ProductContext): ChatResponse {
    const msg = message.toLowerCase();

    if (msg.includes('sain') || msg.includes('santé')) {
      if (context.novaGroup === 1) {
        return {
          reply: `âÅ“â€¦ **"${context.productName}"** est un excellent choix !\n\nÃ°Å¸Å¸Â¢ **NOVA 1** - Aliment naturel peu transformé\nÃ°Å¸â€œÅ  **Score santé** : ${context.healthScore}/100\nÃ°Å¸Å’Â± **Recommandation** : Parfait pour une alimentation saine\n\nContinuez comme ça !`,
          suggestions: ["Autres produits NOVA 1", "Conseils nutrition", "Recettes avec ce produit"],
          confidence: 0.95
        };
      } else if (context.novaGroup === 4) {
        return {
          reply: `âÅ¡Â ïÂ¸Â **"${context.productName}"** est ÃƒÂ  consommer avec modération.\n\nÃ°Å¸â€Â´ **NOVA 4** - Produit ultra-transformé\nÃ°Å¸â€œÅ  **Score santé** : ${context.healthScore}/100\n${context.additives && context.additives.length > 0 ? `âÅ¡â€”ïÂ¸Â **Additifs détectés** : ${context.additives.length}` : ''}\n\nÃ°Å¸â€™Â¡ **Conseil** : Consommation occasionnelle recommandée.`,
          suggestions: ["Voir les additifs", "Trouver des alternatives", "Pourquoi éviter NOVA 4"],
          confidence: 0.9
        };
      } else {
        return {
          reply: `Ã°Å¸â€˜Å’ **"${context.productName}"** est acceptable en consommation modérée.\n\nÃ°Å¸Å¸Â¡ **NOVA ${context.novaGroup}** - Produit transformé\nÃ°Å¸â€œÅ  **Score santé** : ${context.healthScore}/100\nÃ°Å¸â€™Â¡ **Conseil** : Privilégiez la version maison quand possible.`,
          suggestions: ["Recettes maison", "Alternatives plus saines", "Conseils nutrition"],
          confidence: 0.8
        };
      }
    }

    if (msg.includes('additif')) {
      if (context.additives && context.additives.length > 0) {
        const highRiskAdditives = context.additives.filter(a => a.riskLevel === 'high');
        const mediumRiskAdditives = context.additives.filter(a => a.riskLevel === 'medium');
        
        let response = `âÅ¡â€”ïÂ¸Â **Additifs dans "${context.productName}"** :\n\n`;
        
        if (highRiskAdditives.length > 0) {
          response += `Ã°Å¸â€Â´ **Risque élevé** :\n`;
          highRiskAdditives.forEach(additive => {
            response += `â€Â¢ ${additive.code} (${additive.name})\n`;
          });
        }
        
        if (mediumRiskAdditives.length > 0) {
          response += `Ã°Å¸Å¸Â¡ **Risque modéré** :\n`;
          mediumRiskAdditives.forEach(additive => {
            response += `â€Â¢ ${additive.code} (${additive.name})\n`;
          });
        }
        
        response += `\nÃ°Å¸â€™Â¡ **Conseil** : ${highRiskAdditives.length > 0 ? 'Limitez la consommation' : 'Consommation modérée acceptable'}`;
        
        return {
          reply: response,
          suggestions: ["Alternatives sans additifs", "Expliquer les codes E", "Produits plus naturels"],
          confidence: 0.9
        };
      } else {
        return {
          reply: `âÅ“â€¦ **"${context.productName}"** ne contient pas d'additifs préoccupants détectés !\n\nÃ°Å¸Å’Â± C'est un bon point pour la naturalité du produit.\nÃ°Å¸â€™Â¡ **Conseil** : Continuez ÃƒÂ  privilégier ce type de produits.`,
          suggestions: ["Autres produits naturels", "Conseils nutrition", "Recettes saines"],
          confidence: 0.85
        };
      }
    }

    if (msg.includes('alternative') || msg.includes('remplacer')) {
      return {
        reply: `Ã°Å¸â€â€ž **Alternatives ÃƒÂ  "${context.productName}"** :\n\nâ€Â¢ **Rechercher** des produits similaires NOVA 1-2\nâ€Â¢ **Version bio** si disponible\nâ€Â¢ **Fait maison** pour contrôler les ingrédients\nâ€Â¢ **Produits** avec moins d'additifs\n\nVoulez-vous que je vous aide ÃƒÂ  chercher ?`,
        suggestions: ["Rechercher alternatives", "Recettes maison", "Produits bio similaires"],
        confidence: 0.8
      };
    }

    if (msg.includes('recommandation') || msg.includes('conseil')) {
      const recommendations = context.recommendations || [
        "Consommer avec modération",
        "Privilégier les alternatives naturelles",
        "Lire attentivement les étiquettes"
      ];
      
      return {
        reply: `Ã°Å¸â€™Â¡ **Mes recommandations pour "${context.productName}"** :\n\n${recommendations.map(rec => `â€Â¢ ${rec}`).join('\n')}\n\nÃ°Å¸â€Â¬ **Basé sur** : Classification NOVA ${context.novaGroup} et score santé ${context.healthScore}/100`,
        suggestions: ["Alternatives plus saines", "Analyse détaillée", "Conseils nutrition"],
        confidence: 0.9
      };
    }

    // Réponse contextuelle par défaut
    return {
      reply: `Ã°Å¸â€Â¬ **Analyse de "${context.productName}"** :\n\nÃ°Å¸â€œÅ  **Groupe NOVA** : ${context.novaGroup}\nÃ°Å¸â€œË† **Score santé** : ${context.healthScore}/100\nâÅ¡â€”ïÂ¸Â **Additifs** : ${context.additives?.length || 0} détecté(s)\n\nQue voulez-vous savoir de plus ?`,
      suggestions: ["Ce produit est-il sain ?", "Voir les additifs", "Trouver des alternatives", "Conseils nutrition"],
      confidence: 0.8
    };
  }

  /**
   * Obtenir l'historique des conversations
   */
  getConversationHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Effacer l'historique
   */
  clearHistory(): void {
    this.conversationHistory = [];
    this.currentContext = null;
  }

  /**
   * Définir le contexte produit
   */
  setProductContext(context: ProductContext): void {
    this.currentContext = context;
  }

  /**
   * Obtenir le contexte actuel
   */
  getCurrentContext(): ProductContext | null {
    return this.currentContext;
  }

  /**
   * Suggestions de questions selon le contexte
   */
  getSuggestedQuestions(context?: ProductContext): string[] {
    if (context) {
      // Questions contextuelles selon le produit analysé
      const baseQuestions = ["Ce produit est-il sain ?", "Quels additifs contient-il ?"];
      
      if (context.novaGroup >= 3) {
        baseQuestions.push("Alternatives plus saines");
      }
      
      if (context.additives && context.additives.length > 0) {
        baseQuestions.push("Expliquer les additifs");
      }
      
      baseQuestions.push("Conseils nutrition");
      return baseQuestions;
    }

    // Questions générales
    return [
      "Analyser un produit",
      "Que signifie NOVA ?",
      "Additifs dangereux",
      "Manger plus sain",
      "Produits bio vs conventionnels",
      "Comment lire les étiquettes"
    ];
  }
}

// âÅ“â€¦ Instance singleton du service
export const chatService = new ChatService();

// âÅ“â€¦ Helpers pour l'intégration
export const createProductContext = (novaResult: any): ProductContext => {
  return {
    productName: novaResult.productName,
    novaGroup: novaResult.novaGroup,
    additives: novaResult.additives?.detected || [],
    healthScore: novaResult.healthScore,
    recommendations: novaResult.recommendations
  };
};

export default ChatService;
// EOF
