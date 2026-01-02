/**
 * CATEGORY DETECTION SERVICE V1.0
 * Détection catégorie produit (médicament/complément/classique)
 * Constitution Ecolojia - Disclaimers obligatoires
 */

class CategoryDetectionService {
  /**
   * Détecte la catégorie d'un produit à partir du texte OCR
   * @param {string} ocrText - Texte extrait de la photo
   * @param {Object} productData - Données produit (optionnel)
   * @returns {DetectionResult}
   */
  static detectCategory(ocrText, productData = {}) {
    const text = (ocrText || '').toLowerCase();
    const name = (productData.name || '').toLowerCase();
    const combined = `${text} ${name}`;
    
    // 1. Détection médicament (prioritaire)
    const medicineResult = this._detectMedicine(combined);
    if (medicineResult.isMedicine) {
      return {
        category: 'medicine',
        confidence: medicineResult.confidence,
        disclaimer: this._getMedicineDisclaimer(),
        allowScoring: false,
        detectedKeywords: medicineResult.keywords
      };
    }
    
    // 2. Détection complément alimentaire
    const supplementResult = this._detectSupplement(combined);
    if (supplementResult.isSupplement) {
      return {
        category: 'supplement',
        confidence: supplementResult.confidence,
        disclaimer: this._getSupplementDisclaimer(),
        allowScoring: true,
        limitedAnalysis: true,
        detectedKeywords: supplementResult.keywords
      };
    }
    
    // 3. Détection cosmétique
    const cosmeticResult = this._detectCosmetic(combined);
    if (cosmeticResult.isCosmetic) {
      return {
        category: 'cosmetic',
        confidence: cosmeticResult.confidence,
        disclaimer: null,
        allowScoring: true,
        detectedKeywords: cosmeticResult.keywords
      };
    }
    
    // 4. Détection détergent
    const detergentResult = this._detectDetergent(combined);
    if (detergentResult.isDetergent) {
      return {
        category: 'detergent',
        confidence: detergentResult.confidence,
        disclaimer: null,
        allowScoring: true,
        detectedKeywords: detergentResult.keywords
      };
    }
    
    // 5. Par défaut : alimentaire
    return {
      category: 'food',
      confidence: 50,
      disclaimer: null,
      allowScoring: true,
      detectedKeywords: []
    };
  }
  
  /**
   * Détection médicament
   * @private
   */
  static _detectMedicine(text) {
    const medicineKeywords = [
      // Réglementaire
      'amm', 'autorisation de mise sur le marché',
      'médicament', 'medicament',
      'prescription', 'ordonnance',
      
      // Formes pharmaceutiques
      'comprimé', 'comprime', 'gélule', 'gelule',
      'sirop', 'suppositoire', 'injectable',
      'posologie', 'voie orale', 'voie cutanée',
      
      // Substances actives
      'dci', 'principe actif', 'paracétamol',
      'ibuprofène', 'ibuprofen', 'aspirine',
      
      // Dosages typiques
      'mg/ml', 'mg par', 'ui/', 'unités internationales',
      
      // Mentions légales
      'lire la notice', 'demandez conseil',
      'pharmacien', 'notice avant utilisation',
      'effets indésirables', 'contre-indication'
    ];
    
    const foundKeywords = medicineKeywords.filter(kw => text.includes(kw));
    const keywordCount = foundKeywords.length;
    
    // Seuil : 2+ mots-clés médicaux
    const isMedicine = keywordCount >= 2;
    const confidence = Math.min(100, keywordCount * 30);
    
    return {
      isMedicine,
      confidence,
      keywords: foundKeywords
    };
  }
  
  /**
   * Détection complément alimentaire
   * @private
   */
  static _detectSupplement(text) {
    const supplementKeywords = [
      // Mentions légales
      'complément alimentaire', 'complement alimentaire',
      'dietary supplement', 'food supplement',
      
      // Disclaimers typiques
      'ne remplace pas', 'alimentation variée',
      'équilibrée', 'equilibree',
      
      // Formes
      'gélules', 'gelules', 'capsules',
      'comprimés', 'comprimes',
      
      // Nutriments
      'vitamine', 'minéraux', 'mineraux',
      'acides aminés', 'acides amines',
      'omega', 'probiotiques',
      
      // Dosages
      'apport journalier', 'dose quotidienne',
      'par jour', 'par gélule'
    ];
    
    const foundKeywords = supplementKeywords.filter(kw => text.includes(kw));
    const keywordCount = foundKeywords.length;
    
    // Seuil : 2+ mots-clés compléments
    const isSupplement = keywordCount >= 2;
    const confidence = Math.min(100, keywordCount * 25);
    
    return {
      isSupplement,
      confidence,
      keywords: foundKeywords
    };
  }
  
  /**
   * Détection cosmétique
   * @private
   */
  static _detectCosmetic(text) {
    const cosmeticKeywords = [
      'crème', 'creme', 'lotion', 'sérum', 'serum',
      'shampoing', 'gel douche', 'savon',
      'maquillage', 'fond de teint', 'mascara',
      'dentifrice', 'bain de bouche',
      'déodorant', 'deodorant', 'parfum',
      'soin visage', 'soin corps', 'anti-âge',
      'hydratant', 'nourrissant', 'démaquillant'
    ];
    
    const foundKeywords = cosmeticKeywords.filter(kw => text.includes(kw));
    const confidence = Math.min(100, foundKeywords.length * 30);
    
    return {
      isCosmetic: foundKeywords.length >= 1,
      confidence,
      keywords: foundKeywords
    };
  }
  
  /**
   * Détection détergent
   * @private
   */
  static _detectDetergent(text) {
    const detergentKeywords = [
      'lessive', 'détergent', 'detergent',
      'liquide vaisselle', 'lave-vaisselle',
      'nettoyant', 'désinfectant', 'desinfectant',
      'javel', 'eau de javel',
      'produit d\'entretien', 'multi-usages',
      'sol', 'vitres', 'salle de bain'
    ];
    
    const foundKeywords = detergentKeywords.filter(kw => text.includes(kw));
    const confidence = Math.min(100, foundKeywords.length * 30);
    
    return {
      isDetergent: foundKeywords.length >= 1,
      confidence,
      keywords: foundKeywords
    };
  }
  
  /**
   * Disclaimer médicament
   * @private
   */
  static _getMedicineDisclaimer() {
    return {
      type: 'medicine',
      title: '⚕️ Produit Médical Détecté',
      message: 'Ecolojia ne remplace pas la notice médicale ni l\'avis d\'un professionnel de santé. ' +
               'Pour toute question sur ce médicament, consultez votre pharmacien ou médecin.',
      action: 'no_scoring',
      severity: 'high'
    };
  }
  
  /**
   * Disclaimer complément alimentaire
   * @private
   */
  static _getSupplementDisclaimer() {
    return {
      type: 'supplement',
      title: '💊 Complément Alimentaire Détecté',
      message: 'Ecolojia analyse la composition de ce complément. ' +
               'Pour un usage adapté à votre situation, consultez un professionnel de santé.',
      action: 'limited_analysis',
      severity: 'medium'
    };
  }
  
  /**
   * Vérification rapide si catégorie interdite
   * @static
   */
  static isForbiddenCategory(category) {
    return category === 'medicine';
  }
  
  /**
   * Messages utilisateur selon catégorie
   * @static
   */
  static getUserMessage(detectionResult) {
    const { category, disclaimer } = detectionResult;
    
    if (category === 'medicine') {
      return {
        canContinue: false,
        message: 'Ce produit semble être un médicament. Ecolojia ne peut pas analyser les médicaments.',
        suggestion: 'Consultez la notice ou un professionnel de santé.'
      };
    }
    
    if (category === 'supplement') {
      return {
        canContinue: true,
        message: 'Ce produit semble être un complément alimentaire.',
        warning: disclaimer.message
      };
    }
    
    return {
      canContinue: true,
      message: null
    };
  }
}

module.exports = CategoryDetectionService;
