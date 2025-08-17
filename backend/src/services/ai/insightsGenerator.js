// PATH: backend/src/services/ai/insightsGenerator.js
const { Logger } = require('../../utils/logger');

const logger = new Logger('InsightsGenerator');

/* â”€â”€â”€â”€â”€ Templates d'insights â”€â”€â”€â”€â”€ */
const TEMPLATES = {
  food: {
    nova: {
      1: ['âœ¨ Non transforme', 'ðŸŒ± Base saine'],
      2: ['ðŸ³ Ingredient culinaire', 'ðŸ’¡ Usage modere'],
      3: ['ðŸ­ Transforme', 'ðŸ“Š Conservateurs simples'],
      4: ['âš ï¸ Ultra-transforme', 'ðŸ§ª Additifs multiples']
    },
    ultra: {
      high: ['ðŸ­ Transformation elevee', 'ðŸ“ˆ Risque chronique'],
      med: ['âš™ï¸ Transformation moderee', 'ðŸ’¡ Preferez moins transforme']
    },
    reco: {
      good: ['âœ… Excellent choix !', 'ðŸ’š Continuez ainsi'],
      bad: ['âš¡ Consommation occasionnelle', 'ðŸ  Privilegiez maison']
    }
  },
  cosmetics: {
    hazard: {
      high: ['âš ï¸ Ingredients preoccupants', 'ðŸ”¬ Composants surveilles'],
      pe: ['ðŸš¨ Perturbateurs endocriniens', 'ðŸ‘¶ ‰viter grossesse'],
      allerg: ['ðŸŒ¸ Allergenes presents', 'ðŸ’¡ Test prealable']
    },
    reco: {
      good: ['âœ¨ Formulation saine', 'ðŸŒ¿ Bonne tolerance'],
      bad: ['ðŸš« Ingredients controverses', 'ðŸ”„ Cherchez alternatives']
    }
  },
  detergents: {
    impact: {
      aqua: ['ðŸŸ Impact aquatique', 'ðŸ’§ Dosez minimum'],
      bio: ['â™»ï¸ Biodegradabilite limitee', 'â³ Persistant'],
      voc: ['ðŸ’¨ ‰missions volatiles', 'ðŸªŸ Ventilez']
    },
    reco: {
      good: ['ðŸ§¼ Impact acceptable', 'ðŸŒ± Dosage correct'],
      bad: ['ðŸŒ Impact eleve', 'ðŸ† Preferez ecolabel']
    }
  },
  general: {
    score: {
      80: ['ðŸŒŸ Excellent !', 'ðŸ’š Impact minimal'],
      60: ['ðŸ‘ Bon produit', 'ðŸ“Š Performance correcte'],
      40: ['âš ï¸ Moyen', 'ðŸ” Comparez'],
      0: ['âŒ Problematique', 'ðŸš« ‰vitez']
    }
  }
};

/* â”€â”€â”€â”€â”€ Generateur optimise â”€â”€â”€â”€â”€ */
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
      recommendations.push('ðŸ’ª Chaque changement compte');
      recommendations.push('ðŸŒ Impact positif possible');
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
        w.push('ðŸš¨ Additifs   risque eleve');
      }
    }
    
    // Ultra-transform
    if (a.ultra && a.ultra.score > 7) {
      i.push(...TEMPLATES.food.ultra.high);
      w.push('ðŸ“ˆ Risque maladies chroniques');
      t.push('ðŸ’¡ Perturbation signaux satiete');
    } else if (a.ultra && a.ultra.score > 4) {
      i.push(...TEMPLATES.food.ultra.med);
    }
    
    // Marqueurs specifiques
    if (a.ultra && a.ultra.markers && a.ultra.markers.some(m => /hydrogen/i.test(m))) {
      w.push('ðŸš« Acides gras trans');
      i.push('â¤ï¸ Risque cardiovasculaire');
    }
    
    // Tips generaux
    t.push('ðŸ’¡ Variez les sources');
    if (req.score < 40) {
      r.push('ðŸ¥— Compensez avec du frais');
      r.push('ðŸ’§ Hydratez-vous bien');
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
        r.push('ðŸ”„ Alternatives sans PE');
      }
      if (a.cosmeticsHazard.allergens && a.cosmeticsHazard.allergens.length) {
        i.push(...TEMPLATES.cosmetics.hazard.allerg);
        r.push('ðŸ” Surveillez reactions');
      }
      if (a.cosmeticsHazard.naturalityScore >= 8) {
        i.push('ðŸŒ¿ Haute naturalite');
      }
    }
    
    // Tips
    t.push('ðŸ’§ Appliquez peau propre');
    t.push('ðŸŒž Protection solaire jour');
    
    r.push(...(req.score >= 50 ? TEMPLATES.cosmetics.reco.good : TEMPLATES.cosmetics.reco.bad));
  }
  
  genDet(req, i, r, t, w) {
    const a = req.analysis || {};
    
    if (a.detergentImpact) {
      if (a.detergentImpact.aquaticToxicity >= 7) {
        w.push(...TEMPLATES.detergents.impact.aqua);
        r.push('ðŸš° Jamais dans nature');
      }
      if (a.detergentImpact.biodegradability <= 60) {
        w.push(...TEMPLATES.detergents.impact.bio);
      } else if (a.detergentImpact.biodegradability >= 90) {
        i.push('âœ… Excellente biodegradabilite');
      }
      if (a.detergentImpact.vocEmissions >= 7) {
        w.push(...TEMPLATES.detergents.impact.voc);
        r.push('ðŸ˜· ‰vitez inhalation');
      }
      if (a.detergentImpact.ecoLabel) {
        i.push('ðŸ† Certifie ecologique');
      }
    }
    
    // Tips eco
    t.push('ðŸ“ Respectez doses');
    t.push('ðŸŒ¡ï¸ Lavez froid si possible');
    t.push('ðŸ’§ Surdosage inutile');
    
    r.push(...(req.score >= 50 ? TEMPLATES.detergents.reco.good : TEMPLATES.detergents.reco.bad));
  }
  
  genScore(score, i, r) {
    const threshold = score >= 80 ? 80 : score >= 60 ? 60 : score >= 40 ? 40 : 0;
    i.push(...TEMPLATES.general.score[threshold]);
    
    if (score < 60) {
      r.push('ðŸ” Comparez options');
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
      
      // Limiter   3 insights
      return formattedInsights.slice(0, 3);
      
    } catch (error) {
      logger.error('Error generating insights:', error);
      return [{
        type: 'info',
        icon: 'ðŸ’¡',
        title: 'Analyse en cours',
        priority: 'medium'
      }];
    }
  }
}

// Export singleton
const insightsGenerator = new InsightsGenerator();

module.exports = insightsGenerator;
