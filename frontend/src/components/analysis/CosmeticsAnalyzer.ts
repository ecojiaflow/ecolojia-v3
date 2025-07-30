// src/components/analysis/CosmeticsAnalyzer.ts

import { AnalysisResult, ProductCategory } from '../../types/types';

// Interfaces pour l'analyse cosmétique
export interface InciIngredient {
  name: string;
  function: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  concerns: string[];
  alternatives?: string[];
}

export interface EndocrineDisruptor {
  name: string;
  evidenceLevel: 'SUSPECTED' | 'PROBABLE' | 'CONFIRMED';
  healthEffects: string[];
  regulatoryStatus: string;
}

export interface CosmeticAnalysisResult extends AnalysisResult {
  inciIngredients: InciIngredient[];
  endocrineDisruptors: EndocrineDisruptor[];
  allergens: string[];
  naturalnessScore: number;
  skinCompatibilityScore: number;
  recommendations: string[];
}

// Interface pour les analyses détergents
export interface DetergentAnalysisResult extends AnalysisResult {
  aquaticToxicity: {
    level: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
    toxicIngredients: string[];
  };
  biodegradability: {
    score: number;
    biodegradableRatio: number;
  };
  ecoLabels: string[];
  environmentalScore: number;
}

// Base de données d'ingrédients cosmétiques
const COSMETIC_INGREDIENTS_DB = {
  // Perturbateurs endocriniens confirmés
  endocrineDisruptors: {
    'triclosan': {
      evidenceLevel: 'CONFIRMED' as const,
      riskLevel: 'VERY_HIGH' as const,
      healthEffects: ['Perturbation thyroïdienne', 'Résistance antibiotique'],
      regulatoryStatus: 'Interdit dans l\'UE depuis 2017'
    },
    'bht': {
      evidenceLevel: 'CONFIRMED' as const,
      riskLevel: 'HIGH' as const,
      healthEffects: ['Perturbation hormonale', 'Irritation cutanée'],
      regulatoryStatus: 'Restriction concentration <0.1%'
    },
    'bha': {
      evidenceLevel: 'PROBABLE' as const,
      riskLevel: 'HIGH' as const,
      healthEffects: ['Perturbation endocrinienne', 'Potentiel cancérigène'],
      regulatoryStatus: 'Surveillé par l\'ANSES'
    },
    'parabens': {
      evidenceLevel: 'CONFIRMED' as const,
      riskLevel: 'MEDIUM' as const,
      healthEffects: ['Mimétisme œstrogénique'],
      regulatoryStatus: 'Certains interdits (propyl-, butyl-)'
    },
    'phenoxyethanol': {
      evidenceLevel: 'SUSPECTED' as const,
      riskLevel: 'MEDIUM' as const,
      healthEffects: ['Irritation cutanée', 'Toxicité système nerveux'],
      regulatoryStatus: 'Limite 1% sauf zones langes (<0.4%)'
    }
  },

  // Allergènes obligatoirement déclarés
  allergens: [
    'limonene', 'linalool', 'citronellol', 'geraniol', 'citral',
    'farnesol', 'benzyl alcohol', 'benzyl salicylate', 'alpha-isomethyl ionone',
    'coumarin', 'eugenol', 'hydroxycitronellal', 'anise alcohol',
    'benzyl cinnamate', 'cinnamyl alcohol', 'hexyl cinnamal', 'methyl 2-octynoate'
  ],

  // Ingrédients naturels valorisés
  naturalIngredients: [
    'aloe barbadensis', 'chamomilla recutita', 'calendula officinalis',
    'rosa damascena', 'lavandula angustifolia', 'argania spinosa',
    'cocos nucifera', 'butyrospermum parkii', 'simmondsia chinensis'
  ]
};

// Base de données détergents
const DETERGENT_INGREDIENTS_DB = {
  toxicSurfactants: [
    'sodium lauryl sulfate', 'sls', 'sodium laureth sulfate', 'sles',
    'nonylphenol ethoxylates', 'npe', 'linear alkylbenzene sulfonate',
    'phosphates', 'phosphonates', 'chlorine bleach'
  ],

  biodegradableIngredients: [
    'soap', 'coconut oil', 'palm oil', 'vegetable oil',
    'sodium bicarbonate', 'citric acid', 'vinegar',
    'alcohol ethoxylates', 'fatty acid derivatives'
  ]
};

// Analyseur principal cosmétiques
export class CosmeticsAnalyzer {
  private ingredientsDb = COSMETIC_INGREDIENTS_DB;

  async analyzeCosmetic(
    name: string,
    ingredients: string[],
    brand?: string,
    category?: string
  ): Promise<CosmeticAnalysisResult> {
    console.log('🧴 Analyse cosmétique:', { name, ingredientsCount: ingredients.length });

    // Parsing et analyse des ingrédients INCI
    const inciIngredients = this.parseInciIngredients(ingredients);

    // Détection perturbateurs endocriniens
    const endocrineDisruptors = this.detectEndocrineDisruptors(ingredients);

    // Détection allergènes
    const allergens = this.detectAllergens(ingredients);

    // Calcul scores
    const naturalnessScore = this.calculateNaturalnessScore(ingredients);
    const skinCompatibilityScore = this.calculateSkinCompatibilityScore(inciIngredients);
    const healthScore = this.calculateCosmeticHealthScore(
      endocrineDisruptors,
      allergens,
      skinCompatibilityScore,
      naturalnessScore
    );

    // Génération recommandations
    const recommendations = this.generateCosmeticRecommendations(
      endocrineDisruptors,
      allergens,
      naturalnessScore
    );

    return {
      productName: name,
      brand: brand || 'Non spécifié',
      category: 'cosmetics' as ProductCategory,
      healthScore,
      riskLevel: this.determineRiskLevel(healthScore),
      keyFindings: this.generateKeyFindings(endocrineDisruptors, allergens),
      inciIngredients,
      endocrineDisruptors,
      allergens,
      naturalnessScore,
      skinCompatibilityScore,
      recommendations,
      analyzedAt: new Date()
    };
  }

  private parseInciIngredients(ingredients: string[]): InciIngredient[] {
    return ingredients.map(ingredient => {
      const normalizedName = ingredient.toLowerCase().trim();
      
      // Détection fonction ingrédient
      const ingredientFunction = this.detectIngredientFunction(normalizedName);
      
      // Évaluation risque
      const riskAssessment = this.assessIngredientRisk(normalizedName);
      
      return {
        name: ingredient,
        function: ingredientFunction,
        riskLevel: riskAssessment.level,
        concerns: riskAssessment.concerns,
        alternatives: riskAssessment.alternatives
      };
    });
  }

  private detectIngredientFunction(ingredient: string): string {
    // Sulfates = tensio-actifs
    if (ingredient.includes('sulfate') || ingredient.includes('sulphate')) {
      return 'Agent nettoyant (sulfate)';
    }
    
    // Silicones
    if (ingredient.includes('siloxane') || ingredient.includes('silicone') || 
        ingredient.includes('dimethicone')) {
      return 'Agent filmogène (silicone)';
    }
    
    // Conservateurs
    if (ingredient.includes('paraben') || ingredient.includes('phenoxyethanol') ||
        ingredient.includes('benzyl alcohol') || ingredient.includes('sorbate')) {
      return 'Conservateur';
    }
    
    // Parfums
    if (ingredient.includes('parfum') || ingredient.includes('fragrance') ||
        this.ingredientsDb.allergens.some(allergen => ingredient.includes(allergen))) {
      return 'Parfum/Fragrance';
    }
    
    // Émulsifiants
    if (ingredient.includes('cetyl') || ingredient.includes('stearyl') ||
        ingredient.includes('glycol') || ingredient.includes('polysorbate')) {
      return 'Émulsifiant';
    }
    
    // Huiles naturelles
    if (ingredient.includes('oil') || ingredient.includes('butter') ||
        this.ingredientsDb.naturalIngredients.some(natural => ingredient.includes(natural))) {
      return 'Émollient naturel';
    }
    
    return 'Fonction non identifiée';
  }

  private assessIngredientRisk(ingredient: string): {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    concerns: string[];
    alternatives: string[];
  } {
    // Vérification perturbateurs endocriniens
    for (const [name, data] of Object.entries(this.ingredientsDb.endocrineDisruptors)) {
      if (ingredient.includes(name)) {
        return {
          level: data.riskLevel,
          concerns: [...data.healthEffects, data.regulatoryStatus],
          alternatives: ['Alternatives naturelles certifiées bio', 'Ingrédients sans PE']
        };
      }
    }
    
    // Sulfates - irritants
    if (ingredient.includes('sodium lauryl sulfate') || ingredient.includes('sls')) {
      return {
        level: 'HIGH',
        concerns: ['Irritation cutanée', 'Dessèchement peau'],
        alternatives: ['Coco-glucoside', 'Décyl glucoside', 'Tensio-actifs doux']
      };
    }
    
    // Silicones - occlusion
    if (ingredient.includes('siloxane') || ingredient.includes('dimethicone')) {
      return {
        level: 'MEDIUM',
        concerns: ['Occlusion pores', 'Accumulation sur cheveux'],
        alternatives: ['Huiles végétales', 'Beurres naturels']
      };
    }
    
    // Allergènes parfum
    if (this.ingredientsDb.allergens.some(allergen => ingredient.includes(allergen))) {
      return {
        level: 'MEDIUM',
        concerns: ['Réaction allergique possible', 'Sensibilisation cutanée'],
        alternatives: ['Parfums hypoallergéniques', 'Huiles essentielles diluées']
      };
    }
    
    // Ingrédients naturels
    if (this.ingredientsDb.naturalIngredients.some(natural => ingredient.includes(natural))) {
      return {
        level: 'LOW',
        concerns: [],
        alternatives: []
      };
    }
    
    return {
      level: 'LOW',
      concerns: [],
      alternatives: []
    };
  }

  private detectEndocrineDisruptors(ingredients: string[]): EndocrineDisruptor[] {
    const detected: EndocrineDisruptor[] = [];
    
    for (const ingredient of ingredients) {
      const normalized = ingredient.toLowerCase();
      
      for (const [name, data] of Object.entries(this.ingredientsDb.endocrineDisruptors)) {
        if (normalized.includes(name)) {
          detected.push({
            name: ingredient,
            evidenceLevel: data.evidenceLevel,
            healthEffects: data.healthEffects,
            regulatoryStatus: data.regulatoryStatus
          });
        }
      }
    }
    
    return detected;
  }

  private detectAllergens(ingredients: string[]): string[] {
    const detected: string[] = [];
    
    for (const ingredient of ingredients) {
      const normalized = ingredient.toLowerCase();
      
      for (const allergen of this.ingredientsDb.allergens) {
        if (normalized.includes(allergen)) {
          detected.push(ingredient);
        }
      }
    }
    
    return detected;
  }

  private calculateNaturalnessScore(ingredients: string[]): number {
    let naturalCount = 0;
    let syntheticCount = 0;
    
    for (const ingredient of ingredients) {
      const normalized = ingredient.toLowerCase();
      
      // Ingrédients naturels
      if (this.ingredientsDb.naturalIngredients.some(natural => normalized.includes(natural)) ||
          normalized.includes('oil') || normalized.includes('extract') ||
          normalized.includes('butter') || normalized.includes('wax')) {
        naturalCount++;
      }
      // Ingrédients synthétiques
      else if (normalized.includes('sulfate') || normalized.includes('siloxane') ||
               normalized.includes('paraben') || normalized.includes('glycol') ||
               normalized.includes('peg-') || normalized.includes('polysorbate')) {
        syntheticCount++;
      }
    }
    
    const totalRelevant = naturalCount + syntheticCount;
    if (totalRelevant === 0) return 5; // Score neutre si aucun détecté
    
    const naturalRatio = naturalCount / totalRelevant;
    return Math.round(naturalRatio * 10);
  }

  private calculateSkinCompatibilityScore(inciIngredients: InciIngredient[]): number {
    let score = 10;
    
    for (const ingredient of inciIngredients) {
      switch (ingredient.riskLevel) {
        case 'VERY_HIGH':
          score -= 3;
          break;
        case 'HIGH':
          score -= 2;
          break;
        case 'MEDIUM':
          score -= 1;
          break;
        case 'LOW':
          // Pas de pénalité
          break;
      }
    }
    
    return Math.max(0, Math.min(10, score));
  }

  private calculateCosmeticHealthScore(
    endocrineDisruptors: EndocrineDisruptor[],
    allergens: string[],
    skinCompatibility: number,
    naturalness: number
  ): number {
    let score = 100;
    
    // Pénalité perturbateurs endocriniens (très sévère)
    for (const disruptor of endocrineDisruptors) {
      switch (disruptor.evidenceLevel) {
        case 'CONFIRMED':
          score -= 25;
          break;
        case 'PROBABLE':
          score -= 15;
          break;
        case 'SUSPECTED':
          score -= 8;
          break;
      }
    }
    
    // Pénalité allergènes
    score -= allergens.length * 5;
    
    // Facteur compatibilité cutanée
    score -= (10 - skinCompatibility) * 3;
    
    // Bonus naturalité
    score += (naturalness - 5) * 2;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private generateCosmeticRecommendations(
    endocrineDisruptors: EndocrineDisruptor[],
    allergens: string[],
    naturalness: number
  ): string[] {
    const recommendations = [];
    
    if (endocrineDisruptors.length > 0) {
      recommendations.push('Éviter les perturbateurs endocriniens identifiés');
      recommendations.push('Privilégier les cosmétiques certifiés sans PE');
    }
    
    if (allergens.length > 0) {
      recommendations.push('Tester le produit avant utilisation complète');
      recommendations.push('Consulter un dermatologue en cas de réaction');
    }
    
    if (naturalness < 5) {
      recommendations.push('Choisir des formules plus naturelles');
      recommendations.push('Vérifier les certifications bio');
    }
    
    return recommendations;
  }

  private generateKeyFindings(endocrineDisruptors: EndocrineDisruptor[], allergens: string[]): string[] {
    const findings = [];
    
    if (endocrineDisruptors.length > 0) {
      findings.push(`${endocrineDisruptors.length} perturbateur(s) endocrinien(s) détecté(s)`);
    }
    
    if (allergens.length > 0) {
      findings.push(`${allergens.length} allergène(s) obligatoire(s) présent(s)`);
    }
    
    if (findings.length === 0) {
      findings.push('Composition globalement acceptable');
    }
    
    return findings;
  }

  private determineRiskLevel(score: number): string {
    if (score >= 80) return 'FAIBLE';
    if (score >= 60) return 'MODÉRÉ';
    if (score >= 40) return 'ÉLEVÉ';
    return 'TRÈS ÉLEVÉ';
  }
}

// Analyseur détergents
export class DetergentsAnalyzer {
  private ingredientsDb = DETERGENT_INGREDIENTS_DB;

  async analyzeDetergent(
    name: string,
    ingredients: string[],
    brand?: string
  ): Promise<DetergentAnalysisResult> {
    console.log('🧽 Analyse détergent:', { name, ingredientsCount: ingredients.length });

    // Analyse toxicité aquatique
    const aquaticToxicity = this.analyzeAquaticToxicity(ingredients);

    // Analyse biodégradabilité
    const biodegradability = this.analyzeBiodegradability(ingredients);

    // Détection labels écologiques
    const ecoLabels = this.detectEcoLabels(name);

    // Calcul scores
    const environmentalScore = this.calculateEnvironmentalScore(aquaticToxicity, biodegradability, ecoLabels);
    const healthScore = this.calculateDetergentHealthScore(aquaticToxicity, ingredients);

    return {
      productName: name,
      brand: brand || 'Non spécifié',
      category: 'detergents' as ProductCategory,
      healthScore,
      environmentalScore,
      riskLevel: this.determineRiskLevel(Math.min(healthScore, environmentalScore)),
      keyFindings: this.generateDetergentKeyFindings(aquaticToxicity, biodegradability),
      aquaticToxicity,
      biodegradability,
      ecoLabels,
      analyzedAt: new Date()
    };
  }

  private analyzeAquaticToxicity(ingredients: string[]): {
    level: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
    toxicIngredients: string[];
  } {
    const toxicIngredients: string[] = [];
    let toxicityScore = 0;

    for (const ingredient of ingredients) {
      const normalized = ingredient.toLowerCase();
      
      for (const toxic of this.ingredientsDb.toxicSurfactants) {
        if (normalized.includes(toxic)) {
          toxicIngredients.push(ingredient);
          toxicityScore += toxic === 'phosphates' ? 3 : 2;
        }
      }
    }

    const level = toxicityScore === 0 ? 'LOW' :
                 toxicityScore <= 2 ? 'MODERATE' :
                 toxicityScore <= 5 ? 'HIGH' : 'VERY_HIGH';

    return {
      level,
      toxicIngredients: [...new Set(toxicIngredients)]
    };
  }

  private analyzeBiodegradability(ingredients: string[]): {
    score: number;
    biodegradableRatio: number;
  } {
    let biodegradableCount = 0;

    for (const ingredient of ingredients) {
      const normalized = ingredient.toLowerCase();
      
      for (const biodegradable of this.ingredientsDb.biodegradableIngredients) {
        if (normalized.includes(biodegradable)) {
          biodegradableCount++;
          break;
        }
      }
    }

    const ratio = ingredients.length > 0 ? (biodegradableCount / ingredients.length) : 0;
    const score = Math.round(ratio * 10);

    return {
      score,
      biodegradableRatio: Math.round(ratio * 100)
    };
  }

  private detectEcoLabels(productName: string): string[] {
    const labels: string[] = [];
    const productText = productName.toLowerCase();

    if (productText.includes('ecolabel') || productText.includes('eco-label')) {
      labels.push('Ecolabel Européen');
    }
    if (productText.includes('ecocert')) {
      labels.push('Ecocert');
    }
    if (productText.includes('nature') || productText.includes('bio')) {
      labels.push('Nature & Progrès');
    }

    return labels;
  }

  private calculateEnvironmentalScore(
    aquaticToxicity: any,
    biodegradability: any,
    ecoLabels: string[]
  ): number {
    let score = 100;

    // Pénalités toxicité aquatique
    const toxicityPenalties = {
      'LOW': 0,
      'MODERATE': -15,
      'HIGH': -35,
      'VERY_HIGH': -60
    };
    score += toxicityPenalties[aquaticToxicity.level];

    // Bonus biodégradabilité
    score += (biodegradability.score - 5) * 4;

    // Bonus labels écologiques
    score += ecoLabels.length * 10;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateDetergentHealthScore(aquaticToxicity: any, ingredients: string[]): number {
    let score = 85; // Score de base plus élevé pour détergents

    // Pénalités pour toxicité (impact indirect sur santé)
    const healthPenalties = {
      'LOW': 0,
      'MODERATE': -5,
      'HIGH': -15,
      'VERY_HIGH': -25
    };
    score += healthPenalties[aquaticToxicity.level];

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private generateDetergentKeyFindings(aquaticToxicity: any, biodegradability: any): string[] {
    const findings = [];
    
    if (aquaticToxicity.level !== 'LOW') {
      findings.push(`Toxicité aquatique ${aquaticToxicity.level.toLowerCase()}`);
    }
    
    if (biodegradability.score < 5) {
      findings.push('Biodégradabilité limitée');
    } else {
      findings.push('Bonne biodégradabilité');
    }
    
    return findings;
  }

  private determineRiskLevel(score: number): string {
    if (score >= 80) return 'FAIBLE';
    if (score >= 60) return 'MODÉRÉ';
    if (score >= 40) return 'ÉLEVÉ';
    return 'TRÈS ÉLEVÉ';
  }
}