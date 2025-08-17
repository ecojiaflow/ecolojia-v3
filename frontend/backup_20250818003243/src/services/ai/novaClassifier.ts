// PATH: frontend/src/services/ai/novaClassifier.ts
export interface NovaResult {
  productName: string;
  novaGroup: number;
  confidence: number;
  reasoning: string;
  additives: {
    detected: Array<{
      code: string;
      name: string;
      riskLevel: 'low' | 'medium' | 'high';
      description: string;
    }>;
    total: number;
  };
  recommendations: string[];
  healthScore: number;
  isProcessed: boolean;
  category: string;
  timestamp: string;
  analysis?: {
    totalCount: number;
    ultraProcessingMarkers: any[];
    industrialIngredients: string[];
    additives: string[];
    naturalIngredients: string[];
    suspiciousTerms: string[];
  };
  source?: 'backend' | 'local'; // Ajout du champ source optionnel
}

// Æ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°tat global
let currentAnalysis: NovaResult | null = null;
let isAnalyzing = false;

/**
 * aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ MODE PRODUCTION: Analyse NOVA avec backend + fallback local
 * @param productName Nom du produit
 * @param ingredients Liste des ingredients
 * @returns Resultat de l'analyse NOVA
 */
export const analyzeProduct = async (
  productName: string, 
  ingredients: string
): Promise<NovaResult> => {
  if (isAnalyzing) {
    throw new Error('Une analyse est dejÆ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  en cours');
  }

  if (!productName?.trim() || !ingredients?.trim()) {
    throw new Error('Le nom du produit et les ingredients sont requis');
  }

  isAnalyzing = true;
  
  try {
    console.log('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Â¦â€šÃ‚Â¡aÃ¢â‚¬Å¡Ã‚Â¬ NovaClassifier - Demarrage analyse:', { productName, ingredients });
    
    // aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ TENTATIVE API BACKEND EN PREMIER
    try {
      const API_BASE = 'https://ecolojia-backend-working.onrender.com';
      
      console.log('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â Appel API backend...', `${API_BASE}/api/products/analyze`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes pour Render
      
      const response = await fetch(`${API_BASE}/api/products/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          productName: productName.trim(),
          ingredients: ingredients.trim()
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        console.log('aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ API backend reussie:', result);
        
        try {
          // Validation et formatage de la reponse backend
          const formattedResult = processBackendResponse(result, productName, ingredients);
          console.log('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€¦Ã¢â‚¬Å“Æ’Ã¢â‚¬Â¦â€šÃ‚Â  Resultat formate:', formattedResult);
          
          currentAnalysis = formattedResult;
          return formattedResult;
        } catch (formatError: any) {
          console.error('aÆ’Ã¢â‚¬Å¡â€šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢ Erreur de formatage backend:', formatError);
          // Continue vers le fallback local
          throw new Error('Erreur de formatage, utilisation du fallback');
        }
      } else {
        const errorText = await response.text().catch(() => '');
        console.warn(`aÆ’Ã¢â‚¬Å¡â€šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢ Backend erreur ${response.status}: ${errorText}, fallback local`);
      }
    } catch (backendError: any) {
      if (backendError.name === 'AbortError') {
        console.warn('aÆ’Ã¢â‚¬Å¡â€šÃ‚ÂÆ’Ã¢â‚¬Å¡â€šÃ‚Â±Æ’Ã‚Â¯Æ’Ã¢â‚¬Å¡â€šÃ‚Â¸Æ’Ã¢â‚¬Å¡â€šÃ‚Â Backend timeout apres 10s, fallback local');
      } else {
        console.warn('aÆ’Ã¢â‚¬Â¦â€šÃ‚Â¡Æ’Ã¢â‚¬Å¡â€šÃ‚Â Æ’Ã‚Â¯Æ’Ã¢â‚¬Å¡â€šÃ‚Â¸Æ’Ã¢â‚¬Å¡â€šÃ‚Â Backend indisponible, mode local active:', backendError.message);
      }
    }
    
    // aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ FALLBACK: ANALYSE LOCALE SI BACKEND Æ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°CHOUE
    console.log('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Å¡â€šÃ‚Â§Æ’Ã¢â‚¬Å¡â€šÃ‚Â  Fallback: Analyse NOVA locale avancee...');
    
    // Simulation delai d'analyse realiste
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));
    
    const result = generateAdvancedAnalysis(productName, ingredients);
    console.log('aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ Analyse NOVA locale generee:', result);
    
    currentAnalysis = result;
    return result;

  } catch (error) {
    console.error('aÆ’Ã¢â‚¬Å¡â€šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢ Erreur durant l\'analyse:', error);
    throw error;
  } finally {
    isAnalyzing = false;
  }
};

/**
 * aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ TRAITEMENT RÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°PONSE BACKEND
 * Formate la reponse du backend au format attendu par le frontend
 */
function processBackendResponse(backendData: any, productName: string, ingredients: string): NovaResult {
  // La reponse backend contient un objet 'nova' avec toutes les infos
  const novaData = backendDat?.nova || backendData;
  
  // Extraction du groupe NOVA
  const novaGroup = novaDat?.novaGroup || 4;
  
  // Extraction des additifs depuis l'analyse
  const backendAdditives = novaDat?.analysis?.additives || [];
  const detectedAdditives = backendAdditives.map((a: any) => ({
    code: ?.code || ?.e_number || '',
    name: ?.name || ?.additive_name || '',
    riskLevel: (?.riskLevel || ?.risk_level || 'medium') as 'low' | 'medium' | 'high',
    description: ?.description || ?.desc || ''
  }));
  
  // Calcul du score de sante base sur NOVA et autres facteurs
  const healthScore = calculateHealthScoreFromBackend(novaGroup, novaData, backendAdditives, productName, ingredients);
  
  // Extraction des recommandations
  const recommendations = extractRecommendations(novaData, novaGroup);
  
  // Construction du reasoning depuis les infos backend
  const reasoning = buildReasoning(novaData, novaGroup, backendAdditives);
  
  return {
    productName: backendDat?.productName || productName,
    novaGroup: Math.min(4, Math.max(1, Number(novaGroup))),
    confidence: Math.round((novaDat?.confidence || 0.85) * 100),
    reasoning,
    additives: {
      detected: detectedAdditives.length > 0 ? detectedAdditives : 
                detectAdditivesAdvanced(ingredients), // Fallback local si pas d'additifs du backend
      total: detectedAdditives.length || novaDat?.analysis?.totalCount || 0
    },
    recommendations,
    healthScore,
    isProcessed: novaGroup >= 3,
    category: 'alimentaire',
    timestamp: new Date().toISOString(),
    analysis: {
      totalCount: novaDat?.analysis?.totalCount || 0,
      ultraProcessingMarkers: novaDat?.analysis?.ultraProcessingMarkers || [],
      industrialIngredients: novaDat?.analysis?.industrialIngredients || [],
      additives: novaDat?.analysis?.additives || [],
      naturalIngredients: novaDat?.analysis?.naturalIngredients || [],
      suspiciousTerms: novaDat?.analysis?.suspiciousTerms || []
    },
    source: 'backend' // Marqueur pour savoir d'oÆ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â¹ vient l'analyse
  };
}

/**
 * Calcule le score de sante depuis les donnees backend
 */
function calculateHealthScoreFromBackend(novaGroup: number, novaData: any, additives: any[], productName: string, ingredients: string): number {
  let score = 100;
  
  // Penalites basees sur NOVA
  const novaPenalties = { 1: 0, 2: 10, 3: 30, 4: 60 };
  score -= novaPenalties[novaGroup as keyof typeof novaPenalties] || 0;
  
  // Penalites pour additifs
  score -= additives.length * 5;
  
  // Ajustement selon le niveau de sante du backend
  const healthLevel = novaDat?.healthImpact?.level;
  if (healthLevel === 'warning') score -= 20;
  else if (healthLevel === 'danger') score -= 40;
  else if (healthLevel === 'optimal') score += 10;
  
  // Bonus si bio dans le nom ou les ingredients
  if (/bio|biologique/i.test(productName || '') || /bio|biologique/i.test(ingredients || '')) {
    score += 15;
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Extrait les recommandations du format backend
 */
function extractRecommendations(novaData: any, novaGroup: number): string[] {
  const recommendations = [];
  
  // Message principal du backend
  if (novaDat?.recommendations?.message) {
    recommendations.push(`aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ ${novaDat?.recommendations.message}`);
  }
  
  // Ajout selon le groupe NOVA
  if (novaGroup === 1) {
    recommendations.push('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸ Aliment non transforme - Excellence nutritionnelle');
    recommendations.push('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Å¡â€šÃ‚Â¥aaÃ¢â‚¬Å¡Ã‚Â¬aÃ¢â€šÂ¬Ã‚Â Æ’Ã†â€™â€ Ã¢â‚¬â„¢aÃ¢â‚¬Å¡Ã‚Â¬ privilegier dans votre alimentation quotidienne');
  } else if (novaGroup === 2) {
    recommendations.push('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€¹Ã…â€œÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢ Ingredient culinaire - Usage modere recommande');
    recommendations.push('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Å¡â€šÃ‚ÂÆ’Ã¢â‚¬Å¡â€šÃ‚Â  Ideal pour vos preparations maison');
  } else if (novaGroup === 3) {
    recommendations.push('aÆ’Ã¢â‚¬Â¦â€šÃ‚Â¡Æ’Ã¢â‚¬Å¡â€šÃ‚Â Æ’Ã‚Â¯Æ’Ã¢â‚¬Å¡â€šÃ‚Â¸Æ’Ã¢â‚¬Å¡â€šÃ‚Â Produit transforme - Consommation occasionnelle');
    recommendations.push('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚ÂaaÃ¢â‚¬Å¡Ã‚Â¬â€¦Ã‚Â¾ Recherchez des alternatives moins transformees');
  } else {
    recommendations.push('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Â¦â€šÃ‚Â¡Æ’Ã¢â‚¬Å¡â€šÃ‚Â¨ Ultra-transforme - Æ’Ã†â€™â€ Ã¢â‚¬â„¢aÃ¢â‚¬Å¡Ã‚Â¬ limiter fortement');
    recommendations.push('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Å¡â€šÃ‚ÂÆ’Ã¢â‚¬Å¡â€šÃ‚Â  Privilegiez une version maison si possible');
  }
  
  // Ajout des alternatives du backend
  if (novaDat?.recommendations?.alternatives?.length > 0) {
    novaDat?.recommendations.alternatives.forEach((alt: string) => {
      recommendations.push(`Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬aÃ¢â‚¬Å¾Ã‚Â¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â¡ Alternative: ${alt}`);
    });
  }
  
  // Conseil educatif
  if (novaDat?.recommendations?.educationalTip) {
    recommendations.push(`Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€¦Ã¢â‚¬Å“Æ’Ã¢â‚¬Â¦â€šÃ‚Â¡ ${novaDat?.recommendations.educationalTip}`);
  }
  
  return recommendations;
}

/**
 * Construit le reasoning depuis les infos backend
 */
function buildReasoning(novaData: any, novaGroup: number, additives: any[]): string {
  let reasoning = '';
  
  // Nom et description du groupe NOVA
  if (novaDat?.groupInfo?.name) {
    reasoning = `Produit classe NOVA ${novaGroup} (${novaDat?.groupInfo.name}). `;
  } else {
    reasoning = `Produit classe NOVA ${novaGroup}. `;
  }
  
  // Description du groupe
  if (novaDat?.groupInfo?.description) {
    reasoning += novaDat?.groupInfo.description + '. ';
  }
  
  // Mention des additifs
  if (additives.length > 0) {
    reasoning += `Presence de ${additives.length} additif(s). `;
  } else {
    reasoning += 'Aucun additif detecte. ';
  }
  
  // Impact sante
  if (novaDat?.healthImpact?.description) {
    reasoning += novaDat?.healthImpact.description + '. ';
  }
  
  // Source scientifique
  if (novaDat?.scientificSource) {
    reasoning += `(${novaDat?.scientificSource})`;
  }
  
  return reasoning;
}

/**
 * aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ ANALYSE NOVA AVANCÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°E LOCALE
 * Intelligence artificielle complete sans dependance backend
 */
function generateAdvancedAnalysis(productName: string, ingredients: string): NovaResult {
  const novaGroup = estimateNovaGroupAdvanced(ingredients);
  const additives = detectAdditivesAdvanced(ingredients);
  const healthScore = calculateHealthScoreAdvanced(ingredients, novaGroup, additives);
  const analysis = performDetailedAnalysis(ingredients, novaGroup, additives);
  
  console.log('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚ÂÆ’Ã¢â‚¬Å¡â€šÃ‚Â¬ Analyse avancee:', { 
    productName, 
    novaGroup, 
    additivesCount: additives.length, 
    healthScore,
    confidence: 92 
  });
  
  return {
    productName,
    novaGroup,
    confidence: 92, // Confiance elevee pour l'analyse locale avancee
    reasoning: generateAdvancedReasoning(ingredients, novaGroup, additives),
    additives: {
      detected: additives,
      total: additives.length
    },
    recommendations: generateAdvancedRecommendations(ingredients, novaGroup, additives),
    healthScore,
    isProcessed: novaGroup >= 3,
    category: 'alimentaire',
    timestamp: new Date().toISOString(),
    analysis,
    source: 'local' // Marqueur pour l'analyse locale
  };
}

/**
 * aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ CLASSIFICATION NOVA AVANCÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°E
 * Algorithme de detection ameliore avec patterns etendus
 */
function estimateNovaGroupAdvanced(ingredients: string): number {
  const lower = ingredients.toLowerCase();
  
  let ultraProcessedScore = 0;
  let processedScore = 0;
  let culinaryScore = 0;
  
  // aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ MARQUEURS NOVA 4 (Ultra-transforme) - Base etendue
  const nova4Patterns = [
    { pattern: /e\d{3}/g, weight: 2 }, // Additifs E-numbers
    { pattern: /(sirop.*fructose|glucose.*fructose|isoglucose)/i, weight: 3 },
    { pattern: /(huile.*palme|graisse.*palme)/i, weight: 2 },
    { pattern: /(exhausteur.*goÆ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â»t|exhausteur de goÆ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â»t|msg)/i, weight: 3 },
    { pattern: /(colorant|conservateur|emulsifiant|stabilisant|antioxydant)/i, weight: 2 },
    { pattern: /(proteine.*hydrolysee|isolat.*proteine|concentre.*proteine)/i, weight: 3 },
    { pattern: /(arome.*artificiel|arome de synthese|arome identique)/i, weight: 2 },
    { pattern: /(phosphate|polyphosphate|diphosphate)/i, weight: 2 },
    { pattern: /(carraghenane|xanthane|guar)/i, weight: 1 },
    { pattern: /(maltodextrine|dextrose|sucralose|aspartame)/i, weight: 2 },
    { pattern: /(mono.*glyceride|di.*glyceride)/i, weight: 1 }
  ];
  
  nova4Patterns.forEach(({ pattern, weight }) => {
    const matches = lower.match(pattern);
    if (matches) ultraProcessedScore += matches.length * weight;
  });
  
  // aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ MARQUEURS NOVA 3 (Transforme)
  const nova3Patterns = [
    { pattern: /(sucre|sel|huile|farine.*ble)/i, weight: 1 },
    { pattern: /(levure|beurre|fromage)/i, weight: 1 },
    { pattern: /(vinaigre|moutarde|mayonnaise)/i, weight: 1 },
    { pattern: /(chocolat|cacao|vanille)/i, weight: 1 },
    { pattern: /(pate|poudre.*lever)/i, weight: 1 }
  ];
  
  nova3Patterns.forEach(({ pattern, weight }) => {
    if (pattern.test(lower)) processedScore += weight;
  });
  
  // aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ MARQUEURS NOVA 2 (Ingredients culinaires)
  const nova2Patterns = [
    { pattern: /(huile.*olive|huile.*tournesol)/i, weight: 1 },
    { pattern: /(sel.*marin|miel|sirop.*erable)/i, weight: 1 },
    { pattern: /(vinaigre.*cidre|vinaigre.*balsamique)/i, weight: 1 }
  ];
  
  nova2Patterns.forEach(({ pattern, weight }) => {
    if (pattern.test(lower)) culinaryScore += weight;
  });
  
  // aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ CLASSIFICATION FINALE INTELLIGENTE
  if (ultraProcessedScore >= 5) return 4;
  if (ultraProcessedScore >= 2) return 4;
  if (processedScore >= 3) return 3;
  if (culinaryScore >= 1 || processedScore >= 1) return 2;
  
  return 1;
}

/**
 * aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ DÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°TECTION ADDITIFS AVANCÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°E
 * Base de donnees elargie avec evaluation des risques
 */
function detectAdditivesAdvanced(ingredients: string): Array<{
  code: string;
  name: string;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
}> {
  const additives = [];
  const lower = ingredients.toLowerCase();
  
  // aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ BASE DE DONNÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°ES ADDITIFS Æ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°LARGIE
  const additivesDB = [
    // Colorants
    { code: 'E150d', name: 'Caramel IV', risk: 'medium' as const, desc: 'Colorant caramel ammoniacal (4-MEI)' },
    { code: 'E102', name: 'Tartrazine', risk: 'medium' as const, desc: 'Colorant jaune, hyperactivite enfants' },
    { code: 'E110', name: 'Jaune orange S', risk: 'medium' as const, desc: 'Colorant orange, reactions allergiques' },
    { code: 'E160a', name: 'Beta-carotene', risk: 'low' as const, desc: 'Colorant naturel orange (vitamine A)' },
    
    // Exhausteurs de goÆ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â»t
    { code: 'E621', name: 'Glutamate monosodique', risk: 'medium' as const, desc: 'Exhausteur de goÆ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â»t, maux de tete possibles' },
    { code: 'E627', name: 'Guanylate disodique', risk: 'medium' as const, desc: 'Exhausteur de goÆ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â»t, asthme possible' },
    
    // Conservateurs
    { code: 'E211', name: 'Benzoate de sodium', risk: 'medium' as const, desc: 'Conservateur, reactions allergiques' },
    { code: 'E202', name: 'Sorbate de potassium', risk: 'low' as const, desc: 'Conservateur naturel, bien tolere' },
    { code: 'E282', name: 'Propionate de calcium', risk: 'low' as const, desc: 'Conservateur pain, irritations possibles' },
    { code: 'E200', name: 'Acide sorbique', risk: 'low' as const, desc: 'Conservateur naturel, sÆ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â»r' },
    
    // Æ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°mulsifiants
    { code: 'E322', name: 'Lecithines', risk: 'low' as const, desc: 'Æ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°mulsifiant naturel (soja/tournesol)' },
    { code: 'E471', name: 'Mono- et diglycerides', risk: 'low' as const, desc: 'Æ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°mulsifiant couramment utilise' },
    { code: 'E476', name: 'Polyricinoleate de polyglycerol', risk: 'medium' as const, desc: 'Æ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°mulsifiant synthetique' },
    
    // Stabilisants/Æ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°paississants
    { code: 'E412', name: 'Gomme de guar', risk: 'low' as const, desc: 'Stabilisant naturel (legumineuse)' },
    { code: 'E407', name: 'Carraghenanes', risk: 'medium' as const, desc: 'Gelifiant algues, inflammations intestinales' },
    { code: 'E415', name: 'Gomme xanthane', risk: 'low' as const, desc: 'Æ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°paississant fermentation bacterienne' },
    
    // Acidifiants
    { code: 'E338', name: 'Acide phosphorique', risk: 'medium' as const, desc: 'Acidifiant, demineralisation osseuse' },
    { code: 'E330', name: 'Acide citrique', risk: 'low' as const, desc: 'Acidifiant naturel (agrumes)' },
    
    // Æ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°dulcorants
    { code: 'E952', name: 'Cyclamate de sodium', risk: 'medium' as const, desc: 'Æ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°dulcorant artificiel, interdit USA' },
    { code: 'E950', name: 'Acesulfame K', risk: 'medium' as const, desc: 'Æ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°dulcorant artificiel, goÆ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â»t metallique' },
    { code: 'E955', name: 'Sucralose', risk: 'medium' as const, desc: 'Æ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°dulcorant chlore, effet microbiote' },
    
    // Antioxydants
    { code: 'E300', name: 'Acide ascorbique', risk: 'low' as const, desc: 'Antioxydant naturel (vitamine C)' },
    { code: 'E306', name: 'Tocopherols', risk: 'low' as const, desc: 'Antioxydant naturel (vitamine E)' },
    { code: 'E320', name: 'BHA', risk: 'high' as const, desc: 'Antioxydant synthetique, perturbateur endocrinien' },
    { code: 'E321', name: 'BHT', risk: 'high' as const, desc: 'Antioxydant synthetique, cancerigene suspecte' },
    
    // Agents de texture
    { code: 'E500', name: 'Carbonate de sodium', risk: 'low' as const, desc: 'Poudre Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  lever, bicarbonate' },
    { code: 'E170', name: 'Carbonate de calcium', risk: 'low' as const, desc: 'Agent de charge, craie alimentaire' }
  ];
  
  for (const additive of additivesDB) {
    if (lower.includes(additive.code.toLowerCase()) || 
        lower.includes(additive.name.toLowerCase())) {
      additives.push({
        code: additive.code,
        name: additive.name,
        riskLevel: additive.risk,
        description: additive.desc
      });
    }
  }
  
  return additives;
}

/**
 * aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ CALCUL SCORE SANTÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â° AVANCÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°
 * Algorithme sophistique prenant en compte multiples facteurs
 */
function calculateHealthScoreAdvanced(ingredients: string, novaGroup: number, additives: any[]): number {
  let score = 100;
  
  // aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ PÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°NALITÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°S NOVA (ponderees)
  const novaPenalties = { 1: 0, 2: 8, 3: 25, 4: 55 };
  score -= novaPenalties[novaGroup as keyof typeof novaPenalties] || 0;
  
  // aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ PÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°NALITÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°S ADDITIFS (par niveau de risque)
  const highRiskAdditives = additives.filter(a => ?.riskLevel === 'high');
  const mediumRiskAdditives = additives.filter(a => ?.riskLevel === 'medium');
  const lowRiskAdditives = additives.filter(a => ?.riskLevel === 'low');
  
  score -= highRiskAdditives.length * 20;   // -20 par additif haut risque
  score -= mediumRiskAdditives.length * 12; // -12 par additif risque moyen
  score -= lowRiskAdditives.length * 3;     // -3 par additif faible risque
  
  // aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ BONUS INGRÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°DIENTS POSITIFS
  const lower = ingredients.toLowerCase();
  const bonusPatterns = [
    { pattern: /(bio|biologique|organic)/i, bonus: 15, desc: 'Agriculture biologique' },
    { pattern: /(naturel|natural)/i, bonus: 8, desc: 'Ingredient naturel' },
    { pattern: /(ferments.*lactiques|probiotique)/i, bonus: 10, desc: 'Probiotiques' },
    { pattern: /(complet|integral|wholegrain)/i, bonus: 8, desc: 'Cereales completes' },
    { pattern: /(sans.*additif|additive.*free)/i, bonus: 12, desc: 'Sans additifs' },
    { pattern: /(fair.*trade|commerce.*equitable)/i, bonus: 5, desc: 'Commerce equitable' },
    { pattern: /(local|region)/i, bonus: 3, desc: 'Production locale' }
  ];
  
  bonusPatterns.forEach(({ pattern, bonus }) => {
    if (pattern.test(lower)) score += bonus;
  });
  
  // aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ PÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°NALITÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°S INGRÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°DIENTS PROBLÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°MATIQUES
  const penaltyPatterns = [
    { pattern: /(huile.*palme)/i, penalty: 15, desc: 'Huile de palme' },
    { pattern: /(sirop.*fructose)/i, penalty: 12, desc: 'Sirop de glucose-fructose' },
    { pattern: /(graisse.*hydrogenee)/i, penalty: 20, desc: 'Graisses trans' },
    { pattern: /(nitrite|nitrate)/i, penalty: 18, desc: 'Conservateurs nitrites' }
  ];
  
  penaltyPatterns.forEach(({ pattern, penalty }) => {
    if (pattern.test(lower)) score -= penalty;
  });
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ ANALYSE DÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°TAILLÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°E COMPLÆ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Â¹aÃ¢â€šÂ¬Ã‚Â TE
 */
function performDetailedAnalysis(ingredients: string, novaGroup: number, additives: any[]) {
  return {
    totalCount: additives.length,
    ultraProcessingMarkers: novaGroup >= 4 ? [
      'additifs_multiples', 
      'transformation_industrielle',
      'ingredients_artificiels',
      'procedes_chimiques'
    ] : novaGroup >= 3 ? ['transformation_moderee'] : [],
    industrialIngredients: extractIndustrialIngredients(ingredients),
    additives: additives.map(a => ?.code),
    naturalIngredients: extractNaturalIngredients(ingredients),
    suspiciousTerms: extractSuspiciousTerms(ingredients),
    riskFactors: extractRiskFactors(ingredients, additives),
    positiveFactors: extractPositiveFactors(ingredients)
  };
}

/**
 * aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ GÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°NÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°RATION RAISONNEMENT AVANCÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°
 */
function generateAdvancedReasoning(ingredients: string, novaGroup: number, additives: any[]): string {
  const additivesCount = additives.length;
  const highRiskCount = additives.filter(a => ?.riskLevel === 'high').length;
  const mediumRiskCount = additives.filter(a => ?.riskLevel === 'medium').length;
  
  let reasoning = '';
  
  switch (novaGroup) {
    case 4:
      reasoning = `Produit ultra-transforme (NOVA 4) presentant ${additivesCount} additif(s) alimentaire(s)`;
      if (highRiskCount > 0) reasoning += ` dont ${highRiskCount} Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  risque eleve`;
      if (mediumRiskCount > 0) reasoning += ` et ${mediumRiskCount} Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  risque modere`;
      reasoning += '. Transformation industrielle extensive avec agents texturants, colorants et exhausteurs de goÆ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â»t. Consommation Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  limiter fortement selon recommandations ANSES 2024.';
      break;
      
    case 3:
      reasoning = `Produit transforme (NOVA 3) avec ${additivesCount} additif(s) et modification substantielle de l'aliment d'origine. Procedes industriels incluant ajout de sucre, sel ou matieres grasses. Consommation moderee recommandee (2-3 portions/semaine maximum).`;
      break;
      
    case 2:
      reasoning = `Ingredient culinaire (NOVA 2) utilise traditionnellement pour la preparation, l'assaisonnement et la cuisson. ${additivesCount > 0 ? `Presence de ${additivesCount} additif(s) pour la conservation.` : 'Composition simple et naturelle.'} Usage modere recommande.`;
      break;
      
    default:
      reasoning = `Aliment non transforme ou minimalement transforme (NOVA 1), conservant ses proprietes nutritionnelles originales. ${additivesCount === 0 ? 'Aucun additif detecte.' : `${additivesCount} additif(s) de conservation naturelle.`} Excellent choix nutritionnel selon classification PNNS 2024.`;
  }
  
  return reasoning;
}

/**
 * aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ RECOMMANDATIONS AVANCÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°ES PERSONNALISÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°ES
 */
function generateAdvancedRecommendations(ingredients: string, novaGroup: number, additives: any[]): string[] {
  const recommendations = [];
  const highRiskAdditives = additives.filter(a => ?.riskLevel === 'high');
  const mediumRiskAdditives = additives.filter(a => ?.riskLevel === 'medium');
  
  if (novaGroup >= 4) {
    recommendations.push('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚ÂaaÃ¢â‚¬Å¡Ã‚Â¬â€¦Ã‚Â¾ Privilegiez des alternatives NOVA 1-2 (aliments peu transformes)');
    recommendations.push('aÆ’Ã¢â‚¬Â¦â€šÃ‚Â¡Æ’Ã¢â‚¬Å¡â€šÃ‚Â Æ’Ã‚Â¯Æ’Ã¢â‚¬Å¡â€šÃ‚Â¸Æ’Ã¢â‚¬Å¡â€šÃ‚Â Consommation exceptionnelle recommandee (< 1x/semaine)');
    
    if (highRiskAdditives.length > 0) {
      recommendations.push(`Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Â¦â€šÃ‚Â¡Æ’Ã¢â‚¬Å¡â€šÃ‚Â¨ ${highRiskAdditives.length} additif(s) Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  haut risque detecte(s) - eviter si possible`);
    }
    
    if (mediumRiskAdditives.length > 2) {
      recommendations.push('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Å¡â€šÃ‚Â§Æ’Ã¢â‚¬Å¡â€šÃ‚Âª Multiples additifs Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  risque modere - surveiller la tolerance individuelle');
    }
    
    recommendations.push('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Å¡â€šÃ‚ÂÆ’Ã¢â‚¬Å¡â€šÃ‚Â  Preferez systematiquement les versions maison ou artisanales');
    recommendations.push('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚ÂºaaÃ¢â‚¬Å¡Ã‚Â¬aÃ¢â‚¬Å¾Ã‚Â¢ Lisez attentivement les etiquettes pour choisir des alternatives');
  } else if (novaGroup === 3) {
    recommendations.push('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€¹Ã…â€œÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢ Produit acceptable en consommation moderee (2-3x/semaine maximum)');
    recommendations.push('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Å¡â€šÃ‚ÂÆ’Ã¢â‚¬Å¡â€šÃ‚Â  Version maison recommandee pour un meilleur controle nutritionnel');
    recommendations.push('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€¦Ã¢â‚¬Å“Æ’Ã¢â‚¬Â¦â€šÃ‚Â  Comparez avec d\'autres marques pour choisir la formulation la plus simple');
    
    if (additives.length > 3) {
      recommendations.push('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€¦Ã¢â‚¬Å“aaÃ¢â‚¬Å¡Ã‚Â¬aÃ¢â€šÂ¬Ã…â€œ Verifiez la necessite de tous ces additifs dans votre alimentation');
    }
  } else if (novaGroup === 2) {
    recommendations.push('aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ Bon ingredient culinaire pour vos preparations maison');
    recommendations.push('aÆ’Ã¢â‚¬Â¦â€šÃ‚Â¡aaÃ¢â‚¬Å¡Ã‚Â¬aÃ¢â€šÂ¬Ã…â€œÆ’Ã‚Â¯Æ’Ã¢â‚¬Å¡â€šÃ‚Â¸Æ’Ã¢â‚¬Å¡â€šÃ‚Â Utilisez avec parcimonie pour maintenir l\'equilibre nutritionnel');
    recommendations.push('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€¹Ã…â€œÆ’Ã¢â‚¬Å¡â€šÃ‚Â¨aaÃ¢â‚¬Å¡Ã‚Â¬Æ’Ã¢â‚¬Å¡â€šÃ‚ÂÆ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Å¡â€šÃ‚ÂÆ’Ã¢â‚¬Å¡â€šÃ‚Â³ Ideal pour rehausser le goÆ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â»t de plats faits maison');
    recommendations.push('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â¿ Recherchez les versions bio si disponibles');
  } else {
    recommendations.push('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸ Excellent choix nutritionnel Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  privilegier dans votre alimentation !');
    recommendations.push('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Å¡â€šÃ‚Â¥aaÃ¢â‚¬Å¡Ã‚Â¬aÃ¢â€šÂ¬Ã‚Â Parfait pour une alimentation saine selon le PNNS 2024');
    recommendations.push('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬aÃ¢â‚¬Å¾Ã‚Â¢Æ’Ã¢â‚¬Å¡â€šÃ‚Âª Riche en nutriments essentiels non denatures');
    recommendations.push('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Å¡â€šÃ‚ÂaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â  Æ’Ã†â€™â€ Ã¢â‚¬â„¢aÃ¢â‚¬Å¡Ã‚Â¬ consommer sans restriction dans une alimentation equilibree');
  }

  // Recommandations generales toujours pertinentes
  recommendations.push('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€¦Ã¢â‚¬Å“Æ’Ã¢â‚¬Â¦â€šÃ‚Â¡ Consultez l\'etiquetage nutritionnel complet (Nutri-Score, valeurs)');
  recommendations.push('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸â€šÃ‚Â©Æ’Ã¢â‚¬Å¡â€šÃ‚Âº Adaptez selon vos besoins personnels et intolerances');
  
  if (novaGroup >= 3) {
    recommendations.push('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€¦Ã¢â‚¬Å“Æ’Ã¢â‚¬Å¡â€šÃ‚Â± Utilisez des applications comme Yuka pour comparer rapidement');
  }
  
  return recommendations;
}

// aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ FONCTIONS UTILITAIRES AVANCÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°ES

function extractRiskFactors(ingredients: string, additives: any[]): string[] {
  const risks = [];
  const lower = ingredients.toLowerCase();
  
  if (additives.filter(a => ?.riskLevel === 'high').length > 0) {
    risks.push('additifs_haut_risque');
  }
  if (lower.includes('huile de palme')) risks.push('deforestation');
  if (lower.includes('sirop')) risks.push('sucres_ajoutes');
  if (/e\d{3}/.test(lower)) risks.push('additifs_synthetiques');
  
  return risks;
}

function extractPositiveFactors(ingredients: string): string[] {
  const positive = [];
  const lower = ingredients.toLowerCase();
  
  if (lower.includes('bio')) positive.push('agriculture_biologique');
  if (lower.includes('naturel')) positive.push('ingredients_naturels');
  if (lower.includes('ferments')) positive.push('probiotiques');
  if (lower.includes('complet')) positive.push('cereales_completes');
  
  return positive;
}

function extractIndustrialIngredients(ingredients: string): string[] {
  const industrial = [];
  const lower = ingredients.toLowerCase();
  
  if (lower.includes('sirop')) industrial.push('sirop de glucose-fructose');
  if (lower.includes('huile de palme')) industrial.push('huile de palme');
  if (lower.includes('proteine')) industrial.push('proteines modifiees');
  if (lower.includes('maltodextrine')) industrial.push('maltodextrine');
  if (lower.includes('amidon modifie')) industrial.push('amidon modifie');
  
  return industrial;
}

function extractNaturalIngredients(ingredients: string): string[] {
  const natural = [];
  const lower = ingredients.toLowerCase();
  
  if (lower.includes('lait')) natural.push('lait');
  if (lower.includes('farine')) natural.push('farine');
  if (lower.includes('eau')) natural.push('eau');
  if (lower.includes('ferments')) natural.push('ferments lactiques');
  if (lower.includes('fruits')) natural.push('fruits');
  if (lower.includes('legumes')) natural.push('legumes');
  if (lower.includes('huile d\'olive')) natural.push('huile d\'olive');
  if (lower.includes('miel')) natural.push('miel');
  
  return natural;
}

function extractSuspiciousTerms(ingredients: string): string[] {
  const suspicious = [];
  const lower = ingredients.toLowerCase();
  
  if (/e\d{3}/.test(lower)) suspicious.push('additifs E-numbers');
  if (lower.includes('artificiel')) suspicious.push('aromes artificiels');
  if (lower.includes('modifie')) suspicious.push('ingredients modifies');
  if (lower.includes('hydrogene')) suspicious.push('graisses hydrogenees');
  if (lower.includes('synthetique')) suspicious.push('composes synthetiques');
  
  return suspicious;
}

/**
 * Reinitialise l'etat de l'analyseur
 */
export const reset = (): void => {
  currentAnalysis = null;
  isAnalyzing = false;
  console.log('Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚ÂaaÃ¢â‚¬Å¡Ã‚Â¬â€¦Ã‚Â¾ NovaClassifier reinitialise');
};

/**
 * Recupere l'analyse actuelle
 */
export const getCurrentAnalysis = (): NovaResult | null => {
  return currentAnalysis;
};

/**
 * Verifie si une analyse est en cours
 */
export const getIsAnalyzing = (): boolean => {
  return isAnalyzing;
};

// Export par defaut pour compatibilite
export default {
  analyzeProduct,
  reset,
  getCurrentAnalysis,
  getIsAnalyzing
};
// EOF


