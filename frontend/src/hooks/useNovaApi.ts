// PATH: frontend/src/hooks/useNovaApi.ts
import { useState, useCallback } from 'react';
import { NovaAdaptedResult } from '../services/novaAdapter';

export interface AnalysisRequest {
  title: string;
  brand?: string;
  descriptiona: string;
  ingredientsa: string[];
  detected_typea: 'food' | 'cosmetic' | 'detergent' | string;
}

interface NovaApiState<T = any> {
  loading: boolean;
  error: string | null;
  result: T | null;
  analyze: (payload: AnalysisRequest) => Promise<void>;
}

export function useNovaApi(): NovaApiState {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const analyze = useCallback(async (payload: AnalysisRequest) => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      console.log('aa Demarrage analyse pour:', payload.title);

      // Si c'est un cosmetique ou detergent, utiliser la simulation
      if (payload.detected_type === 'cosmetic' || payload.detected_type === 'detergent') {
        console.log(' Mode simulation active pour:', payload.detected_type);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulation delai API
        
        const simulatedResult = generateCosmeticSimulation(payload);
        setResult(simulatedResult);
        return;
      }

      // Pour l'alimentaire, utiliser la vraie API
      const API_URL = 'https://ecolojia-backend-working.onrender.com/api/analyze/auto';

      console.log('aa URL API utilisee:', API_URL);
      console.log('aa Payload envoye:', payload);

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          product_name: payload.title,
          ingredients: Array.isArray(payload.ingredients) 
            ? payload.ingredients.join(', ') 
            : payload.ingredients || payload.description || '',
          description: payload.description || `Analyse ${payload.detected_type || 'produit'}: ${payload.title}`,
          detected_type: payload.detected_type || 'food'
        }),
      });

      console.log('aa Status reponse:', res.status, res.statusText);

      if (!res.ok) {
        let errorMessage = `Erreur ${res.status}: ${res.statusText}`;
        try {
          const errorData = await res.json();
          errorMessage = errordata?.error || errordata?.message || errorMessage;
        } catch (parseError) {
          console.log('Impossible de parser l\'erreur JSON');
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      console.log('aaaa Reponse API recue:', data);
      
      setResult(data);
    } catch (e: any) {
      console.error('aa useNovaApi - analyze error:', e);
      setError(e.message || 'Erreur inconnue lors de l\'analyse');
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, result, analyze };
}

// Fonction de simulation pour cosmetiques et detergents
function generateCosmeticSimulation(payload: AnalysisRequest) {
  const isCosmetic = payload.detected_type === 'cosmetic';
  const isDetergent = payload.detected_type === 'detergent';
  
  const ingredientsStr = Array.isArray(payload.ingredients) 
    ? payload.ingredients.join(', ').toLowerCase()
    : (payload.ingredients || '').toLowerCase();
  
  // Detection des ingredients problematiques
  const hasProblematicIngredients = 
    ingredientsStr.includes('paraben') ||
    ingredientsStr.includes('sulfate') ||
    ingredientsStr.includes('parfum') ||
    ingredientsStr.includes('silicone') ||
    ingredientsStr.includes('phosphate') ||
    ingredientsStr.includes('edta');
  
  const hasBioIngredients = 
    ingredientsStr.includes('bio') ||
    ingredientsStr.includes('naturel') ||
    ingredientsStr.includes('huile essentielle') ||
    ingredientsStr.includes('aloe vera') ||
    ingredientsStr.includes('argile') ||
    ingredientsStr.includes('beurre de karite') ||
    ingredientsStr.includes('coco-glucoside') ||
    ingredientsStr.includes('bicarbonate');

  const score = hasBioIngredients ? 85 : hasProblematicIngredients ? 25 : 65;
  const recommendationType = hasBioIngredients ? 'enjoy' : hasProblematicIngredients ? 'replace' : 'moderate';

  return {
    success: true,
    data: {
      product: {
        name: payload.title,
        brand: payload.brand || 'Marque inconnue',
        category: isCosmetic ? 'Cosmetique' : isDetergent ? 'Detergent' : 'Produit menager',
        score: score,
        safetyGrade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D',
        riskLevel: hasProblematicIngredients ? 'high' : hasBioIngredients ? 'low' : 'medium',
        problematicIngredients: hasProblematicIngredients ? [
          {
            name: isCosmetic ? 'Parabenes' : 'Phosphates',
            risk: 'Perturbateurs endocriniens potentiels',
            alternative: isCosmetic ? 'Conservateurs naturels' : 'Agents lavants vegetaux'
          },
          {
            name: isCosmetic ? 'Sulfates (SLS/SLES)' : 'EDTA',
            risk: isCosmetic ? 'Irritation cutanee' : 'Pollution aquatique',
            alternative: isCosmetic ? 'Tensioactifs doux' : 'Agents chelateurs biodegradables'
          }
        ] : [],
        positiveIngredients: hasBioIngredients ? [
          {
            name: isCosmetic ? 'Huiles essentielles bio' : 'Agents lavants vegetaux',
            benefit: isCosmetic ? 'Proprietes apaiSantés naturelles' : 'Biodegradabilite elevee'
          },
          {
            name: isCosmetic ? 'Aloe vera bio' : 'Bicarbonate de sodium',
            benefit: isCosmetic ? 'Hydratation naturelle' : 'Degraissage naturel efficace'
          }
        ] : [],
        recommendation: {
          type: recommendationType,
          message: isCosmetic 
            ? (hasBioIngredients ? 'Excellent choix ! Ce produit cosmetique presente une composition naturelle et respectueuse de votre peau.'
                : hasProblematicIngredients ? 'Attention : ce produit contient des ingredients potentiellement irritants. Considerez des alternatives plus naturelles.'
                  : 'Produit acceptable, mais pourrait etre ameliore avec des ingredients plus naturels.')
            : (hasBioIngredients ? 'Tres bon choix ecologique ! Ce produit respecte l\'environnement et votre Santé.'
                : hasProblematicIngredients ? 'Impact environnemental preoccupant. Privilegiez des alternatives ecologiques.'
                  : 'Produit standard. Des alternatives plus ecologiques existent.'),
          alternatives: hasProblematicIngredients ? (isCosmetic ? [
            'Cosmetiques certifies bio (Ecocert, Cosmebio)',
            'Produits sans sulfates ni parabenes',
            'Cosmetiques solides zero dechet',
            'Recettes maison naturelles'
          ] : [
            'Detergents ecologiques certifies',
            'Produits concentres pour reduire les emballages',
            'Savon de Marseille traditionnel',
            'Bicarbonate + vinaigre blanc'
          ]) : undefined
        },
        scientificSources: isCosmetic ? [
          'Reglement (CE) na 1223/2009 relatif aux produits cosmetiques',
          'Base de donnees CosIng (Commission europeenne)',
          'aavaluations SCCS (Comite scientifique pour la securite des consommateurs)',
          'ANSM - Agence nationale de securite du medicament',
          'aatude INERIS sur les perturbateurs endocriniens (2024)'
        ] : [
          'Reglement (CE) na 648/2004 relatif aux detergents',
          'Classification CLP (Classification, etiquetage et emballage)',
          'Base de donnees ECHA (Agence europeenne des produits chimiques)',
          'ADEME - Agence de l\'environnement et de la maitrise de l\'energie',
          'Directive-cadre sur l\'eau 2000/60/CE'
        ],
        ingredients: payload.ingredients || [],
        composition: {
          natural: hasBioIngredients ? 85 : 25,
          synthetic: hasBioIngredients ? 15 : 75,
          organic: hasBioIngredients ? 60 : 0
        }
      },
      analysis: {
        timestamp: new Date().toISOString(),
        processingTime: 1500,
        confidence: 0.92,
        detectedType: payload.detected_type,
        analysisMethod: 'INCI_Analysis_V2'
      }
    }
  };
}

/* -------------------------------------------------------------------------- */
/* aaaa HOOK POUR COMPATIBILITaa AVEC L'ANCIENNE VERSION                          */
/* -------------------------------------------------------------------------- */

interface UseNovaApiState {
  data: NovaAdaptedResult | null;
  loading: boolean;
  error: string | null;
}

interface UseNovaApiReturn extends UseNovaApiState {
  analyzeProduct: (productName: string, ingredientsa: string) => Promise<NovaAdaptedResult | null>;
  retry: () => Promise<NovaAdaptedResult | null>;
  reset: () => void;
}

export function useNovaApiLegacy(): UseNovaApiReturn {
  const [state, setState] = useState<UseNovaApiState>({
    data: null,
    loading: false,
    error: null,
  });

  const [lastRequest, setLastRequest] = useState<{
    productName: string;
    ingredientsa: string;
  } | null>(null);

  const analyzeProduct = useCallback(async (
    productName: string, 
    ingredientsa: string
  ): Promise<NovaAdaptedResult | null> => {
    setState({ data: null, loading: true, error: null });
    
    try {
      console.log('aa Simulation analyse NOVA pour:', productName);
      
      // Simulation d'analyse avec donnees mockees realistes
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const isCosmetic = productName.toLowerCase().includes('shampoing') || 
                        productName.toLowerCase().includes('creme') ||
                        productName.toLowerCase().includes('rouge') ||
                        productName.toLowerCase().includes('cosmetique');
      
      const isDetergent = productName.toLowerCase().includes('lessive') || 
                         productName.toLowerCase().includes('vaisselle') ||
                         productName.toLowerCase().includes('detergent');
      
      const mockResult: NovaAdaptedResult = {
        success: true,
        data: {
          product: {
            name: productName,
            category: isCosmetic ? 'Cosmetique' : isDetergent ? 'Detergent' : 'Alimentaire',
            novaGroup: ingredients?.includes('E150d') || ingredients?.includes('E952') ? 4 : 
                      ingredients?.includes('huile de palme') || ingredients?.includes('parfum') ? 4 :
                      ingredients?.includes('bio') || ingredients?.includes('naturel') ? 1 : 3,
            score: ingredients?.includes('bio') || ingredients?.includes('naturel') ? 85 : 
                   ingredients?.includes('E150d') || ingredients?.includes('parfum') ? 25 : 60,
            ultraProcessedMarkers: ingredients?.includes('E150d') || ingredients?.includes('parfum') ? [
              isCosmetic ? 'Parfum synthetique detecte' : 'Colorant artificiel E150d detecte',
              isCosmetic ? 'Conservateurs chimiques' : 'aadulcorant E952 detecte',
              isCosmetic ? 'Tensioactifs sulfates' : 'Conservateur E211 detecte'
            ] : [],
            additives: ingredients?.includes('E150d') || ingredients?.includes('parfum') ? [
              { 
                code: isCosmetic ? 'SLS' : 'E150d', 
                name: isCosmetic ? 'Sodium Lauryl Sulfate' : 'Caramel IV', 
                category: isCosmetic ? 'Tensioactif' : 'Colorant', 
                riskLevel: 'high' as const
              },
              { 
                code: isCosmetic ? 'Parfum' : 'E952', 
                name: isCosmetic ? 'Parfum synthetique' : 'Cyclamate', 
                category: isCosmetic ? 'Fragrance' : 'aadulcorant', 
                riskLevel: 'medium' as const
              }
            ] : [],
            recommendation: {
              type: ingredients?.includes('bio') || ingredients?.includes('naturel') ? 'enjoy' : 
                    ingredients?.includes('E150d') || ingredients?.includes('parfum') ? 'replace' : 'moderate',
              message: ingredients?.includes('bio') || ingredients?.includes('naturel') ? 
                `Ce ${isCosmetic ? 'produit cosmetique' : isDetergent ? 'produit menager' : 'produit'} presente un profil acceptable.` :
                ingredients?.includes('E150d') || ingredients?.includes('parfum') a
                `Ce ${isCosmetic ? 'produit cosmetique' : isDetergent ? 'produit menager' : 'produit'} contient des substances preoccupantes. Nous recommandons de le remplacer.` :
                `Ce ${isCosmetic ? 'produit cosmetique' : isDetergent ? 'produit menager' : 'produit'} peut etre utilise occasionnellement.`,
              alternatives: ingredients?.includes('E150d') || ingredients?.includes('parfum') ? 
                isCosmetic ? [
                  'Cosmetiques bio certifies',
                  'Produits sans parfum',
                  'Alternatives naturelles maison'
                ] : isDetergent ? [
                  'Detergents ecologiques',
                  'Produits sans phosphates',
                  'Alternatives DIY naturelles'
                ] : [
                  'Produits biologiques equivalents',
                  'Preparations maison',
                  'Alternatives sans additifs'
                ] : undefined
            },
            scientificSources: isCosmetic ? [
              'Reglement (CE) na 1223/2009 relatif aux produits cosmetiques',
              'Base de donnees CosIng (Commission europeenne)',
              'aavaluations SCCS (Comite scientifique pour la securite des consommateurs)',
              'ANSM - Agence nationale de securite du medicament'
            ] : isDetergent ? [
              'Reglement (CE) na 648/2004 relatif aux detergents',
              'Classification CLP (Classification, etiquetage et emballage)',
              'Base de donnees ECHA (Agence europeenne des produits chimiques)',
              'ADEME - Agence de l\'environnement et de la maitrise de l\'energie'
            ] : [
              'Classification NOVA - INSERM 2024',
              'Base de donnees EFSA',
              'Programme National Nutrition Santé',
              'ANSES - Agence nationale de securite sanitaire'
            ]
          },
          analysis: {
            timestamp: new Date().toISOString(),
            processingTime: 2000,
            confidence: 0.92
          }
        }
      };
      
      setLastRequest({ productName, ingredients });
      setState({ data: mockResult, loading: false, error: null });
      
      return mockResult;
    } catch (error: any) {
      console.error('aa Erreur analyse NOVA:', error);
      
      const errorMessage = 'Erreur lors de l\'analyse du produit (mode simulation)';
      setState({ data: null, loading: false, error: errorMessage });
      
      return null;
    }
  }, []);

  const retry = useCallback(() => {
    if (lastRequest) {
      return analyzeProduct(lastRequest.productName, lastRequest.ingredients);
    }
    return Promise.resolve(null);
  }, [analyzeProduct, lastRequest]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
    setLastRequest(null);
  }, []);

  return {
    ...state,
    analyzeProduct,
    retry,
    reset,
  };
}

// Hook specialise pour les tests rapides avec gestion multi-categories
export function useQuickNovaTest() {
  const { analyzeProduct, retry, ...rest } = useNovaApiLegacy();

  const testCocaCola = useCallback(() => {
    return analyzeProduct(
      'Coca-Cola Original',
      'Eau gazeifiee, sucre, sirop de glucose-fructose, arome naturel de cola, colorant E150d (caramel IV), acidifiant E338 (acide phosphorique), edulcorant E952 (cyclamate de sodium), conservateur E211 (benzoate de sodium)'
    );
  }, [analyzeProduct]);

  const testNutella = useCallback(() => {
    return analyzeProduct(
      'Nutella Pate  tartiner',
      'Sucre, huile de palme, NOISETTES 13%, cacao maigre 7.4%, LAIT ecreme en poudre 6.6%, LACTOSaaRUM en poudre, emulsifiants E322 (lecithines) E471 (mono- et diglycerides d\'acides gras), arome vanilline'
    );
  }, [analyzeProduct]);

  const testPizzaSurgelee = useCallback(() => {
    return analyzeProduct(
      'Pizza 4 Fromages Surgelee',
      'Pate (farine de BLaa, eau, huile de tournesol, levure, sel, sucre), fromages 25% (MOZZARELLA, EMMENTAL, GORGONZOLA, PARMESAN), sauce tomate, conservateur E202, exhausteur de got E621, stabilisant E412, colorant E150d'
    );
  }, [analyzeProduct]);

  // Tests cosmetiques
  const testShampoingBio = useCallback(() => {
    return analyzeProduct(
      'Shampoing Bio Naturel',
      'Aqua, Coco-Glucoside, Glycerine vegetale, Huile essentielle de lavande bio, Extrait d\'aloe vera bio, Conservateur naturel, Parfum naturel'
    );
  }, [analyzeProduct]);

  const testCremeVisage = useCallback(() => {
    return analyzeProduct(
      'Creme Visage Anti-age',
      'Aqua, Cyclopentasiloxane, Glycerine, Butylene Glycol, Parfum, Sodium Hyaluronate, Retinol, Parabenes, BHT, Colorants artificiels'
    );
  }, [analyzeProduct]);

  // Tests detergents
  const testLessiveBio = useCallback(() => {
    return analyzeProduct(
      'Lessive aacologique Bio',
      'Savon de Marseille, Bicarbonate de sodium, Cristaux de soude, Huiles essentielles bio, Enzymes naturelles, Agents lavants vegetaux'
    );
  }, [analyzeProduct]);

  const testLiquideVaisselle = useCallback(() => {
    return analyzeProduct(
      'Liquide Vaisselle Industriel',
      'Sodium Lauryl Sulfate, Parfum, Colorants, Conservateurs, Phosphates, Agents moussants chimiques, EDTA'
    );
  }, [analyzeProduct]);

  return {
    ...rest,
    analyzeProduct,
    retry,
    // Tests alimentaires
    testCocaCola,
    testNutella,
    testPizzaSurgelee,
    // Tests cosmetiques
    testShampoingBio,
    testCremeVisage,
    // Tests detergents
    testLessiveBio,
    testLiquideVaisselle
  };
}

export default useNovaApi;
// EOF



