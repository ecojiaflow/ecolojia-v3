// PATH: backend/src/services/ai/insightsGenerator.js
const { Logger } = require('../../utils/logger');

const logger = new Logger('InsightsGenerator');

/* ───── Templates d'insights ───── */
const TEMPLATES = {
  food: {
    nova: {
      1: ['✨ Non transformé', '🌱 Base saine'],
      2: ['🍳 Ingrédient culinaire', '💡 Usage modéré'],
      3: ['🏭 Transformé', '📊 Conservateurs simples'],
      4: ['⚠️ Ultra-transformé', '🧪 Additifs multiples']
    },
    ultra: {
      high: ['🏭 Transformation élevée', '📈 Risque chronique'],
      med: ['⚙️ Transformation modérée', '💡 Préférez moins transformé']
    },
    reco: {
      good: ['✅ Excellent choix !', '💚 Continuez ainsi'],
      bad: ['⚡ Consommation occasionnelle', '🏠 Privilégiez maison']
    }
  },
  cosmetics: {
    hazard: {
      high: ['⚠️ Ingrédients préoccupants', '🔬 Composants surveillés'],
      pe: ['🚨 Perturbateurs endocriniens', '👶 Éviter grossesse'],
      allerg: ['🌸 Allergènes présents', '💡 Test préalable']
    },
    reco: {
      good: ['✨ Formulation saine', '🌿 Bonne tolérance'],
      bad: ['🚫 Ingrédients controversés', '🔄 Cherchez alternatives']
    }
  },
  detergents: {
    impact: {
      aqua: ['🐟 Impact aquatique', '💧 Dosez minimum'],
      bio: ['♻️ Biodégradabilité limitée', '⏳ Persistant'],
      voc: ['💨 Émissions volatiles', '🪟 Ventilez']
    },
    reco: {
      good: ['🧼 Impact acceptable', '🌱 Dosage correct'],
      bad: ['🌍 Impact élevé', '🏆 Préférez écolabel']
    }
  },
  general: {
    score: {
      80: ['🌟 Excellent !', '💚 Impact minimal'],
      60: ['👍 Bon produit', '📊 Performance correcte'],
      40: ['⚠️ Moyen', '🔍 Comparez'],
      0: ['❌ Problématique', '🚫 Évitez']
    }
  }
};

/* ───── Générateur optimisé ───── */
class InsightsGenerator {
  async generate(req) {
    logger.info(`Generating insights for ${req.product}`);
    
    const insights = [];
    const recommendations = [];
    const tips = [];
    const warnings = [];
    
    // Insights par catégorie
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
      recommendations.push('💪 Chaque changement compte');
      recommendations.push('🌍 Impact positif possible');
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
        w.push('🚨 Additifs à risque élevé');
      }
    }
    
    // Ultra-transform
    if (a.ultra && a.ultra.score > 7) {
      i.push(...TEMPLATES.food.ultra.high);
      w.push('📈 Risque maladies chroniques');
      t.push('💡 Perturbation signaux satiété');
    } else if (a.ultra && a.ultra.score > 4) {
      i.push(...TEMPLATES.food.ultra.med);
    }
    
    // Marqueurs spécifiques
    if (a.ultra && a.ultra.markers && a.ultra.markers.some(m => /hydrogén/i.test(m))) {
      w.push('🚫 Acides gras trans');
      i.push('❤️ Risque cardiovasculaire');
    }
    
    // Tips généraux
    t.push('💡 Variez les sources');
    if (req.score < 40) {
      r.push('🥗 Compensez avec du frais');
      r.push('💧 Hydratez-vous bien');
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
        r.push('🔄 Alternatives sans PE');
      }
      if (a.cosmeticsHazard.allergens && a.cosmeticsHazard.allergens.length) {
        i.push(...TEMPLATES.cosmetics.hazard.allerg);
        r.push('🔍 Surveillez réactions');
      }
      if (a.cosmeticsHazard.naturalityScore >= 8) {
        i.push('🌿 Haute naturalité');
      }
    }
    
    // Tips
    t.push('💧 Appliquez peau propre');
    t.push('🌞 Protection solaire jour');
    
    r.push(...(req.score >= 50 ? TEMPLATES.cosmetics.reco.good : TEMPLATES.cosmetics.reco.bad));
  }
  
  genDet(req, i, r, t, w) {
    const a = req.analysis || {};
    
    if (a.detergentImpact) {
      if (a.detergentImpact.aquaticToxicity >= 7) {
        w.push(...TEMPLATES.detergents.impact.aqua);
        r.push('🚰 Jamais dans nature');
      }
      if (a.detergentImpact.biodegradability <= 60) {
        w.push(...TEMPLATES.detergents.impact.bio);
      } else if (a.detergentImpact.biodegradability >= 90) {
        i.push('✅ Excellente biodégradabilité');
      }
      if (a.detergentImpact.vocEmissions >= 7) {
        w.push(...TEMPLATES.detergents.impact.voc);
        r.push('😷 Évitez inhalation');
      }
      if (a.detergentImpact.ecoLabel) {
        i.push('🏆 Certifié écologique');
      }
    }
    
    // Tips éco
    t.push('📏 Respectez doses');
    t.push('🌡️ Lavez froid si possible');
    t.push('💧 Surdosage inutile');
    
    r.push(...(req.score >= 50 ? TEMPLATES.detergents.reco.good : TEMPLATES.detergents.reco.bad));
  }
  
  genScore(score, i, r) {
    const threshold = score >= 80 ? 80 : score >= 60 ? 60 : score >= 40 ? 40 : 0;
    i.push(...TEMPLATES.general.score[threshold]);
    
    if (score < 60) {
      r.push('🔍 Comparez options');
    }
  }

  // Méthode principale pour compatibilité avec foodScorer
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
      
      // Limiter à 3 insights
      return formattedInsights.slice(0, 3);
      
    } catch (error) {
      logger.error('Error generating insights:', error);
      return [{
        type: 'info',
        icon: '💡',
        title: 'Analyse en cours',
        priority: 'medium'
      }];
    }
  }
}

// Export singleton
const insightsGenerator = new InsightsGenerator();

module.exports = insightsGenerator;