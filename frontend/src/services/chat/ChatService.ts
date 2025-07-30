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

  // ✅ Configuration API
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
      // Mettre à jour le contexte si fourni
      if (context) {
        this.currentContext = context;
      }

      // Ajouter le message utilisateur à l'historique
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
        reply: "❌ Désolé, je rencontre un problème technique. Pouvez-vous reformuler votre question ?",
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

    // ✅ Réponses contextuelles si analyse NOVA disponible
    if (context) {
      return this.getContextualResponse(msg, context);
    }

    // ✅ Réponses générales par mots-clés
    if (msg.includes('nova')) {
      return {
        reply: "📊 **Classification NOVA** - Niveau de transformation :\n\n🟢 **NOVA 1** : Aliments naturels (fruits, légumes, viandes)\n🟡 **NOVA 2** : Ingrédients culinaires (huile, sel, sucre)\n🟠 **NOVA 3** : Aliments transformés (pain, fromage)\n🔴 **NOVA 4** : Ultra-transformés (sodas, plats préparés)\n\n➡️ **Conseil** : Limitez NOVA 4, privilégiez NOVA 1-2 !",
        suggestions: ["Pourquoi éviter NOVA 4", "Exemples NOVA 1", "Analyser un produit"],
        confidence: 0.9
      };
    }

    if (msg.includes('additif')) {
      return {
        reply: "⚗️ Les additifs alimentaires les plus préoccupants :\n\n• **E150d** (Caramel IV) - Colorant potentiellement problématique\n• **E621** (Glutamate) - Exhausteur de goût\n• **E211** (Benzoate) - Conservateur\n• **E320/E321** (BHA/BHT) - Antioxydants synthétiques\n\n💡 **Conseil** : Moins d'additifs = mieux !",
        suggestions: ["Rechercher produit sans additifs", "Classification des additifs", "Alternatives naturelles"],
        confidence: 0.85
      };
    }

    if (msg.includes('santé') || msg.includes('sain')) {
      return {
        reply: "🥗 **Pour une alimentation plus saine** :\n\n✅ **Privilégier NOVA 1-2** (aliments peu transformés)\n✅ **Lire les étiquettes** (moins d'ingrédients = mieux)\n✅ **Cuisiner maison** quand possible\n✅ **Varier les sources** de nutriments\n✅ **Limiter les produits ultra-transformés**\n\nVoulez-vous analyser vos produits actuels ?",
        suggestions: ["Analyser mes produits", "Groupes NOVA", "Recettes simples"],
        confidence: 0.9
      };
    }

    if (msg.includes('bio')) {
      return {
        reply: "🌿 **Avantages du bio** :\n\n✅ **Sans pesticides de synthèse**\n✅ **Plus de nutriments** (études montrent +20-40% antioxydants)\n✅ **Meilleur pour l'environnement**\n✅ **Bien-être animal**\n\nLe bio se marie parfaitement avec NOVA 1-2 !",
        suggestions: ["Rechercher produits bio", "Bio vs conventionnel", "Labels qualité"],
        confidence: 0.8
      };
    }

    if (msg.includes('alternative') || msg.includes('remplacer')) {
      return {
        reply: "🔄 **Trouver des alternatives saines** :\n\n• **Utiliser notre recherche** pour comparer\n• **Viser NOVA 1-2** maximum\n• **Choisir moins d'ingrédients**\n• **Préférer le fait-maison**\n• **Lire les compositions**\n\nQue souhaitez-vous remplacer ?",
        suggestions: ["Rechercher des produits", "Cuisiner maison", "Décoder étiquettes"],
        confidence: 0.8
      };
    }

    // Réponse par défaut
    return {
      reply: "🤖 Je suis votre assistant nutritionnel ECOLOJIA !\n\nJe peux vous aider à :\n• 🔬 Comprendre les analyses NOVA\n• ⚗️ Décoder les additifs alimentaires\n• 🥗 Donner des conseils nutritionnels\n• 🌱 Trouver des alternatives saines\n\nQue voulez-vous savoir ?",
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
          reply: `✅ **"${context.productName}"** est un excellent choix !\n\n🟢 **NOVA 1** - Aliment naturel peu transformé\n📊 **Score santé** : ${context.healthScore}/100\n🌱 **Recommandation** : Parfait pour une alimentation saine\n\nContinuez comme ça !`,
          suggestions: ["Autres produits NOVA 1", "Conseils nutrition", "Recettes avec ce produit"],
          confidence: 0.95
        };
      } else if (context.novaGroup === 4) {
        return {
          reply: `⚠️ **"${context.productName}"** est à consommer avec modération.\n\n🔴 **NOVA 4** - Produit ultra-transformé\n📊 **Score santé** : ${context.healthScore}/100\n${context.additives && context.additives.length > 0 ? `⚗️ **Additifs détectés** : ${context.additives.length}` : ''}\n\n💡 **Conseil** : Consommation occasionnelle recommandée.`,
          suggestions: ["Voir les additifs", "Trouver des alternatives", "Pourquoi éviter NOVA 4"],
          confidence: 0.9
        };
      } else {
        return {
          reply: `👌 **"${context.productName}"** est acceptable en consommation modérée.\n\n🟡 **NOVA ${context.novaGroup}** - Produit transformé\n📊 **Score santé** : ${context.healthScore}/100\n💡 **Conseil** : Privilégiez la version maison quand possible.`,
          suggestions: ["Recettes maison", "Alternatives plus saines", "Conseils nutrition"],
          confidence: 0.8
        };
      }
    }

    if (msg.includes('additif')) {
      if (context.additives && context.additives.length > 0) {
        const highRiskAdditives = context.additives.filter(a => a.riskLevel === 'high');
        const mediumRiskAdditives = context.additives.filter(a => a.riskLevel === 'medium');
        
        let response = `⚗️ **Additifs dans "${context.productName}"** :\n\n`;
        
        if (highRiskAdditives.length > 0) {
          response += `🔴 **Risque élevé** :\n`;
          highRiskAdditives.forEach(additive => {
            response += `• ${additive.code} (${additive.name})\n`;
          });
        }
        
        if (mediumRiskAdditives.length > 0) {
          response += `🟡 **Risque modéré** :\n`;
          mediumRiskAdditives.forEach(additive => {
            response += `• ${additive.code} (${additive.name})\n`;
          });
        }
        
        response += `\n💡 **Conseil** : ${highRiskAdditives.length > 0 ? 'Limitez la consommation' : 'Consommation modérée acceptable'}`;
        
        return {
          reply: response,
          suggestions: ["Alternatives sans additifs", "Expliquer les codes E", "Produits plus naturels"],
          confidence: 0.9
        };
      } else {
        return {
          reply: `✅ **"${context.productName}"** ne contient pas d'additifs préoccupants détectés !\n\n🌱 C'est un bon point pour la naturalité du produit.\n💡 **Conseil** : Continuez à privilégier ce type de produits.`,
          suggestions: ["Autres produits naturels", "Conseils nutrition", "Recettes saines"],
          confidence: 0.85
        };
      }
    }

    if (msg.includes('alternative') || msg.includes('remplacer')) {
      return {
        reply: `🔄 **Alternatives à "${context.productName}"** :\n\n• **Rechercher** des produits similaires NOVA 1-2\n• **Version bio** si disponible\n• **Fait maison** pour contrôler les ingrédients\n• **Produits** avec moins d'additifs\n\nVoulez-vous que je vous aide à chercher ?`,
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
        reply: `💡 **Mes recommandations pour "${context.productName}"** :\n\n${recommendations.map(rec => `• ${rec}`).join('\n')}\n\n🔬 **Basé sur** : Classification NOVA ${context.novaGroup} et score santé ${context.healthScore}/100`,
        suggestions: ["Alternatives plus saines", "Analyse détaillée", "Conseils nutrition"],
        confidence: 0.9
      };
    }

    // Réponse contextuelle par défaut
    return {
      reply: `🔬 **Analyse de "${context.productName}"** :\n\n📊 **Groupe NOVA** : ${context.novaGroup}\n📈 **Score santé** : ${context.healthScore}/100\n⚗️ **Additifs** : ${context.additives?.length || 0} détecté(s)\n\nQue voulez-vous savoir de plus ?`,
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

// ✅ Instance singleton du service
export const chatService = new ChatService();

// ✅ Helpers pour l'intégration
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