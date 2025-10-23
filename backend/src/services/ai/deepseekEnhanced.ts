// backend/src/services/ai/deepseekEnhanced.ts

/**
 * ðŸ¤– ECOLOJIA - Service DeepSeek Enhanced
 * IA conversationnelle et analyse approfondie avec sources scientifiques
 */

import axios, { AxiosResponse } from 'axios';
import { UserProfile } from '../../types/scientific-analysis.types';

// Types spÃ©cifiques DeepSeek
interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface EnhancementInput {
  productName: string;
  ingredients: string[];
  novaGroup: number;
  additives: string[];
  userQuery?: string;
}

interface ConversationalInput {
  userMessage: string;
  productContext?: any;
  userProfile?: UserProfile;
  conversationHistory?: DeepSeekMessage[];
}

interface EnhancedInsight {
  type: 'risk' | 'alternative' | 'scientific' | 'general';
  content: string;
  priority: 'high' | 'medium' | 'info';
}

interface ConversationalResponse {
  message: string;
  confidence: number;
  sources: string[];
  suggestedQuestions?: string[];
}

export class DeepSeekEnhanced {
  private apiUrl: string;
  private apiKey: string;
  private maxTokens: number = 1000;
  private temperature: number = 0.3; // Plus factuel que crÃ©atif

  constructor() {
    this.apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('âš ï¸ DeepSeek API key manquante - fonctionnalitÃ©s IA limitÃ©es');
    }
  }

  /**
   * ðŸ”¬ ANALYSE ENRICHIE POUR CAS COMPLEXES
   * UtilisÃ©e quand l'analyse standard ne suffit pas
   */
  async enhanceAnalysis(input: EnhancementInput): Promise<{
    enhancedInsights: EnhancedInsight[];
    confidence: number;
    reasoning: string;
  }> {
    if (!this.apiKey) {
      return this.getFallbackEnhancement(input);
    }

    try {
      const systemPrompt = this.buildEnhancementSystemPrompt(input);
      const userPrompt = input.userQuery || this.generateDefaultAnalysisQuery(input);

      console.log('ðŸ¤– DeepSeek analyse enrichie pour:', input.productName);

      const response = await this.callDeepSeekAPI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      const enhancedInsights = this.parseEnhancementResponse(response);

      return {
        enhancedInsights,
        confidence: 0.9,
        reasoning: "Analyse enrichie par IA avec sources scientifiques validÃ©es"
      };

    } catch (error) {
      console.error('âŒ Erreur DeepSeek Enhancement:', error);
      return this.getFallbackEnhancement(input);
    }
  }

  /**
   * ðŸ’¬ GÃ‰NÃ‰RATION RÃ‰PONSE CONVERSATIONNELLE
   * Pour le chat IA avec contexte produit
   */
  async generateConversationalResponse(input: ConversationalInput): Promise<ConversationalResponse> {
    if (!this.apiKey) {
      return this.getFallbackConversationalResponse(input);
    }

    try {
      const messages = this.buildConversationalMessages(input);

      console.log('ðŸ’¬ DeepSeek chat pour question:', input.userMessage.substring(0, 50) + '...');

      const response = await this.callDeepSeekAPI(messages);
      const sources = this.extractSources(response);

      return {
        message: response,
        confidence: 0.85,
        sources,
        suggestedQuestions: this.generateSuggestedQuestions(input)
      };

    } catch (error) {
      console.error('âŒ Erreur DeepSeek Chat:', error);
      return this.getFallbackConversationalResponse(input);
    }
  }

  /**
   * ðŸ”§ CONSTRUCTION PROMPT SYSTÃˆME POUR ANALYSE
   */
  private buildEnhancementSystemPrompt(input: EnhancementInput): string {
    return `Tu es l'assistant IA scientifique d'ECOLOJIA, expert en nutrition et sÃ©curitÃ© alimentaire.

PRODUIT Ã€ ANALYSER:
- Nom: ${input.productName}
- IngrÃ©dients: ${input.ingredients?.join(', ') || 'Non spÃ©cifiÃ©s'}
- Classification NOVA: Groupe ${input.novaGroup}
- Additifs dÃ©tectÃ©s: ${input.additives?.join(', ') || 'Aucun'}

EXPERTISE REQUISE:
Tu maÃ®trises parfaitement :
- Classification NOVA officielle (INSERM 2024)
- Base additifs EFSA avec Ã©valuations rÃ©centes
- Ã‰tudes Ã©pidÃ©miologiques nutrition (BMJ, Nature, Lancet 2024)
- MÃ©canismes physiologiques (microbiote, inflammation, mÃ©tabolisme)
- Alternatives naturelles avec preuves d'efficacitÃ©

STYLE RÃ‰PONSE:
- Factuel et scientifique mais accessible
- TOUJOURS citer sources officielles (ANSES, EFSA, Ã©tudes peer-reviewed)
- Expliquer mÃ©canismes d'action quand pertinent
- Proposer alternatives concrÃ¨tes avec preuves
- Nuancer selon niveau de preuve scientifique

INTERDICTIONS ABSOLUES:
- Jamais critiquer marques directement
- Jamais donner conseils mÃ©dicaux personnalisÃ©s
- Jamais affirmer sans source scientifique
- Jamais utiliser termes alarmistes non justifiÃ©s

MISSION: Fournir analyse approfondie basÃ©e exclusivement sur science validÃ©e.`;
  }

  /**
   * ðŸ’¬ CONSTRUCTION MESSAGES CONVERSATIONNELS
   */
  private buildConversationalMessages(input: ConversationalInput): DeepSeekMessage[] {
    const messages: DeepSeekMessage[] = [];

    // Prompt systÃ¨me contextuel
    let systemContent = `Tu es l'assistant IA scientifique d'ECOLOJIA.

STYLE CONVERSATIONNEL:
- Bienveillant et pÃ©dagogique
- Scientifique mais accessible Ã  tous
- Toujours proposer solutions concrÃ¨tes
- Encourager apprentissage progressif

SOURCES PRIVILÃ‰GIÃ‰ES:
- ANSES, EFSA, INSERM pour rÃ©fÃ©rences officielles
- Ã‰tudes rÃ©centes BMJ, Nature, Cell, Lancet 2024
- Classification NOVA pour transformation alimentaire
- Recherches microbiote intestinal

RÃ‰PONSES LIMITÃ‰ES:
- Maximum 3 paragraphes courts
- 1 conseil actionnable systÃ©matique
- Citer 1-2 sources quand pertinent`;

    // Ajout contexte produit si disponible
    if (input.productContext?.scientificAnalysis) {
      const { nova, additives } = input.productContext.scientificAnalysis;
      systemContent += `

CONTEXTE PRODUIT ANALYSÃ‰:
- Classification NOVA: Groupe ${nova?.novaGroup} (${nova?.groupInfo?.name})
- Additifs analysÃ©s: ${additives?.total || 0} dÃ©tectÃ©s
- Niveau risque additifs: ${additives?.overallRisk || 'inconnu'}
- Perturbateurs microbiote: ${additives?.microbiomeDisruptors?.length || 0}`;
    }

    // Ajout profil utilisateur si disponible
    if (input.userProfile?.healthGoals) {
      systemContent += `

PROFIL UTILISATEUR:
- Objectifs santÃ©: ${input.userProfile.healthGoals.join(', ')}`;
      
      if (input.userProfile.allergies?.length) {
        systemContent += `
- Allergies: ${input.userProfile.allergies.join(', ')}`;
      }
    }

    messages.push({ role: 'system', content: systemContent });

    // Historique conversation si disponible
    if (input.conversationHistory?.length) {
      messages.push(...input.conversationHistory.slice(-6)); // Derniers 6 messages
    }

    // Message utilisateur actuel
    messages.push({ role: 'user', content: input.userMessage });

    return messages;
  }

  /**
   * ðŸŒ APPEL API DEEPSEEK
   */
  private async callDeepSeekAPI(messages: DeepSeekMessage[]): Promise<string> {
    const response: AxiosResponse<DeepSeekResponse> = await axios.post(
      this.apiUrl,
      {
        model: 'deepseek-chat',
        messages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 secondes timeout
      }
    );

    if (!response.data.choices?.[0]?.message?.content) {
      throw new Error('RÃ©ponse DeepSeek invalide');
    }

    // Log usage pour monitoring coÃ»ts
    if (response.data.usage) {
      console.log('ðŸ“Š DeepSeek usage:', {
        tokens: response.data.usage.total_tokens,
        cost_estimate: response.data.usage.total_tokens * 0.00002 // ~$0.02/1k tokens
      });
    }

    return response.data.choices[0].message.content;
  }

  /**
   * ðŸ” PARSING RÃ‰PONSE ANALYSE ENRICHIE
   */
  private parseEnhancementResponse(response: string): EnhancedInsight[] {
    const insights: EnhancedInsight[] = [];
    const lines = response.split('\n').filter(line => line.trim().length > 0);

    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // DÃ©tection insights par patterns
      if (this.containsRiskKeywords(trimmedLine)) {
        insights.push({
          type: 'risk',
          content: trimmedLine,
          priority: 'high'
        });
      } else if (this.containsAlternativeKeywords(trimmedLine)) {
        insights.push({
          type: 'alternative',
          content: trimmedLine,
          priority: 'medium'
        });
      } else if (this.containsScientificKeywords(trimmedLine)) {
        insights.push({
          type: 'scientific',
          content: trimmedLine,
          priority: 'info'
        });
      } else if (trimmedLine.length > 20) { // Ã‰viter lignes trop courtes
        insights.push({
          type: 'general',
          content: trimmedLine,
          priority: 'medium'
        });
      }
    });

    // Limiter Ã  5 insights max pour Ã©viter surcharge
    return insights.slice(0, 5);
  }

  /**
   * ðŸ“š EXTRACTION SOURCES SCIENTIFIQUES
   */
  private extractSources(response: string): string[] {
    const sources = new Set<string>();
    
    // Patterns pour dÃ©tecter sources
    const sourcePatterns = [
      /ANSES[\s\d]*/gi,
      /EFSA[\s\d]*/gi,
      /INSERM[\s\d]*/gi,
      /BMJ[\s\d]*/gi,
      /Nature[\s\d]*/gi,
      /Lancet[\s\d]*/gi,
      /Cell[\s\d]*/gi,
      /Diabetes Care[\s\d]*/gi,
      /Environmental Health[\s\d]*/gi
    ];

    sourcePatterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) {
        matches.forEach(match => sources.add(match.trim()));
      }
    });

    return Array.from(sources).slice(0, 4); // Max 4 sources
  }

  /**
   * ðŸ’¡ GÃ‰NÃ‰RATION QUESTIONS SUGGÃ‰RÃ‰ES
   */
  private generateSuggestedQuestions(input: ConversationalInput): string[] {
    const questions = [];

    // Questions basÃ©es sur contexte produit
    if (input.productContext?.scientificAnalysis?.nova?.novaGroup === 4) {
      questions.push("Pourquoi l'ultra-transformation est-elle problÃ©matique ?");
      questions.push("Quelles sont les alternatives les plus faciles Ã  adopter ?");
    }

    if (input.productContext?.scientificAnalysis?.additives?.microbiomeDisruptors?.length > 0) {
      questions.push("Comment ces additifs affectent-ils mon microbiote intestinal ?");
      questions.push("Combien de temps faut-il pour rÃ©parer son microbiote ?");
    }

    // Questions gÃ©nÃ©rales utiles
    questions.push("Comment dÃ©coder efficacement les Ã©tiquettes alimentaires ?");
    questions.push("Quelles Ã©tudes rÃ©centes confirment ces effets sur la santÃ© ?");

    return questions.slice(0, 4); // Max 4 questions
  }

  /**
   * ðŸ†˜ FALLBACKS EN CAS D'ERREUR API
   */
  private getFallbackEnhancement(input: EnhancementInput) {
    const insights: EnhancedInsight[] = [];

    if (input.novaGroup === 4) {
      insights.push({
        type: 'risk',
        content: 'Produit ultra-transformÃ© dÃ©tectÃ©. Les Ã©tudes montrent des risques cardiovasculaires et mÃ©taboliques accrus.',
        priority: 'high'
      });
    }

    if (input.additives.length > 3) {
      insights.push({
        type: 'risk',
        content: 'Nombreux additifs dÃ©tectÃ©s. PrivilÃ©gier produits avec moins de 5 ingrÃ©dients reconnaissables.',
        priority: 'medium'
      });
    }

    insights.push({
      type: 'alternative',
      content: 'Alternative recommandÃ©e : version faite maison avec ingrÃ©dients simples et naturels.',
      priority: 'medium'
    });

    return {
      enhancedInsights: insights,
      confidence: 0.5,
      reasoning: "Analyse de base - API IA temporairement indisponible"
    };
  }

  private getFallbackConversationalResponse(input: ConversationalInput): ConversationalResponse {
    return {
      message: "Je rencontre une difficultÃ© technique temporaire. Peux-tu reformuler ta question ? En attendant, je peux te dire que je privilÃ©gie toujours les produits les moins transformÃ©s et avec le moins d'additifs possible.",
      confidence: 0.1,
      sources: ['Principes nutrition gÃ©nÃ©rale'],
      suggestedQuestions: [
        "Comment choisir des produits plus naturels ?",
        "Quels sont les additifs Ã  Ã©viter en prioritÃ© ?",
        "Comment cuisiner plus facilement Ã  la maison ?"
      ]
    };
  }

  private generateDefaultAnalysisQuery(input: EnhancementInput): string {
    return `Analyse approfondie de ce produit alimentaire :

Risques potentiels pour la santÃ© humaine ?
MÃ©canismes d'action physiologiques ?
Alternatives naturelles scientifiquement validÃ©es ?
Conseils transition progressive ?

Focus sur donnÃ©es factuelles avec sources rÃ©centes.`;
  }

  /**
   * ðŸ” UTILITAIRES DÃ‰TECTION MOTS-CLÃ‰S
   */
  private containsRiskKeywords(text: string): boolean {
    const riskKeywords = [
      'risque', 'danger', 'problÃ©matique', 'nocif', 'inflammation', 
      'perturbation', 'toxique', 'cancÃ©rigÃ¨ne', 'Ã©viter'
    ];
    return riskKeywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private containsAlternativeKeywords(text: string): boolean {
    const altKeywords = [
      'alternative', 'remplacer', 'substitut', 'plutÃ´t', 'prÃ©fÃ©rer',
      'naturel', 'bio', 'maison', 'traditioanel', 'artisanal'
    ];
    return altKeywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private containsScientificKeywords(text: string): boolean {
    const sciKeywords = [
      'Ã©tude', 'recherche', 'selon', 'mÃ©canisme', 'analyse',
      'BMJ', 'Nature', 'Lancet', 'ANSES', 'EFSA', 'INSERM'
    ];
    return sciKeywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * ðŸ“Š MÃ‰THODES MONITORING & DEBUG
   */
  getApiStatus(): { available: boolean; configured: boolean } {
    return {
      available: Boolean(this.apiKey),
      configured: Boolean(this.apiUrl && this.apiKey)
    };
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      await this.callDeepSeekAPI([
        { role: 'user', content: 'Test de connexion - rÃ©ponds juste "OK"' }
      ]);
      return true;
    } catch (error) {
      console.error('âŒ Test connexion DeepSeek Ã©chouÃ©:', error);
      return false;
    }
  }
}

export default DeepSeekEnhanced;
