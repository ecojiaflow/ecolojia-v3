// ============================================================================
// ECOLOJIA - DeepSeek Service HYBRIDE
// Service IA utilisant DeepSeek API avec contexte scientifique
// Version 3.1-hybrid
// ============================================================================

function toText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    try {
      return value.map(v => (typeof v === 'string' ? v : JSON.stringify(v))).join(' ');
    } catch { return String(value); }
  }
  try { return JSON.stringify(value); } catch { return String(value); }
}

function normalizeMessages(rawMessages = [], context = {}) {
  const base = [
    {
      role: 'system',
      content: 'Tu es Ecolojia, assistant recettes & nutrition. Réponds brièvement, en français, avec des conseils concrets et sûrs.'
    }
  ];

  const mapped = rawMessages.map(m => ({
    role: (m && m.role) ? m.role : 'user',
    content: toText(m && m.content)
  }));

  if (context && (context.product || context.recipe)) {
    const ctxText = toText({ product: context.product || null, recipe: context.recipe || null });
    mapped.unshift({ role: 'system', content: `Contexte: ${ctxText}` });
  }

  return base.concat(mapped);
}

async function chat({ apiKey, model = 'deepseek-chat', messages = [], temperature = 0.3, context = {} }) {
  if (!apiKey) throw new Error('DeepSeek API key manquante (DEEPSEEK_API_KEY)');
  const url = 'https://api.deepseek.com/chat/completions';

  const payload = {
    model,
    temperature,
    messages: normalizeMessages(messages, context)
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = (json && json.error && json.error.message) ? json.error.message : `HTTP ${res.status}`;
    throw new Error(`DeepSeek API error: ${msg}`);
  }

  const choice = json.choices && json.choices[0];
  const text = choice && choice.message && choice.message.content ? choice.message.content : '';
  return { text, raw: json };
}

async function analyze(opts) {
  return chat(opts);
}

/**
 * ============================================================================
 * FONCTION HYBRIDE : analyzeProduct()
 * Analyse produit avec contexte scientifique de la knowledge base
 * ============================================================================
 */
async function analyzeProduct({ apiKey, product, category = 'food' }) {
  if (!apiKey) throw new Error('DeepSeek API key manquante');
  if (!product) throw new Error('Product manquant');

  // Construire prompt enrichi selon catégorie
  const prompt = buildPromptForCategory(product, category);

  // Appeler chat avec température basse (factuel)
  const result = await chat({
    apiKey,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2
  });

  // Parser réponse JSON
  const enrichedData = parseAnalysisResponse(result.text, category);

  return {
    ...enrichedData,
    confidence: enrichedData.confidence || 0.75,
    source: 'deepseek-ai-hybrid',
    analyzedAt: new Date().toISOString()
  };
}

/**
 * ============================================================================
 * NOUVEAU : Construire prompt HYBRIDE avec contexte scientifique
 * ============================================================================
 */
function buildPromptForCategory(product, category) {
  const productName = product.name || product.product_name || 'Produit inconnu';
  const brand = product.brand || '';
  
  // NOUVEAU : Extraire contexte scientifique si disponible
  const scientificContext = product.scientificContext;

  switch (category) {
    case 'food':
      return buildFoodPromptHybrid(product, productName, brand, scientificContext);

    case 'cosmetic':
      return buildCosmeticPrompt(product, productName, brand);

    case 'detergent':
      return buildDetergentPrompt(product, productName, brand);

    default:
      return buildFoodPromptHybrid(product, productName, brand, scientificContext);
  }
}

/**
 * ============================================================================
 * NOUVEAU : Prompt alimentaire HYBRIDE (avec contexte scientifique)
 * ============================================================================
 */
function buildFoodPromptHybrid(product, productName, brand, scientificContext) {
  const ingredients = product.ingredients_text || product.foodData?.ingredients?.join(', ') || 'Non disponibles';

  // Construction prompt de base
  let prompt = `Tu es un expert scientifique en nutrition pour Ecolojia.

PRODUIT À ANALYSER :
Nom : "${productName}" ${brand ? `(${brand})` : ''}
Ingrédients : ${ingredients}

`;

  // ============================================================================
  // AJOUT CONTEXTE SCIENTIFIQUE SI DISPONIBLE
  // ============================================================================
  if (scientificContext && scientificContext.knowledgeBaseAnalysis) {
    const kb = scientificContext.knowledgeBaseAnalysis;
    
    prompt += `════════════════════════════════════════════════════════════════
🔬 BASE DE CONNAISSANCE SCIENTIFIQUE (À UTILISER EN PRIORITÉ)
════════════════════════════════════════════════════════════════

Notre base de données scientifique a détecté les éléments suivants :

📊 ANALYSE GLOBALE :
- Total ingrédients analysés : ${kb.totalIngredients}
- Impact estimé sur le score : ${kb.scoreImpact} points

`;

    // Problèmes critiques
    if (kb.criticalIssues && kb.criticalIssues.length > 0) {
      prompt += `🔴 PROBLÈMES CRITIQUES (${kb.criticalIssues.length}) :
`;
      kb.criticalIssues.forEach((issue, idx) => {
        prompt += `${idx + 1}. ${issue.ingredient || issue.type || issue.flag}
   ${issue.issue || issue.details || issue.reason}
`;
      });
      prompt += `
`;
    }

    // Problèmes élevés
    if (kb.highIssues && kb.highIssues.length > 0) {
      prompt += `🟠 PROBLÈMES ÉLEVÉS (${kb.highIssues.length}) :
`;
      kb.highIssues.forEach((issue, idx) => {
        prompt += `${idx + 1}. ${issue.ingredient}
   ${issue.issue || issue.details}
`;
      });
      prompt += `
`;
    }

    // Problèmes modérés
    if (kb.moderateIssues && kb.moderateIssues.length > 0) {
      prompt += `🟡 PROBLÈMES MODÉRÉS (${kb.moderateIssues.length}) :
`;
      kb.moderateIssues.slice(0, 3).forEach((issue, idx) => {
        prompt += `${idx + 1}. ${issue.ingredient || issue.type}
`;
      });
      if (kb.moderateIssues.length > 3) {
        prompt += `... et ${kb.moderateIssues.length - 3} autres
`;
      }
      prompt += `
`;
    }

    // Red flags
    if (kb.redFlags && kb.redFlags.length > 0) {
      prompt += `🚩 RED FLAGS DÉTECTÉS :
`;
      kb.redFlags.forEach(flag => {
        prompt += `- ${flag.flag?.description || 'Flag détecté'}
`;
      });
      prompt += `
`;
    }

    // Procédés cachés
    if (kb.hiddenProcesses && kb.hiddenProcesses.length > 0) {
      prompt += `⚙️ PROCÉDÉS CACHÉS DÉTECTÉS :
`;
      kb.hiddenProcesses.forEach(proc => {
        prompt += `- ${proc.process?.processName} (Sévérité: ${proc.process?.severity?.toUpperCase()})
  ${proc.process?.description}
`;
      });
      prompt += `
`;
    }

    prompt += `════════════════════════════════════════════════════════════════

`;
  }

  // ============================================================================
  // INSTRUCTIONS POUR CALCUL DES 8 COMPOSANTES
  // ============================================================================
  prompt += `MISSION : Calculer les 8 composantes du score Ecolojia (0-100 chacune)

${scientificContext ? `IMPORTANT : Utilise OBLIGATOIREMENT les détections de la base scientifique ci-dessus.
- Applique l'impact score détecté (${scientificContext.knowledgeBaseAnalysis?.scoreImpact || 0} points) sur les composantes concernées
- Cite les sources détectées dans tes justifications
- Pour ingrédients critiques → scores très bas (<30)
- Pour procédés cachés → réduire processingScore significativement
- Pour red flags → impact fort sur composantes concernées

` : ''}LES 8 COMPOSANTES À CALCULER :

1. naturalScore (0-100) - Degré de naturalité
   → Plus le produit est transformé/raffiné, plus le score est BAS
   → Raffinage, additifs, procédés chimiques → score BAS

2. healthScore (0-100) - Impact santé
   → Ingrédients nocifs (palme, sucre raffiné, trans fats) → score BAS
   → Ingrédients sains (fruits, légumes, grains entiers) → score HAUT

3. environmentScore (0-100) - Impact écologique
   → Déforestation (palme), élevage intensif, pesticides → score BAS
   → Bio, local, durable → score HAUT

4. nutriScore (0-100) - Qualité nutritionnelle
   → Profil macro/micro nutriments
   → Fibres, protéines, vitamines → score HAUT
   → Sucres, graisses saturées, sel → score BAS

5. additivesScore (0-100) - Additifs
   → Nombre et dangerosité des additifs
   → E-numbers problématiques → score BAS

6. processingScore (0-100) - Niveau de transformation
   → NOVA 1 (non transformé) → 90-100
   → NOVA 4 (ultra-transformé) → 0-30
   → Extrusion, hydrogénation, UHT → score BAS

7. originScore (0-100) - Traçabilité origine
   → Labels (AOP, Bio, MSC) → score HAUT
   → Origine floue → score BAS

8. labelsScore (0-100) - Labels & certifications
   → Bio AB, Label Rouge, MSC, Fair Trade → score HAUT
   → Aucun label → score BAS

────────────────────────────────────────────────────────────────

RÉPONDS UNIQUEMENT EN JSON VALIDE (pas de markdown, pas de \`\`\`) :

{
  "scores": {
    "naturalScore": <nombre 0-100>,
    "healthScore": <nombre 0-100>,
    "environmentScore": <nombre 0-100>,
    "nutriScore": <nombre 0-100>,
    "additivesScore": <nombre 0-100>,
    "processingScore": <nombre 0-100>,
    "originScore": <nombre 0-100>,
    "labelsScore": <nombre 0-100>,
    "confidence": <nombre 0.0-1.0>
  },
  "justifications": {
    "naturalScore": "Justification courte avec sources si disponibles",
    "healthScore": "Justification courte avec sources si disponibles",
    "environmentScore": "Justification courte avec sources si disponibles",
    "nutriScore": "Justification courte",
    "additivesScore": "Justification courte",
    "processingScore": "Justification courte",
    "originScore": "Justification courte",
    "labelsScore": "Justification courte"
  },
  "nutrition": {
    "calories": <nombre ou null>,
    "protein": <nombre ou null>,
    "carbs": <nombre ou null>,
    "fat": <nombre ou null>,
    "fiber": <nombre ou null>,
    "sugar": <nombre ou null>,
    "salt": <nombre ou null>
  },
  "warnings": ["Liste des alertes principales"],
  "recommendations": ["Liste des recommandations"]
}

RAPPEL : 
- JSON pur UNIQUEMENT (pas de \`\`\`json)
- Tous les scores entre 0 et 100
- Confidence entre 0.0 et 1.0
${scientificContext ? '- UTILISE OBLIGATOIREMENT les détections de la base scientifique' : ''}`;

  return prompt;
}

/**
 * Prompt cosmétique (conservé)
 */
function buildCosmeticPrompt(product, productName, brand) {
  const ingredients = product.ingredients_text || 'Non disponibles';

  return `Analyse cosmétique du produit "${productName}" ${brand ? `(${brand})` : ''}.

Ingrédients : ${ingredients}

Réponds UNIQUEMENT en JSON valide :
{
  "scores": {
    "naturalScore": <0-100>,
    "healthScore": <0-100>,
    "environmentScore": <0-100>,
    "confidence": <0.0-1.0>
  },
  "warnings": ["Liste des alertes"],
  "recommendations": ["Recommandations"]
}`;
}

/**
 * Prompt détergent (conservé)
 */
function buildDetergentPrompt(product, productName, brand) {
  const ingredients = product.ingredients_text || 'Non disponibles';

  return `Analyse détergent du produit "${productName}" ${brand ? `(${brand})` : ''}.

Ingrédients : ${ingredients}

Réponds UNIQUEMENT en JSON valide :
{
  "scores": {
    "naturalScore": <0-100>,
    "environmentScore": <0-100>,
    "healthScore": <0-100>,
    "confidence": <0.0-1.0>
  },
  "warnings": ["Liste des alertes"],
  "recommendations": ["Recommandations"]
}`;
}

/**
 * Parser réponse DeepSeek
 */
function parseAnalysisResponse(text, category) {
  try {
    // Nettoyer markdown si présent
    let cleaned = text.trim();
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const parsed = JSON.parse(cleaned);

    // Validation scores
    if (parsed.scores) {
      Object.keys(parsed.scores).forEach(key => {
        const val = parsed.scores[key];
        if (typeof val === 'number') {
          if (key === 'confidence') {
            parsed.scores[key] = Math.max(0, Math.min(1, val));
          } else {
            parsed.scores[key] = Math.max(0, Math.min(100, val));
          }
        }
      });
    }

    return parsed;

  } catch (error) {
    console.error('[DeepSeek] Erreur parsing JSON:', error.message);
    console.error('[DeepSeek] Texte reçu:', text.substring(0, 200));

    return {
      scores: {
        naturalScore: 50,
        healthScore: 50,
        environmentScore: 50,
        confidence: 0.3
      },
      warnings: ['Erreur parsing réponse IA'],
      recommendations: [],
      parseError: true
    };
  }
}

module.exports = {
  chat,
  analyze,
  analyzeProduct
};