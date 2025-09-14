// PATH: frontend/src/services/chatService.ts
import { toast } from 'react-hot-toast';
import apiClient from './apiClient';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: any;
}

export interface ChatContext {
  productId?: string;
  productName?: string;
  productType?: 'food' | 'cosmetic' | 'detergent';
  scores?: {
    nova?: number;
    nutriscore?: string;
    healthScore?: number;
  };
  analysis?: any;
}

// Base de connaissances pour répondre intelligemment
const KNOWLEDGE_BASE: { [key: string]: string } = {
  'nova': `Le système NOVA classe les aliments selon leur degré de transformation :

**Groupe 1 - Non transformés** ðŸ¥¬
â€¢ Fruits et légumes frais
â€¢ Viandes et poissons frais
â€¢ Å’ufs, lait frais
â€¢ Grains entiers, légumineuses

**Groupe 2 - Ingrédients culinaires** ðŸ§ˆ
â€¢ Huiles végétales
â€¢ Beurre, sel, sucre
â€¢ Miel, vinaigre
â€¢ Ã‰pices et herbes

**Groupe 3 - Transformés** ðŸ¥«
â€¢ Conserves de légumes
â€¢ Fromages
â€¢ Pains artisanaux
â€¢ Poissons fumés

**Groupe 4 - Ultra-transformés** âš ï¸
â€¢ Sodas et boissons sucrées
â€¢ Plats préparés industriels
â€¢ Snacks et confiseries
â€¢ Charcuteries avec additifs

ðŸ’¡ Conseil : Privilégiez les groupes 1 et 2 pour une alimentation saine !`,

  'nutriscore': `Le Nutri-Score évalue la qualité nutritionnelle sur une échelle de A Ã  E :

**A (vert foncé)** - Excellent choix nutritionnel âœ…
**B (vert clair)** - Bon choix
**C (jaune)** - Qualité moyenne
**D (orange)** - Ã€ consommer avec modération
**E (rouge)** - Ã€ limiter âŒ

Le calcul prend en compte :
ðŸ“ˆ **Ã‰léments positifs** : fibres, protéines, fruits/légumes/noix
ðŸ“‰ **Ã‰léments négatifs** : énergie, sucres, graisses saturées, sel

ðŸ’¡ Astuce : Un Nutri-Score A ou B est généralement recommandé pour une consommation régulière.`,

  'additifs': `Guide des additifs alimentaires (E-numbers) :

**ðŸš« Additifs Ã  éviter :**
â€¢ **E102, E110, E124, E129** - Colorants azoÃ¯ques
  â†’ Risque d'hyperactivité chez les enfants
â€¢ **E320, E321** - BHA/BHT (antioxydants)
  â†’ Perturbateurs endocriniens suspectés
â€¢ **E249-E252** - Nitrites/nitrates
  â†’ Cancérigènes probables (charcuteries)
â€¢ **E621** - Glutamate monosodique
  â†’ Maux de tÃªte, addiction au goÃ»t

**âš ï¸ Ã€ consommer avec modération :**
â€¢ **E200-E213** - Conservateurs benzoates
â€¢ **E220-E228** - Sulfites (allergènes)
â€¢ **E950-E955** - Ã‰dulcorants artificiels

**âœ… Additifs sans danger :**
â€¢ **E300** - Vitamine C (acide ascorbique)
â€¢ **E330** - Acide citrique (citron)
â€¢ **E440** - Pectine (gélifiant naturel)
â€¢ **E160a** - BÃªta-carotène (colorant naturel)`,

  'allergenes': `Les 14 allergènes majeurs Ã  déclaration obligatoire :

1. **Gluten** ðŸŒ¾ - Blé, seigle, orge, avoine
2. **Crustacés** ðŸ¦ - Crevettes, crabes, homards
3. **Å’ufs** ðŸ¥š - Et tous produits dérivés
4. **Poissons** ðŸŸ - Tous types sauf crustacés
5. **Arachides** ðŸ¥œ - Cacahuètes
6. **Soja** ðŸŒ± - Et dérivés (tofu, sauce soja)
7. **Lait** ðŸ¥› - Produits laitiers (lactose, caséine)
8. **Fruits Ã  coque** ðŸŒ° - Amandes, noix, noisettes
9. **Céleri** ðŸŒ¿ - Y compris graines et sel de céleri
10. **Moutarde** ðŸŒ­ - Graines et condiment
11. **Sésame** - Graines et huile
12. **Sulfites** (E220-228) - Vins, fruits secs
13. **Lupin** - Farine dans pains/pÃ¢tisseries
14. **Mollusques** ðŸ¦ª - HuÃ®tres, moules, escargots

âš¡ Ces allergènes doivent Ãªtre mis en évidence sur l'étiquetage.`,

  'bio': `Labels et certifications bio en France :

**ðŸŒ¿ AB (Agriculture Biologique)**
â€¢ Label français officiel
â€¢ Min. 95% d'ingrédients bio
â€¢ Sans OGM, pesticides chimiques
â€¢ ContrÃ´les réguliers

**ðŸ‡ªðŸ‡º Eurofeuille**
â€¢ Label européen obligatoire
â€¢ MÃªmes critères que AB
â€¢ Reconnu dans toute l'UE

**ðŸŒ± Demeter**
â€¢ Agriculture biodynamique
â€¢ Critères plus stricts que AB
â€¢ Respect des cycles naturels

**ðŸ“ Labels complémentaires :**
â€¢ **Label Rouge** - Qualité supérieure
â€¢ **AOC/AOP** - Origine géographique
â€¢ **IGP** - Indication géographique
â€¢ **Bleu-Blanc-CÅ“ur** - Oméga 3

ðŸ’¡ Le bio garantit l'absence de pesticides de synthèse et d'OGM.`,

  'alternatives': `Alternatives saines aux produits ultra-transformés :

**Au lieu de âž¡ï¸ Choisissez**

ðŸ¥¤ **Sodas** âž¡ï¸ Eau pétillante + citron/fruits
ðŸŸ **Chips** âž¡ï¸ Légumes crus + houmous
ðŸ” **Plats préparés** âž¡ï¸ Batch cooking maison
ðŸ­ **Confiseries** âž¡ï¸ Fruits secs, chocolat noir
ðŸ¥£ **Céréales sucrées** âž¡ï¸ Flocons d'avoine + fruits
ðŸ§ˆ **Margarine** âž¡ï¸ Beurre ou huiles végétales
ðŸž **Pain de mie** âž¡ï¸ Pain complet artisanal
ðŸ¥› **Yaourts aromatisés** âž¡ï¸ Yaourt nature + miel

ðŸ’¡ Règle simple : Si la liste d'ingrédients dépasse 5 lignes, cherchez une alternative !`,

  'default': `Je suis votre assistant nutritionnel ECOLOJIA. Je peux vous aider avec :

ðŸ“Š **Analyses de produits**
â€¢ Classification NOVA (degré de transformation)
â€¢ Nutri-Score (qualité nutritionnelle)
â€¢ Additifs et ingrédients Ã  surveiller

ðŸŽ¯ **Conseils personnalisés**
â€¢ Alternatives plus saines
â€¢ Décryptage des étiquettes
â€¢ Recommandations selon vos besoins

ðŸ’¡ **Tips nutrition**
â€¢ Ã‰quilibre alimentaire
â€¢ Labels et certifications
â€¢ Allergènes et intolérances

Posez-moi vos questions sur l'alimentation et la nutrition !`
};

class ChatService {
  private messages: ChatMessage[] = [];
  private context: ChatContext = {};
  private isInitialized: boolean = false;

  // Analyser la question et trouver la meilleure réponse
  private findBestResponse(question: string): string {
    const lowerQuestion = question.toLowerCase();
    
    // Recherche par mots-clés
    if (lowerQuestion.includes('nova')) {
      return KNOWLEDGE_BASE['nova'];
    }
    if (lowerQuestion.includes('nutri') || lowerQuestion.includes('score')) {
      return KNOWLEDGE_BASE['nutriscore'];
    }
    if (lowerQuestion.includes('additif') || lowerQuestion.match(/\be\d{3}/)) {
      return KNOWLEDGE_BASE['additifs'];
    }
    if (lowerQuestion.includes('allerg') || lowerQuestion.includes('intol')) {
      return KNOWLEDGE_BASE['allergenes'];
    }
    if (lowerQuestion.includes('bio') || lowerQuestion.includes('label')) {
      return KNOWLEDGE_BASE['bio'];
    }
    if (lowerQuestion.includes('alternative') || lowerQuestion.includes('remplacer')) {
      return KNOWLEDGE_BASE['alternatives'];
    }
    
    // Réponse contextuelle si un produit est analysé
    if (this.context.productName) {
      return this.generateProductResponse();
    }
    
    // Réponse par défaut
    return KNOWLEDGE_BASE['default'];
  }

  // Générer une réponse spécifique au produit en contexte
  private generateProductResponse(): string {
    const { productName, scores } = this.context;
    
    let response = `ðŸ“¦ **Analyse de ${productName}**\n\n`;
    
    if (scores?.nova) {
      response += `â€¢ **Classification NOVA** : Groupe ${scores.nova}\n`;
      response += scores.nova === 4 
        ? `  âš ï¸ Produit ultra-transformé - Ã€ consommer occasionnellement\n`
        : scores.nova <= 2
        ? `  âœ… Produit peu transformé - Bon choix !\n`
        : `  âš¡ Transformation modérée - Acceptable\n`;
    }
    
    if (scores?.nutriscore) {
      response += `â€¢ **Nutri-Score** : ${scores.nutriscore}\n`;
      const scoreMap: { [key: string]: string } = {
        'A': 'âœ… Excellente qualité nutritionnelle',
        'B': 'ðŸ‘ Bonne qualité nutritionnelle',
        'C': 'âš¡ Qualité nutritionnelle moyenne',
        'D': 'âš ï¸ Qualité nutritionnelle faible',
        'E': 'âŒ Ã€ limiter'
      };
      response += `  ${scoreMap[scores.nutriscore] || ''}\n`;
    }
    
    if (scores?.healthScore) {
      response += `â€¢ **Score santé** : ${scores.healthScore}/100\n`;
    }
    
    response += `\nðŸ’¡ **Conseils** :\n`;
    
    if (scores?.nova === 4) {
      response += `- Privilégiez des alternatives moins transformées\n`;
      response += `- Consommez ce produit occasionnellement\n`;
      response += `- Vérifiez la liste des additifs\n`;
    } else {
      response += `- Ce produit peut faire partie d'une alimentation équilibrée\n`;
      response += `- Variez avec d'autres produits de la mÃªme catégorie\n`;
    }
    
    response += `\nAvez-vous des questions spécifiques sur ce produit ?`;
    
    return response;
  }

  // Initialiser le chat
  initialize(context?: ChatContext) {
    this.context = context || {};
    this.isInitialized = true;
    this.messages = [{
      id: 'welcome',
      role: 'assistant',
      content: this.getWelcomeMessage(context),
      timestamp: new Date()
    }];
  }

  // Message de bienvenue
  private getWelcomeMessage(context?: ChatContext): string {
    if (context?.productName) {
      return `ðŸ‘‹ Bonjour ! Je suis votre assistant nutritionnel ECOLOJIA.

Je vois que vous analysez **${context.productName}**. Je peux vous aider Ã  :
â€¢ Comprendre ses scores et classifications
â€¢ Identifier les ingrédients Ã  surveiller
â€¢ Trouver des alternatives plus saines
â€¢ Répondre Ã  vos questions nutritionnelles

Que souhaitez-vous savoir sur ce produit ?`;
    }

    return KNOWLEDGE_BASE['default'];
  }

  // Envoyer un message
  async sendMessage(content: string, context?: any): Promise<ChatMessage> {
    // S'assurer que le chat est initialisé
    if (!this.isInitialized) {
      this.initialize(context);
    }

    // Mettre Ã  jour le contexte si fourni
    if (context) {
      this.context = { ...this.context, ...context };
    }

    // Ajouter le message utilisateur
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };
    this.messages.push(userMessage);

    try {
      // Préparer la requÃªte pour l'API
      const requestBody = {
        message: content,
        context: this.context,
        // Limiter l'historique pour éviter les requÃªtes trop grandes
        history: this.messages.slice(-3).map(m => ({
          role: m.role,
          content: m.content
        }))
      };

      // Appeler l'API backend
      const response = await apiClient.post('/ai/chat', requestBody);

      // Extraire la réponse
      const aiResponse = response.data?.content || 
                       response.data?.message || 
                       response.data?.response ||
                       response.data;

      if (!aiResponse || typeof aiResponse !== 'string') {
        throw new Error('Format de réponse invalide');
      }

      // Créer le message assistant
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      this.messages.push(assistantMessage);
      return assistantMessage;

    } catch (error: any) {
      console.error('Erreur chat API:', error);

      // Si timeout, utiliser directement la réponse locale
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.log('Timeout API, utilisation immédiate du fallback');
        const localResponse = this.findBestResponse(content);
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: localResponse,
          timestamp: new Date()
        };

        this.messages.push(assistantMessage);
        return assistantMessage;
      }
      
      // Si erreur 500 spécifique au quota
      if (error.response?.status === 500 && 
          error.response?.data?.error?.includes('aiQuestionsUsed')) {
        
        // Utiliser la base de connaissances locale
        console.log('Erreur quota backend, utilisation de la base de connaissances locale');
        const localResponse = this.findBestResponse(content);
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: localResponse,
          timestamp: new Date()
        };

        this.messages.push(assistantMessage);
        
        // Afficher un toast discret
        toast('Assistant local activé', { icon: 'ðŸ’¡' });
        
        return assistantMessage;
      }
      
      // Si erreur 404 ou 500 générale
      if (error.response?.status === 404 || error.response?.status === 500) {
        console.log('API chat non disponible, utilisation locale');
        const localResponse = this.findBestResponse(content);
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: localResponse,
          timestamp: new Date()
        };

        this.messages.push(assistantMessage);
        return assistantMessage;
      }
      
      // Autres erreurs
      const errorMessage = this.getErrorMessage(error);
      const errorAssistant: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date()
      };

      this.messages.push(errorAssistant);
      return errorAssistant;
    }
  }

  // Messages d'erreur personnalisés
  private getErrorMessage(error: any): string {
    if (error.response?.status === 401) {
      return 'ðŸ”’ Veuillez vous connecter pour utiliser l\'assistant IA.';
    }
    if (error.response?.status === 403) {
      return 'ðŸ“Š Vous avez atteint votre limite de questions. Passez Ã  Premium pour continuer !';
    }
    if (error.response?.status === 429) {
      return 'â±ï¸ Trop de requÃªtes. Veuillez patienter quelques instants.';
    }
    return 'ðŸ˜• Désolé, je n\'ai pas pu traiter votre demande. Veuillez réessayer.';
  }

  // Obtenir l'historique
  getMessages(): ChatMessage[] {
    return this.messages;
  }

  // Effacer l'historique
  clearHistory() {
    this.messages = [{
      id: 'welcome-new',
      role: 'assistant',
      content: this.getWelcomeMessage(this.context),
      timestamp: new Date()
    }];
  }

  // Suggestions contextuelles
  getSuggestions(): string[] {
    if (this.context?.productName) {
      return [
        `Analysez les additifs de ${this.context.productName}`,
        'Quelles sont les alternatives plus saines ?',
        'Ce produit est-il adapté aux enfants ?',
        'Expliquez-moi son Nutri-Score'
      ];
    }

    return [
      'Qu\'est-ce que la classification NOVA ?',
      'Comment lire le Nutri-Score ?',
      'Quels additifs dois-je éviter ?',
      'Comment manger plus sainement ?'
    ];
  }

  // Mettre Ã  jour le contexte
  updateContext(newContext: Partial<ChatContext>) {
    this.context = { ...this.context, ...newContext };
  }
}

// Export singleton
export const chatService = new ChatService();

// Export default
export default chatService;
