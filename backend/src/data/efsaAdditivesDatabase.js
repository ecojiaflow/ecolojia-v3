// backend/src/data/efsaAdditivesDatabase.js

/**
 * 🔬 Base de Données Additifs EFSA 2024
 * Sources: EFSA, ANSES, études scientifiques récentes
 */

class EFSAAdditivesDatabase {
  constructor() {
    this.additives = this.buildDatabase();
    this.lastUpdate = "2024-07-01";
    this.sources = [
      "EFSA - European Food Safety Authority",
      "ANSES - Agence Nationale Sécurité Alimentaire", 
      "Règlement UE 1333/2008",
      "Études scientifiques peer-reviewed 2020-2024"
    ];
  }

  buildDatabase() {
    return {
      // COLORANTS (E100-E199)
      'E102': {
        name: 'Tartrazine',
        category: 'Colorant jaune',
        origin: 'Synthétique',
        function: 'Colorant alimentaire',
        efsaStatus: 'Autorisé avec DJA',
        dja: '7.5 mg/kg/jour',
        concerns: [
          'Hyperactivité enfants (EFSA 2009)',
          'Allergies possible chez asthmatiques',
          'Urticaire et eczéma rapportés'
        ],
        studies: [
          {
            title: 'Hyperactivity in children and artificial colors',
            source: 'Lancet 2007, confirmé EFSA 2009',
            finding: 'Lien possible hyperactivité + mélange colorants'
          }
        ],
        alternatives: ['Curcuma (E100)', 'Riboflavine (E101)', 'Safran naturel'],
        risk_level: 'medium',
        microbiome_impact: 'unknown',
        endocrine_disruptor: false
      },

      'E110': {
        name: 'Jaune orangé S',
        category: 'Colorant orange',
        origin: 'Synthétique',
        function: 'Colorant alimentaire',
        efsaStatus: 'Autorisé avec DJA',
        dja: '4 mg/kg/jour',
        concerns: [
          'Hyperactivité enfants',
          'Allergies croisées avec aspirine',
          'Asthme possible'
        ],
        studies: [
          {
            title: 'Southampton Six study follow-up',
            source: 'Food Additives & Contaminants 2010',
            finding: 'Effets comportementaux confirmés'
          }
        ],
        alternatives: ['Annatto (E160b)', 'Paprika (E160c)'],
        risk_level: 'medium',
        microbiome_impact: 'negative_suspected',
        endocrine_disruptor: false
      },

      // CONSERVATEURS (E200-E299)
      'E220': {
        name: 'Dioxyde de soufre',
        category: 'Conservateur',
        origin: 'Synthétique',
        function: 'Antioxydant, conservateur',
        efsaStatus: 'Autorisé avec DJA',
        dja: '0.7 mg/kg/jour',
        concerns: [
          'Destruction vitamine B1',
          'Crises d\'asthme',
          'Maux de tête',
          'Problèmes respiratoires'
        ],
        studies: [
          {
            title: 'Sulfite sensitivity and asthma',
            source: 'Clinical Reviews in Allergy 2020',
            finding: '3-10% population sensible, asthmatiques à risque'
          }
        ],
        alternatives: ['Vitamine C (E300)', 'Vitamine E (E306)', 'Extraits naturels'],
        risk_level: 'medium',
        microbiome_impact: 'negative',
        endocrine_disruptor: false
      },

      'E249': {
        name: 'Nitrite de potassium',
        category: 'Conservateur',
        origin: 'Synthétique',
        function: 'Conservation viandes',
        efsaStatus: 'Autorisé avec restrictions',
        dja: '0.07 mg/kg/jour',
        concerns: [
          'Formation nitrosamines cancérigènes',
          'Méthémoglobinémie nourrissons',
          'Cancer colorectal suspecté'
        ],
        studies: [
          {
            title: 'Processed meat and cancer risk',
            source: 'WHO/IARC 2015, confirmé études 2024',
            finding: 'Nitrites = probablement cancérigène (2A)'
          },
          {
            title: 'Nitrates, nitrites and colorectal cancer',
            source: 'European Journal of Epidemiology 2024',
            finding: '+18% risque cancer colorectal avec charcuteries'
          }
        ],
        alternatives: ['Sel de céleri', 'Extrait d\'acérola', 'Fumage naturel'],
        risk_level: 'high',
        microbiome_impact: 'negative',
        endocrine_disruptor: false
      },

      // ANTIOXYDANTS (E300-E399)
      'E320': {
        name: 'BHA (Hydroxyanisole butylé)',
        category: 'Antioxydant',
        origin: 'Synthétique',
        function: 'Antioxydant lipides',
        efsaStatus: 'En réévaluation 2024',
        dja: '0.5 mg/kg/jour (provisoire)',
        concerns: [
          'Perturbateur endocrinien suspecté',
          'Cancérigène possible (CIRC 2B)',
          'Accumulation tissus adipeux'
        ],
        studies: [
          {
            title: 'BHA endocrine disruption evidence',
            source: 'Environmental Health Perspectives 2023',
            finding: 'Perturbation hormonale confirmée études animales'
          },
          {
            title: 'Food additive safety reassessment',
            source: 'EFSA Journal 2024',
            finding: 'Réévaluation en cours, DJA pourrait baisser'
          }
        ],
        alternatives: ['Vitamine E (E306)', 'Extrait romarin', 'Vitamine C (E300)'],
        risk_level: 'high',
        microbiome_impact: 'negative_suspected',
        endocrine_disruptor: true
      },

      // ÉMULSIFIANTS (E400-E499)
      'E471': {
        name: 'Mono- et diglycérides',
        category: 'Émulsifiant',
        origin: 'Végétale/animale',
        function: 'Émulsification, texture',
        efsaStatus: 'Autorisé sans DJA',
        dja: 'Non spécifiée (quantum satis)',
        concerns: [
          'Perturbation microbiote intestinal',
          'Inflammation intestinale',
          'Syndrome métabolique'
        ],
        studies: [
          {
            title: 'Emulsifiers and gut microbiome disruption',
            source: 'Nature 2024',
            finding: 'Dysbiose confirmée, inflammation +40%'
          },
          {
            title: 'Food emulsifiers and metabolic syndrome',
            source: 'Cell Metabolism 2023',
            finding: 'Résistance insuline, obésité viscérale'
          }
        ],
        alternatives: ['Lécithine tournesol', 'Lécithine soja bio', 'Pas d\'émulsifiant'],
        risk_level: 'medium',
        microbiome_impact: 'negative_confirmed',
        endocrine_disruptor: false
      },

      'E472e': {
        name: 'Esters mono- et diacétyltartriques',
        category: 'Émulsifiant',
        origin: 'Synthétique',
        function: 'Amélioration texture',
        efsaStatus: 'Autorisé avec DJA',
        dja: '50 mg/kg/jour',
        concerns: [
          'Effet microbiote inconnu',
          'Études sécurité limitées',
          'Interaction autres additifs'
        ],
        studies: [
          {
            title: 'Food additives safety data gaps',
            source: 'EFSA Scientific Opinion 2024',
            finding: 'Données insuffisantes effets long terme'
          }
        ],
        alternatives: ['Pas d\'émulsifiant', 'Méthodes mécaniques'],
        risk_level: 'low',
        microbiome_impact: 'unknown',
        endocrine_disruptor: false
      },

      // ÉDULCORANTS (E950-E999)
      'E951': {
        name: 'Aspartame',
        category: 'Édulcorant',
        origin: 'Synthétique',
        function: 'Édulcorant intense',
        efsaStatus: 'Réévalué 2024',
        dja: '40 mg/kg/jour',
        concerns: [
          'Cancérigène possible (CIRC 2B)',
          'Maux de tête',
          'Perturbation microbiote'
        ],
        studies: [
          {
            title: 'Aspartame and cancer risk',
            source: 'WHO/IARC 2023',
            finding: 'Classifié 2B (possiblement cancérigène)'
          },
          {
            title: 'Artificial sweeteners and glucose intolerance',
            source: 'Nature Medicine 2024',
            finding: 'Perturbation métabolisme glucose via microbiote'
          }
        ],
        alternatives: ['Stévia (E960)', 'Érythritol', 'Sucre modéré'],
        risk_level: 'medium',
        microbiome_impact: 'negative_confirmed',
        endocrine_disruptor: false
      },

      'E952': {
        name: 'Acésulfame K',
        category: 'Édulcorant',
        origin: 'Synthétique',
        function: 'Édulcorant intense',
        efsaStatus: 'Autorisé',
        dja: '9 mg/kg/jour',
        concerns: [
          'Non métabolisé (excrétion inchangée)',
          'Effet microbiote suspecté',
          'Goût métallique'
        ],
        studies: [
          {
            title: 'Non-nutritive sweeteners and microbiome',
            source: 'Gut Microbes 2024',
            finding: 'Modification composition bactérienne intestinale'
          }
        ],
        alternatives: ['Stévia', 'Moine fruit', 'Réduction progressive sucre'],
        risk_level: 'low',
        microbiome_impact: 'negative_suspected',
        endocrine_disruptor: false
      }
    };
  }

  /**
   * Recherche additif par code E
   */
  getAdditive(eCode) {
    const normalized = eCode.toUpperCase().replace(/[^E0-9A-Z]/g, '');
    return this.additives[normalized] || null;
  }

  /**
   * Analyse liste d'additifs
   */
  analyzeAdditives(eCodesList) {
    const analysis = {
      total: eCodesList.length,
      byRiskLevel: { high: 0, medium: 0, low: 0, unknown: 0 },
      microbiomeDisruptors: [],
      endocrineDisruptors: [],
      concerns: [],
      alternatives: [],
      overallRisk: 'low'
    };

    eCodesList.forEach(eCode => {
      const additive = this.getAdditive(eCode);
      if (additive) {
        // Comptage par niveau de risque
        analysis.byRiskLevel[additive.risk_level]++;

        // Perturbateurs spécifiques
        if (additive.microbiome_impact === 'negative_confirmed' || 
            additive.microbiome_impact === 'negative_suspected') {
          analysis.microbiomeDisruptors.push({
            code: eCode,
            name: additive.name,
            impact: additive.microbiome_impact
          });
        }

        if (additive.endocrine_disruptor) {
          analysis.endocrineDisruptors.push({
            code: eCode,
            name: additive.name
          });
        }

        // Préoccupations
        analysis.concerns.push(...additive.concerns.map(concern => ({
          code: eCode,
          name: additive.name,
          concern
        })));

        // Alternatives
        analysis.alternatives.push(...additive.alternatives);
      } else {
        analysis.byRiskLevel.unknown++;
      }
    });

    // Évaluation risque global
    if (analysis.byRiskLevel.high > 0 || analysis.endocrineDisruptors.length > 0) {
      analysis.overallRisk = 'high';
    } else if (analysis.byRiskLevel.medium > 1 || analysis.microbiomeDisruptors.length > 2) {
      analysis.overallRisk = 'medium';
    }

    // Dédoublonnage alternatives
    analysis.alternatives = [...new Set(analysis.alternatives)];

    return analysis;
  }

  /**
   * Recherche par catégorie
   */
  getAdditivesByCategory(category) {
    return Object.entries(this.additives)
      .filter(([code, data]) => data.category.toLowerCase().includes(category.toLowerCase()))
      .map(([code, data]) => ({ code, ...data }));
  }

  /**
   * Additifs à éviter (risque élevé)
   */
  getHighRiskAdditives() {
    return Object.entries(this.additives)
      .filter(([code, data]) => data.risk_level === 'high')
      .map(([code, data]) => ({ code, ...data }));
  }

  /**
   * Perturbateurs microbiote confirmés
   */
  getMicrobiomeDisruptors() {
    return Object.entries(this.additives)
      .filter(([code, data]) => data.microbiome_impact === 'negative_confirmed')
      .map(([code, data]) => ({ code, ...data }));
  }

  /**
   * Résumé pour interface utilisateur
   */
  generateUserFriendlyReport(eCodesList) {
    const analysis = this.analyzeAdditives(eCodesList);
    
    let message = "";
    let alertLevel = "info";

    if (analysis.overallRisk === 'high') {
      message = `⚠️ ${analysis.byRiskLevel.high} additif(s) à risque élevé détecté(s)`;
      alertLevel = "error";
    } else if (analysis.overallRisk === 'medium') {
      message = `🟡 Présence d'additifs pouvant affecter votre santé`;
      alertLevel = "warning";
    } else {
      message = `✅ Additifs présents considérés comme sûrs`;
      alertLevel = "success";
    }

    return {
      message,
      alertLevel,
      details: analysis,
      recommendations: this.generateRecommendations(analysis)
    };
  }

  /**
   * Génération recommandations
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    if (analysis.endocrineDisruptors.length > 0) {
      recommendations.push({
        type: 'critical',
        message: 'Éviter ce produit : contient des perturbateurs endocriniens',
        alternatives: analysis.alternatives.slice(0, 3)
      });
    }

    if (analysis.microbiomeDisruptors.length > 1) {
      recommendations.push({
        type: 'warning',
        message: 'Impact possible sur votre microbiote intestinal',
        alternatives: ['Produits sans émulsifiants', 'Versions artisanales', 'Fait maison']
      });
    }

    if (analysis.byRiskLevel.high > 0) {
      recommendations.push({
        type: 'important',
        message: 'Consommation occasionnelle recommandée',
        alternatives: analysis.alternatives.slice(0, 2)
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'info',
        message: 'Additifs présents considérés comme sûrs selon EFSA',
        alternatives: []
      });
    }

    return recommendations;
  }

  /**
   * Export pour intégration
   */
  exportDatabase() {
    return {
      additives: this.additives,
      metadata: {
        lastUpdate: this.lastUpdate,
        sources: this.sources,
        totalAdditives: Object.keys(this.additives).length
      },
      statistics: {
        byRiskLevel: this.getStatisticsByRiskLevel(),
        byCategory: this.getStatisticsByCategory()
      }
    };
  }

  getStatisticsByRiskLevel() {
    const stats = { high: 0, medium: 0, low: 0 };
    Object.values(this.additives).forEach(additive => {
      stats[additive.risk_level]++;
    });
    return stats;
  }

  getStatisticsByCategory() {
    const stats = {};
    Object.values(this.additives).forEach(additive => {
      stats[additive.category] = (stats[additive.category] || 0) + 1;
    });
    return stats;
  }
}

module.exports = EFSAAdditivesDatabase;
