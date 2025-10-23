// PATH: backend/src/services/ai/insightsGenerator.js
const { Logger } = require('../../utils/logger');

const logger = new Logger('InsightsGenerator');

/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Templates d'insights Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
const TEMPLATES = {
  food: {
    nova: {
      1: ['Ã¢Å“Â¨ Non transforme', 'Ã°Å¸Å’Â± Base saine'],
      2: ['Ã°Å¸ÂÂ³ Ingredient culinaire', 'Ã°Å¸â€™Â¡ Usage modere'],
      3: ['Ã°Å¸ÂÂ­ Transforme', 'Ã°Å¸â€œÅ  Conservateurs simples'],
      4: ['Ã¢Å¡Â Ã¯Â¸Â Ultra-transforme', 'Ã°Å¸Â§Âª Additifs multiples']
    },
    ultra: {
      high: ['Ã°Å¸ÂÂ­ Transformation elevee', 'Ã°Å¸â€œË† Risque chronique'],
      med: ['Ã¢Å¡â„¢Ã¯Â¸Â Transformation moderee', 'Ã°Å¸â€™Â¡ Preferez moins transforme']
    },
    reco: {
      good: ['Ã¢Å“â€¦ Excellent choix !', 'Ã°Å¸â€™Å¡ Continuez ainsi'],
      bad: ['Ã¢Å¡Â¡ Consommation occasionnelle', 'Ã°Å¸ÂÂ  Privilegiez maison']
    }
  },
  cosmetics: {
    hazard: {
      high: ['Ã¢Å¡Â Ã¯Â¸Â Ingredients preoccupants', 'Ã°Å¸â€Â¬ Composants surveilles'],
      pe: ['Ã°Å¸Å¡Â¨ Perturbateurs endocriniens', 'Ã°Å¸â€˜Â¶ â€°viter grossesse'],
      allerg: ['Ã°Å¸Å’Â¸ Allergenes presents', 'Ã°Å¸â€™Â¡ Test prealable']
    },
    reco: {
      good: ['Ã¢Å“Â¨ Formulation saine', 'Ã°Å¸Å’Â¿ Bonne tolerance'],
      bad: ['Ã°Å¸Å¡Â« Ingredients controverses', 'Ã°Å¸â€â€ž Cherchez alternatives']
    }
  },
  detergents: {
    impact: {
      aqua: ['Ã°Å¸ÂÅ¸ Impact aquatique', 'Ã°Å¸â€™Â§ Dosez minimum'],
      bio: ['Ã¢â„¢Â»Ã¯Â¸Â Biodegradabilite limitee', 'Ã¢ÂÂ³ Persistant'],
      voc: ['Ã°Å¸â€™Â¨ â€°missions volatiles', 'Ã°Å¸ÂªÅ¸ Ventilez']
    },
    reco: {
      good: ['Ã°Å¸Â§Â¼ Impact acceptable', 'Ã°Å¸Å’Â± Dosage correct'],
      bad: ['Ã°Å¸Å’Â Impact eleve', 'Ã°Å¸Ââ€  Preferez ecolabel']
    }
  },
  general: {
    score: {
      80: ['Ã°Å¸Å’Å¸ Excellent !', 'Ã°Å¸â€™Å¡ Impact minimal'],
      60: ['Ã°Å¸â€˜Â Bon produit', 'Ã°Å¸â€œÅ  Performance correcte'],
      40: ['Ã¢Å¡Â Ã¯Â¸Â Moyen', 'Ã°Å¸â€Â Comparez'],
      0: ['Ã¢ÂÅ’ Problematique', 'Ã°Å¸Å¡Â« â€°vitez']
    }
  }
};

/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Generateur optimise Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
class InsightsGenerator {
  async generate(req) {
    logger.info(`Generating insights for ${req.product}`);
    
    const insights = [];
    const recommendations = [];
    const tips = [];
    const warnings = [];
    
    // Insights par categorie
    switch (req.category) {
      case 'food':
        this.genFood(req, insights, recommendations, tips, warnings);
        break;
      case 'cosmetics':
        this.genCos(req, insights, recommendations, tips, warnings);
        break;
      case 'detergents':
        this.genDet(req, insights, recommendations, tips, warnings);
        break;
    }
    
    // Insights score
    this.genScore(req.score, insights, recommendations);
    
    // Motivation
    if (req.score < 60) {
      recommendations.push('Ã°Å¸â€™Âª Chaque changement compte');
      recommendations.push('Ã°Å¸Å’Â Impact positif possible');
    }
    
    return {
      insights: [...new Set(insights)],
      recommendations: [...new Set(recommendations)],
      tips: [...new Set(tips)],
      warnings: [...new Set(warnings)]
    };
  }
  
  genFood(req, i, r, t, w) {
    const a = req.analysis || {};
    
    // NOVA
    if (a.nova) {
      const novaInsights = TEMPLATES.food.nova[a.nova.group];
      if (novaInsights) {
        i.push(...novaInsights);
      }
      if (a.nova.group >= 3) {
        r.push(...TEMPLATES.food.reco.bad);
      }
      if (a.nova.additives && a.nova.additives.some(ad => ad.riskLevel === 'high')) {
        w.push('Ã°Å¸Å¡Â¨ Additifs Â  risque eleve');
      }
    }
    
    // Ultra-transform
    if (a.ultra && a.ultra.score > 7) {
      i.push(...TEMPLATES.food.ultra.high);
      w.push('Ã°Å¸â€œË† Risque maladies chroniques');
      t.push('Ã°Å¸â€™Â¡ Perturbation signaux satiete');
    } else if (a.ultra && a.ultra.score > 4) {
      i.push(...TEMPLATES.food.ultra.med);
    }
    
    // Marqueurs specifiques
    if (a.ultra && a.ultra.markers && a.ultra.markers.some(m => /hydrogen/i.test(m))) {
      w.push('Ã°Å¸Å¡Â« Acides gras trans');
      i.push('Ã¢ÂÂ¤Ã¯Â¸Â Risque cardiovasculaire');
    }
    
    // Tips generaux
    t.push('Ã°Å¸â€™Â¡ Variez les sources');
    if (req.score < 40) {
      r.push('Ã°Å¸Â¥â€” Compensez avec du frais');
      r.push('Ã°Å¸â€™Â§ Hydratez-vous bien');
    }
  }
  
  genCos(req, i, r, t, w) {
    const a = req.analysis || {};
    
    if (a.cosmeticsHazard) {
      if (a.cosmeticsHazard.score >= 2) {
        i.push(...TEMPLATES.cosmetics.hazard.high);
      }
      if (a.cosmeticsHazard.endocrineDisruptors && a.cosmeticsHazard.endocrineDisruptors.length) {
        w.push(...TEMPLATES.cosmetics.hazard.pe);
        r.push('Ã°Å¸â€â€ž Alternatives sans PE');
      }
      if (a.cosmeticsHazard.allergens && a.cosmeticsHazard.allergens.length) {
        i.push(...TEMPLATES.cosmetics.hazard.allerg);
        r.push('Ã°Å¸â€Â Surveillez reactions');
      }
      if (a.cosmeticsHazard.naturalityScore >= 8) {
        i.push('Ã°Å¸Å’Â¿ Haute naturalite');
      }
    }
    
    // Tips
    t.push('Ã°Å¸â€™Â§ Appliquez peau propre');
    t.push('Ã°Å¸Å’Å¾ Protection solaire jour');
    
    r.push(...(req.score >= 50 ? TEMPLATES.cosmetics.reco.good : TEMPLATES.cosmetics.reco.bad));
  }
  
  genDet(req, i, r, t, w) {
    const a = req.analysis || {};
    
    if (a.detergentImpact) {
      if (a.detergentImpact.aquaticToxicity >= 7) {
        w.push(...TEMPLATES.detergents.impact.aqua);
        r.push('Ã°Å¸Å¡Â° Jamais dans nature');
      }
      if (a.detergentImpact.biodegradability <= 60) {
        w.push(...TEMPLATES.detergents.impact.bio);
      } else if (a.detergentImpact.biodegradability >= 90) {
        i.push('Ã¢Å“â€¦ Excellente biodegradabilite');
      }
      if (a.detergentImpact.vocEmissions >= 7) {
        w.push(...TEMPLATES.detergents.impact.voc);
        r.push('Ã°Å¸ËœÂ· â€°vitez inhalation');
      }
      if (a.detergentImpact.ecoLabel) {
        i.push('Ã°Å¸Ââ€  Certifie ecologique');
      }
    }
    
    // Tips eco
    t.push('Ã°Å¸â€œÂ Respectez doses');
    t.push('Ã°Å¸Å’Â¡Ã¯Â¸Â Lavez froid si possible');
    t.push('Ã°Å¸â€™Â§ Surdosage inutile');
    
    r.push(...(req.score >= 50 ? TEMPLATES.detergents.reco.good : TEMPLATES.detergents.reco.bad));
  }
  
  genScore(score, i, r) {
    const threshold = score >= 80 ? 80 : score >= 60 ? 60 : score >= 40 ? 40 : 0;
    i.push(...TEMPLATES.general.score[threshold]);
    
    if (score < 60) {
      r.push('Ã°Å¸â€Â Comparez options');
    }
  }

  // Methode principale pour compatibilite avec foodScorer
  async getInsightsForProduct(productData, userProfile = {}) {
    try {
      logger.info('Getting insights for product:', { name: productData.name });
      
      const req = {
        product: productData.name || 'Unknown Product',
        score: productData.score || 50,
        category: productData.category || 'food',
        analysis: productData.analysis || {}
      };
      
      const result = await this.generate(req);
      
      // Transformer en format attendu par foodScorer
      const formattedInsights = [];
      
      // Ajouter les insights
      result.insights.forEach((insight, index) => {
        formattedInsights.push({
          type: 'info',
          icon: insight.substring(0, 2), // Extraire l'emoji
          title: insight.substring(3), // Le reste du texte
          priority: index === 0 ? 'high' : 'medium'
        });
      });
      
      // Ajouter les warnings
      result.warnings.forEach(warning => {
        formattedInsights.push({
          type: 'warning',
          icon: warning.substring(0, 2),
          title: warning.substring(3),
          priority: 'high'
        });
      });
      
      // Limiter Â  3 insights
      return formattedInsights.slice(0, 3);
      
    } catch (error) {
      logger.error('Error generating insights:', error);
      return [{
        type: 'info',
        icon: 'Ã°Å¸â€™Â¡',
        title: 'Analyse en cours',
        priority: 'medium'
      }];
    }
  }
}

// Export singleton
const insightsGenerator = new InsightsGenerator();

module.exports = insightsGenerator;
