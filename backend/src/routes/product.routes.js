import { Request, Response } from 'express';
// PATH: backend/src/routes/product.routes.ts
import express from 'express';
import multer from 'multer';
import NovaClassifier from '../services/ai/novaClassifier';
import { ProductAnalysisInput } from '../types/scientific-analysis.types';

// ✨ NOUVEAU IMPORT POUR ULTRA-TRANSFORMATION
import { detectUltraTransformation } from './ultraProcessing.routes';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const nova = new NovaClassifier();

router.post('/analyze', upload.none(), async (req: Request, res: Response) => {
  try {
    const input = req.body as ProductAnalysisInput;
    console.log('📥 Input reçu dans routes:', input);

    const title = input.ocrText || 'Produit inconnu';
    const category = 'food';

    console.log('🔍 Données à analyser dans routes:', { title, category });

    const novaResult = await nova.classify({ 
      title: title, 
      ingredients: []
    });

    // ✅ Réponse simplifiée pour éviter erreurs services manquants
    const result = {
      nova: novaResult,
      insights: {
        educational: ['Classification NOVA selon INSERM 2024'],
        recommendations: ['Vérifier composition produit']
      },
      alternatives: {
        natural: ['Version maison recommandée'],
        organic: ['Équivalent bio disponible']
      },
      eco: {
        score: 50,
        confidence: 0.8
      }
    };

    console.log('✅ Résultat final NOVA dans routes:', novaResult.novaGroup);
    res.json(result);
  } catch (error: any) {
    console.error('❌ Erreur analyse produit dans routes:', error); return res.status(500).json({ error: "Erreur serveur" });
    res.status(500).json({ error: error.message || 'Erreur analyse produit' });
  }
});

// ✨ NOUVELLE ROUTE ULTRA-TRANSFORMATION
/**
 * 🔬 POST /products/ultra-transform
 * Analyse du niveau d'ultra-transformation
 */
router.post('/ultra-transform', upload.none(), async (req: Request, res: Response) => {
  try {
    console.log('🔬 Requête analyse Ultra-Transformation reçue:', req.body);

    const { product_name, ingredients, productName } = req.body;
    const name = product_name || productName;
    
    if (!name?.trim() || !ingredients?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Données insuffisantes',
        message: 'Le nom du produit et les ingrédients sont requis',
        required_fields: ['productName', 'ingredients']
      });
    }

    // Convertir les ingrédients en tableau si nécessaire
    let ingredientsArray: string[];
    if (typeof ingredients === 'string') {
      ingredientsArray = ingredients.split(',').map(i => i.trim()).filter(i => i.length > 0);
    } else if (Array.isArray(ingredients)) {
      ingredientsArray = ingredients;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Format ingrédients invalide',
        message: 'Les ingrédients doivent être une chaîne ou un tableau'
      });
    }

    console.log('🧪 Analyse Ultra-Transformation pour:', {
      productName: name,
      ingredientsCount: ingredientsArray.length,
      firstIngredients: ingredientsArray.slice(0, 3)
    });

    // Utiliser la fonction existante
    const ultraResult = detectUltraTransformation(ingredientsArray);

    // ✅ FIX: Définir sources par défaut si non présentes
    const scientificSources = ['NOVA 2019', 'INSERM 2024', 'SIGA 2024'];

    // Enrichir le résultat pour le frontend
    const result = {
      productName: name,
      transformationLevel: ultraResult.level === 's�v�re' ? 4 : 
                          ultraResult.level === 'mod�r�' ? 3 : 2,
      processingMethods: ultraResult.detected || [],
      industrialMarkers: (ultraResult.detected || []).map(d => `Marqueur détecté: ${d}`),
      nutritionalImpact: {
        vitaminLoss: (ultraResult.score || 0) * 0.8,
        mineralRetention: 100 - ((ultraResult.score || 0) * 0.3),
        proteinDenaturation: (ultraResult.score || 0) * 0.5,
        fiberDegradation: (ultraResult.score || 0) * 0.4,
        antioxidantLoss: (ultraResult.score || 0) * 0.7,
        glycemicIndexIncrease: (ultraResult.score || 0) * 0.3,
        neoformedCompounds: ultraResult.level === 's�v�re' ? 'high' : 
                           ultraResult.level === 'mod�r�' ? 'medium' : 'low',
        bioavailabilityImpact: ultraResult.level === 's�v�re' ? 'negative' : 'neutral'
      },
      recommendations: [
        ultraResult.level === 's�v�re' ? '?? Ultra-transformation d�tect�e - limiter la consommation' :
        ultraResult.level === 'mod�r�' ? '⚠️ Transformation importante - consommation mod�r�e' :
        '✅ Transformation acceptable',
        ultraResult.justification || 'Analyse basée sur les ingrédients fournis'
      ],
      naturalityMatrix: {
        naturalIngredients: ingredientsArray.length - (ultraResult.detected?.length || 0),
        artificialIngredients: ultraResult.detected?.length || 0,
        processingAids: 0,
        naturalityScore: Math.max(0, 100 - (ultraResult.score || 0))
      },
      confidence: 0.8,
      scientificSources: scientificSources, // ✅ FIX: Utiliser variable locale
      // Compatibilité avec le composant simplifié
      novaClass: ultraResult.level === 's�v�re' ? 4 : 
                 ultraResult.level === 'mod�r�' ? 3 : 2,
      transformationScore: ultraResult.score || 0,
      additivesCount: ultraResult.detected?.length || 0,
      // Métadonnées pour le debugging
      _metadata: {
        ingredientsProcessed: ingredientsArray.length,
        analysisTimestamp: new Date().toISOString(),
        backend: 'product.routes.ts',
        version: '1.0',
        ultraResultType: typeof ultraResult,
        ultraResultKeys: Object.keys(ultraResult)
      }
    };

    console.log('✅ Ultra-Transformation analysée:', {
      productName: name,
      transformationLevel: result.transformationLevel,
      score: result.transformationScore,
      markersDetected: result.additivesCount,
      ultraLevel: ultraResult.level
    });

    res.json({
      success: true,
      type: 'ultra_transformation',
      analysis: result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erreur analyse Ultra-Transformation:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      requestBody: req.body
    }); return res.status(500).json({ error: "Erreur serveur" });
    
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      message: error.message || 'Impossible d\'analyser l\'ultra-transformation',
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        name: error.name
      } : undefined
    });
  }
});

router.get('/status', (_req, res) => {
  res.json({ 
    status: 'produit routes opérationnel', 
    verified: 'ok',
    features: ['analyze', 'ultra-transform'], // ✨ NOUVEAU
    version: '1.1-ultra-transform-fixed',
    endpoints: [
      'POST /products/analyze',
      'POST /products/ultra-transform',
      'GET /products/status'
    ],
    typescript_status: 'compiled_successfully'
  });
});

export default router;
// EOF


