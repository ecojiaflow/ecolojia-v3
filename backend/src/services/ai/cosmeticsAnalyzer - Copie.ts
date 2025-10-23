// PATH: backend/src/services/ai/cosmeticsAnalyzer.ts
import { Logger } from '../../utils/Logger';

const log = new Logger('CosmeticsAnalyzer');
const debug = (...a: unknown[]) => process.env.NODE_ENV !== 'production' && log.info(...a);

/* â”€â”€â”€â”€â”€ Types â”€â”€â”€â”€â”€ */
export interface INCIAnalysisResult {
  hazardScore: number; // 0-3
  endocrineDisruptors: string[];
  allergens: string[];
  naturalityScore: number; // 0-10
  safeIngredients: string[];
  problematicIngredients: Array<{
    name: string;
    concern: string;
    level: 'low' | 'medium' | 'high';
  }>;
}

/* â”€â”€â”€â”€â”€ Bases de donnÃ©es compactes â”€â”€â”€â”€â”€ */
const ED = [
  'bht', 'phenoxyethanol', 'triclosan', 'oxybenzone', 'benzophenone-3',
  'octinoxate', 'ethylhexyl methoxycinnamate', 'methylparaben', 'propylparaben',
  'butylparaben', 'diethyl phthalate', 'dbp', 'resorcinol', 'cyclopentasiloxane',
  'd5', 'cyclotetrasiloxane', 'd4'
];

const ALLERGENS = [
  'limonene', 'linalool', 'citronellol', 'geraniol', 'eugenol', 'cinnamal',
  'citral', 'farnesol', 'benzyl alcohol', 'benzyl salicylate', 'benzyl benzoate',
  'anise alcohol', 'benzyl cinnamate', 'coumarin', 'alpha-isomethyl ionone',
  'hydroxycitronellal', 'lyral', 'amyl cinnamal', 'hexyl cinnamal',
  'butylphenyl methylpropional', 'oak moss', 'tree moss'
];

const CONTROVERSIAL: Record<string, { c: string; l: 'low' | 'medium' | 'high' }> = {
  'sls': { c: 'Irritant', l: 'medium' },
  'sodium lauryl sulfate': { c: 'Irritant', l: 'medium' },
  'sodium laureth sulfate': { c: 'Irritant doux', l: 'low' },
  'peg': { c: 'ImpuretÃ©s possibles', l: 'medium' },
  'mineral oil': { c: 'ComÃ©dogÃ¨ne', l: 'low' },
  'paraffinum liquidum': { c: 'PÃ©trochimique', l: 'low' },
  'petrolatum': { c: 'PÃ©trochimique', l: 'low' },
  'dimethicone': { c: 'Silicone occlusif', l: 'low' },
  'formaldehyde': { c: 'CancÃ©rigÃ¨ne', l: 'high' },
  'dmdm hydantoin': { c: 'LibÃ¨re formaldÃ©hyde', l: 'high' },
  'imidazolidinyl urea': { c: 'LibÃ¨re formaldÃ©hyde', l: 'high' },
  'quaternium-15': { c: 'LibÃ¨re formaldÃ©hyde', l: 'high' },
  'bha': { c: 'PE potentiel', l: 'medium' },
  'toluene': { c: 'Neurotoxique', l: 'high' },
  'ammonia': { c: 'Irritant respiratoire', l: 'medium' },
  'hydroquinone': { c: 'DÃ©pigmentant controversÃ©', l: 'high' },
  'coal tar': { c: 'CancÃ©rigÃ¨ne potentiel', l: 'high' },
  'lead': { c: 'MÃ©tal lourd', l: 'high' },
  'mercury': { c: 'MÃ©tal lourd', l: 'high' }
};

const NAT = [
  'aqua', 'water', 'aloe', 'argania', 'shea', 'cocos', 'coconut',
  'helianthus', 'sunflower', 'olea', 'olive', 'glycerin', 'tocopherol',
  'vitamin', 'citric acid', 'sodium chloride', 'kaolin', 'zinc oxide'
];

/* â”€â”€â”€â”€â”€ Analyseur optimisÃ© â”€â”€â”€â”€â”€ */
export class CosmeticsAnalyzer {
  async analyzeINCI(ingredients: string[]): Promise<INCIAnalysisResult> {
    debug(`Analyse INCI: ${ingredients.length} ingrÃ©dients`);
    
    const norm = ingredients.map(i => i.toLowerCase().trim());
    
    // DÃ©tections parallÃ¨les
    const eds = this.detectED(norm);
    const algs = norm.filter(i => ALLERGENS.includes(i));
    const probs = this.detectProblematic(norm);
    const nats = this.detectNatural(norm);
    
    // Calculs
    const hazard = this.calcHazard(eds, algs, probs);
    const naturality = Math.round((nats / ingredients.length) * 10) || 0;
    
    const safe = norm.filter(i => 
      !eds.includes(i) && !algs.includes(i) && !probs.some(p => p.name === i)
    );
    
    debug(`Hazard: ${hazard}/3, NaturalitÃ©: ${naturality}/10`);
    
    return {
      hazardScore: hazard,
      endocrineDisruptors: eds,
      allergens: algs,
      naturalityScore: naturality,
      safeIngredients: safe,
      problematicIngredients: probs
    };
  }
  
  private detectED(ings: string[]): string[] {
    const found = new Set<string>();
    ings.forEach(i => {
      if (ED.some(ed => i.includes(ed)) || /paraben|phthalate/i.test(i)) {
        found.add(i);
      }
    });
    return [...found];
  }
  
  private detectProblematic(ings: string[]): Array<{ name: string; concern: string; level: 'low' | 'medium' | 'high' }> {
    const probs: any[] = [];
    
    ings.forEach(i => {
      if (CONTROVERSIAL[i]) {
        probs.push({ name: i, concern: CONTROVERSIAL[i].c, level: CONTROVERSIAL[i].l });
      } else if (/peg-\d+/i.test(i)) {
        probs.push({ name: i, concern: 'PEG dÃ©rivÃ©', level: 'medium' });
      } else if (/paraffin/i.test(i)) {
        probs.push({ name: i, concern: 'PÃ©trochimique', level: 'low' });
      } else if (/siloxane|methicone/i.test(i)) {
        probs.push({ name: i, concern: 'Silicone', level: 'low' });
      }
    });
    
    return probs;
  }
  
  private detectNatural(ings: string[]): number {
    return ings.filter(i => 
      NAT.some(n => i.includes(n)) || 
      /extract|fruit|leaf|root|seed|flower|oil|bio|natural/i.test(i)
    ).length;
  }
  
  private calcHazard(eds: string[], algs: string[], probs: any[]): number {
    let score = 0;
    score += Math.min(1.5, eds.length * 0.5);
    score += Math.min(1, probs.filter(p => p.level === 'high').length * 0.5);
    score += algs.length > 2 ? 0.5 : 0;
    score += probs.filter(p => p.level === 'medium').length > 3 ? 0.5 : 0;
    return Math.min(3, Math.round(score * 10) / 10);
  }
}

export const cosmeticsAnalyzer = new CosmeticsAnalyzer();
