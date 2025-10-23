// -----------------------------------------------------------------------
// backend/src/services/ai/alternativesEngine.js - VERSION CORRIGÃ‰E
// -----------------------------------------------------------------------

// Gestion du logger avec fallback
let logger;
try {
  const { Logger } = require('../../utils/logger');
  logger = new Logger('AlternativesEngine');
} catch (e) {
  // Fallback si Logger n'existe pas
  logger = {
    info: (...args) => console.log('[AlternativesEngine]', ...args),
    debug: (...args) => console.log('[AlternativesEngine DEBUG]', ...args),
    warn: (...args) => console.warn('[AlternativesEngine WARN]', ...args),
    error: (...args) => console.error('[AlternativesEngine ERROR]', ...args)
  };
}

const Product = require('../../models/Product');

class AlternativesEngine {
  constructor() {
    this.alternatives = {
      food: {
        'nutella': ['Nocciolata Bio', 'PÃ¢te Ã  tartiner maison', 'Beurre de cacahuÃ¨te bio'],
        'coca-cola': ['Eau pÃ©tillante citronnÃ©e', 'Kombucha', 'ThÃ© glacÃ© maison'],
        'chips': ['Chips de lÃ©gumes maison', 'Noix non salÃ©es', 'Popcorn nature'],
        'biscuit': ['Biscuits maison', 'Fruits secs', 'Galettes de riz'],
        'yaourt': ['Yaourt nature bio', 'KÃ©fir', 'Fromage blanc 0%']
      },
      cosmetics: {
        'shampoing': ['Shampoing solide bio', 'No-poo', 'Rhassoul'],
        'crÃ¨me': ['Aloe vera', 'Huile de coco', 'CrÃ¨me bio certifiÃ©e'],
        'dÃ©odorant': ['DÃ©odorant solide bio', 'Pierre d\'alun', 'Bicarbonate'],
        'maquillage': ['Maquillage bio', 'Produits minÃ©raux', 'DIY naturel']
      },
      detergents: {
        'lessive': ['Lessive au savon de Marseille', 'Noix de lavage', 'Lessive maison'],
        'liquide vaisselle': ['Savon de Marseille', 'Vinaigre blanc', 'Produit bio certifiÃ©'],
        'nettoyant': ['Vinaigre blanc', 'Bicarbonate', 'Savon noir']
      }
    };

    logger.info('AlternativesEngine initialized');
  }

  async generateAlternatives(product, category = 'food') {
    logger.info('Generating alternatives for:', { name: product.name, category });
    
    const alternatives = [];
    const productNameLower = (product.name || '').toLowerCase();
    
    // Chercher dans la base d'alternatives
    const categoryAlternatives = this.alternatives[category] || {};
    
    // Recherche par mots-clÃ©s
    for (const [key, values] of Object.entries(categoryAlternatives)) {
      if (productNameLower.includes(key)) {
        alternatives.push(...values.map(alt => ({
          name: alt,
          reason: this.getAlternativeReason(alt, category),
          score: Math.floor(Math.random() * 20) + 80,
          category: category
        })));
        logger.debug('Found alternatives for keyword:', key);
      }
    }

    // Si pas d'alternatives trouvÃ©es, gÃ©nÃ©rer des suggestions gÃ©nÃ©riques
    if (alternatives.length === 0) {
      logger.debug('No specific alternatives found, generating generic suggestions');
      
      alternatives.push(
        {
          name: `Version bio de ${product.name}`,
          reason: 'Sans pesticides ni additifs chimiques',
          score: 85,
          category: category
        },
        {
          name: `Alternative maison`,
          reason: 'Fait maison, 100% naturel et Ã©conomique',
          score: 95,
          category: category
        },
        {
          name: `Option locale`,
          reason: 'Produit local, circuit court',
          score: 90,
          category: category
        }
      );
    }

    // Enrichir avec des produits de la base si disponibles
    try {
      const similarProducts = await this.findSimilarProducts(product, 3);
      alternatives.push(...similarProducts);
    } catch (error) {
      console.warn('Error finding similar products:', error.message);
    }

    logger.info('Generated alternatives:', { count: alternatives.length });
    return alternatives.slice(0, 3); // Maximum 3 alternatives
  }

  async findSimilarProducts(product, limit = 5) {
    try {
      // Rechercher des produits similaires avec un meilleur score
      const betterProducts = await Product.find({
        category: product.category,
        'analysisData.healthScore': { $gt: (product.analysisData?.healthScore || 50) },
        _id: { $ne: product._id }
      })
        .sort({ 'analysisData.healthScore': -1 })
        .limit(limit)
        .select('name brand analysisData.healthScore');

      return betterProducts.map(p => ({
        name: `${p.brand ? p.brand + ' - ' : ''}${p.name}`,
        reason: 'Meilleur score santÃ© dans la mÃªme catÃ©gorie',
        score: p.analysisData?.healthScore || 0,
        productId: p._id
      }));
    } catch (error) {
      logger.error('Error finding similar products:', error);
      return [];
    }
  }

  getAlternativeReason(alternativeName, category) {
    const reasons = {
      food: {
        'bio': 'Sans pesticides, meilleur pour la santÃ©',
        'maison': 'Fait maison, sans additifs',
        'nature': 'Non transformÃ©, plus nutritif'
      },
      cosmetics: {
        'bio': 'Sans produits chimiques agressifs',
        'solide': 'Ã‰cologique, sans emballage plastique',
        'naturel': 'IngrÃ©dients naturels, respectueux de la peau'
      },
      detergents: {
        'marseille': 'Naturel et biodÃ©gradable',
        'vinaigre': 'Ã‰cologique et Ã©conomique',
        'bio': 'CertifiÃ© Ã©cologique, sans danger'
      }
    };

    for (const [key, reason] of Object.entries(reasons[category] || {})) {
      if (alternativeName.toLowerCase().includes(key)) {
        return reason;
      }
    }

    return 'Alternative plus saine et Ã©cologique';
  }
}

// IMPORTANT : Export par dÃ©faut de la CLASSE pour compatibilitÃ©
module.exports = AlternativesEngine;

// Export secondaire pour compatibilitÃ© avec l'ancienne API
const alternativesEngine = new AlternativesEngine();
module.exports.alternativesEngine = alternativesEngine;
module.exports.generateAlternatives = (product, category) => alternativesEngine.generateAlternatives(product, category);
