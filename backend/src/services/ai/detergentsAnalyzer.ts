// PATH: backend/src/services/ai/detergentsAnalyzer.ts
import { Logger } from '../../utils/Logger';

const log = new Logger('DetergentsAnalyzer');
const debug = (...a: unknown[]) => process.env.NODE_ENV !== 'production' && log.info(...a);

/* â”€â”€â”€â”€â”€ Types â”€â”€â”€â”€â”€ */
export interface DetergentAnalysisResult {
  aquaticToxicity: number; // 0-10
  biodegradability: number; // 0-100%
  vocEmissions: number; // 0-10
  hasEcoLabel: boolean;
  safeIngredients: string[];
  dangerousIngredients: Array<{
    name: string;
    concern: string;
    impact: 'low' | 'medium' | 'high';
  }>;
  environmentalScore: number; // 0-100
}

/* â”€â”€â”€â”€â”€ DonnÃ©es compactes â”€â”€â”€â”€â”€ */
const SURF: Record<string, { b: number; t: number }> = {
  'sodium laureth sulfate': { b: 85, t: 6 },
  'sodium lauryl sulfate': { b: 90, t: 7 },
  'cocamidopropyl betaine': { b: 95, t: 3 },
  'sodium coco-sulfate': { b: 98, t: 2 },
  'decyl glucoside': { b: 100, t: 1 },
  'lauryl glucoside': { b: 100, t: 1 },
  'alkyl polyglucoside': { b: 100, t: 2 },
  'linear alkylbenzene sulfonate': { b: 95, t: 5 },
  'alcohol ethoxylate': { b: 90, t: 4 }
};

const VOC = [
  'limonene', 'd-limonene', 'ethanol', 'alcohol', 'isopropanol',
  'benzyl alcohol', 'terpineol', 'linalool', 'citral', 'eucalyptol',
  'menthol', 'camphor', 'pine oil', 'orange oil', 'lemon oil'
];

const HAZ: Record<string, { c: string; t: number; i: 'low' | 'medium' | 'high' }> = {
  'phosphates': { c: 'Eutrophisation', t: 8, i: 'high' },
  'phosphoric acid': { c: 'Acidification', t: 7, i: 'high' },
  'edta': { c: 'ChÃ©lateur persistant', t: 6, i: 'medium' },
  'nta': { c: 'ChÃ©lateur risquÃ©', t: 5, i: 'medium' },
  'optical brighteners': { c: 'Polluants persistants', t: 6, i: 'medium' },
  'benzisothiazolinone': { c: 'Biocide toxique', t: 8, i: 'high' },
  'methylisothiazolinone': { c: 'Biocide trÃ¨s toxique', t: 9, i: 'high' },
  'formaldehyde': { c: 'CancÃ©rigÃ¨ne', t: 9, i: 'high' },
  'chlorine bleach': { c: 'ChlorÃ©s toxiques', t: 8, i: 'high' },
  'ammonia': { c: 'Toxique aquatique', t: 7, i: 'high' },
  'quaternary ammonium': { c: 'Biocide persistant', t: 7, i: 'medium' },
  'triclosan': { c: 'PE aquatique', t: 9, i: 'high' }
};

const ECO = [
  'sodium bicarbonate', 'baking soda', 'sodium carbonate', 'citric acid',
  'vinegar', 'acetic acid', 'hydrogen peroxide', 'sodium percarbonate',
  'vegetable soap', 'castile soap', 'enzymes', 'lactic acid'
];

const LABELS = ['ecolabel', 'ecocert', 'nature', 'nordic swan', 'green seal'];

/* â”€â”€â”€â”€â”€ Analyseur optimisÃ© â”€â”€â”€â”€â”€ */
export class DetergentsAnalyzer {
  async analyze(ingredients: string[], desc?: string): Promise<DetergentAnalysisResult> {
    debug(`Analyse: ${ingredients.length} ingrÃ©dients`);
    
    const norm = ingredients.map(i => i.toLowerCase().trim());
    const descLow = desc?.toLowerCase() || '';
    
    // Calculs parallÃ¨les
    const aquaTox = this.calcAquaTox(norm);
    const biodeg = this.calcBiodeg(norm);
    const voc = this.calcVOC(norm);
    const ecoLabel = LABELS.some(l => descLow.includes(l) || norm.join(' ').includes(l));
    const dangerous = this.detectDangerous(norm);
    const safe = norm.filter(i => 
      ECO.includes(i) || (!dangerous.some(d => d.name === i) && !VOC.includes(i))
    );
    
    // Score environnemental (pondÃ©rÃ©)
    const envScore = Math.round(
      (10 - aquaTox) * 3 + // 30pts
      biodeg * 0.4 + // 40pts
      (10 - voc) * 2 + // 20pts
      (ecoLabel ? 10 : 0) // 10pts bonus
    );
    
    debug(`Env: ${envScore}/100, Tox: ${aquaTox}, Bio: ${biodeg}%`);
    
    return {
      aquaticToxicity: aquaTox,
      biodegradability: biodeg,
      vocEmissions: voc,
      hasEcoLabel: ecoLabel,
      safeIngredients: safe,
      dangerousIngredients: dangerous,
      environmentalScore: Math.min(100, Math.max(0, envScore))
    };
  }
  
  private calcAquaTox(ings: string[]): number {
    let tot = 0, cnt = 0;
    
    ings.forEach(i => {
      // Tensioactifs
      Object.entries(SURF).forEach(([s, d]) => {
        if (i.includes(s)) { tot += d.t; cnt++; }
      });
      // Hazardous
      Object.entries(HAZ).forEach(([h, d]) => {
        if (i.includes(h)) { tot += d.t; cnt++; }
      });
    });
    
    if (!cnt) return 2;
    let avg = tot / cnt;
    
    // Bonus Ã©co
    const ecoCount = ings.filter(i => ECO.some(e => i.includes(e))).length;
    if (ecoCount > ings.length / 2) avg = Math.max(0, avg - 2);
    
    return Math.min(10, Math.round(avg * 10) / 10);
  }
  
  private calcBiodeg(ings: string[]): number {
    let tot = 0, cnt = 0;
    
    ings.forEach(i => {
      // Tensioactifs
      const surf = Object.entries(SURF).find(([s]) => i.includes(s));
      if (surf) { tot += surf[1].b; cnt++; }
      // Ã‰co = 100%
      else if (ECO.some(e => i.includes(e))) { tot += 100; cnt++; }
      // Hazardous = 30%
      else if (Object.keys(HAZ).some(h => i.includes(h))) { tot += 30; cnt++; }
    });
    
    return cnt ? Math.round(tot / cnt) : 80;
  }
  
  private calcVOC(ings: string[]): number {
    const pct = (ings.filter(i => VOC.includes(i)).length / ings.length) * 100;
    if (pct === 0) return 0;
    if (pct < 5) return 2;
    if (pct < 10) return 4;
    if (pct < 20) return 6;
    if (pct < 30) return 8;
    return 10;
  }
  
  private detectDangerous(ings: string[]): Array<{ name: string; concern: string; impact: 'low' | 'medium' | 'high' }> {
    const danger: any[] = [];
    
    ings.forEach(i => {
      const haz = Object.entries(HAZ).find(([h]) => i.includes(h));
      if (haz) {
        danger.push({
          name: i,
          concern: haz[1].c,
          impact: haz[1].i
        });
      }
    });
    
    return danger;
  }
}

export const detergentsAnalyzer = new DetergentsAnalyzer();
