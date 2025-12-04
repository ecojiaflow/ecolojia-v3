const deepSeekService = require('./ai/deepSeekService');
const logger = require('../config/logger');

/**
 * AI EDUCATION SERVICE - ECOLOJIA V3.1
 * Service IA pédagogique pour cosmétiques/détergents
 * Répond questions scientifiques, compare produits, explique scores
 *
 * RÈGLES STRICTES :
 * - Jamais d'allégation médicale
 * - Toujours sourcer (ANSES, EFSA, SCCS, OMS)
 * - Ton neutre et pédagogique
 * - Disclaimers santé automatiques
 */

class AIEducationService {

  /**
   * MÉTHODE 1 : Expliquer le score d'un produit
   * Usage : User scanne crème Nivea 58/100 → "Pourquoi ce score ?"
   */
  async explainProductScore(product, userProfile = {}) {
    const startTime = Date.now();
    
    try {
      // Validation paramètres
      if (!product || !product.name) {
        logger.warn('[AIEducation] Tentative explication score sans produit valide');
        throw new Error('Produit invalide ou manquant');
      }

      logger.info('[AIEducation] Génération explication score', {
        productId: product._id,
        productName: product.name,
        category: product.categoryType,
        score: product.scores?.overallScore,
        hasUserProfile: !!userProfile
      });

      // Construire contexte produit
      const productContext = this._buildProductContext(product);

      // Prompt éducatif strict
      const prompt = `Tu es un éducateur scientifique spécialisé en cosmétiques/détergents.

PRODUIT À EXPLIQUER :
${productContext}

PROFIL UTILISATEUR :
- Régime : ${userProfile.diet || 'Non spécifié'}
- Allergies : ${userProfile.allergens?.join(', ') || 'Aucune'}
- Objectifs : ${userProfile.goals?.join(', ') || 'Santé générale'}

CONSIGNE :
Explique en 4 blocs POURQUOI ce produit a ce score. Utilise un ton pédagogique, neutre, sourcé.

FORMAT OBLIGATOIRE :
1. **CONSTAT** (1-2 phrases simples)
   "Ce produit obtient [score]/100 principalement à cause de [raison principale]."

2. **EXPLICATION SCIENTIFIQUE** (3-4 phrases avec sources)
   Explique les composants problématiques ou positifs.
   Cite TOUJOURS les sources : ANSES, EFSA, SCCS, OMS, études PubMed.
   Donne des chiffres concrets (ex: "peut affecter 2-5% population").

3. **COMPARAISON CONTEXTE** (2-3 phrases)
   Compare avec standards du marché.
   "La moyenne des crèmes hydratantes est de 65/100."

4. **ÉDUCATION SANS ALARME** (2-3 phrases)
   Nuance : "Cela ne signifie pas dangereux, mais..."
   Conseil : "Privilégier produits sans X si peau sensible."

RÈGLES STRICTES :
❌ Jamais "ce produit est dangereux"
❌ Jamais "vous devez arrêter"
❌ Jamais d'allégation médicale
✅ Toujours "contient X classé Y par ANSES"
✅ Toujours "peut provoquer Z chez W% population"
✅ Toujours sourcer avec organisme officiel

Réponds maintenant :`;

      logger.debug('[AIEducation] Appel DeepSeek pour explication', {
        promptLength: prompt.length,
        estimatedTokens: Math.ceil(prompt.length / 4)
      });

      // Appeler DeepSeek
      const response = await deepSeekService.analyze(prompt);

      // Ajouter disclaimers automatiques
      const explanation = this._addDisclaimers(response, 'explanation');

      const processingTime = Date.now() - startTime;

      logger.info('[AIEducation] Explication générée avec succès', {
        productId: product._id,
        productName: product.name,
        responseLength: explanation.length,
        processingTimeMs: processingTime,
        estimatedTokensUsed: Math.ceil((prompt.length + response.length) / 4)
      });

      return {
        success: true,
        explanation,
        sources: this._extractSources(response),
        disclaimerShown: true,
        metadata: {
          processingTimeMs: processingTime,
          responseLength: explanation.length
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error('[AIEducation] Erreur explication score', {
        error: error.message,
        stack: error.stack,
        productId: product?._id,
        productName: product?.name,
        processingTimeMs: processingTime
      });

      return {
        success: false,
        error: 'Impossible de générer l\'explication pour le moment.',
        metadata: {
          processingTimeMs: processingTime
        }
      };
    }
  }

  /**
   * MÉTHODE 2 : Comparer 2-3 produits scientifiquement
   * Usage : User hésite entre 3 crèmes → "Laquelle choisir ?"
   */
  async compareProducts(products, userProfile = {}, comparisonCriteria = 'overall') {
    const startTime = Date.now();
    
    try {
      // Validation paramètres
      if (!products || !Array.isArray(products)) {
        logger.warn('[AIEducation] Tentative comparaison sans tableau produits');
        throw new Error('Produits invalides ou manquants');
      }

      if (products.length < 2 || products.length > 3) {
        logger.warn('[AIEducation] Nombre produits hors limite', {
          productsCount: products.length
        });
        throw new Error('Comparaison limitée à 2-3 produits');
      }

      logger.info('[AIEducation] Génération comparaison produits', {
        productsCount: products.length,
        productNames: products.map(p => p.name),
        criteria: comparisonCriteria,
        hasUserProfile: !!userProfile
      });

      // Construire tableau comparatif
      const productsContext = products.map((p, i) =>
        `PRODUIT ${i + 1} : ${p.name} (${p.brand || 'Marque inconnue'})
- Score global : ${p.scores?.overallScore || 'N/A'}/100
- Score santé : ${p.scores?.healthScore || 'N/A'}/100
- Score environnement : ${p.scores?.environmentScore || 'N/A'}/100
- Perturbateurs endocriniens : ${p.cosmeticData?.endocrineDisruptors?.length || 0}
- Prix estimé : ${p.price || 'N/A'}€
- Labels : ${p.cosmeticData?.labels?.join(', ') || 'Aucun'}`
      ).join('\n\n');

      const prompt = `Tu es un comparateur scientifique neutre spécialisé en cosmétiques/détergents.

PRODUITS À COMPARER :
${productsContext}

PROFIL UTILISATEUR :
- Priorité : ${comparisonCriteria === 'health' ? 'Santé avant tout' : comparisonCriteria === 'eco' ? 'Impact environnemental' : 'Équilibre global'}
- Budget : ${userProfile.budget || 'Non spécifié'}
- Peau sensible : ${userProfile.sensitiveSkin ? 'Oui' : 'Non'}

CONSIGNE :
Compare ces produits de manière FACTUELLE et ÉDUCATIVE.

FORMAT OBLIGATOIRE :
1. **CLASSEMENT OBJECTIF** (1-2 phrases)
   "Selon votre priorité [critère], le classement est : Produit X > Y > Z."

2. **ANALYSE PAR PRODUIT** (3-4 phrases chacun)
   - Points forts factuels (ex: "sans parabènes", "bio certifié")
   - Points faibles factuels (ex: "contient parfum synthétique")
   - Pour qui c'est adapté (ex: "idéal peau normale, à éviter si allergies")

3. **RECOMMANDATION PERSONNALISÉE** (2-3 phrases)
   "Selon votre profil (${userProfile.sensitiveSkin ? 'peau sensible' : 'peau normale'}), je recommande le Produit X car..."

4. **ÉDUCATION TRANSPARENTE** (2-3 phrases)
   "Aucun produit n'est parfait à 100/100. L'important est..."

RÈGLES STRICTES :
❌ Jamais dénigrer une marque ("Nivea est mauvais")
✅ Toujours factuel ("Nivea contient X, classé Y par SCCS")
❌ Jamais absolu ("le meilleur produit")
✅ Toujours contextuel ("le plus adapté à votre profil")

Réponds maintenant :`;

      logger.debug('[AIEducation] Appel DeepSeek pour comparaison', {
        promptLength: prompt.length,
        estimatedTokens: Math.ceil(prompt.length / 4)
      });

      const response = await deepSeekService.analyze(prompt);

      const comparison = this._addDisclaimers(response, 'comparison');

      const processingTime = Date.now() - startTime;

      logger.info('[AIEducation] Comparaison générée avec succès', {
        productsCount: products.length,
        productNames: products.map(p => p.name),
        responseLength: comparison.length,
        processingTimeMs: processingTime,
        estimatedTokensUsed: Math.ceil((prompt.length + response.length) / 4)
      });

      return {
        success: true,
        comparison,
        productsCompared: products.map(p => ({ id: p._id, name: p.name })),
        disclaimerShown: true,
        metadata: {
          processingTimeMs: processingTime,
          responseLength: comparison.length
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error('[AIEducation] Erreur comparaison produits', {
        error: error.message,
        stack: error.stack,
        productsCount: products?.length,
        processingTimeMs: processingTime
      });

      return {
        success: false,
        error: 'Impossible de comparer les produits pour le moment.',
        metadata: {
          processingTimeMs: processingTime
        }
      };
    }
  }

  /**
   * MÉTHODE 3 : Répondre question libre utilisateur
   * Usage : "C'est quoi un parabène ?", "Le silicone est-il mauvais ?"
   */
  async answerQuestion(question, context = {}) {
    const startTime = Date.now();
    
    try {
      // Validation paramètres
      if (!question || typeof question !== 'string') {
        logger.warn('[AIEducation] Tentative réponse question invalide');
        throw new Error('Question invalide ou manquante');
      }

      if (question.length < 5) {
        logger.warn('[AIEducation] Question trop courte', { questionLength: question.length });
        throw new Error('Question trop courte');
      }

      if (question.length > 500) {
        logger.warn('[AIEducation] Question trop longue', { questionLength: question.length });
        throw new Error('Question trop longue (max 500 caractères)');
      }

      logger.info('[AIEducation] Traitement question utilisateur', {
        questionLength: question.length,
        hasProductContext: !!context.product,
        productName: context.product?.name
      });

      // Contexte produit si disponible
      const productContext = context.product ?
        `CONTEXTE PRODUIT :
Produit scanné : ${context.product.name}
Score : ${context.product.scores?.overallScore || 'N/A'}/100
Catégorie : ${context.product.categoryType || 'N/A'}` :
        'CONTEXTE : Question générale (pas de produit scanné)';

      const prompt = `Tu es un éducateur scientifique spécialisé en cosmétiques/détergents/ingrédients.

${productContext}

QUESTION UTILISATEUR :
"${question}"

CONSIGNE :
Réponds de manière PÉDAGOGIQUE, SOURCÉE, NEUTRE.

FORMAT OBLIGATOIRE :
1. **RÉPONSE DIRECTE** (2-3 phrases simples)
   Réponds à la question clairement.

2. **EXPLICATION SCIENTIFIQUE** (3-5 phrases)
   - Définition claire (ex: "Un parabène est un conservateur chimique...")
   - Pourquoi c'est utilisé (ex: "Empêche croissance bactérienne...")
   - Ce que dit la science (ex: "Selon ANSES 2019, les parabènes...")

3. **NUANCE IMPORTANTE** (2-3 phrases)
   - Pas tout noir ou blanc
   - "Certains sont autorisés, d'autres interdits"
   - "Danger dépend de concentration, fréquence, type"

4. **SOURCES OFFICIELLES** (liste)
   - ANSES rapport X (URL)
   - SCCS opinion Y (URL)
   - Étude PubMed Z (URL)

RÈGLES STRICTES :
❌ Jamais "c'est dangereux" sans nuance
❌ Jamais "vous devez éviter" (prescriptif)
✅ Toujours "classé X par organisme Y"
✅ Toujours "peut affecter Z% population selon étude W"
✅ Toujours sourcer avec organisme officiel

Si question hors sujet (politique, religion, etc.) :
"Je suis spécialisé en cosmétiques/détergents/ingrédients. Je ne peux pas répondre à cette question."

Réponds maintenant :`;

      logger.debug('[AIEducation] Appel DeepSeek pour réponse question', {
        promptLength: prompt.length,
        estimatedTokens: Math.ceil(prompt.length / 4)
      });

      const response = await deepSeekService.analyze(prompt);

      const answer = this._addDisclaimers(response, 'question');

      const processingTime = Date.now() - startTime;

      logger.info('[AIEducation] Réponse question générée avec succès', {
        questionLength: question.length,
        responseLength: answer.length,
        processingTimeMs: processingTime,
        estimatedTokensUsed: Math.ceil((prompt.length + response.length) / 4)
      });

      return {
        success: true,
        answer,
        question,
        sources: this._extractSources(response),
        disclaimerShown: true,
        metadata: {
          processingTimeMs: processingTime,
          responseLength: answer.length
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error('[AIEducation] Erreur réponse question', {
        error: error.message,
        stack: error.stack,
        questionLength: question?.length,
        processingTimeMs: processingTime
      });

      return {
        success: false,
        error: error.message || 'Impossible de répondre pour le moment.',
        metadata: {
          processingTimeMs: processingTime
        }
      };
    }
  }

  /**
   * MÉTHODE 4 : Suggérer alternatives selon profil
   * Usage : Produit 58/100 → "Alternatives adaptées à MOI"
   */
  async suggestAlternatives(product, userProfile = {}, count = 3) {
    const startTime = Date.now();
    
    try {
      // Validation paramètres
      if (!product || !product.name) {
        logger.warn('[AIEducation] Tentative suggestion alternatives sans produit');
        throw new Error('Produit invalide ou manquant');
      }

      logger.info('[AIEducation] Recherche alternatives', {
        productId: product._id,
        productName: product.name,
        requestedCount: count,
        hasUserProfile: !!userProfile
      });

      // Cette méthode sera enrichie avec recherche en base MongoDB
      // Pour l'instant, on retourne une structure de réponse

      const processingTime = Date.now() - startTime;

      logger.warn('[AIEducation] Méthode suggestAlternatives non implémentée', {
        productId: product._id,
        processingTimeMs: processingTime
      });

      return {
        success: true,
        message: 'Méthode en cours d\'implémentation. Connecter à MongoDB pour recherche.',
        product: { 
          id: product._id, 
          name: product.name, 
          score: product.scores?.overallScore 
        },
        metadata: {
          processingTimeMs: processingTime
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error('[AIEducation] Erreur suggestion alternatives', {
        error: error.message,
        stack: error.stack,
        productId: product?._id,
        processingTimeMs: processingTime
      });

      return {
        success: false,
        error: 'Impossible de suggérer alternatives pour le moment.',
        metadata: {
          processingTimeMs: processingTime
        }
      };
    }
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES PRIVÉES
  // ============================================================================

  /**
   * Construire contexte produit pour prompt IA
   */
  _buildProductContext(product) {
    const category = product.categoryType || 'cosmetic';

    if (category === 'cosmetic') {
      return `Nom : ${product.name}
Marque : ${product.brand || 'Non spécifiée'}
Catégorie : Cosmétique
Score global : ${product.scores?.overallScore || 'N/A'}/100
Score santé : ${product.scores?.healthScore || 'N/A'}/100
Score environnement : ${product.scores?.environmentScore || 'N/A'}/100

Détail scores :
- Ingrédients : ${product.scores?.breakdown?.ingredients?.score || 'N/A'}/100
- Perturbateurs endocriniens : ${product.cosmeticData?.endocrineDisruptors?.length || 0} détectés
- Allergènes : ${product.cosmeticData?.allergens?.length || 0} détectés
- Biodégradabilité : ${product.cosmeticData?.biodegradability || 'N/A'}%
- Labels : ${product.cosmeticData?.labels?.join(', ') || 'Aucun'}

Composition INCI (premiers ingrédients) :
${product.cosmeticData?.inci?.slice(0, 10).join(', ') || 'Non disponible'}`;
    }

    if (category === 'detergent') {
      return `Nom : ${product.name}
Marque : ${product.brand || 'Non spécifiée'}
Catégorie : Détergent/Ménage
Score global : ${product.scores?.overallScore || 'N/A'}/100
Score santé : ${product.scores?.healthScore || 'N/A'}/100
Score environnement : ${product.scores?.environmentScore || 'N/A'}/100

Détail scores :
- Composition : ${product.scores?.breakdown?.composition?.score || 'N/A'}/100
- Biodégradabilité : ${product.detergentData?.biodegradability || 'N/A'}%
- Écotoxicité : ${product.detergentData?.ecotoxicity || 'N/A'}
- Labels : ${product.detergentData?.labels?.join(', ') || 'Aucun'}

Composition (principaux composants) :
${product.detergentData?.composition?.slice(0, 8).join(', ') || 'Non disponible'}`;
    }

    return `Produit : ${product.name}
Score : ${product.scores?.overallScore || 'N/A'}/100
Catégorie : ${category}`;
  }

  /**
   * Ajouter disclaimers santé/IA selon contexte
   */
  _addDisclaimers(content, type) {
    const disclaimers = {
      explanation: `

---
⚠️ **Information santé** : Cette analyse est générée par intelligence artificielle et ne remplace pas un avis médical personnalisé. En cas de doute, consultez un dermatologue ou professionnel de santé.

📚 **Sources** : Les informations sont basées sur les données ANSES, EFSA, SCCS (Comité Scientifique Cosmétiques EU), et études scientifiques référencées.`,

      comparison: `

---
⚠️ **Disclaimer comparaison** : Cette comparaison est basée sur des critères scientifiques objectifs. Le "meilleur" produit dépend de votre profil personnel (type de peau, allergies, budget). Toujours tester sur petite zone 48h avant utilisation complète.`,

      question: `

---
🤖 **Assistant IA** : Je suis un assistant éducatif, pas un professionnel de santé. Mes réponses sont générées par intelligence artificielle et visent à informer, pas à prescrire. Toujours vérifier avec un professionnel en cas de doute.`
    };

    return content + (disclaimers[type] || disclaimers.question);
  }

  /**
   * Extraire sources mentionnées dans réponse IA
   */
  _extractSources(content) {
    const sources = [];

    // Détecter mentions d'organismes
    const organizations = ['ANSES', 'EFSA', 'SCCS', 'OMS', 'WHO', 'PubMed', 'ADEME', 'INSERM'];
    organizations.forEach(org => {
      if (content.includes(org)) {
        sources.push({
          organization: org,
          mentioned: true
        });
      }
    });

    return sources.length > 0 ? sources : [{ organization: 'Général', mentioned: true }];
  }
}

module.exports = new AIEducationService();
