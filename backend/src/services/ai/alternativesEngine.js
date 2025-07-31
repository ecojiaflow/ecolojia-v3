// ═══════════════════════════════════════════════════════════════════════
// backend/src/services/ai/alternativesEngine.js - VERSION CORRIGÉE
// ═══════════════════════════════════════════════════════════════════════

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
        'nutella': ['Nocciolata Bio', 'Pâte à tartiner maison', 'Beurre de cacahuète bio'],
        'coca-cola': ['Eau pétillante citronnée', 'Kombucha', 'Thé glacé maison'],
        'chips': ['Chips de légumes maison', 'Noix non salées', 'Popcorn nature'],
        'biscuit': ['Biscuits maison', 'Fruits secs', 'Galettes de riz'],
        'yaourt': ['Yaourt nature bio', 'Kéfir', 'Fromage blanc 0%']
      },
      cosmetics: {
        'shampoing': ['Shampoing solide bio', 'No-poo', 'Rhassoul'],
        'crème': ['Aloe vera', 'Huile de coco', 'Crème bio certifiée'],
        'déodorant': ['Déodorant solide bio', 'Pierre d\'alun', 'Bicarbonate'],
        'maquillage': ['Maquillage bio', 'Produits minéraux', 'DIY naturel']
      },
      detergents: {
        'lessive': ['Lessive au savon de Marseille', 'Noix de lavage', 'Lessive maison'],
        'liquide vaisselle': ['Savon de Marseille', 'Vinaigre blanc', 'Produit bio certifié'],
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
    
    // Recherche par mots-clés
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

    // Si pas d'alternatives trouvées, générer des suggestions génériques
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
          reason: 'Fait maison, 100% naturel et économique',
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
      logger.warn('Error finding similar products:', error.message);
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
        reason: 'Meilleur score santé dans la même catégorie',
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
        'bio': 'Sans pesticides, meilleur pour la santé',
        'maison': 'Fait maison, sans additifs',
        'nature': 'Non transformé, plus nutritif'
      },
      cosmetics: {
        'bio': 'Sans produits chimiques agressifs',
        'solide': 'Écologique, sans emballage plastique',
        'naturel': 'Ingrédients naturels, respectueux de la peau'
      },
      detergents: {
        'marseille': 'Naturel et biodégradable',
        'vinaigre': 'Écologique et économique',
        'bio': 'Certifié écologique, sans danger'
      }
    };

    for (const [key, reason] of Object.entries(reasons[category] || {})) {
      if (alternativeName.toLowerCase().includes(key)) {
        return reason;
      }
    }

    return 'Alternative plus saine et écologique';
  }
}

// IMPORTANT : Export par défaut de la CLASSE pour compatibilité
module.exports = AlternativesEngine;

// Export secondaire pour compatibilité avec l'ancienne API
const alternativesEngine = new AlternativesEngine();
module.exports.alternativesEngine = alternativesEngine;
module.exports.generateAlternatives = (product, category) => alternativesEngine.generateAlternatives(product, category);