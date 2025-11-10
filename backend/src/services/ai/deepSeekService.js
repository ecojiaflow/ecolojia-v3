const fetch = require('node-fetch');

function toText(value) {
  if (value === null || value === undefined) return '';
  // Si c'est déjà une chaîne
  if (typeof value === 'string') return value;
  // Si c'est un tableau de segments {type,text} → concat
  if (Array.isArray(value)) {
    try {
      return value.map(v => (typeof v === 'string' ? v : JSON.stringify(v))).join(' ');
    } catch { return String(value); }
  }
  // Objets divers → JSON compact
  try { return JSON.stringify(value); } catch { return String(value); }
}

function normalizeMessages(rawMessages = [], context = {}) {
  const base = [
    {
      role: 'system',
      content:
        'Tu es Ecolojia, assistant recettes & nutrition. Réponds brièvement, en français, avec des conseils concrets et sûrs.'
    }
  ];

  const mapped = rawMessages.map(m => ({
    role: (m && m.role) ? m.role : 'user',
    content: toText(m && m.content)
  }));

  // Ajout contexte produit/recette s'ils existent
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

// Compat: ancien nom "analyze" utilisé par chat.routes.js
async function analyze(opts) {
  return chat(opts);
}

/**
 * NOUVELLE FONCTION : analyzeProduct()
 * Analyse un produit et retourne des données enrichies
 * selon sa catégorie (food/cosmetic/detergent)
 */
async function analyzeProduct({ apiKey, product, category = 'food' }) {
  if (!apiKey) throw new Error('DeepSeek API key manquante');
  if (!product) throw new Error('Product manquant');

  // Construire prompt selon catégorie
  const prompt = buildPromptForCategory(product, category);

  // Appeler chat avec température basse (factuel)
  const result = await chat({
    apiKey,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2 // Faible = réponses factuelles
  });

  // Parser réponse JSON
  const enrichedData = parseAnalysisResponse(result.text, category);

  return {
    ...enrichedData,
    confidence: enrichedData.confidence || 0.75,
    source: 'deepseek-ai',
    analyzedAt: new Date().toISOString()
  };
}

/**
 * Construire prompt selon catégorie produit
 */
function buildPromptForCategory(product, category) {
  const productName = product.name || product.product_name || 'Produit inconnu';
  const brand = product.brand || '';

  switch (category) {
    case 'food':
      return buildFoodPrompt(product, productName, brand);
    
    case 'cosmetic':
      return buildCosmeticPrompt(product, productName, brand);
    
    case 'detergent':
      return buildDetergentPrompt(product, productName, brand);
    
    default:
      return buildFoodPrompt(product, productName, brand);
  }
}

/**
 * Prompt alimentaire
 */
function buildFoodPrompt(product, productName, brand) {
  const ingredients = product.ingredients_text || product.foodData?.ingredients?.join(', ') || 'Non disponibles';
  
  return `Analyse nutritionnelle du produit "${productName}" ${brand ? `(${brand})` : ''}.

Ingrédients : ${ingredients}

Estime les valeurs nutritionnelles manquantes. Réponds UNIQUEMENT en JSON valide :
{
  "nutrition": {
    "calories": <nombre ou null>,
    "protein": <nombre ou null>,
    "carbs": <nombre ou null>,
    "fat": <nombre ou null>,
    "fiber": <nombre ou null>,
    "sugar": <nombre ou null>,
    "salt": <nombre ou null>
  },
  "allergens": [<liste allergènes détectés>],
  "nova": <groupe 1-4 ou null>,
  "confidence": <0-1>
}

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;
}

/**
 * Prompt cosmétique
 */
function buildCosmeticPrompt(product, productName, brand) {
  const inci = product.cosmeticsData?.inci?.join(', ') || product.ingredients_text || 'Non disponible';
  
  return `Analyse cosmétique du produit "${productName}" ${brand ? `(${brand})` : ''}.

Composition INCI : ${inci}

Analyse les ingrédients. Réponds UNIQUEMENT en JSON valide :
{
  "allergens": [<liste allergènes>],
  "endocrineDisruptors": [<liste perturbateurs endocriniens>],
  "biodegradability": <0-100 ou null>,
  "naturalPercentage": <0-100 ou null>,
  "confidence": <0-1>
}

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;
}

/**
 * Prompt détergent
 */
function buildDetergentPrompt(product, productName, brand) {
  const composition = product.detergentsData?.composition?.join(', ') || product.ingredients_text || 'Non disponible';
  
  return `Analyse détergent/ménager "${productName}" ${brand ? `(${brand})` : ''}.

Composition : ${composition}

Analyse écologique. Réponds UNIQUEMENT en JSON valide :
{
  "biodegradability": <0-100 ou null>,
  "toxicity": <"low"|"medium"|"high" ou null>,
  "ecotoxicity": <"low"|"medium"|"high" ou null>,
  "confidence": <0-1>
}

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;
}

/**
 * Parser réponse IA (robuste)
 */
function parseAnalysisResponse(text, category) {
  try {
    // Retirer markdown si présent (```json ... ```)
    const cleaned = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const parsed = JSON.parse(cleaned);
    
    // Valider structure selon catégorie
    if (category === 'food' && !parsed.nutrition) {
      console.warn('[deepSeekService] Nutrition manquante dans réponse IA');
    }
    
    return parsed;
    
  } catch (error) {
    console.error('[deepSeekService] Erreur parse JSON IA:', error.message);
    console.error('[deepSeekService] Texte reçu:', text.substring(0, 200));
    
    // Retour par défaut si parse échoue
    return {
      error: 'PARSE_ERROR',
      confidence: 0,
      rawText: text.substring(0, 500)
    };
  }
}

module.exports = { chat, analyze, analyzeProduct, normalizeMessages };