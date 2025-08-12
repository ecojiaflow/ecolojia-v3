// PATH: backend\src\services\analysis\detergents.js
/**
 * Detergents Analysis Service - Analyse des produits détergents
 * Conforme à TechReference.md : CLP, tensioactifs, biodégradabilité, parfums
 */

class DetergentsAnalyzer {
  constructor() {
    // Pictogrammes CLP et leur impact
    this.clpPictograms = {
      'GHS05': { name: 'Corrosif', healthImpact: 'high', envImpact: 'medium' },
      'GHS06': { name: 'Toxique', healthImpact: 'critical', envImpact: 'high' },
      'GHS07': { name: 'Irritant/Nocif', healthImpact: 'medium', envImpact: 'low' },
      'GHS08': { name: 'Danger pour la santé', healthImpact: 'high', envImpact: 'medium' },
      'GHS09': { name: 'Danger pour l\'environnement', healthImpact: 'low', envImpact: 'high' }
    };
    
    // Tensioactifs et leur biodégradabilité
    this.surfactants = {
      // Anioniques
      'sls': { type: 'anionic', name: 'Sodium Lauryl Sulfate', biodegradability: 'good', irritant: true },
      'sles': { type: 'anionic', name: 'Sodium Laureth Sulfate', biodegradability: 'good', irritant: true },
      'las': { type: 'anionic', name: 'Linear Alkylbenzene Sulfonate', biodegradability: 'good', irritant: false },
      'soap': { type: 'anionic', name: 'Savon', biodegradability: 'excellent', irritant: false },
      'alkyl sulfate': { type: 'anionic', biodegradability: 'good', irritant: true },
      'alkyl ether sulfate': { type: 'anionic', biodegradability: 'good', irritant: true },
      
      // Non-ioniques
      'alkyl polyglucoside': { type: 'nonionic', biodegradability: 'excellent', irritant: false },
      'fatty alcohol ethoxylate': { type: 'nonionic', biodegradability: 'moderate', irritant: false },
      'alkyl ethoxylate': { type: 'nonionic', biodegradability: 'moderate', irritant: false },
      'glucoside': { type: 'nonionic', biodegradability: 'excellent', irritant: false },
      
      // Cationiques
      'quaternary ammonium': { type: 'cationic', biodegradability: 'poor', irritant: true },
      'benzalkonium chloride': { type: 'cationic', biodegradability: 'poor', irritant: true, toxic: true },
      
      // Amphotères
      'betaine': { type: 'amphoteric', biodegradability: 'good', irritant: false },
      'amine oxide': { type: 'amphoteric', biodegradability: 'good', irritant: false }
    };
    
    // Agents problématiques
    this.problematicAgents = {
      'phosphate': { concern: 'eutrophisation', banned: 'EU' },
      'phosphonate': { concern: 'eutrophisation', restricted: true },
      'edta': { concern: 'persistant', biodegradability: 'very poor' },
      'nta': { concern: 'chélateur', biodegradability: 'poor' },
      'chlorine bleach': { concern: 'toxique', name: 'Eau de Javel' },
      'percarbonate': { concern: 'oxydant', safer: true },
      'formaldehyde': { concern: 'cancérigène', banned: true },
      'triclosan': { concern: 'perturbateur endocrinien', restricted: true }
    };
    
    // Patterns de détection
    this.percentagePattern = /(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)\s*%|([<>≤≥]?\s*\d+(?:[.,]\d+)?)\s*%/;
    this.surfactantPattern = /(tensioactif|surfactant|anionic|cationic|nonionic|amphoteric)/i;
  }

  /**
   * Analyse principale d'un produit détergent
   */
  async analyzeProduct(product, options = {}) {
    const ingredientsText = this.extractIngredientsText(product);
    
    // Détecter les pictogrammes CLP (depuis photo ou metadata)
    const clpDetected = this.detectCLPPictograms(product);
    
    // Parser la composition
    const composition = this.parseComposition(ingredientsText);
    
    // Analyser les composants
    const analysis = this.analyzeComponents(composition);
    
    // Calculer les scores
    const healthScore = this.calculateHealthScore(clpDetected, analysis);
    const environmentScore = this.calculateEnvironmentScore(clpDetected, analysis);
    const globalScore = Math.round((healthScore + environmentScore) / 2);
    
    return {
      category: 'detergents',
      timestamp: new Date(),
      scores: {
        healthScore,
        environmentScore
      },
      details: {
        clpPictograms: clpDetected,
        surfactants: analysis.surfactants.map(s => s.type),
        allergens: analysis.allergens,
        biodegradability: this.assessBiodegradability(analysis),
        phosphates: analysis.phosphates,
        bleachingAgents: analysis.bleachingAgents,
        composition: analysis
      },
      globalScore,
      confidence: this.calculateConfidence(composition, clpDetected, analysis),
      recommendations: this.generateRecommendations(analysis, healthScore, environmentScore)
    };
  }

  /**
   * Extrait le texte des ingrédients
   */
  extractIngredientsText(product) {
    if (typeof product.ingredients === 'string') {
      return product.ingredients;
    }
    if (product.ingredients?.text) {
      return product.ingredients.text;
    }
    return '';
  }

  /**
   * Détecte les pictogrammes CLP
   */
  detectCLPPictograms(product) {
    const detected = [];
    
    // Si on a des métadonnées CLP
    if (product.clpPictograms && Array.isArray(product.clpPictograms)) {
      return product.clpPictograms;
    }
    
    // Sinon, essayer de détecter dans le texte ou description
    const fullText = [
      product.description,
      product.warnings,
      product.ingredients
    ].filter(Boolean).join(' ').toLowerCase();
    
    // Détection basique par mots-clés
    if (/corrosif|corrosive/i.test(fullText)) detected.push('GHS05');
    if (/toxique|toxic/i.test(fullText) && !/écotoxique/i.test(fullText)) detected.push('GHS06');
    if (/irritant|nocif|harmful/i.test(fullText)) detected.push('GHS07');
    if (/danger.*santé|health.*hazard/i.test(fullText)) detected.push('GHS08');
    if (/danger.*environnement|environmental.*hazard|écotoxique/i.test(fullText)) detected.push('GHS09');
    
    return [...new Set(detected)];
  }

  /**
   * Parse la composition
   */
  parseComposition(ingredientsText) {
    if (!ingredientsText) return [];
    
    const components = [];
    
    // Séparer par virgules ou points-virgules
    const parts = ingredientsText.split(/[,;]/).map(s => s.trim());
    
    parts.forEach((part, index) => {
      // Extraire le pourcentage
      const percentMatch = part.match(this.percentagePattern);
      let percentage = null;
      let name = part;
      
      if (percentMatch) {
        if (percentMatch[1] && percentMatch[2]) {
          // Range: "5-15%"
          percentage = (parseFloat(percentMatch[1]) + parseFloat(percentMatch[2])) / 2;
        } else if (percentMatch[3]) {
          // Single: "<5%", ">30%", "15%"
          percentage = parseFloat(percentMatch[3].replace(/[<>≤≥]/g, ''));
        }
        // Enlever le pourcentage du nom
        name = part.replace(this.percentagePattern, '').trim();
      }
      
      // Détecter le type de tensioactif
      let surfactantType = null;
      if (this.surfactantPattern.test(name)) {
        if (/anioni/i.test(name)) surfactantType = 'anionic';
        else if (/cationi/i.test(name)) surfactantType = 'cationic';
        else if (/non[\s-]?ioni/i.test(name)) surfactantType = 'nonionic';
        else if (/ampho/i.test(name)) surfactantType = 'amphoteric';
        else surfactantType = 'unknown';
      }
      
      components.push({
        name: name,
        percentage: percentage || this.estimatePercentage(index),
        position: index + 1,
        surfactantType: surfactantType
      });
    });
    
    return components;
  }

  /**
   * Analyse les composants
   */
  analyzeComponents(components) {
    const analysis = {
      surfactants: [],
      allergens: [],
      phosphates: false,
      bleachingAgents: [],
      problematicComponents: [],
      enzymes: false
    };
    
    components.forEach(comp => {
      const nameLower = comp.name.toLowerCase();
      
      // Tensioactifs
      if (comp.surfactantType) {
        analysis.surfactants.push({
          name: comp.name,
          type: comp.surfactantType,
          percentage: comp.percentage,
          biodegradability: this.assessSurfactantBiodegradability(nameLower)
        });
      }
      
      // Détection spécifique de tensioactifs connus
      Object.entries(this.surfactants).forEach(([key, data]) => {
        if (nameLower.includes(key)) {
          analysis.surfactants.push({
            name: comp.name,
            type: data.type,
            percentage: comp.percentage,
            biodegradability: data.biodegradability,
            irritant: data.irritant,
            details: data
          });
        }
      });
      
      // Allergènes parfumés
      if (nameLower.includes('parfum') || nameLower.includes('fragrance')) {
        // Extraire les allergènes entre parenthèses
        const allergenMatch = comp.name.match(/\(([^)]+)\)/);
        if (allergenMatch) {
          const allergens = allergenMatch[1].split(',').map(a => a.trim());
          analysis.allergens.push(...allergens);
        }
      }
      
      // Allergènes spécifiques
      const knownAllergens = ['limonene', 'linalool', 'citral', 'geraniol', 'eugenol'];
      knownAllergens.forEach(allergen => {
        if (nameLower.includes(allergen)) {
          analysis.allergens.push(allergen);
        }
      });
      
      // Phosphates
      if (nameLower.includes('phosphate') || nameLower.includes('phosphonate')) {
        analysis.phosphates = true;
        analysis.problematicComponents.push({
          name: comp.name,
          concern: 'eutrophisation',
          percentage: comp.percentage
        });
      }
      
      // Agents blanchissants
      if (nameLower.includes('bleach') || nameLower.includes('javel') || 
          nameLower.includes('hypochlorite') || nameLower.includes('percarbonate') ||
          nameLower.includes('perborate') || nameLower.includes('peroxide')) {
        analysis.bleachingAgents.push({
          name: comp.name,
          type: nameLower.includes('oxygen') || nameLower.includes('percarbonate') ? 'oxygen' : 'chlorine',
          percentage: comp.percentage
        });
      }
      
      // Enzymes
      if (nameLower.includes('enzyme') || nameLower.includes('protease') || 
          nameLower.includes('amylase') || nameLower.includes('lipase')) {
        analysis.enzymes = true;
      }
      
      // Agents problématiques
      Object.entries(this.problematicAgents).forEach(([key, data]) => {
        if (nameLower.includes(key)) {
          analysis.problematicComponents.push({
            name: comp.name,
            concern: data.concern,
            percentage: comp.percentage,
            details: data
          });
        }
      });
    });
    
    // Déduplique les allergènes
    analysis.allergens = [...new Set(analysis.allergens)];
    
    return analysis;
  }

  /**
   * Évalue la biodégradabilité d'un tensioactif
   */
  assessSurfactantBiodegradability(name) {
    if (/glucoside|betaine|soap|savon/i.test(name)) return 'excellent';
    if (/sulfate|sls|sles|las/i.test(name)) return 'good';
    if (/ethoxylate/i.test(name)) return 'moderate';
    if (/quaternary|ammonium/i.test(name)) return 'poor';
    return 'unknown';
  }

  /**
   * Évalue la biodégradabilité globale
   */
  assessBiodegradability(analysis) {
    const surfactants = analysis.surfactants;
    if (surfactants.length === 0) return 'unknown';
    
    const scores = {
      'excellent': 100,
      'good': 80,
      'moderate': 50,
      'poor': 20,
      'unknown': 40
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    surfactants.forEach(surf => {
      const weight = surf.percentage || 10;
      totalScore += scores[surf.biodegradability || 'unknown'] * weight;
      totalWeight += weight;
    });
    
    const avgScore = totalWeight > 0 ? totalScore / totalWeight : 40;
    
    if (avgScore >= 80) return 'claimed';
    if (avgScore >= 50) return 'partial';
    return 'unknown';
  }

  /**
   * Calcule le score de santé
   */
  calculateHealthScore(clpPictograms, analysis) {
    let score = 100;
    
    // Impact des pictogrammes CLP
    clpPictograms.forEach(picto => {
      const impact = this.clpPictograms[picto];
      if (impact) {
        if (impact.healthImpact === 'critical') score -= 30;
        else if (impact.healthImpact === 'high') score -= 20;
        else if (impact.healthImpact === 'medium') score -= 10;
      }
    });
    
    // Tensioactifs irritants
    analysis.surfactants.forEach(surf => {
      if (surf.irritant) {
        score -= 10 * (surf.percentage > 10 ? 1 : 0.5);
      }
    });
    
    // Allergènes
    score -= analysis.allergens.length * 5;
    
    // Agents problématiques
    analysis.problematicComponents.forEach(comp => {
      if (comp.details?.banned) score -= 25;
      else if (comp.details?.toxic) score -= 20;
      else score -= 10;
    });
    
    // Agents blanchissants au chlore
    const chlorineBleach = analysis.bleachingAgents.filter(b => b.type === 'chlorine');
    score -= chlorineBleach.length * 15;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calcule le score environnemental
   */
  calculateEnvironmentScore(clpPictograms, analysis) {
    let score = 100;
    
    // Impact des pictogrammes CLP
    if (clpPictograms.includes('GHS09')) score -= 30;
    
    // Phosphates (impact majeur)
    if (analysis.phosphates) score -= 35;
    
    // Biodégradabilité des tensioactifs
    analysis.surfactants.forEach(surf => {
      if (surf.biodegradability === 'poor') score -= 15;
      else if (surf.biodegradability === 'moderate') score -= 8;
    });
    
    // Agents problématiques persistants
    const persistent = analysis.problematicComponents.filter(c => 
      c.concern === 'persistant' || c.details?.biodegradability === 'very poor'
    );
    score -= persistent.length * 20;
    
    // Bonus pour agents blanchissants oxygénés (plus écologiques)
    const oxygenBleach = analysis.bleachingAgents.filter(b => b.type === 'oxygen');
    if (oxygenBleach.length > 0 && analysis.bleachingAgents.length === oxygenBleach.length) {
      score += 10;
    }
    
    // Bonus pour enzymes (permettent lavage basse température)
    if (analysis.enzymes) score += 5;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Estime le pourcentage si non fourni
   */
  estimatePercentage(position) {
    if (position === 0) return 30;
    if (position === 1) return 20;
    if (position === 2) return 15;
    if (position < 5) return 10;
    return 5;
  }

  /**
   * Calcule la confiance
   */
  calculateConfidence(composition, clpPictograms, analysis) {
    let confidence = 0.5;
    
    // Plus de données = plus de confiance
    if (clpPictograms.length > 0) confidence += 0.2;
    if (composition.some(c => c.percentage !== null)) confidence += 0.15;
    if (analysis.surfactants.length > 0) confidence += 0.15;
    
    return Math.min(0.9, confidence);
  }

  /**
   * Génère des recommandations
   */
  generateRecommendations(analysis, healthScore, environmentScore) {
    const recommendations = [];
    
    // Recommandations santé
    if (healthScore < 50) {
      recommendations.push('⚠️ Produit irritant : porter des gants lors de l\'utilisation');
      recommendations.push('💨 Utiliser dans un endroit bien ventilé');
    }
    
    if (analysis.allergens.length > 0) {
      recommendations.push(`🔴 Contient ${analysis.allergens.length} allergène(s) parfumé(s)`);
    }
    
    // Recommandations environnement
    if (analysis.phosphates) {
      recommendations.push('🚫 Contient des phosphates : privilégier des alternatives sans phosphates');
    }
    
    if (environmentScore < 50) {
      recommendations.push('🌱 Impact environnemental élevé : chercher des produits écolabellisés');
    } else if (environmentScore > 80) {
      recommendations.push('✅ Bon choix écologique');
    }
    
    // Conseils d'utilisation
    if (analysis.enzymes) {
      recommendations.push('🌡️ Efficace dès 30°C grâce aux enzymes');
    }
    
    recommendations.push('📏 Respecter les doses recommandées pour limiter l\'impact');
    
    return recommendations;
  }
}

module.exports = new DetergentsAnalyzer();