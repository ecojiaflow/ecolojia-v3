// PATH: backend/src/services/ai/deepSeekService.js
// VERSION: v2.1 - PROMPT SCIENTIFIQUE ROBUSTE - CORRECTION ESTIMATION FORCÉE

const axios = require('axios');
const crypto = require('crypto');
const aiCache = require('../aiCache.service');

// 📄 CACHE VERSION
const CACHE_VERSION = 'v3.1'; // v3.1: Force estimation (pas de null accepté)

class DeepSeekService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    this.apiUrl = 'https://api.deepseek.com/v1/chat/completions';
    this.model = 'deepseek-chat';

    if (!this.apiKey) {
      console.warn('[DeepSeek] API key not configured');
    }
  }

  async analyze(prompt, systemPrompt = null) {
    const cacheInput = JSON.stringify({ prompt, systemPrompt });
    const cacheHash = crypto.createHash('md5').update(cacheInput).digest('hex');
    const cacheKey = `deepseek:analyze:${CACHE_VERSION}:${cacheHash}`;

    const cached = await aiCache.get(cacheKey);
    if (cached) {
      console.log('[DeepSeek] ✅ CACHE HIT');
      return cached;
    }

    try {
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      console.log('[DeepSeek] Sending request...');

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages,
          temperature: 0.3,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 90000
        }
      );

      console.log('[DeepSeek] Response received');

      const result = response.data.choices[0].message.content;
      await aiCache.set(cacheKey, result, 2592000);
      console.log('[DeepSeek] ✅ Résultat sauvegardé en cache');

      return result;

    } catch (error) {
      console.error('[DeepSeek] API error:', error.response?.data || error.message);

      if (process.env.OPENAI_API_KEY) {
        return this.fallbackToOpenAI(prompt, systemPrompt);
      }

      throw new Error('AI analysis failed');
    }
  }

  async fallbackToOpenAI(prompt, systemPrompt) {
    console.log('[DeepSeek] Falling back to OpenAI...');
    try {
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-turbo',
          messages,
          temperature: 0.3,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 90000
        }
      );

      console.log('[DeepSeek] OpenAI fallback successful');
      const result = response.data.choices[0].message.content;
      await aiCache.set(cacheKey, result, 2592000);
      return result;

    } catch (error) {
      console.error('[DeepSeek] OpenAI fallback failed:', error.message);
      throw new Error('Both AI services failed');
    }
  }

  async analyzeProduct(productData, category) {
    const systemPrompt = this.getSystemPromptForCategory(category);
    const userPrompt = this.buildProductPrompt(productData, category);

    const response = await this.analyze(userPrompt, systemPrompt);

    return this.parseAIResponse(response, category);
  }

  getSystemPromptForCategory(category) {
    const prompts = {
      food: `Tu es un expert certifié en nutrition (équivalent ANSES/EFSA).

RÈGLES ABSOLUES :
1. Réponds UNIQUEMENT en JSON valide (aucun texte avant/après le JSON)
2. Base tes estimations sur des SOURCES scientifiques (tables CIQUAL, USDA, études publiées)
3. Tu DOIS TOUJOURS estimer les valeurs nutritionnelles manquantes en analysant :
   - La liste d'ingrédients (ordre = proportions relatives)
   - Les valeurs typiques des aliments similaires documentés
   - Les tables nutritionnelles officielles (CIQUAL, USDA, études)
4. Si tu ne peux vraiment pas estimer avec >30% de confiance, mets 0 (JAMAIS null)
5. Indique TOUJOURS ton niveau de confiance par nutriment (0-100%)

FORMAT JSON OBLIGATOIRE :
{
  "nutriments": {
    "energy_100g": number (JAMAIS null),
    "proteins_100g": number (JAMAIS null),
    "carbohydrates_100g": number (JAMAIS null),
    "sugars_100g": number (JAMAIS null),
    "fat_100g": number (JAMAIS null),
    "saturated_fat_100g": number (JAMAIS null),
    "salt_100g": number (JAMAIS null),
    "sodium_100g": number (JAMAIS null),
    "fiber_100g": number (JAMAIS null)
  },
  "confidence": {
    "global": number (0-100),
    "per_nutrient": {
      "sugars_100g": number,
      "saturated_fat_100g": number,
      "salt_100g": number
    }
  },
  "methodology": "string expliquant ta méthode d'estimation",
  "sources": ["source1", "source2"],
  "warnings": ["avertissement1 si pertinent"]
}

GARDE-FOUS PHYSIQUES (rejette si dépassé) :
- sugars_100g : 0-100 g/100g
- saturated_fat_100g : 0-50 g/100g
- salt_100g : 0-10 g/100g
- COHÉRENCE : sugars_100g ≤ carbohydrates_100g
- COHÉRENCE : saturated_fat_100g ≤ fat_100g

EXEMPLE CONCRET :
Si ingrédients = "Cacahuètes 55%, sirop de riz, miel"
→ sugars_100g: 25-30 (sirop+miel dominants après cacahuètes)
→ saturated_fat_100g: 8-10 (cacahuètes typiques)
→ salt_100g: 0.3-0.5 (trace naturelle + possible ajout)`,

      cosmetics: `Tu es un expert en cosmétique et dermatologie.
                  Analyse les produits selon leur composition INCI, les perturbateurs endocriniens, et les allergènes.
                  Base-toi sur les données ANSM et SCCS.
                  Sois précis sur les risques cutanés.`,

      detergents: `Tu es un expert en produits ménagers et impact environnemental.
                   Analyse les produits selon leur toxicité, biodégradabilité, et impact aquatique.
                   Base-toi sur les données REACH et ECHA.
                   Mets l'accent sur la sécurité domestique.`
    };

    return prompts[category] || prompts.food;
  }

  buildProductPrompt(productData, category) {
    if (category !== 'food') {
      return `Analyse le produit suivant de manière détaillée :

Nom: ${productData.name || productData.product_name || 'Non spécifié'}
Marque: ${productData.brand || 'Non spécifiée'}
Catégorie: ${category}
Ingredients: ${productData.ingredients || productData.composition || productData.inci || 'Non spécifiés'}

Fournis une analyse structurée avec :
1. Score de santé global (0-100)
2. Score environnemental (0-100)
3. Points positifs (liste)
4. Points négatifs (liste)
5. Recommandations personnalisées (3 maximum)
6. Alternatives suggérées (3 maximum)`;
    }

    const existingNutriments = productData.nutriments || {};
    const ingredients = productData.ingredients_text || productData.ingredients || 'Non fournis';
    const categories = productData.categories || 'Non spécifiée';

    return `PRODUIT À ANALYSER :
- Nom : ${productData.name || productData.product_name || 'Non spécifié'}
- Marque : ${productData.brand || 'Non spécifiée'}
- Ingrédients : ${ingredients}
- Catégorie : ${categories}

DONNÉES NUTRITIONNELLES EXISTANTES (ne PAS ré-estimer ces valeurs) :
${JSON.stringify(existingNutriments, null, 2)}

MISSION CRITIQUE :
1. Identifie les nutriments MANQUANTS (ceux qui sont null, undefined ou absents)
2. ESTIME-LES TOUJOURS en te basant sur :
   - Position des ingrédients (ordre = importance décroissante)
   - Catégorie du produit (tables moyennes CIQUAL/USDA)
   - Produits similaires documentés dans la littérature scientifique
3. Analyse les PROPORTIONS :
   - 1er ingrédient = souvent 40-60% du produit
   - 2ème ingrédient = souvent 15-25%
   - 3ème ingrédient = souvent 5-15%

PRIORITÉ D'ESTIMATION (si manquants) :
- sugars_100g : ANALYSE les sucres ajoutés (sirop, miel, dextrose) + sucres naturels
- saturated_fat_100g : ANALYSE les huiles/graisses indiquées (palme, coco = élevé)
- salt_100g : ANALYSE le sel/sodium + ingrédients salés (sauce soja, fromage)

GARDE-FOUS À RESPECTER :
- Sucres : 0-100 g/100g (max physique)
- Graisses saturées : 0-50 g/100g
- Sel : 0-10 g/100g
- Cohérence : sugars_100g ≤ carbohydrates_100g
- Cohérence : saturated_fat_100g ≤ fat_100g

IMPORTANT CRITIQUE :
- NE METS JAMAIS null pour un nutriment
- Si vraiment impossible d'estimer (liste ingrédients vide), mets 0
- Indique une confiance faible (20-40%) mais ESTIME quand même

RETOURNE LE JSON (rien d'autre, pas de texte explicatif avant ou après).`;
  }

  parseAIResponse(response, category) {
    if (category !== 'food') {
      return {
        analysis: response,
        scores: {
          health: this.extractScore(response, 'santé'),
          environment: this.extractScore(response, 'environnement'),
          ethics: 70
        },
        positives: this.extractListItems(response, 'positif'),
        negatives: this.extractListItems(response, 'négatif'),
        recommendations: this.extractListItems(response, 'recommandation'),
        alternatives: this.extractListItems(response, 'alternative'),
        timestamp: new Date(),
        aiModel: 'deepseek',
        category
      };
    }

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[DeepSeek] ❌ Pas de JSON dans la réponse:', response.substring(0, 200));
        throw new Error('No valid JSON in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const validated = this.validateNutrientData(parsed);

      // ✅ ADAPTER LE FORMAT pour aiEnrichment.service.js
      const adaptedNutriments = {};
      const n = validated.nutriments;
      
      // Mapper _100g vers format attendu par aiEnrichment
      if (n.sugars_100g !== undefined && n.sugars_100g !== null) adaptedNutriments.sugars = n.sugars_100g;
      if (n.saturated_fat_100g !== undefined && n.saturated_fat_100g !== null) adaptedNutriments.saturatedFat = n.saturated_fat_100g;
      if (n.salt_100g !== undefined && n.salt_100g !== null) adaptedNutriments.salt = n.salt_100g;
      if (n.fiber_100g !== undefined && n.fiber_100g !== null) adaptedNutriments.fiber = n.fiber_100g;
      if (n.energy_100g !== undefined && n.energy_100g !== null) adaptedNutriments.energy = n.energy_100g;
      if (n.proteins_100g !== undefined && n.proteins_100g !== null) adaptedNutriments.proteins = n.proteins_100g;
      if (n.carbohydrates_100g !== undefined && n.carbohydrates_100g !== null) adaptedNutriments.carbohydrates = n.carbohydrates_100g;
      if (n.fat_100g !== undefined && n.fat_100g !== null) adaptedNutriments.fat = n.fat_100g;
      
      console.log('[DeepSeek] ✅ Format adapté pour aiEnrichment:', JSON.stringify(adaptedNutriments));

      return {
        nutriments: adaptedNutriments,
        confidence: validated.confidence,
        methodology: validated.methodology || 'Estimation IA basée sur ingrédients et catégorie',
        sources: validated.sources || ['Tables CIQUAL', 'USDA'],
        warnings: validated.warnings || [],
        timestamp: new Date(),
        aiModel: 'deepseek',
        category: 'food',
        validated: true
      };

    } catch (error) {
      console.error('[DeepSeek] ❌ Erreur parsing JSON:', error.message);
      console.error('[DeepSeek] Réponse brute:', response.substring(0, 500));

      return {
        nutriments: {},
        confidence: { global: 0, per_nutrient: {} },
        methodology: 'Échec extraction',
        sources: [],
        warnings: ['Impossible de parser la réponse IA'],
        timestamp: new Date(),
        aiModel: 'deepseek',
        category: 'food',
        validated: false,
        error: error.message
      };
    }
  }

  validateNutrientData(parsed) {
    const nutriments = parsed.nutriments || {};
    const warnings = parsed.warnings || [];

    const limits = {
      sugars_100g: { min: 0, max: 100 },
      saturated_fat_100g: { min: 0, max: 50 },
      salt_100g: { min: 0, max: 10 },
      sodium_100g: { min: 0, max: 4000 },
      fat_100g: { min: 0, max: 100 },
      carbohydrates_100g: { min: 0, max: 100 },
      proteins_100g: { min: 0, max: 100 },
      fiber_100g: { min: 0, max: 50 }
    };

    Object.keys(nutriments).forEach(key => {
      const value = nutriments[key];
      if (value !== null && limits[key]) {
        if (value < limits[key].min || value > limits[key].max) {
          console.warn(`[DeepSeek] ⚠️ ${key} hors limites (${value}) → null`);
          nutriments[key] = null;
          warnings.push(`${key} hors limites physiques`);
        }
      }
    });

    if (nutriments.sugars_100g > nutriments.carbohydrates_100g && nutriments.carbohydrates_100g !== null) {
      console.warn('[DeepSeek] ⚠️ sugars > carbs → correction');
      nutriments.sugars_100g = nutriments.carbohydrates_100g;
      warnings.push('Sucres corrigés pour cohérence');
    }

    if (nutriments.saturated_fat_100g > nutriments.fat_100g && nutriments.fat_100g !== null) {
      console.warn('[DeepSeek] ⚠️ sat_fat > fat → correction');
      nutriments.saturated_fat_100g = nutriments.fat_100g;
      warnings.push('Graisses saturées corrigées pour cohérence');
    }

    return {
      ...parsed,
      nutriments,
      warnings
    };
  }

  extractScore(text, type) {
    const patterns = [
      new RegExp(`${type}[:\\s]*(\\d+)`, 'i'),
      new RegExp(`score[\\s]+${type}[:\\s]*(\\d+)`, 'i'),
      new RegExp(`${type}[\\s]*:[\\s]*(\\d+)`, 'i')
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return Math.min(100, Math.max(0, parseInt(match[1])));
      }
    }

    return 50;
  }

  extractListItems(text, keyword) {
    const lines = text.split('\n');
    const items = [];
    let capturing = false;

    for (const line of lines) {
      if (line.toLowerCase().includes(keyword)) {
        capturing = true;
        continue;
      }

      if (capturing && line.trim()) {
        if (line.match(/^[A-Z]/)) {
          capturing = false;
          continue;
        }

        const cleaned = line.replace(/^[-•*]\s*/, '').trim();
        if (cleaned && items.length < 5) {
          items.push(cleaned);
        }
      }
    }

    return items;
  }

  async chat(message, context = {}) {
    const systemPrompt = `Tu es l'assistant nutritionnel ECOLOJIA.
    Tu aides les utilisateurs à comprendre les analyses de produits et à faire des choix plus sains.
    Sois bienveillant, pédagogue et scientifiquement précis.
    ${context.product ? `Produit en contexte: ${context.product.name}` : ''}`;

    const userPrompt = message;

    return this.analyze(userPrompt, systemPrompt);
  }
}

module.exports = new DeepSeekService();