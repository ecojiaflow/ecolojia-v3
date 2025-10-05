// PATH: frontend/src/services/chat/ChatService.ts
import * as api from '../api';

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
  productName?: string;
  novaGroup?: number;
  additives?: Array<{
    code: string;
    name: string;
    riskLevel: 'low' | 'medium' | 'high';
  }>;
  healthScore?: number;
  recommendations?: string[];
}

class ChatService {
  private conversationHistory: ChatMessage[] = [];
  private currentContext: ProductContext | null = null;

  /**
   * Envoie un message au chat IA
   */
  async sendMessage(
    message: string, 
    context?: ProductContext
  ): Promise<ChatResponse> {
    // Mettre � jour le contexte si fourni
    if (context) {
      this.currentContext = context;
    }

    // Ajouter le message utilisateur � l'historique
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    this.conversationHistory.push(userMessage);

    try {
      // Appel API backend unifie
      const resp = await api.post('/ai/chat', {
        message,
        context: this.currentContext,
        history: this.conversationHistory.slice(-10) // 10 derniers messages
      });

      if (resp.success) {
        const payload: any = (resp as any).data || {};
        const replyText = payload.response?.reply || payload.reply || '...';
        const suggestions = payload.response?.suggestions || payload.suggestions || [];
        const confidence = payload.response?.confidence ?? payload.confidence ?? 0.8;

        // Ajouter reponse IA � l'historique
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: replyText,
          timestamp: new Date(),
          suggestions
        };
        this.conversationHistory.push(aiMessage);

        return {
          reply: replyText,
          suggestions,
          confidence
        };
      }
    } catch (error) {
      console.warn('API chat indisponible, utilisation du fallback intelligent');
    }

    // Fallback vers reponses intelligentes locales
    return this.getIntelligentResponse(message, this.currentContext);
  }

  /**
   * Reponses intelligentes locales basees sur le contexte
   */
  private getIntelligentResponse(message: string, context?: ProductContext | null): ChatResponse {
    const msg = message.toLowerCase();

    // Reponses contextuelles si analyse disponible
    if (context) {
      return this.getContextualResponse(msg, context);
    }

    // Reponses generales par mots-cles
    if (msg.includes('nova')) {
      return {
        reply: "📊 **Classification NOVA** - Niveau de transformation :\n\n🟢 **NOVA 1** : Aliments naturels (fruits, legumes, viandes)\n🟡 **NOVA 2** : Ingredients culinaires (huile, sel, sucre)\n🟠 **NOVA 3** : Aliments transformes (pain, fromage)\n🔴 **NOVA 4** : Ultra-transformes (sodas, plats prepares)\n\n💡 **Conseil** : Limitez NOVA 4, privilegiez NOVA 1-2 !",
        suggestions: ["Pourquoi eviter NOVA 4", "Exemples NOVA 1", "Analyser un produit"],
        confidence: 0.9
      };
    }

    if (msg.includes('additif')) {
      return {
        reply: "⚠️ Les additifs alimentaires les plus preoccupants :\n\n• **E150d** (Caramel IV) - Colorant potentiellement problematique\n• **E621** (Glutamate) - Exhausteur de gout\n• **E211** (Benzoate) - Conservateur\n• **E320/E321** (BHA/BHT) - Antioxydants synthetiques\n\n💡 **Conseil** : Moins d'additifs = mieux !",
        suggestions: ["Rechercher produit sans additifs", "Classification des additifs", "Alternatives naturelles"],
        confidence: 0.85
      };
    }

    if (msg.includes('sante') || msg.includes('sain')) {
      return {
        reply: "🥗 **Pour une alimentation plus saine** :\n\n✅ **Privilegier NOVA 1-2** (aliments peu transformes)\n✅ **Lire les etiquettes** (moins d'ingredients = mieux)\n✅ **Cuisiner maison** quand possible\n✅ **Varier les sources** de nutriments\n✅ **Limiter les produits ultra-transformes**\n\nVoulez-vous analyser vos produits actuels ?",
        suggestions: ["Analyser mes produits", "Groupes NOVA", "Recettes simples"],
        confidence: 0.9
      };
    }

    if (msg.includes('bio')) {
      return {
        reply: "🌿 **Avantages du bio** :\n\n✅ **Sans pesticides de synthese**\n✅ **Plus de nutriments** (etudes montrent +20-40% antioxydants)\n✅ **Meilleur pour l'environnement**\n✅ **Bien-etre animal**\n\nLe bio se marie parfaitement avec NOVA 1-2 !",
        suggestions: ["Rechercher produits bio", "Bio vs conventionnel", "Labels qualite"],
        confidence: 0.8
      };
    }

    if (msg.includes('alternative') || msg.includes('remplacer')) {
      return {
        reply: "🔄 **Trouver des alternatives saines** :\n\n• **Utiliser notre recherche** pour comparer\n• **Viser NOVA 1-2** maximum\n• **Choisir moins d'ingredients**\n• **Preferer le fait-maison**\n• **Lire les compositions**\n\nQue souhaitez-vous remplacer ?",
        suggestions: ["Rechercher des produits", "Cuisiner maison", "Decoder etiquettes"],
        confidence: 0.8
      };
    }

    // Reponse par defaut
    return {
      reply: "🤖 Je suis votre assistant nutritionnel ECOLOJIA !\n\nJe peux vous aider � :\n• 📊 Comprendre les analyses NOVA\n• ⚠️ Decoder les additifs alimentaires\n• 🥗 Donner des conseils nutritionnels\n• 🔍 Trouver des alternatives saines\n\nQue voulez-vous savoir ?",
      suggestions: this.getBaseSuggestions(),
      confidence: 0.7
    };
  }

  /**
   * Reponses basees sur le contexte d'analyse
   */
  private getContextualResponse(message: string, context: ProductContext): ChatResponse {
    const msg = message.toLowerCase();
    const productName = context.productName || "ce produit";

    if (msg.includes('sain') || msg.includes('sante')) {
      if (context.novaGroup === 1) {
        return {
          reply: `✅ **"${productName}"** est un excellent choix !\n\n🟢 **NOVA 1** - Aliment naturel peu transforme\n📊 **Score sante** : ${context.healthScore}/100\n🌱 **Recommandation** : Parfait pour une alimentation saine\n\nContinuez comme ca !`,
          suggestions: ["Autres produits NOVA 1", "Conseils nutrition", "Recettes avec ce produit"],
          confidence: 0.95
        };
      } else if (context.novaGroup === 4) {
        return {
          reply: `⚠️ **"${productName}"** est � consommer avec moderation.\n\n🔴 **NOVA 4** - Produit ultra-transforme\n📊 **Score sante** : ${context.healthScore}/100\n${context.additives && context.additives.length > 0 ? `⚠️ **Additifs detectes** : ${context.additives.length}` : ''}\n\n💡 **Conseil** : Consommation occasionnelle recommandee.`,
          suggestions: ["Voir les additifs", "Trouver des alternatives", "Pourquoi eviter NOVA 4"],
          confidence: 0.9
        };
      } else {
        return {
          reply: `🟡 **"${productName}"** est acceptable en consommation moderee.\n\n🟡 **NOVA ${context.novaGroup}** - Produit transforme\n📊 **Score sante** : ${context.healthScore}/100\n💡 **Conseil** : Privilegiez la version maison quand possible.`,
          suggestions: ["Recettes maison", "Alternatives plus saines", "Conseils nutrition"],
          confidence: 0.8
        };
      }
    }

    if (msg.includes('additif')) {
      if (context.additives && context.additives.length > 0) {
        const highRiskAdditives = context.additives.filter(a => a?.riskLevel === 'high');
        const mediumRiskAdditives = context.additives.filter(a => a?.riskLevel === 'medium');
        
        let response = `⚠️ **Additifs dans "${productName}"** :\n\n`;
        
        if (highRiskAdditives.length > 0) {
          response += `🔴 **Risque eleve** :\n`;
          highRiskAdditives.forEach(additive => {
            response += `• ${additive.code} (${additive.name})\n`;
          });
        }
        
        if (mediumRiskAdditives.length > 0) {
          response += `🟡 **Risque modere** :\n`;
          mediumRiskAdditives.forEach(additive => {
            response += `• ${additive.code} (${additive.name})\n`;
          });
        }
        
        response += `\n💡 **Conseil** : ${highRiskAdditives.length > 0 ? 'Limitez la consommation' : 'Consommation moderee acceptable'}`;
        
        return {
          reply: response,
          suggestions: ["Alternatives sans additifs", "Expliquer les codes E", "Produits plus naturels"],
          confidence: 0.9
        };
      } else {
        return {
          reply: `✅ **"${productName}"** ne contient pas d'additifs preoccupants detectes !\n\n🌱 C'est un bon point pour la naturalite du produit.\n💡 **Conseil** : Continuez � privilegier ce type de produits.`,
          suggestions: ["Autres produits naturels", "Conseils nutrition", "Recettes saines"],
          confidence: 0.85
        };
      }
    }

    if (msg.includes('alternative') || msg.includes('remplacer')) {
      return {
        reply: `🔄 **Alternatives � "${productName}"** :\n\n• **Rechercher** des produits similaires NOVA 1-2\n• **Version bio** si disponible\n• **Fait maison** pour controler les ingredients\n• **Produits** avec moins d'additifs\n\nVoulez-vous que je vous aide � chercher ?`,
        suggestions: ["Rechercher alternatives", "Recettes maison", "Produits bio similaires"],
        confidence: 0.8
      };
    }

    // Reponse contextuelle par defaut
    return {
      reply: `📊 **Analyse de "${productName}"** :\n\n📈 **Groupe NOVA** : ${context.novaGroup || 'N/A'}\n💯 **Score sante** : ${context.healthScore || 'N/A'}/100\n⚠️ **Additifs** : ${context.additives?.length || 0} detecte(s)\n\nQue voulez-vous savoir de plus ?`,
      suggestions: ["Ce produit est-il sain ?", "Voir les additifs", "Trouver des alternatives", "Conseils nutrition"],
      confidence: 0.8
    };
  }

  /**
   * Obtenir les suggestions de base
   */
  getBaseSuggestions(): string[] {
    if (this.currentContext) {
      // Questions contextuelles
      const suggestions = ["Ce produit est-il sain ?", "Quels additifs contient-il ?"];
      
      if (this.currentContext.novaGroup && this.currentContext.novaGroup >= 3) {
        suggestions.push("Alternatives plus saines");
      }
      
      if (this.currentContext.additives && this.currentContext.additives.length > 0) {
        suggestions.push("Expliquer les additifs");
      }
      
      suggestions.push("Conseils nutrition");
      return suggestions;
    }

    // Questions generales
    return [
      "Analyser un produit",
      "Que signifie NOVA ?",
      "Additifs dangereux",
      "Manger plus sain",
      "Produits bio vs conventionnels",
      "Comment lire les etiquettes"
    ];
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
   * Definir le contexte produit
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
}

// Instance singleton du service
export const chatService = new ChatService();

// Helper pour creer un contexte produit depuis les resultats d'analyse
export const createProductContext = (analysisResult: any): ProductContext => {
  return {
    productName: analysisResult.productName || analysisResult.name || analysisResult.product?.name,
    novaGroup: analysisResult.novaGroup || analysisResult.nova || analysisResult.scores?.nova,
    additives: analysisResult.additives?.detected || analysisResult.additives || [],
    healthScore: analysisResult.healthScore || analysisResult.scores?.healthScore,
    recommendations: analysisResult.recommendations || []
  };
};

export default ChatService;
