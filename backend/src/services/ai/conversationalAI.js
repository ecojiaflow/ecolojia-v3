// PATH: backend/src/services/ai/conversationalAI.js
// VERSION: V3.2 - ORCHESTRATEUR IA CONTEXTUEL + PROFIL

const deepSeekService = require('./deepSeekService');
const User = require('../../models/User');
const Product = require('../../models/Product');
const crypto = require('crypto');

// Cache FAQ (économie 70% coûts)
const FAQ_CACHE = {
  "c'est quoi nova": "NOVA est une classification des aliments selon leur degré de transformation (1=brut à 4=ultra-transformé). Pour usage quotidien, privilégiez NOVA 1-2.",
  "pourquoi ce score": "Le score Ecolojia se base sur 8 composantes scientifiques : NOVA, Nutri-Score, additifs, sucres, graisses saturées, sel, Eco-Score et labels. Sources : OMS, ANSES.",
  "c'est quoi végane": "Régime végane = aucun produit animal (viande, poisson, œufs, lait, miel). Focus sur végétaux, légumineuses, céréales, fruits, légumes.",
  "additifs dangereux": "Les plus controversés : E102, E110, E124 (colorants), E320-E321 (BHA/BHT), E249-E252 (nitrites). Limitez leur consommation.",
  "bio c'est mieux": "Bio = sans pesticides synthétiques. Meilleur pour environnement. Pour santé, privilégiez surtout NOVA 1-2 (brut) bio ou non."
};

class ConversationalAIService {
  
  /**
   * Chat principal - Point d'entrée unique
   */
  async chat(userId, message, context = {}) {
    try {
      // 1. Charger profil utilisateur (ou mode dev)
      let user;
      
      // Mode dev : créer user fictif sans DB
      if (userId === 'dev-user' || !userId.match(/^[0-9a-fA-F]{24}$/)) {
        console.log('[ConversationalAI] Mode dev - user fictif');
        user = {
          _id: 'dev-user',
          email: 'dev@ecolojia.com',
          profile: {
            diet: 'omnivore',
            allergens: [],
            goal: 'health',
            labels: { bioPriority: true },
            migratedFromAiPreferences: true,
            completeness: 0
          },
          getDietLabel: () => 'omnivore',
          isProductCompatible: () => ({ compatible: true })
        };
      } else {
        user = await User.findById(userId);
      }
      if (!user) {
        throw new Error('User not found');
      }

      // 2. Migration auto si nécessaire
      if (!user.profile?.migratedFromAiPreferences) {
        user.migrateToV32Profile();
        await user.save();
      }

      // 3. Vérifier cache FAQ
      const cached = this.checkFAQCache(message);
      if (cached) {
        console.log('[ConversationalAI] FAQ cache hit');
        return {
          response: cached,
          suggestions: this.generateSuggestions(context, user),
          cached: true,
          cost: 0
        };
      }

      // 4. Construire prompt contextuel + profil
      const systemPrompt = this.getSystemPrompt(context, user);
      const userPrompt = await this.buildContextualPrompt(message, context, user);

      // 5. Appel DeepSeek
      const aiResponse = await deepSeekService.chat(userPrompt, { product: context.entityData });

      // 6. Générer suggestions
      const suggestions = this.generateSuggestions(context, user);

      return {
        response: aiResponse,
        suggestions,
        cached: false,
        cost: 0.0001 // Estimation
      };

    } catch (error) {
      console.error('[ConversationalAI] Error:', error.message);
      throw error;
    }
  }

  /**
   * Prompt système adapté au contexte + profil
   */
  getSystemPrompt(context, user) {
    const profile = user.profile || {};
    
    let basePrompt = `Tu es ECOLOJIA, assistant scientifique spécialisé dans le NATUREL et la santé personnalisée.

MISSION : Orienter vers produits naturels (NOVA 1-2), expliquer scientifiquement, proposer alternatives ADAPTÉES au profil utilisateur.

PROFIL UTILISATEUR :
- Régime : ${this.getDietLabel(profile.diet)}
- Allergies : ${profile.allergens?.join(', ') || 'Aucune'}
- Objectif : ${this.getGoalLabel(profile.goal)}
- Bio prioritaire : ${profile.labels?.bioPriority ? 'Oui' : 'Non'}

RÈGLES :
- RESPECTER STRICTEMENT le profil (ex: végane = 0 produit animal)
- Si produit incompatible, expliquer pourquoi + suggérer alternative compatible
- Privilégier naturel > transformé
- Sources : OMS, ANSES, études scientifiques
- Pas d'allégation médicale
- Ton pédagogique, pas culpabilisant
- Réponses courtes (max 250 mots)`;

    // Adaptation selon catégorie
    if (context.category === 'cosmetic') {
      basePrompt += `\n\nSPÉCIALISATION : Cosmétiques naturels${profile.preferences?.cosmetic?.vegan ? ' VÉGANES' : ''}, INCI, ingrédients controversés.`;
    }
    
    if (context.category === 'detergent') {
      basePrompt += `\n\nSPÉCIALISATION : Détergents biodégradables, recettes maison, impact environnemental.`;
    }

    return basePrompt;
  }

  /**
   * Construire prompt enrichi avec contexte + profil
   */
  async buildContextualPrompt(message, context, user) {
    let prompt = message;
    const profile = user.profile || {};

    // Enrichissement selon type
    if (context.pageType === 'product' && context.entityId) {
      const product = await Product.findById(context.entityId);
      if (product) {
        // Compatibilité profil
        const compatibility = user.isProductCompatible(product);
        
        prompt += `\n\n[CONTEXTE PRODUIT]
Nom : ${product.name}
Catégorie : ${product.category}
Score : ${product.scores?.global}/100
NOVA : ${product.foodData?.nova || 'N/A'}
Nutri-Score : ${product.foodData?.nutriScore || 'N/A'}

[COMPATIBILITÉ PROFIL]
${compatibility.compatible ? '✅ Compatible' : '❌ Non compatible'}
${compatibility.reason || ''}`;
      }
    }

    if (context.pageType === 'mealplan') {
      prompt += `\n\n[CONTEXTE] Plan repas pour profil ${this.getDietLabel(profile.diet)}. Suggérer recettes naturelles (NOVA 1-2) compatibles.`;
    }

    if (context.pageType === 'list') {
      prompt += `\n\n[CONTEXTE] Liste de courses. Privilégier produits ${profile.labels?.bioPriority ? 'BIO' : 'naturels'} + ${this.getDietLabel(profile.diet)}.`;
    }

    return prompt;
  }

  /**
   * Générer suggestions contextuelles + profil
   */
  generateSuggestions(context, user) {
    const profile = user.profile || {};
    const diet = profile.diet || 'omnivore';
    
    const base = ["Pourquoi ce score ?", "C'est quoi NOVA ?"];

    if (context.pageType === 'product') {
      const nova = context.entityData?.nova;
      
      if (nova === 4) {
        return [
          "Pourquoi NOVA 4 ?",
          "Fréquence recommandée ?",
          `Alternatives ${this.getDietLabel(diet)} ?`,
          "Recettes maison ?"
        ];
      }

      if (nova <= 2) {
        return [
          "Pourquoi bon score ?",
          "Bénéfices santé ?",
          `Recettes ${this.getDietLabel(diet)} ?`
        ];
      }
    }

    if (context.category === 'cosmetic') {
      return [
        "Ingrédients à éviter ?",
        profile.preferences?.cosmetic?.vegan ? "Alternatives véganes ?" : "Alternatives bio ?",
        "Labels fiables ?"
      ];
    }

    if (context.pageType === 'list') {
      return [
        `Produits ${this.getDietLabel(diet)} naturels ?`,
        profile.labels?.bioPriority ? "Produits bio recommandés ?" : "Produits sains abordables ?",
        "Optimiser ma liste ?"
      ];
    }

    return base;
  }

  /**
   * Helpers
   */
  getDietLabel(diet) {
    const labels = {
      'omnivore': 'omnivore',
      'vegetarian': 'végétarien',
      'vegan': 'végane',
      'pescatarian': 'pescétarien',
      'flexitarian': 'flexitarien'
    };
    return labels[diet] || 'omnivore';
  }

  getGoalLabel(goal) {
    const labels = {
      'health': 'santé',
      'eco': 'écologie',
      'budget': 'économies',
      'weight-loss': 'perte de poids',
      'muscle-gain': 'prise de muscle',
      'general': 'bien-être général'
    };
    return labels[goal] || 'santé';
  }

  checkFAQCache(message) {
    const normalized = message.toLowerCase().trim();
    return FAQ_CACHE[normalized] || null;
  }
}

module.exports = new ConversationalAIService();