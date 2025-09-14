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

// Base de connaissances pour rÃ©pondre intelligemment
const KNOWLEDGE_BASE: { [key: string]: string } = {
  'nova': `Le systÃ¨me NOVA classe les aliments selon leur degrÃ© de transformation :

**Groupe 1 - Non transformÃ©s** ðŸ¥¬
â€¢ Fruits et lÃ©gumes frais
â€¢ Viandes et poissons frais
â€¢ Å’ufs, lait frais
â€¢ Grains entiers, lÃ©gumineuses

**Groupe 2 - IngrÃ©dients culinaires** ðŸ§ˆ
â€¢ Huiles vÃ©gÃ©tales
â€¢ Beurre, sel, sucre
â€¢ Miel, vinaigre
â€¢ Ã‰pices et herbes

**Groupe 3 - TransformÃ©s** ðŸ¥«
â€¢ Conserves de lÃ©gumes
â€¢ Fromages
â€¢ Pains artisanaux
â€¢ Poissons fumÃ©s

**Groupe 4 - Ultra-transformÃ©s** âš ï¸
â€¢ Sodas et boissons sucrÃ©es
â€¢ Plats prÃ©parÃ©s industriels
â€¢ Snacks et confiseries
â€¢ Charcuteries avec additifs

ðŸ’¡ Conseil : PrivilÃ©giez les groupes 1 et 2 pour une alimentation saine !`,

  'nutriscore': `Le Nutri-Score Ã©value la qualitÃ© nutritionnelle sur une Ã©chelle de A Ã  E :

**A (vert foncÃ©)** - Excellent choix nutritionnel âœ…
**B (vert clair)** - Bon choix
**C (jaune)** - QualitÃ© moyenne
**D (orange)** - Ã€ consommer avec modÃ©ration
**E (rouge)** - Ã€ limiter âŒ

Le calcul prend en compte :
ðŸ“ˆ **Ã‰lÃ©ments positifs** : fibres, protÃ©ines, fruits/lÃ©gumes/noix
ðŸ“‰ **Ã‰lÃ©ments nÃ©gatifs** : Ã©nergie, sucres, graisses saturÃ©es, sel

ðŸ’¡ Astuce : Un Nutri-Score A ou B est gÃ©nÃ©ralement recommandÃ© pour une consommation rÃ©guliÃ¨re.`,

  'additifs': `Guide des additifs alimentaires (E-numbers) :

**ðŸš« Additifs Ã  Ã©viter :**
â€¢ **E102, E110, E124, E129** - Colorants azoÃ¯ques
  â†’ Risque d'hyperactivitÃ© chez les enfants
â€¢ **E320, E321** - BHA/BHT (antioxydants)
  â†’ Perturbateurs endocriniens suspectÃ©s
â€¢ **E249-E252** - Nitrites/nitrates
  â†’ CancÃ©rigÃ¨nes probables (charcuteries)
â€¢ **E621** - Glutamate monosodique
  â†’ Maux de tÃªte, addiction au goÃ»t

**âš ï¸ Ã€ consommer avec modÃ©ration :**
â€¢ **E200-E213** - Conservateurs benzoates
â€¢ **E220-E228** - Sulfites (allergÃ¨nes)
â€¢ **E950-E955** - Ã‰dulcorants artificiels

**âœ… Additifs sans danger :**
â€¢ **E300** - Vitamine C (acide ascorbique)
â€¢ **E330** - Acide citrique (citron)
â€¢ **E440** - Pectine (gÃ©lifiant naturel)
â€¢ **E160a** - BÃªta-carotÃ¨ne (colorant naturel)`,

  'allergenes': `Les 14 allergÃ¨nes majeurs Ã  dÃ©claration obligatoire :

1. **Gluten** ðŸŒ¾ - BlÃ©, seigle, orge, avoine
2. **CrustacÃ©s** ðŸ¦ - Crevettes, crabes, homards
3. **Å’ufs** ðŸ¥š - Et tous produits dÃ©rivÃ©s
4. **Poissons** ðŸŸ - Tous types sauf crustacÃ©s
5. **Arachides** ðŸ¥œ - CacahuÃ¨tes
6. **Soja** ðŸŒ± - Et dÃ©rivÃ©s (tofu, sauce soja)
7. **Lait** ðŸ¥› - Produits laitiers (lactose, casÃ©ine)
8. **Fruits Ã  coque** ðŸŒ° - Amandes, noix, noisettes
9. **CÃ©leri** ðŸŒ¿ - Y compris graines et sel de cÃ©leri
10. **Moutarde** ðŸŒ­ - Graines et condiment
11. **SÃ©same** - Graines et huile
12. **Sulfites** (E220-228) - Vins, fruits secs
13. **Lupin** - Farine dans pains/pÃ¢tisseries
14. **Mollusques** ðŸ¦ª - HuÃ®tres, moules, escargots

âš¡ Ces allergÃ¨nes doivent Ãªtre mis en Ã©vidence sur l'Ã©tiquetage.`,

  'bio': `Labels et certifications bio en France :

**ðŸŒ¿ AB (Agriculture Biologique)**
â€¢ Label franÃ§ais officiel
â€¢ Min. 95% d'ingrÃ©dients bio
â€¢ Sans OGM, pesticides chimiques
â€¢ ContrÃ´les rÃ©guliers

**ðŸ‡ªðŸ‡º Eurofeuille**
â€¢ Label europÃ©en obligatoire
â€¢ MÃªmes critÃ¨res que AB
â€¢ Reconnu dans toute l'UE

**ðŸŒ± Demeter**
â€¢ Agriculture biodynamique
â€¢ CritÃ¨res plus stricts que AB
â€¢ Respect des cycles naturels

**ðŸ“ Labels complÃ©mentaires :**
â€¢ **Label Rouge** - QualitÃ© supÃ©rieure
â€¢ **AOC/AOP** - Origine gÃ©ographique
â€¢ **IGP** - Indication gÃ©ographique
â€¢ **Bleu-Blanc-CÅ“ur** - OmÃ©ga 3

ðŸ’¡ Le bio garantit l'absence de pesticides de synthÃ¨se et d'OGM.`,

  'alternatives': `Alternatives saines aux produits ultra-transformÃ©s :

**Au lieu de âž¡ï¸ Choisissez**

ðŸ¥¤ **Sodas** âž¡ï¸ Eau pÃ©tillante + citron/fruits
ðŸŸ **Chips** âž¡ï¸ LÃ©gumes crus + houmous
ðŸ” **Plats prÃ©parÃ©s** âž¡ï¸ Batch cooking maison
ðŸ­ **Confiseries** âž¡ï¸ Fruits secs, chocolat noir
ðŸ¥£ **CÃ©rÃ©ales sucrÃ©es** âž¡ï¸ Flocons d'avoine + fruits
ðŸ§ˆ **Margarine** âž¡ï¸ Beurre ou huiles vÃ©gÃ©tales
ðŸž **Pain de mie** âž¡ï¸ Pain complet artisanal
ðŸ¥› **Yaourts aromatisÃ©s** âž¡ï¸ Yaourt nature + miel

ðŸ’¡ RÃ¨gle simple : Si la liste d'ingrÃ©dients dÃ©passe 5 lignes, cherchez une alternative !`,

  'default': `Je suis votre assistant nutritionnel ECOLOJIA. Je peux vous aider avec :

ðŸ“Š **Analyses de produits**
â€¢ Classification NOVA (degrÃ© de transformation)
â€¢ Nutri-Score (qualitÃ© nutritionnelle)
â€¢ Additifs et ingrÃ©dients Ã  surveiller

ðŸŽ¯ **Conseils personnalisÃ©s**
â€¢ Alternatives plus saines
â€¢ DÃ©cryptage des Ã©tiquettes
â€¢ Recommandations selon vos besoins

ðŸ’¡ **Tips nutrition**
â€¢ Ã‰quilibre alimentaire
â€¢ Labels et certifications
â€¢ AllergÃ¨nes et intolÃ©rances

Posez-moi vos questions sur l'alimentation et la nutrition !`
};

class ChatService {
  private messages: ChatMessage[] = [];
  private context: ChatContext = {};
  private isInitialized: boolean = false;

  // Analyser la question et trouver la meilleure rÃ©ponse
  private findBestResponse(question: string): string {
    const lowerQuestion = question.toLowerCase();
    
    // Recherche par mots-clÃ©s
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
    
    // RÃ©ponse contextuelle si un produit est analysÃ©
    if (this.context.productName) {
      return this.generateProductResponse();
    }
    
    // RÃ©ponse par dÃ©faut
    return KNOWLEDGE_BASE['default'];
  }

  // GÃ©nÃ©rer une rÃ©ponse spÃ©cifique au produit en contexte
  private generateProductResponse(): string {
    const { productName, scores } = this.context;
    
    let response = `ðŸ“¦ **Analyse de ${productName}**\n\n`;
    
    if (scores?.nova) {
      response += `â€¢ **Classification NOVA** : Groupe ${scores.nova}\n`;
      response += scores.nova === 4 
        ? `  âš ï¸ Produit ultra-transformÃ© - Ã€ consommer occasionnellement\n`
        : scores.nova <= 2
        ? `  âœ… Produit peu transformÃ© - Bon choix !\n`
        : `  âš¡ Transformation modÃ©rÃ©e - Acceptable\n`;
    }
    
    if (scores?.nutriscore) {
      response += `â€¢ **Nutri-Score** : ${scores.nutriscore}\n`;
      const scoreMap: { [key: string]: string } = {
        'A': 'âœ… Excellente qualitÃ© nutritionnelle',
        'B': 'ðŸ‘ Bonne qualitÃ© nutritionnelle',
        'C': 'âš¡ QualitÃ© nutritionnelle moyenne',
        'D': 'âš ï¸ QualitÃ© nutritionnelle faible',
        'E': 'âŒ Ã€ limiter'
      };
      response += `  ${scoreMap[scores.nutriscore] || ''}\n`;
    }
    
    if (scores?.healthScore) {
      response += `â€¢ **Score santÃ©** : ${scores.healthScore}/100\n`;
    }
    
    response += `\nðŸ’¡ **Conseils** :\n`;
    
    if (scores?.nova === 4) {
      response += `- PrivilÃ©giez des alternatives moins transformÃ©es\n`;
      response += `- Consommez ce produit occasionnellement\n`;
      response += `- VÃ©rifiez la liste des additifs\n`;
    } else {
      response += `- Ce produit peut faire partie d'une alimentation Ã©quilibrÃ©e\n`;
      response += `- Variez avec d'autres produits de la mÃªme catÃ©gorie\n`;
    }
    
    response += `\nAvez-vous des questions spÃ©cifiques sur ce produit ?`;
    
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
â€¢ Identifier les ingrÃ©dients Ã  surveiller
â€¢ Trouver des alternatives plus saines
â€¢ RÃ©pondre Ã  vos questions nutritionnelles

Que souhaitez-vous savoir sur ce produit ?`;
    }

    return KNOWLEDGE_BASE['default'];
  }

  // Envoyer un message
  async sendMessage(content: string, context?: any): Promise<ChatMessage> {
    // S'assurer que le chat est initialisÃ©
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
      // PrÃ©parer la requÃªte pour l'API
      const requestBody = {
        message: content,
        context: this.context,
        // Limiter l'historique pour Ã©viter les requÃªtes trop grandes
        history: this.messages.slice(-3).map(m => ({
          role: m.role,
          content: m.content
        }))
      };

      // Appeler l'API backend
      const response = await apiClient.post('/ai/chat', requestBody);

      // Extraire la rÃ©ponse
      const aiResponse = response.data?.content || 
                       response.data?.message || 
                       response.data?.response ||
                       response.data;

      if (!aiResponse || typeof aiResponse !== 'string') {
        throw new Error('Format de rÃ©ponse invalide');
      }

      // CrÃ©er le message assistant
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
      
      // Si erreur 500 spÃ©cifique au quota
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
        toast('Assistant local activÃ©', { icon: 'ðŸ’¡' });
        
        return assistantMessage;
      }
      
      // Si erreur 404 ou 500 gÃ©nÃ©rale
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

  // Messages d'erreur personnalisÃ©s
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
    return 'ðŸ˜• DÃ©solÃ©, je n\'ai pas pu traiter votre demande. Veuillez rÃ©essayer.';
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
        'Ce produit est-il adaptÃ© aux enfants ?',
        'Expliquez-moi son Nutri-Score'
      ];
    }

    return [
      'Qu\'est-ce que la classification NOVA ?',
      'Comment lire le Nutri-Score ?',
      'Quels additifs dois-je Ã©viter ?',
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