// backend/src/services/ai/productTypeDetector.js

class ProductTypeDetector {
  constructor() {
    this.keywords = [];
    this.patterns = [];
    this.buildKeywords();
    this.buildPatterns();
  }

  buildKeywords() {
    this.keywords = [
      // Cosmetiques
      'savon', 'shampoing', 'gel douche', 'creme', 'dentifrice',
      'deodorant', 'parfum', 'maquillage', 'mascara', 'rouge Â  levres',
      'vernis', 'lotion', 'serum', 'masque', 'gommage',
      'apres-rasage', 'baume', 'huile corps', 'lait corps',
      'soin visage', 'soin cheveux', 'coloration', 'demaquillant',
      'eau micellaire', 'tonique', 'bb cream', 'fond de teint',
      'poudre', 'blush', 'highlighter', 'contour', 'correcteur',
      'eye liner', 'crayon', 'gloss', 'bain douche', 'savon main',
      'gel hydroalcoolique', 'dissolvant', 'durcisseur',
      'base coat', 'top coat',
      
      // Detergents
      'lessive', 'detergent', 'nettoyant', 'liquide vaisselle',
      'assouplissant', 'javel', 'desinfectant', 'detachant',
      'nettoyant sol', 'nettoyant vitre', 'deboucheur', 'anti-calcaire',
      'produit menager', 'savon noir', 'cristaux soude',
      'vinaigre blanc', 'bicarbonate', 'ammoniaque', 'acide citrique',
      'cire', 'polish', 'degraissant', 'decapant', 'depoussierant',
      'lave-vitre', 'multi-surfaces', 'wc', 'toilettes',
      'salle de bain', 'cuisine', 'four', 'plaque', 'inox',
      'carrelage', 'parquet', 'moquette', 'tapis',
      'adoucissant', 'anticalcaire', 'tablette lave-vaisselle',
      'sel lave-vaisselle', 'liquide rincage',
      
      // Alimentaire
      'biscuit', 'cereales', 'jus', 'yaourt', 'pain', 'pates',
      'riz', 'huile', 'beurre', 'fromage', 'viande', 'poisson',
      'legumes', 'fruits', 'chocolat', 'confiture', 'miel',
      'cafe', 'the', 'soda', 'eau', 'vin', 'biere', 'lait',
      'creme fraiche', 'Ã…â€œuf', 'farine', 'sucre', 'sel',
      'poivre', 'epices', 'herbes', 'sauce', 'mayonnaise',
      'ketchup', 'moutarde', 'vinaigrette', 'soupe', 'potage',
      'plat prepare', 'pizza', 'sandwich', 'salade', 'dessert',
      'glace', 'sorbet', 'compote', 'puree', 'chips',
      'aperitif', 'gateau', 'tarte', 'viennoiserie', 'bonbon',
      'chewing-gum', 'barres', 'muesli', 'granola', 'smoothie',
      'boisson', 'sirop', 'alcool', 'spiritueux', 'champagne',
      'conserve', 'bocal', 'surgele', 'frais', 'bio',
      'vegetal', 'vegan', 'sans gluten', 'allege', 'light'
    ];
  }

  buildPatterns() {
    this.patterns = [
      {
        label: 'cosmetics',
        keywords: [
          'savon', 'shampoing', 'gel douche', 'creme', 'dentifrice',
          'deodorant', 'parfum', 'maquillage', 'mascara', 'rouge Â  levres',
          'vernis', 'lotion', 'serum', 'masque', 'gommage', 'gel',
          'mousse', 'spray', 'apres-rasage', 'baume', 'huile corps',
          'lait corps', 'soin visage', 'soin cheveux', 'coloration',
          'demaquillant', 'eau micellaire', 'tonique', 'bb cream',
          'fond de teint', 'poudre', 'blush', 'highlighter',
          'contour', 'correcteur', 'eye liner', 'crayon',
          'gloss', 'bain douche', 'savon main', 'gel hydroalcoolique',
          'dissolvant', 'durcisseur', 'base coat', 'top coat'
        ]
      },
      {
        label: 'detergents',
        keywords: [
          'lessive', 'detergent', 'nettoyant', 'liquide vaisselle',
          'assouplissant', 'javel', 'desinfectant', 'detachant',
          'nettoyant sol', 'nettoyant vitre', 'deboucheur', 'anti-calcaire',
          'produit menager', 'savon noir', 'cristaux soude',
          'vinaigre blanc', 'bicarbonate', 'ammoniaque', 'acide citrique',
          'cire', 'polish', 'degraissant', 'decapant', 'depoussierant',
          'lave-vitre', 'multi-surfaces', 'wc', 'toilettes',
          'salle de bain', 'cuisine', 'four', 'plaque', 'inox',
          'carrelage', 'parquet', 'moquette', 'tapis',
          'adoucissant', 'anticalcaire', 'tablette lave-vaisselle',
          'sel lave-vaisselle', 'liquide rincage'
        ]
      },
      {
        label: 'food',
        keywords: [
          'biscuit', 'cereales', 'jus', 'yaourt', 'pain', 'pates',
          'riz', 'huile', 'beurre', 'fromage', 'viande', 'poisson',
          'legumes', 'fruits', 'chocolat', 'confiture', 'miel',
          'cafe', 'the', 'soda', 'eau', 'vin', 'biere', 'lait',
          'creme fraiche', 'Ã…â€œuf', 'farine', 'sucre', 'sel',
          'poivre', 'epices', 'herbes', 'sauce', 'mayonnaise',
          'ketchup', 'moutarde', 'vinaigrette', 'soupe', 'potage',
          'plat prepare', 'pizza', 'sandwich', 'salade', 'dessert',
          'glace', 'sorbet', 'compote', 'puree', 'chips',
          'aperitif', 'gateau', 'tarte', 'viennoiserie', 'bonbon',
          'chewing-gum', 'barres', 'muesli', 'granola', 'smoothie',
          'boisson', 'sirop', 'alcool', 'spiritueux', 'champagne',
          'conserve', 'bocal', 'surgele', 'frais', 'bio',
          'vegetal', 'vegan', 'sans gluten', 'allege', 'light'
        ]
      }
    ];
  }

  detect(input) {
    const lowerInput = input.toLowerCase();
    const matches = [];

    // Recherche des mots-cles dans chaque pattern
    for (const pattern of this.patterns) {
      let score = 0;
      const matchedKeywords = [];
      
      for (const keyword of pattern.keywords) {
        if (lowerInput.includes(keyword)) {
          score++;
          matchedKeywords.push(keyword);
        }
      }
      
      if (score > 0) {
        matches.push({
          label: pattern.label,
          score: score,
          matchedKeywords: matchedKeywords
        });
      }
    }

    // Si aucune correspondance trouvee
    if (matches.length === 0) {
      // Tentative de detection par mots generiques
      if (lowerInput.match(/\b(manger|alimentaire|nutrition|comestible|nourriture|aliment)\b/i)) {
        return { label: 'food', score: 0.3, confidence: 0.3 };
      }
      if (lowerInput.match(/\b(beaute|soin|hygiene|toilette|cosmetique|maquillage)\b/i)) {
        return { label: 'cosmetics', score: 0.3, confidence: 0.3 };
      }
      if (lowerInput.match(/\b(nettoyer|menage|entretien|maison|nettoyage|laver)\b/i)) {
        return { label: 'detergents', score: 0.3, confidence: 0.3 };
      }
      
      return { label: 'unknown', score: 0, confidence: 0 };
    }

    // Retourner le meilleur match
    matches.sort((a, b) => b.score - a.score);
    const bestMatch = matches[0];
    
    // Normaliser le score (max 1.0)
    const normalizedScore = Math.min(bestMatch.score / 5, 1);
    
    return {
      label: bestMatch.label,
      score: normalizedScore,
      confidence: normalizedScore,
      matchedKeywords: bestMatch.matchedKeywords
    };
  }

  getAllLabels() {
    return this.patterns.map(p => p.label);
  }

  getKeywords() {
    return this.keywords;
  }

  // Methode pour obtenir des suggestions basees sur une categorie
  getSuggestions(category) {
    const pattern = this.patterns.find(p => p.label === category);
    if (!pattern) return [];
    
    // Retourner un echantillon aleatoire de 5 mots-cles
    const shuffled = [...pattern.keywords].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
  }

  // Methode pour verifier si un produit appartient Â  une categorie
  belongsToCategory(productName, category) {
    const pattern = this.patterns.find(p => p.label === category);
    if (!pattern) return false;
    
    const lowerName = productName.toLowerCase();
    return pattern.keywords.some(keyword => lowerName.includes(keyword));
  }

  // Methode pour obtenir la categorie avec le plus de confiance
  detectWithConfidence(input) {
    const result = this.detect(input);
    
    // Ajouter des metadonnees supplementaires
    return {
      ...result,
      isHighConfidence: result.score > 0.7,
      needsUserConfirmation: result.score < 0.5,
      suggestedCategories: this.getAllLabels().filter(l => l !== result.label)
    };
  }

  // Methode pour detecter plusieurs categories possibles
  detectMultiple(input) {
    const lowerInput = input.toLowerCase();
    const results = [];

    for (const pattern of this.patterns) {
      let score = 0;
      const matchedKeywords = [];
      
      for (const keyword of pattern.keywords) {
        if (lowerInput.includes(keyword)) {
          score++;
          matchedKeywords.push(keyword);
        }
      }
      
      if (score > 0) {
        results.push({
          label: pattern.label,
          score: Math.min(score / 5, 1),
          matchedKeywords: matchedKeywords
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  // Methode pour analyser un code-barres et deviner la categorie
  detectFromBarcode(barcode) {
    // Certains prefixes de codes-barres peuvent indiquer le type
    // Cette methode est basique et peut etre amelioree
    const prefix = barcode.substring(0, 3);
    
    // Prefixes courants (Â  titre d'exemple)
    if (['300', '301', '302', '303', '304'].includes(prefix)) {
      return { label: 'food', score: 0.6, confidence: 0.6, source: 'barcode_prefix' };
    }
    
    // Par defaut, on ne peut pas determiner depuis le code-barres seul
    return { label: 'unknown', score: 0, confidence: 0, source: 'barcode' };
  }
}

// Export en CommonJS
module.exports = ProductTypeDetector;
