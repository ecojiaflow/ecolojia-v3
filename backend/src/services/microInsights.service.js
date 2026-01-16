/**
 * microInsights.service.js
 * Service de generation des micro-insights "En bref" et "Equilibrer"
 * Version: 1.0.0
 * 
 * PRINCIPE ECOLOJIA:
 * - Ton calme et pedagogique
 * - Jamais alarmiste
 * - Base sur donnees (NOVA, Nutriscore, additifs)
 * - Actionnable et contextuel
 */

const { calculateNutritionContext, detectSugarType } = require('../knowledge/nutritionReferences');

/**
 * Niveaux de position produit
 */
const POSITION_LEVELS = {
  BASE: {
    id: 'base',
    label: 'Base quotidienne',
    emoji: '🥗',
    description: 'Peut faire partie des repas quotidiens'
  },
  OCCASIONAL: {
    id: 'occasional',
    label: 'Plaisir occasionnel',
    emoji: '🍫',
    description: 'A consommer de temps en temps'
  },
  LIMIT: {
    id: 'limit',
    label: 'A limiter',
    emoji: '⚠️',
    description: 'A reserver aux occasions rares'
  }
};

/**
 * Niveaux de frequence
 */
const FREQUENCY_LEVELS = {
  DAILY: { id: 'daily', label: 'Quotidien', order: 1 },
  WEEKLY: { id: 'weekly', label: 'Plusieurs fois/semaine', order: 2 },
  OCCASIONAL: { id: 'occasional', label: 'Occasionnel', order: 3 },
  RARE: { id: 'rare', label: 'Rare', order: 4 }
};

/**
 * Determine la position du produit (base/occasionnel/limiter)
 * @param {Object} product - Produit avec scores et donnees
 * @returns {Object} Position avec niveau et justification
 */
function determinePosition(product) {
  const nova = product?.nova_group || product?.foodData?.nova_group || null;
  const nutriscore = (product?.nutriscore_grade || product?.foodData?.nutriscore_grade || '').toLowerCase();
  const overallScore = product?.scores?.overall || product?.score || 50;
  const additifCount = countAdditifs(product);

  // Logique de determination
  let position = POSITION_LEVELS.OCCASIONAL;
  let reasons = [];

  // NOVA 1-2 + Nutriscore A-B + peu d'additifs = Base quotidienne
  if (nova && nova <= 2 && ['a', 'b'].includes(nutriscore) && additifCount <= 2) {
    position = POSITION_LEVELS.BASE;
    reasons.push('Peu transforme');
    if (nutriscore === 'a') reasons.push('Excellent profil nutritionnel');
    if (nutriscore === 'b') reasons.push('Bon profil nutritionnel');
  }
  // NOVA 4 ou Nutriscore D-E ou beaucoup d'additifs = A limiter
  else if (nova === 4 || ['d', 'e'].includes(nutriscore) || additifCount >= 5) {
    position = POSITION_LEVELS.LIMIT;
    if (nova === 4) reasons.push('Ultra-transforme');
    if (nutriscore === 'e') reasons.push('Profil nutritionnel defavorable');
    if (additifCount >= 5) reasons.push('Nombreux additifs');
  }
  // Cas intermediaires = Plaisir occasionnel
  else {
    position = POSITION_LEVELS.OCCASIONAL;
    if (nova === 3) reasons.push('Transformation moderee');
    if (nutriscore === 'c') reasons.push('Profil nutritionnel moyen');
  }

  return {
    level: position,
    reasons: reasons,
    nova: nova,
    nutriscore: nutriscore,
    additifCount: additifCount
  };
}

/**
 * Compte les additifs dans un produit
 */
function countAdditifs(product) {
  const additifs = product?.additives_extracted || product?.additives_tags || product?.foodData?.additives || [];
  return Array.isArray(additifs) ? additifs.length : 0;
}

/**
 * Determine la frequence adaptee
 * @param {Object} position - Position du produit
 * @returns {Object} Frequence recommandee
 */
function determineFrequency(position) {
  switch (position.level.id) {
    case 'base':
      return FREQUENCY_LEVELS.DAILY;
    case 'occasional':
      return FREQUENCY_LEVELS.OCCASIONAL;
    case 'limit':
      return FREQUENCY_LEVELS.RARE;
    default:
      return FREQUENCY_LEVELS.OCCASIONAL;
  }
}

/**
 * Genere le bloc "En bref"
 * @param {Object} product - Produit complet
 * @param {Object} nutritionContext - Contexte nutritionnel
 * @returns {Object} Bloc "En bref"
 */
function generateEnBref(product, nutritionContext) {
  const position = determinePosition(product);
  const name = product?.product_name || product?.name || 'Ce produit';
  
  // Generation du message principal
  let message = '';
  const sugarType = detectSugarType(product);
  const sugarsRef = nutritionContext?.references?.sugars;
  const saltRef = nutritionContext?.references?.salt;
  const fiberRef = nutritionContext?.references?.fiber;

  // Cas produit bien note
  if (position.level.id === 'base') {
    if (fiberRef && fiberRef.level === 'high') {
      message = 'Peu transforme et riche en fibres : excellent choix pour la base des repas et des collations.';
    } else {
      message = 'Peu transforme et equilibre : peut faire partie des repas quotidiens sans hesitation.';
    }
  }
  // Cas produit a limiter
  else if (position.level.id === 'limit') {
    if (sugarsRef && sugarsRef.level === 'high' && sugarType !== 'natural') {
      message = 'Riche en sucres ajoutes : une portion represente une part importante du repere OMS ideal (sucres libres). Mieux en occasionnel, et rarement seul.';
    } else if (saltRef && saltRef.level === 'high') {
      message = 'Teneur en sel elevee : a consommer occasionnellement et a equilibrer avec des aliments peu sales.';
    } else if (position.nova === 4) {
      message = 'Produit ultra-transforme : a reserver aux occasions, en complement d\'une alimentation variee.';
    } else {
      message = 'Profil nutritionnel a surveiller : mieux en occasionnel qu\'en quotidien.';
    }
  }
  // Cas intermediaire
  else {
    if (sugarsRef && sugarsRef.level === 'high' && sugarType !== 'natural') {
      message = 'Contient des sucres ajoutes : a apprecier de temps en temps, idealement accompagne de fibres ou proteines.';
    } else if (position.nova === 3) {
      message = 'Transformation moderee : convenable en usage regulier, sans en faire la base de l\'alimentation.';
    } else {
      message = 'Produit intermediaire : peut s\'integrer dans une alimentation variee avec moderation.';
    }
  }

  return {
    version: '1.0.0',
    message: message,
    position: {
      level: position.level.id,
      label: position.level.label,
      emoji: position.level.emoji,
      description: position.level.description
    },
    reasons: position.reasons,
    data: {
      nova: position.nova,
      nutriscore: position.nutriscore,
      additifCount: position.additifCount
    }
  };
}

/**
 * Genere le bloc "Equilibrer" (si applicable)
 * @param {Object} product - Produit complet
 * @param {Object} nutritionContext - Contexte nutritionnel
 * @returns {Object|null} Bloc "Equilibrer" ou null si non applicable
 */
function generateEquilibrer(product, nutritionContext) {
  const position = determinePosition(product);
  
  // Pas de bloc Equilibrer pour les produits "base quotidienne"
  if (position.level.id === 'base') {
    return null;
  }

  const sugarsRef = nutritionContext?.references?.sugars;
  const saltRef = nutritionContext?.references?.salt;
  const fiberRef = nutritionContext?.references?.fiber;
  const saturatedFatRef = nutritionContext?.references?.saturatedFat;
  const sugarType = detectSugarType(product);

  // Ce que le produit apporte (exces)
  const apporte = [];
  if (sugarsRef && sugarsRef.level === 'high' && sugarType !== 'natural') {
    apporte.push({
      nutrient: 'sugars',
      label: 'Sucres rapides',
      emoji: '🍬',
      level: 'high',
      levelLabel: 'eleve'
    });
  }
  if (saturatedFatRef && saturatedFatRef.level === 'high') {
    apporte.push({
      nutrient: 'saturatedFat',
      label: 'Graisses saturees',
      emoji: '🧈',
      level: saturatedFatRef.level,
      levelLabel: saturatedFatRef.level === 'high' ? 'eleve' : 'modere'
    });
  }
  if (saltRef && saltRef.level === 'high') {
    apporte.push({
      nutrient: 'salt',
      label: 'Sel',
      emoji: '🧂',
      level: 'high',
      levelLabel: 'eleve'
    });
  }

  // Ce qu'il faut ajouter pour equilibrer
  const ajouter = [];
  if (sugarsRef && sugarsRef.level === 'high' && sugarType !== 'natural') {
    ajouter.push({
      nutrient: 'fiber',
      label: 'Fibres',
      emoji: '🥦',
      reason: 'Ralentit absorption des sucres'
    });
    ajouter.push({
      nutrient: 'proteins',
      label: 'Proteines',
      emoji: '🥚',
      reason: 'Stabilise la glycemie'
    });
  }
  if (saltRef && saltRef.level === 'high') {
    ajouter.push({
      nutrient: 'potassium',
      label: 'Potassium',
      emoji: '🍌',
      reason: 'Equilibre le sodium'
    });
  }

  // Suggestions d'associations
  const associations = generateAssociations(product, apporte);

  // A eviter
  const eviter = generateEviter(product, apporte);

  // Frequence
  const frequency = determineFrequency(position);

  // Si rien a equilibrer, pas de bloc
  if (apporte.length === 0 && ajouter.length === 0) {
    return null;
  }

  return {
    version: '1.0.0',
    apporte: apporte,
    ajouter: ajouter,
    associations: associations,
    eviter: eviter,
    frequency: {
      level: frequency.id,
      label: frequency.label,
      order: frequency.order,
      adapted: true
    },
    disclaimer: 'L\'ensemble du repas compte plus qu\'un aliment isole.'
  };
}

/**
 * Genere les suggestions d'associations
 */
function generateAssociations(product, apporte) {
  const associations = [];
  
  const hasHighSugars = apporte.some(a => a.nutrient === 'sugars');
  const hasHighFat = apporte.some(a => a.nutrient === 'saturatedFat');
  const hasHighSalt = apporte.some(a => a.nutrient === 'salt');

  if (hasHighSugars) {
    associations.push('Un fruit entier (fibres + vitamines)');
    associations.push('Un yaourt nature, skyr ou fromage blanc');
    associations.push('Pain complet ou flocons d\'avoine');
  }
  
  if (hasHighFat) {
    associations.push('Legumes verts (fibres)');
    associations.push('Cereales completes');
  }
  
  if (hasHighSalt) {
    associations.push('Legumes frais (potassium)');
    associations.push('Fruits (banane, avocat)');
  }

  // Limiter a 3 suggestions max
  return associations.slice(0, 3);
}

/**
 * Genere les choses a eviter
 */
function generateEviter(product, apporte) {
  const eviter = [];
  
  const hasHighSugars = apporte.some(a => a.nutrient === 'sugars');
  const hasHighSalt = apporte.some(a => a.nutrient === 'salt');

  if (hasHighSugars) {
    eviter.push('Cumuler plusieurs sources sucrees au meme moment');
  }
  
  if (hasHighSalt) {
    eviter.push('Associer a d\'autres produits sales (charcuterie, fromage)');
  }

  return eviter;
}

/**
 * Genere les micro-insights complets pour un produit
 * @param {Object} product - Produit complet
 * @returns {Object} Micro-insights (enBref + equilibrer)
 */
function generateMicroInsights(product) {
  // Calculer le contexte nutritionnel
  const nutritionContext = calculateNutritionContext(product);
  
  // Generer les blocs
  const enBref = generateEnBref(product, nutritionContext);
  const equilibrer = generateEquilibrer(product, nutritionContext);

  return {
    version: '1.0.0',
    enBref: enBref,
    equilibrer: equilibrer,
    nutritionContext: nutritionContext,
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  generateMicroInsights,
  generateEnBref,
  generateEquilibrer,
  determinePosition,
  determineFrequency,
  POSITION_LEVELS,
  FREQUENCY_LEVELS
};
