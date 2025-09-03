// PATH: frontend/src/services/novaAdapter.ts
// AnalyzeResponse type moved inline
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
    productName: string = 'Produit analyse',
    processingTime: number = 1500
  ): NovaAdaptedResult {
    try {
      const { analysis, alternatives, insights, auto_detection } = response;

      // Extraction des additifs depuis les donnees existantes
      const additives = (analysis.additives || []).map(additive => ({
        code: additive,
        name: this.getAdditiveFullName(additive),
        category: this.getAdditiveCategory(additive),
        riskLevel: this.getAdditiveRiskLevel(additive)
      }));

      // Extraction des marqueurs d'ultra-transformation
      const ultraProcessedMarkers = this.extractUltraProcessedMarkers(analysis, additives);

      // Determination du type de recommandation
      const recommendation = this.generateRecommendation(
        analysis.score,
        analysis.nova_group || 4,
        alternatives
      );

      // Sources scientifiques basees sur le type detecte
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
        error: error instanceof Error ? error.message : 'Erreur lors de l\'adaptation des donnees'
      };
    }
  }

  private static getAdditiveFullName(code: string): string {
    const additiveMap: Record<string, string> = {
      'E100': 'Curcumine',
      'E101': 'Riboflavine',
      'E102': 'Tartrazine',
      'E104': 'Jaune de quinoleine',
      'E110': 'Jaune orange S',
      'E120': 'Cochenille',
      'E122': 'Azorubine',
      'E124': 'Ponceau 4R',
      'E129': 'Rouge allura AC',
      'E131': 'Bleu patente V',
      'E132': 'Indigotine',
      'E133': 'Bleu brillant FCF',
      'E140': 'Chlorophylles',
      'E141': 'Complexes cuivriques des chlorophylles',
      'E150a': 'Caramel I',
      'E150b': 'Caramel II',
      'E150c': 'Caramel III',
      'E150d': 'Caramel IV',
      'E151': 'Noir brillant BN',
      'E160a': 'Carotenes',
      'E160b': 'Rocou',
      'E160c': 'Extrait de paprika',
      'E161b': 'Luteine',
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
      'E306': 'Tocopherols',
      'E307': 'Alpha-tocopherol',
      'E308': 'Gamma-tocopherol',
      'E309': 'Delta-tocopherol',
      'E310': 'Gallate de propyle',
      'E311': 'Gallate d\'octyle',
      'E312': 'Gallate de dodecyle',
      'E320': 'Butylhydroxyanisol',
      'E321': 'Butylhydroxytoluene',
      'E322': 'Lecithines',
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
      'E405': 'Alginate de propylene glycol',
      'E406': 'Agar-agar',
      'E407': 'Carraghenanes',
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
      'E422': 'Glycerol',
      'E450': 'Diphosphates',
      'E451': 'Triphosphates',
      'E452': 'Polyphosphates',
      'E460': 'Cellulose',
      'E461': 'Methylcellulose',
      'E462': 'ƒÆ’†â€™aaâ€šÂ¬‚Â°thylcellulose',
      'E463': 'Hydroxypropylcellulose',
      'E464': 'Hydroxypropylmethylcellulose',
      'E465': 'ƒÆ’†â€™aaâ€šÂ¬‚Â°thylmethylcellulose',
      'E466': 'Carboxymethylcellulose',
      'E470a': 'Sels de sodium, de potassium et de calcium d\'acides gras',
      'E470b': 'Sels de magnesium d\'acides gras',
      'E471': 'Mono- et diglycerides d\'acides gras',
      'E472a': 'Esters acetiques des mono- et diglycerides d\'acides gras',
      'E472b': 'Esters lactiques des mono- et diglycerides d\'acides gras',
      'E472c': 'Esters citriques des mono- et diglycerides d\'acides gras',
      'E472d': 'Esters tartriques des mono- et diglycerides d\'acides gras',
      'E472e': 'Esters monoacetyltartriques et diacetyltartriques des mono- et diglycerides d\'acides gras',
      'E472f': 'Esters mixtes acetiques et tartriques des mono- et diglycerides d\'acides gras',
      'E473': 'Sucroesters d\'acides gras',
      'E474': 'Sucroglycerides',
      'E475': 'Esters polyglyceriques d\'acides gras',
      'E476': 'Polyricinoleate de polyglycerol',
      'E477': 'Esters de propylene glycol d\'acides gras',
      'E479b': 'Huile de soja oxydee thermiquement',
      'E481': 'Stearoyl-2-lactylate de sodium',
      'E482': 'Stearoyl-2-lactylate de calcium',
      'E483': 'Tartrate de stearyle',
      'E491': 'Monostearate de sorbitane',
      'E492': 'Tristearate de sorbitane',
      'E493': 'Monolaurate de sorbitane',
      'E494': 'Monooleate de sorbitane',
      'E495': 'Monopalmitate de sorbitane',
      'E500': 'Carbonates de sodium',
      'E501': 'Carbonates de potassium',
      'E503': 'Carbonates d\'ammonium',
      'E504': 'Carbonates de magnesium',
      'E507': 'Acide chlorhydrique',
      'E508': 'Chlorure de potassium',
      'E509': 'Chlorure de calcium',
      'E511': 'Chlorure de magnesium',
      'E512': 'Chlorure d\'etain',
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
      'E528': 'Hydroxyde de magnesium',
      'E529': 'Oxyde de calcium',
      'E530': 'Oxyde de magnesium',
      'E535': 'Ferrocyanure de sodium',
      'E536': 'Ferrocyanure de potassium',
      'E538': 'Ferrocyanure de calcium',
      'E541': 'Phosphate d\'aluminium sodique',
      'E551': 'Dioxyde de silicium',
      'E552': 'Silicate de calcium',
      'E553a': 'Silicate de magnesium',
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
      'E625': 'Glutamate de magnesium',
      'E626': 'Acide guanylique',
      'E627': 'Guanylate disodique',
      'E628': 'Guanylate dipotassique',
      'E629': 'Guanylate de calcium',
      'E630': 'Acide inosinique',
      'E631': 'Inosinate disodique',
      'E632': 'Inosinate dipotassique',
      'E633': 'Inosinate de calcium',
      'E634': '5\'-ribonucleotides calciques',
      'E635': '5\'-ribonucleotides disodiques',
      'E640': 'Glycine et son sel de sodium',
      'E641': 'L-leucine',
      'E650': 'Acetate de zinc',
      'E900': 'Dimethylpolysiloxane',
      'E901': 'Cire d\'abeille',
      'E902': 'Cire de Candelilla',
      'E903': 'Cire de carnauba',
      'E904': 'Gomme-laque',
      'E905': 'Paraffine',
      'E912': 'Esters de l\'acide montanique',
      'E914': 'Cire de polyethylene oxydee',
      'E920': 'L-cysteine',
      'E927b': 'Carbamide',
      'E938': 'Argon',
      'E939': 'Helium',
      'E940': 'Dichlorodifluoromethane',
      'E941': 'Azote',
      'E942': 'Protoxyde d\'azote',
      'E943a': 'Butane',
      'E943b': 'Isobutane',
      'E944': 'Propane',
      'E948': 'Oxygene',
      'E949': 'Hydrogene',
      'E950': 'Acesulfame potassium',
      'E951': 'Aspartame',
      'E952': 'Cyclamate',
      'E954': 'Saccharine',
      'E955': 'Sucralose',
      'E957': 'Thaumatine',
      'E959': 'Neohesperidine DC',
      'E960': 'Glycosides de steviol',
      'E961': 'Neotame',
      'E962': 'Sel d\'aspartame-acesulfame',
      'E965': 'Maltitol',
      'E966': 'Lactitol',
      'E967': 'Xylitol',
      'E968': 'ƒÆ’†â€™aaâ€šÂ¬‚Â°rythritol',
      'E999': 'Extrait de quillaia'
    };

    return additiveMap[code] || code;
  }

  private static getAdditiveCategory(code: string): string {
    if (code.startsWith('E1') || code.startsWith('E2')) return 'Colorant';
    if (code.startsWith('E2') || code.startsWith('E3')) return 'Conservateur';
    if (code.startsWith('E3')) return 'Antioxydant';
    if (code.startsWith('E4')) return 'Texturant';
    if (code.startsWith('E5')) return 'Regulateur d\'acidite';
    if (code.startsWith('E6')) return 'Exhausteur de goƒÆ’†â€™ƒâ€š‚Â»t';
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

    // Marqueurs bases sur les additifs detectes
    const highRiskAdditives = additives.filter(a => ?.riskLevel === 'high');
    if (highRiskAdditives.length > 0) {
      markers.push(`${highRiskAdditives.length} additif(s) ƒÆ’†â€™ƒâ€š‚Â  risque eleve`);
    }

    // Marqueurs bases sur le score NOVA
    if (analysis.nova_group === 4) {
      markers.push('Aliment ultra-transforme (NOVA 4)');
    }

    // Marqueurs bases sur le score global
    if (analysis.score < 30) {
      markers.push('Score nutritionnel tres faible');
    }

    // Marqueurs specifiques aux types de transformation
    if (analysis.breakdown) {
      if (analysis.breakdown.processing < 20) {
        markers.push('Haut niveau de transformation industrielle');
      }
      if (analysis.breakdown.health < 30) {
        markers.push('Impact sante preoccupant');
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
        message: 'Ce produit presente de nombreux marqueurs d\'ultra-transformation. Nous recommandons de le remplacer par des alternatives plus naturelles.',
        alternatives: altNames.length > 0 ? altNames : [
          'Produits biologiques equivalents',
          'Preparations maison',
          'Alternatives sans additifs'
        ]
      };
    }

    if (score < 60 || novaGroup === 3) {
      return {
        type: 'moderate',
        message: 'Ce produit peut etre consomme occasionnellement. Privilegiez une consommation moderee et equilibree.',
        alternatives: altNames.length > 0 ? altNames : undefined
      };
    }

    return {
      type: 'enjoy',
      message: 'Ce produit presente un profil nutritionnel acceptable. Vous pouvez en profiter dans le cadre d\'une alimentation equilibree.',
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
      case 'cosmetic': return 'Cosmetique';
      case 'detergent': return 'Produit menager';
      default: return 'Indetermine';
    }
  }

  private static getScientificSources(type: 'food' | 'cosmetic' | 'detergent'): string[] {
    const commonSources = [
      'Classification NOVA - INSERM 2024',
      'Reglement (CE) nƒÆ’aâ‚¬Å¡ƒâ€š‚Â° 1333/2008 sur les additifs alimentaires',
      'Base de donnees EFSA (Autorite europeenne de securite des aliments)'
    ];

    switch (type) {
      case 'food':
        return [
          ...commonSources,
          'Programme National Nutrition Sante (PNNS)',
          'ƒÆ’†â€™aaâ€šÂ¬‚Â°tude NutriNet-Sante - EREN',
          'Recommandations nutritionnelles ANSES 2024'
        ];
      case 'cosmetic':
        return [
          'Reglement (CE) nƒÆ’aâ‚¬Å¡ƒâ€š‚Â° 1223/2009 relatif aux produits cosmetiques',
          'Base de donnees CosIng (Commission europeenne)',
          'ƒÆ’†â€™aaâ€šÂ¬‚Â°valuations SCCS (Comite scientifique pour la securite des consommateurs)'
        ];
      case 'detergent':
        return [
          'Reglement (CE) nƒÆ’aâ‚¬Å¡ƒâ€š‚Â° 648/2004 relatif aux detergents',
          'Classification CLP (Classification, etiquetage et emballage)',
          'Base de donnees ECHA (Agence europeenne des produits chimiques)'
        ];
      default:
        return commonSources;
    }
  }
}
// EOF

