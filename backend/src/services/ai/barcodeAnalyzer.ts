// PATH: backend/src/services/ai/barcodeAnalyzer.ts
import { CategoryDetector } from './categoryDetector';

export interface ProductData {
  barcode: string;
  name: string;
  category: 'alimentaire' | 'cosmetique' | 'detergent';
  ingredients?: string[];
  composition?: string;
  brand?: string;
  image_url?: string;
  found: boolean;
  generic?: boolean;
}

export interface BarcodeAnalysisResult {
  novaGroup?: number;
  riskFactors: string[];
  recommendations: string[];
  score: number;
  confidence: number;
  processingTime: number;
  metadata: {
    method: string;
    barcode: string;
    category: string;
    timestamp: string;
  };
}

export class BarcodeAnalyzer {
  
  static async analyzeProduct(
    productData: ProductData, 
    category: string
  ): Promise<BarcodeAnalysisResult> {
    const startTime = Date.now();
    
    // Pour l'instant, analyse gÃ©nÃ©rique pour tous les produits
    return this.getGenericAnalysis(productData, category, startTime);
  }

  private static getGenericAnalysis(productData: ProductData, category: string, startTime: number): BarcodeAnalysisResult {
    const prefix = productData.barcode.substring(0, 2);
    
    let score = 50;
    let riskFactors = ['Produit non trouvÃ© en base de donnÃ©es'];
    let recommendations = ['VÃ©rifiez les informations sur l\'emballage'];
    
    // Estimation basÃ©e sur la catÃ©gorie
    switch (category) {
      case 'alimentaire':
        const novaGroup = this.estimateNovaFromPrefix(prefix);
        score = (5 - novaGroup) * 20;
        riskFactors = [`Groupe NOVA estimÃ©: ${novaGroup}`];
        recommendations = ['PrivilÃ©giez les produits peu transformÃ©s'];
        break;
        
      case 'cosmetique':
        score = 60;
        riskFactors = ['Composition INCI non analysÃ©e'];
        recommendations = ['VÃ©rifiez la liste des ingrÃ©dients'];
        break;
        
      case 'detergent':
        score = 45;
        riskFactors = ['Impact environnemental non Ã©valuÃ©'];
        recommendations = ['Choisissez des produits Ã©colabellisÃ©s'];
        break;
    }

    return {
      novaGroup: category === 'alimentaire' ? this.estimateNovaFromPrefix(prefix) : undefined,
      riskFactors,
      recommendations,
      score,
      confidence: 0.5,
      processingTime: Date.now() - startTime,
      metadata: {
        method: 'generic_analysis',
        barcode: productData.barcode,
        category,
        timestamp: new Date().toISOString()
      }
    };
  }

  private static estimateNovaFromPrefix(prefix: string): number {
    const industrialPrefixes = ['30', '31', '70', '80'];
    const processedPrefixes = ['32', '33', '50', '60'];
    
    if (industrialPrefixes.includes(prefix)) return 4;
    if (processedPrefixes.includes(prefix)) return 3;
    return 2;
  }

  // MÃ©thodes pour rÃ©cupÃ©rer des produits (retournent null pour l'instant)
  static async getCosmeticProduct(barcode: string): Promise<ProductData | null> {
    console.log(`ðŸ” Recherche cosmÃ©tique: ${barcode}`);
    return null;
  }

  static async getDetergentProduct(barcode: string): Promise<ProductData | null> {
    console.log(`ðŸ” Recherche dÃ©tergent: ${barcode}`);
    return null;
  }
}
