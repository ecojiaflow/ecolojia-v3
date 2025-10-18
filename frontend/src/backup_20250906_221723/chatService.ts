// ========================================
// 2. chatService.ts CORRIGÉ
// ========================================
// PATH: frontend/src/services/chatService.ts
import { toast } from 'react-hot-toast';

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

// AJOUT : Réponses mockées pour le mode demo
const MOCK_RESPONSES: { [key: string]: string } = {
  'nova': `Le système NOVA est une classification scientifique des aliments basée sur leur degré de transformation :

**NOVA 1** - Aliments non transformés ou peu transformés
• Fruits, légumes, viandes, œufs, lait frais
• Les meilleurs pour la santé

**NOVA 2** - Ingrédients culinaires transformés
• Huiles, beurre, sucre, sel
• À utiliser avec modération

**NOVA 3** - Aliments transformés
• Conserves, fromages, pains
• Acceptables en quantité raisonnable

**NOVA 4** - Aliments ultra-transformés
• Sodas, snacks, plats préparés
• À limiter au maximum

Les aliments NOVA 4 contiennent souvent des additifs, colorants et conservateurs qui peuvent avoir des effets négatifs sur la santé.`,

  'nutri-score': `Le Nutri-Score est un système d'étiquetage nutritionnel de A à E :

**A (vert foncé)** : Excellente qualité nutritionnelle
**B (vert clair)** : Bonne qualité nutritionnelle
**C (jaune)** : Qualité nutritionnelle moyenne
**D (orange)** : Qualité nutritionnelle faible
**E (rouge)** : Qualité nutritionnelle très faible

Le calculéprend en compte :
✅ Points positifs : fibres, protéines, fruits/légumes
❌ Points négatifs : calories, sucres, graisses saturées, sel

Un produit avec un Nutri-Score A ou B est généralement un bon choix pour une alimentation équilibrée.`,

  'additifs': `Les additifs alimentaires à surveiller particulièrement :

**🚫 À éviter absolument :**
• E102, E110, E124, E129 : Colorants azoïques (hyperactivité chez les enfants)
• E320, E321 : Antioxydants synthétiques (perturbateurs endocriniens suspectés)
• E249-E252 : Nitrites/nitrates (cancérigènes probables)

**⚠️ À limiter :**
• E200-E203 : Conservateurs (allergies possibles)
• E621 : Glutamate (maux de tête, addiction au goût)
• E950-E955 : Édulcorants (effets sur le microbiote)

**✅ Sans danger :**
• E300 : Vitamine C
• E330 : Acide citrique
• E440 : Pectine

Privilégiez les produits avec peu ou pas d'additifs !`,

  'default': `Je comprends votre question. En tant qu'assistant nutritionnel ECOLOJIA, je suis là pour vous aider à faire des choix alimentaires plus sains.

Voici quelques conseils généraux :

1. **Privilégiez les aliments peu transformés** (NOVA 1 et 2)
2. **Lisez les étiquettes** : moins d'ingrédients = mieux
3. **Évitez les additifs controversés** (colorants, conservateurs synthétiques)
4. **Choisissez des produits avec un bon Nutri-Score** (A ou B)
5. **Variez votre alimentation** pour équilibrer les apports

N'hésitez pas à me poser des questions plus spécifiques sur un produit ou un ingrédient !`
};

class ChatService {
  private messages: ChatMessage[] = [];
  private context: ChatContext = {};

  // MODIFICATION : Générer des réponses mockées intelligentes
  private generateMockResponse(question: string): string {
    const lowerQuestion = question.toLowerCase();
    
    // Recherche de mots-clés pour donner une réponse appropriée
    if (lowerQuestion.includes('nova')) {
      return MOCK_RESPONSES['nova'];
    }
    if (lowerQuestion.includes('nutri') || lowerQuestion.includes('score')) {
      return MOCK_RESPONSES['nutri-score'];
    }
    if (lowerQuestion.includes('additif') || lowerQuestion.includes('e1') || lowerQuestion.includes('e2') || lowerQuestion.includes('e3')) {
      return MOCK_RESPONSES['additifs'];
    }
    
    // Réponse contextuelle si un produit est mentionné
    if (this.context.productName) {
      return `Concernant ${this.context.productName}, voici mon analyse :

${this.context.scores?.nova ? `• Classification NOVA : Groupe ${this.context.scores.nova}` : ''}
${this.context.scores?.nutriscore ? `• Nutri-Score : ${this.context.scores.nutriscore}` : ''}
${this.context.scores?.healthScore ? `• Score santé : ${this.context.scores.healthScore}/100` : ''}

${this.context.scores?.nova === 4 ? 
`⚠️ Ce produit est ultra-transformé (NOVA 4). Je recommande de limiter sa consommation et de chercher des alternatives moins transformées.` :
`✅ Ce produit a un niveau de transformation acceptable. Vous pouvez le consommer avec modération dans le cadre d'une alimentation équilibrée.`}

Avez-vous des questions spécifiques sur ce produit ?`;
    }
    
    // Réponse par défaut
    return MOCK_RESPONSES['default'];
  }

  // Initialiser le chat avec un contexte optionnel
  initialize(context?: ChatContext) {
    this.context = context || {};
    this.messages = [{
      id: 'welcome',
      role: 'assistant',
      content: this.getWelcomeMessage(context),
      timestamp: new Date()
    }];
  }

  // Message de bienvenue personnalisé
  private getWelcomeMessage(context?: ChatContext): string {
    if (context?.productName) {
      return `Bonjour ! Je suis votre assistant nutritionnel ECOLOJIA. 

Je vois que vous analysez **${context.productName}**. Je peux vous expliquer :
• Son score et classification NOVA
• Les ingrédients à surveiller
• Des alternatives plus saines
• Répondre à vos questions nutritionnelles

Comment puis-je vous aider ?`;
    }

    return `Bonjour ! Je suis votre assistant nutritionnel ECOLOJIA.

Je peux vous aider à :
• Comprendre les analyses de produits
• Décoder les additifs et ingrédients
• Suggérer des alternatives plus saines
• Répondre à vos questions sur la nutrition

Comment puis-je vous aider aujourd'hui ?`;
  }

  // Envoyer un message
  async sendMessage(content: string, context?: any): Promise<ChatMessage> {
    // Mettre à jour le contexte si fourni
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
      // MODIFICATION : En mode mock, générer une réponse locale
      if (false) {
        // Simuler un délai réseau
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        // Générer une réponse mockée
        const mockResponse = this.generateMockResponse(content);
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: mockResponse,
          timestamp: new Date()
        };

        this.messages.push(assistantMessage);
        return assistantMessage;
      }

      // En mode production, appeler l'API réelle
      const { aiService } = await import('./api');
      const response = await aiService.chat(content, {
        ...this.context,
        conversationHistory: this.messages.slice(-5)
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content || response.message || response,
        timestamp: new Date()
      };

      this.messages.push(assistantMessage);
      return assistantMessage;

    } catch (error: any) {
      console.error('Erreur chat:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: this.getErrorMessage(error),
        timestamp: new Date()
      };

      this.messages.push(errorMessage);
      return errorMessage;
    }
  }

  // Gestion des erreurs avec messages adaptés
  private getErrorMessage(error: any): string {
    if (error.response?.status === 401) {
      return 'Veuillez vous connecter pour utiliser l\'assistant IA.';
    }
    if (error.response?.status === 429) {
      return 'Vous avez atteint votre limite de questions. Passez à Premium pour continuer !';
    }
    if (error.response?.data?.message) {
      return `Désolé, une erreur s'est produite : ${error.response.data.message}`;
    }
    return 'Désolé, je n\'ai pas pu traiter votre demande. Veuillez réessayer.';
  }

  // Obtenir l'historique des messages
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

  // Obtenir des suggestions contextuelles
  getSuggestions(): string[] {
    if (this.context?.productName) {
      return [
        `Pourquoi ${this.context.productName} a ce score ?`,
        'Quels sont les ingrédients problématiques ?',
        'Suggérez-moi des alternatives',
        'Est-ce dangereux pour ma santé ?'
      ];
    }

    return [
      'Comment fonctionne la classification NOVA ?',
      'Qu\'est-ce que l\'ultra-transformation ?',
      'Quels additifs éviter ?',
      'Comment améliorer mon alimentation ?'
    ];
  }

  // Mettre à jour le contexte
  updateContext(newContext: Partial<ChatContext>) {
    this.context = { ...this.context, ...newContext };
  }
}

// Export singleton
export const chatService = new ChatService();


// Export default pour compatibilité avec ResultsPage
export default chatService;
