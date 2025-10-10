class IngredientParserService {
  extractIngredients(ocrText) {
    if (!ocrText) return { ingredients: [], confidence: 0 };
    
    let text = ocrText.toLowerCase();
    const patterns = [
      /ingrédients?\s*:\s*([^.]+)/i,
      /composition\s*:\s*([^.]+)/i,
      /ingredients?\s*:\s*([^.]+)/i
    ];
    
    let ingredientText = '';
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        ingredientText = match[1];
        break;
      }
    }
    
    if (!ingredientText) ingredientText = text;
    
    const ingredients = ingredientText
      .split(/[,;.\n]/)
      .map(i => i.trim())
      .filter(i => i.length > 2 && i.length < 100)
      .slice(0, 50);
    
    const confidence = this.calculateConfidence(ingredientText, ingredients);
    return { ingredients, confidence };
  }
  
  calculateConfidence(rawText, ingredients) {
    let score = 0.3;
    if (/ingrédients?|composition/i.test(rawText)) score += 0.2;
    score += Math.min(ingredients.length * 0.1, 0.3);
    if (rawText.match(/\d+%/g)) score += 0.2;
    return Math.min(score, 1);
  }
  
  detectCategory(ingredients) {
    const text = ingredients.join(' ').toLowerCase();
    const keywords = {
      food: ['sucre', 'sel', 'huile', 'lait', 'farine'],
      cosmetics: ['parfum', 'aqua', 'alcohol', 'glycerin'],
      detergents: ['tensioactif', 'savon', 'sodium']
    };
    
    const scores = { food: 0, cosmetics: 0, detergents: 0 };
    for (const [cat, words] of Object.entries(keywords)) {
      for (const word of words) {
        if (text.includes(word)) scores[cat]++;
      }
    }
    
    const max = Math.max(...Object.values(scores));
    return max === 0 ? 'food' : Object.keys(scores).find(k => scores[k] === max);
  }
}

module.exports = new IngredientParserService();
