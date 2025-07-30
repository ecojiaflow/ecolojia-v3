// PATH: frontend/src/services/novaAdapter.ts
import { AnalyzeResponse } from '../api/realApi';
import { NovaAnalysisResult } from './api';

export interface NovaAdaptedResult {
  success: boolean;
  data?: {
    product: {
      name: string;
      category: string;
      novaGroup: number;
      score: number;
      ultraProcessedMarkers: string[];
      additives: Array<{
        code: string;
        name: string;
        category: string;
        riskLevel: 'low' | 'medium' | 'high';
      }>;
      recommendation: {
        type: 'replace' | 'moderate' | 'enjoy';
        message: string;
        alternatives?: string[];
      };
      scientificSources: string[];
    };
    analysis: {
      timestamp: string;
      processingTime: number;
      confidence: number;
    };
  };
  error?: string;
}

export class NovaAdapter {
  static adaptAnalysisToNova(
    response: AnalyzeResponse, 
    productName: string = 'Produit analysé',
    processingTime: number = 1500
  ): NovaAdaptedResult {
    try {
      const { analysis, alternatives, insights, auto_detection } = response;

      // Extraction des additifs depuis les données existantes
      const additives = (analysis.additives || []).map(additive => ({
        code: additive,
        name: this.getAdditiveFullName(additive),
        category: this.getAdditiveCategory(additive),
        riskLevel: this.getAdditiveRiskLevel(additive)
      }));

      // Extraction des marqueurs d'ultra-transformation
      const ultraProcessedMarkers = this.extractUltraProcessedMarkers(analysis, additives);

      // Détermination du type de recommandation
      const recommendation = this.generateRecommendation(
        analysis.score,
        analysis.nova_group || 4,
        alternatives
      );

      // Sources scientifiques basées sur le type détecté
      const scientificSources = this.getScientificSources(auto_detection.detected_type);

      return {
        success: true,
        data: {
          product: {
            name: productName,
            category: this.getCategoryFromType(auto_detection.detected_type),
            novaGroup: analysis.nova_group || this.estimateNovaFromScore(analysis.score),
            score: Math.round(analysis.score),
            ultraProcessedMarkers,
            additives,
            recommendation,
            scientificSources
          },
          analysis: {
            timestamp: new Date().toISOString(),
            processingTime,
            confidence: auto_detection.confidence
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'adaptation des données'
      };
    }
  }

  private static getAdditiveFullName(code: string): string {
    const additiveMap: Record<string, string> = {
      'E100': 'Curcumine',
      'E101': 'Riboflavine',
      'E102': 'Tartrazine',
      'E104': 'Jaune de quinoléine',
      'E110': 'Jaune orange S',
      'E120': 'Cochenille',
      'E122': 'Azorubine',
      'E124': 'Ponceau 4R',
      'E129': 'Rouge allura AC',
      'E131': 'Bleu patenté V',
      'E132': 'Indigotine',
      'E133': 'Bleu brillant FCF',
      'E140': 'Chlorophylles',
      'E141': 'Complexes cuivriques des chlorophylles',
      'E150a': 'Caramel I',
      'E150b': 'Caramel II',
      'E150c': 'Caramel III',
      'E150d': 'Caramel IV',
      'E151': 'Noir brillant BN',
      'E160a': 'Carotènes',
      'E160b': 'Rocou',
      'E160c': 'Extrait de paprika',
      'E161b': 'Lutéine',
      'E162': 'Rouge de betterave',
      'E163': 'Anthocyanes',
      'E170': 'Carbonate de calcium',
      'E171': 'Dioxyde de titane',
      'E172': 'Oxydes de fer',
      'E200': 'Acide sorbique',
      'E202': 'Sorbate de potassium',
      'E211': 'Benzoate de sodium',
      'E220': 'Dioxyde de soufre',
      'E250': 'Nitrite de sodium',
      'E251': 'Nitrate de sodium',
      'E300': 'Acide ascorbique',
      'E301': 'Ascorbate de sodium',
      'E302': 'Ascorbate de calcium',
      'E306': 'Tocophérols',
      'E307': 'Alpha-tocophérol',
      'E308': 'Gamma-tocophérol',
      'E309': 'Delta-tocophérol',
      'E310': 'Gallate de propyle',
      'E311': 'Gallate d\'octyle',
      'E312': 'Gallate de dodécyle',
      'E320': 'Butylhydroxyanisol',
      'E321': 'Butylhydroxytoluène',
      'E322': 'Lécithines',
      'E330': 'Acide citrique',
      'E331': 'Citrates de sodium',
      'E332': 'Citrates de potassium',
      'E333': 'Citrates de calcium',
      'E334': 'Acide tartrique',
      'E335': 'Tartrates de sodium',
      'E336': 'Tartrates de potassium',
      'E337': 'Tartrate double de sodium et de potassium',
      'E338': 'Acide phosphorique',
      'E339': 'Phosphates de sodium',
      'E340': 'Phosphates de potassium',
      'E341': 'Phosphates de calcium',
      'E400': 'Acide alginique',
      'E401': 'Alginate de sodium',
      'E402': 'Alginate de potassium',
      'E403': 'Alginate d\'ammonium',
      'E404': 'Alginate de calcium',
      'E405': 'Alginate de propylène glycol',
      'E406': 'Agar-agar',
      'E407': 'Carraghénanes',
      'E410': 'Gomme de caroube',
      'E412': 'Gomme de guar',
      'E413': 'Gomme adragante',
      'E414': 'Gomme arabique',
      'E415': 'Gomme xanthane',
      'E416': 'Gomme karaya',
      'E417': 'Gomme tara',
      'E418': 'Gomme gellane',
      'E420': 'Sorbitol',
      'E421': 'Mannitol',
      'E422': 'Glycérol',
      'E450': 'Diphosphates',
      'E451': 'Triphosphates',
      'E452': 'Polyphosphates',
      'E460': 'Cellulose',
      'E461': 'Méthylcellulose',
      'E462': 'Éthylcellulose',
      'E463': 'Hydroxypropylcellulose',
      'E464': 'Hydroxypropylméthylcellulose',
      'E465': 'Éthylméthylcellulose',
      'E466': 'Carboxyméthylcellulose',
      'E470a': 'Sels de sodium, de potassium et de calcium d\'acides gras',
      'E470b': 'Sels de magnésium d\'acides gras',
      'E471': 'Mono- et diglycérides d\'acides gras',
      'E472a': 'Esters acétiques des mono- et diglycérides d\'acides gras',
      'E472b': 'Esters lactiques des mono- et diglycérides d\'acides gras',
      'E472c': 'Esters citriques des mono- et diglycérides d\'acides gras',
      'E472d': 'Esters tartriques des mono- et diglycérides d\'acides gras',
      'E472e': 'Esters monoacétyltartriques et diacétyltartriques des mono- et diglycérides d\'acides gras',
      'E472f': 'Esters mixtes acétiques et tartriques des mono- et diglycérides d\'acides gras',
      'E473': 'Sucroesters d\'acides gras',
      'E474': 'Sucroglycérides',
      'E475': 'Esters polyglycériques d\'acides gras',
      'E476': 'Polyricinoléate de polyglycérol',
      'E477': 'Esters de propylène glycol d\'acides gras',
      'E479b': 'Huile de soja oxydée thermiquement',
      'E481': 'Stéaroyl-2-lactylate de sodium',
      'E482': 'Stéaroyl-2-lactylate de calcium',
      'E483': 'Tartrate de stéaryle',
      'E491': 'Monostéarate de sorbitane',
      'E492': 'Tristéarate de sorbitane',
      'E493': 'Monolaurate de sorbitane',
      'E494': 'Monooléate de sorbitane',
      'E495': 'Monopalmitate de sorbitane',
      'E500': 'Carbonates de sodium',
      'E501': 'Carbonates de potassium',
      'E503': 'Carbonates d\'ammonium',
      'E504': 'Carbonates de magnésium',
      'E507': 'Acide chlorhydrique',
      'E508': 'Chlorure de potassium',
      'E509': 'Chlorure de calcium',
      'E511': 'Chlorure de magnésium',
      'E512': 'Chlorure d\'étain',
      'E513': 'Acide sulfurique',
      'E514': 'Sulfates de sodium',
      'E515': 'Sulfates de potassium',
      'E516': 'Sulfate de calcium',
      'E517': 'Sulfate d\'ammonium',
      'E520': 'Sulfate d\'aluminium',
      'E521': 'Sulfate d\'aluminium sodique',
      'E522': 'Sulfate d\'aluminium potassique',
      'E523': 'Sulfate d\'aluminium ammonique',
      'E524': 'Hydroxyde de sodium',
      'E525': 'Hydroxyde de potassium',
      'E526': 'Hydroxyde de calcium',
      'E527': 'Hydroxyde d\'ammonium',
      'E528': 'Hydroxyde de magnésium',
      'E529': 'Oxyde de calcium',
      'E530': 'Oxyde de magnésium',
      'E535': 'Ferrocyanure de sodium',
      'E536': 'Ferrocyanure de potassium',
      'E538': 'Ferrocyanure de calcium',
      'E541': 'Phosphate d\'aluminium sodique',
      'E551': 'Dioxyde de silicium',
      'E552': 'Silicate de calcium',
      'E553a': 'Silicate de magnésium',
      'E553b': 'Talc',
      'E554': 'Silicate d\'aluminium sodique',
      'E555': 'Silicate d\'aluminium potassique',
      'E556': 'Silicate d\'aluminium calcique',
      'E558': 'Bentonite',
      'E559': 'Silicate d\'aluminium',
      'E570': 'Acides gras',
      'E574': 'Acide gluconique',
      'E575': 'Glucono-delta-lactone',
      'E576': 'Gluconate de sodium',
      'E577': 'Gluconate de potassium',
      'E578': 'Gluconate de calcium',
      'E579': 'Gluconate ferreux',
      'E585': 'Lactate ferreux',
      'E620': 'Acide glutamique',
      'E621': 'Glutamate monosodique',
      'E622': 'Glutamate monopotassique',
      'E623': 'Glutamate de calcium',
      'E624': 'Glutamate monoammonique',
      'E625': 'Glutamate de magnésium',
      'E626': 'Acide guanylique',
      'E627': 'Guanylate disodique',
      'E628': 'Guanylate dipotassique',
      'E629': 'Guanylate de calcium',
      'E630': 'Acide inosinique',
      'E631': 'Inosinate disodique',
      'E632': 'Inosinate dipotassique',
      'E633': 'Inosinate de calcium',
      'E634': '5\'-ribonucléotides calciques',
      'E635': '5\'-ribonucléotides disodiques',
      'E640': 'Glycine et son sel de sodium',
      'E641': 'L-leucine',
      'E650': 'Acétate de zinc',
      'E900': 'Diméthylpolysiloxane',
      'E901': 'Cire d\'abeille',
      'E902': 'Cire de Candelilla',
      'E903': 'Cire de carnauba',
      'E904': 'Gomme-laque',
      'E905': 'Paraffine',
      'E912': 'Esters de l\'acide montanique',
      'E914': 'Cire de polyéthylène oxydée',
      'E920': 'L-cystéine',
      'E927b': 'Carbamide',
      'E938': 'Argon',
      'E939': 'Hélium',
      'E940': 'Dichlorodifluorométhane',
      'E941': 'Azote',
      'E942': 'Protoxyde d\'azote',
      'E943a': 'Butane',
      'E943b': 'Isobutane',
      'E944': 'Propane',
      'E948': 'Oxygène',
      'E949': 'Hydrogène',
      'E950': 'Acésulfame potassium',
      'E951': 'Aspartame',
      'E952': 'Cyclamate',
      'E954': 'Saccharine',
      'E955': 'Sucralose',
      'E957': 'Thaumatine',
      'E959': 'Néohespéridine DC',
      'E960': 'Glycosides de stéviol',
      'E961': 'Néotame',
      'E962': 'Sel d\'aspartame-acésulfame',
      'E965': 'Maltitol',
      'E966': 'Lactitol',
      'E967': 'Xylitol',
      'E968': 'Érythritol',
      'E999': 'Extrait de quillaia'
    };

    return additiveMap[code] || code;
  }

  private static getAdditiveCategory(code: string): string {
    if (code.startsWith('E1') || code.startsWith('E2')) return 'Colorant';
    if (code.startsWith('E2') || code.startsWith('E3')) return 'Conservateur';
    if (code.startsWith('E3')) return 'Antioxydant';
    if (code.startsWith('E4')) return 'Texturant';
    if (code.startsWith('E5')) return 'Régulateur d\'acidité';
    if (code.startsWith('E6')) return 'Exhausteur de goût';
    if (code.startsWith('E9')) return 'Agent d\'enrobage';
    return 'Additif alimentaire';
  }

  private static getAdditiveRiskLevel(code: string): 'low' | 'medium' | 'high' {
    const highRiskAdditives = [
      'E102', 'E104', 'E110', 'E122', 'E124', 'E129', 'E131', 'E132', 'E133',
      'E150c', 'E150d', 'E151', 'E171', 'E220', 'E249', 'E250', 'E251', 'E252',
      'E310', 'E311', 'E312', 'E320', 'E321', 'E407', 'E621', 'E951', 'E952'
    ];
    
    const mediumRiskAdditives = [
      'E100', 'E120', 'E140', 'E141', 'E160a', 'E160b', 'E200', 'E202', 'E211',
      'E330', 'E331', 'E332', 'E333', 'E338', 'E339', 'E340', 'E341', 'E450',
      'E451', 'E452', 'E471', 'E472a', 'E472b', 'E472c', 'E950', 'E954', 'E955'
    ];

    if (highRiskAdditives.includes(code)) return 'high';
    if (mediumRiskAdditives.includes(code)) return 'medium';
    return 'low';
  }

  private static extractUltraProcessedMarkers(analysis: any, additives: any[]): string[] {
    const markers: string[] = [];

    // Marqueurs basés sur les additifs détectés
    const highRiskAdditives = additives.filter(a => a.riskLevel === 'high');
    if (highRiskAdditives.length > 0) {
      markers.push(`${highRiskAdditives.length} additif(s) à risque élevé`);
    }

    // Marqueurs basés sur le score NOVA
    if (analysis.nova_group === 4) {
      markers.push('Aliment ultra-transformé (NOVA 4)');
    }

    // Marqueurs basés sur le score global
    if (analysis.score < 30) {
      markers.push('Score nutritionnel très faible');
    }

    // Marqueurs spécifiques aux types de transformation
    if (analysis.breakdown) {
      if (analysis.breakdown.processing < 20) {
        markers.push('Haut niveau de transformation industrielle');
      }
      if (analysis.breakdown.health < 30) {
        markers.push('Impact santé préoccupant');
      }
    }

    return markers;
  }

  private static generateRecommendation(
    score: number, 
    novaGroup: number, 
    alternatives: any[]
  ): { type: 'replace' | 'moderate' | 'enjoy'; message: string; alternatives?: string[] } {
    const altNames = alternatives.slice(0, 3).map(alt => alt.name);

    if (score < 30 || novaGroup === 4) {
      return {
        type: 'replace',
        message: 'Ce produit présente de nombreux marqueurs d\'ultra-transformation. Nous recommandons de le remplacer par des alternatives plus naturelles.',
        alternatives: altNames.length > 0 ? altNames : [
          'Produits biologiques équivalents',
          'Préparations maison',
          'Alternatives sans additifs'
        ]
      };
    }

    if (score < 60 || novaGroup === 3) {
      return {
        type: 'moderate',
        message: 'Ce produit peut être consommé occasionnellement. Privilégiez une consommation modérée et équilibrée.',
        alternatives: altNames.length > 0 ? altNames : undefined
      };
    }

    return {
      type: 'enjoy',
      message: 'Ce produit présente un profil nutritionnel acceptable. Vous pouvez en profiter dans le cadre d\'une alimentation équilibrée.',
      alternatives: altNames.length > 0 ? altNames : undefined
    };
  }

  private static estimateNovaFromScore(score: number): number {
    if (score >= 80) return 1;
    if (score >= 60) return 2;
    if (score >= 40) return 3;
    return 4;
  }

  private static getCategoryFromType(type: 'food' | 'cosmetic' | 'detergent'): string {
    switch (type) {
      case 'food': return 'Alimentaire';
      case 'cosmetic': return 'Cosmétique';
      case 'detergent': return 'Produit ménager';
      default: return 'Indéterminé';
    }
  }

  private static getScientificSources(type: 'food' | 'cosmetic' | 'detergent'): string[] {
    const commonSources = [
      'Classification NOVA - INSERM 2024',
      'Règlement (CE) n° 1333/2008 sur les additifs alimentaires',
      'Base de données EFSA (Autorité européenne de sécurité des aliments)'
    ];

    switch (type) {
      case 'food':
        return [
          ...commonSources,
          'Programme National Nutrition Santé (PNNS)',
          'Étude NutriNet-Santé - EREN',
          'Recommandations nutritionnelles ANSES 2024'
        ];
      case 'cosmetic':
        return [
          'Règlement (CE) n° 1223/2009 relatif aux produits cosmétiques',
          'Base de données CosIng (Commission européenne)',
          'Évaluations SCCS (Comité scientifique pour la sécurité des consommateurs)'
        ];
      case 'detergent':
        return [
          'Règlement (CE) n° 648/2004 relatif aux détergents',
          'Classification CLP (Classification, étiquetage et emballage)',
          'Base de données ECHA (Agence européenne des produits chimiques)'
        ];
      default:
        return commonSources;
    }
  }
}
// EOF