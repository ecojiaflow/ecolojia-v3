// === ECOLOJIA V3 - CONTEXTUAL INTELLIGENCE LAYER (CIL) ===
// Service de sélection de cartes pédagogiques contextuelles

const fs = require('fs');
const path = require('path');

// Charger les cartes contextuelles
let cardsData;
try {
  const cardsPath = path.resolve(__dirname, '../data/cardsContext.json');
  const rawData = fs.readFileSync(cardsPath, 'utf8');
  cardsData = JSON.parse(rawData);
} catch (error) {
  console.error('❌ [CIL] Erreur chargement cardsContext.json:', error.message);
  cardsData = { cards: [] };
}

/**
 * Évaluer une condition (ex: "sugar > 15")
 * @param {string} condition - Condition à évaluer
 * @param {object} product - Produit à analyser
 * @returns {boolean}
 */
function evaluateCondition(condition, product) {
  try {
    // Parser la condition (format: "champ operateur valeur")
    const match = condition.match(/^([\w.]+)\s*(>=|<=|>|<|=|!=)\s*(.+)$/);
    if (!match) return false;
    
    const [, field, operator, value] = match;
    
    // Extraire valeur du produit (support nested keys)
    let productValue = product;
    const keys = field.split('.');
    for (const key of keys) {
      if (productValue && typeof productValue === 'object') {
        productValue = productValue[key];
      } else {
        return false;
      }
    }
    
    // Convertir valeurs
    const numValue = parseFloat(value);
    const isNumeric = !isNaN(numValue) && !isNaN(parseFloat(productValue));
    
    // Comparer
    if (isNumeric) {
      const prodNum = parseFloat(productValue);
      switch (operator) {
        case '>': return prodNum > numValue;
        case '>=': return prodNum >= numValue;
        case '<': return prodNum < numValue;
        case '<=': return prodNum <= numValue;
        case '=': return prodNum === numValue;
        case '!=': return prodNum !== numValue;
        default: return false;
      }
    } else {
      // Comparaison string
      const strValue = value.replace(/['"]/g, '');
      const prodStr = String(productValue);
      
      switch (operator) {
        case '=': return prodStr === strValue;
        case '!=': return prodStr !== strValue;
        default: return false;
      }
    }
  } catch (error) {
    console.error('❌ [CIL] Erreur évaluation condition:', condition, error.message);
    return false;
  }
}

/**
 * Sélectionner cartes pertinentes pour un produit
 * @param {object} product - Produit à analyser
 * @param {number} maxCards - Nombre max de cartes à retourner
 * @returns {array} - Cartes sélectionnées
 */
function selectRelevantCards(product, maxCards = 2) {
  if (!product || !cardsData.cards) {
    return [];
  }
  
  const relevantCards = [];
  
  for (const card of cardsData.cards) {
    // Vérifier catégorie
    const categoryMatch = !card.triggers.category || 
                         card.triggers.category.includes(product.categoryType);
    
    if (!categoryMatch) continue;
    
    // Vérifier conditions
    const conditionsMatch = card.triggers.conditions.every(condition => 
      evaluateCondition(condition, product)
    );
    
    if (conditionsMatch) {
      relevantCards.push({
        id: card.id,
        title: card.title,
        content: card.content,
        source: card.source,
        visual: card.visual
      });
    }
  }
  
  // Limiter nombre de cartes
  return relevantCards.slice(0, maxCards);
}

/**
 * Obtenir une carte spécifique par ID
 * @param {string} cardId - ID de la carte
 * @returns {object|null}
 */
function getCardById(cardId) {
  if (!cardsData.cards) return null;
  
  const card = cardsData.cards.find(c => c.id === cardId);
  return card || null;
}

/**
 * Obtenir toutes les cartes (pour admin/debug)
 * @returns {array}
 */
function getAllCards() {
  return cardsData.cards || [];
}

module.exports = {
  selectRelevantCards,
  getCardById,
  getAllCards
};
