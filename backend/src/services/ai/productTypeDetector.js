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
      // Cosmétiques
      'savon', 'shampoing', 'gel douche', 'crème', 'dentifrice',
      'déodorant', 'parfum', 'maquillage', 'mascara', 'rouge à lèvres',
      'vernis', 'lotion', 'sérum', 'masque', 'gommage',
      'après-rasage', 'baume', 'huile corps', 'lait corps',
      'soin visage', 'soin cheveux', 'coloration', 'démaquillant',
      'eau micellaire', 'tonique', 'bb cream', 'fond de teint',
      'poudre', 'blush', 'highlighter', 'contour', 'correcteur',
      'eye liner', 'crayon', 'gloss', 'bain douche', 'savon main',
      'gel hydroalcoolique', 'dissolvant', 'durcisseur',
      'base coat', 'top coat',
      
      // Détergents
      'lessive', 'détergent', 'nettoyant', 'liquide vaisselle',
      'assouplissant', 'javel', 'désinfectant', 'détachant',
      'nettoyant sol', 'nettoyant vitre', 'déboucheur', 'anti-calcaire',
      'produit ménager', 'savon noir', 'cristaux soude',
      'vinaigre blanc', 'bicarbonate', 'ammoniaque', 'acide citrique',
      'cire', 'polish', 'dégraissant', 'décapant', 'dépoussiérant',
      'lave-vitre', 'multi-surfaces', 'wc', 'toilettes',
      'salle de bain', 'cuisine', 'four', 'plaque', 'inox',
      'carrelage', 'parquet', 'moquette', 'tapis',
      'adoucissant', 'anticalcaire', 'tablette lave-vaisselle',
      'sel lave-vaisselle', 'liquide rinçage',
      
      // Alimentaire
      'biscuit', 'céréales', 'jus', 'yaourt', 'pain', 'pâtes',
      'riz', 'huile', 'beurre', 'fromage', 'viande', 'poisson',
      'légumes', 'fruits', 'chocolat', 'confiture', 'miel',
      'café', 'thé', 'soda', 'eau', 'vin', 'bière', 'lait',
      'crème fraîche', 'œuf', 'farine', 'sucre', 'sel',
      'poivre', 'épices', 'herbes', 'sauce', 'mayonnaise',
      'ketchup', 'moutarde', 'vinaigrette', 'soupe', 'potage',
      'plat préparé', 'pizza', 'sandwich', 'salade', 'dessert',
      'glace', 'sorbet', 'compote', 'purée', 'chips',
      'apéritif', 'gâteau', 'tarte', 'viennoiserie', 'bonbon',
      'chewing-gum', 'barres', 'müesli', 'granola', 'smoothie',
      'boisson', 'sirop', 'alcool', 'spiritueux', 'champagne',
      'conserve', 'bocal', 'surgelé', 'frais', 'bio',
      'végétal', 'vegan', 'sans gluten', 'allégé', 'light'
    ];
  }

  buildPatterns() {
    this.patterns = [
      {
        label: 'cosmetics',
        keywords: [
          'savon', 'shampoing', 'gel douche', 'crème', 'dentifrice',
          'déodorant', 'parfum', 'maquillage', 'mascara', 'rouge à lèvres',
          'vernis', 'lotion', 'sérum', 'masque', 'gommage', 'gel',
          'mousse', 'spray', 'après-rasage', 'baume', 'huile corps',
          'lait corps', 'soin visage', 'soin cheveux', 'coloration',
          'démaquillant', 'eau micellaire', 'tonique', 'bb cream',
          'fond de teint', 'poudre', 'blush', 'highlighter',
          'contour', 'correcteur', 'eye liner', 'crayon',
          'gloss', 'bain douche', 'savon main', 'gel hydroalcoolique',
          'dissolvant', 'durcisseur', 'base coat', 'top coat'
        ]
      },
      {
        label: 'detergents',
        keywords: [
          'lessive', 'détergent', 'nettoyant', 'liquide vaisselle',
          'assouplissant', 'javel', 'désinfectant', 'détachant',
          'nettoyant sol', 'nettoyant vitre', 'déboucheur', 'anti-calcaire',
          'produit ménager', 'savon noir', 'cristaux soude',
          'vinaigre blanc', 'bicarbonate', 'ammoniaque', 'acide citrique',
          'cire', 'polish', 'dégraissant', 'décapant', 'dépoussiérant',
          'lave-vitre', 'multi-surfaces', 'wc', 'toilettes',
          'salle de bain', 'cuisine', 'four', 'plaque', 'inox',
          'carrelage', 'parquet', 'moquette', 'tapis',
          'adoucissant', 'anticalcaire', 'tablette lave-vaisselle',
          'sel lave-vaisselle', 'liquide rinçage'
        ]
      },
      {
        label: 'food',
        keywords: [
          'biscuit', 'céréales', 'jus', 'yaourt', 'pain', 'pâtes',
          'riz', 'huile', 'beurre', 'fromage', 'viande', 'poisson',
          'légumes', 'fruits', 'chocolat', 'confiture', 'miel',
          'café', 'thé', 'soda', 'eau', 'vin', 'bière', 'lait',
          'crème fraîche', 'œuf', 'farine', 'sucre', 'sel',
          'poivre', 'épices', 'herbes', 'sauce', 'mayonnaise',
          'ketchup', 'moutarde', 'vinaigrette', 'soupe', 'potage',
          'plat préparé', 'pizza', 'sandwich', 'salade', 'dessert',
          'glace', 'sorbet', 'compote', 'purée', 'chips',
          'apéritif', 'gâteau', 'tarte', 'viennoiserie', 'bonbon',
          'chewing-gum', 'barres', 'müesli', 'granola', 'smoothie',
          'boisson', 'sirop', 'alcool', 'spiritueux', 'champagne',
          'conserve', 'bocal', 'surgelé', 'frais', 'bio',
          'végétal', 'vegan', 'sans gluten', 'allégé', 'light'
        ]
      }
    ];
  }

  detect(input) {
    const lowerInput = input.toLowerCase();
    const matches = [];

    // Recherche des mots-clés dans chaque pattern
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

    // Si aucune correspondance trouvée
    if (matches.length === 0) {
      // Tentative de détection par mots génériques
      if (lowerInput.match(/\b(manger|alimentaire|nutrition|comestible|nourriture|aliment)\b/i)) {
        return { label: 'food', score: 0.3, confidence: 0.3 };
      }
      if (lowerInput.match(/\b(beauté|soin|hygiène|toilette|cosmétique|maquillage)\b/i)) {
        return { label: 'cosmetics', score: 0.3, confidence: 0.3 };
      }
      if (lowerInput.match(/\b(nettoyer|ménage|entretien|maison|nettoyage|laver)\b/i)) {
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

  // Méthode pour obtenir des suggestions basées sur une catégorie
  getSuggestions(category) {
    const pattern = this.patterns.find(p => p.label === category);
    if (!pattern) return [];
    
    // Retourner un échantillon aléatoire de 5 mots-clés
    const shuffled = [...pattern.keywords].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
  }

  // Méthode pour vérifier si un produit appartient à une catégorie
  belongsToCategory(productName, category) {
    const pattern = this.patterns.find(p => p.label === category);
    if (!pattern) return false;
    
    const lowerName = productName.toLowerCase();
    return pattern.keywords.some(keyword => lowerName.includes(keyword));
  }

  // Méthode pour obtenir la catégorie avec le plus de confiance
  detectWithConfidence(input) {
    const result = this.detect(input);
    
    // Ajouter des métadonnées supplémentaires
    return {
      ...result,
      isHighConfidence: result.score > 0.7,
      needsUserConfirmation: result.score < 0.5,
      suggestedCategories: this.getAllLabels().filter(l => l !== result.label)
    };
  }

  // Méthode pour détecter plusieurs catégories possibles
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

  // Méthode pour analyser un code-barres et deviner la catégorie
  detectFromBarcode(barcode) {
    // Certains préfixes de codes-barres peuvent indiquer le type
    // Cette méthode est basique et peut être améliorée
    const prefix = barcode.substring(0, 3);
    
    // Préfixes courants (à titre d'exemple)
    if (['300', '301', '302', '303', '304'].includes(prefix)) {
      return { label: 'food', score: 0.6, confidence: 0.6, source: 'barcode_prefix' };
    }
    
    // Par défaut, on ne peut pas déterminer depuis le code-barres seul
    return { label: 'unknown', score: 0, confidence: 0, source: 'barcode' };
  }
}

// Export en CommonJS
module.exports = ProductTypeDetector;